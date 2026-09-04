'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Wrench, Plus, Edit2, Clock, DollarSign, Check, X, Trash2, ExternalLink } from 'lucide-react'

export default function ServiciosPage() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingServicio, setEditingServicio] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: 200,
    duracion_min: 45,
    activo: true,
    color: '#0ea5e9',
  })

  const fetchServicios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('servicios').select('*').order('precio')
      if (error) {
        console.error('Error fetching services:', error.message)
        toast.error('Error al cargar servicios de Supabase')
        setServicios([])
        return
      }
      setServicios(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  const handleOpenModal = (servicio = null) => {
    if (servicio) {
      setEditingServicio(servicio)
      setFormData({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || '',
        precio: servicio.precio,
        duracion_min: servicio.duracion_min || 45,
        activo: servicio.activo ?? true,
        color: servicio.color || '#0ea5e9',
      })
    } else {
      setEditingServicio(null)
      setFormData({
        nombre: '',
        descripcion: '',
        precio: 200,
        duracion_min: 45,
        activo: true,
        color: '#0ea5e9',
      })
    }
    setModalOpen(true)
  }

  const handleSaveServicio = async (e) => {
    e.preventDefault()
    try {
      if (editingServicio) {
        const { error } = await supabase
          .from('servicios')
          .update({
            ...formData,
            precio: Number(formData.precio),
            duracion_min: Number(formData.duracion_min),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingServicio.id)

        if (error) {
          toast.error(`Error al actualizar servicio: ${error.message}`)
          return
        }

        toast.success('Servicio actualizado en el catálogo')
      } else {
        const { error } = await supabase
          .from('servicios')
          .insert([{
            ...formData,
            precio: Number(formData.precio),
            duracion_min: Number(formData.duracion_min)
          }])

        if (error) {
          toast.error(`Error al agregar servicio: ${error.message}`)
          return
        }

        toast.success('Nuevo servicio registrado en la base de datos')
      }
      setModalOpen(false)
      fetchServicios()
    } catch (err) {
      toast.error('Error de conexión al guardar servicio')
    }
  }

  const handleToggleActivo = async (id, currentActivo) => {
    try {
      const nuevo = !currentActivo
      const { error } = await supabase
        .from('servicios')
        .update({ activo: nuevo, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        toast.error(`Error al actualizar estado: ${error.message}`)
        return
      }

      setServicios(servicios.map(s => s.id === id ? { ...s, activo: nuevo } : s))
      toast.success(`Servicio ${nuevo ? 'activado' : 'pausado'}`)
    } catch (err) {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDeleteServicio = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar el servicio "${nombre}"?`)) return
    try {
      const { error } = await supabase.from('servicios').delete().eq('id', id)
      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key')) {
          toast.error(`No se puede eliminar "${nombre}": está registrado en órdenes de clientes. Puedes pausarlo para que no aparezca en nuevas órdenes.`)
        } else {
          toast.error(`Error al eliminar servicio: ${error.message}`)
        }
        return
      }
      setServicios(servicios.filter(s => s.id !== id))
      toast.success('Servicio eliminado')
    } catch (err) {
      toast.error('Error al eliminar servicio')
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Servicios Wash2Go</h1>
          <p className="page-subtitle">Configura los paquetes de lavado, precios en Lempiras y tiempos estimados</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/catalogo"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5"
            title="Abrir el catálogo digital público de clientes"
          >
            <ExternalLink size={14} />
            Ver Catálogo de Clientes
          </a>
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus size={18} />
            Nuevo Servicio
          </button>
        </div>
      </div>

      {/* Grid de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.map((s) => (
          <div
            key={s.id}
            className="glass-card p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: s.color || '#0ea5e9' }}
            />

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-extrabold text-slate-800">{s.nombre}</h3>
                <button
                  type="button"
                  onClick={() => handleToggleActivo(s.id, s.activo)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer shrink-0 ${
                    s.activo ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                  title="Clic para alternar entre Activo y Pausado"
                >
                  {s.activo ? '● Activo' : '⏸ Pausado'}
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                {s.descripcion || 'Sin descripción detallada.'}
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1 font-medium">
                  <Clock size={14} className="text-sky-500" />
                  ~{s.duracion_min} min
                </span>
                <span className="flex items-center gap-1 font-bold text-slate-800">
                  <DollarSign size={14} className="text-emerald-600" />
                  L. {Number(s.precio).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => handleDeleteServicio(s.id, s.nombre)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Eliminar Servicio"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => handleOpenModal(s)}
                className="btn-secondary !py-1.5 !px-3 text-xs"
              >
                <Edit2 size={13} /> Editar Tarifa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <form onSubmit={handleSaveServicio} className="space-y-4">
          <div>
            <label className="input-label">Nombre del Paquete *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input-field"
              placeholder="Ej: Lavado y Aspirado Completo"
            />
          </div>

          <div>
            <label className="input-label">Descripción del Servicio</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input-field min-h-[70px]"
              placeholder="Detalla qué incluye el lavado (encerado, rines, etc.)..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Precio (Lempiras) *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">L.</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                  className="input-field pl-9 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Duración Estimada (minutos)</label>
              <input
                type="number"
                value={formData.duracion_min}
                onChange={(e) => setFormData({ ...formData, duracion_min: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500"
              />
              Servicio Disponible para Clientes
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Servicio
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
