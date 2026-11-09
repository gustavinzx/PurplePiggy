// src/lib/openFinance.ts
// Integração do Open Finance v2 para o PurplePiggy
import { supabase } from './supabase'
import {
  ItemState,
  ProductInfo,
  assignFingerprints,
  resolveCategoryId,
  resolvePaymentMethod,
} from './finance/shared/pluggy-core'
import {
  BankAccountRow,
  TxRow,
  computeBalance,
  totalsByType,
  manualNet,
  isReportable,
} from './finance/shared/finance-totals'
import {
  parseOfx,
  parseCsv,
  ImportedRow,
} from './finance/shared/import-parsers'

export type { ItemState, ProductInfo, BankAccountRow, TxRow, ImportedRow }
export { computeBalance, totalsByType, manualNet, isReportable, parseOfx, parseCsv }

declare global {
  interface Window {
    PluggyConnect?: any
  }
}

export interface PluggyConnector {
  id: number
  name: string
  imageUrl?: string
  primaryColor?: string
}

export interface PluggyItem {
  id: string
  status: string
  executionStatus?: string
  createdAt?: string
  updatedAt?: string
  connector?: PluggyConnector
  error?: any
}

export interface PluggySuccessPayload {
  item: PluggyItem
}

export interface SyncRunRecord {
  id: string
  connection_id: string
  user_id: string
  trigger: string
  status: 'running' | 'success' | 'partial' | 'error'
  stats: any
  errors: any
  started_at: string
  finished_at: string | null
}

export interface ConnectorInfo {
  id: number
  name: string
  imageUrl: string | null
  status: string
  isOpenFinance: boolean
  tier: 'verified' | 'beta'
}

export interface AccountSyncResult {
  id: string
  name: string | null
  type: string
  balance: number | null
  fetched: number
  inserted: number
  updated: number
  ignored: number
  skipped: number
}

export interface SyncResult {
  state: ItemState | 'already_running'
  message: string
  missing: string[]
  products: Record<string, ProductInfo>
  accounts: AccountSyncResult[]
  errors: string[]
  nextAllowedAt: string | null
  incomplete: boolean
  runId: string | null
  error?: string
}

export interface BankAccountRecord {
  id: string
  user_id: string
  connection_id: string
  pluggy_account_id: string
  stable_key: string
  type: string
  subtype: string | null
  name: string | null
  number_masked: string | null
  balance: number | null
  credit_limit: number | null
  available_credit_limit: number | null
  is_active: boolean
  include_in_balance: boolean
  is_hidden: boolean
  last_synced_at: string | null
  created_at: string
}

export interface CreateOAuthItemResult {
  success: boolean
  itemId: string
  institutionName: string
  oauthUrl: string | null
  message: string
}

export interface OpenFinanceConnectOptions {
  onSuccess?: (item: PluggyItem, syncResult?: SyncResult) => void
  onError?: (error: any) => void
  onClose?: () => void
  itemId?: string
}

const PLUGGY_SCRIPT_URL = 'https://cdn.pluggy.ai/pluggy-connect/v2.5.0/pluggy-connect.js'

/**
 * Carrega dinamicamente a biblioteca oficial do Pluggy Connect Widget no navegador.
 */
export const loadPluggyScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Ambiente sem window'))
    }

    if (window.PluggyConnect) {
      return resolve()
    }

    const existingScript = document.getElementById('pluggy-connect-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve())
      existingScript.addEventListener('error', (e) => reject(e))
      return
    }

    const script = document.createElement('script')
    script.id = 'pluggy-connect-script'
    script.src = PLUGGY_SCRIPT_URL
    script.async = true
    script.onload = () => resolve()
    script.onerror = (err) => reject(new Error(`Falha ao carregar o script da Pluggy: ${err}`))
    document.head.appendChild(script)
  })
}

/**
 * Obtém o connectToken gerado com segurança pela Edge Function create-connect-token.
 */
export const fetchPluggyConnectToken = async (itemId?: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('create-connect-token', {
    body: { itemId },
  })

  if (error || !data?.connectToken) {
    let errorMsg =
      error?.message ||
      data?.error ||
      'Não foi possível iniciar a conexão segura com a Pluggy no momento.'

    if (error && typeof (error as any).context?.json === 'function') {
      try {
        const errJson = await (error as any).context.json()
        if (errJson?.message) errorMsg = errJson.message
        else if (errJson?.error) errorMsg = errJson.error
      } catch {}
    }

    throw new Error(errorMsg)
  }

  return data.connectToken
}

/**
 * Lista conectores bancários disponíveis com selo Verificado/Beta da função pluggy-connectors.
 */
export const fetchPluggyConnectors = async (): Promise<ConnectorInfo[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('pluggy-connectors')
    if (error || !data?.connectors) {
      return []
    }
    return data.connectors as ConnectorInfo[]
  } catch {
    return []
  }
}

