import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { CategoryCircle } from '../components/CategoryIcon'
import { formatCurrency } from '../lib/format'
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

function parseCurrencyInput(raw: string): number {
  const cleaned = raw.trim().replace(/[^\d.,-]/g, '')
  if (!cleaned) return NaN
  if (cleaned.includes(',') && cleaned.includes('.')) {
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  }
  if (cleaned.includes(',')) {
    return parseFloat(cleaned.replace(',', '.'))
  }
  return parseFloat(cleaned)
}

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
  const [type, setType] = useState<'expense' | 'income'>('expense')
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
      setType(tx.type === 'income' ? 'income' : 'expense')
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

  const goBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/gastos')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction || !user) return

    const numAmount = parseCurrencyInput(amount)
    if (!numAmount || numAmount <= 0 || isNaN(numAmount)) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          type,
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

      toast.success('Lançamento atualizado com sucesso!')
      goBack()
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
      goBack()
    } catch (err) {
      console.error(err)
      toast.error('Erro ao excluir lançamento.')
    }
  }

  const currentCat = categories.find((c) => c.id === categoryId)

  if (loading || !transaction) {
    return (
      <AppShell showNav={false} className="px-5 py-6 justify-center items-center">
        <p className="text-sm font-bold text-deep animate-pulse">Carregando detalhes...</p>
      </AppShell>
    )
  }

  const isIncome = type === 'income'
  const parsedPreviewAmount = parseCurrencyInput(amount)

  return (
    <AppShell showNav={false} className="px-5 py-6 flex flex-col justify-between bg-white relative pb-12">
      <div>
        {/* Header com botão voltar e mascote espiando */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors cursor-pointer"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-extrabold text-deep font-sans">
              Detalhes da transação
            </h1>
          </div>
          <div className="-mr-1">
            <Mascot size="sm" pose="peek" />
          </div>
        </div>

        {/* Card Destaque */}
        <div className="bg-bg rounded-[26px] p-6 flex flex-col items-center text-center mb-6 border border-lilac/15">
          <CategoryCircle
            name={currentCat?.slug || currentCat?.icon || currentCat?.name || 'outros'}
            size="lg"
            className="mb-3"
          />

          <h2 className="text-xl font-extrabold text-deep font-sans mb-1">
            {description}
          </h2>

          <div
            className={`text-2xl font-extrabold font-sans mb-2 ${
              isIncome ? 'text-success' : 'text-danger'
            }`}
          >
            {isIncome ? '+ ' : '- '}
            {formatCurrency(!isNaN(parsedPreviewAmount) && parsedPreviewAmount > 0 ? parsedPreviewAmount : transaction.amount)}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                isIncome ? 'bg-success/15 text-success' : 'bg-pink/20 text-danger'
              }`}
            >
              {isIncome ? 'Receita' : 'Despesa'}
            </span>
            {transaction.source === 'open_finance' && (
              <span className="text-[11px] font-extrabold text-[#7D2BD6] bg-[#F3E8FF] px-2.5 py-1 rounded-full">
                Open Finance
              </span>
            )}
          </div>
        </div>

        {/* Formulário de Edição */}
        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          {/* Seletor Despesa / Receita */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Tipo de lançamento</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-bg rounded-2xl border border-lilac/25">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-danger text-white shadow-xs'
                    : 'text-textSec hover:text-deep'
                }`}
              >
                - Despesa (Gasto)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-success text-white shadow-xs'
                    : 'text-textSec hover:text-deep'
                }`}
              >
                + Receita (Entrada)
              </button>
            </div>
          </div>

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
              type="text"
              inputMode="decimal"
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
