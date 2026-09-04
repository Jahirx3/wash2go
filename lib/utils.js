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

/**
 * Normaliza y formatea números de teléfono para la API de WhatsApp (wa.me)
 * Si es un número hondureño de 8 dígitos, le antepone el prefijo internacional 504.
 */
export function formatWhatsAppPhone(phone) {
  if (!phone) return ''
  let clean = String(phone).replace(/[^0-9]/g, '')
  if (clean.length === 8) {
    clean = '504' + clean
  }
  return clean
}

/**
 * Genera la URL directa de wa.me lista para abrir en WhatsApp Web o móvil.
 */
export function getWhatsAppUrl(phone, message = '') {
  const formatted = formatWhatsAppPhone(phone)
  if (!formatted) return ''
  const encoded = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${formatted}${encoded ? `?text=${encoded}` : ''}`
}

/**
 * Genera el mensaje oficial de finalización de orden para enviar al cliente por WhatsApp
 * incluyendo comprobante, fotos antes/después y enlace de seguimiento en vivo.
 */
export function generarMensajeFinalizado(orden) {
  if (!orden) return ''
  const trackingUrl = getTrackingUrl(orden.numero)
  const clienteNombre = orden.cliente?.nombre || 'Estimado(a) Cliente'
  const vehiculoInfo = orden.vehiculo
    ? `${orden.vehiculo.marca || ''} ${orden.vehiculo.modelo || ''} (${orden.vehiculo.placa || 'S/P'})`.trim()
    : 'tu vehículo'
  const servicioNombre = orden.servicio?.nombre || 'Lavado de Auto'
  const precio = Number(orden.precio || 0).toFixed(2)

  let msg = `¡Hola ${clienteNombre}! 🚗✨\n\n`
  msg += `Te informamos que tu servicio de *Wash2Go* ha sido *FINALIZADO* con éxito.\n\n`
  msg += `📋 *Detalles del Servicio:*\n`
  msg += `• *Orden:* ${orden.numero}\n`
  msg += `• *Vehículo:* ${vehiculoInfo}\n`
  msg += `• *Servicio:* ${servicioNombre}\n`
  msg += `• *Total Cobrado:* L. ${precio}\n\n`
  msg += `🔍 *Ver Seguimiento y Comprobante Digital:*\n${trackingUrl}\n\n`

  if (orden.foto_antes_url || orden.foto_despues_url) {
    msg += `📸 *Fotos del Servicio:*\n`
    if (orden.foto_antes_url) {
      msg += `• Antes: ${orden.foto_antes_url}\n`
    }
    if (orden.foto_despues_url) {
      msg += `• Después: ${orden.foto_despues_url}\n`
    }
    msg += `\n`
  }

  msg += `¡Muchas gracias por tu preferencia! Wash2Go · 'Lo Pides, Llegamos' 💧`
  return msg
}