/**
 * Sincroniza UMA conexão bancária específica via pluggy-sync.
 */

/**
 * Alias de compatibilidade com v1: redireciona para syncPluggyConnection.
 */
export const syncPluggyTransactions = async (
  userIdOrConnId: string,
  itemIdOrConnId?: string
): Promise<SyncResult> => {
  if (!itemIdOrConnId) {
    return syncPluggyConnection(userIdOrConnId)
  }
  const { data: conn } = await supabase
    .from('bank_connections')
    .select('id')
    .eq('user_id', userIdOrConnId)
    .eq('provider_ref', itemIdOrConnId)
    .maybeSingle()

  if (conn?.id) {
    return syncPluggyConnection(conn.id)
  }
  return syncPluggyConnection(itemIdOrConnId)
}

export const syncPluggyConnection = async (
  connectionId: string,
  opts: { force?: boolean; full?: boolean; trigger?: 'manual' | 'resume' } = {}
): Promise<SyncResult> => {
  const { data, error } = await supabase.functions.invoke('pluggy-sync', {
    body: {
      action: 'sync',
      connectionId,
      force: opts.force,
      full: opts.full,
      trigger: opts.trigger,
    },
  })

  if (error || !data) {
    let msg = error?.message || data?.error || 'Falha ao sincronizar conexão.'

    if (error && typeof (error as any).context?.json === 'function') {
      try {
        const errJson = await (error as any).context.json()
        if (errJson?.state) {
          return errJson as SyncResult
        }
        if (errJson?.message) msg = errJson.message
        else if (errJson?.error) msg = errJson.error
      } catch {}
    }

    return {
      state: 'error',
      message: msg,
      missing: [],
      products: {},
      accounts: [],
      errors: [msg],
      nextAllowedAt: null,
      incomplete: false,
      runId: null,
      error: msg,
    }
  }

  return data as SyncResult
}

/**
 * Polling inteligente com backoff exponencial no front para estados transitórios:
 * - 'updating': banco ainda processando na Pluggy
 * - 'already_running': outra sync em andamento, aguarda conclusão
 * - 'partial': dá até 3 tentativas com backoff para aguardar liberação do extrato
 * Limite total de tempo ampliado para até 90 segundos.
 */
export const pollSyncUntilDone = async (
  connectionId: string,
  onUpdate?: (res: SyncResult) => void,
  maxDurationMs = 90_000,
  initial?: SyncResult
): Promise<SyncResult> => {
  // Se o chamador já tem o resultado da primeira chamada, não dispara outra sync duplicada.
  let res = initial ?? (await syncPluggyConnection(connectionId))
  if (!initial) onUpdate?.(res)

  const startTime = Date.now()
  let delayMs = 3000
  let partialRetries = 0

  while (Date.now() - startTime < maxDurationMs) {
    // Estados finais conclusivos ou que exigem ação do usuário: encerra imediatamente
    if (res.state === 'ok' || res.state === 'error' || res.state === 'needs_user_action') {
      break
    }

    // Se estiver em 'partial', só retenta até 3 vezes (cerca de ~25s) para dar tempo de transações chegarem
    if (res.state === 'partial') {
      if (partialRetries >= 3) break
      partialRetries++
    }

    await new Promise((r) => setTimeout(r, delayMs))
    delayMs = Math.min(Math.round(delayMs * 1.4), 15000)

    res = await syncPluggyConnection(connectionId, { trigger: 'resume' })
    onUpdate?.(res)
  }

  return res
}

/**
 * Revoga uma conexão bancária via pluggy-sync (apaga item na Pluggy e arquiva lançamentos).
 */
export const revokePluggyConnection = async (
  connectionIdOrUserId: string,
  _itemId?: string,
  legacyConnId?: string
): Promise<boolean> => {
  const connectionId = legacyConnId || connectionIdOrUserId
  const { data, error } = await supabase.functions.invoke('pluggy-sync', {
    body: { action: 'revoke', connectionId },
  })

  if (error || !data?.success) {
    console.error('[OpenFinance] Erro ao revogar conexão:', error || data)
    return false
  }

  return true
}

/**
 * Busca todas as contas bancárias e cartões registrados do usuário.
 */
export const fetchBankAccounts = async (userId: string): Promise<BankAccountRecord[]> => {
  const { data, error } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[OpenFinance] Aviso ao buscar bank_accounts:', error.message)
    return []
  }

  return (data as BankAccountRecord[]) || []
}

/**
 * Alterna a inclusão de uma conta no cálculo do saldo disponível do usuário.
 */
export const toggleAccountInBalance = async (
  accountId: string,
  includeInBalance: boolean
): Promise<boolean> => {
  const { error } = await supabase
    .from('bank_accounts')
    .update({ include_in_balance: includeInBalance, updated_at: new Date().toISOString() })
    .eq('id', accountId)

  if (error) {
    console.error('[OpenFinance] Erro ao alternar include_in_balance:', error)
    return false
  }

  return true
}

