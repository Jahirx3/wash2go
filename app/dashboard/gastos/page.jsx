'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  ShoppingBag, Plus, Fuel, DollarSign,
  Calendar, Trash2, Filter
} from 'lucide-react'

export default function GastosPage() {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipoFiltro, setTipoFiltro] = useState('TODOS')

  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    tipo: 'COMBUSTIBLE',
    descripcion: '',
    monto: 0,
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
  })

  const fetchGastos = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('gastos').select('*').order('fecha', { ascending: false })
      if (data && data.length > 0) {
        setGastos(data)
      } else {
        setGastos([
          { id: 'g-1', tipo: 'COMBUSTIBLE', descripcion: 'Gasolina para moto lavador #1', monto: 150, fecha: '2026-09-02' },
          { id: 'g-2', tipo: 'PRODUCTO', descripcion: 'Galón de shampoo con cera', monto: 320, fecha: '2026-09-01' },
          { id: 'g-3', tipo: 'SALARIO', descripcion: 'Adelanto quincenal Carlos M.', monto: 1000, fecha: '2026-08-30' },
          { id: 'g-4', tipo: 'MANTENIMIENTO', descripcion: 'Repuesto boquilla de hidrolavadora', monto: 200, fecha: '2026-08-28' },
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGastos()
  }, [])

  const handleSaveGasto = async (e) => {
    e.preventDefault()
    try {
      const { data } = await supabase.from('gastos').insert([formData]).select()
      if (data) setGastos([data[0], ...gastos])
      else setGastos([{ id: 'temp-' + Date.now(), ...formData }, ...gastos])
      toast.success('Gasto registrado con éxito')
      setModalOpen(false)
    } catch (err) {
      toast.error('Error al guardar gasto')
    }
  }

  const handleDeleteGasto = async (id, descripcion) => {
    if (!confirm(`¿Eliminar el registro de gasto "${descripcion}"?`)) return
    try {
      await supabase.from('gastos').delete().eq('id', id)
      setGastos(gastos.filter(g => g.id !== id))
      toast.success('Gasto eliminado')
    } catch (err) {
      toast.error('Error al eliminar gasto')
    }
  }

  const gastosFiltrados = gastos.filter(g => tipoFiltro === 'TODOS' || g.tipo === tipoFiltro)
  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + Number(g.monto || 0), 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Gastos Operativos</h1>
          <p className="page-subtitle">Registro de combustible, insumos, productos gastados y salarios</p>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary">
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
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Combustible
          </span>
          <span className="text-xl font-bold text-slate-700">
            L. {gastos.filter(g => g.tipo === 'COMBUSTIBLE').reduce((a, b) => a + Number(b.monto), 0).toFixed(2)}
          </span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Productos e Insumos
          </span>
          <span className="text-xl font-bold text-slate-700">
            L. {gastos.filter(g => g.tipo === 'PRODUCTO').reduce((a, b) => a + Number(b.monto), 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-3 flex flex-wrap gap-2">
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

      {/* Tabla de Gastos */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo de Gasto</th>
                <th>Descripción</th>
                <th className="text-right">Monto (L.)</th>
                <th className="text-center w-16">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map((g) => (
                <tr key={g.id}>
                  <td className="text-xs text-slate-600 font-medium">
                    {g.fecha}
                  </td>
                  <td>
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {g.tipo}
                    </span>
                  </td>
                  <td className="font-semibold text-slate-800 text-xs">
                    {g.descripcion}
                  </td>
                  <td className="text-right font-black text-rose-600 text-sm">
                    L. {Number(g.monto).toFixed(2)}
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleDeleteGasto(g.id, g.descripcion)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar Gasto"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Gasto */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Nuevo Gasto Operativo"
      >
        <form onSubmit={handleSaveGasto} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Categoría del Gasto *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="COMBUSTIBLE">Combustible</option>
                <option value="PRODUCTO">Productos / Químicos</option>
                <option value="SALARIO">Salarios / Comisiones</option>
                <option value="MANTENIMIENTO">Mantenimiento de Equipo</option>
                <option value="OTRO">Otro Gasto</option>
              </select>
            </div>

            <div>
              <label className="input-label">Fecha *</label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Monto en Lempiras *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">L.</span>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                className="input-field pl-9 font-bold text-base text-rose-600"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Descripción del Gasto *</label>
            <input
              type="text"
              required
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input-field"
              placeholder="Ej: Combustible moto lavador Carlos"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Gasto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
