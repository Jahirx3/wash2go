'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { E, $l, ls } from '@/lib/theme'
import {
  LayoutDashboard, ClipboardList, Users, Car, Wrench,
  Package, DollarSign, BarChart2, Settings, LogOut,
  ChevronLeft, ChevronRight, Droplets, Bell, UserCog,
  PlusCircle, Truck, ShoppingBag, MessageSquare
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    title: 'Operaciones',
    items: [
      { path: '/dashboard/ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['ADMIN', 'SUPERVISOR'] },
      { path: '/dashboard/ordenes/nueva', label: 'Nueva Orden', icon: PlusCircle, roles: ['ADMIN', 'SUPERVISOR'] },
      { path: '/dashboard/trabajadores', label: 'Trabajadores', icon: Truck, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    title: 'Clientes',
    items: [
      { path: '/dashboard/clientes', label: 'Clientes', icon: Users, roles: ['ADMIN', 'SUPERVISOR'] },
      { path: '/dashboard/vehiculos', label: 'Vehículos', icon: Car, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    title: 'Finanzas',
    items: [
      { path: '/dashboard/pagos', label: 'Pagos', icon: DollarSign, roles: ['ADMIN'] },
      { path: '/dashboard/gastos', label: 'Gastos', icon: ShoppingBag, roles: ['ADMIN'] },
      { path: '/dashboard/inventario', label: 'Inventario', icon: Package, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { path: '/dashboard/reportes', label: 'Reportes', icon: BarChart2, roles: ['ADMIN', 'SUPERVISOR'] },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { path: '/dashboard/servicios', label: 'Servicios', icon: Wrench, roles: ['ADMIN'] },
      { path: '/dashboard/usuarios', label: 'Usuarios', icon: UserCog, roles: ['ADMIN'] },
    ]
  }
]

export default function Sidebar({ collapsed, setCollapsed }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [hoveredPath, setHoveredPath] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const showLabels = !collapsed || isMobile

  // Estilo con el degradado azul celeste agua de la pantalla de bienvenida
  const sidebarStyle = {
    position: isMobile ? 'fixed' : 'fixed',
    top: 0, left: 0, bottom: 0,
    width: isMobile ? '260px' : (collapsed ? ls.sidebarCollapsedWidth : ls.sidebarWidth),
    background: 'linear-gradient(175deg, #e0f2fe 0%, #bae6fd 45%, #7dd3fc 100%)',
    borderRight: '1px solid rgba(14, 165, 233, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 50,
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
    boxShadow: '4px 0 25px rgba(14, 165, 233, 0.15)',
    overflowX: 'hidden',
  }

  const getItemStyle = (isActive, isHovered) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed && !isMobile ? 0 : '10px',
    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
    padding: collapsed && !isMobile ? '10px' : '10px 12px',
    borderRadius: '12px',
    cursor: 'pointer',
    textDecoration: 'none',
    position: 'relative',
    transition: 'all 0.15s ease',
    background: isActive
      ? 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,255,0.85))'
      : isHovered ? 'rgba(255,255,255,0.5)' : 'transparent',
    color: isActive ? '#0284c7' : isHovered ? '#0c1a2e' : '#0f2744',
    fontWeight: isActive ? 700 : 600,
    fontSize: '14px',
    boxShadow: isActive ? '0 4px 14px rgba(14,165,233,0.2), inset 3.5px 0 0 #0284c7' : 'none',
    ...($l.navItem),
  })

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,26,46,0.5)', zIndex: 49, backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile toggle button */}
      {isMobile && (
        <button onClick={() => setMobileOpen(!mobileOpen)}
          style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 60, background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'white', display: 'flex', boxShadow: '0 4px 12px rgba(14,165,233,0.4)' }}>
          <LayoutDashboard size={20} />
        </button>
      )}

      <aside style={sidebarStyle}>
        {/* Logo / Brand */}
        <div style={{ padding: '16px 16px', borderBottom: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}>
          <img
            src="/logo.png"
            alt="Wash2Go"
            style={{
              width: 38,
              height: 38,
              objectFit: 'contain',
              flexShrink: 0,
              filter: 'drop-shadow(0 4px 10px rgba(14,165,233,0.4))'
            }}
          />
          {showLabels && (
            <div>
              <p style={{ margin: 0, color: '#0c1a2e', fontWeight: 900, fontSize: '16px', letterSpacing: '-0.02em' }}>Wash2Go</p>
              <p style={{ margin: 0, color: '#0284c7', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Lo Pides, Llegamos</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_SECTIONS.map((section, si) => {
            const filtered = section.items.filter(item => item.roles.includes(user?.rol))
            if (!filtered.length) return null
            return (
              <div key={si} style={{ marginBottom: '4px' }}>
                {section.title && showLabels && (
                  <p style={{ ...($l.sectionHeader), color: '#0369a1', padding: '8px 12px 4px', margin: '4px 0 0', letterSpacing: '0.08em', fontWeight: 800 }}>
                    {section.title}
                  </p>
                )}
                {!showLabels && si > 0 && (
                  <div style={{ height: 1, background: 'rgba(14,165,233,0.2)', margin: '8px 4px' }} />
                )}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {filtered.map(item => {
                    const isActive = item.path === '/dashboard'
                      ? pathname === '/dashboard'
                      : pathname.startsWith(item.path)
                    const isHov = hoveredPath === item.path
                    return (
                      <Link key={item.path} href={item.path}
                        onMouseEnter={() => setHoveredPath(item.path)}
                        onMouseLeave={() => setHoveredPath(null)}
                        onClick={() => isMobile && setMobileOpen(false)}
                        style={getItemStyle(isActive, isHov)}>
                        <item.icon size={19} style={{ flexShrink: 0, color: isActive ? '#0284c7' : '#0369a1' }} />
                        {showLabels && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
                        {/* Tooltip cuando está colapsado */}
                        {!showLabels && isHov && !isMobile && (
                          <div style={{ position: 'absolute', left: '100%', marginLeft: 8, whiteSpace: 'nowrap', background: '#ffffff', color: '#0c1a2e', padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 14px rgba(14,165,233,0.25)', zIndex: 100, border: '1px solid rgba(14,165,233,0.2)' }}>
                            {item.label}
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )
          })}
        </div>

        {/* Bottom - user + collapse */}
        <div style={{ borderTop: '1px solid rgba(14,165,233,0.2)', padding: '12px 10px' }}>
          {!isMobile && (
            <button onClick={() => setCollapsed(!collapsed)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#0369a1', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginBottom: 10, transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.45)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Colapsar</span></>}
            </button>
          )}

          {/* User card en tarjeta suave translúcida */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 12, cursor: 'pointer', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(14,165,233,0.1)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0ea5e9,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0, boxShadow: '0 2px 8px rgba(14,165,233,0.3)' }}>
              {user?.nombre?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {showLabels && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ ...($l.userName), color: '#0c1a2e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>{user?.nombre || 'Administrador'}</p>
                  <p style={{ ...($l.userRole), color: '#0284c7', margin: 0, textTransform: 'capitalize', fontWeight: 600 }}>{user?.rol?.toLowerCase() || 'Admin'}</p>
                </div>
                <button onClick={logout} title="Cerrar sesión"
                  style={{ background: 'transparent', border: 'none', color: '#0369a1', cursor: 'pointer', padding: 4, display: 'flex', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0369a1'}>
                  <LogOut size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
