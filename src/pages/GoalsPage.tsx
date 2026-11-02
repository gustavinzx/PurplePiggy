import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { ProgressRing } from '../components/ProgressRing'
import { calculateGoalMetrics } from '../lib/finance'
import { formatCurrency, formatDate } from '../lib/format'
import {
  Plus,
  Star,
  Calendar,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Award,
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

  // Modais
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Form states
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState<'emergency' | 'travel' | 'purchase' | 'debt' | 'course' | 'personal'>('travel')
  const [newTarget, setNewTarget] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
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
        icon: 'Star',
      })

      if (error) throw error

      toast.success('Meta criada com sucesso! 🎯')
      setIsCreateModalOpen(false)
      setNewName('')
      setNewTarget('')
      setNewDeadline('')
      loadGoals()
    } catch (err) {
      toast.error('Erro ao criar meta.')
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

      const isCompletedNow =
        kind === 'deposit' && Number(selectedGoal.saved_amount) + amt >= Number(selectedGoal.target_amount)

      if (isCompletedNow) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
        toast.success('Parabéns! Você conquistou 100% da sua meta! 🏆💜')
      } else {
        toast.success(kind === 'deposit' ? 'Aporte registrado! ✓' : 'Retirada registrada! ✓')
      }

      setIsDepositModalOpen(false)
      setIsWithdrawModalOpen(false)
      setContribAmount('')
      setSelectedGoal(null)
      loadGoals()
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
      loadGoals()
    } catch (err) {
      toast.error('Erro ao excluir meta.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col gap-4">
      {/* Título da tela */}
      <div>
        <h1 className="text-xl font-extrabold text-deep font-sans mb-1">
          Suas metas
        </h1>
        <p className="text-xs font-semibold text-textSec">
          Pequenos passos, grandes conquistas.
        </p>
      </div>

      {/* Lista de Metas (fiel ao layout oficial) */}
      <div className="flex flex-col gap-3.5">
        {goals.map((g) => {
          const goalContribs = contributions[g.id] || []
          const metrics = calculateGoalMetrics(g, goalContribs)

          return (
            <div
              key={g.id}
              onClick={() => setSelectedGoal(g)}
              className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex flex-col gap-1 pr-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-deep">
                  <Star className="w-4 h-4 text-gold fill-gold" />
                  <span>{g.name}</span>
                </div>

                <div className="text-sm font-extrabold text-deep">
                  {formatCurrency(metrics.saved)}{' '}
                  <span className="text-xs font-semibold text-textSec">
                    de {formatCurrency(metrics.target)}
                  </span>
                </div>

                {metrics.monthlyRequired && metrics.monthlyRequired > 0 && !metrics.isCompleted && (
                  <div className="text-[10px] font-bold text-primary mt-1">
                    Aporte sugerido: {formatCurrency(metrics.monthlyRequired)}/mês
                  </div>
                )}
              </div>

              {/* Anel de progresso SVG do layout oficial */}
              <div className="shrink-0">
                <ProgressRing progress={metrics.progressPct} size={64} strokeWidth={6} />
              </div>
            </div>
          )
        })}

        {goals.length === 0 && !loading && (
          <div className="bg-white rounded-[22px] p-8 text-center border border-lilac/15 shadow-card">
            <p className="text-xs font-bold text-textSec mb-3">
              Você ainda não tem metas cadastradas. Que tal criar a primeira agora?
            </p>
          </div>
        )}
      </div>

      {/* Botão "+ Criar nova meta" */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Criar nova meta
        </Button>
      </div>

      {/* Modal: Detalhes e Ações da Meta Selecionada */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-lilac/15">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <h2 className="text-base font-extrabold text-deep font-sans flex items-center gap-2">
                <Star className="w-4 h-4 text-gold fill-gold" />
                {selectedGoal.name}
              </h2>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações da meta */}
            {(() => {
              const goalContribs = contributions[selectedGoal.id] || []
              const metrics = calculateGoalMetrics(selectedGoal, goalContribs)
              return (
                <div className="flex flex-col gap-3 my-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-textSec font-semibold">Acumulado:</span>
                    <span className="text-base font-extrabold text-deep">
                      {formatCurrency(metrics.saved)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-textSec font-semibold">Alvo final:</span>
                    <span className="font-extrabold text-deep">
                      {formatCurrency(metrics.target)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-textSec font-semibold">Faltam:</span>
                    <span className="font-extrabold text-primary">
                      {formatCurrency(metrics.remaining)}
                    </span>
                  </div>

                  {selectedGoal.deadline && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-textSec font-semibold">Prazo desejado:</span>
                      <span className="font-bold text-deep">
                        {formatDate(selectedGoal.deadline)}
                      </span>
                    </div>
                  )}

                  {metrics.estimatedCompletionDate && !metrics.isCompleted && (
                    <div className="bg-baby/50 p-2.5 rounded-xl border border-blue-100 text-[11px] font-semibold text-deep">
                      📅 Com base na média dos seus aportes, previsão de conclusão em:{' '}
                      <strong>{formatDate(metrics.estimatedCompletionDate)}</strong>
                    </div>
                  )}

                  {metrics.isCompleted && (
                    <div className="bg-gold/20 p-3 rounded-xl border border-gold/40 text-xs font-extrabold text-deep text-center">
                      🏆 Meta 100% concluída! Orgulho da sua jornada!
                    </div>
                  )}

                  {/* Ações de depósito / retirada */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setIsDepositModalOpen(true)}
                      className="py-2.5 px-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm hover:brightness-105"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Adicionar dinheiro
                    </button>
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="py-2.5 px-3 bg-bg border border-lilac/30 text-deep rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-lilac/10"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      Retirar dinheiro
                    </button>
                  </div>

                  {/* Excluir meta */}
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(true)}
                      className="text-xs font-bold text-danger hover:underline inline-flex items-center gap-1 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir esta meta
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Modal: Aporte de Dinheiro */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <h3 className="text-base font-extrabold text-deep font-sans mb-1">
              Guardar dinheiro na meta
            </h3>
            <p className="text-xs font-semibold text-textSec mb-4">
              Cada quantia é um passo em direção ao seu objetivo.
            </p>

            <div className="relative flex items-center mb-4">
              <span className="absolute left-3.5 text-primary font-extrabold">R$</span>
              <input
                type="text"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="50,00"
                className="w-full h-12 pl-11 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-lg focus:outline-none focus:border-primary"
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

      {/* Modal: Retirada de Dinheiro */}
      {isWithdrawModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <h3 className="text-base font-extrabold text-deep font-sans mb-1">
              Retirar dinheiro da meta
            </h3>
            <p className="text-xs font-semibold text-textSec mb-4">
              Saldo acumulado: {formatCurrency(selectedGoal.saved_amount)}
            </p>

            <div className="relative flex items-center mb-4">
              <span className="absolute left-3.5 text-danger font-extrabold">R$</span>
              <input
                type="text"
                value={contribAmount}
                onChange={(e) => setContribAmount(e.target.value)}
                placeholder="50,00"
                className="w-full h-12 pl-11 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-lg focus:outline-none focus:border-primary"
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

      {/* Modal: Confirmação de Exclusão da Meta */}
      {isDeleteConfirmOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl border border-lilac/20">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-deep font-sans mb-1">
              Excluir a meta "{selectedGoal.name}"?
            </h3>
            <p className="text-xs font-semibold text-textSec mb-5">
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

      {/* Modal: Criar Nova Meta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto border border-lilac/15">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <h2 className="text-base font-extrabold text-deep font-sans">
                Criar nova meta
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="flex flex-col gap-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Nome da meta</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Viagem de férias, Trocar de celular..."
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Tipo da meta</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="emergency">Reserva de emergência</option>
                  <option value="travel">Viagem</option>
                  <option value="purchase">Compra ou bem material</option>
                  <option value="debt">Quitar dívida</option>
                  <option value="course">Curso ou educação</option>
                  <option value="personal">Pessoal ou outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Valor desejado (R$)</label>
                <input
                  type="text"
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  placeholder="5000,00"
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Prazo desejado (opcional)</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
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
    </AppShell>
  )
}
