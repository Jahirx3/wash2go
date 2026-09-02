'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { Toaster } from 'react-hot-toast'
import { ls } from '@/lib/theme'

function DashboardContent({ children }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router, mounted])

  if (!mounted || loading) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-sky-50">
        <div suppressHydrationWarning className="flex flex-col items-center gap-3">
          <div suppressHydrationWarning className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p suppressHydrationWarning className="text-sm font-semibold text-slate-500">Cargando Wash2Go...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  // Redirigir trabajador a su panel móvil dedicado
  if (user.rol === 'TRABAJADOR') {
    router.push('/trabajador')
    return null
  }

  return (
    <div suppressHydrationWarning className="flex min-h-screen bg-[#f0f9ff]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div
        suppressHydrationWarning
        className="flex-1 flex flex-col min-h-screen min-w-0 transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? ls.sidebarCollapsedWidth : ls.sidebarWidth) }}
      >
        <Navbar />
        <main suppressHydrationWarning className={`flex-1 w-full min-w-0 box-border ${isMobile ? 'p-3' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-[#f0f9ff]">
        <div suppressHydrationWarning className="flex flex-col items-center gap-3">
          <div suppressHydrationWarning className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <p suppressHydrationWarning className="text-sm font-semibold text-slate-500">Cargando Wash2Go...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter, sans-serif', borderRadius: '12px' } }} />
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}
