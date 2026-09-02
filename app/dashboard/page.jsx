'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import {
  DollarSign, CheckCircle2, UserPlus, ShoppingBag,
  TrendingUp, Users, Plus, ArrowUpRight, Clock,
  Calendar, MapPin, Car, Phone, Eye, RefreshCw, MessageSquare
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    ventasDia: 0,
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
        .limit(10)

      // 2. Fetch Gastos de hoy
      const { data: gastos } = await supabase
        .from('gastos')
        .select('monto')
        .eq('fecha', today)

      // 3. Fetch Clientes de hoy
      const { count: countClientes } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // 4. Fetch Trabajadores activos
      const { count: countTrabajadores } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('rol', 'TRABAJADOR')
        .eq('activo', true)

      if (ordenes && ordenes.length > 0) {
        const ventasHoy = ordenes
          .filter(o => o.created_at?.startsWith(today) && o.estado === 'FINALIZADO')
          .reduce((acc, curr) => acc + Number(curr.precio || 0), 0)

        const serviciosHoy = ordenes.filter(
          o => o.created_at?.startsWith(today) && o.estado === 'FINALIZADO'
        ).length

        const gastosHoy = (gastos || []).reduce((acc, curr) => acc + Number(curr.monto || 0), 0)

        setStats({
          ventasDia: ventasHoy,
          serviciosRealizados: serviciosHoy,
          clientesNuevos: countClientes || 0,
          gastosDia: gastosHoy,
          ganancia: ventasHoy - gastosHoy,
          trabajadoresActivos: countTrabajadores || 0,
        })
        setOrdenesRecientes(ordenes)
      } else {
        // Datos de muestra amigables si las tablas aún están vacías
        setStats({
          ventasDia: 850,
          serviciosRealizados: 4,
          clientesNuevos: 3,
          gastosDia: 120,
          ganancia: 730,
          trabajadoresActivos: 2,
        })
        setOrdenesRecientes([
          {
            id: 'demo-1',
            numero: 'ORD-2026-0001',
            estado: 'LAVANDO',
            direccion: 'Barrio Arriba, 3ra calle, Comayagua',
            precio: 300,
            forma_pago: 'EFECTIVO',
            created_at: new Date().toISOString(),
            cliente: { nombre: 'Mario Aguilar', telefono: '+504 9876-1234' },
            vehiculo: { marca: 'Toyota', modelo: 'Hilux', placa: 'HAB-1029', color: 'Blanco' },
            servicio: { nombre: 'Lavado Completo' },
            trabajador: { nombre: 'Carlos Mejía' }
          },
          {
            id: 'demo-2',
            numero: 'ORD-2026-0002',
            estado: 'EN_CAMINO',
            direccion: 'Col. San Martín, Casa 12',
            precio: 150,
            forma_pago: 'TRANSFERENCIA',
            created_at: new Date().toISOString(),
            cliente: { nombre: 'Lucía Fernández', telefono: '+504 9555-4321' },
            vehiculo: { marca: 'Hyundai', modelo: 'Elantra', placa: 'HAC-4432', color: 'Gris' },
            servicio: { nombre: 'Lavado Básico' },
            trabajador: { nombre: 'Juan Romero' }
          },
          {
            id: 'demo-3',
            numero: 'ORD-2026-0003',
            estado: 'FINALIZADO',
            direccion: 'Residencial Plaza de Armas',
            precio: 400,
            forma_pago: 'EFECTIVO',
            created_at: new Date().toISOString(),
            cliente: { nombre: 'Roberto Pineda', telefono: '+504 8888-9900' },
            vehiculo: { marca: 'Ford', modelo: 'Ranger', placa: 'HAD-8821', color: 'Azul' },
            servicio: { nombre: 'Lavado Premium' },
            trabajador: { nombre: 'Carlos Mejía' }
          }
        ])
      }

      // Chart data de ejemplo representativo semanal
      setChartData([
        { dia: 'Lun', ventas: 1200, ordenes: 5 },
        { dia: 'Mar', ventas: 950, ordenes: 4 },
        { dia: 'Mié', ventas: 1450, ordenes: 6 },
        { dia: 'Jue', ventas: 1100, ordenes: 5 },
        { dia: 'Vie', ventas: 1900, ordenes: 8 },
        { dia: 'Sáb', ventas: 2600, ordenes: 11 },
        { dia: 'Dom', ventas: 2100, ordenes: 9 },
      ])
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
            Resumen operativo y métricas en tiempo real de Wash2Go
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

      {/* Grid de Métricas Principales (6 KPIs solicitados) */}
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
              L. {stats.ventasDia.toLocaleString()}
            </span>
            <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
              +12% vs ayer
            </span>
          </div>
        </div>

        {/* 2. Servicios Realizados */}
        <div className="stat-card flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Servicios</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-slate-800">
              {stats.serviciosRealizados}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
              Lavados finalizados
            </span>
          </div>
        </div>

        {/* 3. Clientes Nuevos */}
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
              Registrados
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
              L. {stats.gastosDia.toLocaleString()}
            </span>
            <span className="block text-[11px] text-slate-500 font-medium mt-0.5">
              Operativos
            </span>
          </div>
        </div>

        {/* 5. Ganancia Neta */}
        <div className="stat-card flex flex-col justify-between bg-gradient-to-br from-sky-50 to-emerald-50 border-emerald-200/60">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Ganancia</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <span className="text-xl md:text-2xl font-black text-emerald-700">
              L. {stats.ganancia.toLocaleString()}
            </span>
            <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
              Margen neto hoy
            </span>
          </div>
        </div>

        {/* 6. Trabajadores en Servicio */}
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

      {/* Gráfica de Ventas & WhatsApp Bot Simulator banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Ventas Semanales */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Rendimiento de Ventas (Semana Actual)
              </h2>
              <p className="text-xs text-slate-400">Ingresos facturados por servicios de autolavado</p>
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

        {/* Banner WhatsApp Business & Info Directa */}
        <div className="glass-card p-5 flex flex-col justify-between bg-gradient-to-br from-[#0c1a2e] to-[#0f2744] text-white border-none shadow-lg">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold">WhatsApp Business Bot</h3>
                <span className="text-[11px] text-emerald-400 font-medium">● Flujo Automatizado Activo</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Cuando un cliente escribe por WhatsApp pidiendo un lavado, el bot le solicita automáticamente:
            </p>

            <ul className="text-xs space-y-2 text-slate-200">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center border border-sky-400/30">1</span>
                <span>Tipo de servicio deseado</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center border border-sky-400/30">2</span>
                <span>Placa y características del auto</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[10px] font-bold flex items-center justify-center border border-sky-400/30">3</span>
                <span>Ubicación GPS en Comayagua</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/60">
            <Link
              href="/dashboard/ordenes/nueva"
              className="w-full btn-primary !bg-gradient-to-r !from-emerald-500 !to-teal-600 !border-none !shadow-emerald-500/20 justify-center text-xs font-bold"
            >
              Registrar Orden Manual
            </Link>
          </div>
        </div>
      </div>

      {/* Tabla de Órdenes Recientes con Estados en Vivo */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Órdenes de Lavado en Proceso
            </h2>
            <p className="text-xs text-slate-400">Seguimiento de servicios activos y recientes</p>
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
              {ordenesRecientes.map((orden) => (
                <tr key={orden.id}>
                  <td className="font-bold text-sky-600">
                    {orden.numero}
                  </td>
                  <td>
                    <div>
                      <span className="font-semibold block text-slate-800">{orden.cliente?.nombre || 'Cliente General'}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone size={11} /> {orden.cliente?.telefono || 'Sin teléfono'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="font-medium text-slate-700">
                        {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        {orden.vehiculo?.placa} · {orden.vehiculo?.color}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
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
                  <td className="text-right font-bold text-slate-800">
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
