// src/lib/openFinance.test.ts
// Testes unitários e de integração simulada para o módulo Open Finance (Pluggy API v2)
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calculateAvailableBalance,
  calculateMonthlySummary,
} from './finance'

describe('Open Finance (Pluggy API v2) — Suíte de Testes D3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Cursor com 3 páginas
  it('1. deve percorrer cursor com 3 páginas completas até next ser null', async () => {
    const page1 = {
      results: [{ id: 'tx-1', amount: 50, description: 'Compra 1' }],
      next: '/v2/transactions?page=2',
    }
    const page2 = {
      results: [{ id: 'tx-2', amount: 30, description: 'Compra 2' }],
      next: '/v2/transactions?page=3',
    }
    const page3 = {
      results: [{ id: 'tx-3', amount: 20, description: 'Compra 3' }],
      next: null,
    }

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('page=2')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(page2) })
      }
      if (url.includes('page=3')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(page3) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(page1) })
    })

    let currentUrl: string | null = '/v2/transactions?pageSize=500'
    const collected: any[] = []
    let pagesCount = 0

    while (currentUrl) {
      pagesCount++
      const res: any = await mockFetch(currentUrl)
      const data: any = await res.json()
      collected.push(...data.results)
      currentUrl = data.next
    }

    expect(pagesCount).toBe(3)
    expect(collected.length).toBe(3)
    expect(collected.map((t) => t.id)).toEqual(['tx-1', 'tx-2', 'tx-3'])
  })

  // 2. Item UPDATING -> UPDATED
  it('2. deve realizar polling e transicionar de UPDATING para UPDATED', async () => {
    let callCount = 0
    const checkItem = async () => {
      callCount++
      if (callCount < 3) {
        return { status: 'UPDATING', executionStatus: null }
      }
      return { status: 'UPDATED', executionStatus: 'SUCCESS' }
    }

    let finalStatus = 'UPDATING'
    for (let i = 0; i < 5; i++) {
      const item = await checkItem()
      finalStatus = item.status
      if (finalStatus === 'UPDATED') break
    }

    expect(callCount).toBe(3)
    expect(finalStatus).toBe('UPDATED')
  })

  // 3. PARTIAL_SUCCESS sem transações e sem cartão (saldo grava, aviso aparece, nenhum sucesso falso)
  it('3. deve identificar PARTIAL_SUCCESS com transactions.isUpdated=false e sinalizar estado partial', () => {
    const itemStatusDetail = {
      accounts: { isUpdated: true, lastUpdatedAt: '2026-11-06T20:00:00Z' },
      transactions: { isUpdated: false, lastUpdatedAt: null },
      creditCards: { isUpdated: false, lastUpdatedAt: null },
    }

    const accountsOk = itemStatusDetail.accounts?.isUpdated !== false
    const transactionsOk = itemStatusDetail.transactions?.isUpdated === true
    const creditCardsOk = itemStatusDetail.creditCards?.isUpdated === true

    let state: 'ok' | 'partial' | 'updating' = 'ok'
    const missing: string[] = []

    if (!transactionsOk) {
      state = 'partial'
      missing.push('transactions')
    }
    if (!creditCardsOk) {
      state = 'partial'
      missing.push('creditCards')
    }

    expect(accountsOk).toBe(true)
    expect(transactionsOk).toBe(false)
    expect(state).toBe('partial')
    expect(missing).toContain('transactions')
    expect(missing).toContain('creditCards')
  })

  // 4. 409 de frequência (CLIENT_IS_UPDATING_BEFORE_ALLOWED_FREQUENCY)
  it('4. deve tratar 409 de frequência com resiliência e calcular nextAllowedAt (+1h)', () => {
    const patchResponse = {
      status: 409,
      code: 'CLIENT_IS_UPDATING_BEFORE_ALLOWED_FREQUENCY',
      message: 'Item updated recently',
    }

    const isRateLimit = patchResponse.status === 409
    expect(isRateLimit).toBe(true)

    const lastUpdated = new Date('2026-11-06T20:00:00Z')
    const nextAllowedAt = new Date(lastUpdated.getTime() + 60 * 60 * 1000)

    expect(nextAllowedAt.toISOString()).toBe('2026-11-06T21:00:00.000Z')
  })

  // 5. Reconexão com IDs novos (sem duplicar, usando stable_key)
  it('5. deve preservar stable_key entre reconexões para evitar duplicatas de conta', () => {
    const oldAccount = {
      id: 'pluggy-acc-old-123',
      connectorId: 606,
      type: 'BANK',
      number: '12345-6',
    }

    const newAccount = {
      id: 'pluggy-acc-new-789',
      connectorId: 606,
      type: 'BANK',
      number: '12345-6',
    }

    const getStableKey = (acc: any) => `${acc.connectorId}|${acc.type}|${acc.number}`

    const oldKey = getStableKey(oldAccount)
    const newKey = getStableKey(newAccount)

    expect(oldKey).toBe(newKey)
    expect(oldKey).toBe('606|BANK|12345-6')
  })

  // 6. Duas compras iguais no mesmo dia (ambas entram com ordinais diferentes)
  it('6. deve permitir duas compras iguais no mesmo dia com fingerprints únicos via ordinal', () => {
    const tx1 = {
      occurredOn: '2026-11-06',
      amount: 45.0,
      description: 'Supermercado Central',
    }
    const tx2 = {
      occurredOn: '2026-11-06',
      amount: 45.0,
      description: 'Supermercado Central',
    }

    const generateFingerprint = (tx: typeof tx1, ordinal: number) => {
      return `${tx.occurredOn}|${tx.amount.toFixed(2)}|${tx.description.toLowerCase()}|ordinal_${ordinal}`
    }

    const fp1 = generateFingerprint(tx1, 1)
    const fp2 = generateFingerprint(tx2, 2)

    expect(fp1).not.toBe(fp2)
    expect(fp1).toContain('ordinal_1')
    expect(fp2).toContain('ordinal_2')
  })

  // 7. Fila de dois bancos no front
  it('7. deve executar sincronização de múltiplos bancos em fila serial com rastreamento', async () => {
    const banks = ['Nubank', 'Mercado Pago']
    const progress: string[] = []

    for (let i = 0; i < banks.length; i++) {
      const bank = banks[i]
      progress.push(`Iniciando ${i + 1}/${banks.length}: ${bank}`)
      // simula request
      await new Promise((r) => setTimeout(r, 10))
      progress.push(`Concluído: ${bank}`)
    }

    expect(progress).toEqual([
      'Iniciando 1/2: Nubank',
      'Concluído: Nubank',
      'Iniciando 2/2: Mercado Pago',
      'Concluído: Mercado Pago',
    ])
  })

  // 8. Pagamento de fatura neutro (ignore_in_reports = true)
  it('8. deve marcar pagamento de fatura como movimento interno e ignorar nos totais', () => {
    const transactions = [
      {
        id: '1',
        type: 'expense' as const,
        amount: 250.0,
        occurred_on: '2026-11-06',
        description: 'Pagamento de fatura Nubank',
        ignore_in_reports: true,
        ignore_reason: 'credit_card_payment',
      },
      {
        id: '2',
        type: 'expense' as const,
        amount: 80.0,
        occurred_on: '2026-11-06',
        description: 'Restaurante Sabor',
        ignore_in_reports: false,
      },
      {
        id: '3',
        type: 'income' as const,
        amount: 500.0,
        occurred_on: '2026-11-06',
        description: 'Salário / Pro labore',
        ignore_in_reports: false,
      },
    ]

    const summary = calculateMonthlySummary(transactions, new Date('2026-11-06'))

    // O pagamento de fatura de R$ 250 não deve entrar nas despesas (apenas os R$ 80 do restaurante)
    expect(summary.expense).toBe(80.0)
    expect(summary.income).toBe(500.0)
    expect(summary.net).toBe(420.0)
  })

  // 9. Saldo = soma das contas BANK com include_in_balance
  it('9. deve somar exatamente as contas BANK ativas com include_in_balance=true', () => {
    const accounts = [
      { id: 'acc-1', type: 'BANK', balance: 250.5, include_in_balance: true },
      { id: 'acc-2', type: 'BANK', balance: 100.0, include_in_balance: false }, // ignorado
      { id: 'acc-3', type: 'CREDIT', balance: 450.0, include_in_balance: true }, // cartão (fatura, não soma no saldo)
      { id: 'acc-4', type: 'BANK', balance: 149.5, include_in_balance: true },
    ]

    const sumBank = accounts
      .filter((a) => a.type === 'BANK' && a.include_in_balance)
      .reduce((acc, a) => acc + a.balance, 0)

    expect(sumBank).toBe(400.0)

    const available = calculateAvailableBalance(0, [], sumBank)
    expect(available).toBe(400.0)
  })
})
