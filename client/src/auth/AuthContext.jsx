import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import AuthContext from './auth-context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')

  const restoreSession = useCallback(async () => {
    setStatus('loading')

    try {
      const response = await api.get('/auth/me')
      setUser(response.user)
      setStatus('authenticated')
    } catch (error) {
      setUser(null)
      setStatus('anonymous')

      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error('Unable to restore the VendorPulse session.', error)
      }
    }
  }, [])

  useEffect(() => {
    let active = true

    async function loadSession() {
      try {
        const response = await api.get('/auth/me')
        if (!active) return
        setUser(response.user)
        setStatus('authenticated')
      } catch (error) {
        if (!active) return
        setUser(null)
        setStatus('anonymous')

        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error('Unable to restore the VendorPulse session.', error)
        }
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    setUser(response.user)
    setStatus('authenticated')
    return response.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      login,
      logout,
      restoreSession,
    }),
    [login, logout, restoreSession, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
