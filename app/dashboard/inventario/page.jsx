'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import {
  Package, Plus, AlertTriangle, CheckCircle, Edit2,
  Trash2, Search, ArrowUpRight, ArrowDownRight, TrendingDown, DollarSign
} from 'lucide-react'

export default function InventarioPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroStock, setFiltroStock] = useState('TODOS') // 'TODOS' | 'BAJO' | 'OPTIMO'

  // Modal Crear/Editar Insumo
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    producto: '',
    descripcion: '',
    cantidad: 10,
    unidad: 'litros',
    costo_unitario: 50,
    stock_minimo: 3,
  })

  // Modal Ajuste Rápido de Stock (+ Entrada / - Salida)
  const [ajusteModalOpen, setAjusteModalOpen] = useState(false)
  const [selectedItemForAjuste, setSelectedItemForAjuste] = useState(null)
  const [ajusteTipo, setAjusteTipo] = useState('ENTRADA') // 'ENTRADA' | 'SALIDA'
  const [ajusteCantidad, setAjusteCantidad] = useState(1)
  const [ajusteNotas, setAjusteNotas] = useState('')
  const [guardandoAjuste, setGuardandoAjuste] = useState(false)

  const fetchInventario = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('inventario').select('*').order('producto')
      if (error) {
        console.error('Error fetching inventory:', error.message)
        toast.error('Error al cargar inventario de Supabase')
        setItems([])
        return
      }
      setItems(data || [])
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con la base de datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventario()
  }, [])

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        producto: item.producto,
        descripcion: item.descripcion || '',
        cantidad: item.cantidad,
        unidad: item.unidad,
        costo_unitario: item.costo_unitario,
        stock_minimo: item.stock_minimo,
      })
    } else {
      setEditingItem(null)
      setFormData({
        producto: '',
        descripcion: '',
        cantidad: 10,
        unidad: 'litros',
        costo_unitario: 50,
        stock_minimo: 3,
      })
    }
    setModalOpen(true)
  }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('inventario')
          .update({
            ...formData,
            cantidad: Number(formData.cantidad),
            costo_unitario: Number(formData.costo_unitario),
            stock_minimo: Number(formData.stock_minimo),
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id)

        if (error) {
          toast.error(`Error al actualizar insumo: ${error.message}`)
          return
        }

        toast.success('Insumo actualizado en inventario')
      } else {
        const { error } = await supabase
          .from('inventario')
          .insert([{
            ...formData,
            cantidad: Number(formData.cantidad),
            costo_unitario: Number(formData.costo_unitario),
            stock_minimo: Number(formData.stock_minimo)
          }])

        if (error) {
          toast.error(`Error al agregar insumo: ${error.message}`)
          return
        }

        toast.success('Insumo agregado al inventario en Supabase')
      }
      setModalOpen(false)
      fetchInventario()
    } catch (err) {
      toast.error('Error de conexión al guardar')
    }
  }

  const handleDeleteItem = async (id, producto) => {
    if (!confirm(`¿Estás seguro de eliminar el insumo "${producto}"?`)) return
    try {
      const { error } = await supabase.from('inventario').delete().eq('id', id)
      if (error) {
        toast.error(`Error al eliminar insumo: ${error.message}`)
        return
      }
      setItems(items.filter(i => i.id !== id))
      toast.success('Insumo eliminado')
    } catch (err) {
      toast.error('Error al eliminar insumo')
    }
  }

  // Abrir modal de ajuste rápido
  const handleOpenAjuste = (item, tipo) => {
    setSelectedItemForAjuste(item)
    setAjusteTipo(tipo)
    setAjusteCantidad(1)
    setAjusteNotas(tipo === 'ENTRADA' ? 'Compra de reabastecimiento' : 'Uso en lavados del día')
    setAjusteModalOpen(true)
  }

  // Guardar movimiento de inventario en Supabase
  const handleSaveAjuste = async (e) => {
    e.preventDefault()
    if (!selectedItemForAjuste) return
    const qty = Number(ajusteCantidad)
    if (qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    const currentQty = Number(selectedItemForAjuste.cantidad)
    const newQty = ajusteTipo === 'ENTRADA' ? currentQty + qty : currentQty - qty

    if (newQty < 0) {
      toast.error(`No hay suficiente existencia actual (${currentQty} ${selectedItemForAjuste.unidad})`)
      return
    }

    setGuardandoAjuste(true)
    try {
      // 1. Actualizar stock en tabla inventario
      const { error: invError } = await supabase
        .from('inventario')
        .update({
          cantidad: newQty,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItemForAjuste.id)

      if (invError) {
        toast.error(`Error al actualizar stock: ${invError.message}`)
        return
      }

      // 2. Registrar en movimientos_inventario
      await supabase
        .from('movimientos_inventario')
        .insert([{
          inventario_id: selectedItemForAjuste.id,
          tipo: ajusteTipo,
          cantidad: qty,
          notas: ajusteNotas || null,
        }])

      toast.success(
        ajusteTipo === 'ENTRADA'
          ? `+${qty} ${selectedItemForAjuste.unidad} agregados a ${selectedItemForAjuste.producto}`
          : `-${qty} ${selectedItemForAjuste.unidad} descontados de ${selectedItemForAjuste.producto}`
      )

      setAjusteModalOpen(false)
      fetchInventario()
    } catch (err) {
      toast.error('Error al procesar movimiento de inventario')
    } finally {
      setGuardandoAjuste(false)
    }
  }

  const itemsFiltrados = items.filter(item => {
    const isBajo = Number(item.cantidad) <= Number(item.stock_minimo)
    const matchesFiltro =
      filtroStock === 'TODOS' ||
      (filtroStock === 'BAJO' && isBajo) ||
      (filtroStock === 'OPTIMO' && !isBajo)

    const matchesSearch =
      item.producto?.toLowerCase().includes(search.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      item.unidad?.toLowerCase().includes(search.toLowerCase())

    return matchesFiltro && matchesSearch
  })

  const totalProductos = items.length
  const productosBajos = items.filter(i => Number(i.cantidad) <= Number(i.stock_minimo)).length
  const valorTotalInventario = items.reduce((acc, i) => acc + (Number(i.cantidad || 0) * Number(i.costo_unitario || 0)), 0)

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario de Insumos y Químicos</h1>
          <p className="page-subtitle">Control de productos de lavado, existencias y alertas de stock bajo</p>
        </div>

        <button onClick={() => handleOpenModal()} className="btn-primary">
          <Plus size={18} />
          Nuevo Insumo
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Total Productos Registrados
          </span>
          <span className="text-2xl font-black text-slate-800">
            {totalProductos}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Insumos y químicos en bodega</span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Alertas de Stock Bajo
          </span>
          <span className={`text-2xl font-black ${productosBajos > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {productosBajos}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {productosBajos > 0 ? 'Requieren compra urgente' : 'Todos en niveles óptimos'}
          </span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Valor Estimado de Existencias
          </span>
          <span className="text-2xl font-black text-sky-700">
            L. {valorTotalInventario.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Costo total de adquisición</span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar insumo, descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex gap-2">
          {['TODOS', 'BAJO', 'OPTIMO'].map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStock(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroStock === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'TODOS' ? 'Todos los insumos' : st === 'BAJO' ? '⚠️ Stock Bajo' : '✓ Stock Óptimo'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Unidad</th>
                <th>Stock Mínimo</th>
                <th>Costo Unitario</th>
                <th>Estado</th>
                <th className="sticky-right text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No se encontraron insumos</p>
                    <p className="text-xs text-slate-400 mt-0.5">Usa "Nuevo Insumo" para registrar ceras, shampoo, microfibras o desengrasantes</p>
                  </td>
                </tr>
              )}
              {itemsFiltrados.map((item) => {
                const isBajo = Number(item.cantidad) <= Number(item.stock_minimo)
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="font-bold text-slate-800 text-sm block">{item.producto}</span>
                      {item.descripcion && (
                        <span className="text-xs text-slate-400 block">{item.descripcion}</span>
                      )}
                    </td>
                    <td>
                      <span className={`text-base font-black ${isBajo ? 'text-amber-600' : 'text-slate-800'}`}>
                        {item.cantidad}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 lowercase bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {item.unidad}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{item.stock_minimo}</span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-slate-700">L. {Number(item.costo_unitario).toFixed(2)}</span>
                    </td>
                    <td>
                      {isBajo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          <AlertTriangle size={12} /> Reabastecer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle size={12} /> Suficiente
                        </span>
                      )}
                    </td>
                    <td className="sticky-right text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenAjuste(item, 'ENTRADA')}
                          className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-0.5 shadow-xs"
                          title="Ingresar más unidades (compra)"
                        >
                          <ArrowUpRight size={13} /> +Entrada
                        </button>
                        <button
                          onClick={() => handleOpenAjuste(item, 'SALIDA')}
                          className="px-2 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-0.5"
                          title="Descontar unidades usadas"
                        >
                          <ArrowDownRight size={13} /> -Uso
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar Insumo"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.producto)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar Insumo"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar Insumo */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Editar Insumo' : 'Nuevo Insumo de Lavado'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="input-label">Nombre del Producto / Insumo *</label>
            <input
              type="text"
              required
              placeholder="Ej: Shampoo con Cera, Silicona Líquida, Paño Microfibra..."
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="input-label">Descripción o Marca</label>
            <input
              type="text"
              placeholder="Ej: Marca Meguiar's galón industrial"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Stock Actual *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                className="input-field font-bold"
              />
            </div>
            <div>
              <label className="input-label">Unidad de Medida *</label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="litros">Litros (L)</option>
                <option value="galones">Galones (Gal)</option>
                <option value="unidad">Unidades (Pzs)</option>
                <option value="kilos">Kilogramos (Kg)</option>
                <option value="paquetes">Paquetes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">Costo Unitario (Lempiras)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costo_unitario}
                onChange={(e) => setFormData({ ...formData, costo_unitario: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Alerta Stock Mínimo</label>
              <input
                type="number"
                step="0.01"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                className="input-field"
              />
            </div>
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
              className="btn-primary text-xs"
            >
              Guardar Insumo
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Ajuste Rápido de Stock (+ Entrada / - Salida) */}
      <Modal
        isOpen={ajusteModalOpen}
        onClose={() => setAjusteModalOpen(false)}
        title={ajusteTipo === 'ENTRADA' ? `Reabastecer: ${selectedItemForAjuste?.producto}` : `Registrar Uso: ${selectedItemForAjuste?.producto}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAjuste} className="space-y-4">
          <p className="text-xs text-slate-500 -mt-2">
            {ajusteTipo === 'ENTRADA'
              ? 'Ingresa la cantidad recibida de compra para sumarla al inventario.'
              : 'Descuenta las unidades que se consumieron en las operaciones.'}
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
            <span>Existencia actual:</span>
            <span className="font-bold text-slate-800">
              {selectedItemForAjuste?.cantidad} {selectedItemForAjuste?.unidad}
            </span>
          </div>

          <div>
            <label className="input-label">Cantidad a {ajusteTipo === 'ENTRADA' ? 'Agregar' : 'Descontar'} ({selectedItemForAjuste?.unidad}) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={ajusteCantidad}
              onChange={(e) => setAjusteCantidad(e.target.value)}
              className="input-field text-lg font-bold text-sky-700"
            />
          </div>

          <div>
            <label className="input-label">Motivo o Nota del Movimiento</label>
            <input
              type="text"
              placeholder="Ej: Factura #9872 Ferretería / Uso en 5 lavados completos"
              value={ajusteNotas}
              onChange={(e) => setAjusteNotas(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAjusteModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoAjuste}
              className={`text-xs font-bold px-4 py-2 rounded-xl text-white shadow-sm transition-all ${
                ajusteTipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900'
              }`}
            >
              {guardandoAjuste ? 'Guardando...' : ajusteTipo === 'ENTRADA' ? 'Confirmar Entrada' : 'Confirmar Salida'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
