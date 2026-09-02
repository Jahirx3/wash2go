'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DollarSign, CreditCard, Banknote, Filter, Search } from 'lucide-react'

export default function PagosPage() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPago, setFiltroPago] = useState('TODOS')

  const fetchPagos = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('ordenes')
        .select(`
          id, numero, precio, forma_pago, total_cobrado, propina, estado, created_at,
          cliente:clientes(nombre, telefono)
        `)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) {
        setOrdenes(data)
      } else {
        setOrdenes([
          { id: '1', numero: 'ORD-2026-0001', precio: 300, forma_pago: 'EFECTIVO', total_cobrado: 300, estado: 'FINALIZADO', cliente: { nombre: 'Mario Aguilar' } },
          { id: '2', numero: 'ORD-2026-0002', precio: 150, forma_pago: 'TRANSFERENCIA', total_cobrado: 150, estado: 'FINALIZADO', cliente: { nombre: 'Lucía Fernández' } },
          { id: '3', numero: 'ORD-2026-0003', precio: 500, forma_pago: 'EFECTIVO', total_cobrado: 500, estado: 'FINALIZADO', cliente: { nombre: 'Roberto Pineda' } },
          { id: '4', numero: 'ORD-2026-0004', precio: 250, forma_pago: 'TRANSFERENCIA', total_cobrado: 250, estado: 'FINALIZADO', cliente: { nombre: 'Elena Sánchez' } },
        ])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagos()
  }, [])

  const ordenesFiltradas = ordenes.filter(o => filtroPago === 'TODOS' || o.forma_pago === filtroPago)

  const totalEfectivo = ordenes.filter(o => o.forma_pago === 'EFECTIVO').reduce((a, b) => a + Number(b.precio || 0), 0)
  const totalTransferencia = ordenes.filter(o => o.forma_pago === 'TRANSFERENCIA').reduce((a, b) => a + Number(b.precio || 0), 0)
  const totalGeneral = totalEfectivo + totalTransferencia

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja y Métodos de Pago</h1>
          <p className="page-subtitle">Desglose de cobros en Efectivo, Transferencias bancarias y totales</p>
        </div>
      </div>

      {/* Tarjetas de Resumen de Cobro */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Cobrado</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-800">
            L. {totalGeneral.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1">Ingresos acumulados</span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Efectivo en Mano</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Banknote size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-700">
            L. {totalEfectivo.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-emerald-600 mt-1">
            {((totalEfectivo / (totalGeneral || 1)) * 100).toFixed(0)}% del total
          </span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Transferencias Bancarias</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-700">
            L. {totalTransferencia.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-blue-600 mt-1">
            {((totalTransferencia / (totalGeneral || 1)) * 100).toFixed(0)}% del total
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-3 flex gap-2">
        {['TODOS', 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].map((p) => (
          <button
            key={p}
            onClick={() => setFiltroPago(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtroPago === p
                ? 'bg-sky-500 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Método de Pago</th>
                <th>Estado de la Orden</th>
                <th className="text-right">Total Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono font-bold text-sky-600 text-xs">
                    {o.numero}
                  </td>
                  <td className="font-semibold text-slate-800 text-xs">
                    {o.cliente?.nombre || 'General'}
                  </td>
                  <td>
                    <span className="badge badge-info text-[11px]">
                      {o.forma_pago}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 font-medium">
                      {o.estado}
                    </span>
                  </td>
                  <td className="text-right font-black text-slate-800 text-sm">
                    L. {Number(o.precio || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
