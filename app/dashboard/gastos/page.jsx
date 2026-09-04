'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  ShoppingBag, Plus, Fuel, DollarSign,
  Calendar, Trash2, Filter, Search, Edit2, Wrench, Users, FileText
} from 'lucide-react'

export default function GastosPage() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')
  const [search, setSearch] = useState('')

  // Modal Crear / Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingGasto, setEditingGasto] = useState(null)
  const [formData, setFormData] = useState({
    tipo: 'COMBUSTIBLE',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)

  const fetchGastos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('gastos').select('*').order('fecha', { ascending: false })
      if (error) {
        console.error('Error fetching expenses:', error.message)
        toast.error('Error al cargar gastos de Supabase')
        setGastos([])
        return
      }
      setGastos(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const handleOpenCreate = () => {
    setEditingGasto(null)
    setFormData({
      tipo: 'COMBUSTIBLE',
      descripcion: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      notas: '',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (gasto) => {
    setEditingGasto(gasto)
    setFormData({
      tipo: gasto.tipo,
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha || new Date().toISOString().split('T')[0],
      notas: gasto.notas || '',
    })
    setModalOpen(true)
  }

  const handleSaveGasto = async (e) => {
    e.preventDefault()
    if (!formData.descripcion.trim() || Number(formData.monto) <= 0) {
      toast.error('Ingresa una descripción válida y un monto mayor a 0')
      return
    }

    setGuardando(true)
    try {
      if (editingGasto) {
        const { error } = await supabase
          .from('gastos')
          .update({
            tipo: formData.tipo,
            descripcion: formData.descripcion.trim(),
            monto: Number(formData.monto),
            fecha: formData.fecha,
            notas: formData.notas.trim() || null,
          })
          .eq('id', editingGasto.id)

        if (error) {
          toast.error(`Error al actualizar gasto: ${error.message}`)
          return
        }

        toast.success('Gasto actualizado correctamente')
      } else {
        const { error } = await supabase
          .from('gastos')
          .insert([{
            tipo: formData.tipo,
            descripcion: formData.descripcion.trim(),
            monto: Number(formData.monto),
            fecha: formData.fecha,
            notas: formData.notas.trim() || null,
          }])

        if (error) {
          toast.error(`Error al registrar gasto: ${error.message}`)
          return
        }

        toast.success('Gasto registrado con éxito en Supabase')
      }

      setModalOpen(false)
      fetchGastos()
    } catch (err) {
      toast.error('Error de conexión al guardar gasto')
    } finally {
      setGuardando(false)
    }
  }

  const handleDeleteGasto = async (id, descripcion) => {
    if (!confirm(`¿Eliminar el registro de gasto "${descripcion}"?`)) return
    try {
      const { error } = await supabase.from('gastos').delete().eq('id', id)
      if (error) {
        toast.error(`Error al eliminar gasto: ${error.message}`)
        return
      }
      setGastos(gastos.filter(g => g.id !== id))
      toast.success('Gasto eliminado')
    } catch (err) {
      toast.error('Error al eliminar gasto')
    }
  }

  const gastosFiltrados = gastos.filter(g => {
    const matchesTipo = tipoFiltro === 'TODOS' || g.tipo === tipoFiltro
    const matchesSearch =
      g.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      g.notas?.toLowerCase().includes(search.toLowerCase()) ||
      g.fecha?.includes(search)
    return matchesTipo && matchesSearch
  })

  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + Number(g.monto || 0), 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Gastos Operativos</h1>
          <p className="page-subtitle">Registro de combustible, insumos, productos gastados y salarios</p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary">
          <Plus size={18} />
          Registrar Gasto
        </button>
      </div>

      {/* Resumen Total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Gastado ({tipoFiltro})
          </span>
          <span className="text-2xl font-black text-rose-600">
            L. {totalGastos.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{gastosFiltrados.length} registros</span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Combustible
          </span>
          <span className="text-xl font-bold text-slate-700">
            L. {gastos.filter(g => g.tipo === 'COMBUSTIBLE').reduce((a, b) => a + Number(b.monto), 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Tanques para bombas y motos</span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Productos e Insumos
          </span>
          <span className="text-xl font-bold text-slate-700">
            L. {gastos.filter(g => g.tipo === 'PRODUCTO').reduce((a, b) => a + Number(b.monto), 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Shampoo, ceras y desengrasantes</span>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por descripción, nota o fecha (YYYY-MM-DD)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {['TODOS', 'COMBUSTIBLE', 'PRODUCTO', 'SALARIO', 'MANTENIMIENTO', 'OTRO'].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tipoFiltro === t
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Gastos */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo de Gasto</th>
                <th>Descripción</th>
                <th>Notas</th>
                <th className="text-right">Monto (L.)</th>
                <th className="sticky-right text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShoppingBag size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay gastos registrados</p>
                    <p className="text-xs text-slate-400 mt-0.5">Usa "Registrar Gasto" para llevar el control financiero de egresos</p>
                  </td>
                </tr>
              )}
              {gastosFiltrados.map((g) => (
                <tr key={g.id}>
                  <td className="font-mono text-xs text-slate-600 font-semibold">
                    {g.fecha}
                  </td>
                  <td>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {g.tipo}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-slate-800 text-xs block">{g.descripcion}</span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-500 block truncate max-w-xs">{g.notas || '-'}</span>
                  </td>
                  <td className="text-right font-black text-rose-600 text-sm">
                    L. {Number(g.monto).toFixed(2)}
                  </td>
                  <td className="sticky-right text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(g)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Editar Gasto"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteGasto(g.id, g.descripcion)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar Gasto"
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

      {/* Modal Crear / Editar Gasto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingGasto ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveGasto} className="space-y-4">
          <div>
            <label className="input-label">Tipo de Gasto *</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="input-field cursor-pointer font-medium"
            >
              <option value="COMBUSTIBLE">Combustible (Gasolina)</option>
              <option value="PRODUCTO">Productos Químicos e Insumos</option>
              <option value="SALARIO">Salario / Anticipo a Lavador</option>
              <option value="MANTENIMIENTO">Mantenimiento de Equipo</option>
              <option value="OTRO">Otro Gasto Operativo</option>
            </select>
          </div>

          <div>
            <label className="input-label">Descripción del Gasto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Galón de gasolina para generador"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Monto (Lempiras) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-sm">L.</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="input-field pl-8 font-bold text-rose-600"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Fecha del Gasto *</label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Notas Adicionales (Opcional)</label>
            <textarea
              placeholder="Ej: Compra en gasolinera Texaco centro, factura #1234"
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="input-field min-h-[60px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="btn-primary text-xs"
            >
              {guardando ? 'Guardando...' : editingGasto ? 'Actualizar Gasto' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
