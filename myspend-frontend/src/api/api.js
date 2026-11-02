const TOKEN_KEY = 'myspend_auth_token'
const BACKEND_URL_KEY = 'myspend_backend_url'
const LOCAL_DB_KEY = 'myspend_local_db_v2'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  },
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const backendUrlStorage = {
  get: () => localStorage.getItem(BACKEND_URL_KEY) || '',
  set: (url) => {
    if (url) localStorage.setItem(BACKEND_URL_KEY, url.trim().replace(/\/+$/, ''))
    else localStorage.removeItem(BACKEND_URL_KEY)
  },
}

let onUnauthorizedCallback = null
export const setOnUnauthorized = (cb) => {
  onUnauthorizedCallback = cb
}

// Local datastore for standalone / GitHub Pages offline preview mode
function getLocalDb() {
  const raw = localStorage.getItem(LOCAL_DB_KEY)
  if (raw) {
    try {
      return JSON.parse(raw)
    } catch {
      // ignore
    }
  }
  const initial = {
    hasPassword: false,
    password: null,
    settings: {
      monthlyBudget: 15000,
      openingBalance: 25000,
      currency: 'INR',
    },
    transactions: [
      {
        id: 1,
        amount: 5000,
        type: 'INCOME',
        source: 'Parents',
        category: null,
        description: 'Monthly pocket money',
        transactionDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        amount: 450,
        type: 'EXPENSE',
        source: null,
        category: 'Food',
        description: 'Lunch with friends',
        transactionDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        amount: 1200,
        type: 'EXPENSE',
        source: null,
        category: 'Shopping',
        description: 'Study materials and books',
        transactionDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    ],
  }
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(initial))
  return initial
}

function saveLocalDb(db) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db))
}

export function isStaticHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  const custom = backendUrlStorage.get()
  // If custom backend URL is provided, try that first
  if (custom) return false
  // GitHub Pages or non-local hosts without custom backend are static
  return host.includes('github.io') || host.includes('vercel.app')
}

let isUsingLocalMode = isStaticHost()
export const getIsUsingLocalMode = () => isUsingLocalMode

function getBaseUrl() {
  const custom = backendUrlStorage.get()
  if (custom) return custom + '/api'
  return '/api'
}

