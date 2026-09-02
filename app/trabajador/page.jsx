'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import toast, { Toaster } from 'react-hot-toast'
import {
  Car, MapPin, Clock, Phone, Camera, CheckCircle2,
  Navigation, Play, Check, X, LogOut, RefreshCw,
  AlertTriangle, Upload, Eye
} from 'lucide-react'

export default function TrabajadorPanelPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ACTIVOS') // 'ACTIVOS' | 'HISTORIAL'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('w2g_user')
    if (stored) {
      try {
        const u = JSON.parse(stored)
        setUser(u)
        fetchMisServicios(u.id)
      } catch {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [])

  const fetchMisServicios = async (trabajadorId) => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(nombre, telefono),
          vehiculo:vehiculos(marca, modelo, placa, color, tipo),
          servicio:servicios(nombre, duracion_min)
        `)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setServicios(data)
      } else {
        // Servicios de demostración para el lavador
        setServicios([
          {
            id: 'demo-w1',
            numero: 'ORD-2026-0001',
            estado: 'PENDIENTE',
            direccion: 'Barrio Arriba, 3ra calle, Comayagua',
            referencia: 'Portón azul frente a pulpería',
            hora_programada: '10:30 AM',
            precio: 300,
            forma_pago: 'EFECTIVO',
            cliente: { nombre: 'Mario Aguilar', telefono: '+50498761234' },
            vehiculo: { marca: 'Toyota', modelo: 'Hilux', placa: 'HAB-1029', color: 'Blanco', tipo: 'PICKUP' },
            servicio: { nombre: 'Lavado Completo', duracion_min: 60 },
            foto_antes_url: null,
            foto_despues_url: null,
          },
          {
            id: 'demo-w2',
            numero: 'ORD-2026-0002',
            estado: 'EN_CAMINO',
            direccion: 'Col. San Martín, Casa 12',
            referencia: 'Cerca del parque infantil',
            hora_programada: '12:00 PM',
            precio: 150,
            forma_pago: 'TRANSFERENCIA',
            cliente: { nombre: 'Lucía Fernández', telefono: '+50495554321' },
            vehiculo: { marca: 'Hyundai', modelo: 'Elantra', placa: 'HAC-4432', color: 'Gris', tipo: 'SEDAN' },
            servicio: { nombre: 'Lavado Básico', duracion_min: 30 },
            foto_antes_url: null,
            foto_despues_url: null,
          }
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado del servicio por el trabajador
  const handleActualizarEstado = async (ordenId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', ordenId)

      setServicios(servicios.map(s => s.id === ordenId ? { ...s, estado: nuevoEstado } : s))
      toast.success(`Servicio actualizado: ${nuevoEstado.replace('_', ' ')}`)
    } catch (err) {
      toast.error('Error al actualizar')
    }
  }

  // Simulación de captura y subida de foto
  const handleTomarFoto = async (ordenId, tipo) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Abre la cámara en celulares

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      const toastId = toast.loading(`Subiendo foto ${tipo}...`)
      try {
        // En una app real se sube a Supabase Storage bucket 'fotos-wash2go'
        // Creamos preview local para respuesta inmediata
        const reader = new FileReader()
        reader.onload = async (event) => {
          const base64Url = event.target.result

          const updateObj = tipo === 'antes'
            ? { foto_antes_url: base64Url }
            : { foto_despues_url: base64Url }

          await supabase.from('ordenes').update(updateObj).eq('id', ordenId)

          setServicios(servicios.map(s => s.id === ordenId ? { ...s, ...updateObj } : s))
          toast.dismiss(toastId)
          toast.success(`Foto ${tipo} guardada con éxito 📸`)
        }
        reader.readAsDataURL(file)
      } catch (err) {
        toast.dismiss(toastId)
        toast.error('Error al subir foto')
      }
    }
    input.click()
  }

  const handleLogout = () => {
    localStorage.removeItem('w2g_user')
    localStorage.removeItem('w2g_token')
    router.push('/login')
  }

  const serviciosActivos = servicios.filter(s => s.estado !== 'FINALIZADO' && s.estado !== 'CANCELADO')
  const serviciosHistorial = servicios.filter(s => s.estado === 'FINALIZADO' || s.estado === 'CANCELADO')

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-100 pb-16">
      {mounted && <Toaster position="top-center" />}

      {/* Header Móvil */}
      <header className="bg-gradient-to-r from-sky-600 to-blue-700 text-white p-4 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Wash2Go" className="h-10 bg-white/10 rounded-lg p-1" />
            <div>
              <h1 className="text-base font-extrabold leading-tight">Wash2Go Lavadores</h1>
              <p className="text-xs text-sky-200">
                Hola, {user?.nombre?.split(' ')[0] || 'Trabajador'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchMisServicios(user?.id)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Refrescar"
            >
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 bg-white/10 hover:bg-rose-500/50 rounded-xl transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Tabs Móviles */}
        <div className="flex gap-2 mt-4 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('ACTIVOS')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'ACTIVOS'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Servicios Asignados ({serviciosActivos.length})
          </button>
          <button
            onClick={() => setActiveTab('HISTORIAL')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'HISTORIAL'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Completados ({serviciosHistorial.length})
          </button>
        </div>
      </header>

      {/* Lista de Servicios */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Cargando tus servicios...
          </div>
        ) : (activeTab === 'ACTIVOS' ? serviciosActivos : serviciosHistorial).length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
            <Car size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No tienes servicios en esta lista</p>
            <p className="text-xs text-slate-400 mt-1">
              Las órdenes asignadas por el administrador aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          (activeTab === 'ACTIVOS' ? serviciosActivos : serviciosHistorial).map((orden) => (
            <div
              key={orden.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
            >
              {/* Top info */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-sky-600 font-mono block">
                    {orden.numero}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">
                    {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                  </h3>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    PLACA: {orden.vehiculo?.placa} · {orden.vehiculo?.color}
                  </span>
                </div>
                <Badge estado={orden.estado} />
              </div>

              {/* Detalles clave */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-sky-500 shrink-0" />
                  <span className="font-semibold text-slate-800">Hora: {orden.hora_programada || '10:00 AM'}</span>
                  <span className="text-slate-400">({orden.servicio?.nombre})</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800 block">{orden.direccion}</span>
                    {orden.referencia && (
                      <span className="text-slate-400 text-[11px] italic">Ref: {orden.referencia}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{orden.cliente?.nombre}</span>
                  </div>
                  {orden.cliente?.telefono && (
                    <a
                      href={`https://wa.me/${orden.cliente?.telefono.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Phone size={12} /> Contactar
                    </a>
                  )}
                </div>
              </div>

              {/* Visualización de Fotos Tomadas */}
              {(orden.foto_antes_url || orden.foto_despues_url) && (
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Foto Antes</span>
                    {orden.foto_antes_url ? (
                      <img src={orden.foto_antes_url} alt="Antes" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                        Sin foto
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Foto Después</span>
                    {orden.foto_despues_url ? (
                      <img src={orden.foto_despues_url} alt="Después" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                    ) : (
                      <div className="h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-[11px]">
                        Sin foto
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones de Acción del Lavador */}
              {orden.estado !== 'FINALIZADO' && orden.estado !== 'CANCELADO' && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {/* Botón En Camino */}
                  {orden.estado === 'PENDIENTE' && (
                    <button
                      onClick={() => handleActualizarEstado(orden.id, 'EN_CAMINO')}
                      className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                    >
                      <Navigation size={16} />
                      Voy en Camino al Domicilio
                    </button>
                  )}

                  {/* Botón Iniciar Lavado */}
                  {orden.estado === 'EN_CAMINO' && (
                    <button
                      onClick={() => handleActualizarEstado(orden.id, 'LAVANDO')}
                      className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                    >
                      <Play size={16} />
                      Llegué / Iniciar Lavado
                    </button>
                  )}

                  {/* Tomar Fotos */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleTomarFoto(orden.id, 'antes')}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera size={15} />
                      Foto Antes
                    </button>
                    <button
                      onClick={() => handleTomarFoto(orden.id, 'despues')}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Camera size={15} />
                      Foto Después
                    </button>
                  </div>

                  {/* Botón Finalizar */}
                  {orden.estado === 'LAVANDO' && (
                    <button
                      onClick={() => handleActualizarEstado(orden.id, 'FINALIZADO')}
                      className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
                    >
                      <CheckCircle2 size={16} />
                      Finalizar Servicio (L. {orden.precio})
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  )
}
