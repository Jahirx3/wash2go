'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { UserCog, Plus, Shield, CheckCircle, XCircle, Trash2, Power, User, Edit2 } from 'lucide-react'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    usuario: '',
    email: '',
    telefono: '',
    password: '',
    rol: 'TRABAJADOR',
    activo: true,
  })

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre, usuario, email, telefono, rol, activo, created_at')
        .order('created_at')

      if (data) {
        setUsuarios(data)
      } else {
        setUsuarios([])
      }
    } catch (err) {
      console.error(err)
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const handleOpenModal = () => {
    setEditingUsuario(null)
    setFormData({
      nombre: '',
      usuario: '',
      email: '',
      telefono: '',
      password: '',
      rol: 'TRABAJADOR',
      activo: true,
    })
    setModalOpen(true)
  }

  const handleOpenEditModal = (u) => {
    setEditingUsuario(u)
    setFormData({
      nombre: u.nombre || '',
      usuario: u.usuario || '',
      email: u.email || '',
      telefono: u.telefono || '',
      password: '',
      rol: u.rol || 'TRABAJADOR',
      activo: u.activo !== undefined ? u.activo : true,
    })
    setModalOpen(true)
  }

  const handleSaveUsuario = async (e) => {
    e.preventDefault()
    const toastId = toast.loading(editingUsuario ? 'Actualizando usuario...' : 'Creando usuario...')
    try {
      if (editingUsuario) {
        const res = await fetch(`/api/usuarios/${editingUsuario.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await res.json()

        if (!res.ok || !result.success) {
          toast.dismiss(toastId)
          toast.error(result.error || 'Error al actualizar usuario')
          return
        }

        setUsuarios(usuarios.map(u => u.id === editingUsuario.id ? result.user : u))
        toast.dismiss(toastId)
        toast.success(`Usuario @${result.user.usuario} actualizado con éxito`)
      } else {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const result = await res.json()

        if (!res.ok) {
          toast.dismiss(toastId)
          toast.error(result.error || 'Error al registrar usuario')
          return
        }

        setUsuarios([...usuarios, result.user])
        toast.dismiss(toastId)
        toast.success(`Usuario @${result.user.usuario} creado con éxito`)
      }
      setModalOpen(false)
    } catch (err) {
      toast.dismiss(toastId)
      toast.error('Error al guardar usuario')
    }
  }

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual
      await supabase.from('usuarios').update({ activo: nuevoEstado }).eq('id', id)
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, activo: nuevoEstado } : u))
      toast.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`)
    } catch (err) {
      toast.error('Error al actualizar estado')
    }
  }

  const handleDeleteUsuario = async (id, nombre) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', id)
      if (error) {
        if (error.code === '23503' || error.message.includes('foreign key')) {
          toast.error('No se puede eliminar: tiene órdenes o registros asignados. Puedes desactivar su acceso.')
        } else {
          toast.error(`Error al eliminar usuario: ${error.message}`)
        }
        return
      }
      setUsuarios(usuarios.filter(u => u.id !== id))
      toast.success('Usuario eliminado')
    } catch (err) {
      toast.error('Error al eliminar usuario')
    }
  }

  const getRolBadge = (rol) => {
    switch (rol) {
      case 'ADMIN':
        return <span className="badge badge-purple">Administrador</span>
      case 'SUPERVISOR':
        return <span className="badge badge-info">Supervisor</span>
      case 'TRABAJADOR':
        return <span className="badge badge-gray">Trabajador</span>
      default:
        return <span className="badge">{rol}</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y Roles de Acceso</h1>
          <p className="page-subtitle">Administra cuentas del sistema: Administradores, Supervisores y Lavadores</p>
        </div>

        <button onClick={handleOpenModal} className="btn-primary">
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th>Rol / Permiso</th>
                <th>Estado</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="font-mono font-bold text-sky-600 text-xs bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      @{u.usuario || u.email?.split('@')[0] || 'usuario'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {u.nombre?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-600 font-mono">{u.email}</td>
                  <td className="text-xs text-slate-600">{u.telefono || 'Sin teléfono'}</td>
                  <td>{getRolBadge(u.rol)}</td>
                  <td>
                    {u.activo ? (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle size={14} /> Activo
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                        <XCircle size={14} /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="sticky-right text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Modificar usuario"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleEstado(u.id, u.activo)}
                        className={`p-1.5 rounded-lg transition-colors ${u.activo ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                        title={u.activo ? 'Desactivar acceso' : 'Activar acceso'}
                      >
                        <Power size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteUsuario(u.id, u.nombre)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar usuario"
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUsuario ? `Modificar Usuario: @${editingUsuario.usuario}` : "Crear Nuevo Usuario"}
      >
        <form onSubmit={handleSaveUsuario} className="space-y-4">
          <div>
            <label className="input-label">Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="input-field"
              placeholder="Ej: Daniel Rodríguez"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Nombre de Usuario *</label>
              <input
                type="text"
                required
                value={formData.usuario}
                onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                className="input-field font-mono text-xs"
                placeholder="ej: daniel99"
              />
              <span className="text-[10px] text-slate-400">Usado para iniciar sesión</span>
            </div>
            <div>
              <label className="input-label">Rol Asignado *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="TRABAJADOR">Trabajador (Vista móvil)</option>
                <option value="SUPERVISOR">Supervisor (Operaciones)</option>
                <option value="ADMIN">Administrador (Total)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Correo Electrónico (Opcional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="daniel@wash2go.com"
              />
            </div>
            <div>
              <label className="input-label">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="input-field"
                placeholder="+504 9999-9999"
              />
            </div>
          </div>

          {editingUsuario && (
            <div>
              <label className="input-label">Estado de la Cuenta</label>
              <select
                value={formData.activo ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, activo: e.target.value === 'true' })}
                className="input-field cursor-pointer"
              >
                <option value="true">Activo (Habilitado para ingresar)</option>
                <option value="false">Inactivo (Acceso bloqueado)</option>
              </select>
            </div>
          )}

          <div>
            <label className="input-label">
              {editingUsuario ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso *'}
            </label>
            <input
              type="password"
              required={!editingUsuario}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input-field"
              placeholder={editingUsuario ? 'Dejar en blanco para conservar la actual' : '••••••••'}
            />
            {editingUsuario && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Solo ingresa una contraseña si deseas cambiar la existente.
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editingUsuario ? 'Guardar Modificaciones' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
