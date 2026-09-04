'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Users, Plus, Search, Phone, MapPin,
  Car, Eye, Edit2, Trash2, Calendar, FileText, Droplets
} from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Crear/Editar Cliente
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion_default: '',
    notas: '',
  })

  // Modal Rápido: Agregar Vehículo a Cliente Seleccionado
  const [vehiculoModalOpen, setVehiculoModalOpen] = useState(false)
  const [clientForVehicle, setClientForVehicle] = useState(null)
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

  // Modal Detalle / Historial
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [vehiculosCliente, setVehiculosCliente] = useState([])
  const [historialOrdenes, setHistorialOrdenes] = useState([])

  const fetchClientes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select(`
          *,
          vehiculos:vehiculos(*)
        `)
        .order('nombre')

      if (error) {
        console.error('Error fetching clients:', error.message)
        toast.error('Error al cargar clientes de Supabase')
        setClientes([])
        return
      }

      setClientes(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const handleOpenModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente)
      setFormData({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        email: cliente.email || '',
        direccion_default: cliente.direccion_default || '',
        notas: cliente.notas || '',
      })
    } else {
      setEditingCliente(null)
      setFormData({
        nombre: '',
        telefono: '',
        email: '',
        direccion_default: '',
        notas: '',
      })
    }
    setModalOpen(true)
  }

  const handleSaveCliente = async (e) => {
    e.preventDefault()
    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCliente.id)

        if (error) {
          toast.error(`Error al actualizar cliente: ${error.message}`)
          return
        }

        toast.success('Cliente actualizado correctamente')
      } else {
        const { data, error } = await supabase
          .from('clientes')
          .insert([{ ...formData }])
          .select()

        if (error) {
          toast.error(`Error al registrar cliente: ${error.message}`)
          return
        }

        toast.success('Cliente registrado exitosamente en la base de datos')
      }
      setModalOpen(false)
      fetchClientes()
    } catch (err) {
      toast.error('Error de conexión al guardar cliente')
    }
  }

  const handleDeleteCliente = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al cliente "${nombre}"?`)) return
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key')) {
          toast.error('No se puede eliminar: tiene órdenes asociadas. Puedes editar sus datos o conservarlo en el historial.')
        } else {
          toast.error(`Error al eliminar cliente: ${error.message}`)
        }
        return
      }
      setClientes(clientes.filter(c => c.id !== id))
      toast.success('Cliente eliminado')
    } catch (err) {
      toast.error('Error al eliminar cliente')
    }
  }

  const handleVerHistorial = async (cliente) => {
    setSelectedCliente(cliente)
    setVehiculosCliente(cliente.vehiculos || [])

    // Cargar historial de órdenes
    const { data } = await supabase
      .from('ordenes')
      .select('*, servicio:servicios(nombre)')
      .eq('cliente_id', cliente.id)

    setHistorialOrdenes(data || [])
    setDetailModalOpen(true)
  }

  // Abrir modal para agregar vehículo directamente a un cliente
  const handleOpenAddVehiculo = (cliente) => {
    setClientForVehicle(cliente)
    setVehiculoForm({
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      color: '',
      tipo: 'SEDAN',
      notas: '',
    })
    setVehiculoModalOpen(true)
  }

  const handleSaveVehiculo = async (e) => {
    e.preventDefault()
    if (!clientForVehicle) return
    if (!vehiculoForm.placa.trim() || !vehiculoForm.marca.trim() || !vehiculoForm.modelo.trim()) {
      toast.error('Placa, marca y modelo son obligatorios')
      return
    }

    setGuardandoVehiculo(true)
    try {
      const { error } = await supabase
        .from('vehiculos')
        .insert([{
          cliente_id: clientForVehicle.id,
          placa: vehiculoForm.placa.trim().toUpperCase(),
          marca: vehiculoForm.marca.trim(),
          modelo: vehiculoForm.modelo.trim(),
          anio: Number(vehiculoForm.anio) || new Date().getFullYear(),
          color: vehiculoForm.color.trim() || 'No especificado',
          tipo: vehiculoForm.tipo || 'SEDAN',
          notas: vehiculoForm.notas.trim() || null,
          activo: true
        }])

      if (error) {
        toast.error(`Error al agregar vehículo: ${error.message}`)
        return
      }

      toast.success(`Vehículo agregado a ${clientForVehicle.nombre}`)
      setVehiculoModalOpen(false)
      fetchClientes()
    } catch (err) {
      toast.error('Error al registrar vehículo')
    } finally {
      setGuardandoVehiculo(false)
    }
  }

  const clientesFiltrados = clientes.filter(c =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.telefono?.includes(search) ||
    c.direccion_default?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de Clientes</h1>
          <p className="page-subtitle">Base de datos de clientes, vehículos asociados e historial de lavados</p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="glass-card p-4 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono / WhatsApp</th>
                <th>Dirección Predeterminada</th>
                <th>Vehículos Registrados</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <Users size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay clientes registrados aún</p>
                    <p className="text-xs text-slate-400 mt-0.5">Haz clic en "Nuevo Cliente" para agregar a tu primer cliente</p>
                  </td>
                </tr>
              )}
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        {cliente.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">{cliente.nombre}</span>
                        <span className="text-xs text-slate-400">{cliente.email || 'Sin correo'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <a
                      href={`https://wa.me/${cliente.telefono?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Phone size={12} /> {cliente.telefono}
                    </a>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 flex items-center gap-1 truncate max-w-[200px]" title={cliente.direccion_default}>
                      <MapPin size={12} className="text-rose-500 shrink-0" />
                      {cliente.direccion_default || 'No especificada'}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(cliente.vehiculos || []).map((v, i) => (
                        <span key={i} className="text-[11px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100 font-semibold">
                          {v.marca} {v.modelo} ({v.placa})
                        </span>
                      ))}
                      {(!cliente.vehiculos || cliente.vehiculos.length === 0) && (
                        <span className="text-xs text-slate-400 italic mr-1">Sin vehículos</span>
                      )}
                      <button
                        onClick={() => handleOpenAddVehiculo(cliente)}
                        className="p-1 text-sky-600 hover:bg-sky-50 rounded text-[11px] font-bold flex items-center gap-0.5"
                        title="Agregar vehículo a este cliente"
                      >
                        <Plus size={12} /> + Auto
                      </button>
                    </div>
                  </td>
                  <td className="sticky-right text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/dashboard/ordenes/nueva?cliente_id=${cliente.id}`}
                        className="px-2.5 py-1 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        title="Crear Orden de Lavado para este Cliente"
                      >
                        <Droplets size={13} className="text-sky-500" /> Orden
                      </Link>
                      <button
                        onClick={() => handleVerHistorial(cliente)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Ver Historial"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenModal(cliente)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCliente(cliente.id, cliente.nombre)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Cliente"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Cliente */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
      >
        <form onSubmit={handleSaveCliente} className="space-y-4">
          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input-field"
              placeholder="Ej: Roberto Pineda"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Teléfono / WhatsApp *</label>
              <input
                type="text"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="input-field"
                placeholder="+504 9999-9999"
              />
            </div>
            <div>
              <label className="input-label">Correo Electrónico</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Dirección Habitual en Comayagua</label>
            <input
              type="text"
              value={formData.direccion_default}
              onChange={(e) => setFormData({ ...formData, direccion_default: e.target.value })}
              className="input-field"
              placeholder="Ej: Barrio Torondón, casa #45"
            />
          </div>

          <div>
            <label className="input-label">Notas Adicionales</label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="input-field min-h-[60px]"
              placeholder="Preferencias del cliente, indicaciones de acceso..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Agregar Vehículo a Cliente */}
      <Modal
        isOpen={vehiculoModalOpen}
        onClose={() => setVehiculoModalOpen(false)}
        title={clientForVehicle ? `Registrar Vehículo para ${clientForVehicle.nombre}` : 'Registrar Vehículo'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveVehiculo} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Placa *</label>
              <input
                type="text"
                required
                placeholder="HAB-1234"
                value={vehiculoForm.placa}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, placa: e.target.value.toUpperCase() })}
                className="input-field font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="input-label">Carrocería</label>
              <select
                value={vehiculoForm.tipo}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, tipo: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="SEDAN">Turismo / Sedán</option>
                <option value="SUV">Camioneta SUV</option>
                <option value="PICKUP">Pick-Up</option>
                <option value="VAN">Van</option>
                <option value="MOTO">Moto</option>
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
                placeholder="Ej: Toyota"
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
                placeholder="Ej: Hilux"
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
                placeholder="Ej: Blanco"
                value={vehiculoForm.color}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, color: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Año</label>
              <input
                type="number"
                value={vehiculoForm.anio}
                onChange={(e) => setVehiculoForm({ ...vehiculoForm, anio: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVehiculoModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoVehiculo}
              className="btn-primary text-xs"
            >
              {guardandoVehiculo ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Historial y Vehículos */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={`Detalle: ${selectedCliente?.nombre}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Vehículos del Cliente
              </h4>
              <button
                onClick={() => {
                  setDetailModalOpen(false)
                  if (selectedCliente) handleOpenAddVehiculo(selectedCliente)
                }}
                className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> + Registrar Otro Auto
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehiculosCliente.map((v, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block text-sm">{v.marca} {v.modelo}</span>
                  <span className="text-sky-700 font-mono font-bold block">PLACA: {v.placa}</span>
                  <span className="text-slate-500">Color: {v.color} · Año: {v.anio} · {v.tipo}</span>
                </div>
              ))}
              {vehiculosCliente.length === 0 && (
                <p className="text-xs text-slate-400 italic">No tiene vehículos registrados</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Historial de Servicios
            </h4>
            {historialOrdenes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Sin órdenes anteriores registradas</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {historialOrdenes.map((o) => (
                  <div key={o.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-sky-600 font-mono block">{o.numero}</span>
                      <span className="text-slate-700">{o.servicio?.nombre}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">L. {o.precio}</span>
                      <span className="text-[10px] text-slate-400">{o.created_at?.split('T')[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
