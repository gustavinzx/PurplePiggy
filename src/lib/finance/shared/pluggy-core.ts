// Lógica PURA do Open Finance (sem Deno/Node específicos). Roda em Edge Functions, no front e no Vitest.

export const CATEGORY_MAP: Record<string, string> = {
  moradia: '56994e3f-f06b-4406-bb24-5224965952a3',
  alimentacao: 'd037d909-18a1-4551-96af-2d1bbab2b5dc',
  transporte: '5ee48481-dbdc-4b59-a979-0f3ce2a97d17',
  saude: '08670c55-3bb2-469b-99da-bf810a56045c',
  familia: 'a27d9fdd-2105-456b-ab0e-29f5bd3d7f75',
  educacao: '97d557e2-6890-4872-bf81-eebc0110fdb9',
  lazer: '3ddb743d-ff69-4056-aabd-d7ae583c82b1',
  compras: '4be5111c-3b7c-4289-89c3-c5bcadc654a3',
  outros: '21a72084-0225-41b8-9771-70b9a164806b',
}

export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other'
export type IgnoreReason = 'card_payment' | 'card_credit' | 'internal_transfer'

export interface PluggyAccount {
  id: string
  type: string // 'BANK' | 'CREDIT'
  subtype?: string
  name?: string
  number?: string
  balance?: number | null
  creditData?: { creditLimit?: number; availableCreditLimit?: number } | null
}
export interface PluggyTxn {
  id: string
  description?: string | null
  descriptionRaw?: string | null
  amount?: number
  date?: string
  type?: string // 'DEBIT' | 'CREDIT'
  status?: string
  category?: string | null
  categoryId?: string | null
  paymentData?: { paymentMethod?: string } | null
}

export function normalizeDescription(s: string): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function resolveCategoryId(desc: string, pluggyCat?: string | null): string {
  const text = normalizeDescription(`${desc} ${pluggyCat || ''}`)
  if (/supermercado|mercado|alimenta|restaurante|padaria|ifood|lanche|comida|food|refeicao|acougue|hortifruti|coffee|cafe|grocer|eating/.test(text)) return CATEGORY_MAP.alimentacao
  if (/uber|99app|\b99\b|posto|combustivel|gasolina|etanol|pedagio|estacionamento|metro|onibus|transporte|corrida|parking|taxi|automotive/.test(text)) return CATEGORY_MAP.transporte
  if (/aluguel|condominio|enel|copel|sabesp|comgas|\bluz\b|energia|agua|\bgas\b|internet|iptu|moradia|habitacao|rent|electricity|housing|utilities/.test(text)) return CATEGORY_MAP.moradia
  if (/farmacia|drogaria|hospital|clinica|medico|saude|dentista|laboratorio|consulta|remedio|droga|health|pharmacy|healthcare/.test(text)) return CATEGORY_MAP.saude
  if (/faculdade|curso|escola|livraria|livro|udemy|alura|educacao|idiomas|mensalidade|education/.test(text)) return CATEGORY_MAP.educacao
  if (/netflix|spotify|cinema|\bshow\b|viagem|hotel|airbnb|jogos|steam|playstation|lazer|\bbar\b|festa|entretenimento|entertainment|travel/.test(text)) return CATEGORY_MAP.lazer
  if (/amazon|mercado livre|shopee|magalu|magazine|shopping|loja|vestuario|roupa|eletronico|compras|varejo|store|merchandise/.test(text)) return CATEGORY_MAP.compras
  if (/\bpet\b|veterinario|racao|filhos|bebe|familia/.test(text)) return CATEGORY_MAP.familia
  return CATEGORY_MAP.outros
}

export function resolvePaymentMethod(desc: string, acctType?: string, pluggyMethod?: string | null): PaymentMethod {
  if (acctType === 'CREDIT') return 'credit_card'
  const p = (pluggyMethod || '').toUpperCase()
  if (p === 'PIX') return 'pix'
  if (p === 'TED' || p === 'DOC') return 'transfer'
  if (p === 'BOLETO') return 'boleto'
  const t = normalizeDescription(desc)
  if (/\bpix\b/.test(t)) return 'pix'
  if (/\bboleto\b|\bslip\b/.test(t)) return 'boleto'
  if (/\bted\b|\bdoc\b|transfer/.test(t)) return 'transfer'
  if (/credito/.test(t)) return 'credit_card'
  return 'debit_card'
}

// Chave estável da conta: sobrevive a reconexões (o id da Pluggy muda, o final da conta não).
export function stableAccountKey(connectorId: string | number | null | undefined, acc: PluggyAccount): string {
  const digits = String(acc.number || '').replace(/\D/g, '')
  const tail = digits.slice(-4) || normalizeDescription(acc.name || '')
  return `${connectorId ?? 'x'}|${acc.type}|${acc.subtype || ''}|${tail}`
}

