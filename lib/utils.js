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

/**
 * Comprime imágenes en el navegador antes de subirlas al servidor.
 * Reduce fotos de cámaras de celular (5MB - 12MB) a ~80KB - 150KB en formato WebP,
 * ahorrando un 95% a 98% del espacio de Supabase y haciendo la subida instantánea en datos móviles.
 */
export async function compressImage(file, maxWidth = 1280, maxHeight = 1280, quality = 0.75) {
  if (typeof window === 'undefined' || !file || !file.type.startsWith('image/')) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Redimensionar si excede el tamaño máximo
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          } else {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const safeName = (file.name || 'foto').replace(/\.[^.]+$/, '') + '.webp'
              const compressedFile = new File([blob], safeName, {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              resolve(file)
            }
          },
          'image/webp',
          quality
        )
      }
      img.onerror = () => resolve(file)
      img.src = e.target.result
    }
    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
