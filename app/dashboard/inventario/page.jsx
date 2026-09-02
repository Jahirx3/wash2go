'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'
import { Package, Plus, AlertTriangle, CheckCircle, Edit2, Trash2 } from 'lucide-react'

export default function InventarioPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    producto: '',
    descripcion: '',
    cantidad: 10,
    unidad: 'unidad',
    costo_unitario: 50,
    stock_minimo: 3,
  })

  const fetchInventario = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.from('inventario').select('*').order('producto')
      if (data && data.length > 0) {
        setItems(data)
      } else {
        setItems([
          { id: 'i-1', producto: 'Shampoo Neutro con Espuma Activa', cantidad: 18, unidad: 'litros', costo_unitario: 80, stock_minimo: 5 },
          { id: 'i-2', producto: 'Cera Líquida Carnauba', cantidad: 4, unidad: 'unidades', costo_unitario: 160, stock_minimo: 5 },
          { id: 'i-3', producto: 'Paños de Microfibra 40x40cm', cantidad: 35, unidad: 'unidades', costo_unitario: 35, stock_minimo: 10 },
          { id: 'i-4', producto: 'Desengrasante de Motor Concentrado', cantidad: 8, unidad: 'litros', costo_unitario: 110, stock_minimo: 3 },
          { id: 'i-5', producto: 'Aromatizante Frutal', cantidad: 2, unidad: 'unidades', costo_unitario: 45, stock_minimo: 5 },
        ])
      }
    } catch (err) {
      console.error(err)
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
        unidad: 'unidad',
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
        await supabase.from('inventario').update(formData).eq('id', editingItem.id)
        setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i))
        toast.success('Insumo actualizado')
      } else {
        const { data } = await supabase.from('inventario').insert([formData]).select()
        if (data) setItems([...items, data[0]])
        else setItems([...items, { id: 'temp-' + Date.now(), ...formData }])
        toast.success('Insumo agregado al inventario')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error('Error al guardar')
    }
  }

  const handleDeleteItem = async (id, producto) => {
    if (!confirm(`¿Estás seguro de eliminar el insumo "${producto}"?`)) return
    try {
      await supabase.from('inventario').delete().eq('id', id)
      setItems(items.filter(i => i.id !== id))
      toast.success('Insumo eliminado')
    } catch (err) {
      toast.error('Error al eliminar insumo')
    }
  }

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
              {items.map((item) => {
                const isBajo = Number(item.cantidad) <= Number(item.stock_minimo)
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="font-bold text-slate-800 block text-xs">{item.producto}</span>
                      <span className="text-[11px] text-slate-400">{item.descripcion || 'Sin notas'}</span>
                    </td>
                    <td className="font-black text-slate-800 text-sm">
                      {item.cantidad}
                    </td>
                    <td className="text-xs text-slate-600">
                      {item.unidad}
                    </td>
                    <td className="text-xs text-slate-500 font-semibold">
                      {item.stock_minimo}
                    </td>
                    <td className="text-xs font-bold text-slate-700">
                      L. {Number(item.costo_unitario).toFixed(2)}
                    </td>
                    <td>
                      {isBajo ? (
                        <span className="badge badge-danger flex items-center gap-1">
                          <AlertTriangle size={12} /> Stock Bajo
                        </span>
                      ) : (
                        <span className="badge badge-success flex items-center gap-1">
                          <CheckCircle size={12} /> Óptimo
                        </span>
                      )}
                    </td>
                    <td className="sticky-right text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.producto)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar Insumo"
                        >
                          <Trash2 size={16} />
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

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Editar Insumo' : 'Registrar Insumo'}
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="input-label">Nombre del Producto / Químico *</label>
            <input
              type="text"
              required
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
              className="input-field"
              placeholder="Ej: Cera hidrofóbica en pasta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Cantidad Actual *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.cantidad}
                onChange={(e) => setFormData({ ...formData, cantidad: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Unidad de Medida</label>
              <select
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                className="input-field cursor-pointer"
              >
                <option value="unidad">Unidades</option>
                <option value="litros">Litros</option>
                <option value="galones">Galones</option>
                <option value="ml">Mililitros</option>
                <option value="paquete">Paquetes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Costo Unitario (Lempiras)</label>
              <input
                type="number"
                step="0.01"
                value={formData.costo_unitario}
                onChange={(e) => setFormData({ ...formData, costo_unitario: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="input-label">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                value={formData.stock_minimo}
                onChange={(e) => setFormData({ ...formData, stock_minimo: Number(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar Insumo
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
