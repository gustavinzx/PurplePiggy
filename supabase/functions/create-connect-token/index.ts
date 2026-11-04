// supabase/functions/create-connect-token/index.ts
// Supabase Edge Function para geração segura de connectToken da Pluggy
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  itemId?: string
  options?: {
    clientUserId?: string
    webhookUrl?: string
    oauthRedirectUri?: string
  }
}

serve(async (req) => {
  // Tratamento de CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Identificação do usuário logado via JWT no header Authorization
    let clientUserId = 'demo-user'
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

    // 2. Leitura das credenciais secretas da Pluggy
    const pluggyClientId =
      Deno.env.get('PLUGGY_CLIENT_ID') || '379a488b-3ed2-4e90-b703-abf8462a29a2'
    const pluggyClientSecret =
      Deno.env.get('PLUGGY_CLIENT_SECRET') || '8DVlYurRUncgycxEGSCR_09wadY3eJnx9uliuPhffg4'
    const pluggyApiUrl = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'

    if (!pluggyClientId || !pluggyClientSecret) {
      return new Response(
        JSON.stringify({
          error:
            'Credenciais da Pluggy não configuradas. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nos Secrets do Supabase.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Autenticação na Pluggy (Obter apiKey temporária válida por 2 horas)
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
      console.error('[Pluggy Edge Function] Erro de autenticação na Pluggy:', errorText)
      return new Response(
        JSON.stringify({
          error: 'Falha ao autenticar na Pluggy.',
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { apiKey } = await authResponse.json()

    // 4. Criação do Connect Token
    let reqBody: RequestBody = {}
    try {
      reqBody = await req.json()
    } catch {
      reqBody = {}
    }

    const connectTokenPayload = {
      itemId: reqBody.itemId || undefined,
      options: {
        clientUserId: reqBody.options?.clientUserId || clientUserId,
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
      console.error('[Pluggy Edge Function] Erro ao criar connect_token:', errorText)
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
        connectToken: tokenData.accessToken, // alias conveniente
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
    console.error('[Pluggy Edge Function] Erro inesperado:', err)
    return new Response(
      JSON.stringify({
        error: 'Erro interno no servidor ao processar token do Open Finance.',
        message: err.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
