'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { DollarSign, CreditCard, Banknote, Filter, Search, Plus, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function PagosPage() {
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPago, setFiltroPago] = useState('TODOS')
  const [search, setSearch] = useState('')

  const fetchPagos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id, numero, precio, forma_pago, total_cobrado, propina, estado, created_at,
          cliente:clientes(nombre, telefono)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching payments:', error.message)
        setOrdenes([])
        return
      }

      setOrdenes(data || [])
    } catch (err) {
      console.error(err)
      setOrdenes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagos()
  }, [])

  const ordenesFiltradas = ordenes.filter(o => {
    const matchesPago = filtroPago === 'TODOS' || o.forma_pago === filtroPago
    const matchesSearch =
      o.numero?.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      o.forma_pago?.toLowerCase().includes(search.toLowerCase())
    return matchesPago && matchesSearch
  })

  const totalEfectivo = ordenes.filter(o => o.forma_pago === 'EFECTIVO').reduce((a, b) => a + Number(b.precio || 0), 0)
  const totalTransferencia = ordenes.filter(o => o.forma_pago === 'TRANSFERENCIA').reduce((a, b) => a + Number(b.precio || 0), 0)
  const totalTarjeta = ordenes.filter(o => o.forma_pago === 'TARJETA').reduce((a, b) => a + Number(b.precio || 0), 0)
  const totalGeneral = totalEfectivo + totalTransferencia + totalTarjeta

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Caja y Métodos de Pago</h1>
          <p className="page-subtitle">Desglose de cobros en Efectivo, Transferencias bancarias y balance de ingresos</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchPagos} className="btn-secondary text-xs !py-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar Caja
          </button>
          <Link href="/dashboard/ordenes/nueva" className="btn-primary">
            <Plus size={16} /> Nueva Orden
          </Link>
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
          <span className="block text-[11px] text-slate-500 mt-1">{ordenes.length} órdenes registradas</span>
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
          <span className="block text-[11px] text-emerald-600 font-semibold mt-1">
            {totalGeneral > 0 ? ((totalEfectivo / totalGeneral) * 100).toFixed(0) : 0}% del total recaudado
          </span>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Transferencias / Tarjeta</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CreditCard size={18} />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-700">
            L. {(totalTransferencia + totalTarjeta).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-blue-600 font-semibold mt-1">
            {totalGeneral > 0 ? (((totalTransferencia + totalTarjeta) / totalGeneral) * 100).toFixed(0) : 0}% en banco
          </span>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
          <input
            type="text"
            placeholder="Buscar por N° orden, cliente o método..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs"
          />
        </div>

        <div className="flex gap-2">
          {['TODOS', 'EFECTIVO', 'TRANSFERENCIA', 'TARJETA'].map((p) => (
            <button
              key={p}
              onClick={() => setFiltroPago(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroPago === p
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Método de Pago</th>
                <th>Estado de la Orden</th>
                <th className="text-right">Total Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Banknote size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay transacciones registradas</p>
                    <p className="text-xs text-slate-400 mt-0.5">Al crear órdenes de trabajo los cobros se reflejarán automáticamente aquí</p>
                  </td>
                </tr>
              )}
              {ordenesFiltradas.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono font-bold text-sky-600 text-xs">
                    {o.numero}
                  </td>
                  <td className="text-xs text-slate-500 font-mono">
                    {o.created_at ? o.created_at.split('T')[0] : '-'}
                  </td>
                  <td className="font-semibold text-slate-800 text-xs">
                    {o.cliente?.nombre || 'Cliente General'}
                  </td>
                  <td>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      o.forma_pago === 'EFECTIVO' ? 'bg-emerald-100 text-emerald-800' :
                      o.forma_pago === 'TRANSFERENCIA' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {o.forma_pago}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-700 font-medium">
                      {o.estado?.replace('_', ' ')}
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
