'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('w2g_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('w2g_user') }
    }
    setLoading(false)
  }, [])

  const login = async (usuario, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuario.trim(), password }),
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Credenciales incorrectas')

    const userData = {
      id: result.user.id,
      nombre: result.user.nombre,
      email: result.user.email,
      telefono: result.user.telefono,
      rol: result.user.rol,
      avatar_url: result.user.avatar_url,
    }

    localStorage.setItem('w2g_user', JSON.stringify(userData))
    localStorage.setItem('w2g_token', result.token)
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('w2g_user')
    localStorage.removeItem('w2g_token')
    setUser(null)
    router.push('/login')
  }

  const isAdmin = () => user?.rol === 'ADMIN'
  const isSupervisor = () => user?.rol === 'SUPERVISOR' || user?.rol === 'ADMIN'
  const isTrabajador = () => user?.rol === 'TRABAJADOR'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isSupervisor, isTrabajador }}>
      {children}
    </AuthContext.Provider>
  )
}
