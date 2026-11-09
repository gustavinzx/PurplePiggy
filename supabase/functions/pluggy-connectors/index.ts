// Lista os bancos disponíveis (Brasil) com o estado de saúde e o selo Verificado/Beta.
// ATENÇÃO: confirme os nomes dos campos (health.status, type, isOpenFinance) com uma resposta real da Pluggy.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { getPluggyApiKey } from '../_shared/sync-runner.ts'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS' }
let cache: { at: number; data: unknown[] } | null = null

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const res = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
  try {
    const url = Deno.env.get('SUPABASE_URL'), key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !key) return res({ error: 'config' }, 500)
    const sb = createClient(url, key)
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    const { data: u } = await sb.auth.getUser(token)
    if (!u?.user?.id) return res({ error: 'unauthorized' }, 401)
    if (cache && Date.now() - cache.at < 10 * 60_000) return res({ connectors: cache.data })

    const base = Deno.env.get('PLUGGY_API_URL') || 'https://api.pluggy.ai'
    const apiKey = await getPluggyApiKey(sb, base)
    const r = await fetch(`${base}/connectors?countries=BR`, { headers: { 'X-API-KEY': apiKey } })
    if (!r.ok) return res({ error: 'pluggy' }, 502)
    const list = ((await r.json()).results ?? []) as any[]
    const { data: tiers } = await sb.from('open_finance_institutions').select('connector_id, tier')
    const tierOf = new Map((tiers ?? []).map((t: any) => [Number(t.connector_id), t.tier]))
    const data = list
      .filter((c) => /BANK/.test(String(c.type || '')))
      .map((c) => ({ id: c.id, name: c.name, imageUrl: c.imageUrl ?? null, status: c.health?.status ?? 'UNKNOWN', isOpenFinance: !!c.isOpenFinance, tier: tierOf.get(Number(c.id)) ?? 'beta' }))
      .filter((c) => c.status !== 'OFFLINE')
      .sort((a, b) => (a.tier === b.tier ? a.name.localeCompare(b.name) : a.tier === 'verified' ? -1 : 1))
    cache = { at: Date.now(), data }
    return res({ connectors: data })
  } catch (e) { console.error('[pluggy-connectors]', (e as Error).message); return res({ error: 'falha' }, 500) }
})
