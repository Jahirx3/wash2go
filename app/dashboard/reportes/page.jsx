'use client'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { BarChart2, Calendar, TrendingUp, DollarSign, Award } from 'lucide-react'

export default function ReportesPage() {
  const [periodo, setPeriodo] = useState('SEMANAL') // 'DIARIO' | 'SEMANAL' | 'MENSUAL'

  const dataSemanal = [
    { name: 'Lun', ventas: 1200, gastos: 250, ordenes: 4 },
    { name: 'Mar', ventas: 950, gastos: 120, ordenes: 3 },
    { name: 'Mié', ventas: 1450, gastos: 300, ordenes: 5 },
    { name: 'Jue', ventas: 1100, gastos: 180, ordenes: 4 },
    { name: 'Vie', ventas: 1900, gastos: 400, ordenes: 7 },
    { name: 'Sáb', ventas: 2600, gastos: 500, ordenes: 10 },
    { name: 'Dom', ventas: 2100, gastos: 350, ordenes: 8 },
  ]

  const dataMensual = [
    { name: 'Sem 1', ventas: 8400, gastos: 1800 },
    { name: 'Sem 2', ventas: 9600, gastos: 2100 },
    { name: 'Sem 3', ventas: 11200, gastos: 2400 },
    { name: 'Sem 4', ventas: 10500, gastos: 1900 },
  ]

  const dataServiciosPie = [
    { name: 'Lavado Completo', value: 45, color: '#0037b0' },
    { name: 'Lavado Básico', value: 30, color: '#0ea5e9' },
    { name: 'Lavado Premium', value: 25, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes y Estadísticas Financieras</h1>
          <p className="page-subtitle">Análisis de ventas diarias, semanales y mensuales de Wash2Go</p>
        </div>

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

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Ventas Totales {periodo === 'SEMANAL' ? 'Esta Semana' : periodo === 'MENSUAL' ? 'Este Mes' : 'Hoy'}
          </span>
          <span className="text-2xl font-black text-slate-800">
            L. {periodo === 'MENSUAL' ? '39,700.00' : '11,300.00'}
          </span>
          <span className="block text-[11px] text-emerald-600 font-semibold mt-1">
            +18% en comparación al período previo
          </span>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Gastos Operativos
          </span>
          <span className="text-2xl font-black text-rose-600">
            L. {periodo === 'MENSUAL' ? '8,200.00' : '2,100.00'}
          </span>
          <span className="block text-[11px] text-slate-500 mt-1">Combustible, insumos y mantenimiento</span>
        </div>

        <div className="stat-card bg-gradient-to-br from-emerald-50 to-sky-50 border-emerald-200/60">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            Ganancia Neta
          </span>
          <span className="text-2xl font-black text-emerald-700">
            L. {periodo === 'MENSUAL' ? '31,500.00' : '9,200.00'}
          </span>
          <span className="block text-[11px] text-emerald-600 font-semibold mt-1">Margen operativo del ~79%</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras Comparativa Ventas vs Gastos */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-1">
            Comparativa de Ingresos vs Gastos ({periodo})
          </h3>
          <p className="text-xs text-slate-400 mb-4">Valores expresados en Lempiras (L.)</p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={periodo === 'MENSUAL' ? dataMensual : dataSemanal} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(val) => [`L. ${val}`, '']}
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
              Servicios Más Populares
            </h3>
            <p className="text-xs text-slate-400 mb-4">Porcentaje de demanda de autolavado</p>

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
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {dataServiciosPie.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
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
