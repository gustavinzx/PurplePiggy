import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { ProgressRing } from '../components/ProgressRing'
import { formatCurrency, formatDate } from '../lib/format'
import {
  GoalIconKey,
  GOAL_ICON_LIST,
  getGoalIconMeta,
  resolveGoalIconKey,
  calculateGoalCardMetrics,
} from '../lib/goals'
import {
  Plus,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Award,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import type { Database } from '../types/database.types'

type Goal = Database['public']['Tables']['financial_goals']['Row']
type GoalContribution = Database['public']['Tables']['goal_contributions']['Row']

export const GoalsPage: React.FC = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [contributions, setContributions] = useState<Record<string, GoalContribution[]>>({})
  const [loading, setLoading] = useState(true)

  // Modais e Sheets
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [completedGoalCelebration, setCompletedGoalCelebration] = useState<Goal | null>(null)

  // Form states - Criação
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newCategory, setNewCategory] = useState<'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'>('travel')
  const [selectedIconKey, setSelectedIconKey] = useState<GoalIconKey>('trip')

  // Form states - Edição
  const [editName, setEditName] = useState('')
  const [editTarget, setEditTarget] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editCategory, setEditCategory] = useState<'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'>('travel')
  const [editIconKey, setEditIconKey] = useState<GoalIconKey>('star')

  // Aportes e retiradas
  const [contribAmount, setContribAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: goalsData } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      setGoals(goalsData || [])

      if (goalsData && goalsData.length > 0) {
        const { data: contribData } = await supabase
          .from('goal_contributions')
          .select('*')
          .eq('user_id', user.id)
          .order('occurred_on', { ascending: false })

        const map: Record<string, GoalContribution[]> = {}
        contribData?.forEach((c) => {
          if (!map[c.goal_id]) map[c.goal_id] = []
          map[c.goal_id].push(c)
        })
        setContributions(map)
      }
    } finally {
      setLoading(false)
    }
  }

  // Preencher modal de edição quando uma meta é aberta
  const openEditModal = (goal: Goal) => {
    setEditName(goal.name)
    setEditTarget(String(goal.target_amount))
    setEditDeadline(goal.deadline || '')
    setEditCategory(goal.category)
    setEditIconKey(resolveGoalIconKey(goal.icon, goal.name))
    setIsEditModalOpen(true)
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const target = parseFloat(newTarget.replace(',', '.'))
    if (!target || target <= 0) {
      toast.error('Informe um valor desejado válido.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('financial_goals').insert({
        user_id: user.id,
        name: newName.trim(),
        category: newCategory,
        target_amount: target,
        saved_amount: 0,
        deadline: newDeadline || null,
        icon: selectedIconKey,
      })

      if (error) throw error

      toast.success('Meta criada com sucesso!')
      setIsCreateModalOpen(false)
      setNewName('')
      setNewTarget('')
      setNewDeadline('')
      setSelectedIconKey('trip')
      await loadGoals()
    } catch (err) {
      toast.error('Erro ao criar meta.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedGoal) return

    const target = parseFloat(editTarget.replace(',', '.'))
    if (!target || target <= 0) {
      toast.error('Informe um valor desejado válido.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('financial_goals')
        .update({
          name: editName.trim(),
          category: editCategory,
          target_amount: target,
          deadline: editDeadline || null,
          icon: editIconKey,
        })
        .eq('id', selectedGoal.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Meta atualizada com sucesso!')
      setIsEditModalOpen(false)
      setSelectedGoal((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              category: editCategory,
              target_amount: target,
              deadline: editDeadline || null,
              icon: editIconKey,
            }
          : null
      )
      await loadGoals()
    } catch (err) {
      toast.error('Erro ao atualizar meta.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContribution = async (kind: 'deposit' | 'withdrawal') => {
    if (!user || !selectedGoal) return

    const amt = parseFloat(contribAmount.replace(',', '.'))
    if (!amt || amt <= 0) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    if (kind === 'withdrawal' && amt > Number(selectedGoal.saved_amount)) {
      toast.error('O valor para retirada é maior que o saldo acumulado nesta meta.')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('goal_contributions').insert({
        user_id: user.id,
        goal_id: selectedGoal.id,
        kind,
        amount: amt,
        occurred_on: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      const newSaved =
        kind === 'deposit'
          ? Number(selectedGoal.saved_amount) + amt
          : Math.max(0, Number(selectedGoal.saved_amount) - amt)

      const isCompletedNow = kind === 'deposit' && newSaved >= Number(selectedGoal.target_amount)

      setIsDepositModalOpen(false)
      setIsWithdrawModalOpen(false)
      setContribAmount('')

      // Atualiza o selectedGoal localmente para refletir o saldo novo
      const updatedGoal = {
        ...selectedGoal,
        saved_amount: newSaved,
      }
      setSelectedGoal(updatedGoal)

      if (isCompletedNow) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
        setCompletedGoalCelebration(updatedGoal)
      } else {
        toast.success(kind === 'deposit' ? 'Aporte registrado com sucesso!' : 'Retirada registrada!')
      }

      await loadGoals()
    } catch (err) {
      toast.error('Erro ao registrar valor na meta.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!user || !selectedGoal) return
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('financial_goals')
        .delete()
        .eq('id', selectedGoal.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Meta excluída.')
      setIsDeleteConfirmOpen(false)
      setSelectedGoal(null)
      await loadGoals()
    } catch (err) {
      toast.error('Erro ao excluir meta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell showNav={true} className="py-5 flex flex-col gap-4 font-nunito pb-24">
      {/* 1. Cabeçalho V2: "Suas metas" + Subtítulo + Mascote Troféu à direita sem cobrir texto */}
      <div className="w-full flex items-center justify-between min-w-0 pt-1 pb-1 relative">
        <div className="min-w-0 flex-1 pr-3">
          <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight leading-tight">
            Suas metas
          </h1>
          <p className="text-[13px] font-semibold text-[#7D6A9C] font-nunito mt-0.5 leading-snug">
            Pequenos passos, grandes conquistas.
          </p>
        </div>
        <div className="w-[88px] h-[88px] shrink-0 flex items-center justify-center drop-shadow-sm pointer-events-none -my-2">
          <Mascot
            pose="trophy"
            size="md"
            priority
            alt="Mascote PurplePiggy erguendo troféu dourado"
          />
        </div>
      </div>

      {/* 2. Lista de Cards de Metas */}
      <div className="w-full flex flex-col gap-3 min-w-0">
        {loading ? (
          /* Esqueleto de carregamento com o mesmo formato dos cards */
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full bg-white/85 backdrop-blur-md rounded-[24px] p-4 border border-white/60 shadow-card flex items-center justify-between animate-pulse min-w-0"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                <div className="w-12 h-12 rounded-2xl bg-lilac/25 shrink-0" />
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <div className="w-28 h-4 bg-lilac/30 rounded-md" />
                  <div className="w-36 h-3 bg-lilac/20 rounded-md" />
                  <div className="w-full h-1.5 bg-lilac/15 rounded-full" />
                  <div className="w-20 h-2.5 bg-lilac/20 rounded-md" />
                </div>
              </div>
              <div className="w-[50px] h-[50px] rounded-full bg-lilac/20 shrink-0 ml-1" />
            </div>
          ))
        ) : goals.length > 0 ? (
          goals.map((g) => {
            const metrics = calculateGoalCardMetrics(g)
            const iconMeta = getGoalIconMeta(g.icon, g.name)

            return (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g)}
                className="w-full bg-white/85 backdrop-blur-md rounded-[24px] p-4 border border-white/60 shadow-card hover:border-[#7D2BD6]/30 cursor-pointer transition-all flex items-center justify-between min-w-0 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                  {/* Tile com a ilustração 3D da meta */}
                  <div
                    className={`w-12 h-12 rounded-2xl ${iconMeta.bg} flex items-center justify-center shrink-0 border border-lilac/15 shadow-xs`}
                  >
                    <img
                      src={iconMeta.src}
                      alt={g.name}
                      className="w-9 h-9 object-contain drop-shadow-xs"
                      loading="lazy"
                    />
                  </div>

                  {/* Textos, barra de progresso e falta */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <h3 className="text-[14px] font-extrabold text-[#432171] leading-tight truncate">
                      {g.name}
                    </h3>

                    <span className="text-[12px] font-bold text-[#7D6A9C] leading-tight mt-0.5 truncate">
                      {metrics.formattedSaved} de {metrics.formattedTarget}
                    </span>

                    {/* Barra de progresso horizontal */}
                    <div className="w-full h-1.5 rounded-full bg-[#F0E7FA] overflow-hidden mt-1.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#CF91F6] transition-all duration-500"
                        style={{ width: `${metrics.progressPct}%` }}
                      />
                    </div>

                    {/* Faltam R$ z (sem "Aporte sugerido") */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-[#7D6A9C] leading-none truncate">
                      <Calendar className="w-3 h-3 text-[#7D6A9C]/80 shrink-0" />
                      <span className="truncate">
                        {metrics.isCompleted
                          ? 'Meta concluída!'
                          : `Faltam ${metrics.formattedRemaining}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Anel de percentual à direita com traço dourado e trilho claro */}
                <div className="shrink-0 flex items-center justify-center ml-1">
                  <ProgressRing
                    progress={metrics.progressPct}
                    size={50}
                    strokeWidth={5}
                    variant="gold"
                    trackColor="#F0E7FA"
                  />
                </div>
              </div>
            )
          })
        ) : (
          /* Estado Vazio oficial: "Qual sonho vamos começar?" com mascote empty */
          <div className="w-full bg-white/85 backdrop-blur-md rounded-[24px] p-8 text-center border border-white/60 shadow-card flex flex-col items-center">
            <Mascot size="lg" pose="empty" floating={true} className="mb-3" />
            <h3 className="text-base font-extrabold text-[#432171] mb-1">
              Qual sonho vamos começar?
            </h3>
            <p className="text-xs font-semibold text-[#7D6A9C] max-w-xs mb-4">
              Crie sua primeira meta para acompanhar cada passo rumo aos seus objetivos.
            </p>
          </div>
        )}
      </div>

      {/* 3. Botão "+ Criar nova meta" fixo sticky acima da Bottom Navigation */}
      <div className="sticky bottom-[calc(var(--nav-h,64px)+12px)] z-30 pt-2 pb-1">
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full h-12 px-5 rounded-full bg-gradient-to-r from-[#7D2BD6] via-[#8E2DE2] to-[#B037F8] hover:opacity-95 active:scale-98 text-white font-nunito font-extrabold text-[15px] shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 text-white" strokeWidth={3} />
          <span>Criar nova meta</span>
        </button>
      </div>

      {/* 4. Sheet / Modal: Detalhes da Meta Selecionada */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-lilac/20">
            {/* Header do Sheet */}
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {(() => {
                  const meta = getGoalIconMeta(selectedGoal.icon, selectedGoal.name)
                  return (
                    <div
                      className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 border border-lilac/15`}
                    >
                      <img src={meta.src} alt="" className="w-7 h-7 object-contain" />
                    </div>
                  )
                })()}
                <h2 className="text-base font-extrabold text-[#432171] truncate">
                  {selectedGoal.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGoal(null)}
                className="p-1 rounded-full text-[#7D6A9C] hover:text-[#432171] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações detalhadas */}
            {(() => {
              const metrics = calculateGoalCardMetrics(selectedGoal)
              const goalContribs = contributions[selectedGoal.id] || []

              return (
                <div className="flex flex-col gap-3.5 my-4">
                  <div className="grid grid-cols-2 gap-2 bg-[#F8F5FC] p-3 rounded-2xl border border-lilac/15">
                    <div>
                      <span className="text-[11px] font-semibold text-[#7D6A9C] block">
                        Acumulado
                      </span>
                      <span className="text-base font-extrabold text-[#432171]">
                        {metrics.formattedSaved}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#7D6A9C] block">
                        Alvo final
                      </span>
                      <span className="text-base font-extrabold text-[#432171]">
                        {metrics.formattedTarget}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs px-1">
                    <span className="text-[#7D6A9C] font-semibold">Faltam para o objetivo:</span>
                    <span className="font-extrabold text-[#7D2BD6]">
                      {metrics.isCompleted ? 'Meta concluída!' : metrics.formattedRemaining}
                    </span>
                  </div>

                  {selectedGoal.deadline && (
                    <div className="flex justify-between items-center text-xs px-1">
                      <span className="text-[#7D6A9C] font-semibold">Prazo estimado:</span>
                      <span className="font-bold text-[#432171]">
                        {formatDate(selectedGoal.deadline)}
                      </span>
                    </div>
                  )}

                  {/* Card comemorativo se concluída */}
                  {metrics.isCompleted && (
                    <div className="bg-[#FEF3C7] p-3 rounded-2xl border border-[#F5B83D]/40 text-xs font-extrabold text-[#432171] text-center flex flex-col items-center gap-1.5">
                      <Mascot size="sm" pose="trophy" floating={true} />
                      <span>Meta 100% batida! Orgulho da sua jornada!</span>
                    </div>
                  )}

                  {/* Ações principais: Guardar / Retirar */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsDepositModalOpen(true)}
                      className="py-3 px-3 bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 active:scale-98 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Adicionar dinheiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="py-3 px-3 bg-[#F8F5FC] border border-lilac/30 text-[#432171] rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-lilac/10 active:scale-98 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Retirar dinheiro
                    </button>
                  </div>

                  {/* Histórico recente de aportes */}
                  {goalContribs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-lilac/15">
                      <span className="text-[11px] font-bold text-[#7D6A9C] block mb-2">
                        Histórico recente
                      </span>
                      <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                        {goalContribs.slice(0, 5).map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#F8F5FC]"
                          >
                            <span className="text-[#7D6A9C] font-semibold">
                              {formatDate(c.occurred_on)}
                            </span>
                            <span
                              className={`font-extrabold ${
                                c.kind === 'deposit' ? 'text-[#15803D]' : 'text-[#E5487A]'
                              }`}
                            >
                              {c.kind === 'deposit' ? '+' : '-'} {formatCurrency(c.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opções secundárias: Editar e Excluir */}
                  <div className="flex items-center justify-between pt-2 border-t border-lilac/15">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedGoal)}
                      className="text-xs font-bold text-[#7D2BD6] hover:underline inline-flex items-center gap-1 py-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Editar meta
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="text-xs font-bold text-[#E5487A] hover:underline inline-flex items-center gap-1 py-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir meta
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* 5. Modal: Aporte de Dinheiro com feedback do Mascote */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 text-center">
            <Mascot size="md" pose="deposit" floating={true} className="mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-[#432171] mb-1">
              Guardar dinheiro na meta
            </h3>
            <p className="text-xs font-semibold text-[#7D6A9C] mb-4">
              Cada quantia é um passo em direção ao seu objetivo.
            </p>

            <div className="relative flex items-center mb-4">
              <span className="absolute left-3.5 text-[#7D2BD6] font-extrabold">R$</span>
              <input
                type="text"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="50,00"
                className="w-full h-12 pl-11 pr-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-extrabold text-lg focus:outline-none focus:border-[#7D2BD6]"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="md"
                className="flex-1"
                loading={submitting}
                onClick={() => handleContribution('deposit')}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal: Retirada de Dinheiro */}
      {isWithdrawModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <h3 className="text-base font-extrabold text-[#432171] mb-1">
              Retirar dinheiro da meta
            </h3>
            <p className="text-xs font-semibold text-[#7D6A9C] mb-4">
              Saldo acumulado: {formatCurrency(selectedGoal.saved_amount)}
            </p>

            <div className="relative flex items-center mb-4">
              <span className="absolute left-3.5 text-[#E5487A] font-extrabold">R$</span>
              <input
                type="text"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="50,00"
                className="w-full h-12 pl-11 pr-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-extrabold text-lg focus:outline-none focus:border-[#7D2BD6]"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsWithdrawModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="md"
                className="flex-1"
                loading={submitting}
                onClick={() => handleContribution('withdrawal')}
              >
                Retirar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Confirmação de Exclusão da Meta */}
      {isDeleteConfirmOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl border border-lilac/20">
            <div className="w-12 h-12 rounded-full bg-[#FCE7F3] text-[#E5487A] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#432171] mb-1">
              Excluir a meta "{selectedGoal.name}"?
            </h3>
            <p className="text-xs font-semibold text-[#7D6A9C] mb-5">
              Esta meta e o histórico de aportes serão excluídos permanentemente.
            </p>
            <div className="flex gap-2.5">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="md"
                className="flex-1"
                loading={submitting}
                onClick={handleDeleteGoal}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Criar Nova Meta com Escolha Visual de Ícones 3D */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <h2 className="text-base font-extrabold text-[#432171]">
                Criar nova meta
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-[#7D6A9C] hover:text-[#432171] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">Nome da meta</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Viagem dos sonhos, Novo notebook..."
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                  required
                />
              </div>

              {/* Seletor Visual dos 8 Ícones 3D */}
              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1.5">
                  Escolha o ícone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_ICON_LIST.map((opt) => {
                    const isSelected = selectedIconKey === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setSelectedIconKey(opt.key)
                          if (opt.key === 'trip') setNewCategory('travel')
                          else if (opt.key === 'laptop' || opt.key === 'car') setNewCategory('purchase')
                          else if (opt.key === 'gym') setNewCategory('personal')
                          else if (opt.key === 'study') setNewCategory('course')
                          else if (opt.key === 'bau') setNewCategory('emergency')
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7D2BD6] bg-[#7D2BD6]/10 ring-2 ring-[#7D2BD6]/30 shadow-xs'
                            : 'border-lilac/20 bg-white/70 hover:bg-lilac/10'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl ${opt.bg} flex items-center justify-center mb-1`}
                        >
                          <img src={opt.src} alt={opt.label} className="w-7 h-7 object-contain" />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#432171] leading-none text-center">
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">Valor desejado (R$)</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="5000,00"
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">
                  Prazo desejado (opcional)
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" fullWidth loading={submitting}>
                  Criar meta
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Modal: Editar Meta */}
      {isEditModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-[#432171]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <h2 className="text-base font-extrabold text-[#432171]">
                Editar meta
              </h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-[#7D6A9C] hover:text-[#432171] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditGoal} className="flex flex-col gap-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">Nome da meta</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                  required
                />
              </div>

              {/* Seletor Visual dos 8 Ícones 3D */}
              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1.5">
                  Ícone da meta
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_ICON_LIST.map((opt) => {
                    const isSelected = editIconKey === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setEditIconKey(opt.key)
                          if (opt.key === 'trip') setEditCategory('travel')
                          else if (opt.key === 'laptop' || opt.key === 'car') setEditCategory('purchase')
                          else if (opt.key === 'gym') setEditCategory('personal')
                          else if (opt.key === 'study') setEditCategory('course')
                          else if (opt.key === 'bau') setEditCategory('emergency')
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#7D2BD6] bg-[#7D2BD6]/10 ring-2 ring-[#7D2BD6]/30 shadow-xs'
                            : 'border-lilac/20 bg-white/70 hover:bg-lilac/10'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl ${opt.bg} flex items-center justify-center mb-1`}
                        >
                          <img src={opt.src} alt={opt.label} className="w-7 h-7 object-contain" />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#432171] leading-none text-center">
                          {opt.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">
                  Valor desejado (R$)
                </label>
                <input
                  type="text"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">
                  Prazo desejado (opcional)
                </label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-[#7D2BD6]"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" fullWidth loading={submitting}>
                  Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Modal Comemorativo: Conquista de 100% da Meta */}
      {completedGoalCelebration && (
        <div className="fixed inset-0 z-50 bg-[#432171]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm text-center shadow-2xl border border-[#F5B83D]/40">
            <Mascot size="lg" pose="trophy" floating={true} className="mx-auto mb-3" />
            <h3 className="text-xl font-extrabold text-[#432171] mb-1">
              Parabéns!
            </h3>
            <p className="text-sm font-bold text-[#7D2BD6] mb-2">
              Você conquistou 100% da meta "{completedGoalCelebration.name}"!
            </p>
            <p className="text-xs font-semibold text-[#7D6A9C] mb-5">
              Cada centavo guardado valeu a pena. Mais uma grande vitória rumo à sua tranquilidade!
            </p>
            <Button
              size="md"
              fullWidth
              onClick={() => setCompletedGoalCelebration(null)}
            >
              Comemorar!
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
export default GoalsPage
