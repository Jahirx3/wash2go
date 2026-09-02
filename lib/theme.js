// lib/theme.js - Design tokens Wash2Go (basado en Llanticentro Elohim)
// Paleta: Blanco y Azul (agua/lavado)

export const E = {
  // Colores primarios - Azul agua Wash2Go
  primary: '#0ea5e9',           // sky-500 - azul principal
  primaryDark: '#0284c7',       // sky-600
  primaryDeep: '#0037b0',       // azul profundo (sidebar activo)
  primaryFixed: '#e0f2fe',      // sky-100 - fondo suave
  onPrimary: '#ffffff',

  // Superficies
  surface: '#f0f9ff',           // sky-50
  surfaceLow: '#f8fafc',        // slate-50
  surfaceContainer: '#e0f2fe',  // sky-100
  surfaceLowest: '#ffffff',
  surfaceVariant: '#dbeafe',    // blue-100

  // Texto
  onSurface: '#0c1a2e',         // casi negro azulado
  onSurfaceVariant: '#334155',  // slate-700

  // Bordes
  outline: '#64748b',           // slate-500
  outlineVariant: '#cbd5e1',    // slate-300

  // Estados
  error: '#ef4444',
  errorContainer: '#fee2e2',
  success: '#10b981',
  successBg: '#d1fae5',
  warning: '#f59e0b',
  warningBg: '#fef3c7',
  info: '#0ea5e9',
  infoBg: '#e0f2fe',

  // Inversos
  inverseSurface: '#1e293b',    // slate-800
  inverseOnSurface: '#f0f9ff',

  // Estados de órdenes
  estadoPendiente: '#f59e0b',
  estadoEnCamino: '#0ea5e9',
  estadoLavando: '#8b5cf6',
  estadoFinalizado: '#10b981',
  estadoCancelado: '#ef4444',
}

// Layout
export const ls = {
  sidebarWidth: '240px',
  sidebarCollapsedWidth: '76px',
  sectionGap: '1.5rem',
  sidebarPadding: '1rem',
}

// Fuente
export const et = "'Inter', 'Manrope', system-ui, sans-serif"

// Tipografía tokens
export const $l = {
  brandTitle: { fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' },
  navItem: { fontSize: '14px', fontWeight: '500', lineHeight: '20px' },
  navActive: { fontSize: '14px', fontWeight: '700', lineHeight: '20px' },
  sectionHeader: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' },
  userName: { fontSize: '13px', fontWeight: '600', lineHeight: '18px' },
  userRole: { fontSize: '11px', fontWeight: '400', lineHeight: '16px' },
}

// Helpers para badges de estado
export const getEstadoBadge = (estado) => {
  const map = {
    PENDIENTE:  { label: 'Pendiente',  bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    EN_CAMINO:  { label: 'En Camino',  bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
    LAVANDO:    { label: 'Lavando',    bg: '#ede9fe', color: '#5b21b6', border: '#ddd6fe' },
    FINALIZADO: { label: 'Finalizado', bg: '#d1fae5', color: '#065f46', border: '#a7f3d0' },
    CANCELADO:  { label: 'Cancelado',  bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
  }
  return map[estado] || map.PENDIENTE
}

export const getRolLabel = (rol) => {
  const map = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', TRABAJADOR: 'Trabajador' }
  return map[rol] || rol
}
