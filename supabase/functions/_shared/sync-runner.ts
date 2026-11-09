// Junta tudo: usado pela função pluggy-sync (usuária) e pluggy-webhook (Pluggy).
import { createPluggyClient } from './pluggy-client.ts'
import { createSupabaseRepo } from './supabase-repo.ts'
import { runSync, SyncResult } from './sync-engine.ts'

export async function getPluggyApiKey(sb: any, baseUrl: string): Promise<string> {
  let id = (globalThis as any).Deno?.env.get('PLUGGY_CLIENT_ID')
  let secret = (globalThis as any).Deno?.env.get('PLUGGY_CLIENT_SECRET')
  if (!id || !secret) {
    const a = await sb.rpc('get_app_secret', { p_name: 'PLUGGY_CLIENT_ID' })
    const b = await sb.rpc('get_app_secret', { p_name: 'PLUGGY_CLIENT_SECRET' })
    id = a.data; secret = b.data
  }
  if (!id || !secret) throw new Error('Credenciais da Pluggy ausentes')
  const r = await fetch(`${baseUrl}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: id, clientSecret: secret }) })
  if (!r.ok) throw new Error(`Autenticação na Pluggy falhou (${r.status})`)
  return (await r.json()).apiKey as string
}

export async function syncConnection(sb: any, apiKey: string, baseUrl: string, conn: any, trigger: 'manual' | 'webhook' | 'resume' | 'cron', opts: { force?: boolean; full?: boolean } = {}): Promise<SyncResult> {
  return runSync(
    { pluggy: createPluggyClient(apiKey, baseUrl), repo: createSupabaseRepo(sb) },
    {
      userId: conn.user_id, connectionId: conn.id, itemId: conn.provider_ref, connectorId: conn.connector_id ?? null,
      institutionName: conn.institution_name, transactionsLastOkAt: conn.transactions_last_ok_at ?? null, trigger, force: opts.force, full: opts.full,
    },
  )
}
