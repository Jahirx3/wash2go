// app/api/usuarios/[id]/route.js
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario no proporcionado' }, { status: 400 })
    }

    const body = await request.json()
    const { nombre, usuario, email, telefono, rol, activo, password } = body

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre completo es obligatorio' }, { status: 400 })
    }

    const cleanUsuario = (usuario || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!cleanUsuario) {
      return NextResponse.json({ error: 'El nombre de usuario es obligatorio y debe ser alfanumérico' }, { status: 400 })
    }

    const cleanEmail = (email || '').trim().toLowerCase()
    if (!cleanEmail) {
      return NextResponse.json({ error: 'El correo electrónico es obligatorio' }, { status: 400 })
    }

    // Verificar si otro usuario ya tiene ese username o email
    const { data: duplicate } = await supabaseAdmin
      .from('usuarios')
      .select('id, usuario, email')
      .neq('id', id)
      .or(`usuario.eq.${cleanUsuario},email.eq.${cleanEmail}`)
      .maybeSingle()

    if (duplicate) {
      return NextResponse.json({
        error: duplicate.usuario === cleanUsuario
          ? `El nombre de usuario "@${cleanUsuario}" ya está registrado por otra cuenta.`
          : `El correo "${cleanEmail}" ya está registrado por otra cuenta.`
      }, { status: 400 })
    }

    const updateData = {
      nombre: nombre.trim(),
      usuario: cleanUsuario,
      email: cleanEmail,
      telefono: telefono ? telefono.trim() : null,
      rol: rol || 'TRABAJADOR',
      activo: activo !== undefined ? Boolean(activo) : true,
      updated_at: new Date().toISOString(),
    }

    // Si se especificó una nueva contraseña, encriptarla con bcrypt
    if (password && password.trim().length > 0) {
      if (password.trim().length < 4) {
        return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password.trim(), 10)
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select('id, nombre, usuario, email, telefono, rol, activo, created_at, updated_at')
      .single()

    if (updateError) {
      console.error('Error actualizando usuario en Supabase:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Usuario actualizado correctamente'
    })
  } catch (err) {
    console.error('Error en PUT /api/usuarios/[id]:', err)
    return NextResponse.json({ error: 'Error del servidor: ' + err.message }, { status: 500 })
  }
}
