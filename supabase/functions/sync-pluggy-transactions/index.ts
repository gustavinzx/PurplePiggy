// supabase/functions/sync-pluggy-transactions/index.ts
// Supabase Edge Function para sincronização real, contínua e idempotente de transações e contas bancárias via Pluggy Open Finance (API v2)
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  action?: 'sync' | 'connect_sandbox' | 'clean_fake_data' | 'create_oauth_item'
  itemId?: string
  userId?: string
  connectorId?: number
  cpf?: string
}

// IDs oficiais das categorias do PurplePiggy no banco de dados
const CATEGORY_MAP: Record<string, string> = {
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

function resolveCategoryId(desc: string, pluggyCat?: string): string {
  const text = `${desc} ${pluggyCat || ''}`.toLowerCase()

  if (/supermercado|mercado|alimenta|restaurante|padaria|ifood|lanche|comida|food|refeicao|acougue|hortifruti|coffee|cafe|grocer|eating/.test(text)) {
    return CATEGORY_MAP.alimentacao
  }
  if (/uber|99app|99|posto|combustivel|gasolina|etanol|pedagio|estacionamento|metro|onibus|transporte|corrida|parking|taxi|automotive/.test(text)) {
    return CATEGORY_MAP.transporte
  }
  if (/aluguel|condominio|enel|copel|sabesp|comgas|luz|energia|agua|gas|internet|iptu|moradia|habitacao|rent|electricity|housing|utilities/.test(text)) {
    return CATEGORY_MAP.moradia
  }
  if (/farmacia|drogaria|hospital|clinica|medico|saude|dentista|laboratorio|consulta|remedio|droga|health|pharmacy|healthcare/.test(text)) {
    return CATEGORY_MAP.saude
  }
  if (/faculdade|curso|escola|livraria|livro|udemy|alura|educacao|idiomas|mensalidade|education/.test(text)) {
    return CATEGORY_MAP.educacao
  }
  if (/netflix|spotify|cinema|show|viagem|hotel|airbnb|jogos|steam|playstation|lazer|bar|festa|entretenimento|entertainment|travel/.test(text)) {
    return CATEGORY_MAP.lazer
  }
  if (/amazon|mercado livre|shopee|magalu|magazine|shopping|loja|vestuario|roupa|eletronico|compras|varejo|store|merchandise/.test(text)) {
    return CATEGORY_MAP.compras
  }
  if (/pet|veterinario|racao|filhos|bebe|familia/.test(text)) {
    return CATEGORY_MAP.familia
  }

  return CATEGORY_MAP.outros
}

function resolvePaymentMethod(desc: string, acctType?: string): 'pix' | 'credit_card' | 'debit_card' | 'cash' | 'boleto' | 'transfer' | 'other' {
  const text = `${desc} ${acctType || ''}`.toLowerCase()
  if (/pix/.test(text)) return 'pix'
  if (/credito|credit/.test(text)) return 'credit_card'
  if (/boleto|slip/.test(text)) return 'boleto'
  if (/ted|doc|transf/.test(text)) return 'transfer'
  return 'debit_card'
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const PREWARMED_SANDBOX_ITEM_ID = '3c5c8c8b-8a09-4b2b-8a50-eadcc7ca1475'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      if (!supabaseUrl) console.error('[sync-pluggy-transactions] Variável ausente: SUPABASE_URL')
      if (!supabaseServiceKey) console.error('[sync-pluggy-transactions] Variável ausente: SUPABASE_SERVICE_ROLE_KEY')
      return new Response(
        JSON.stringify({ error: 'Erro de configuração interna do servidor.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Identificar usuário autenticado obrigatoriamente via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Acesso não autorizado. Token ausente.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jwtToken = authHeader.replace(/^Bearer\s+/i, '').trim()
    const { data: userData, error: userError } = await supabase.auth.getUser(jwtToken)
    if (userError || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida ou expirada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetUserId = userData.user.id

    let reqBody: RequestBody = {}
    try {
      reqBody = await req.json()
    } catch {
      reqBody = {}
    }

    if (reqBody.action === 'clean_fake_data') {
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', targetUserId)
        .eq('description', 'Renda mensal')

      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', targetUserId)
        .ilike('notes', '%Pluggy Bank%')

      const { data: fakeConns } = await supabase
        .from('bank_connections')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('institution_name', 'Pluggy Bank')

      if (fakeConns && fakeConns.length > 0) {
        const fakeIds = fakeConns.map((c: any) => c.id)
        await supabase.from('open_finance_consents').delete().in('connection_id', fakeIds)
        await supabase.from('bank_connections').delete().in('id', fakeIds)
      }

      await supabase
        .from('profiles')
        .update({ initial_balance: 0 })
        .eq('id', targetUserId)

      return new Response(
        JSON.stringify({ success: true, message: 'Dados de teste removidos com sucesso.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Autenticação na API da Pluggy
    let pluggyClientId = Deno.env.get('PLUGGY_CLIENT_ID')
    let pluggyClientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET')
    const pluggyApiUrl = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'

    if (!pluggyClientId || !pluggyClientSecret) {
      try {
        const { data: dbId } = await supabase.rpc('get_app_secret', { p_name: 'PLUGGY_CLIENT_ID' })
        const { data: dbSec } = await supabase.rpc('get_app_secret', { p_name: 'PLUGGY_CLIENT_SECRET' })
        if (dbId) pluggyClientId = dbId
        if (dbSec) pluggyClientSecret = dbSec
      } catch (secErr) {
        console.warn('[sync-pluggy-transactions] Falha ao recuperar credenciais seguras do banco:', secErr)
      }
    }

    if (!pluggyClientId || !pluggyClientSecret) {
      if (!pluggyClientId) console.error('[sync-pluggy-transactions] Variável ausente: PLUGGY_CLIENT_ID')
      if (!pluggyClientSecret) console.error('[sync-pluggy-transactions] Variável ausente: PLUGGY_CLIENT_SECRET')
      return new Response(
        JSON.stringify({ error: 'Serviço de sincronização indisponível no momento.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authRes = await fetch(`${pluggyApiUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ clientId: pluggyClientId, clientSecret: pluggyClientSecret }),
    })

    if (!authRes.ok) {
      const errText = await authRes.text()
      console.error('[SyncPluggy] Erro de autenticação na Pluggy:', errText)
      return new Response(
        JSON.stringify({ error: 'Falha ao autenticar com a Pluggy.', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { apiKey } = await authRes.json()
    const pluggyHeaders = {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    // 2.5 Criação direta de item Open Finance
    if (reqBody.action === 'create_oauth_item') {
      const cleanCpf = String(reqBody.cpf || '').replace(/\D/g, '')
      const connectorId = Number(reqBody.connectorId || 612)

      if (cleanCpf.length !== 11) {
        return new Response(
          JSON.stringify({ error: 'Digite um CPF válido com 11 números.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const createRes = await fetch(`${pluggyApiUrl}/items`, {
        method: 'POST',
        headers: pluggyHeaders,
        body: JSON.stringify({
          connectorId,
          parameters: { cpf: cleanCpf },
          clientUserId: targetUserId,
        }),
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error('[SyncPluggy] Erro ao criar item Open Finance:', errText)
        return new Response(
          JSON.stringify({ error: 'Não foi possível iniciar a conexão com este banco. Verifique seu CPF.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const createdItem = await createRes.json()
      const newItemId = createdItem.id
      let institutionName = createdItem.connector?.name || 'Banco Open Finance'
      let oauthUrl: string | null = null

      // Aguardar até a Pluggy gerar a URL oficial de autorização OAuth do banco
      for (let i = 0; i < 12; i++) {
        await sleep(600)
        const checkRes = await fetch(`${pluggyApiUrl}/items/${newItemId}`, {
          headers: pluggyHeaders,
        })
        if (checkRes.ok) {
          const itemInfo = await checkRes.json()
          if (itemInfo?.connector?.name) {
            institutionName = itemInfo.connector.name
          }
          if (itemInfo?.status === 'LOGIN_ERROR') {
            const msg =
              itemInfo?.error?.providerMessage === 'The CPF/CNPJ is invalid'
                ? 'O CPF informado é inválido. Confira os 11 dígitos do seu CPF.'
                : itemInfo?.error?.providerMessage || 'CPF recusado pela instituição bancária.'
            return new Response(
              JSON.stringify({ error: msg }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          const candidateUrl =
            itemInfo?.parameter?.data ||
            itemInfo?.userAction?.attributes?.url ||
            itemInfo?.userAction?.url ||
            null
          if (candidateUrl && String(candidateUrl).startsWith('http')) {
            oauthUrl = String(candidateUrl)
            break
          }
        }
      }

      // Salvar imediatamente a conexão no banco
      const { data: savedConn } = await supabase
        .from('bank_connections')
        .upsert(
          {
            user_id: targetUserId,
            institution_name: institutionName,
            account_label: `${institutionName} · Aguardando confirmação no app do banco`,
            provider: 'pluggy',
            provider_ref: newItemId,
            status: 'active',
            is_demo: false,
          },
          { onConflict: 'user_id,provider_ref' }
        )
        .select('id')
        .maybeSingle()

      if (savedConn?.id) {
        const oneYearExpiry = new Date()
        oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1)
        await supabase.from('open_finance_consents').insert({
          user_id: targetUserId,
          connection_id: savedConn.id,
          scopes: ['accounts', 'transactions', 'credit_cards'],
          status: 'authorized',
          expires_at: oneYearExpiry.toISOString(),
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          itemId: newItemId,
          institutionName,
          oauthUrl,
          message: oauthUrl
            ? `Link de autorização do ${institutionName} gerado com sucesso!`
            : `Solicitação enviada ao ${institutionName}.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Determinar os itemIds a sincronizar
    let itemIds: string[] = []
    if (reqBody.action === 'connect_sandbox') {
      let sandboxItemId = ''
      const checkPrewarmed = await fetch(`${pluggyApiUrl}/items/${PREWARMED_SANDBOX_ITEM_ID}`, {
        headers: pluggyHeaders,
      })
      if (checkPrewarmed.ok) {
        const preItem = await checkPrewarmed.json()
        if (preItem?.id && preItem?.status === 'UPDATED') {
          sandboxItemId = preItem.id
        }
      }

      if (!sandboxItemId) {
        const createRes = await fetch(`${pluggyApiUrl}/items`, {
          method: 'POST',
          headers: pluggyHeaders,
          body: JSON.stringify({
            connectorId: 2,
            parameters: { user: 'user-ok', password: 'password-ok' },
          }),
        })
        if (createRes.ok) {
          const created = await createRes.json()
          sandboxItemId = created.id
        }
      }

      if (sandboxItemId) {
        itemIds = [sandboxItemId]
      }
    } else if (reqBody.itemId) {
      // Sincronização individual solicitada pelo usuário para uma conta específica
      itemIds = [reqBody.itemId]
    } else {
      // Sincronização de todas as contas ativas
      const { data: userConns } = await supabase
        .from('bank_connections')
        .select('provider_ref')
        .eq('user_id', targetUserId)
        .eq('provider', 'pluggy')
        .neq('status', 'revoked')

      itemIds = (userConns || []).map((c: any) => c.provider_ref).filter(Boolean)
    }

    if (itemIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          syncedAccounts: 0,
          syncedTransactions: 0,
          message: 'Nenhuma conexão bancária ativa da Pluggy encontrada para sincronizar.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalSyncedTransactions = 0
    let totalSyncedAccounts = 0
    const todayStr = new Date().toISOString().split('T')[0]
    const currentMonthPrefix = todayStr.slice(0, 7)

    let pendingOAuthUrl: string | null = null
    let lastInstitutionName = 'Banco Open Finance'

    // Carregar todas as transações Open Finance já salvas do usuário para deduplicação precisa por conteúdo
    const { data: existingUserTxs } = await supabase
      .from('transactions')
      .select('id, external_id, description, amount, occurred_on')
      .eq('user_id', targetUserId)
      .eq('source', 'open_finance')

    const existingByExternalId = new Map<string, string>()
    const existingByContent = new Map<string, string>()

    for (const et of existingUserTxs || []) {
      if (et.external_id) {
        existingByExternalId.set(String(et.external_id), et.id)
      }
      const key = `${et.description.trim()}|${Number(et.amount).toFixed(2)}|${et.occurred_on}`
      if (!existingByContent.has(key)) {
        existingByContent.set(key, et.id)
      }
    }

    // 4. Processar cada itemId
    for (const itemId of itemIds) {
      let accounts: any[] = []
      let institutionName = 'Pluggy Bank'

      // Tentar acionar atualização no item (PATCH /items/{id})
      // Se a Pluggy responder 409 (CLIENT_IS_UPDATING_BEFORE_ALLOWED_FREQUENCY),
      // significa que atualizou recentemente (< 1h) e podemos ler os dados existentes normalmente.
      try {
        const patchRes = await fetch(`${pluggyApiUrl}/items/${itemId}`, {
          method: 'PATCH',
          headers: pluggyHeaders,
          body: JSON.stringify({}),
        })
        if (!patchRes.ok && patchRes.status !== 409) {
          console.warn(`[SyncPluggy] PATCH item ${itemId} retornou status ${patchRes.status}`)
        }
      } catch (pErr) {
        console.warn(`[SyncPluggy] Falha no PATCH item ${itemId}:`, pErr)
      }

      for (let attempt = 0; attempt < 6; attempt++) {
        let itemStatus = 'UPDATING'
        try {
          const itemRes = await fetch(`${pluggyApiUrl}/items/${itemId}`, { headers: pluggyHeaders })
          if (itemRes.ok) {
            const itemInfo = await itemRes.json()
            if (itemInfo?.connector?.name) {
              institutionName = itemInfo.connector.name
              lastInstitutionName = institutionName
            }
            itemStatus = itemInfo?.status || 'UPDATING'
            const candidateUrl =
              itemInfo?.parameter?.data ||
              itemInfo?.userAction?.attributes?.url ||
              itemInfo?.userAction?.url ||
              null
            if (candidateUrl && String(candidateUrl).startsWith('http')) {
              pendingOAuthUrl = String(candidateUrl)
            }
          }
        } catch {
          // ignore
        }

        if (itemStatus === 'LOGIN_ERROR' || itemStatus === 'WAITING_USER_INPUT') {
          break
        }

        const accountsRes = await fetch(`${pluggyApiUrl}/accounts?itemId=${itemId}`, {
          headers: pluggyHeaders,
        })
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          accounts = accountsData.results || []
          if (accounts.length > 0 && (itemStatus === 'UPDATED' || itemStatus === 'OUTDATED' || attempt >= 1)) {
            break
          }
        }

        await sleep(800)
      }

      if (accounts.length === 0) {
        continue
      }

      totalSyncedAccounts += accounts.length
      let itemTotalBalance = 0

      for (const account of accounts) {
        if (typeof account.balance === 'number' && account.type !== 'CREDIT') {
          itemTotalBalance += account.balance
        }

        // Endpoint oficial /v2/transactions da Pluggy
        const txnsRes = await fetch(
          `${pluggyApiUrl}/v2/transactions?accountId=${account.id}`,
          { headers: pluggyHeaders }
        )

        if (!txnsRes.ok) {
          console.warn(`[SyncPluggy] Falha ao obter /v2/transactions para conta ${account.id}: ${txnsRes.status}`)
          continue
        }

        const txnsData = await txnsRes.json()
        const isSandboxBank = institutionName.toLowerCase().includes('pluggy bank')

        // Filtrar pagamentos internos de fatura em contas de cartão de crédito
        const filteredResults = (txnsData.results || []).filter((t: any) => {
          if (account.type === 'CREDIT') {
            const descLower = String(t.description || '').toLowerCase()
            const catLower = String(t.category || '').toLowerCase()
            if (
              t.type === 'CREDIT' ||
              (typeof t.amount === 'number' && t.amount < 0) ||
              catLower.includes('credit card payment') ||
              descLower.includes('pagamento recebido') ||
              descLower.includes('encerramento de dívida')
            ) {
              return false
            }
          }
          return true
        })

        const rawTxns = filteredResults.slice(0, 30)

        if (rawTxns.length > 0) {
          const hasCurrentMonth = rawTxns.some((t: any) =>
            (t.date || '').startsWith(currentMonthPrefix)
          )

          for (let idx = 0; idx < rawTxns.length; idx++) {
            const txn = rawTxns[idx]
            const isDebit =
              txn.type === 'DEBIT' ||
              account.type === 'CREDIT' ||
              (typeof txn.amount === 'number' && txn.amount < 0)
            const type = isDebit ? 'expense' : 'income'
            const amount = Math.abs(Number(txn.amount || 0))
            const cleanDesc = (txn.description || 'Transação Open Finance').trim().slice(0, 140)

            let occurredOn = txn.date ? txn.date.split('T')[0] : todayStr
            if ((isSandboxBank && !hasCurrentMonth) || occurredOn > todayStr) {
              const d = new Date()
              d.setDate(Math.max(1, d.getDate() - (idx % 5)))
              occurredOn = d.toISOString().split('T')[0]
            }

            const categoryId = resolveCategoryId(cleanDesc, txn.category)
            const paymentMethod = resolvePaymentMethod(cleanDesc, account.type)
            const externalIdStr = String(txn.id)
            const contentKey = `${cleanDesc}|${amount.toFixed(2)}|${occurredOn}`

            // Deduplicação inteligente
            const existingId =
              existingByExternalId.get(externalIdStr) || existingByContent.get(contentKey)

            if (existingId) {
              // Já existe: atualizar apenas metadados se necessário, nunca duplicar
              await supabase
                .from('transactions')
                .update({
                  external_id: externalIdStr,
                  account_id: String(account.id),
                  category_id: categoryId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingId)

              existingByExternalId.set(externalIdStr, existingId)
              existingByContent.set(contentKey, existingId)
            } else {
              // Nova transação
              const { data: inserted, error: insErr } = await supabase
                .from('transactions')
                .insert({
                  user_id: targetUserId,
                  amount: amount > 0 ? amount : 0.01,
                  type,
                  description: cleanDesc,
                  occurred_on: occurredOn,
                  category_id: categoryId,
                  payment_method: paymentMethod,
                  source: 'open_finance',
                  external_id: externalIdStr,
                  account_id: String(account.id),
                  notes: txn.category
                    ? `Open Finance (${institutionName}) · ${txn.category}`
                    : `Open Finance (${institutionName})`,
                })
                .select('id')
                .maybeSingle()

              if (!insErr && inserted?.id) {
                existingByExternalId.set(externalIdStr, inserted.id)
                existingByContent.set(contentKey, inserted.id)
                totalSyncedTransactions++
              }
            }
          }
        }
      }

      // 5. Atualizar bank_connections para este itemId específico
      const { data: savedConn } = await supabase
        .from('bank_connections')
        .upsert(
          {
            user_id: targetUserId,
            institution_name: institutionName,
            account_label: `${institutionName} · Sincronizado via Open Finance`,
            provider: 'pluggy',
            provider_ref: itemId,
            balance: itemTotalBalance,
            last_synced_at: new Date().toISOString(),
            status: 'active',
            is_demo: false,
          },
          { onConflict: 'user_id,provider_ref' }
        )
        .select('id')
        .maybeSingle()

      if (savedConn?.id) {
        const oneYearExpiry = new Date()
        oneYearExpiry.setFullYear(oneYearExpiry.getFullYear() + 1)
        await supabase.from('open_finance_consents').insert({
          user_id: targetUserId,
          connection_id: savedConn.id,
          scopes: ['accounts', 'transactions', 'credit_cards'],
          status: 'authorized',
          expires_at: oneYearExpiry.toISOString(),
        })
      }
    }

    // 6. Alinhar initial_balance consolidando TODAS as contas bancárias ativas do usuário
    // Isso garante que se o usuário sincronizar uma conta por uma, as outras contas NUNCA se perdem!
    const { data: allActiveConns } = await supabase
      .from('bank_connections')
      .select('balance')
      .eq('user_id', targetUserId)
      .eq('status', 'active')

    const totalActiveBanksBalance = (allActiveConns || []).reduce(
      (acc: number, c: any) => acc + (typeof c.balance === 'number' ? c.balance : 0),
      0
    )

    const { data: monthTxs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', targetUserId)
      .gte('occurred_on', `${currentMonthPrefix}-01`)

    let monthNet = 0
    for (const mt of monthTxs || []) {
      if (mt.type === 'income') monthNet += Number(mt.amount || 0)
      if (mt.type === 'expense') monthNet -= Number(mt.amount || 0)
    }

    const adjustedInitialBalance = Number((totalActiveBanksBalance - monthNet).toFixed(2))
    await supabase
      .from('profiles')
      .update({ initial_balance: adjustedInitialBalance })
      .eq('id', targetUserId)

    if (totalSyncedAccounts === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          pendingAuth: true,
          itemId: itemIds[0],
          oauthUrl: pendingOAuthUrl,
          syncedAccounts: 0,
          syncedTransactions: 0,
          message: `Aguardando autorização no aplicativo do ${lastInstitutionName}. Confirme o Open Finance no seu banco e toque em Sincronizar!`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        pendingAuth: false,
        itemId: itemIds[0],
        institutionName: lastInstitutionName,
        totalBalance: totalActiveBanksBalance,
        syncedAccounts: totalSyncedAccounts,
        syncedTransactions: totalSyncedTransactions,
        message:
          totalSyncedTransactions > 0
            ? `${totalSyncedTransactions} novos lançamentos e saldo sincronizados com sucesso!`
            : `${lastInstitutionName} e saldo em dia (${totalSyncedAccounts} conta(s) verificada(s)).`,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('[SyncPluggy] Erro inesperado:', err)
    return new Response(
      JSON.stringify({ error: 'Erro interno ao sincronizar transações.', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
