import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTrackingUrl } from '@/lib/utils'

// 1. Verificación de Webhook para Meta WhatsApp Business API
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'wash2go_webhook_secret_2026'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ Webhook verificado por Meta WhatsApp Business!')
    return new Response(challenge, { status: 200 })
  }

  return new Response('Verificación fallida', { status: 403 })
}

// 2. Recepción de mensajes entrantes de clientes
export async function POST(request) {
  try {
    const body = await request.json()

    // Comprobar si es un payload válido de WhatsApp
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ status: 'no_message' })
    }

    const fromNumber = message.from // Número de WhatsApp del cliente
    const messageType = message.type
    let textContent = ''
    let locationData = null

    if (messageType === 'text') {
      textContent = message.text?.body?.trim() || ''
    } else if (messageType === 'location') {
      locationData = {
        lat: message.location?.latitude,
        lng: message.location?.longitude,
        name: message.location?.name,
        address: message.location?.address,
      }
    }

    console.log(`📩 Mensaje recibido de ${fromNumber}:`, textContent || locationData)

    // Buscar o iniciar sesión conversacional
    let { data: sesion } = await supabase
      .from('sesiones_whatsapp')
      .select('*')
      .eq('whatsapp_id', fromNumber)
      .single()

    let respuestaBot = ''
    let nuevoEstado = 'INICIO'
    let datos = sesion?.datos_flujo || {}

    // Flujo conversacional paso a paso:
    switch (sesion?.estado_flujo || 'INICIO') {
      case 'INICIO':
        nuevoEstado = 'ESPERANDO_SERVICIO'
        respuestaBot =
          '¡Hola! 🚗💦 Bienvenido a *Wash2Go* — "Lo Pides, Llegamos" en Comayagua.\n\n' +
          '¿Qué tipo de lavado deseas para tu vehículo hoy?\n' +
          '1️⃣ *Lavado Básico Exterior* (L. 150)\n' +
          '2️⃣ *Lavado Completo Interior + Exterior* (L. 300)\n' +
          '3️⃣ *Lavado Premium con Encerado* (L. 500)\n\n' +
          'Responde con el número de tu opción (1, 2 o 3).'
        break

      case 'ESPERANDO_SERVICIO':
        let servicioNombre = 'Lavado Completo'
        let servicioPrecio = 300
        if (textContent.includes('1')) {
          servicioNombre = 'Lavado Básico'
          servicioPrecio = 150
        } else if (textContent.includes('3')) {
          servicioNombre = 'Lavado Premium'
          servicioPrecio = 500
        }
        datos.servicio = servicioNombre
        datos.precio = servicioPrecio
        nuevoEstado = 'ESPERANDO_PLACA'
        respuestaBot =
          `Excelente elección: *${servicioNombre}* (L. ${servicioPrecio}).\n\n` +
          'Por favor, indícanos el *número de placa o matrícula* de tu auto.\nEjemplo: _HAB-1234_'
        break

      case 'ESPERANDO_PLACA':
        datos.placa = textContent.toUpperCase()
        nuevoEstado = 'ESPERANDO_CARACTERISTICAS'
        respuestaBot =
          `Placa anotada: *${datos.placa}*.\n\n` +
          '¿Cuáles son las *características de tu vehículo*? (Marca, Modelo, Color, etc.)\n' +
          'Ejemplo: _Toyota Hilux blanca de paila_'
        break

      case 'ESPERANDO_CARACTERISTICAS':
        datos.vehiculo = textContent
        nuevoEstado = 'ESPERANDO_UBICACION'
        respuestaBot =
          `Perfecto: *${datos.vehiculo}*.\n\n` +
          '📍 Por último, envíanos tu *Ubicación en tiempo real* o escribe tu *Dirección exacta en Comayagua* para que nuestro lavador llegue hasta donde estás.'
        break

      case 'ESPERANDO_UBICACION':
        datos.ubicacion = locationData
          ? `GPS: ${locationData.lat}, ${locationData.lng}`
          : textContent

        nuevoEstado = 'ORDEN_REGISTRADA'

        // Crear o buscar cliente en BD
        let { data: cliente } = await supabase
          .from('clientes')
          .select('id')
          .eq('telefono', fromNumber)
          .single()

        if (!cliente) {
          const { data: newC } = await supabase
            .from('clientes')
            .insert([{ nombre: 'Cliente WhatsApp', telefono: fromNumber, direccion_default: datos.ubicacion }])
            .select()
          cliente = newC?.[0]
        }

        const numOrden = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`

        // Crear la orden en Supabase
        await supabase.from('ordenes').insert([
          {
            numero: numOrden,
            cliente_id: cliente?.id,
            direccion: datos.ubicacion,
            precio: datos.precio || 300,
            estado: 'PENDIENTE',
            origen_whatsapp: true,
            notas: `Auto: ${datos.vehiculo} - Placa: ${datos.placa}`,
          }
        ])

        const trackingUrl = getTrackingUrl(numOrden)

        respuestaBot =
          `🎉 *¡Tu orden ha sido registrada con éxito!*\n\n` +
          `📋 *Orden N°:* ${numOrden}\n` +
          `🚗 *Vehículo:* ${datos.vehiculo} (${datos.placa})\n` +
          `💦 *Servicio:* ${datos.servicio}\n` +
          `💰 *Total:* L. ${datos.precio}.00\n` +
          `📍 *Lugar:* ${datos.ubicacion}\n\n` +
          `🔍 *Seguimiento en Vivo:*\nPuedes ver el estado de tu lavado en tiempo real aquí:\n${trackingUrl}\n\n` +
          `Un lavador de Wash2Go se pondrá en camino en breve.`
        break

      default:
        nuevoEstado = 'INICIO'
        respuestaBot = 'Escribe *HOLA* para solicitar un lavado a domicilio con Wash2Go 🚗💦'
    }

    // Actualizar estado de sesión en Supabase
    if (sesion) {
      await supabase
        .from('sesiones_whatsapp')
        .update({ estado_flujo: nuevoEstado, datos_flujo: datos, ultimo_mensaje: new Date().toISOString() })
        .eq('whatsapp_id', fromNumber)
    } else {
      await supabase
        .from('sesiones_whatsapp')
        .insert([{ whatsapp_id: fromNumber, estado_flujo: nuevoEstado, datos_flujo: datos }])
    }

    // Aquí se invoca el envío de mensaje real a Meta WhatsApp Cloud API si WHATSAPP_TOKEN está configurado
    if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_TOKEN !== 'PENDIENTE') {
      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: fromNumber,
              type: 'text',
              text: { body: respuestaBot },
            }),
          }
        )
      } catch (waErr) {
        console.warn('WhatsApp API live send error:', waErr)
      }
    }

    return NextResponse.json({ status: 'success', botResponse: respuestaBot })
  } catch (err) {
    console.error('Error in WhatsApp webhook:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
