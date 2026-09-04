'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Save, Plus, User, Car, Wrench,
  Calendar, Clock, MapPin, DollarSign, CreditCard,
  Truck, CheckCircle, AlertCircle, Sparkles
} from 'lucide-react'

function NuevaOrdenContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialClienteId = searchParams.get('cliente_id') || ''
  const initialVehiculoId = searchParams.get('vehiculo_id') || ''

  const [loading, setLoading] = useState(false)

  // Catálogos cargados de Supabase
  const [clientes, setClientes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [servicios, setServicios] = useState([])
  const [trabajadores, setTrabajadores] = useState([])

  // Estado del Formulario
  const [clienteId, setClienteId] = useState(initialClienteId)
  const [vehiculoId, setVehiculoId] = useState(initialVehiculoId)
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
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion_default: '',
    notas: '',
  })
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  const [nuevoVehiculoModal, setNuevoVehiculoModal] = useState(false)
  const [vehiculoForm, setVehiculoForm] = useState({
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    tipo: 'SEDAN',
    notas: '',
  })
  const [guardandoVehiculo, setGuardandoVehiculo] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      // 1. Clientes
      const { data: cData } = await supabase.from('clientes').select('*').order('nombre')
      if (cData && cData.length > 0) {
        setClientes(cData)
        if (initialClienteId) {
          setClienteId(initialClienteId)
        }
      }

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
  }, [initialClienteId])

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
        if (initialVehiculoId && vData.some(v => v.id === initialVehiculoId)) {
          setVehiculoId(initialVehiculoId)
        } else {
          setVehiculoId(vData[0].id)
        }
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
  }, [clienteId, clientes, initialVehiculoId])

  // Actualizar precio automáticamente al seleccionar servicio
  const handleServicioChange = (e) => {
    const sId = e.target.value
    setServicioId(sId)
    const selected = servicios.find(s => s.id === sId)
    if (selected) {
      setPrecio(selected.precio)
    }
  }

  // Creación rápida de cliente desde la misma orden
  const handleQuickSaveCliente = async (e) => {
    e.preventDefault()
    if (!clienteForm.nombre.trim() || !clienteForm.telefono.trim()) {
      toast.error('Nombre y teléfono del cliente son requeridos')
      return
    }

    setGuardandoCliente(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: clienteForm.nombre.trim(),
          telefono: clienteForm.telefono.trim(),
          email: clienteForm.email.trim() || null,
          direccion_default: clienteForm.direccion_default.trim() || null,
          notas: clienteForm.notas.trim() || null,
          activo: true
        }])
        .select()
        .single()

      if (error) {
        toast.error(`Error al registrar cliente: ${error.message}`)
        return
      }

      toast.success(`¡Cliente "${data.nombre}" registrado!`)
      setClientes(prev => [data, ...prev])
      setClienteId(data.id)
      if (data.direccion_default) {
        setDireccion(data.direccion_default)
      }
      setNuevoClienteModal(false)
      setClienteForm({ nombre: '', telefono: '', email: '', direccion_default: '', notas: '' })

      // Abrir inmediatamente el modal para registrar el vehículo del cliente nuevo
      setNuevoVehiculoModal(true)
    } catch (err) {
      toast.error('Error al registrar cliente')
    } finally {
      setGuardandoCliente(false)
    }
  }

  // Creación rápida de vehículo desde la misma orden
  const handleQuickSaveVehiculo = async (e) => {
    e.preventDefault()
    if (!clienteId) {
      toast.error('Primero selecciona un cliente')
      return
    }
    if (!vehiculoForm.placa.trim() || !vehiculoForm.marca.trim() || !vehiculoForm.modelo.trim()) {
      toast.error('Placa, marca y modelo son obligatorios')
      return
    }

    setGuardandoVehiculo(true)
    try {
      const cleanPlaca = vehiculoForm.placa.trim().toUpperCase()
      const { data, error } = await supabase
        .from('vehiculos')
        .insert([{
          cliente_id: clienteId,
          placa: cleanPlaca,
          marca: vehiculoForm.marca.trim(),
          modelo: vehiculoForm.modelo.trim(),
          anio: Number(vehiculoForm.anio) || new Date().getFullYear(),
          color: vehiculoForm.color.trim() || 'No especificado',
          tipo: vehiculoForm.tipo || 'SEDAN',
          notas: vehiculoForm.notas.trim() || null,
          activo: true
        }])
        .select()
        .single()

      if (error) {
        toast.error(`Error al agregar vehículo: ${error.message}`)
        return
      }

      toast.success(`Vehículo ${data.marca} ${data.modelo} (${data.placa}) asignado`)
      setVehiculos(prev => [data, ...prev])
      setVehiculoId(data.id)
      setNuevoVehiculoModal(false)
      setVehiculoForm({
        placa: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        color: '',
        tipo: 'SEDAN',
        notas: '',
      })
    } catch (err) {
      toast.error('Error al registrar vehículo')
    } finally {
      setGuardandoVehiculo(false)
    }
  }

  // Guardar la orden
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clienteId) {
      toast.error('Selecciona o registra un cliente')
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
      const numeroOrden = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

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

  const clienteSeleccionado = clientes.find(c => c.id === clienteId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/ordenes"
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-sky-600 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Nueva Orden de Lavado</h1>
            <p className="text-xs text-slate-500">Agendar servicio a domicilio en Comayagua</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNuevoClienteModal(true)}
            className="btn-primary text-xs !py-2 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus size={15} /> + Nuevo Cliente Rápido
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paso 1: Cliente & Vehículo */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">1</span>
              Cliente y Vehículo
            </h2>
            <span className="text-[11px] text-slate-400">Paso obligatorio</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Cliente */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="input-label !mb-0">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setNuevoClienteModal(true)}
                  className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                >
                  <Plus size={13} /> Agregar nuevo cliente
                </button>
              </div>

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
                <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                  <span>No hay clientes registrados aún.</span>
                  <button
                    type="button"
                    onClick={() => setNuevoClienteModal(true)}
                    className="font-bold underline text-amber-900"
                  >
                    Crear uno ahora
                  </button>
                </div>
              )}
            </div>

            {/* Vehículo */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="input-label !mb-0">Vehículo del Cliente *</label>
                {clienteId && (
                  <button
                    type="button"
                    onClick={() => setNuevoVehiculoModal(true)}
                    className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> + Agregar vehículo
                  </button>
                )}
              </div>

              <select
                value={vehiculoId}
                onChange={(e) => setVehiculoId(e.target.value)}
                className="input-field cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={!clienteId}
                required
              >
                <option value="">
                  {!clienteId ? '-- Selecciona un cliente primero --' : '-- Seleccionar Vehículo --'}
                </option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} ({v.placa}) - {v.color} [{v.tipo}]
                  </option>
                ))}
              </select>

              {clienteId && vehiculos.length === 0 && (
                <div className="mt-2 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-800">
                  <span>Este cliente no tiene vehículo registrado.</span>
                  <button
                    type="button"
                    onClick={() => setNuevoVehiculoModal(true)}
                    className="font-bold text-sky-700 bg-white px-2.5 py-1 rounded-lg border border-sky-300 shadow-xs hover:bg-sky-100"
                  >
                    + Registrar Carro Ahora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Paso 2: Servicio & Asignación */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">2</span>
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
                className="input-field cursor-pointer font-medium"
                required
              >
                <option value="">-- Seleccionar Servicio --</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - L. {s.precio} ({s.duracion_min} min)
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
                    {t.nombre} {t.telefono ? `(${t.telefono})` : ''}
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
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">3</span>
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
                placeholder="Ej: Portón blanco, casa de dos plantas, timbre lado derecho"
              />
            </div>
          </div>
        </div>

        {/* Paso 4: Precio y Forma de Pago */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">4</span>
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

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/dashboard/ordenes" className="btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary !px-8 text-base font-bold shadow-lg shadow-sky-500/20"
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

      {/* Modal Rápido: Nuevo Cliente */}
      <Modal
        isOpen={nuevoClienteModal}
        onClose={() => setNuevoClienteModal(false)}
        title="Registrar Nuevo Cliente Rápido"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQuickSaveCliente} className="space-y-4">
          <p className="text-xs text-slate-500 -mt-2">
            Registra los datos del cliente sin salir del formulario. Una vez creado, se seleccionará automáticamente.
          </p>

          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Carlos Mendoza"
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Número de Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              placeholder="Ej: 9988-7766 o +50499887766"
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Dirección Domiciliaria Habitual</label>
            <input
              type="text"
              placeholder="Ej: Bo. Torondón, frente a iglesia, Comayagua"
              value={clienteForm.direccion_default}
              onChange={(e) => setClienteForm({ ...clienteForm, direccion_default: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Correo Electrónico (Opcional)</label>
            <input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={clienteForm.email}
              onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Notas Adicionales (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Cliente preferente, llamar antes de llegar"
              value={clienteForm.notas}
              onChange={(e) => setClienteForm({ ...clienteForm, notas: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNuevoClienteModal(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoCliente}
              className="btn-primary text-xs"
            >
              {guardandoCliente ? 'Guardando...' : 'Guardar y Continuar a Vehículo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Rápido: Nuevo Vehículo */}
      <Modal
        isOpen={nuevoVehiculoModal}
        onClose={() => setNuevoVehiculoModal(false)}
        title={clienteSeleccionado ? `Registrar Vehículo para ${clienteSeleccionado.nombre}` : 'Registrar Vehículo'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleQuickSaveVehiculo} className="space-y-4">
          <p className="text-xs text-slate-500 -mt-2">
            Asocia este vehículo al cliente seleccionado para asignarlo inmediatamente a la orden.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Número de Placa *</label>
              <input
                type="text"
                required
                placeholder="Ej: HAB-1234"
                value={vehiculoForm.placa}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, placa: e.target.value.toUpperCase() })}
                className="input-field font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="input-label">Tipo de Carrocería</label>
              <select
                value={vehiculoForm.tipo}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="SEDAN">Turismo / Sedán</option>
                <option value="SUV">Camioneta / SUV</option>
                <option value="PICKUP">Pick-Up</option>
                <option value="VAN">Van / Minivan</option>
                <option value="MOTO">Motocicleta</option>
                <option value="CAMION">Camión</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Marca *</label>
              <input
                type="text"
                required
                placeholder="Ej: Toyota, Honda, Ford..."
                value={vehiculoForm.marca}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, marca: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Modelo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Hilux, Civic, Ranger..."
                value={vehiculoForm.modelo}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, modelo: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Color</label>
              <input
                type="text"
                placeholder="Ej: Blanco, Gris, Negro..."
                value={vehiculoForm.color}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, color: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="input-label">Año (Aprox)</label>
              <input
                type="number"
                min="1980"
                max="2030"
                value={vehiculoForm.anio}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, anio: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Notas del Vehículo (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Polarizado oscuro, detalles de pintura en bumper"
              value={vehiculoForm.notas}
              onChange={(e) => setVehiculoForm({ ...vehiculoForm, notas: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNuevoVehiculoModal(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoVehiculo}
              className="btn-primary text-xs"
            >
              {guardandoVehiculo ? 'Guardando...' : 'Guardar y Asignar a la Orden'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default function NuevaOrdenPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm font-semibold">Cargando formulario de orden...</p>
      </div>
    }>
      <NuevaOrdenContent />
    </Suspense>
  )
}
