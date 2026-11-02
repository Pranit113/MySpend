import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, tokenStorage, setOnUnauthorized } from '@/api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(!!tokenStorage.get())

  const checkStatus = useCallback(async () => {
    try {
      const res = await api.getAuthStatus()
      setHasPassword(res.hasPassword)
      // If no password is set yet in DB, we're not authenticated
      if (!res.hasPassword) {
        setIsAuthenticated(false)
        tokenStorage.clear()
      } else {
        setIsAuthenticated(!!tokenStorage.get())
      }
    } catch (e) {
      console.error('Failed to fetch auth status', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setOnUnauthorized(() => {
      setIsAuthenticated(false)
    })
    checkStatus()
  }, [checkStatus])

  const login = async (password) => {
    const res = await api.login(password)
    setIsAuthenticated(true)
    return res
  }

  const setup = async (password) => {
    await api.setup(password)
    setHasPassword(true)
    // Automatically log in with the newly established master password
    await login(password)
  }

  const logout = async () => {
    await api.logout()
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        hasPassword,
        isAuthenticated,
        login,
        setup,
        logout,
        checkStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
