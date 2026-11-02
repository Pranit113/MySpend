const BASE = '/api'
const TOKEN_KEY = 'myspend_auth_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  },
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

let onUnauthorizedCallback = null
export const setOnUnauthorized = (cb) => {
  onUnauthorizedCallback = cb
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStorage.get()
  if (token) {
    headers['X-Auth-Token'] = token
  }

  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)

  if (res.status === 401) {
    tokenStorage.clear()
    if (onUnauthorizedCallback) onUnauthorizedCallback()
    const err = await res.json().catch(() => ({ error: 'Unauthorized. Please log in.' }))
    throw new Error(err.error || 'Unauthorized. Please log in.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || 'Request failed')
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Auth APIs
  getAuthStatus: () => request('GET', '/auth/status'),
  login: async (password) => {
    const res = await request('POST', '/auth/login', { password })
    if (res.token) {
      tokenStorage.set(res.token)
    }
    return res
  },
  setup: async (password) => {
    return request('POST', '/auth/setup', { password })
  },
  logout: async () => {
    try {
      await request('POST', '/auth/logout')
    } catch {
      // Ignore network errors on logout
    } finally {
      tokenStorage.clear()
    }
  },
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/auth/change-password', { currentPassword, newPassword }),

  // Financial APIs
  getDashboard: () => request('GET', '/dashboard'),

  getTransactions: (params = {}) => {
    const q = new URLSearchParams()
    if (params.startDate) q.set('startDate', params.startDate)
    if (params.endDate) q.set('endDate', params.endDate)
    if (params.type) q.set('type', params.type)
    const qs = q.toString()
    return request('GET', `/transactions${qs ? `?${qs}` : ''}`)
  },

  createTransaction: (data) => request('POST', '/transactions', data),
  updateTransaction: (id, data) => request('PUT', `/transactions/${id}`, data),
  deleteTransaction: (id) => request('DELETE', `/transactions/${id}`),

  getSettings: () => request('GET', '/settings'),
  updateSettings: (data) => request('PUT', '/settings', data),

  exportPdf: async (startDate, endDate) => {
    const url = `${BASE}/export/pdf?startDate=${startDate}&endDate=${endDate}`
    const headers = {}
    const token = tokenStorage.get()
    if (token) headers['X-Auth-Token'] = token

    const res = await fetch(url, { headers })
    if (res.status === 401) {
      tokenStorage.clear()
      if (onUnauthorizedCallback) onUnauthorizedCallback()
      throw new Error('Unauthorized. Please log in.')
    }
    if (!res.ok) throw new Error('PDF export failed')
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `myspend_${startDate}_to_${endDate}.pdf`
    link.click()
    URL.revokeObjectURL(link.href)
  },
}
