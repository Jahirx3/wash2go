import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const identifier = (body.usuario || body.email || '').trim().toLowerCase()
    const password = body.password

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña son requeridos' }, { status: 400 })
    }

    // 1. Cuentas predeterminadas para acceso inmediato por nombre de usuario o correo
    if ((identifier === 'admin' || identifier === 'admin@wash2go.com') && password === 'admin123') {
      const userSafe = {
        id: 'usr-admin-default',
        nombre: 'Administrador Wash2Go',
        usuario: 'admin',
        email: 'admin@wash2go.com',
        telefono: '+504 9999-9999',
        rol: 'ADMIN',
      }
      const token = Buffer.from(JSON.stringify({ id: userSafe.id, rol: userSafe.rol, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64')
      return NextResponse.json({ user: userSafe, token })
    }

    if ((identifier === 'carlos' || identifier === 'carlos@wash2go.com') && password === 'trabajador123') {
      const userSafe = {
        id: 'usr-trabajador-default',
        nombre: 'Carlos Mejía',
        usuario: 'carlos',
        email: 'carlos@wash2go.com',
        telefono: '+504 9911-2233',
        rol: 'TRABAJADOR',
      }
      const token = Buffer.from(JSON.stringify({ id: userSafe.id, rol: userSafe.rol, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64')
      return NextResponse.json({ user: userSafe, token })
    }

    // 2. Buscar usuario en Supabase (por usuario o por email)
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*')
      .or(`usuario.eq.${identifier},email.eq.${identifier}`)
      .eq('activo', true)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario no encontrado o inactivo' }, { status: 401 })
    }

    // Verificar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }

    const { password: _, ...userSafe } = user
    const token = Buffer.from(JSON.stringify({
      id: user.id,
      rol: user.rol,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    })).toString('base64')

    return NextResponse.json({ user: userSafe, token })
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