// ---- Regras de neutralidade (não contam como receita/despesa nos relatórios) ----
// Pagamento de fatura visto na CONTA CORRENTE.
export const CARD_BILL_RE = /pagamento (de |da )?fatura|pagto (de |da )?fatura|pgto (de |da )?fatura|fatura (do )?cartao|credit card payment/
// Pagamento recebido / crédito visto no CARTÃO.
export const CARD_RECEIVED_RE = /pagamento recebido|pagamento (de |da )?fatura|credit card payment|encerramento de divida|estorno|reembolso/
// Movimentos entre "reserva" e conta da mesma instituição (RDB, Caixinhas, Cofrinhos, etc.).
export const PARKING_RE = /dinheiro (reservado|retirado)|reserva de saldo|resgate (de )?reserva|aplica[cç][aã]o.*rdb|resgate.*rdb|\brdb\b|caixinha|cofrinho|guardar dinheiro|resgatar dinheiro/i

export function isSamePersonTransfer(txn: PluggyTxn): boolean {
  if (txn.categoryId && String(txn.categoryId).startsWith('04')) return true
  return /same person transfer|mesma titularidade/.test(normalizeDescription(txn.category || ''))
}

export interface MappedTxn {
  externalId: string
  description: string
  normDesc: string
  amount: number
  cents: number
  type: 'income' | 'expense'
  date: string
  categoryId: string
  pluggyCategoryId: string | null
  paymentMethod: PaymentMethod
  pending: boolean
  ignoreReason: IgnoreReason | null
}

export function mapTransaction(account: PluggyAccount, txn: PluggyTxn, todayStr: string): MappedTxn | null {
  const description = ((txn.description || txn.descriptionRaw || '').trim() || 'Transação Open Finance').slice(0, 140)
  const raw = Number(txn.amount ?? 0)
  const cents = Math.round(Math.abs(raw) * 100)
  if (!txn.id || cents === 0) return null
  const normDesc = normalizeDescription(description)
  const text = normalizeDescription(`${description} ${txn.category || ''}`)
  let type: 'income' | 'expense'
  let ignoreReason: IgnoreReason | null = null

  if (account.type === 'CREDIT') {
    // Cartão: positivo = compra (aumenta a dívida); negativo = pagamento/estorno.
    if (raw < 0 || txn.type === 'CREDIT') {
      type = 'income'
      ignoreReason = CARD_RECEIVED_RE.test(text) ? 'card_payment' : 'card_credit'
    } else type = 'expense'
  } else {
    type = txn.type === 'DEBIT' ? 'expense' : txn.type === 'CREDIT' ? 'income' : raw < 0 ? 'expense' : 'income'
    if (type === 'expense' && CARD_BILL_RE.test(text)) ignoreReason = 'card_payment'
    else if (PARKING_RE.test(text)) ignoreReason = 'internal_transfer'
    // Pluggy: categoria 04xxxxxx = "Same person transfer" (entre contas do próprio titular).
    else if (isSamePersonTransfer(txn)) ignoreReason = 'internal_transfer'
  }

  return {
    externalId: String(txn.id),
    description,
    normDesc,
    amount: cents / 100,
    cents,
    type,
    date: txn.date ? String(txn.date).slice(0, 10) : todayStr,
    categoryId: resolveCategoryId(description, txn.category),
    pluggyCategoryId: txn.categoryId ? String(txn.categoryId) : null,
    paymentMethod: resolvePaymentMethod(description, account.type, txn.paymentData?.paymentMethod),
    pending: String(txn.status || '').toUpperCase() === 'PENDING',
    ignoreReason,
  }
}

