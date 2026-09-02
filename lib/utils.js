// lib/utils.js - Utilidades generales Wash2Go

/**
 * Obtiene la URL base de la aplicación de forma dinámica.
 * Funciona tanto en cliente (navegador) como en servidor (Node/Edge en Vercel o local).
 */
export function getBaseUrl() {
  // 1. Si se ejecuta en el navegador
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  // 2. Si está configurada una URL pública en variables de entorno (por ejemplo en Vercel)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }

  // 3. Variable automática que Vercel inyecta en cada deploy
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 4. Fallback local por defecto
  return 'http://localhost:3000'
}

/**
 * Genera el enlace público de seguimiento para una orden.
 * @param {string} ordenNumero - Número identificador de la orden (ej: ORD-2026-1234)
 */
export function getTrackingUrl(ordenNumero) {
  const base = getBaseUrl()
  return `${base}/tracking/${ordenNumero}`
}

/**
 * Formatea cantidades monetarias a Lempiras hondureños (L.)
 */
export function formatMoney(amount) {
  const num = Number(amount) || 0
  return `L. ${num.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
