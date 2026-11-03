import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Button } from './Button'
import { Mascot } from './Mascot'
import { X, Calendar, DollarSign, Tag, CreditCard, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { getBudgetAlertStatus } from '../lib/finance'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: 'income' | 'expense'
  onSuccess?: () => void
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'expense',
  onSuccess,
}) => {
  const { user } = useAuth()
  const [type, setType] = useState<'income' | 'expense'>(initialType)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().split('T')[0])
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other'>('credit_card')
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setType(initialType)
  }, [initialType])

  useEffect(() => {
    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('sort_order', { ascending: true })
    if (data) {
      setCategories(data)
      if (data.length > 0 && !categoryId) {
        setCategoryId(data[0].id)
      }
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const numAmount = parseFloat(amount.replace(',', '.'))
    if (!numAmount || numAmount <= 0) {
      toast.error('Informe um valor válido maior que zero.')
      return
    }

    if (!description.trim()) {
      toast.error('Informe uma descrição curta para o lançamento.')
      return
    }

    if (!categoryId) {
      toast.error('Selecione uma categoria.')
      return
    }

    setLoading(true)

    try {
      // 1. Inserir transação
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        category_id: categoryId,
        type,
        description: description.trim(),
        amount: numAmount,
        occurred_on: occurredOn,
        payment_method: paymentMethod,
        notes: notes.trim() || null,
        source: 'manual',
      })

      if (error) throw error

      // 2. Verificar se cruzou 80% ou 100% do orçamento da categoria para disparar alerta amigável
      if (type === 'expense') {
        const curMonth = occurredOn.slice(0, 7) + '-01'
        const { data: budget } = await supabase
          .from('budgets')
          .select('limit_amount')
          .eq('user_id', user.id)
          .eq('category_id', categoryId)
          .eq('month', curMonth)
          .single()

        if (budget && budget.limit_amount > 0) {
          // Somar despesas da categoria no mês
          const { data: txs } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('category_id', categoryId)
            .eq('type', 'expense')
            .gte('occurred_on', curMonth)

          const totalSpent = (txs || []).reduce((acc, t) => acc + Number(t.amount), 0)
          const alert = getBudgetAlertStatus(totalSpent, budget.limit_amount)

          if (alert.isOverLimit) {
            toast.warning(
              `Atenção acolhedora: você atingiu o limite dessa categoria este mês. Vamos reorganizar juntas?`
            )
          } else if (alert.isNearLimit) {
            toast.info(
              `Você chegou a 80% do limite desta categoria. Seu planejamento está no controle!`
            )
          }
        }
      }

      toast.success(type === 'expense' ? 'Gasto registrado com sucesso! ✓' : 'Receita registrada com sucesso! ✓')
      setDescription('')
      setAmount('')
      setNotes('')
      onClose()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Erro ao adicionar transação:', err)
      toast.error('Não foi possível salvar o lançamento. Tente de novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90vh] overflow-y-auto">
        {/* Header do Modal com mascote contextual */}
        <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
          <div className="flex items-center gap-2">
            <Mascot size="xs" pose={type === 'income' ? 'deposit' : 'peek'} />
            <h2 className="text-lg font-extrabold text-deep font-sans">
              {type === 'expense' ? 'Adicionar gasto' : 'Adicionar receita'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-textSec hover:text-deep hover:bg-lilac/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alternador Receita / Despesa */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-bg rounded-2xl my-4">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'expense'
                ? 'bg-danger text-white shadow-xs'
                : 'text-textSec hover:text-deep'
            }`}
          >
            - Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              type === 'income'
                ? 'bg-success text-white shadow-xs'
                : 'text-textSec hover:text-deep'
            }`}
          >
            + Receita
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Valor */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Valor</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-primary font-extrabold">R$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full h-12 pl-11 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-lg focus:outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, Aluguel, Salário..."
              maxLength={140}
              className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-sm focus:outline-none focus:border-primary"
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
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-sm focus:outline-none focus:border-primary appearance-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-sm focus:outline-none focus:border-primary"
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
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full h-11 pl-10 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-sm focus:outline-none focus:border-primary appearance-none"
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

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-textSec mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotação pessoal..."
              className="w-full h-10 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" size="md" fullWidth loading={loading}>
              Salvar lançamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