/**
 * Alterna se um lançamento específico conta ou não nos relatórios da usuária.
 * Grava ignore_locked = true para que o sync nunca desfaça a escolha manual!
 */
export const toggleTxIgnoreInReports = async (
  txId: string,
  ignoreInReports: boolean
): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .update({
      ignore_in_reports: ignoreInReports,
      ignore_locked: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', txId)

  if (error) {
    console.error('[OpenFinance] Erro ao alternar ignore_in_reports:', error)
    return false
  }

  return true
}

/**
 * Busca o último registro de sincronização (sync_runs) para uma conexão.
 */
export const fetchLatestSyncRun = async (
  userId: string,
  connectionId: string
): Promise<any | null> => {
  const { data, error } = await supabase
    .from('sync_runs')
    .select('*')
    .eq('user_id', userId)
    .eq('connection_id', connectionId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.warn('[OpenFinance] Falha ao ler sync_runs:', error.message)
    return null
  }

  return data
}

/**
 * Salva a conexão bancária guardando connector_id e chama pluggy-sync imediatamente.
 */
export const persistPluggyConnection = async (
  userId: string,
  item: PluggyItem,
  connectorId?: number | string
): Promise<{ connectionId: string }> => {
  const institutionName = item.connector?.name || 'Instituição Open Finance'

  const { data: conn, error: connErr } = await supabase
    .from('bank_connections')
    .upsert(
      {
        user_id: userId,
        institution_name: institutionName,
        account_label: `${institutionName} · Sincronizado via Open Finance`,
        provider: 'pluggy',
        provider_ref: item.id,
        connector_id: String(connectorId || item.connector?.id || ''),
        status: 'active',
        is_demo: false,
      },
      { onConflict: 'user_id,provider_ref' }
    )
    .select('id')
    .single()

  if (connErr || !conn) {
    console.error('[OpenFinance] Erro ao salvar conexão:', connErr)
    throw new Error('Não foi possível salvar os dados da conexão bancária.')
  }

  const oneYearExpiry = new Date()
  oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1)

  await supabase.from('open_finance_consents').upsert(
    {
      user_id: userId,
      connection_id: conn.id,
      scopes: ['accounts', 'transactions', 'credit_cards'],
      status: 'authorized',
      expires_at: oneYearExpiry.toISOString(),
    },
    { onConflict: 'connection_id' }
  )

  return { connectionId: conn.id }
}

let isOpeningPluggyConnect = false

/**
 * Abre o widget oficial da Pluggy Connect com bloqueio estrito contra clique duplo.
 */
export const openPluggyConnect = async (
  userId: string,
  options: OpenFinanceConnectOptions = {}
): Promise<void> => {
  const provider = import.meta.env.VITE_OPEN_FINANCE_PROVIDER || 'pluggy'

  if (provider !== 'pluggy') {
    console.info(`[OpenFinance] VITE_OPEN_FINANCE_PROVIDER="${provider}". Modo Pluggy inativo.`)
    return
  }

  if (isOpeningPluggyConnect) {
    console.warn('[OpenFinance] Widget da Pluggy já está em processo de abertura. Ignorando clique duplicado.')
    return
  }

  isOpeningPluggyConnect = true
  const releaseLock = () => {
    isOpeningPluggyConnect = false
  }

  try {
    await loadPluggyScript()

    if (!window.PluggyConnect) {
      throw new Error('O widget da Pluggy não pôde ser instanciado no navegador.')
    }

    const connectToken = await fetchPluggyConnectToken(options.itemId)

    const pluggyInstance = new window.PluggyConnect({
      connectToken,
      includeSandbox: false,
      onSuccess: async (data: PluggySuccessPayload) => {
        releaseLock()
        try {
          if (data?.item) {
            const { connectionId } = await persistPluggyConnection(userId, data.item)
            let syncResult: SyncResult | undefined
            try {
              syncResult = await syncPluggyConnection(connectionId)
            } catch (syncErr) {
              console.warn('[OpenFinance] Sincronização inicial em segundo plano:', syncErr)
            }
            options.onSuccess?.(data.item, syncResult)
          }
        } catch (saveError) {
          options.onError?.(saveError)
        }
      },
      onError: (err: any) => {
        releaseLock()
        console.warn('[OpenFinance] Feedback de erro amigável da Pluggy:', err)
        options.onError?.(err)
      },
      onClose: () => {
        releaseLock()
        options.onClose?.()
      },
    })

    if (typeof pluggyInstance.init === 'function') {
      pluggyInstance.init()
    } else if (typeof pluggyInstance.open === 'function') {
      pluggyInstance.open()
    }
  } catch (err) {
    releaseLock()
    throw err
  }
}

