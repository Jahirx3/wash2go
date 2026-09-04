'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Droplets, Clock, DollarSign, CheckCircle2, Shield,
  Phone, MapPin, Sparkles, Send, Share2, MessageCircle,
  HelpCircle, Car, ArrowRight, X, ExternalLink, Calendar, Check
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const ADMIN_PHONE = '50433571297'
const ADMIN_PHONE_DISPLAY = '+504 3357-1297'

export default function CatalogoPublicoPage() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedServicio, setSelectedServicio] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Formulario rápido para personalizar la solicitud de WhatsApp
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    vehiculo: '',
    direccion: '',
    horario: 'Lo más pronto posible',
  })

  // Cargar catálogo en vivo desde Supabase
  const fetchServicios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('servicios')
        .select('*')
        .eq('activo', true)
        .order('precio', { ascending: true })

      if (error) {
        console.error('Error fetching catalog:', error.message)
        setServicios([])
        return
      }

      setServicios(data || [])
    } catch (err) {
      console.error(err)
      setServicios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  // Abrir modal para agendar
  const handleOpenSolicitud = (servicio) => {
    setSelectedServicio(servicio)
    setModalOpen(true)
  }

  // Generar link directo de WhatsApp de 1 solo clic
  const getDirectWhatsAppUrl = (servicio) => {
    const text = `¡Hola Wash2Go! 👋 Me gustaría agendar el servicio de *${servicio.nombre}* (Tarifa: L. ${servicio.precio}) a domicilio en Comayagua. ¿Tienen disponibilidad hoy?`
    return `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(text)}`
  }

  // Enviar formulario detallado a WhatsApp
  const handleEnviarWhatsAppPersonalizado = (e) => {
    e.preventDefault()
    if (!selectedServicio) return

    let msg = `¡Hola Wash2Go Comayagua! 🚗✨\n`
    msg += `Quisiera agendar un servicio a domicilio:\n\n`
    msg += `🧼 *Servicio:* ${selectedServicio.nombre}\n`
    msg += `💰 *Precio:* L. ${Number(selectedServicio.precio).toFixed(2)}\n`
    if (selectedServicio.duracion_min) {
      msg += `⏱️ *Duración estimada:* ~${selectedServicio.duracion_min} min\n`
    }
    if (formData.nombre.trim()) {
      msg += `👤 *Cliente:* ${formData.nombre.trim()}\n`
    }
    if (formData.vehiculo.trim()) {
      msg += `🚘 *Vehículo:* ${formData.vehiculo.trim()}\n`
    }
    if (formData.direccion.trim()) {
      msg += `📍 *Ubicación en Comayagua:* ${formData.direccion.trim()}\n`
    }
    if (formData.horario.trim()) {
      msg += `🕒 *Preferencia de horario:* ${formData.horario.trim()}\n`
    }
    msg += `\n¿Me confirman si tienen espacio disponible? ¡Gracias!`

    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
    setModalOpen(false)
  }

  // Compartir catálogo
  const handleCompartir = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Catálogo Wash2Go Comayagua',
        text: 'Mira los servicios de autolavado a domicilio de Wash2Go en Comayagua:',
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('¡Enlace del catálogo copiado al portapapeles!')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0f9ff] via-white to-[#f8fafc] text-slate-800 flex flex-col font-sans">
      <Toaster position="top-center" />

      {/* Franja superior de anuncio */}
      <div className="bg-sky-600 text-white text-[12px] font-semibold py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Atención a domicilio en Comayagua y alrededores · ¡Llegamos a tu casa o trabajo!</span>
      </div>

      {/* Header / Barra de Navegación */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Wash2Go" className="h-10 w-auto object-contain" />
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">
                Wash<span className="text-sky-600">2</span>Go
              </span>
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase block">
                Comayagua
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCompartir}
              className="p-2 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Compartir catálogo"
            >
              <Share2 size={16} />
              <span className="hidden sm:inline">Compartir</span>
            </button>

            <a
              href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent('¡Hola Wash2Go! Quisiera información sobre sus servicios de autolavado a domicilio.')}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !py-2 !px-3.5 !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/20 text-xs font-bold flex items-center gap-1.5"
            >
              <MessageCircle size={15} />
              <span>WhatsApp Directo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs font-bold mb-4 shadow-xs">
          <Sparkles size={14} className="text-sky-600" />
          Autolavado Profesional a Domicilio
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Tu auto impecable y reluciente, <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-700">
            sin salir de casa ni hacer filas.
          </span>
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Llegamos hasta tu cochera u oficina en Comayagua. Elige tu paquete favorito a continuación y solicita tu servicio en un solo toque vía WhatsApp al <strong className="text-slate-900 font-bold">{ADMIN_PHONE_DISPLAY}</strong>.
        </p>

        {/* Ventajas Rápidas */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-xs">
          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              💧
            </div>
            <span className="font-bold text-slate-800">Hasta tu puerta</span>
            <span className="text-[11px] text-slate-500">Casa o trabajo</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              ⚡
            </div>
            <span className="font-bold text-slate-800">Cero filas</span>
            <span className="text-[11px] text-slate-500">Ahorras tu tiempo</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              ✨
            </div>
            <span className="font-bold text-slate-800">Ceras & Químicos</span>
            <span className="text-[11px] text-slate-500">Productos premium</span>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              💵
            </div>
            <span className="font-bold text-slate-800">Pagas al terminar</span>
            <span className="text-[11px] text-slate-500">Efectivo o transf.</span>
          </div>
        </div>
      </section>

      {/* Grid de Catálogo de Servicios */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 flex-1 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Droplets className="text-sky-500" size={20} />
              Nuestros Paquetes de Lavado
            </h2>
            <p className="text-xs text-slate-500">Precios transparentes en Lempiras hondureños (L.)</p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {servicios.length} Servicios Disponibles
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-bold text-slate-700">Cargando catálogo actualizado...</p>
            <p className="text-xs text-slate-400 mt-1">Conectando en vivo con la base de datos</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <Droplets size={44} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">Catálogo en actualización</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Estamos actualizando nuestras tarifas. Puedes escribirnos directamente a WhatsApp para cotizar tu lavado al instante.
            </p>
            <a
              href={`https://wa.me/${ADMIN_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="btn-primary !bg-emerald-600 mx-auto mt-4 inline-flex text-xs"
            >
              <MessageCircle size={15} /> Contactar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((s, index) => {
              const isDestacado = index === 1 || s.nombre.toLowerCase().includes('completo')

              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 ${
                    isDestacado
                      ? 'border-sky-400 shadow-md shadow-sky-100 ring-2 ring-sky-400/20'
                      : 'border-slate-200/80 shadow-xs'
                  }`}
                >
                  {/* Barra decorativa de color superior */}
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: s.color || '#0ea5e9' }}
                  />

                  {/* Badge de recomendación */}
                  {isDestacado && (
                    <div className="absolute top-3 right-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                      ★ Más Solicitado
                    </div>
                  )}

                  <div className="space-y-4 pt-1">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                        {s.nombre}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        {s.duracion_min && (
                          <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock size={13} className="text-sky-500" />
                            ~{s.duracion_min} min
                          </span>
                        )}
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 size={12} className="text-emerald-500" />
                          A domicilio
                        </span>
                      </div>
                    </div>

                    {/* Precio Lempiras */}
                    <div className="py-2 border-y border-slate-100">
                      <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Tarifa</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-600">L.</span>
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {Number(s.precio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Descripción */}
                    <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                      {s.descripcion || 'Servicio completo con productos biodegradables de alta calidad, secado con microfibra y atención al detalle.'}
                    </p>
                  </div>

                  {/* Botones de acción hacia WhatsApp */}
                  <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => handleOpenSolicitud(s)}
                      className="w-full btn-primary !bg-emerald-600 hover:!bg-emerald-700 !shadow-emerald-600/20 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group-hover:scale-[1.01]"
                    >
                      <MessageCircle size={16} />
                      <span>Agendar Cita por WhatsApp</span>
                    </button>

                    <a
                      href={getDirectWhatsAppUrl(s)}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 text-center text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline flex items-center justify-center gap-1"
                    >
                      <span>Pedir directo en 1 clic</span>
                      <ArrowRight size={12} />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Sección Informativa: Cómo Funciona */}
        <div className="mt-16 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              ¿Cómo Funciona Wash2Go en Comayagua?
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Fácil, rápido y sin complicaciones en solo 3 pasos:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center mx-auto sm:mx-0">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Elige tu Paquete</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Revisa este catálogo y pulsa "Agendar Cita por WhatsApp" en el paquete que más se ajuste a tu auto.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center mx-auto sm:mx-0">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Envíanos tu Ubicación</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Por WhatsApp nos compartes tu colonia o ubicación GPS en Comayagua y el horario que mejor te convenga.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-black text-xs flex items-center justify-center mx-auto sm:mx-0">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Llegamos y Queda Reluciente</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Nuestro personal especializado realiza el lavado en tu domicilio. Revisas el acabado y cancelas al terminar.
              </p>
            </div>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <div className="mt-12 max-w-3xl mx-auto space-y-3">
          <h3 className="text-base font-black text-slate-900 text-center mb-4">
            Preguntas Frecuentes
          </h3>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-sky-500" />
              ¿Qué zonas de Comayagua cubren?
            </span>
            <p className="text-slate-600 pl-5">
              Cubrimos todo el casco urbano de Comayagua, incluyendo Barrio Arriba, Torondón, San Sebastián, Col. San Martín, Plaza de Armas, y residenciales aledañas.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-sky-500" />
              ¿Qué formas de pago aceptan?
            </span>
            <p className="text-slate-600 pl-5">
              Aceptamos pagos en efectivo directamente al lavador al terminar el servicio, o transferencia bancaria (Ficohsa, Atlántida, BAC, Banpaís).
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <img src="/logo.png" alt="Wash2Go" className="h-7 w-auto object-contain opacity-90" />
            <span className="font-bold text-white">Wash2Go Honduras</span>
            <span>· Comayagua</span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <a
              href={`https://wa.me/${ADMIN_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <Phone size={13} />
              <span>WhatsApp: {ADMIN_PHONE_DISPLAY}</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} Wash2Go. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp en la esquina inferior derecha */}
      <a
        href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent('¡Hola Wash2Go! Me gustaría solicitar información y agendar un servicio de autolavado a domicilio en Comayagua.')}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-110 active:scale-95 group"
        title="Escríbenos por WhatsApp"
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
        <MessageCircle size={24} className="fill-white/20" />
        <span className="text-xs font-bold hidden md:inline pr-1">¿Deseas lavar tu auto? Escríbenos</span>
      </a>

      {/* Modal para agendar servicio personalizado por WhatsApp */}
      {modalOpen && selectedServicio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                Agendar Vía WhatsApp
              </span>
              <h3 className="text-lg font-black text-slate-900">
                {selectedServicio.nombre}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-xs">
                <span className="font-extrabold text-slate-900 text-sm">
                  Tarifa: L. {Number(selectedServicio.precio).toFixed(2)}
                </span>
                {selectedServicio.duracion_min && (
                  <span className="text-slate-500">
                    (~{selectedServicio.duracion_min} min)
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleEnviarWhatsAppPersonalizado} className="space-y-3.5 text-xs">
              <p className="text-slate-500 -mt-1 leading-relaxed">
                Ingresa tus datos para generar un mensaje listo para enviar al WhatsApp del administrador (<strong className="text-slate-700">{ADMIN_PHONE_DISPLAY}</strong>):
              </p>

              <div>
                <label className="input-label !mb-1 font-bold text-slate-700">Tu Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mario Aguilar"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field !text-xs"
                />
              </div>

              <div>
                <label className="input-label !mb-1 font-bold text-slate-700">Tu Vehículo (Marca, Modelo o Color) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Toyota Hilux blanco, Honda Civic gris..."
                  value={formData.vehiculo}
                  onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
                  className="input-field !text-xs"
                />
              </div>

              <div>
                <label className="input-label !mb-1 font-bold text-slate-700">Colonia o Dirección en Comayagua *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bo. Arriba, frente al parque / Col. San Martín"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="input-field !text-xs"
                />
              </div>

              <div>
                <label className="input-label !mb-1 font-bold text-slate-700">¿Para cuándo lo necesitas?</label>
                <select
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  className="input-field !text-xs cursor-pointer"
                >
                  <option value="Lo más pronto posible (Hoy)">Lo más pronto posible (Hoy)</option>
                  <option value="Hoy por la tarde">Hoy por la tarde</option>
                  <option value="Mañana por la mañana (8:00 AM - 12:00 PM)">Mañana por la mañana</option>
                  <option value="Mañana por la tarde (1:00 PM - 5:00 PM)">Mañana por la tarde</option>
                  <option value="Fin de semana">Fin de semana</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full btn-primary !bg-emerald-600 hover:!bg-emerald-700 text-xs font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={16} />
                  <span>Continuar a WhatsApp y Enviar</span>
                </button>

                <a
                  href={getDirectWhatsAppUrl(selectedServicio)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-center text-[11px] text-slate-400 hover:text-slate-700 py-1"
                >
                  O enviar mensaje rápido sin llenar este formulario →
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
