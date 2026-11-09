// src/lib/openFinanceSync.test.ts
// Garante que o polling de sincronização não dispara chamadas duplicadas ao pluggy-sync.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const invoke = vi.fn()
vi.mock('./supabase', () => ({ supabase: { functions: { invoke: (...a: unknown[]) => invoke(...a) } } }))

import { pollSyncUntilDone, type SyncResult } from './openFinance'

const result = (state: SyncResult['state']): SyncResult =>
  ({ state, message: '', missing: [], products: {}, accounts: [], errors: [], nextAllowedAt: null, incomplete: false, runId: null }) as SyncResult

describe('pollSyncUntilDone', () => {
  beforeEach(() => invoke.mockReset())

  it('reaproveita o resultado inicial e só chama o servidor em modo resume', async () => {
    invoke.mockResolvedValue({ data: result('ok'), error: null })
    vi.useFakeTimers()
    const p = pollSyncUntilDone('conn-1', undefined, 90_000, result('updating'))
    await vi.runAllTimersAsync()
    const final = await p
    vi.useRealTimers()

    expect(final.state).toBe('ok')
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke.mock.calls[0][1].body).toMatchObject({ action: 'sync', connectionId: 'conn-1', trigger: 'resume' })
  })

  it('sem resultado inicial, faz a primeira chamada e encerra quando já está ok', async () => {
    invoke.mockResolvedValue({ data: result('ok'), error: null })
    const final = await pollSyncUntilDone('conn-2')
    expect(final.state).toBe('ok')
    expect(invoke).toHaveBeenCalledTimes(1)
  })
})
