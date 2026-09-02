'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Plus, User, Car, Wrench,
  Calendar, Clock, MapPin, DollarSign, CreditCard,
  Truck, CheckCircle, AlertCircle
} from 'lucide-react'

export default function NuevaOrdenPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Catálogos cargados de Supabase
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [servicios, setServicios] = useState([])
  const [trabajadores, setTrabajadores] = useState([])

  // Estado del Formulario
  const [clienteId, setClienteId] = useState('')
  const [vehiculoId, setVehiculoId] = useState('')
  const [servicioId, setServicioId] = useState('')
  const [trabajadorId, setTrabajadorId] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().split('T')[0])
  const [horaProgramada, setHoraProgramada] = useState('10:00')
  const [direccion, setDireccion] = useState('Comayagua')
  const [referencia, setReferencia] = useState('')
  const [precio, setPrecio] = useState(0)
  const [formaPago, setFormaPago] = useState('EFECTIVO')
  const [notas, setNotas] = useState('')

  // Modales rápidos de creación
  const [nuevoClienteModal, setNuevoClienteModal] = useState(false)
  const [nuevoVehiculoModal, setNuevoVehiculoModal] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      // 1. Clientes
      const { data: cData } = await supabase.from('clientes').select('*').order('nombre')
      if (cData && cData.length > 0) setClientes(cData)

      // 2. Servicios
      const { data: sData } = await supabase.from('servicios').select('*').eq('activo', true).order('precio')
      if (sData && sData.length > 0) {
        setServicios(sData)
        setServicioId(sData[0].id)
        setPrecio(sData[0].precio)
      }

      // 3. Trabajadores
      const { data: tData } = await supabase.from('usuarios').select('*').eq('rol', 'TRABAJADOR').eq('activo', true)
      if (tData && tData.length > 0) {
        setTrabajadores(tData)
      }
    }
    loadData()
  }, [])

  // Filtrar vehículos cuando cambia el cliente seleccionado
  useEffect(() => {
    if (!clienteId) {
      setVehiculos([])
      setVehiculoId('')
      return
    }

    const loadVehiculos = async () => {
      const { data: vData } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('cliente_id', clienteId)

      if (vData && vData.length > 0) {
        setVehiculos(vData)
        setVehiculoId(vData[0].id)
      } else {
        setVehiculos([])
        setVehiculoId('')
      }
    }
    loadVehiculos()

    // Auto-completar dirección si el cliente tiene una guardada
    const clienteSelected = clientes.find(c => c.id === clienteId)
    if (clienteSelected?.direccion_default) {
      setDireccion(clienteSelected.direccion_default)
    }
  }, [clienteId, clientes])

  // Actualizar precio automáticamente al seleccionar servicio
  const handleServicioChange = (e) => {
    const sId = e.target.value
    setServicioId(sId)
    const selected = servicios.find(s => s.id === sId)
    if (selected) {
      setPrecio(selected.precio)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clienteId) {
      toast.error('Selecciona un cliente')
      return
    }
    if (!vehiculoId) {
      toast.error('Selecciona o registra un vehículo para este cliente')
      return
    }
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    if (!isUUID(servicioId)) {
      toast.error('Selecciona un servicio válido de la lista')
      return
    }

    setLoading(true)
    try {
      const numeroOrden = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`

      const payload = {
        numero: numeroOrden,
        cliente_id: clienteId,
        vehiculo_id: vehiculoId,
        servicio_id: servicioId,
        trabajador_id: (trabajadorId && isUUID(trabajadorId)) ? trabajadorId : null,
        estado: 'PENDIENTE',
        direccion,
        referencia,
        precio: Number(precio),
        total_cobrado: Number(precio),
        forma_pago: formaPago,
        fecha_programada: fechaProgramada,
        hora_programada: horaProgramada,
        notas,
      }

      const { data, error } = await supabase
        .from('ordenes')
        .insert([payload])
        .select()

      if (error) {
        console.error('Supabase orden insert error:', error.message)
        toast.error(`Error al guardar en Supabase: ${error.message}`)
        return
      }

      toast.success(`¡Orden ${numeroOrden} registrada con éxito!`)
      router.push('/dashboard/ordenes')
    } catch (err) {
      toast.error('Error al guardar la orden: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ordenes"
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-sky-600 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Nueva Orden de Lavado</h1>
            <p className="text-xs text-slate-500">Comisiona un servicio a domicilio en Comayagua</p>
          </div>
        </div>

        <Link
          href="/dashboard/clientes"
          className="btn-secondary text-xs !py-2"
        >
          <User size={15} /> Administrar Clientes
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paso 1: Cliente & Vehículo */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">1</span>
              Cliente y Vehículo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="input-label">Cliente *</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="input-field cursor-pointer"
                required
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.telefono})
                  </option>
                ))}
              </select>
              {clientes.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No hay clientes registrados aún. Puedes crearlo en la sección Clientes.
                </p>
              )}
            </div>

            {/* Vehículo */}
            <div>
              <label className="input-label">Vehículo del Cliente *</label>
              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="input-field cursor-pointer"
                disabled={!clienteId}
                required
              >
                <option value="">-- Seleccionar Vehículo --</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} ({v.placa}) - {v.color}
                  </option>
                ))}
              </select>
              {clienteId && vehiculos.length === 0 && (
                <p className="text-[11px] text-rose-500 mt-1">
                  Este cliente no tiene vehículos asignados. Agrega uno en la sección Vehículos.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Paso 2: Servicio & Asignación */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">2</span>
              Servicio y Lavador Asignado
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Servicio */}
            <div>
              <label className="input-label">Servicio Requerido *</label>
              <select
                value={servicioId}
                onChange={handleServicioChange}
                className="input-field cursor-pointer"
                required
              >
                <option value="">-- Seleccionar Servicio --</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - L. {s.precio}
                  </option>
                ))}
              </select>
            </div>

            {/* Trabajador Asignado */}
            <div>
              <label className="input-label">Trabajador / Lavador</label>
              <select
                value={trabajadorId}
                onChange={(e) => setTrabajadorId(e.target.value)}
                className="input-field cursor-pointer"
              >
                <option value="">-- Asignar más tarde (Pendiente) --</option>
                {trabajadores.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Paso 3: Fecha, Hora y Dirección */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">3</span>
              Programación y Ubicación en Comayagua
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Fecha Programada</label>
              <input
                type="date"
                value={fechaProgramada}
                onChange={(e) => setFechaProgramada(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="input-label">Hora Estimada</label>
              <input
                type="time"
                value={horaProgramada}
                onChange={(e) => setHoraProgramada(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="input-label">Dirección Domiciliaria / Ubicación GPS *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 text-rose-500" size={18} />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Ej: Barrio Arriba, 4ta calle frente al parque, Comayagua"
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="input-label">Referencia / Indicaciones Adicionales</label>
              <input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="input-field"
                placeholder="Ej: Portón blanco, casa de dos plantas"
              />
            </div>
          </div>
        </div>

        {/* Paso 4: Precio y Forma de Pago */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">4</span>
              Precio y Método de Pago
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Precio del Servicio (Lempiras) *</label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 font-bold text-slate-500">L.</span>
                <input
                  type="number"
                  step="0.01"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="input-field pl-10 font-bold text-slate-800 text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Forma de Pago *</label>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value)}
                className="input-field cursor-pointer"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="input-label">Notas Adicionales de la Orden</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="input-field min-h-[70px]"
                placeholder="Observaciones sobre manchas difíciles, cuidado especial con el tablero, etc."
              />
            </div>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/ordenes" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !px-8 text-base font-bold shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={18} />
                Crear Orden de Trabajo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
