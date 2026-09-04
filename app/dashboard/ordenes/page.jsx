'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, Eye, Phone, MapPin,
  Car, Calendar, Clock, Printer, CheckCircle,
  XCircle, Truck, Droplets, ExternalLink, Copy, Send,
  User, RefreshCw, UserCheck, CheckCircle2
} from 'lucide-react'
import { getTrackingUrl } from '@/lib/utils'

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  // Modal de Detalle / Orden de Trabajo
  const [selectedOrden, setSelectedOrden] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchTrabajadores = async () => {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre, usuario, telefono')
        .eq('rol', 'TRABAJADOR')
        .eq('activo', true)
        .order('nombre')
      setTrabajadores(data || [])
    } catch (err) {
      console.error('Error fetching workers:', err)
    }
  }

  const fetchOrdenes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(id, nombre, telefono, email, direccion_default),
          vehiculo:vehiculos(id, marca, modelo, placa, color, anio, tipo),
          servicio:servicios(id, nombre, precio, duracion_min, descripcion),
          trabajador:usuarios!ordenes_trabajador_id_fkey(id, nombre, telefono, usuario)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error.message)
        toast.error('Error al cargar órdenes de Supabase')
        setOrdenes([])
        return
      }

      setOrdenes(data || [])
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdenes()
    fetchTrabajadores()

    // Sincronización en tiempo real con Supabase:
    // Cuando el lavador actualiza en su celular (/trabajador), el dashboard se actualiza solo.
    const channel = supabase
      .channel('ordenes-live-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordenes' }, () => {
        fetchOrdenes()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Cambiar estado rápido
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({
          estado: nuevoEstado,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        toast.error(`Error al actualizar estado: ${error.message}`)
        return
      }

      setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o))
      if (selectedOrden?.id === id) {
        setSelectedOrden({ ...selectedOrden, estado: nuevoEstado })
      }
      toast.success(`Estado cambiado a ${nuevoEstado.replace('_', ' ')}`)
    } catch (err) {
      toast.error('Error al cambiar estado')
    }
  }

  // Asignar o reasignar lavador
  const handleAsignarTrabajador = async (ordenId, nuevoTrabajadorId) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({
          trabajador_id: nuevoTrabajadorId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', ordenId)

      if (error) {
        toast.error(`Error al asignar lavador: ${error.message}`)
        return
      }

      const tObj = trabajadores.find(t => t.id === nuevoTrabajadorId) || null
      setOrdenes(ordenes.map(o => o.id === ordenId ? { ...o, trabajador_id: nuevoTrabajadorId, trabajador: tObj } : o))
      if (selectedOrden?.id === ordenId) {
        setSelectedOrden({ ...selectedOrden, trabajador_id: nuevoTrabajadorId, trabajador: tObj })
      }

      toast.success(nuevoTrabajadorId ? `Lavador asignado con éxito` : 'Lavador desasignado')
    } catch (err) {
      toast.error('Error al asignar lavador')
    }
  }

  // Filtros
  const ordenesFiltradas = ordenes.filter((o) => {
    const matchesSearch =
      o.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vehiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.trabajador?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.direccion?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFiltro = filtroEstado === 'TODOS' || o.estado === filtroEstado
    return matchesSearch && matchesFiltro
  })

  // Imprimir Orden de Trabajo / Comprobante
  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de Lavado</h1>
          <p className="page-subtitle">Control de servicios a domicilio, asignaciones de lavadores y estados en vivo</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchOrdenes} className="btn-secondary text-xs !py-2" title="Recargar órdenes">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <Link href="/dashboard/ordenes/nueva" className="btn-primary">
            <Plus size={18} />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* Barra de Filtros & Búsqueda */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por N° orden, cliente, placa, lavador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'LAVANDO', 'FINALIZADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filtroEstado === st
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Servicio</th>
                <th>Lavador Asignado</th>
                <th>Fecha / Hora</th>
                <th>Total</th>
                <th>Estado</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-500">
                    <Droplets size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay órdenes de lavado registradas</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Crea tu primera orden haciendo clic en "Nueva Orden" para programar un servicio de lavado a domicilio en Comayagua.
                    </p>
                    <Link href="/dashboard/ordenes/nueva" className="btn-primary mx-auto mt-4 inline-flex">
                      <Plus size={16} /> Crear Primera Orden
                    </Link>
                  </td>
                </tr>
              )}

              {ordenesFiltradas.map((orden) => (
                <tr key={orden.id}>
                  <td>
                    <span className="font-mono font-bold text-sky-600 text-xs bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                      {orden.numero}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-800 block text-xs">{orden.cliente?.nombre || 'Cliente General'}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Phone size={10} /> {orden.cliente?.telefono || 'Sin teléfono'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-700 block">
                      {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                    </span>
                    <span className="font-mono text-[10px] text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-100 font-bold">
                      {orden.vehiculo?.placa || 'SIN PLACA'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-800 block">{orden.servicio?.nombre || 'Lavado'}</span>
                    <span className="text-[10px] text-slate-400">{orden.forma_pago}</span>
                  </td>
                  <td>
                    {orden.trabajador ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-bold text-[10px] flex items-center justify-center">
                          {orden.trabajador.nombre?.charAt(0)}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 block">{orden.trabajador.nombre}</span>
                          <span className="text-[10px] text-slate-400 font-mono">@{orden.trabajador.usuario || 'lavador'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Sin asignar
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-slate-700 block">{orden.fecha_programada || 'Hoy'}</span>
                    <span className="text-[10px] text-slate-400">{orden.hora_programada || '10:00 AM'}</span>
                  </td>
                  <td>
                    <span className="font-extrabold text-slate-900 text-xs">
                      L. {Number(orden.precio || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <Badge status={orden.estado} />
                  </td>
                  <td className="sticky-right text-center">
                    <button
                      onClick={() => {
                        setSelectedOrden(orden)
                        setModalOpen(true)
                      }}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                      title="Ver Detalle / Asignar Lavador / Imprimir"
                    >
                      <Eye size={15} /> Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle / Orden de Trabajo (con opción de impresión / PDF) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Detalle de Orden: ${selectedOrden?.numero}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrden && (
          <div className="space-y-6">
            {/* DOCUMENTO OFICIAL PARA IMPRESIÓN / PDF */}
            <div className="space-y-6 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200" id="orden-trabajo-imprimir">
              {/* Header de la Orden */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Wash2Go" className="h-14 object-contain" />
                  <div>
                    <h2 className="text-xl font-black text-slate-900 leading-tight tracking-tight">WASH2GO HONDURAS</h2>
                    <p className="text-xs text-slate-500 font-medium">Autolavado a Domicilio · Comayagua, Honduras</p>
                    <p className="text-[11px] text-slate-400">Tel: +504 9876-5432 · Soporte Oficial</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Comprobante de Servicio</span>
                  <span className="text-2xl font-black text-sky-600 font-mono block">{selectedOrden.numero}</span>
                  <span className="text-[11px] text-slate-500">Fecha: {selectedOrden.fecha_programada} ({selectedOrden.hora_programada})</span>
                </div>
              </div>

              {/* Grid Datos de la Orden */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Cliente y Ubicación */}
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Datos del Cliente:</span>
                  <p className="text-sm font-bold text-slate-900">{selectedOrden.cliente?.nombre || 'Cliente General'}</p>
                  <p className="text-slate-600 flex items-center gap-1">
                    <Phone size={12} className="text-emerald-600" /> {selectedOrden.cliente?.telefono || 'Sin teléfono'}
                  </p>
                  <p className="text-slate-700 flex items-start gap-1 pt-1 border-t border-slate-200/50">
                    <MapPin size={12} className="text-rose-500 mt-0.5 shrink-0" />
                    <span>{selectedOrden.direccion || 'Comayagua'}</span>
                  </p>
                  {selectedOrden.referencia && (
                    <p className="text-[11px] text-slate-500 italic">Ref: {selectedOrden.referencia}</p>
                  )}
                </div>

                {/* Vehículo y Servicio */}
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1.5 border border-slate-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Vehículo Atendido:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedOrden.vehiculo?.marca} {selectedOrden.vehiculo?.modelo} ({selectedOrden.vehiculo?.anio || 'Año N/A'})
                  </p>
                  <p className="text-sky-700 font-mono font-bold">
                    PLACA: {selectedOrden.vehiculo?.placa} · Color: {selectedOrden.vehiculo?.color || 'N/A'}
                  </p>
                  <div className="pt-1 border-t border-slate-200/50 flex justify-between items-center">
                    <span className="text-slate-500">Servicio:</span>
                    <span className="font-bold text-slate-800">{selectedOrden.servicio?.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Forma de pago:</span>
                    <span className="font-bold text-slate-800">{selectedOrden.forma_pago}</span>
                  </div>
                </div>
              </div>

              {/* Tabla Financiera de Cobro */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-100 p-2.5 font-bold text-slate-700 grid grid-cols-12">
                  <span className="col-span-8">Descripción del Servicio</span>
                  <span className="col-span-4 text-right">Subtotal (HNL)</span>
                </div>
                <div className="p-3 grid grid-cols-12 items-center border-t border-slate-100">
                  <div className="col-span-8">
                    <span className="font-bold text-slate-800 block text-sm">{selectedOrden.servicio?.nombre}</span>
                    <span className="text-[11px] text-slate-500">{selectedOrden.servicio?.descripcion || 'Lavado integral a domicilio'}</span>
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="font-black text-slate-900 text-base">
                      L. {Number(selectedOrden.precio || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 flex justify-between items-center border-t border-slate-200">
                  <span className="font-bold text-slate-600 uppercase text-[11px]">Total a Pagar / Pagado:</span>
                  <span className="text-lg font-black text-emerald-600">
                    L. {Number(selectedOrden.precio || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Lavador Responsable */}
              <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-sky-800 uppercase block">Lavador Responsable:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedOrden.trabajador?.nombre || 'Pendiente de asignar'}
                  </span>
                  {selectedOrden.trabajador?.telefono && (
                    <span className="text-slate-500 block text-[11px]">Tel: {selectedOrden.trabajador.telefono}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Estado Actual:</span>
                  <span className="font-bold text-sky-700 text-sm">
                    {selectedOrden.estado?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Casillas de Firmas Oficiales para la Impresión / PDF */}
              <div className="hidden print:grid grid-cols-2 gap-12 pt-10 text-center text-xs">
                <div>
                  <div className="border-t border-slate-400 pt-2 w-52 mx-auto font-bold text-slate-800">
                    Firma del Cliente
                  </div>
                  <span className="text-[10px] text-slate-400">Conformidad del Servicio Recibido</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 pt-2 w-52 mx-auto font-bold text-slate-800">
                    Firma del Lavador
                  </div>
                  <span className="text-[10px] text-slate-400">Operador Autorizado Wash2Go</span>
                </div>
              </div>
            </div>

            {/* CONTROLES DE GESTIÓN (OCULTOS EN IMPRESIÓN CON no-print) */}
            <div className="no-print space-y-4 pt-2 border-t border-slate-200">
              {/* Asignador de Lavador */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck size={14} className="text-sky-600" />
                  Asignar / Cambiar Lavador a esta Orden:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedOrden.trabajador_id || ''}
                    onChange={(e) => handleAsignarTrabajador(selectedOrden.id, e.target.value)}
                    className="input-field text-xs font-medium cursor-pointer"
                  >
                    <option value="">-- Sin Lavador Asignado --</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} (@{t.usuario || 'lavador'}) · {t.telefono}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  El lavador seleccionado verá esta orden en su panel móvil (/trabajador) al instante.
                </span>
              </div>

              {/* Selector de Estado */}
              <div className="border border-slate-200 p-4 rounded-xl">
                <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                  Cambiar Estado del Servicio (Sincronizado con el móvil):
                </label>
                <div className="flex flex-wrap gap-2">
                  {['PENDIENTE', 'EN_CAMINO', 'LAVANDO', 'FINALIZADO', 'CANCELADO'].map((st) => (
                    <button
                      key={st}
                      onClick={() => cambiarEstado(selectedOrden.id, st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedOrden.estado === st
                          ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enlace de Tracking para el Cliente */}
              <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-sky-900 block">Link de Seguimiento en Vivo:</span>
                  <span className="text-[11px] text-sky-700 font-mono break-all select-all">
                    {getTrackingUrl(selectedOrden.numero)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      const url = getTrackingUrl(selectedOrden.numero)
                      navigator.clipboard.writeText(url)
                      toast.success('¡Enlace de seguimiento copiado!')
                    }}
                    className="btn-secondary !py-1.5 !px-2.5 text-xs text-sky-700 border-sky-300 hover:bg-sky-100"
                  >
                    <Copy size={13} /> Copiar
                  </button>
                  {selectedOrden.cliente?.telefono && (
                    <a
                      href={`https://wa.me/${selectedOrden.cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${selectedOrden.cliente.nombre}! 🚗💦 Puedes seguir el estado de tu lavado en vivo aquí:\n${getTrackingUrl(selectedOrden.numero)}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary !py-1.5 !px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/50"
                    >
                      <Send size={13} /> WhatsApp
                    </a>
                  )}
                  <a
                    href={`/tracking/${selectedOrden.numero}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary !py-1.5 !px-2.5 text-xs"
                  >
                    Abrir <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Botones de acción del modal */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <button
                  onClick={handleImprimir}
                  className="btn-secondary text-xs !py-2.5 flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-900 border-slate-800"
                >
                  <Printer size={16} /> Imprimir / Guardar en PDF
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn-primary text-xs !py-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
