import { describe, expect, it, vi } from 'vitest'
import * as api from '../services/api.js'

describe('retired feature client', () => {
  it('does not expose a chat operation', () => {
    expect(api).not.toHaveProperty('sendChatMessage')
  })

  it('preserves current-data requests with session cookies', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lastsport: 12 }) })
    vi.stubGlobal('fetch', fetch)
    try {
      expect(await api.fetchCurrentData()).toEqual({ lastsport: 12 })
      expect(fetch).toHaveBeenCalledWith('/api/current/', { credentials: 'include' })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
