// POST { action: 'sync' | 'revoke', connectionId, force?, full? }  — sempre UMA conexão por chamada.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getPluggyApiKey, syncConnection } from '../_shared/sync-runner.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) { console.error('[pluggy-sync] variáveis de ambiente ausentes'); return json({ error: 'Erro de configuração.' }, 500) }
    const sb = createClient(url, key)
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const { data: u, error: ue } = await sb.auth.getUser(token)
    if (ue || !u?.user?.id) return json({ error: 'Sessão inválida ou expirada.' }, 401)
    const userId = u.user.id

    const body = await req.json().catch(() => ({}))
    if (!body.connectionId) return json({ error: 'connectionId é obrigatório.' }, 400)
    const { data: conn } = await sb.from('bank_connections').select('*').eq('id', body.connectionId).eq('user_id', userId).maybeSingle()
    if (!conn || conn.provider !== 'pluggy' || !conn.provider_ref) return json({ error: 'Conexão não encontrada.' }, 404)

    const baseUrl = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'
    const apiKey = await getPluggyApiKey(sb, baseUrl)

    if (body.action === 'revoke') {
      await fetch(`${baseUrl}/items/${conn.provider_ref}`, { method: 'DELETE', headers: { 'X-API-KEY': apiKey } }).catch(() => null)
      await sb.from('bank_connections').update({ status: 'revoked', needs_user_action: false }).eq('id', conn.id)
      await sb.from('open_finance_consents').update({ status: 'revoked', revoked_at: new Date().toISOString() }).eq('connection_id', conn.id)
      const { data: accs } = await sb.from('bank_accounts').select('id').eq('connection_id', conn.id)
      const ids = (accs ?? []).map((a: any) => a.id)
      if (ids.length) {
        await sb.from('bank_accounts').update({ is_active: false }).in('id', ids)
        await sb.from('transactions').update({ archived_at: new Date().toISOString() }).eq('user_id', userId).in('bank_account_id', ids)
      }
      return json({ success: true })
    }

    const result = await syncConnection(sb, apiKey, baseUrl, conn, body.trigger === 'resume' ? 'resume' : 'manual', { force: !!body.force, full: !!body.full })
    return json(result, 200)
  } catch (e) {
    console.error('[pluggy-sync]', (e as Error).message)
    return json({ error: 'Não foi possível sincronizar agora. Tente de novo em instantes.' }, 500)
  }
})
