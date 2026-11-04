// supabase/functions/create-connect-token/index.ts
// Supabase Edge Function: Geração de Connect Token e Sincronização Real de Dados da Pluggy
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface RequestBody {
  action?: 'token' | 'sync'
  itemId?: string
  userId?: string
  options?: {
    clientUserId?: string
    webhookUrl?: string
    oauthRedirectUri?: string
  }
}

// Mapeamento inteligente de transações bancárias para as categorias do PurplePiggy
function mapPluggyCategory(categoryName?: string, description: string = ''): string {
  const text = `${categoryName || ''} ${description}`.toLowerCase()

  if (
    text.includes('aluguel') ||
    text.includes('condom') ||
    text.includes('enel') ||
    text.includes('sabesp') ||
    text.includes('cpfl') ||
    text.includes('cemig') ||
    text.includes('luz') ||
    text.includes('água') ||
    text.includes('agua') ||
    text.includes('gás') ||
    text.includes('gas') ||
    text.includes('energia') ||
    text.includes('iptu') ||
    text.includes('housing') ||
    text.includes('utilities') ||
    text.includes('moradia')
  ) {
    return 'moradia'
  }

  if (
    text.includes('supermercado') ||
    text.includes('mercado') ||
    text.includes('hortifruti') ||
    text.includes('padaria') ||
    text.includes('açougue') ||
    text.includes('acougue') ||
    text.includes('restaurante') ||
    text.includes('lanchonete') ||
    text.includes('ifood') ||
    text.includes('rappi') ||
    text.includes('mcdonald') ||
    text.includes('burger') ||
    text.includes('pizza') ||
    text.includes('carrefour') ||
    text.includes('pão de açúcar') ||
    text.includes('extra') ||
    text.includes('assai') ||
    text.includes('atacad') ||
    text.includes('groceries') ||
    text.includes('food') ||
    text.includes('alimenta')
  ) {
    return 'alimentacao'
  }

  if (
    text.includes('uber') ||
    text.includes('99') ||
    text.includes('posto') ||
    text.includes('gasolina') ||
    text.includes('combust') ||
    text.includes('etanol') ||
    text.includes('estacionamento') ||
    text.includes('pedágio') ||
    text.includes('pedagio') ||
    text.includes('metrô') ||
    text.includes('metro') ||
    text.includes('ônibus') ||
    text.includes('onibus') ||
    text.includes('bilhete') ||
    text.includes('transporte') ||
    text.includes('transport')
  ) {
    return 'transporte'
  }

  if (
    text.includes('farmácia') ||
    text.includes('farmacia') ||
    text.includes('drogaria') ||
    text.includes('médic') ||
    text.includes('medic') ||
    text.includes('hospital') ||
    text.includes('laborat') ||
    text.includes('consulta') ||
    text.includes('exame') ||
    text.includes('saúde') ||
    text.includes('saude') ||
    text.includes('drogasil') ||
    text.includes('raia') ||
    text.includes('pague menos') ||
    text.includes('health') ||
    text.includes('pharmacy')
  ) {
    return 'saude'
  }

  if (
    text.includes('escola') ||
    text.includes('creche') ||
    text.includes('filho') ||
    text.includes('filha') ||
    text.includes('colégio') ||
    text.includes('colegio') ||
    text.includes('material escolar') ||
    text.includes('criança') ||
    text.includes('família') ||
    text.includes('familia')
  ) {
    return 'familia'
  }

  if (
    text.includes('cinema') ||
    text.includes('netflix') ||
    text.includes('spotify') ||
    text.includes('hbo') ||
    text.includes('disney') ||
    text.includes('show') ||
    text.includes('teatro') ||
    text.includes('viagem') ||
    text.includes('hotel') ||
    text.includes('praia') ||
    text.includes('jogos') ||
    text.includes('steam') ||
    text.includes('lazer') ||
    text.includes('entertainment') ||
    text.includes('recreation')
  ) {
    return 'lazer'
  }

  if (
    text.includes('shopping') ||
    text.includes('roupa') ||
    text.includes('calçado') ||
    text.includes('calcado') ||
    text.includes('magalu') ||
    text.includes('magazine') ||
    text.includes('amazon') ||
    text.includes('mercado livre') ||
    text.includes('shopee') ||
    text.includes('shein') ||
    text.includes('aliexpress') ||
    text.includes('zara') ||
    text.includes('renner') ||
    text.includes('riachuelo') ||
    text.includes('c&a') ||
    text.includes('loja') ||
    text.includes('shopping')
  ) {
    return 'compras'
  }

  if (
    text.includes('faculdade') ||
    text.includes('universidade') ||
    text.includes('curso') ||
    text.includes('livro') ||
    text.includes('livraria') ||
    text.includes('udemy') ||
    text.includes('alura') ||
    text.includes('educa') ||
    text.includes('education')
  ) {
    return 'educacao'
  }

  return 'outros'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || supabaseAnonKey

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Identificação do usuário logado via JWT
    let clientUserId = ''
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const jwtToken = authHeader.replace(/^Bearer\s+/i, '').trim()
      if (jwtToken && jwtToken !== supabaseAnonKey) {
        const { data: userData } = await supabase.auth.getUser(jwtToken)
        if (userData?.user?.id) {
          clientUserId = userData.user.id
        }
      }
    }

    let reqBody: RequestBody = {}
    try {
      reqBody = await req.json()
    } catch {
      reqBody = {}
    }

    if (!clientUserId && reqBody.userId) {
      clientUserId = reqBody.userId
    }

    // 2. Credenciais secretas da Pluggy
    const pluggyClientId =
      Deno.env.get('PLUGGY_CLIENT_ID') || '379a488b-3ed2-4e90-b703-abf8462a29a2'
    const pluggyClientSecret =
      Deno.env.get('PLUGGY_CLIENT_SECRET') || '8DVlYurRUncgycxEGSCR_09wadY3eJnx9uliuPhffg4'
    const pluggyApiUrl = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'

    if (!pluggyClientId || !pluggyClientSecret) {
      return new Response(
        JSON.stringify({
          error: 'Credenciais da Pluggy não configuradas.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Autenticação na Pluggy (Obter apiKey válida por 2 horas)
    const authResponse = await fetch(`${pluggyApiUrl}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        clientId: pluggyClientId,
        clientSecret: pluggyClientSecret,
      }),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('[Pluggy Edge] Erro de autenticação na Pluggy:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Falha ao autenticar na Pluggy.',
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { apiKey } = await authResponse.json()

    // 4. Se a ação for "sync": puxar contas e transações da Pluggy e injetar no PurplePiggy
    if (reqBody.action === 'sync') {
      let itemId = reqBody.itemId
      if (!itemId && clientUserId) {
        const { data: latestConn } = await supabase
          .from('bank_connections')
          .select('provider_ref')
          .eq('user_id', clientUserId)
          .eq('provider', 'pluggy')
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (latestConn?.provider_ref) {
          itemId = latestConn.provider_ref
        }
      }

      if (!itemId) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma conta bancária ativa encontrada para sincronizar.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!clientUserId) {
        return new Response(
          JSON.stringify({ error: 'Usuário não identificado para salvar transações.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`[Pluggy Sync] Iniciando sincronização para user=${clientUserId}, item=${itemId}`)

      // 4.1 Buscar dados do Item (Instituição conectada)
      let institutionName = 'Instituição Financeira'
      const itemResponse = await fetch(`${pluggyApiUrl}/items/${itemId}`, {
        headers: { 'X-API-KEY': apiKey },
      })
      if (itemResponse.ok) {
        const itemData = await itemResponse.json()
        institutionName = itemData.connector?.name || institutionName
      }

      // 4.2 Buscar contas do Item
      const accountsResponse = await fetch(`${pluggyApiUrl}/accounts?itemId=${itemId}`, {
        headers: { 'X-API-KEY': apiKey },
      })

      if (!accountsResponse.ok) {
        const errText = await accountsResponse.text()
        console.error('[Pluggy Sync] Erro ao buscar contas:', errText)
        return new Response(
          JSON.stringify({ error: 'Falha ao buscar contas na Pluggy.', details: errText }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const accountsData = await accountsResponse.json()
      const accounts = accountsData.results || []
      console.log(`[Pluggy Sync] ${accounts.length} contas encontradas.`)

      // Calcular saldo total líquido
      let totalBalance = 0
      for (const acc of accounts) {
        if (typeof acc.balance === 'number') {
          // Contas do tipo BANK contam para saldo
          if (acc.type === 'BANK') {
            totalBalance += acc.balance
          }
        }
      }

      // 4.3 Mapeamento de categorias existentes no Supabase
      const { data: dbCategories } = await supabase
        .from('categories')
        .select('id, slug')
        .is('user_id', null)

      const catMap: Record<string, string> = {}
      dbCategories?.forEach((c) => {
        catMap[c.slug] = c.id
      })
      const defaultCatId = catMap['outros'] || Object.values(catMap)[0]

      // 4.4 Buscar e sincronizar transações de cada conta
      let insertedTransactionsCount = 0

      for (const acc of accounts) {
        const txResponse = await fetch(
          `${pluggyApiUrl}/transactions?accountId=${acc.id}&pageSize=500`,
          {
            headers: { 'X-API-KEY': apiKey },
          }
        )

        if (txResponse.ok) {
          const txData = await txResponse.json()
          const pluggyTransactions = txData.results || []
          console.log(`[Pluggy Sync] Conta ${acc.id} (${acc.name}): ${pluggyTransactions.length} transações.`)

          for (const pt of pluggyTransactions) {
            const rawAmount = Number(pt.amount)
            if (isNaN(rawAmount) || rawAmount === 0) continue

            // No Pluggy, despesas são normalmente valores negativos ou marcadas como DEBIT
            const isExpense = rawAmount < 0 || pt.type === 'DEBIT'
            const amount = Math.abs(rawAmount)
            const type = isExpense ? 'expense' : 'income'
            const occurredOn = (pt.date || new Date().toISOString()).split('T')[0]
            const description = (pt.description || 'Transação bancária').trim()

            // Identificar categoria via texto e categoria da Pluggy
            const matchedSlug = mapPluggyCategory(pt.category, description)
            const categoryId = catMap[matchedSlug] || defaultCatId

            // Identificar método de pagamento
            let paymentMethod = 'other'
            const descUpper = description.toUpperCase()
            if (descUpper.includes('PIX') || pt.paymentData?.paymentMethod === 'PIX') {
              paymentMethod = 'pix'
            } else if (acc.type === 'CREDIT' || acc.subtype === 'CREDIT_CARD') {
              paymentMethod = 'credit_card'
            } else if (isExpense) {
              paymentMethod = 'debit_card'
            } else {
              paymentMethod = 'transfer'
            }

            // Verificar se transação já foi inserida para evitar duplicidade
            const { data: existing } = await supabase
              .from('transactions')
              .select('id')
              .eq('user_id', clientUserId)
              .eq('occurred_on', occurredOn)
              .eq('amount', amount)
              .eq('description', description)
              .limit(1)

            if (!existing || existing.length === 0) {
              const { error: insErr } = await supabase.from('transactions').insert({
                user_id: clientUserId,
                category_id: categoryId,
                type,
                description,
                amount,
                occurred_on: occurredOn,
                payment_method: paymentMethod,
                source: 'open_finance',
                notes: `Sincronizado via Pluggy (${acc.name || institutionName})`,
              })

              if (!insErr) {
                insertedTransactionsCount++
              } else {
                console.warn('[Pluggy Sync] Erro ao inserir transação:', insErr)
              }
            }
          }
        }
      }

      // 4.5 Atualizar conexão bancária
      await supabase.from('bank_connections').upsert(
        {
          user_id: clientUserId,
          institution_name: institutionName,
          account_label: `${institutionName} · Sincronizado (${accounts.length} contas)`,
          provider: 'pluggy',
          provider_ref: itemId,
          status: 'active',
          is_demo: false,
        },
        { onConflict: 'user_id,provider_ref' }
      )

      // 4.6 Atualizar saldo inicial/líquido no perfil do usuário
      if (totalBalance > 0) {
        await supabase
          .from('profiles')
          .update({ initial_balance: totalBalance })
          .eq('id', clientUserId)
      }

      console.log(`[Pluggy Sync] Sincronização concluída com sucesso! ${insertedTransactionsCount} transações adicionadas.`)

      return new Response(
        JSON.stringify({
          success: true,
          institutionName,
          accountsCount: accounts.length,
          transactionsCount: insertedTransactionsCount,
          totalBalance,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Default: Criação do Connect Token para abrir o widget
    const connectTokenPayload = {
      itemId: reqBody.itemId || undefined,
      options: {
        clientUserId: reqBody.options?.clientUserId || clientUserId || 'user',
        ...(reqBody.options || {}),
      },
    }

    const tokenResponse = await fetch(`${pluggyApiUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(connectTokenPayload),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('[Pluggy Edge] Erro ao criar connect_token:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Falha ao gerar o connectToken na Pluggy.',
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const tokenData = await tokenResponse.json()

    return new Response(
      JSON.stringify({
        accessToken: tokenData.accessToken,
        connectToken: tokenData.accessToken,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (err: any) {
    console.error('[Pluggy Edge] Erro inesperado:', err)
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao processar requisição da Pluggy.',
        message: err.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
