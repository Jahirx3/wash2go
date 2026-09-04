'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import {
  DollarSign, CheckCircle2, UserPlus, ShoppingBag,
  TrendingUp, Users, Plus, ArrowUpRight, Clock,
  Calendar, MapPin, Car, Phone, Eye, RefreshCw, Droplets,
  Package, Fuel, Layers
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    ventasDia: 0,
    totalVentas: 0,
    serviciosRealizados: 0,
    clientesNuevos: 0,
    gastosDia: 0,
    ganancia: 0,
    trabajadoresActivos: 0,
  })
  const [ordenesRecientes, setOrdenesRecientes] = useState([])
  const [chartData, setChartData] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // 1. Fetch Órdenes
      const { data: ordenes, error: ordError } = await supabase
        .from('ordenes')
        .select(`
          *,
          cliente:clientes(nombre, telefono),
          vehiculo:vehiculos(marca, modelo, placa, color),
          servicio:servicios(nombre),
          trabajador:usuarios(nombre)
        `)
        .order('created_at', { ascending: false })

      // 2. Fetch Gastos
      const { data: gastos } = await supabase
        .from('gastos')
        .select('monto, fecha')

      // 3. Fetch Clientes
      const { count: countClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // 4. Fetch Trabajadores activos
      const { count: countTrabajadores } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'TRABAJADOR')
        .eq('activo', true)

      const allOrdenes = ordenes || []
      const allGastos = gastos || []

      // Cálculos en tiempo real
      const ventasHoy = allOrdenes
        .filter(o => o.created_at?.startsWith(today) && o.estado === 'FINALIZADO')
        .reduce((acc, curr) => acc + Number(curr.precio || 0), 0)

      const totalVentasAcumuladas = allOrdenes
        .filter(o => o.estado === 'FINALIZADO')
        .reduce((acc, curr) => acc + Number(curr.precio || 0), 0)

      const serviciosHoy = allOrdenes.filter(
        o => o.created_at?.startsWith(today) && o.estado === 'FINALIZADO'
      ).length

      const gastosHoy = allGastos
        .filter(g => g.fecha === today)
        .reduce((acc, curr) => acc + Number(curr.monto || 0), 0)

      setStats({
        ventasDia: ventasHoy,
        totalVentas: totalVentasAcumuladas,
        serviciosRealizados: serviciosHoy,
        clientesNuevos: countClientes || 0,
        gastosDia: gastosHoy,
        ganancia: ventasHoy - gastosHoy,
        trabajadoresActivos: countTrabajadores || 0,
      })

      setOrdenesRecientes(allOrdenes.slice(0, 8))

      // Gráfico de los últimos 7 días con datos reales de Supabase
      const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const ultimos7Dias = []

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        const diaNombre = diasSemana[d.getDay()]

        const ordenesDelDia = allOrdenes.filter(o => o.created_at?.startsWith(dateStr))
        const ventasDelDia = ordenesDelDia.reduce((acc, curr) => acc + Number(curr.precio || 0), 0)

        ultimos7Dias.push({
          dia: diaNombre,
          fecha: dateStr,
          ventas: ventasDelDia,
          ordenes: ordenesDelDia.length
        })
      }

      setChartData(ultimos7Dias)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div suppressHydrationWarning className="space-y-6">
      {/* Banner Superior & Quick Actions */}
      <div suppressHydrationWarning className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Panel de Control
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 border border-sky-200">
              Comayagua
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas en vivo de servicios de lavado, ingresos y operaciones
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary !py-2 !px-3 text-xs"
            title="Refrescar datos"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <Link href="/dashboard/ordenes/nueva" className="btn-primary !py-2 !px-4 text-xs font-bold">
            <Plus size={16} />
            Nueva Orden
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 1. Ventas del Día */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ventas Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-800">
              L. {stats.ventasDia.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-slate-400 font-medium mt-0.5">
              Acum: L. {stats.totalVentas.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 2. Servicios Realizados */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Servicios Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-800">
              {stats.serviciosRealizados}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
              Lavados finalizados hoy
            </span>
          </div>
        </div>

        {/* 3. Clientes Registrados */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Clientes</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-800">
              {stats.clientesNuevos}
            </span>
            <span className="block text-[11px] text-sky-600 font-medium mt-0.5">
              En directorio
            </span>
          </div>
        </div>

        {/* 4. Gastos del Día */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gastos Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-rose-600">
              L. {stats.gastosDia.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
              Combustible e insumos
            </span>
          </div>
        </div>

        {/* 5. Ganancia Neta */}
        <div className="stat-card flex flex-col justify-between bg-gradient-to-br from-sky-50 to-emerald-50 border-emerald-200/60">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Balance Hoy</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-emerald-700">
              L. {stats.ganancia.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
              Ventas - Gastos
            </span>
          </div>
        </div>

        {/* 6. Trabajadores */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lavadores</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-800">
              {stats.trabajadoresActivos}
            </span>
            <span className="block text-[11px] text-amber-600 font-medium mt-0.5">
              En servicio activo
            </span>
          </div>
        </div>
      </div>

      {/* Gráfica de Ventas & Accesos Rápidos Operativos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas Semanales */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Rendimiento de Ventas (Últimos 7 Días)
              </h2>
              <p className="text-xs text-slate-400">Ingresos generados por órdenes de lavado</p>
            </div>
            <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
              Lempiras (L.)
            </span>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} stroke="#64748b" fontSize={12} />
                <YAxis tickLine={false} axisLine={false} stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value) => [`L. ${value}`, 'Ventas']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="ventas" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tarjeta de Accesos Rápidos Operativos */}
        <div className="glass-card p-5 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg border-none">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Layers size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold">Gestión Inmediata</h3>
                <span className="text-[11px] text-sky-400 font-medium">Atajos de Operación Wash2Go</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Realiza las operaciones más frecuentes del autolavado en un solo clic:
            </p>

            <div className="space-y-2">
              <Link
                href="/dashboard/ordenes/nueva"
                className="flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Droplets size={16} className="text-sky-400" />
                  + Crear Orden con Cliente Rápido
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>

              <Link
                href="/dashboard/clientes"
                className="flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={16} className="text-emerald-400" />
                  Directorio de Clientes & Autos
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>

              <Link
                href="/dashboard/inventario"
                className="flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Package size={16} className="text-amber-400" />
                  Control de Stock de Químicos
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>

              <Link
                href="/dashboard/gastos"
                className="flex items-center justify-between p-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-semibold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Fuel size={16} className="text-rose-400" />
                  Registrar Gasto de Combustible
                </span>
                <ArrowUpRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-center">
            <span className="text-[11px] text-slate-400">
              Wash2Go Comayagua · Sistema Operativo Activo
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes Recientes */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Órdenes de Lavado Recientes
            </h2>
            <p className="text-xs text-slate-400">Servicios registrados en la base de datos de Supabase</p>
          </div>
          <Link
            href="/dashboard/ordenes"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Ver Todas las Órdenes <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="modern-table">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Servicio</th>
                <th>Ubicación</th>
                <th>Lavador</th>
                <th>Estado</th>
                <th className="text-right">Precio</th>
                <th className="sticky-right text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {ordenesRecientes.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Droplets size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No hay órdenes de lavado registradas aún</p>
                    <p className="text-xs text-slate-400 mt-0.5">Haz clic en "Nueva Orden" para agendar el primer servicio a domicilio</p>
                    <Link href="/dashboard/ordenes/nueva" className="btn-primary mx-auto mt-3 inline-flex text-xs">
                      <Plus size={14} /> Crear Primera Orden
                    </Link>
                  </td>
                </tr>
              )}
              {ordenesRecientes.map((orden) => (
                <tr key={orden.id}>
                  <td className="font-bold text-sky-600 font-mono text-xs">
                    {orden.numero}
                  </td>
                  <td>
                    <div>
                      <span className="font-semibold block text-slate-800 text-xs">{orden.cliente?.nombre || 'Cliente General'}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone size={10} /> {orden.cliente?.telefono || 'Sin teléfono'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="font-medium text-slate-700 text-xs">
                        {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        {orden.vehiculo?.placa} · {orden.vehiculo?.color}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {orden.servicio?.nombre || 'Lavado'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 truncate max-w-[180px] block flex items-center gap-1" title={orden.direccion}>
                      <MapPin size={12} className="text-rose-500 shrink-0" />
                      {orden.direccion}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-700">
                      {orden.trabajador?.nombre || 'Sin Asignar'}
                    </span>
                  </td>
                  <td>
                    <Badge estado={orden.estado} />
                  </td>
                  <td className="text-right font-black text-slate-800 text-xs">
                    L. {Number(orden.precio || 0).toFixed(2)}
                  </td>
                  <td className="sticky-right text-center">
                    <Link
                      href={`/dashboard/ordenes`}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg inline-flex transition-colors"
                      title="Ver Detalle"
                    >
                      <Eye size={16} />
                    </Link>
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
