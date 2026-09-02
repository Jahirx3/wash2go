'use client'
import { useState } from 'react'
import { MessageSquare, Send, Phone, MapPin, RefreshCw, Smartphone, Bot, User } from 'lucide-react'
import { getTrackingUrl } from '@/lib/utils'

export default function WhatsAppSimulatorPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: '¡Hola! 🚗💦 Bienvenido a *Wash2Go* — "Lo Pides, Llegamos" en Comayagua.\n\n¿Qué tipo de lavado deseas para tu vehículo hoy?\n1️⃣ *Lavado Básico Exterior* (L. 150)\n2️⃣ *Lavado Completo Interior + Exterior* (L. 300)\n3️⃣ *Lavado Premium con Encerado* (L. 500)\n\nResponde con el número de tu opción (1, 2 o 3).',
      time: '10:00 AM',
    }
  ])
  const [inputText, setInputText] = useState('')
  const [flowState, setFlowState] = useState('ESPERANDO_SERVICIO')
  const [orderDraft, setOrderDraft] = useState({})

  const handleSend = (e) => {
    e?.preventDefault()
    if (!inputText.trim()) return

    const userMsg = {
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    const text = inputText.trim()
    setInputText('')

    // Simulación del Bot
    setTimeout(() => {
      let botReply = ''
      let nextState = flowState

      if (flowState === 'ESPERANDO_SERVICIO') {
        const serv = text.includes('1') ? 'Lavado Básico (L. 150)' : text.includes('3') ? 'Lavado Premium (L. 500)' : 'Lavado Completo (L. 300)'
        setOrderDraft(prev => ({ ...prev, servicio: serv }))
        nextState = 'ESPERANDO_PLACA'
        botReply = `Excelente elección: *${serv}*.\n\nPor favor, indícanos el *número de placa o matrícula* de tu auto.\nEjemplo: _HAB-1234_`
      } else if (flowState === 'ESPERANDO_PLACA') {
        setOrderDraft(prev => ({ ...prev, placa: text.toUpperCase() }))
        nextState = 'ESPERANDO_CARACTERISTICAS'
        botReply = `Placa anotada: *${text.toUpperCase()}*.\n\n¿Cuáles son las *características de tu vehículo*? (Marca, Modelo, Color, etc.)\nEjemplo: _Toyota Hilux blanca de paila_`
      } else if (flowState === 'ESPERANDO_CARACTERISTICAS') {
        setOrderDraft(prev => ({ ...prev, vehiculo: text }))
        nextState = 'ESPERANDO_UBICACION'
        botReply = `Perfecto: *${text}*.\n\n📍 Por último, envíanos tu *Ubicación GPS* o escribe tu *Dirección exacta en Comayagua* para que nuestro lavador llegue hasta donde estás.`
      } else if (flowState === 'ESPERANDO_UBICACION') {
        setOrderDraft(prev => ({ ...prev, direccion: text }))
        nextState = 'FINALIZADO'
        const link = getTrackingUrl('ORD-2026-8891')
        botReply = `🎉 *¡Tu orden ha sido registrada con éxito!*\n\n📋 *Orden N°:* ORD-2026-8891\n🚗 *Vehículo:* ${orderDraft.vehiculo || 'Auto'} (${orderDraft.placa || 'HAB-1234'})\n💦 *Servicio:* ${orderDraft.servicio || 'Lavado'}\n📍 *Lugar:* ${text}\n\n🔍 *Link de Seguimiento en Vivo:*\n${link}\n\nUn lavador de Wash2Go se pondrá en camino en breve.`
      } else {
        nextState = 'ESPERANDO_SERVICIO'
        botReply = '¡Hola de nuevo! Escribe *1*, *2* o *3* para solicitar un nuevo lavado.'
      }

      setFlowState(nextState)
      setMessages([...newMessages, {
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    }, 600)
  }

  const handleEnviarUbicacionDemo = () => {
    setInputText('Barrio Arriba, 4ta calle frente al parque de Comayagua')
  }

  const resetChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: '¡Hola! 🚗💦 Bienvenido a *Wash2Go* — "Lo Pides, Llegamos" en Comayagua.\n\n¿Qué tipo de lavado deseas para tu vehículo hoy?\n1️⃣ *Lavado Básico Exterior* (L. 150)\n2️⃣ *Lavado Completo Interior + Exterior* (L. 300)\n3️⃣ *Lavado Premium con Encerado* (L. 500)\n\nResponde con el número de tu opción (1, 2 o 3).',
        time: '10:00 AM',
      }
    ])
    setFlowState('ESPERANDO_SERVICIO')
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Simulador del Bot de WhatsApp Business</h1>
          <p className="page-subtitle">Prueba la experiencia de pedido del cliente tal como funciona en WhatsApp</p>
        </div>

        <button onClick={resetChat} className="btn-secondary !py-2 text-xs">
          <RefreshCw size={14} /> Reiniciar Conversación
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mockup del Teléfono */}
        <div className="lg:col-span-2 flex justify-center">
          <div className="w-full max-w-md bg-[#e5ddd5] rounded-[36px] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col h-[640px] relative">
            {/* WhatsApp Header */}
            <div className="bg-[#075e54] text-white p-3 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white p-0.5 overflow-hidden">
                  <img src="/logo.png" alt="Wash2Go" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold leading-tight">Wash2Go Comayagua</h4>
                  <span className="text-[10px] text-emerald-200">En línea · Cuenta de Empresa Oficial</span>
                </div>
              </div>
              <Phone size={18} className="text-white/80" />
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5]/90">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm relative leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                    <span className="text-[9px] text-slate-400 block text-right mt-1">
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones rápidos de ayuda */}
            <div className="bg-slate-100 p-2 flex gap-1.5 overflow-x-auto border-t border-slate-200">
              <button
                onClick={() => { setInputText('2'); }}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-semibold border border-slate-300 shrink-0"
              >
                Opción 2
              </button>
              <button
                onClick={() => { setInputText('HAB-9988'); }}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-semibold border border-slate-300 shrink-0"
              >
                Placa HAB-9988
              </button>
              <button
                onClick={() => { setInputText('Toyota Hilux blanca 2022'); }}
                className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-semibold border border-slate-300 shrink-0"
              >
                Toyota Hilux blanca
              </button>
              <button
                onClick={handleEnviarUbicacionDemo}
                className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-full text-[11px] font-semibold border border-sky-300 shrink-0 flex items-center gap-1"
              >
                <MapPin size={11} /> Ubicación
              </button>
            </div>

            {/* WhatsApp Input */}
            <form onSubmit={handleSend} className="bg-slate-100 p-2 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje aquí..."
                className="flex-1 bg-white rounded-full px-4 py-2.5 text-xs text-slate-800 outline-none border border-slate-200 shadow-inner"
              />
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-[#128c7e] text-white flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* Panel Explicativo */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Bot size={18} className="text-emerald-600" />
              Lógica del Bot de WhatsApp
            </h3>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-800 block mb-0.5">1. Detección Inteligente</span>
                El bot reconoce saludos, servicios elegidos y datos sin intervención humana.
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
                <span className="font-bold text-sky-800 block mb-0.5">2. Registro de Placa y Auto</span>
                Pide la matrícula y descripción para que el lavador identifique el carro exacto.
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="font-bold text-purple-800 block mb-0.5">3. Ubicación GPS o Dirección</span>
                Acepta ubicaciones nativas de WhatsApp o direcciones escritas en Comayagua.
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="font-bold text-amber-800 block mb-0.5">4. Creación Automática de Orden</span>
                Al completar los pasos, se inserta la orden en Supabase y notifica al panel del administrador.
              </div>
            </div>
          </div>

          <div className="glass-card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Credenciales Meta WhatsApp Business
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cuando tengas tus credenciales de Meta for Developers (Token, Phone Number ID), solo colócalas en tu archivo <code className="bg-slate-700 px-1 py-0.5 rounded text-sky-300">.env.local</code> y el sistema conectará los chats reales sin cambiar código.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
