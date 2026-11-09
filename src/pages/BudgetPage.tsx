import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { CategoryCircle } from '../components/CategoryIcon'
import { getBudgetAlertStatus, suggestCategoryLimits } from '../lib/finance'
import { formatCurrency } from '../lib/format'
import {
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type Category = Database['public']['Tables']['categories']['Row']

export const BudgetPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [totalBudgetLimit, setTotalBudgetLimit] = useState<number>(3000)
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({})
  const [totalSpent, setTotalSpent] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // Modais
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false)
  const [suggestedLimits, setSuggestedLimits] = useState<Record<string, number>>({})
  const [suggestedTotal, setSuggestedTotal] = useState<number>(0)
  const [exceedsIncome, setExceedsIncome] = useState(false)
  const [savingAdjust, setSavingAdjust] = useState(false)

  // Estado editável para o modal de ajuste
  const [editTotal, setEditTotal] = useState<number>(3000)
  const [editCategoryLimits, setEditCategoryLimits] = useState<Record<string, number>>({})

  const curMonth = new Date().toISOString().slice(0, 7) + '-01'

  useEffect(() => {
    if (user) {
      loadBudgetData()
    }
  }, [user])

  const loadBudgetData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Categorias
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (cats) setCategories(cats)

      // 2. Orçamentos do mês atual
      const { data: bList } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', curMonth)

      const bMap: Record<string, number> = {}
      let total = 3000

      bList?.forEach((b) => {
        if (b.category_id === null) {
          total = Number(b.limit_amount)
        } else {
          bMap[b.category_id] = Number(b.limit_amount)
        }
      })

      setTotalBudgetLimit(total)
      setBudgets(bMap)
      setEditTotal(total)
      setEditCategoryLimits(bMap)

      // 3. Gastos do mês atual
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .is('archived_at', null)
        .gte('occurred_on', curMonth)

      const spentMap: Record<string, number> = {}
      let sumSpent = 0

      txs?.forEach((t) => {
        if (t.ignore_in_reports || t.archived_at) return
        const amt = Number(t.amount)
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + amt
        sumSpent += amt
      })

      setSpentByCategory(spentMap)
      setTotalSpent(sumSpent)
    } finally {
      setLoading(false)
    }
  }

  // Abertura do modal de sugestão de limites inteligentes (Regra 8.4)
  const handleOpenSuggest = async () => {
    if (!user) return

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const startDate = threeMonthsAgo.toISOString().split('T')[0]

    const { data: historyTxs } = await supabase
      .from('transactions')
      .select('category_id, amount, occurred_on, ignore_in_reports, archived_at')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .is('archived_at', null)
      .gte('occurred_on', startDate)

    const cleanHistoryTxs = (historyTxs || []).filter((t) => !t.ignore_in_reports && !t.archived_at)

    if (cleanHistoryTxs.length === 0) {
      toast.info('Registre mais alguns gastos para sugerirmos limites baseados na sua realidade!')
      return
    }

    const formattedHistory = cleanHistoryTxs.map((t) => ({
      categoryId: t.category_id,
      amount: Number(t.amount),
      month: t.occurred_on.slice(0, 7),
    }))

    const suggestion = suggestCategoryLimits(formattedHistory, totalBudgetLimit)
    setSuggestedLimits(suggestion.limits)
    setSuggestedTotal(suggestion.totalSuggested)
    setExceedsIncome(suggestion.exceedsIncome)
    setIsSuggestModalOpen(true)
  }

  const applySuggestions = async () => {
    if (!user) return
    setSavingAdjust(true)
    try {
      for (const [catId, limit] of Object.entries(suggestedLimits)) {
        const { error } = await supabase.from('budgets').upsert(
          {
            user_id: user.id,
            category_id: catId,
            month: curMonth,
            limit_amount: limit,
          },
          { onConflict: 'user_id,month,category_id' }
        )
        if (error) throw error
      }
      toast.success('Limites sugeridos aplicados com sucesso!')
      setIsSuggestModalOpen(false)
      loadBudgetData()
    } catch (err) {
      toast.error('Erro ao salvar sugestões.')
    } finally {
      setSavingAdjust(false)
    }
  }

  const saveManualAdjustments = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSavingAdjust(true)
    try {
      // Salvar orçamento total
      const { error: errTotal } = await supabase.from('budgets').upsert(
        {
          user_id: user.id,
          category_id: null,
          month: curMonth,
          limit_amount: editTotal,
        },
        { onConflict: 'user_id,month,category_id' }
      )
      if (errTotal) throw errTotal

      // Salvar limites por categoria
      for (const [catId, limit] of Object.entries(editCategoryLimits)) {
        const { error: errCat } = await supabase.from('budgets').upsert(
          {
            user_id: user.id,
            category_id: catId,
            month: curMonth,
            limit_amount: limit,
          },
          { onConflict: 'user_id,month,category_id' }
        )
        if (errCat) throw errCat
      }

      toast.success('Orçamento atualizado com sucesso!')
      setIsAdjustModalOpen(false)
      loadBudgetData()
    } catch (err) {
      toast.error('Erro ao atualizar orçamento.')
    } finally {
      setSavingAdjust(false)
    }
  }

  const overallAlert = getBudgetAlertStatus(totalSpent, totalBudgetLimit)
  const remainingTotal = Math.max(0, totalBudgetLimit - totalSpent)

  return (
    <AppShell showNav={true} className="py-6 flex flex-col gap-4 pb-24">
      {/* Título com botão voltar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/inicio'))}
            aria-label="Voltar"
            className="w-9 h-9 rounded-full bg-white shadow-card border border-lilac/20 flex items-center justify-center text-[#432171] hover:bg-[#F8F5FC] active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5 text-[#432171]" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-deep font-sans leading-tight truncate">
              Seu orçamento
            </h1>
            <p className="text-xs font-semibold text-textSec truncate">
              Planeje seus limites com tranquilidade.
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenSuggest}
          className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 py-1.5 px-3 rounded-full flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          <span>Sugerir limites</span>
        </button>
      </div>

      {/* Card Principal: Orçamento Mensal */}
      <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card">
        <span className="text-xs font-bold text-textSec">Orçamento mensal</span>
        <div className="text-2xl font-extrabold text-deep font-sans mt-0.5 mb-1">
          {formatCurrency(totalBudgetLimit)}
        </div>

        <div className="flex items-center justify-between text-xs font-bold mb-3">
          <span className="text-textSec">
            <strong className="text-success">{formatCurrency(remainingTotal)}</strong> disponíveis
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] ${
              overallAlert.status === 'danger'
                ? 'bg-danger/15 text-danger'
                : overallAlert.status === 'warning'
                ? 'bg-gold/30 text-amber-800'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {overallAlert.percent}%
          </span>
        </div>

        {/* Barra de progresso geral */}
        <div className="w-full h-3 bg-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              overallAlert.status === 'danger'
                ? 'bg-danger'
                : overallAlert.status === 'warning'
                ? 'bg-gold'
                : 'bg-gradient-to-r from-primary to-lilac'
            }`}
            style={{ width: `${Math.min(100, overallAlert.percent)}%` }}
          />
        </div>
      </div>

      {/* Lista de Categorias com Limites e Progresso */}
      <div className="w-full bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between pb-2 border-b border-lilac/10">
          <span className="text-xs font-bold text-textSec">Limites por categoria</span>
          <span className="text-[11px] font-bold text-textSec/70">Mês corrente</span>
        </div>

        <div className="w-full flex flex-col gap-4 min-w-0">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="w-full flex flex-col gap-2 animate-pulse min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-lilac/30 shrink-0" />
                    <div className="space-y-1">
                      <div className="w-20 h-3 bg-lilac/30 rounded" />
                      <div className="w-28 h-2 bg-lilac/20 rounded" />
                    </div>
                  </div>
                  <div className="w-8 h-3 bg-lilac/30 rounded" />
                </div>
                <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-lilac/20 rounded-full" />
                </div>
              </div>
            ))
          ) : categories.length === 0 ? (
            <div className="py-8 text-center text-xs font-bold text-textSec flex flex-col items-center">
              <Mascot size="lg" pose="empty" floating={true} className="mb-2" />
              <span>Nenhuma categoria de orçamento cadastrada.</span>
            </div>
          ) : (
            categories.map((cat) => {
              const spent = spentByCategory[cat.id] || 0
              const limit = budgets[cat.id] || 0
              const alert = getBudgetAlertStatus(spent, limit)

              return (
                <div key={cat.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CategoryCircle name={cat.slug || cat.icon || cat.name} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-deep leading-tight">
                          {cat.name}
                        </div>
                        <div className="text-[10px] font-semibold text-textSec">
                          {formatCurrency(spent)} / {limit > 0 ? formatCurrency(limit) : 'Sem limite'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-extrabold ${
                        alert.status === 'danger'
                          ? 'text-danger'
                          : alert.status === 'warning'
                          ? 'text-amber-600'
                          : 'text-primary'
                      }`}
                    >
                      {limit > 0 ? `${alert.percent}%` : '-'}
                    </span>
                  </div>

                  {/* Barra de progresso da categoria */}
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        alert.status === 'danger'
                          ? 'bg-danger'
                          : alert.status === 'warning'
                          ? 'bg-gold'
                          : 'bg-primary'
                      }`}
                      style={{
                        width: limit > 0 ? `${Math.min(100, alert.percent)}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Botão "+ Ajustar orçamento" do layout oficial */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAdjustModalOpen(true)}
        >
          Ajustar orçamento
        </Button>
      </div>

      {/* Modal: Ajustar Orçamento */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <h2 className="text-base font-extrabold text-deep font-sans">
                Ajustar limites de orçamento
              </h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveManualAdjustments} className="flex flex-col gap-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-textSec mb-1">
                  Orçamento mensal total (R$)
                </label>
                <input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(Math.max(0, Number(e.target.value)))}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-base focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="text-xs font-bold text-deep/80 pt-2 border-t border-lilac/10">
                Limites por categoria (R$)
              </div>

              <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-deep truncate flex-1">
                      {cat.name}
                    </span>
                    <input
                      type="number"
                      value={editCategoryLimits[cat.id] ?? budgets[cat.id] ?? 0}
                      onChange={(e) =>
                        setEditCategoryLimits({
                          ...editCategoryLimits,
                          [cat.id]: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-24 h-9 px-2.5 bg-bg border border-lilac/30 rounded-xl text-deep font-bold text-xs text-right focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" fullWidth loading={savingAdjust}>
                  Salvar ajustes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sugestão Inteligente (Regra 8.4) */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col border border-lilac/20 text-center">
            <Mascot size="md" pose="idea" floating={true} className="mx-auto mb-2" />
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <h3 className="text-base font-extrabold text-deep font-sans">
                Sugestão baseada nos seus dados
              </h3>
            </div>

            <p className="text-xs font-semibold text-textSec mb-4">
              Calculamos a média dos seus últimos meses + margem acolhedora de 10%, arredondada para proteger sua tranquilidade.
            </p>

            <div className="bg-bg rounded-2xl p-3.5 flex flex-col gap-2 max-h-48 overflow-y-auto mb-4 border border-lilac/15">
              {Object.entries(suggestedLimits).map(([catId, val]) => {
                const cat = categories.find((c) => c.id === catId)
                return (
                  <div key={catId} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-deep">{cat?.name}:</span>
                    <span className="font-extrabold text-primary">{formatCurrency(val)}</span>
                  </div>
                )
              })}
              <div className="border-t border-lilac/15 pt-2 flex justify-between items-center text-xs font-extrabold">
                <span className="text-deep">Total sugerido:</span>
                <span className="text-deep">{formatCurrency(suggestedTotal)}</span>
              </div>
            </div>

            {exceedsIncome && (
              <div className="bg-gold/20 border border-gold/40 rounded-xl p-2.5 mb-4 text-[11px] text-deep font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>O total sugerido supera sua renda declarada. Ajuste com carinho se preferir!</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsSuggestModalOpen(false)}
              >
                Voltar
              </Button>
              <Button
                size="md"
                className="flex-1"
                loading={savingAdjust}
                onClick={applySuggestions}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
