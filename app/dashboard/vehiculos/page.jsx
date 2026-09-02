'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Car, Plus, Search, User, Edit2, Trash2 } from 'lucide-react'

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const fetchVehiculos = async () => {
    setLoading(true)
    try {
      const { data: vData } = await supabase
        .from('vehiculos')
        .select(`
          *,
          cliente:clientes(nombre, telefono)
        `)
        .order('marca')

      const { data: cData } = await supabase.from('clientes').select('id, nombre, telefono').order('nombre')
      if (cData) setClientes(cData)

      if (vData && vData.length > 0) {
        setVehiculos(vData)
      } else {
        setVehiculos([
          {
            id: 'v-1',
            marca: 'Toyota',
            modelo: 'Hilux',
            anio: 2022,
            color: 'Blanco',
            placa: 'HAB-1029',
            tipo: 'PICKUP',
            cliente: { nombre: 'Mario Aguilar', telefono: '+504 9876-1234' }
          },
          {
            id: 'v-2',
            marca: 'Hyundai',
            modelo: 'Elantra',
            anio: 2020,
            color: 'Gris',
            placa: 'HAC-4432',
            tipo: 'SEDAN',
            cliente: { nombre: 'Lucía Fernández', telefono: '+504 9555-4321' }
          },
          {
            id: 'v-3',
            marca: 'Ford',
            modelo: 'Ranger',
            anio: 2023,
            color: 'Azul',
            placa: 'HAD-8821',
            tipo: 'PICKUP',
            cliente: { nombre: 'Roberto Pineda', telefono: '+504 8888-9900' }
          }
        ])
      }
    } catch (err) {
      console.error(err)
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
        anio: 2022,
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
    try {
      if (editingVehiculo) {
        await supabase.from('vehiculos').update(formData).eq('id', editingVehiculo.id)
        setVehiculos(vehiculos.map(v => v.id === editingVehiculo.id ? { ...v, ...formData } : v))
        toast.success('Vehículo actualizado')
      } else {
        const { data } = await supabase.from('vehiculos').insert([formData]).select(`*, cliente:clientes(nombre)`)
        if (data) setVehiculos([...vehiculos, data[0]])
        else {
          const cli = clientes.find(c => c.id === formData.cliente_id)
          setVehiculos([...vehiculos, { id: 'temp-' + Date.now(), ...formData, cliente: { nombre: cli?.nombre } }])
        }
        toast.success('Vehículo registrado')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error('Error al guardar vehículo')
    }
  }

  const handleDeleteVehiculo = async (id, placa) => {
    if (!confirm(`¿Estás seguro de eliminar el vehículo con placa "${placa}"?`)) return
    try {
      await supabase.from('vehiculos').delete().eq('id', id)
      setVehiculos(vehiculos.filter(v => v.id !== id))
      toast.success('Vehículo eliminado')
    } catch (err) {
      toast.error('Error al eliminar vehículo')
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
                  </td>
                  <td className="sticky-right text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenModal(v)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteVehiculo(v.id, v.placa)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Vehículo"
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

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVehiculo ? 'Editar Vehículo' : 'Registrar Vehículo'}
      >
        <form onSubmit={handleSaveVehiculo} className="space-y-4">
          <div>
            <label className="input-label">Cliente Dueño *</label>
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
                className="input-field font-mono font-bold"
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
    </div>
  )
}
