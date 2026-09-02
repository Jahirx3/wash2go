'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  CheckCircle2, Clock, Navigation, Droplets,
  Star, Phone, Car, MapPin, ShieldCheck, Heart
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function PublicTrackingPage() {
  const params = useParams()
  const ordenId = params?.id

  const [orden, setOrden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calificacion, setCalificacion] = useState(5)
  const [comentario, setComentario] = useState('')
  const [calificado, setCalificado] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchTracking = async () => {
    setLoading(true)
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ordenId)
      let query = supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(nombre, telefono),
          vehiculo:vehiculos(marca, modelo, placa, color),
          servicio:servicios(nombre, duracion_min),
          trabajador:usuarios(nombre)
        `)

      if (isUUID) {
        query = query.or(`id.eq.${ordenId},numero.eq.${ordenId}`)
      } else {
        query = query.eq('numero', ordenId)
      }

      const { data, error } = await query.maybeSingle()

      if (data) {
        setOrden(data)
      } else {
        // Datos de ejemplo representativos
        setOrden({
          numero: ordenId || 'ORD-2026-0001',
          estado: 'LAVANDO',
          direccion: 'Barrio Arriba, 3ra calle, Comayagua',
          precio: 300,
          cliente: { nombre: 'Mario Aguilar' },
          vehiculo: { marca: 'Toyota', modelo: 'Hilux', placa: 'HAB-1029', color: 'Blanco' },
          servicio: { nombre: 'Lavado Completo', duracion_min: 60 },
          trabajador: { nombre: 'Carlos Mejía' },
          foto_antes_url: null,
          foto_despues_url: null,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracking()
    // Auto refrescar cada 15 segundos para tracking en vivo
    const interval = setInterval(fetchTracking, 15000)
    return () => clearInterval(interval)
  }, [ordenId])

  const handleEnviarCalificacion = async () => {
    toast.success('¡Muchas gracias por calificar nuestro servicio!')
    setCalificado(true)
  }

  // Pasos de estado
  const ESTADOS = [
    { key: 'PENDIENTE', label: 'Orden Recibida', desc: 'Tu servicio ha sido registrado' },
    { key: 'EN_CAMINO', label: 'En Camino', desc: 'El lavador va hacia tu domicilio' },
    { key: 'LAVANDO', label: 'Lavando tu Auto', desc: 'Servicio en proceso' },
    { key: 'FINALIZADO', label: '¡Finalizado!', desc: 'Tu auto quedó impecable' },
  ]

  const getStepIndex = (st) => {
    switch (st) {
      case 'PENDIENTE': return 0
      case 'EN_CAMINO': return 1
      case 'LAVANDO': return 2
      case 'FINALIZADO': return 3
      default: return 0
    }
  }

  const currentStep = getStepIndex(orden?.estado || 'PENDIENTE')

  return (
    <div suppressHydrationWarning className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 sm:p-6">
      {mounted && <Toaster position="top-center" />}

      {/* Contenedor central tipo app móvil */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header con Logo */}
        <div className="bg-gradient-to-r from-sky-500 via-blue-600 to-sky-700 text-white p-6 text-center relative">
          <img src="/logo.png" alt="Wash2Go" className="h-16 mx-auto mb-2 object-contain" />
          <h1 className="text-xl font-black tracking-tight">Seguimiento en Vivo</h1>
          <p className="text-xs text-sky-100 font-mono mt-0.5">Orden N° {orden?.numero}</p>
        </div>

        {/* Stepper / Barra de Progreso */}
        <div className="p-6 border-b border-slate-100">
          <div className="space-y-6">
            {ESTADOS.map((st, idx) => {
              const isPast = idx < currentStep
              const isCurrent = idx === currentStep
              return (
                <div key={st.key} className="flex items-start gap-4 relative">
                  {/* Línea conectora */}
                  {idx < ESTADOS.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-10 ${
                        idx < currentStep ? 'bg-sky-500' : 'bg-slate-200'
                      }`}
                    />
                  )}

                  {/* Icono de círculo */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                      isPast
                        ? 'bg-sky-500 text-white'
                        : isCurrent
                        ? 'bg-sky-600 text-white ring-4 ring-sky-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 size={18} />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Texto del paso */}
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent ? 'text-sky-600' : isPast ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {st.label}
                    </h4>
                    <p className="text-xs text-slate-500">{st.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Resumen del Servicio */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detalles de tu Servicio
          </h3>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Vehículo</span>
              <span className="text-xs font-bold text-slate-800">
                {orden?.vehiculo?.marca} {orden?.vehiculo?.modelo} ({orden?.vehiculo?.placa})
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Servicio</span>
              <span className="text-xs font-bold text-sky-600">{orden?.servicio?.nombre}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Lavador Responsable</span>
              <span className="text-xs font-bold text-slate-800">
                {orden?.trabajador?.nombre || 'Asignando personal...'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">Total a Pagar</span>
              <span className="text-base font-black text-emerald-600">
                L. {Number(orden?.precio || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Módulo de Calificación si está Finalizado */}
        {orden?.estado === 'FINALIZADO' && !calificado && (
          <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-t border-amber-200/60 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center mx-auto shadow-sm">
              <Heart size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-800">¿Cómo quedó tu vehículo?</h4>
            <p className="text-xs text-slate-600">Tu opinión nos ayuda a seguir mejorando en Comayagua</p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setCalificacion(star)}
                  className="p-1 transition-transform hover:scale-125"
                >
                  <Star
                    size={28}
                    className={
                      star <= calificacion
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleEnviarCalificacion}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Enviar Calificación
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 text-center text-slate-400 text-[11px] border-t border-slate-100">
          Wash2Go · "Lo Pides, Llegamos" · Comayagua, Honduras
        </div>
      </div>
    </div>
  )
}
