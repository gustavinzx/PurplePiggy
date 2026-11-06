// src/lib/openFinance.ts
// Integração do Open Finance oficial utilizando o provedor Pluggy para o PurplePiggy
import { supabase } from './supabase'

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

export interface SyncPluggyResult {
  success: boolean
  pendingAuth?: boolean
  itemId?: string
  oauthUrl?: string | null
  institutionName?: string
  syncedAccounts: number
  syncedTransactions: number
  message: string
}

export interface CreateOAuthItemResult {
  success: boolean
  itemId: string
  institutionName: string
  oauthUrl: string | null
  message: string
}

export interface OpenFinanceConnectOptions {
  onSuccess?: (item: PluggyItem, syncResult?: SyncPluggyResult) => void
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
 * Obtém o connectToken gerado com segurança pela Edge Function do Supabase.
 */
export const fetchPluggyConnectToken = async (itemId?: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('create-connect-token', {
    body: { itemId },
  })

  if (error || !data?.connectToken) {
    const errorMsg =
      error?.message ||
      data?.error ||
      'Não foi possível iniciar a conexão segura com a Pluggy no momento.'
    throw new Error(errorMsg)
  }

  return data.connectToken
}

/**
 * Dispara a sincronização de transações bancárias da Pluggy (API v2) via Edge Function.
 */
export const syncPluggyTransactions = async (
  userId?: string,
  itemId?: string
): Promise<SyncPluggyResult> => {
  const { data, error } = await supabase.functions.invoke('sync-pluggy-transactions', {
    body: { action: 'sync', itemId, userId },
  })

  if (error || !data) {
    const errorMsg =
      error?.message ||
      data?.error ||
      'Não foi possível sincronizar as transações da Pluggy no momento.'
    throw new Error(errorMsg)
  }

  return data
}

/**
 * Cria um item Open Finance diretamente via API da Pluggy e retorna o link oficial de autorização do banco (sem depender de iframe bloqueado no Android).
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
 * Conecta e sincroniza em 1 clique o Pluggy Bank (Sandbox Oficial da API Pluggy)
 * sem precisar digitar user-ok / password-ok manualmente no iframe.
 */
export const connectPluggySandboxDirect = async (
  userId: string
): Promise<SyncPluggyResult> => {
  const { data, error } = await supabase.functions.invoke('sync-pluggy-transactions', {
    body: { action: 'connect_sandbox', userId },
  })

  if (error || !data || data.error) {
    const errorMsg =
      data?.error ||
      error?.message ||
      'Não foi possível sincronizar o Pluggy Bank agora.'
    throw new Error(errorMsg)
  }

  return data
}

/**
 * Salva a conexão bancária e os consentimentos nas tabelas oficiais do Supabase.
 */
export const persistPluggyConnection = async (
  userId: string,
  item: PluggyItem
): Promise<{ connectionId: string }> => {
  const institutionName = item.connector?.name || 'Pluggy Bank'

  const { data: conn, error: connErr } = await supabase
    .from('bank_connections')
    .upsert(
      {
        user_id: userId,
        institution_name: institutionName,
        account_label: `${institutionName} · Sincronizado via Open Finance`,
        provider: 'pluggy',
        provider_ref: item.id,
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

  await supabase.from('open_finance_consents').insert({
    user_id: userId,
    connection_id: conn.id,
    scopes: ['accounts', 'transactions', 'credit_cards'],
    status: 'authorized',
    expires_at: oneYearExpiry.toISOString(),
  })

  return { connectionId: conn.id }
}

/**
 * Abre o widget oficial da Pluggy Connect (com suporte a Sandbox e bancos reais).
 */
export const openPluggyConnect = async (
  userId: string,
  options: OpenFinanceConnectOptions = {}
): Promise<void> => {
  const provider = import.meta.env.VITE_OPEN_FINANCE_PROVIDER || 'pluggy'

  if (provider !== 'pluggy') {
    console.info(
      `[OpenFinance] VITE_OPEN_FINANCE_PROVIDER="${provider}". Modo Pluggy inativo.`
    )
    return
  }

  await loadPluggyScript()

  if (!window.PluggyConnect) {
    throw new Error('O widget da Pluggy não pôde ser instanciado no navegador.')
  }

  const connectToken = await fetchPluggyConnectToken(options.itemId)

  const pluggyInstance = new window.PluggyConnect({
    connectToken,
    includeSandbox: false,
    onSuccess: async (data: PluggySuccessPayload) => {
      try {
        if (data?.item) {
          await persistPluggyConnection(userId, data.item)
          let syncResult: SyncPluggyResult | undefined
          try {
            syncResult = await syncPluggyTransactions(userId, data.item.id)
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
      console.warn('[OpenFinance] Feedback de erro amigável da Pluggy:', err)
      options.onError?.(err)
    },
    onClose: () => {
      options.onClose?.()
    },
  })

  if (typeof pluggyInstance.init === 'function') {
    pluggyInstance.init()
  } else if (typeof pluggyInstance.open === 'function') {
    pluggyInstance.open()
  }
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
