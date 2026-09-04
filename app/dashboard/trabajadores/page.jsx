'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Truck, Plus, Phone, CheckCircle, Clock, MapPin,
  UserCheck, Shield, Trash2, Power, Edit2, AlertCircle, RefreshCw
} from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/utils'

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  // Modales
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    telefono: '',
    password: 'lavador123',
    rol: 'TRABAJADOR',
    activo: true,
  })

  const [editFormData, setEditFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    telefono: '',
    password: '',
    activo: true,
  })

  const fetchTrabajadores = async () => {
    setLoading(true)
    try {
      // 1. Obtener trabajadores reales de Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'TRABAJADOR')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching workers:', error.message)
        toast.error('Error al cargar trabajadores de la base de datos')
        setTrabajadores([])
        return
      }

      setTrabajadores(data || [])

      // 2. Obtener estadísticas reales de órdenes por trabajador
      const { data: ordData } = await supabase
        .from('ordenes')
        .select('id, trabajador_id, estado, created_at')

      if (ordData && ordData.length > 0) {
        const counts = {}
        ordData.forEach(o => {
          if (!o.trabajador_id) return
          if (!counts[o.trabajador_id]) {
            counts[o.trabajador_id] = { total: 0, finalizados: 0, activos: 0 }
          }
          counts[o.trabajador_id].total += 1
          if (o.estado === 'FINALIZADO') counts[o.trabajador_id].finalizados += 1
          if (o.estado === 'EN_CAMINO' || o.estado === 'LAVANDO') counts[o.trabajador_id].activos += 1
        })
        setStats(counts)
      }
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con Supabase')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrabajadores()
  }, [])

  const handleOpenModal = () => {
    setFormData({
      nombre: '',
      usuario: '',
      email: '',
      telefono: '',
      password: 'lavador123',
      rol: 'TRABAJADOR',
      activo: true,
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (worker) => {
    setSelectedWorker(worker)
    setEditFormData({
      nombre: worker.nombre || '',
      usuario: worker.usuario || '',
      email: worker.email || '',
      telefono: worker.telefono || '',
      password: '',
      activo: worker.activo ?? true,
    })
    setEditModalOpen(true)
  }

  const handleSaveTrabajador = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Error al registrar trabajador')
        return
      }

      toast.success(`Lavador @${result.user.usuario} registrado con éxito en Supabase`)
      setModalOpen(false)
      fetchTrabajadores()
    } catch (err) {
      toast.error('Error de conexión al registrar trabajador')
    }
  }

  const handleUpdateTrabajador = async (e) => {
    e.preventDefault()
    if (!selectedWorker) return

    try {
      const updates = {
        nombre: editFormData.nombre.trim(),
        usuario: editFormData.usuario.trim().toLowerCase(),
        email: editFormData.email.trim() || `${editFormData.usuario.trim().toLowerCase()}@wash2go.com`,
        telefono: editFormData.telefono.trim(),
        activo: editFormData.activo,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', selectedWorker.id)

      if (error) {
        toast.error(`Error al actualizar: ${error.message}`)
        return
      }

      toast.success('Datos del trabajador actualizados correctamente')
      setEditModalOpen(false)
      fetchTrabajadores()
    } catch (err) {
      toast.error('Error al actualizar trabajador: ' + err.message)
    }
  }

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const nuevo = !estadoActual
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: nuevo, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        toast.error('Error al cambiar estado en Supabase: ' + error.message)
        return
      }

      setTrabajadores(trabajadores.map(t => t.id === id ? { ...t, activo: nuevo } : t))
      toast.success(`Lavador ${nuevo ? 'activado' : 'desactivado'}`)
    } catch (err) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleDeleteTrabajador = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar a "${nombre}" del equipo de lavadores?`)) return
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id)
      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key')) {
          toast.error(`No se puede eliminar a "${nombre}": tiene órdenes asignadas en el historial. Puedes desactivarlo para que no reciba nuevos servicios.`)
        } else {
          toast.error('No se pudo eliminar en Supabase: ' + error.message)
        }
        return
      }
      setTrabajadores(trabajadores.filter(t => t.id !== id))
      toast.success('Trabajador eliminado permanentemente de la base de datos')
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal de Lavado y Operaciones</h1>
          <p className="page-subtitle">Equipo de lavadores a domicilio en Comayagua, asignaciones y estado</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchTrabajadores} className="btn-secondary text-xs !py-2" title="Recargar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button onClick={handleOpenModal} className="btn-primary">
            <Plus size={18} />
            Nuevo Lavador
          </button>
        </div>
      </div>

      {/* Grid de Trabajadores */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="glass-card p-6 space-y-4 animate-pulse">
              <div className="h-12 w-12 bg-slate-200 rounded-2xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : trabajadores.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
            <Truck size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No hay lavadores registrados</h3>
            <p className="text-xs text-slate-500 mt-1">
              Registra a los integrantes de tu equipo de lavado a domicilio para asignarles órdenes y que puedan ingresar desde su teléfono móvil.
            </p>
          </div>
          <button onClick={handleOpenModal} className="btn-primary mx-auto">
            <Plus size={16} /> Registrar Primer Lavador
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trabajadores.map((t) => {
            const wStats = stats[t.id] || { total: 0, finalizados: 0, activos: 0 }
            return (
              <div key={t.id} className="glass-card p-6 flex flex-col justify-between space-y-4 border border-slate-200/80 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                      {t.nombre?.charAt(0) || 'L'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800">{t.nombre}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                          @{t.usuario || t.email?.split('@')[0] || 'lavador'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${t.activo ? 'badge-success' : 'badge-danger'}`}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Métricas de órdenes de Supabase */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center">
                  <div className="border-r border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Asignadas</span>
                    <span className="text-sm font-extrabold text-slate-700">{wStats.total}</span>
                  </div>
                  <div className="border-r border-slate-200">
                    <span className="text-[10px] text-sky-600 font-bold block uppercase">En Curso</span>
                    <span className="text-sm font-extrabold text-sky-600">{wStats.activos}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold block uppercase">Completas</span>
                    <span className="text-sm font-extrabold text-emerald-600">{wStats.finalizados}</span>
                  </div>
                </div>

                <div className="bg-slate-50/60 p-3 rounded-xl space-y-2 text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Teléfono móvil</span>
                    {t.telefono ? (
                      <a
                        href={getWhatsAppUrl(t.telefono, `¡Hola ${t.nombre}! Te escribimos de la administración de Wash2Go.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        title="Contactar al trabajador por WhatsApp"
                      >
                        <Phone size={12} /> {t.telefono}
                      </a>
                    ) : (
                      <span className="text-slate-400 font-medium">Sin teléfono</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Correo</span>
                    <span className="text-slate-600 font-medium truncate max-w-[170px]">{t.email || '—'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Acceso móvil: /trabajador</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Editar datos del lavador"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleToggleEstado(t.id, t.activo)}
                      className={`p-1.5 rounded-lg transition-colors ${t.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      title={t.activo ? 'Desactivar acceso' : 'Activar acceso'}
                    >
                      <Power size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteTrabajador(t.id, t.nombre)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar lavador"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Crear */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Nuevo Trabajador / Lavador"
      >
        <form onSubmit={handleSaveTrabajador} className="space-y-4">
          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input-field"
              placeholder="Ej: Marcos Zelaya"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nombre de Usuario (Login) *</label>
              <input
                type="text"
                required
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                className="input-field font-mono text-xs"
                placeholder="ej: marcosz"
              />
              <span className="text-[10px] text-slate-400">Usado para entrar a la app móvil</span>
            </div>
            <div>
              <label className="input-label">Teléfono Móvil *</label>
              <input
                type="text"
                required
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="input-field"
                placeholder="+504 9999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Correo (Opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="marcos@wash2go.com"
              />
            </div>
            <div>
              <label className="input-label">Contraseña Móvil *</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field font-mono"
                placeholder="lavador123"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar Trabajador en Supabase
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar Lavador: ${selectedWorker?.nombre}`}
      >
        <form onSubmit={handleUpdateTrabajador} className="space-y-4">
          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              value={editFormData.nombre}
              onChange={(e) => setEditFormData({ ...editFormData, nombre: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nombre de Usuario (Login) *</label>
              <input
                type="text"
                required
                value={editFormData.usuario}
                onChange={(e) => setEditFormData({ ...editFormData, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                className="input-field font-mono text-xs"
              />
            </div>
            <div>
              <label className="input-label">Teléfono Móvil *</label>
              <input
                type="text"
                required
                value={editFormData.telefono}
                onChange={(e) => setEditFormData({ ...editFormData, telefono: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Correo Electrónico</label>
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-activo"
              checked={editFormData.activo}
              onChange={(e) => setEditFormData({ ...editFormData, activo: e.target.checked })}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="edit-activo" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Cuenta de trabajador habilitada (puede recibir órdenes y entrar a la app)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setEditModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
