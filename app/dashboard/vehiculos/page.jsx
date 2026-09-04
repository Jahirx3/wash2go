'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Car, Plus, Search, User, Edit2, Trash2, Calendar, Droplets } from 'lucide-react'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal Vehículo
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehiculo, setEditingVehiculo] = useState(null)
  const [formData, setFormData] = useState({
    cliente_id: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    placa: '',
    tipo: 'SEDAN',
    notas: '',
  })

  // Modal Rápido: Nuevo Cliente desde Vehículos
  const [nuevoClienteModal, setNuevoClienteModal] = useState(false)
  const [clienteForm, setClienteForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion_default: '',
    notas: '',
  })
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  const fetchVehiculos = async () => {
    setLoading(true)
    try {
      const { data: vData, error: vError } = await supabase
        .from('vehiculos')
        .select(`
          *,
          cliente:clientes(id, nombre, telefono)
        `)
        .order('marca')

      const { data: cData, error: cError } = await supabase
        .from('clientes')
        .select('id, nombre, telefono')
        .order('nombre')

      if (cData) setClientes(cData)

      if (vError) {
        console.error('Error fetching vehicles:', vError.message)
        toast.error('Error al cargar vehículos de Supabase')
        setVehiculos([])
        return
      }

      setVehiculos(vData || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVehiculos()
  }, [])

  const handleOpenModal = (vehiculo = null) => {
    if (vehiculo) {
      setEditingVehiculo(vehiculo)
      setFormData({
        cliente_id: vehiculo.cliente_id || '',
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        color: vehiculo.color,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo || 'SEDAN',
        notas: vehiculo.notas || '',
      })
    } else {
      setEditingVehiculo(null)
      setFormData({
        cliente_id: clientes[0]?.id || '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        color: '',
        placa: '',
        tipo: 'SEDAN',
        notas: '',
      })
    }
    setModalOpen(true)
  }

  const handleSaveVehiculo = async (e) => {
    e.preventDefault()
    if (!formData.cliente_id) {
      toast.error('Selecciona un cliente para el vehículo')
      return
    }

    try {
      if (editingVehiculo) {
        const { error } = await supabase
          .from('vehiculos')
          .update({
            ...formData,
            placa: formData.placa.trim().toUpperCase(),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVehiculo.id)

        if (error) {
          toast.error(`Error al actualizar: ${error.message}`)
          return
        }

        toast.success('Vehículo actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('vehiculos')
          .insert([{
            ...formData,
            placa: formData.placa.trim().toUpperCase()
          }])

        if (error) {
          toast.error(`Error al registrar vehículo: ${error.message}`)
          return
        }

        toast.success('Vehículo registrado en la base de datos')
      }
      setModalOpen(false)
      fetchVehiculos()
    } catch (err) {
      toast.error('Error de conexión al guardar vehículo')
    }
  }

  const handleDeleteVehiculo = async (id, placa) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo con placa "${placa}"?`)) return
    try {
      const { error } = await supabase.from('vehiculos').delete().eq('id', id)
      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key')) {
          toast.error('No se puede eliminar: tiene órdenes asociadas. Puedes editarlo o mantenerlo en el historial.')
        } else {
          toast.error(`Error al eliminar vehículo: ${error.message}`)
        }
        return
      }
      setVehiculos(vehiculos.filter(v => v.id !== id))
      toast.success('Vehículo eliminado')
    } catch (err) {
      toast.error('Error al eliminar vehículo')
    }
  }

  // Guardar nuevo cliente desde modal rápido
  const handleQuickSaveCliente = async (e) => {
    e.preventDefault()
    if (!clienteForm.nombre.trim() || !clienteForm.telefono.trim()) {
      toast.error('Nombre y teléfono son requeridos')
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
        if (error.code === '23505' || error.message?.includes('clientes_telefono_key')) {
          const rawPhone = clienteForm.telefono.trim()
          const digits = rawPhone.replace(/[^0-9]/g, '')

          const { data: allClients } = await supabase.from('clientes').select('*')
          const existing = allClients?.find(c => {
            if (!c.telefono) return false
            const cDigits = c.telefono.replace(/[^0-9]/g, '')
            return c.telefono === rawPhone || cDigits === digits || (digits.length >= 8 && cDigits.endsWith(digits)) || (cDigits.length >= 8 && digits.endsWith(cDigits))
          })

          if (existing) {
            toast.success(`El cliente "${existing.nombre}" con este teléfono ya existe. Se seleccionó automáticamente.`, { duration: 4000 })
            setClientes(prev => prev.some(c => c.id === existing.id) ? prev : [existing, ...prev])
            setFormData(prev => ({ ...prev, cliente_id: existing.id }))
            setNuevoClienteModal(false)
            setClienteForm({ nombre: '', telefono: '', email: '', direccion_default: '', notas: '' })
            return
          }
        }
        toast.error(`Error al registrar cliente: ${error.message}`)
        return
      }

      toast.success(`Cliente "${data.nombre}" registrado exitosamente`)
      setClientes(prev => [data, ...prev])
      setFormData(prev => ({ ...prev, cliente_id: data.id }))
      setNuevoClienteModal(false)
      setClienteForm({ nombre: '', telefono: '', email: '', direccion_default: '', notas: '' })
    } catch (err) {
      toast.error('Error al guardar cliente')
    } finally {
      setGuardandoCliente(false)
    }
  }

  const vehiculosFiltrados = vehiculos.filter(v =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.marca?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.cliente?.nombre?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Vehículos</h1>
          <p className="page-subtitle">Registro de automóviles, tipo de carrocería y placas de clientes</p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={18} />
          Nuevo Vehículo
        </button>
      </div>

      <div className="glass-card p-4 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Placa</th>
                <th>Vehículo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Tipo</th>
                <th>Cliente Dueño</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehiculosFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Car size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay vehículos registrados aún</p>
                    <p className="text-xs text-slate-400 mt-0.5">Haz clic en "Nuevo Vehículo" para asociar un auto a un cliente</p>
                  </td>
                </tr>
              )}
              {vehiculosFiltrados.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono font-bold text-sky-600 text-sm">
                    {v.placa}
                  </td>
                  <td>
                    <span className="font-bold text-slate-800 block">{v.marca} {v.modelo}</span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">{v.anio}</span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-700">{v.color}</span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {v.tipo}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-semibold text-slate-800 block">
                      {v.cliente?.nombre || 'Sin cliente'}
                    </span>
                    {v.cliente?.telefono && (
                      <span className="text-[11px] text-slate-400 block">{v.cliente.telefono}</span>
                    )}
                  </td>
                  <td className="sticky-right text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link
                        href={`/dashboard/ordenes/nueva?cliente_id=${v.cliente_id}&vehiculo_id=${v.id}`}
                        className="px-2.5 py-1 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                        title="Crear orden para este carro"
                      >
                        <Droplets size={13} className="text-sky-500" /> Lavar
                      </Link>
                      <button
                        onClick={() => handleOpenModal(v)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteVehiculo(v.id, v.placa)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Vehículo"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Principal: Registrar / Editar Vehículo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehiculo ? 'Editar Vehículo' : 'Registrar Vehículo'}
      >
        <form onSubmit={handleSaveVehiculo} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="input-label !mb-0">Cliente Dueño *</label>
              <button
                type="button"
                onClick={() => setNuevoClienteModal(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> + Nuevo Cliente
              </button>
            </div>
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              className="input-field cursor-pointer"
              required
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.telefono})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Marca *</label>
              <input
                type="text"
                required
                value={formData.marca}
                onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                className="input-field"
                placeholder="Toyota, Ford, Honda..."
              />
            </div>
            <div>
              <label className="input-label">Modelo *</label>
              <input
                type="text"
                required
                value={formData.modelo}
                onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                className="input-field"
                placeholder="Hilux, Civic, Ranger..."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">Placa *</label>
              <input
                type="text"
                required
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                className="input-field font-mono font-bold uppercase"
                placeholder="HAB-1234"
              />
            </div>
            <div>
              <label className="input-label">Año</label>
              <input
                type="number"
                value={formData.anio}
                onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="input-field"
                placeholder="Blanco, Gris..."
              />
            </div>
          </div>

          <div>
            <label className="input-label">Tipo de Carrocería</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="input-field cursor-pointer"
            >
              <option value="SEDAN">Sedán / Turismo</option>
              <option value="SUV">Camioneta SUV</option>
              <option value="PICKUP">Pick-up / Paila</option>
              <option value="VAN">Microbús / Van</option>
              <option value="MOTO">Motocicleta</option>
              <option value="CAMION">Camión / Pesado</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div>
            <label className="input-label">Notas Adicionales (Opcional)</label>
            <input
              type="text"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="input-field"
              placeholder="Detalles particulares del auto"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Vehículo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Rápido: Nuevo Cliente */}
      <Modal
        isOpen={nuevoClienteModal}
        onClose={() => setNuevoClienteModal(false)}
        title="Registrar Nuevo Cliente"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleQuickSaveCliente} className="space-y-4">
          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              placeholder="Ej: José López"
              value={clienteForm.nombre}
              onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Teléfono / WhatsApp *</label>
            <input
              type="tel"
              required
              placeholder="Ej: 9988-7766"
              value={clienteForm.telefono}
              onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Dirección Habitual (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Barrio San Sebastián, Comayagua"
              value={clienteForm.direccion_default}
              onChange={(e) => setClienteForm({ ...clienteForm, direccion_default: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              {guardandoCliente ? 'Guardando...' : 'Crear y Seleccionar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
