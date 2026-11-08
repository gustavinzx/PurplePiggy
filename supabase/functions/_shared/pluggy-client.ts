// Cliente HTTP da Pluggy (API v2 de transações, paginação por cursor).
import type { PluggyAccount, PluggyTxn } from './pluggy-core.ts'
import type { PluggyClient } from './sync-engine.ts'

export function createPluggyClient(apiKey: string, baseUrl = 'https://api.pluggy.ai', fetchFn: typeof fetch = fetch): PluggyClient {
  const headers = { 'X-API-KEY': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' }

  async function getJson(url: string): Promise<any> {
    let last: Error | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetchFn(url, { headers })
      if (r.ok) return await r.json()
      if (r.status === 429 || r.status >= 500) { last = new Error(`Pluggy ${r.status}`); await new Promise((s) => setTimeout(s, 600 * (attempt + 1))); continue }
      throw new Error(`Pluggy ${r.status} em ${url.split('?')[0].replace(baseUrl, '')}`)
    }
    throw last ?? new Error('Falha na Pluggy')
  }

  return {
    getItem: (id) => getJson(`${baseUrl}/items/${id}`),
    async patchItem(id) {
      const r = await fetchFn(`${baseUrl}/items/${id}`, { method: 'PATCH', headers, body: '{}' })
      let code: string | undefined
      try { code = (await r.json())?.codeDescription } catch { /* sem corpo */ }
      return { ok: r.ok, status: r.status, code }
    },
    async listAccounts(itemId): Promise<PluggyAccount[]> {
      const out: PluggyAccount[] = []
      for (let page = 1; page <= 20; page++) {
        const j = await getJson(`${baseUrl}/accounts?itemId=${itemId}&page=${page}`)
        out.push(...(j.results ?? []))
        if (!j.totalPages || page >= j.totalPages) break
      }
      return out
    },
    async *listTransactions(accountId, { dateFrom }): AsyncGenerator<PluggyTxn[]> {
      let url: string | null = `${baseUrl}/v2/transactions?accountId=${accountId}&dateFrom=${encodeURIComponent(dateFrom + 'T00:00:00.000Z')}`
      while (url) {
        const j = await getJson(url)
        yield (j.results ?? []) as PluggyTxn[]
        url = j.next ? `${baseUrl}/v2/transactions${j.next}` : null // "next" já vem como query string pronta
      }
    },
  }
}