/**
 * Cria um item Open Finance diretamente via API da Pluggy e retorna o link oficial de autorização do banco.
 */
export const createPluggyOAuthItem = async (
  userId: string,
  connectorId: number,
  cpf: string
): Promise<CreateOAuthItemResult> => {
  const { data, error } = await supabase.functions.invoke('sync-pluggy-transactions', {
    body: { action: 'create_oauth_item', userId, connectorId, cpf },
  })

  if (error || !data || data.error) {
    const errorMsg =
      data?.error ||
      error?.message ||
      'Não foi possível gerar o link de autorização do banco. Verifique seu CPF.'
    throw new Error(errorMsg)
  }

  return data
}

/**
 * Plano B: Importação universal de extrato OFX ou CSV sem depender da Pluggy.
 */
export const importBankStatement = async (
  userId: string,
  accountName: string,
  rows: ImportedRow[]
): Promise<{ inserted: number; total: number }> => {
  if (rows.length === 0) return { inserted: 0, total: 0 }

  const stableKey = `import|${accountName.trim().toLowerCase()}`
  const rowsWithKey = rows.map((r, idx) => ({
    key: `row-${idx}`,
    date: r.date,
    cents: Math.round(Math.abs(r.amount) * 100),
    normDesc: (r.description || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
  }))

  const fpMap = await assignFingerprints(stableKey, rowsWithKey)

  // Buscar fingerprints já existentes
  const { data: existing } = await supabase
    .from('transactions')
    .select('fingerprint')
    .eq('user_id', userId)

  const existingSet = new Set((existing || []).map((t) => t.fingerprint).filter(Boolean))

  const toInsert: any[] = []
  rows.forEach((r, idx) => {
    const fp = fpMap.get(`row-${idx}`)
    if (!fp || existingSet.has(fp)) return

    const type = r.amount >= 0 ? 'income' : 'expense'
    const absAmount = Math.abs(r.amount)

    toInsert.push({
      user_id: userId,
      account_id: `import:${accountName}`,
      external_id: r.externalId || fp,
      fingerprint: fp,
      amount: absAmount > 0 ? absAmount : 0.01,
      type,
      description: r.description.slice(0, 140),
      occurred_on: r.date,
      category_id: resolveCategoryId(r.description),
      payment_method: resolvePaymentMethod(r.description, 'BANK'),
      source: 'import',
      ignore_in_reports: false,
      ignore_locked: false,
      notes: `Importado via arquivo (${accountName})`,
    })
  })

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase.from('transactions').insert(toInsert)
    if (insErr) {
      console.error('[Import] Erro ao inserir transações importadas:', insErr)
      throw insErr
    }
  }

  return { inserted: toInsert.length, total: rows.length }
}

/**
 * Extrai o nome da instituição bancária de uma transação sincronizada via Open Finance
 */
export function getBankNameFromTransaction(
  tx: { notes?: string | null; account_id?: string | null },
  bankMap?: Record<string, string>
): string | null {
  if (tx.notes && tx.notes.includes('Open Finance (')) {
    const match = tx.notes.match(/Open Finance \(([^)]+)\)/)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  if (tx.notes && tx.notes.includes('Importado via arquivo (')) {
    const match = tx.notes.match(/Importado via arquivo \(([^)]+)\)/)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  if (tx.account_id && bankMap && bankMap[tx.account_id]) {
    return bankMap[tx.account_id]
  }
  return null
}

/**
 * Retorna o caminho do logo oficial do banco em SVG de alta fidelidade
 */
export function getBankLogo(bankName?: string | null): string | null {
  if (!bankName) return null
  const lower = bankName.toLowerCase()

  if (lower.includes('nu') || lower.includes('roxinho')) return '/assets/banks/nubank.svg'
  if (lower.includes('mercado') || lower.includes('mp')) return '/assets/banks/mercadopago.svg'
  if (lower.includes('itau') || lower.includes('itaú')) return '/assets/banks/itau.svg'
  if (lower.includes('bradesco')) return '/assets/banks/bradesco.svg'
  if (lower.includes('inter')) return '/assets/banks/inter.svg'
  if (lower.includes('brasil') || lower.includes('bb')) return '/assets/banks/bancodobrasil.svg'
  if (lower.includes('caixa')) return '/assets/banks/caixa.svg'
  if (lower.includes('santander')) return '/assets/banks/santander.svg'
  if (lower.includes('c6')) return '/assets/banks/c6bank.svg'
  if (lower.includes('picpay')) return '/assets/banks/picpay.svg'
  if (lower.includes('btg')) return '/assets/banks/btg.svg'
  if (lower.includes('sicredi')) return '/assets/banks/sicredi.svg'
  if (lower.includes('sicoob')) return '/assets/banks/sicoob.svg'

  return null
}
