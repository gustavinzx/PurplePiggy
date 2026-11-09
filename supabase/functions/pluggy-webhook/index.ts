// Recebe webhooks da Pluggy. Registre-os com o header X-Webhook-Secret (veja INTEGRACAO.md).
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getPluggyApiKey, syncConnection } from '../_shared/sync-runner.ts'

const ok = (b: unknown = { ok: true }, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method !== 'POST') return ok({ error: 'method' }, 405)
  const secret = Deno.env.get('PLUGGY_WEBHOOK_SECRET')
  const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!secret || !url || !key) { console.error('[pluggy-webhook] configuração ausente'); return ok({ error: 'config' }, 500) }
  const headerSecret = req.headers.get('x-webhook-secret')
  const querySecret = new URL(req.url).searchParams.get('secret')
  if (headerSecret !== secret && querySecret !== secret) return ok({ error: 'unauthorized' }, 401)

  const evt = await req.json().catch(() => null)
  const eventId = evt?.eventId ?? evt?.id
  if (!evt?.event || !eventId) return ok({ error: 'payload' }, 400)
  const sb = createClient(url, key)

  // Idempotência: a Pluggy pode repetir o mesmo evento.
  const { error: dup } = await sb.from('pluggy_webhook_events').insert({ event_id: String(eventId), event: evt.event, item_id: evt.itemId ?? null })
  if (dup) return ok({ duplicate: true })

  const work = (async () => {
    try {
      const itemId = evt.itemId
      if (!itemId) return
      const { data: conn } = await sb.from('bank_connections').select('*').eq('provider', 'pluggy').eq('provider_ref', itemId).neq('status', 'revoked').maybeSingle()
      if (!conn) return
      if (evt.event === 'item/deleted') { await sb.from('bank_connections').update({ status: 'revoked' }).eq('id', conn.id); return }
      if (evt.event === 'transactions/deleted' && Array.isArray(evt.transactionIds)) {
        await sb.from('transactions').update({ archived_at: new Date().toISOString() }).eq('user_id', conn.user_id).in('external_id', evt.transactionIds.map(String))
        return
      }
      if (['item/updated', 'item/created', 'item/error', 'item/waiting_user_input', 'item/login_succeeded', 'transactions/created', 'transactions/updated'].includes(evt.event)) {
        const baseUrl = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'
        const apiKey = await getPluggyApiKey(sb, baseUrl)
        await syncConnection(sb, apiKey, baseUrl, conn, 'webhook')
      }
    } catch (e) {
      console.error('[pluggy-webhook] falhou:', (e as Error).message)
      await sb.from('pluggy_webhook_events').delete().eq('event_id', String(eventId)) // permite a Pluggy reenviar
    }
  })()
  const rt = (globalThis as any).EdgeRuntime
  if (rt?.waitUntil) rt.waitUntil(work); else await work
  return ok()
})
