'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Lock, LogIn, Shield, Cpu, BarChart3, Eye, EyeOff, X } from 'lucide-react'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import toast, { Toaster } from 'react-hot-toast'

function LoginForm() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryUser, setRecoveryUser] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!usuario || !password) {
      toast.error('Completa todos los campos')
      return
    }
    setLoading(true)
    try {
      const user = await login(usuario, password)
      toast.success(`¡Bienvenido al sistema, ${user.nombre.split(' ')[0]}!`)
      if (user.rol === 'TRABAJADOR') {
        router.push('/trabajador')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const handleRecovery = (e) => {
    e.preventDefault()
    if (!recoveryUser.trim()) return
    toast.success('Solicitud de recuperación enviada al administrador.')
    setShowRecovery(false)
    setRecoveryUser('')
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#f0f9ff] text-[#0c1a2e] flex overflow-hidden font-sans">
      {/* Left panel - branding (45% en pantallas grandes como Llanticentro Elohim) */}
      <aside className="hidden lg:flex lg:w-[45%] flex-col justify-center items-start px-16 relative overflow-hidden bg-gradient-to-br from-[#e0f2fe] via-[#bae6fd] to-[#7dd3fc]">
        {/* Atmosphere decoration */}
        <div className="absolute inset-0 z-0 opacity-40">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/60 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0284c7]/20 blur-[130px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 space-y-8 animate-fadeIn">
          {/* Logo con resplandor celeste */}
          <div className="inline-flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[#0ea5e9] blur-[25px] opacity-35 rounded-full" />
            <img
              src="/logo.png"
              alt="Wash2Go"
              className="w-36 h-36 object-contain relative z-10 drop-shadow-2xl"
            />
          </div>

          <div className="space-y-2">
            <span className="text-[#0369a1] font-bold tracking-[0.3em] text-xs uppercase block">
              Comayagua, Honduras
            </span>
            <h1 className="text-6xl font-black tracking-tighter text-[#0c1a2e] leading-none drop-shadow-sm">
              WASH2GO
            </h1>
            <p className="text-[#0284c7] text-xl font-semibold tracking-tight">
              Sistema de Gestión y Autolavado a Domicilio
            </p>
          </div>

          <div className="pt-6 space-y-5">
            {[
              { icon: Shield, text: 'Seguridad Empresarial' },
              { icon: Cpu, text: 'Procesamiento Inteligente' },
              { icon: BarChart3, text: 'Reportes en Tiempo Real' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-4 group">
                <div className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/80 shadow-sm border border-white/60 group-hover:bg-[#0ea5e9] group-hover:text-white transition-all text-[#0284c7]">
                  <item.icon size={20} className="transition-colors" />
                </div>
                <span className="text-[#1e293b] font-semibold text-sm group-hover:text-[#0284c7] transition-colors">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Right panel - form (55% en pantallas grandes) */}
      <main className="w-full lg:w-[55%] bg-[#f8fafc] flex flex-col items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8 animate-fadeIn relative z-10">
          {/* Header */}
          <div className="text-center space-y-2">
            {/* Logo visible en móvil */}
            <div className="lg:hidden flex justify-center mb-4">
              <img src="/logo.png" alt="Wash2Go" className="w-24 h-24 object-contain" />
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#0c1a2e]">Bienvenido</h2>
            <p className="text-[#64748b] text-sm">Inicia sesión para continuar</p>
          </div>

          {/* Form Card (exactamente rounded-[2.5rem] como Elohim) */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-sky-100 border border-sky-100">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#475569] px-1 uppercase tracking-widest">
                  Usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="text-[#94a3b8] group-focus-within:text-[#0ea5e9] transition-colors" size={20} />
                  </div>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="block w-full bg-[#f0f9ff] border border-sky-200/80 text-[#0c1a2e] text-base rounded-2xl focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9] py-4 pl-12 pr-4 transition-all placeholder:text-[#94a3b8] outline-none font-medium"
                    placeholder="Ingresa tu nombre de usuario"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-xs font-bold text-[#475569] uppercase tracking-widest">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="text-xs text-[#0284c7] hover:text-[#0369a1] transition-colors font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="text-[#94a3b8] group-focus-within:text-[#0ea5e9] transition-colors" size={20} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full bg-[#f0f9ff] border border-sky-200/80 text-[#0c1a2e] text-base rounded-2xl focus:ring-2 focus:ring-[#0ea5e9]/50 focus:border-[#0ea5e9] py-4 pl-12 pr-12 transition-all placeholder:text-[#94a3b8] outline-none font-medium"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94a3b8] hover:text-[#0c1a2e] transition-colors"
                  >
                    {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-sky-300 bg-[#f0f9ff] text-[#0ea5e9] focus:ring-[#0ea5e9] cursor-pointer"
                    id="remember"
                    name="remember"
                    type="checkbox"
                  />
                  <label className="ml-2 block text-xs font-semibold text-[#64748b] cursor-pointer" htmlFor="remember">
                    Recordarme
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 flex items-center justify-center space-x-3 rounded-2xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-bold text-lg shadow-[0_10px_25px_rgba(14,165,233,0.35)] hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <LogIn size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center">
            <span className="text-[#94a3b8] text-xs font-semibold tracking-widest uppercase">v1.0.0</span>
          </div>
        </div>

        <div className="absolute bottom-6 text-[#94a3b8] text-[11px] tracking-widest uppercase font-bold text-center w-full px-8">
          © 2026 BY JAHIR CABALLERO • WASH2GO
        </div>
      </main>

      {/* Recovery modal */}
      {showRecovery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-sky-100 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setShowRecovery(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors p-1"
            >
              <X size={20} />
            </button>
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mx-auto text-[#0284c7] shadow-inner">
                <Lock size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Recuperar Acceso</h3>
              <p className="text-slate-500 text-xs">
                Ingresa tu usuario o correo y notificaremos al administrador para restablecer tu cuenta.
              </p>
            </div>
            <form onSubmit={handleRecovery} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest pl-1">
                  Usuario o Correo
                </label>
                <input
                  type="text"
                  value={recoveryUser}
                  onChange={(e) => setRecoveryUser(e.target.value)}
                  className="block w-full bg-[#f0f9ff] border border-sky-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-[#0ea5e9]/50 py-3 px-4 transition-all outline-none font-medium"
                  placeholder="admin@wash2go.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] text-white font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
              >
                Enviar Solicitud
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div suppressHydrationWarning className="min-h-screen bg-[#f0f9ff] flex items-center justify-center">
        <div suppressHydrationWarning className="w-10 h-10 border-4 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Inter,sans-serif', borderRadius: '12px', fontSize: '14px' } }} />
      <LoginForm />
    </AuthProvider>
  )
}
