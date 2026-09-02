'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Truck, Plus, Phone, CheckCircle, Clock, MapPin, UserCheck, Shield, Trash2, Power } from 'lucide-react'

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    telefono: '',
    password: 'lavador123',
    rol: 'TRABAJADOR',
    activo: true,
  })

  const fetchTrabajadores = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('rol', 'TRABAJADOR')
        .order('nombre')

      if (data && data.length > 0) {
        setTrabajadores(data)
      } else {
        setTrabajadores([
          {
            id: 't-1',
            nombre: 'Carlos Mejía',
            usuario: 'carlos',
            email: 'carlos@wash2go.com',
            telefono: '+504 9911-2233',
            activo: true,
            servicios_hoy: 3,
            estado_actual: 'EN_SERVICIO'
          },
          {
            id: 't-2',
            nombre: 'Juan Romero',
            usuario: 'juan',
            email: 'juan@wash2go.com',
            telefono: '+504 9922-3344',
            activo: true,
            servicios_hoy: 2,
            estado_actual: 'DISPONIBLE'
          },
          {
            id: 't-3',
            nombre: 'Marcos Zelaya',
            usuario: 'marcos',
            email: 'marcos@wash2go.com',
            telefono: '+504 9933-4455',
            activo: true,
            servicios_hoy: 1,
            estado_actual: 'DISPONIBLE'
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

      setTrabajadores([...trabajadores, result.user])
      toast.success(`Lavador @${result.user.usuario} registrado con éxito`)
      setModalOpen(false)
    } catch (err) {
      toast.error('Error al registrar trabajador')
    }
  }

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const nuevo = !estadoActual
      await supabase.from('usuarios').update({ activo: nuevo }).eq('id', id)
      setTrabajadores(trabajadores.map(t => t.id === id ? { ...t, activo: nuevo } : t))
      toast.success(`Lavador ${nuevo ? 'activado' : 'desactivado'}`)
    } catch (err) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleDeleteTrabajador = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar a "${nombre}" del equipo de lavadores?`)) return
    try {
      await supabase.from('usuarios').delete().eq('id', id)
      setTrabajadores(trabajadores.filter(t => t.id !== id))
      toast.success('Trabajador eliminado')
    } catch (err) {
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Personal de Lavado y Operaciones</h1>
          <p className="page-subtitle">Equipo de lavadores a domicilio en Comayagua, asignaciones y estado</p>
        </div>

        <button onClick={handleOpenModal} className="btn-primary">
          <Plus size={18} />
          Nuevo Lavador
        </button>
      </div>

      {/* Grid de Trabajadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trabajadores.map((t) => (
          <div key={t.id} className="glass-card p-6 flex flex-col justify-between space-y-4">
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

            <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Teléfono móvil</span>
                <a
                  href={`https://wa.me/${t.telefono?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Phone size={12} /> {t.telefono || 'Sin teléfono'}
                </a>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rol asignado</span>
                <span className="font-bold text-sky-700">Lavador / Operador</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Acceso: /trabajador</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleToggleEstado(t.id, t.activo)}
                  className={`p-1.5 rounded-lg transition-colors ${t.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                  title={t.activo ? 'Desactivar lavador' : 'Activar lavador'}
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
        ))}
      </div>

      {/* Modal */}
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
              Registrar Trabajador
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
