'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, Search, RefreshCw, ExternalLink } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { E } from '@/lib/theme'

const BREADCRUMBS = {
  '/dashboard': 'Dashboard',
  '/dashboard/ordenes': 'Órdenes de Lavado',
  '/dashboard/ordenes/nueva': 'Nueva Orden',
  '/dashboard/clientes': 'Clientes',
  '/dashboard/vehiculos': 'Vehículos',
  '/dashboard/trabajadores': 'Trabajadores',
  '/dashboard/pagos': 'Pagos',
  '/dashboard/gastos': 'Gastos',
  '/dashboard/inventario': 'Inventario',
  '/dashboard/reportes': 'Reportes',
  '/dashboard/servicios': 'Servicios',
  '/dashboard/usuarios': 'Usuarios',
}

export default function Navbar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [time, setTime] = useState('')
  const [today, setToday] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('es-HN', { hour:'2-digit', minute:'2-digit' }))
      setToday(now.toLocaleDateString('es-HN', { weekday:'long', day:'numeric', month:'long' }))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  const pageTitle = BREADCRUMBS[pathname] || 'Wash2Go'

  return (
    <header style={{
      height: '62px',
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(203,213,225,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
    }}>
      {/* Left - Title */}
      <div style={{ display:'flex', flexDirection:'column' }}>
        <h1 style={{ margin:0, fontSize:'16px', fontWeight:800, color:'#0c1a2e', letterSpacing:'-0.02em' }}>
          {pageTitle}
        </h1>
        <p style={{ margin:0, fontSize:'11px', color:'#94a3b8', textTransform:'capitalize' }}>
          {today} · {time}
        </p>
      </div>

      {/* Right - Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <a
          href="/catalogo"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#0284c7',
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '12px',
            textDecoration: 'none',
            transition: 'all 0.15s'
          }}
          title="Abrir el catálogo público de servicios para clientes"
        >
          <ExternalLink size={13} />
          <span>Ver Catálogo</span>
        </a>

        {/* Notifications */}
        <button style={{ position:'relative', background:'transparent', border:'none', cursor:'pointer', padding:'8px', borderRadius:'10px', color:'#64748b', display:'flex', transition:'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background='#f1f5f9'; e.currentTarget.style.color='#0ea5e9' }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#64748b' }}>
          <Bell size={20} />
          <span style={{ position:'absolute', top:'6px', right:'6px', width:'8px', height:'8px', background:'#ef4444', borderRadius:'50%', border:'2px solid white' }} />
        </button>

        {/* User pill */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f0f9ff', borderRadius:'999px', padding:'6px 12px 6px 6px', border:'1px solid #e0f2fe' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:'linear-gradient(135deg,#0ea5e9,#0037b0)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'12px' }}>
            {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:'#0c1a2e', lineHeight:1.2 }}>{user?.nombre?.split(' ')[0]}</p>
            <p style={{ margin:0, fontSize:'10px', color:'#64748b', lineHeight:1.2, textTransform:'capitalize' }}>{user?.rol?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