async function sha1(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Impressão digital estável. O "ordinal" permite duas compras idênticas no mesmo dia (ambas entram)
// e mantém o mesmo resultado em reconexões (conta nova, ids novos).
export async function assignFingerprints(
  stableKey: string,
  rows: { key: string; date: string; cents: number; normDesc: string }[],
): Promise<Map<string, string>> {
  const sorted = [...rows].sort((a, b) =>
    a.date.localeCompare(b.date) || a.cents - b.cents || a.normDesc.localeCompare(b.normDesc) || a.key.localeCompare(b.key))
  const counter = new Map<string, number>()
  const out = new Map<string, string>()
  for (const r of sorted) {
    const base = `${stableKey}|${r.date}|${r.cents}|${r.normDesc}`
    const n = (counter.get(base) || 0) + 1
    counter.set(base, n)
    out.set(r.key, await sha1(`${base}|${n}`))
  }
  return out
}

// ---- Transferências entre contas da própria usuária (conservador) ----
const TRANSFER_LIKE = /pix|transf|\bted\b|\bdoc\b|enviad|recebid|dinheiro/
export interface TransferRow { key: string; type: 'income' | 'expense'; cents: number; date: string; normDesc: string; accountKey: string }
export function detectInternalTransfers(rows: TransferRow[]): Set<string> {
  const out = new Set<string>()
  const used = new Set<string>()
  const day = (d: string) => Math.floor(Date.parse(d + 'T00:00:00Z') / 864e5)
  const expenses = rows.filter((r) => r.type === 'expense' && TRANSFER_LIKE.test(r.normDesc))
  const incomes = rows.filter((r) => r.type === 'income' && TRANSFER_LIKE.test(r.normDesc))
  for (const e of expenses) {
    const m = incomes.find((i) => !used.has(i.key) && i.cents === e.cents && i.accountKey !== e.accountKey && Math.abs(day(i.date) - day(e.date)) <= 1)
    if (m) { used.add(m.key); out.add(e.key); out.add(m.key) }
  }
  return out
}

// ---- Estado do item da Pluggy ----
export type ItemState = 'ok' | 'partial' | 'updating' | 'needs_user_action' | 'error'
export interface ProductInfo { isUpdated: boolean | null; lastUpdatedAt: string | null }
export const CRITICAL_PRODUCTS = ['accounts', 'transactions', 'creditCards'] as const

export function parseProducts(item: any): Record<string, ProductInfo> {
  const out: Record<string, ProductInfo> = {}
  const sd = item?.statusDetail
  if (sd && typeof sd === 'object') {
    for (const [k, v] of Object.entries<any>(sd)) {
      if (v && typeof v === 'object') out[k] = { isUpdated: typeof v.isUpdated === 'boolean' ? v.isUpdated : null, lastUpdatedAt: v.lastUpdatedAt ?? null }
    }
  }
  return out
}

export function summarizeItemState(item: any): { state: ItemState; missing: string[]; products: Record<string, ProductInfo> } {
  const products = parseProducts(item)
  const status = item?.status
  if (status === 'UPDATING' || status === 'CREATED') return { state: 'updating', missing: [], products }
  if (status === 'LOGIN_ERROR' || status === 'WAITING_USER_INPUT' || status === 'WAITING_USER_ACTION') {
    return { state: 'needs_user_action', missing: [], products }
  }
  if (status !== 'UPDATED') {
    console.warn(`[Pluggy] Status inesperado recebido do item ${item?.id || 'sem_id'}: "${status}"`)
    return { state: 'error', missing: [], products }
  }
  const missing = CRITICAL_PRODUCTS.filter((k) => products[k]?.isUpdated === false) as string[]
  const partial = item?.executionStatus === 'PARTIAL_SUCCESS' || missing.length > 0
  return { state: partial ? 'partial' : 'ok', missing, products }
}

export function computeNextAllowedAt(item: any, intervalMs = 3_600_000): string | null {
  const base = item?.lastUpdatedAt || item?.updatedAt
  const t = base ? Date.parse(base) : NaN
  return Number.isFinite(t) ? new Date(t + intervalMs).toISOString() : null
}

const iso = (d: Date) => d.toISOString().slice(0, 10)
// Baseline = última vez que o EXTRATO foi lido com sucesso (não a última sync de saldo).
export function sinceDate(now: Date, transactionsLastOkAt?: string | null, full = false): string {
  const twelve = new Date(now.getTime() - 365 * 864e5)
  if (full || !transactionsLastOkAt) return iso(twelve)
  const d = new Date(Date.parse(transactionsLastOkAt) - 7 * 864e5)
  return iso(d < twelve ? twelve : d)
}

export const MISSING_LABEL: Record<string, string> = { accounts: 'contas', transactions: 'extrato', creditCards: 'cartão de crédito' }
export function stateMessage(state: ItemState, missing: string[]): string {
  const m = missing.map((k) => MISSING_LABEL[k] || k).join(' e ')
  switch (state) {
    case 'ok': return 'Tudo atualizado.'
    case 'partial': return missing.length > 0
      ? `O banco não liberou ${m}. Reconecte e marque todas as permissões.`
      : 'Dados atualizados. Alguns detalhes ainda estão sendo consolidados pelo banco.'
    case 'updating': return 'O banco ainda está enviando os dados. Em instantes eles aparecem aqui.'
    case 'needs_user_action': return 'O banco pediu uma confirmação sua. Reconecte para continuar atualizando.'
    default: return 'Não conseguimos atualizar agora. Tente de novo em alguns minutos.'
  }
}