async function tryServerRequest(method, path, body) {
  const base = getBaseUrl()
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStorage.get()
  if (token) headers['X-Auth-Token'] = token

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3000)

  const opts = { method, headers, signal: controller.signal }
  if (body !== undefined) opts.body = JSON.stringify(body)

  try {
    const res = await fetch(base + path, opts)
    clearTimeout(timeoutId)

    if (res.status === 401) {
      tokenStorage.clear()
      if (onUnauthorizedCallback) onUnauthorizedCallback()
      const err = await res.json().catch(() => ({ error: 'Unauthorized' }))
      const error = new Error(err.error || 'Unauthorized. Please log in.')
      error.status = 401
      throw error
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const error = new Error(err.error || `Request failed (${res.status})`)
      error.status = res.status
      throw error
    }

    if (res.status === 204) return null
    return await res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

// Local in-browser execution with exact same data model & business logic
function executeLocal(action, payload) {
  isUsingLocalMode = true
  const db = getLocalDb()

  switch (action) {
    case 'getAuthStatus': {
      return { hasPassword: !!db.password }
    }
    case 'login': {
      if (!db.password) {
        throw new Error('No password set. Please setup master password first.')
      }
      if (db.password !== payload.password) {
        throw new Error('Incorrect master password.')
      }
      const token = 'local-token-' + Date.now()
      tokenStorage.set(token)
      return { token }
    }
    case 'setup': {
      db.password = payload.password
      db.hasPassword = true
      saveLocalDb(db)
      return { message: 'Master password set successfully.' }
    }
    case 'logout': {
      tokenStorage.clear()
      return null
    }
    case 'changePassword': {
      if (db.password !== payload.currentPassword) {
        throw new Error('Current password is incorrect.')
      }
      db.password = payload.newPassword
      saveLocalDb(db)
      tokenStorage.clear()
      return { message: 'Password updated. Please log in.' }
    }
    case 'getDashboard': {
      const now = new Date()
      const curYear = now.getFullYear()
      const curMonth = now.getMonth()

      let totalIncome = 0
      let totalExpense = 0
      let monthlyIncome = 0
      let monthlyExpense = 0

      db.transactions.forEach((t) => {
        const amt = Number(t.amount) || 0
        const [y, m] = t.transactionDate.split('-').map(Number)
        const isCurrentMonth = y === curYear && m === curMonth + 1

        if (t.type === 'INCOME') {
          totalIncome += amt
          if (isCurrentMonth) monthlyIncome += amt
        } else {
          totalExpense += amt
          if (isCurrentMonth) monthlyExpense += amt
        }
      })

      const openingBalance = Number(db.settings.openingBalance) || 0
      const monthlyBudget = Number(db.settings.monthlyBudget) || 0
      const availableBalance = openingBalance + totalIncome - totalExpense
      const remainingBudget = monthlyBudget - monthlyExpense

      const sorted = [...db.transactions].sort((a, b) =>
        b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id
      )
      const recent = sorted.slice(0, 10)

      return {
        availableBalance,
        monthlyExpenses: monthlyExpense,
        monthlyIncome,
        monthlyBudget,
        remainingBudget,
        openingBalance,
        recentTransactions: recent,
      }
    }
    case 'getTransactions': {
      let list = [...db.transactions]
      if (payload?.type) {
        list = list.filter((t) => t.type === payload.type)
      }
      if (payload?.startDate) {
        list = list.filter((t) => t.transactionDate >= payload.startDate)
      }
      if (payload?.endDate) {
        list = list.filter((t) => t.transactionDate <= payload.endDate)
      }
      return list.sort((a, b) =>
        b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id
      )
    }
    case 'createTransaction': {
      const newId = db.transactions.length ? Math.max(...db.transactions.map((t) => t.id)) + 1 : 1
      const record = {
        id: newId,
        amount: Number(payload.amount),
        type: payload.type,
        category: payload.category || null,
        description: payload.description || null,
        source: payload.source || null,
        transactionDate: payload.transactionDate,
        createdAt: new Date().toISOString(),
      }
      db.transactions.unshift(record)
      saveLocalDb(db)
      return record
    }
    case 'updateTransaction': {
      const idx = db.transactions.findIndex((t) => t.id === payload.id)
      if (idx === -1) throw new Error('Transaction not found')
      db.transactions[idx] = {
        ...db.transactions[idx],
        amount: Number(payload.data.amount),
        type: payload.data.type,
        category: payload.data.category || null,
        description: payload.data.description || null,
        source: payload.data.source || null,
        transactionDate: payload.data.transactionDate,
      }
      saveLocalDb(db)
      return db.transactions[idx]
    }
    case 'deleteTransaction': {
      db.transactions = db.transactions.filter((t) => t.id !== payload.id)
      saveLocalDb(db)
      return null
    }
    case 'getSettings': {
      return db.settings
    }
    case 'updateSettings': {
      db.settings = { ...db.settings, ...payload }
      saveLocalDb(db)
      return db.settings
    }
    default:
      throw new Error('Unknown action: ' + action)
  }
}

async function request(action, method, path, body, localPayload = body) {
  // If static hosting without a remote backend configured, directly use local storage
  if (isStaticHost()) {
    return executeLocal(action, localPayload)
  }

  try {
    const res = await tryServerRequest(method, path, body)
    isUsingLocalMode = false
    return res
  } catch (err) {
    // If backend is unreachable or 404 (e.g. running on GitHub Pages or server down), fallback gracefully
    if (
      err.status === 404 ||
      err.status === 502 ||
      err.status === 503 ||
      err.status === 504 ||
      err.name === 'AbortError' ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Request failed')
    ) {
      return executeLocal(action, localPayload)
    }
    throw err
  }
}

export const api = {
  getAuthStatus: () => request('getAuthStatus', 'GET', '/auth/status'),
  login: async (password) => {
    const res = await request('login', 'POST', '/auth/login', { password }, { password })
    if (res.token) tokenStorage.set(res.token)
    return res
  },
  setup: (password) => request('setup', 'POST', '/auth/setup', { password }, { password }),
  logout: async () => {
    try {
      await request('logout', 'POST', '/auth/logout')
    } finally {
      tokenStorage.clear()
    }
  },
  changePassword: (currentPassword, newPassword) =>
    request(
      'changePassword',
      'POST',
      '/auth/change-password',
      { currentPassword, newPassword },
      { currentPassword, newPassword }
    ),

  getDashboard: () => request('getDashboard', 'GET', '/dashboard'),
  getTransactions: (params = {}) => {
    const q = new URLSearchParams()
    if (params.startDate) q.set('startDate', params.startDate)
    if (params.endDate) q.set('endDate', params.endDate)
    if (params.type) q.set('type', params.type)
    const qs = q.toString()
    return request('getTransactions', 'GET', `/transactions${qs ? `?${qs}` : ''}`, undefined, params)
  },
  createTransaction: (data) => request('createTransaction', 'POST', '/transactions', data, data),
  updateTransaction: (id, data) =>
    request('updateTransaction', 'PUT', `/transactions/${id}`, data, { id, data }),
  deleteTransaction: (id) => request('deleteTransaction', 'DELETE', `/transactions/${id}`, undefined, { id }),

  getSettings: () => request('getSettings', 'GET', '/settings'),
  updateSettings: (data) => request('updateSettings', 'PUT', '/settings', data, data),

  exportPdf: async (startDate, endDate) => {
    if (isStaticHost()) {
      // Export statement immediately in static host mode
      const db = getLocalDb()
      const txns = db.transactions.filter(
        (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
      )
      const content = `
MySpend – Financial Statement
Period: ${startDate} to ${endDate}
=================================================
Opening Balance: ₹ ${db.settings.openingBalance}

Transactions:
${txns
  .map(
    (t) =>
      `• [${t.transactionDate}] ${t.type}: ₹${t.amount} (${
        t.type === 'INCOME' ? t.source : t.category
      }) - ${t.description || 'No note'}`
  )
  .join('\n')}
=================================================
Generated via MySpend Mobile Tracker
      `.trim()

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `myspend_${startDate}_to_${endDate}.txt`
      link.click()
      URL.revokeObjectURL(link.href)
      return
    }

    const base = getBaseUrl()
    const url = `${base}/export/pdf?startDate=${startDate}&endDate=${endDate}`
    const headers = {}
    const token = tokenStorage.get()
    if (token) headers['X-Auth-Token'] = token

    try {
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error('PDF export failed on server')
      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `myspend_${startDate}_to_${endDate}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      const db = getLocalDb()
      const txns = db.transactions.filter(
        (t) => t.transactionDate >= startDate && t.transactionDate <= endDate
      )
      const content = `
MySpend – Financial Statement
Period: ${startDate} to ${endDate}
=================================================
Opening Balance: ₹ ${db.settings.openingBalance}

Transactions:
${txns
  .map(
    (t) =>
      `• [${t.transactionDate}] ${t.type}: ₹${t.amount} (${
        t.type === 'INCOME' ? t.source : t.category
      }) - ${t.description || 'No note'}`
  )
  .join('\n')}
=================================================
Generated via MySpend Mobile Tracker
      `.trim()

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `myspend_${startDate}_to_${endDate}.txt`
      link.click()
      URL.revokeObjectURL(link.href)
    }
  },
}
