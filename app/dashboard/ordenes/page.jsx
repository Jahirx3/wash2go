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
  XCircle, Truck, Droplets, ExternalLink, MessageCircle, Copy, Send
} from 'lucide-react'
import { getTrackingUrl } from '@/lib/utils'

export default function OrdenesPage() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('TODOS')

  // Modal de Detalle / Orden de Trabajo
  const [selectedOrden, setSelectedOrden] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchOrdenes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(nombre, telefono, email),
          vehiculo:vehiculos(marca, modelo, placa, color, anio),
          servicio:servicios(nombre, precio),
          trabajador:usuarios(nombre, telefono)
        `)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setOrdenes(data)
      } else {
        // Datos de ejemplo representativos
        setOrdenes([
          {
            id: 'ord-1',
            numero: 'ORD-2026-0001',
            estado: 'LAVANDO',
            direccion: 'Barrio Arriba, 3ra calle, Casa #14, Comayagua',
            referencia: 'Frente a pulpería Don Chepe',
            precio: 300,
            forma_pago: 'EFECTIVO',
            fecha_programada: '2026-09-02',
            hora_programada: '10:00',
            foto_antes_url: null,
            foto_despues_url: null,
            created_at: new Date().toISOString(),
            cliente: { nombre: 'Mario Aguilar', telefono: '+504 9876-1234', email: 'mario@email.com' },
            vehiculo: { marca: 'Toyota', modelo: 'Hilux', placa: 'HAB-1029', color: 'Blanco', anio: 2022 },
            servicio: { nombre: 'Lavado Completo', precio: 300 },
            trabajador: { nombre: 'Carlos Mejía', telefono: '+504 9911-2233' }
          },
          {
            id: 'ord-2',
            numero: 'ORD-2026-0002',
            estado: 'EN_CAMINO',
            direccion: 'Col. San Martín, Calle Principal',
            referencia: 'Portón negro',
            precio: 150,
            forma_pago: 'TRANSFERENCIA',
            fecha_programada: '2026-09-02',
            hora_programada: '11:30',
            foto_antes_url: null,
            foto_despues_url: null,
            created_at: new Date().toISOString(),
            cliente: { nombre: 'Lucía Fernández', telefono: '+504 9555-4321', email: 'lucia@email.com' },
            vehiculo: { marca: 'Hyundai', modelo: 'Elantra', placa: 'HAC-4432', color: 'Gris', anio: 2020 },
            servicio: { nombre: 'Lavado Básico', precio: 150 },
            trabajador: { nombre: 'Juan Romero', telefono: '+504 9922-3344' }
          },
          {
            id: 'ord-3',
            numero: 'ORD-2026-0003',
            estado: 'FINALIZADO',
            direccion: 'Residencial Plaza de Armas, Bloque B',
            referencia: 'Cerca de caseta de vigilancia',
            precio: 500,
            forma_pago: 'EFECTIVO',
            fecha_programada: '2026-09-01',
            hora_programada: '15:00',
            foto_antes_url: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&auto=format&fit=crop',
            foto_despues_url: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600&auto=format&fit=crop',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            cliente: { nombre: 'Roberto Pineda', telefono: '+504 8888-9900', email: 'roberto@email.com' },
            vehiculo: { marca: 'Ford', modelo: 'Ranger', placa: 'HAD-8821', color: 'Azul', anio: 2023 },
            servicio: { nombre: 'Lavado Premium', precio: 500 },
            trabajador: { nombre: 'Carlos Mejía', telefono: '+504 9911-2233' }
          },
        ])
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdenes()
  }, [])

  // Cambiar estado rápido
  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('ordenes')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      // Actualizar localmente
      setOrdenes(ordenes.map(o => o.id === id ? { ...o, estado: nuevoEstado } : o))
      if (selectedOrden?.id === id) {
        setSelectedOrden({ ...selectedOrden, estado: nuevoEstado })
      }
      toast.success(`Estado cambiado a ${nuevoEstado}`)
    } catch (err) {
      toast.error('Error al actualizar estado')
    }
  }

  // Filtrar
  const ordenesFiltradas = ordenes.filter(o => {
    const matchesSearch =
      o.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vehiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.direccion?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFiltro = filtroEstado === 'TODOS' || o.estado === filtroEstado
    return matchesSearch && matchesFiltro
  })

  // Imprimir Orden de Trabajo
  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Órdenes de Lavado</h1>
          <p className="page-subtitle">Control de servicios a domicilio, asignaciones y estados</p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/ordenes/nueva" className="btn-primary">
            <Plus size={18} />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* Barra de Filtros & Búsqueda */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Input de Búsqueda */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por cliente, placa, orden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        {/* Botones de Estado */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'LAVANDO', 'FINALIZADO', 'CANCELADO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroEstado(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === st
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {st === 'TODOS' ? 'Todos' : st.replace('_', ' ')}
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
                <th>Fecha / Hora</th>
                <th>Dirección</th>
                <th>Lavador</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10 text-slate-400">
                    No se encontraron órdenes registradas
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map((orden) => (
                  <tr key={orden.id}>
                    <td className="font-bold text-sky-600 font-mono">
                      {orden.numero}
                    </td>
                    <td>
                      <div>
                        <span className="font-semibold block text-slate-800">{orden.cliente?.nombre || 'Sin nombre'}</span>
                        <a
                          href={`https://wa.me/${orden.cliente?.telefono?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Phone size={11} /> {orden.cliente?.telefono}
                        </a>
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="font-medium text-slate-700">
                          {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                        </span>
                        <span className="text-xs text-slate-400 block font-mono">
                          {orden.vehiculo?.placa} · {orden.vehiculo?.color}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {orden.servicio?.nombre}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 block">
                        {orden.fecha_programada}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {orden.hora_programada || '10:00'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 truncate max-w-[150px] block" title={orden.direccion}>
                        {orden.direccion}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-700">
                        {orden.trabajador?.nombre || <span className="text-amber-600 font-normal">Sin asignar</span>}
                      </span>
                    </td>
                    <td>
                      <Badge estado={orden.estado} />
                    </td>
                    <td className="text-right font-bold text-slate-800">
                      L. {Number(orden.precio || 0).toFixed(2)}
                    </td>
                    <td className="sticky-right text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedOrden(orden)
                            setModalOpen(true)
                          }}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          title="Ver Detalle / Imprimir Orden"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle / Orden de Trabajo (con opción de impresión) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Orden de Trabajo: ${selectedOrden?.numero}`}
        maxWidth="max-w-3xl"
      >
        {selectedOrden && (
          <div className="space-y-6 print:m-0" id="orden-trabajo-imprimir">
            {/* Header de la Orden (para imprimir) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Wash2Go" className="h-12 object-contain" />
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">WASH2GO</h3>
                  <p className="text-xs text-slate-500">Autolavado a Domicilio · Comayagua, Honduras</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Orden N°</span>
                <span className="text-xl font-black text-sky-600 font-mono">{selectedOrden.numero}</span>
              </div>
            </div>

            {/* Datos de la orden en grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Cliente:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedOrden.cliente?.nombre}</span>
                <span className="text-slate-500 block">{selectedOrden.cliente?.telefono}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Vehículo:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedOrden.vehiculo?.marca} {selectedOrden.vehiculo?.modelo} ({selectedOrden.vehiculo?.anio})
                </span>
                <span className="font-mono text-sky-700 block font-bold">
                  PLACA: {selectedOrden.vehiculo?.placa} · {selectedOrden.vehiculo?.color}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Servicio Solicitado:</span>
                <span className="font-bold text-slate-800 text-sm">{selectedOrden.servicio?.nombre}</span>
                <span className="text-emerald-600 font-bold block">
                  L. {Number(selectedOrden.precio || 0).toFixed(2)} ({selectedOrden.forma_pago})
                </span>
              </div>

              <div className="col-span-2">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Dirección de Entrega:</span>
                <span className="font-semibold text-slate-800">{selectedOrden.direccion}</span>
                {selectedOrden.referencia && (
                  <span className="text-slate-500 block text-[11px] italic">Ref: {selectedOrden.referencia}</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Lavador Asignado:</span>
                <span className="font-bold text-slate-800">
                  {selectedOrden.trabajador?.nombre || 'Pendiente de asignar'}
                </span>
              </div>
            </div>

            {/* Selector de cambio de estado rápido */}
            <div className="border border-slate-200 p-4 rounded-xl">
              <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                Actualizar Estado del Servicio:
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

            {/* Fotos Antes y Después */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Evidencia Fotográfica (Antes y Después)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-xs font-bold text-slate-600 block mb-2 uppercase">Foto Antes</span>
                  {selectedOrden.foto_antes_url ? (
                    <img
                      src={selectedOrden.foto_antes_url}
                      alt="Antes"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-40 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                      <Droplets size={24} className="mb-1 text-slate-400" />
                      Pendiente foto del lavador
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                  <span className="text-xs font-bold text-emerald-700 block mb-2 uppercase">Foto Después</span>
                  {selectedOrden.foto_despues_url ? (
                    <img
                      src={selectedOrden.foto_despues_url}
                      alt="Después"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-40 bg-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                      <CheckCircle size={24} className="mb-1 text-slate-400" />
                      Pendiente foto de finalización
                    </div>
                  )}
                </div>
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
                  title="Copiar enlace al portapapeles"
                >
                  <Copy size={13} /> Copiar
                </button>
                {selectedOrden.cliente?.telefono && (
                  <a
                    href={`https://wa.me/${selectedOrden.cliente.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${selectedOrden.cliente.nombre}! 🚗💦 Puedes seguir el estado de tu lavado en vivo aquí:\n${getTrackingUrl(selectedOrden.numero)}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary !py-1.5 !px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 bg-emerald-50/50"
                    title="Enviar enlace por WhatsApp"
                  >
                    <Send size={13} /> WhatsApp
                  </a>
                )}
                <a
                  href={`/tracking/${selectedOrden.numero}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary !py-1.5 !px-2.5 text-xs"
                  title="Abrir en pestaña nueva"
                >
                  Abrir <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Botones de acción del modal */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <button
                onClick={handleImprimir}
                className="btn-secondary text-xs !py-2"
              >
                <Printer size={15} /> Imprimir Orden de Trabajo
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="btn-primary text-xs !py-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
