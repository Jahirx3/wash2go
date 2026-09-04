'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart2, Calendar, TrendingUp, DollarSign, Award, RefreshCw, Layers } from 'lucide-react'

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState('SEMANAL') // 'DIARIO' | 'SEMANAL' | 'MENSUAL'
  const [loading, setLoading] = useState(true)
  const [ordenes, setOrdenes] = useState([])
  const [gastos, setGastos] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordRes, gasRes] = await Promise.all([
        supabase
          .from('ordenes')
          .select('*, servicio:servicios(id, nombre, color)')
          .order('created_at', { ascending: true }),
        supabase
          .from('gastos')
          .select('*')
          .order('fecha', { ascending: true })
      ])

      setOrdenes(ordRes.data || [])
      setGastos(gasRes.data || [])
    } catch (err) {
      console.error('Error loading reportes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtrar según el período seleccionado
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // Rango Semanal (últimos 7 días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

  // Rango Mensual (últimos 30 días o mes actual)
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  const monthAgoStr = monthAgo.toISOString().split('T')[0]

  const ordenesFiltradas = ordenes.filter(o => {
    const d = o.created_at ? o.created_at.split('T')[0] : ''
    if (periodo === 'DIARIO') return d === todayStr
    if (periodo === 'SEMANAL') return d >= sevenDaysAgoStr
    if (periodo === 'MENSUAL') return d >= monthAgoStr
    return true
  })

  const gastosFiltrados = gastos.filter(g => {
    const d = g.fecha || ''
    if (periodo === 'DIARIO') return d === todayStr
    if (periodo === 'SEMANAL') return d >= sevenDaysAgoStr
    if (periodo === 'MENSUAL') return d >= monthAgoStr
    return true
  })

  const totalVentas = ordenesFiltradas.reduce((acc, o) => acc + Number(o.precio || 0), 0)
  const totalGastos = gastosFiltrados.reduce((acc, g) => acc + Number(g.monto || 0), 0)
  const gananciaNeta = totalVentas - totalGastos

  // Construir datos de gráfico comparativo de Ventas vs Gastos
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  let dataBar = []

  if (periodo === 'DIARIO') {
    // Horas o comparación del día
    dataBar = [
      { name: 'Hoy', ventas: totalVentas, gastos: totalGastos, ordenes: ordenesFiltradas.length }
    ]
  } else if (periodo === 'SEMANAL') {
    // 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const dName = diasSemana[d.getDay()]

      const v = ordenes.filter(o => o.created_at?.startsWith(dStr)).reduce((a, b) => a + Number(b.precio || 0), 0)
      const g = gastos.filter(gt => gt.fecha === dStr).reduce((a, b) => a + Number(b.monto || 0), 0)

      dataBar.push({ name: dName, ventas: v, gastos: g })
    }
  } else {
    // Últimas 4 semanas
    for (let w = 4; w >= 1; w--) {
      const start = new Date()
      start.setDate(start.getDate() - (w * 7))
      const end = new Date()
      end.setDate(end.getDate() - ((w - 1) * 7))

      const sStr = start.toISOString().split('T')[0]
      const eStr = end.toISOString().split('T')[0]

      const v = ordenes.filter(o => {
        const od = o.created_at?.split('T')[0]
        return od >= sStr && od <= eStr
      }).reduce((a, b) => a + Number(b.precio || 0), 0)

      const g = gastos.filter(gt => {
        return gt.fecha >= sStr && gt.fecha <= eStr
      }).reduce((a, b) => a + Number(b.monto || 0), 0)

      dataBar.push({ name: `Sem ${5 - w}`, ventas: v, gastos: g })
    }
  }

  // Agrupar por servicios para el pastel
  const serviciosConteo = {}
  ordenes.forEach(o => {
    const sName = o.servicio?.nombre || 'General'
    const sColor = o.servicio?.color || '#0ea5e9'
    if (!serviciosConteo[sName]) {
      serviciosConteo[sName] = { name: sName, count: 0, color: sColor }
    }
    serviciosConteo[sName].count += 1
  })

  const totalOrdenesParaPie = ordenes.length || 1
  const defaultColors = ['#0ea5e9', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b']
  const dataServiciosPie = Object.values(serviciosConteo).map((s, idx) => ({
    name: s.name,
    value: Math.round((s.count / totalOrdenesParaPie) * 100),
    color: s.color || defaultColors[idx % defaultColors.length]
  }))

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas Financieras</h1>
          <p className="page-subtitle">Análisis de ventas, gastos reales y rentabilidad neta en Comayagua</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary text-xs !py-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>

          {/* Selector de Período */}
          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            {['DIARIO', 'SEMANAL', 'MENSUAL'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodo === p ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Ventas Totales ({periodo})
          </span>
          <span className="text-2xl font-black text-slate-800">
            L. {totalVentas.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1">
            {ordenesFiltradas.length} órdenes finalizadas en el período
          </span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Gastos Operativos ({periodo})
          </span>
          <span className="text-2xl font-black text-rose-600">
            L. {totalGastos.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1">
            {gastosFiltrados.length} compras e insumos registrados
          </span>
        </div>

        <div className="stat-card bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200/60">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Ganancia Neta ({periodo})
          </span>
          <span className={`text-2xl font-black ${gananciaNeta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            L. {gananciaNeta.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
          </span>
          <span className="block text-[11px] text-emerald-600 font-semibold mt-1">
            {totalVentas > 0 ? `Margen del ${((gananciaNeta / totalVentas) * 100).toFixed(0)}%` : 'Sin ventas aún en este período'}
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras Comparativa Ventas vs Gastos */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
            Comparativa de Ingresos vs Gastos ({periodo})
          </h3>
          <p className="text-xs text-slate-400 mb-4">Datos extraídos en vivo de Supabase (Lempiras)</p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataBar} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(val) => [`L. ${Number(val).toFixed(2)}`, '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="ventas" name="Ventas" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pastel: Servicios Más Demandados */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
              Distribución por Servicio
            </h3>
            <p className="text-xs text-slate-400 mb-4">Porcentaje de demanda de autolavado</p>

            {dataServiciosPie.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-xs text-slate-400 italic">
                Aún no hay servicios solicitados en órdenes
              </div>
            ) : (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataServiciosPie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dataServiciosPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, 'Participación']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {dataServiciosPie.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
