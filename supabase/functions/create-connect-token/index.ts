// supabase/functions/create-connect-token/index.ts
// Supabase Edge Function para geração segura de connectToken da Pluggy (incluindo suporte a Sandbox e Produção)
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

    let clientUserId = 'purplepiggy-user'
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

    let reqBody: RequestBody = {}
    try {
      reqBody = await req.json()
    } catch {
      reqBody = {}
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
