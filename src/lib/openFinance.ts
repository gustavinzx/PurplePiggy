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

export interface OpenFinanceConnectOptions {
  onSuccess?: (item: PluggyItem) => void
  onError?: (error: any) => void
  onClose?: () => void
  itemId?: string
}

export interface SyncPluggyResult {
  success: boolean
  institutionName: string
  accountsCount: number
  transactionsCount: number
  totalBalance: number
  error?: string
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
 * Sincroniza contas e transações da Pluggy em tempo real com o banco de dados do PurplePiggy.
 */
export const syncPluggyData = async (
  userId: string,
  itemId?: string
): Promise<SyncPluggyResult> => {
  const { data, error } = await supabase.functions.invoke('create-connect-token', {
    body: {
      action: 'sync',
      itemId,
      userId,
    },
  })

  if (error || !data?.success) {
    const msg = error?.message || data?.error || 'Erro ao sincronizar extrato bancário.'
    console.error('[OpenFinance] Erro na sincronização:', msg)
    throw new Error(msg)
  }

  return data as SyncPluggyResult
}

/**
 * Salva a conexão bancária e os consentimentos nas tabelas oficiais do Supabase.
 */
export const persistPluggyConnection = async (
  userId: string,
  item: PluggyItem
): Promise<{ connectionId: string }> => {
  const institutionName = item.connector?.name || 'Instituição Financeira'
  const isConnected =
    item.status === 'UPDATED' || item.status === 'UPDATING' || item.status === 'COMPLETED'

  // 1. Salvar ou atualizar conexão em bank_connections
  const { data: conn, error: connErr } = await supabase
    .from('bank_connections')
    .upsert(
      {
        user_id: userId,
        institution_name: institutionName,
        account_label: `${institutionName} · Sincronizado via Open Finance`,
        provider: 'pluggy',
        provider_ref: item.id,
        status: isConnected ? 'active' : 'pending',
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

  // 2. Registrar o consentimento de 12 meses em open_finance_consents
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
 * Abre o widget oficial da Pluggy Connect.
 * Se VITE_OPEN_FINANCE_PROVIDER não for 'pluggy', executa a rotina padrão/mock de desenvolvimento.
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

  // 1. Carrega o script
  await loadPluggyScript()

  if (!window.PluggyConnect) {
    throw new Error('O widget da Pluggy não pôde ser instanciado no navegador.')
  }

  // 2. Obtém o connectToken via Supabase Edge Function
  const connectToken = await fetchPluggyConnectToken(options.itemId)

  // 3. Inicializa o PluggyConnect
  const pluggyInstance = new window.PluggyConnect({
    connectToken,
    includeSandbox: true,
    onSuccess: async (data: PluggySuccessPayload) => {
      try {
        if (data?.item) {
          await persistPluggyConnection(userId, data.item)
          // Executa sincronização real imediata
          try {
            await syncPluggyData(userId, data.item.id)
          } catch (syncErr) {
            console.warn('[OpenFinance] Sincronização pós-conexão em background:', syncErr)
          }
          options.onSuccess?.(data.item)
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

  // 4. Exibe o modal do widget
  if (typeof pluggyInstance.init === 'function') {
    pluggyInstance.init()
  } else if (typeof pluggyInstance.open === 'function') {
    pluggyInstance.open()
  }
}
