import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    let { nombre, usuario, email, telefono, password, rol = 'TRABAJADOR' } = body

    if (!nombre || !password) {
      return NextResponse.json({ error: 'Nombre y contraseña son obligatorios' }, { status: 400 })
    }

    // Si no se proporcionó usuario explícito, generar uno a partir del nombre o email
    if (!usuario || !usuario.trim()) {
      usuario = (email ? email.split('@')[0] : nombre.split(' ')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
    } else {
      usuario = usuario.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    }

    // Email de respaldo si no se ingresó
    const finalEmail = email && email.trim()
      ? email.toLowerCase().trim()
      : `${usuario}@wash2go.com`

    // Verificar si ya existe el usuario o email en Supabase
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id, usuario, email')
      .or(`usuario.eq.${usuario},email.eq.${finalEmail}`)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({
        error: existingUser.usuario === usuario
          ? `El nombre de usuario "${usuario}" ya está en uso.`
          : `El correo "${finalEmail}" ya está registrado.`
      }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        {
          nombre: nombre.trim(),
          usuario,
          email: finalEmail,
          telefono: telefono || null,
          password: hashedPassword,
          rol,
          activo: true,
        }
      ])
      .select('id, nombre, usuario, email, telefono, rol, activo, created_at')
      .single()

    if (error) {
      console.error('Supabase register error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data, message: 'Usuario creado exitosamente' })
  } catch (err) {
    console.error('Error register user:', err)
    return NextResponse.json({ error: 'Error interno del servidor: ' + err.message }, { status: 500 })
  }
}
