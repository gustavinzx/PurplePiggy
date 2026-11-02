import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { formatCurrency } from '../lib/format'
import {
  ArrowLeft,
  ShoppingCart,
  Home,
  Bus,
  HeartPulse,
  Users,
  Sparkles,
  ShoppingBag,
  GraduationCap,
  CircleEllipsis,
  Calendar,
  CreditCard,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form states
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [occurredOn, setOccurredOn] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (user && id) {
      loadData()
    }
  }, [user, id])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: cats } = await supabase.from('categories').select('*')
      if (cats) setCategories(cats)

      const { data: tx, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id!)
        .eq('user_id', user!.id)
        .single()

      if (error || !tx) {
        toast.error('Lançamento não encontrado.')
        navigate('/gastos')
        return
      }

      setTransaction(tx)
      setDescription(tx.description)
      setAmount(tx.amount.toString())
      setCategoryId(tx.category_id)
      setOccurredOn(tx.occurred_on)
      setPaymentMethod(tx.payment_method)
      setNotes(tx.notes || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction || !user) return

    const numAmount = parseFloat(amount.replace(',', '.'))
    if (!numAmount || numAmount <= 0) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: description.trim(),
          amount: numAmount,
          category_id: categoryId,
          occurred_on: occurredOn,
          payment_method: paymentMethod as any,
          notes: notes.trim() || null,
        })
        .eq('id', transaction.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Lançamento atualizado ✓')
      navigate('/gastos')
    } catch (err) {
      console.error(err)
      toast.error('Não conseguimos salvar agora. Tente de novo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!transaction || !user) return
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Lançamento excluído com sucesso.')
      navigate('/gastos')
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir lançamento.')
    }
  }

  const currentCat = categories.find((c) => c.id === categoryId)

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-8 h-8" />
      case 'ShoppingCart':
        return <ShoppingCart className="w-8 h-8" />
      case 'Bus':
        return <Bus className="w-8 h-8" />
      case 'HeartPulse':
        return <HeartPulse className="w-8 h-8" />
      case 'Users':
        return <Users className="w-8 h-8" />
      case 'GraduationCap':
        return <GraduationCap className="w-8 h-8" />
      case 'Sparkles':
        return <Sparkles className="w-8 h-8" />
      case 'ShoppingBag':
        return <ShoppingBag className="w-8 h-8" />
      default:
        return <CircleEllipsis className="w-8 h-8" />
    }
  }

  if (loading || !transaction) {
    return (
      <AppShell showNav={false} className="px-5 py-6 justify-center items-center">
        <p className="text-sm font-bold text-deep animate-pulse">Carregando detalhes...</p>
      </AppShell>
    )
  }

  const isIncome = transaction.type === 'income'

  return (
    <AppShell showNav={false} className="px-5 py-6 flex flex-col justify-between bg-white relative">
      <div>
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/gastos')}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold text-deep font-sans">
            Detalhes da transação
          </h1>
        </div>

        {/* Card Destaque (reproduzindo exatamente o layout) */}
        <div className="bg-bg rounded-[26px] p-6 flex flex-col items-center text-center mb-6 border border-lilac/15">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-3 shadow-sm"
            style={{ backgroundColor: currentCat?.color || '#B037F8' }}
          >
            {getCategoryIcon(currentCat?.icon)}
          </div>

          <h2 className="text-xl font-extrabold text-deep font-sans mb-1">
            {description}
          </h2>

          <div
            className={`text-2xl font-extrabold font-sans mb-2 ${
              isIncome ? 'text-success' : 'text-danger'
            }`}
          >
            {isIncome ? '+ ' : '- '}
            {formatCurrency(Number(amount) || transaction.amount)}
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${
              isIncome ? 'bg-success/15 text-success' : 'bg-pink/20 text-danger'
            }`}
          >
            {isIncome ? 'Receita' : 'Despesa'}
          </span>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Categoria</label>
            <div className="relative flex items-center">
              <Tag className="w-4 h-4 text-primary absolute left-3.5" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Data</label>
            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-primary absolute left-3.5" />
              <input
                type="date"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Forma de pagamento</label>
            <div className="relative flex items-center">
              <CreditCard className="w-4 h-4 text-primary absolute left-3.5" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary appearance-none"
              >
                <option value="pix">Pix</option>
                <option value="credit_card">Cartão de crédito</option>
                <option value="debit_card">Cartão de débito</option>
                <option value="cash">Dinheiro em espécie</option>
                <option value="boleto">Boleto</option>
                <option value="transfer">Transferência bancária</option>
                <option value="other">Outros</option>
              </select>
            </div>
          </div>

          {/* Ações inferiores */}
          <div className="flex flex-col gap-3 mt-4">
            <Button type="submit" size="lg" fullWidth loading={saving}>
              Salvar alterações
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="lg"
              fullWidth
              onClick={() => setShowDeleteConfirm(true)}
            >
              Excluir lançamento
            </Button>
          </div>
        </form>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm text-center shadow-2xl border border-lilac/20">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-deep font-sans mb-1">
              Excluir lançamento?
            </h3>
            <p className="text-xs font-semibold text-textSec mb-5">
              Esta ação removerá este registro do seu histórico e recalculará seus saldos e relatórios.
            </p>
            <div className="flex gap-2.5">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="md"
                className="flex-1"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
