// app/api/upload-foto/route.js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const ordenId = formData.get('ordenId')
    const tipo = formData.get('tipo') // 'antes' | 'despues'

    if (!file || !ordenId || !tipo) {
      return NextResponse.json(
        { error: 'Faltan parámetros: file, ordenId y tipo son obligatorios' },
        { status: 400 }
      )
    }

    // Obtener buffer del archivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determinar extensión y nombre de archivo seguro
    const originalName = file.name || 'foto.jpg'
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `ordenes/${ordenId}_${tipo}_${Date.now()}.${ext}`

    // Subir a Supabase Storage bucket 'fotos-wash2go'
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('fotos-wash2go')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error subiendo foto a Supabase Storage:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabaseAdmin
      .storage
      .from('fotos-wash2go')
      .getPublicUrl(fileName)

    const publicUrl = urlData.publicUrl

    // Actualizar directamente la orden en la base de datos
    const column = tipo === 'antes' ? 'foto_antes_url' : 'foto_despues_url'
    const { error: dbError } = await supabaseAdmin
      .from('ordenes')
      .update({ [column]: publicUrl })
      .eq('id', ordenId)

    if (dbError) {
      console.error('Error actualizando URL en orden:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      tipo,
      ordenId,
    })
  } catch (err) {
    console.error('Error en upload-foto:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
