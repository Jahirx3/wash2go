import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de Wash2Go...')

  // =============================================
  // CREAR USUARIO ADMIN
  // =============================================
  const adminPassword = await bcrypt.hash('admin123', 12)
  
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@wash2go.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@wash2go.com',
      telefono: '+50499999999',
      password: adminPassword,
      rol: 'ADMIN',
    },
  })
  console.log('✅ Admin creado:', admin.email)

  // Usuario trabajador de ejemplo
  const trabajadorPassword = await bcrypt.hash('trabajador123', 12)
  const trabajador = await prisma.usuario.upsert({
    where: { email: 'carlos@wash2go.com' },
    update: {},
    create: {
      nombre: 'Carlos Mejía',
      email: 'carlos@wash2go.com',
      telefono: '+50498765432',
      password: trabajadorPassword,
      rol: 'TRABAJADOR',
    },
  })
  console.log('✅ Trabajador creado:', trabajador.email)

  // =============================================
  // CREAR SERVICIOS DE EJEMPLO
  // (El admin puede agregar/editar los reales después)
  // =============================================
  const servicios = [
    {
      nombre: 'Lavado Básico',
      descripcion: 'Lavado exterior completo con jabón y secado',
      precio: 150,
      duracion_min: 30,
      color: '#0ea5e9',
    },
    {
      nombre: 'Lavado Completo',
      descripcion: 'Lavado exterior e interior, aspirado, aromas',
      precio: 300,
      duracion_min: 60,
      color: '#0037b0',
    },
    {
      nombre: 'Lavado Premium',
      descripcion: 'Lavado completo + encerrado + limpieza de motor',
      precio: 500,
      duracion_min: 90,
      color: '#6366f1',
    },
    {
      nombre: 'Lavado de Motor',
      descripcion: 'Limpieza profunda del compartimento del motor',
      precio: 200,
      duracion_min: 45,
      color: '#f59e0b',
    },
    {
      nombre: 'Lavado de Alfombras',
      descripcion: 'Extracción de suciedad profunda en alfombras',
      precio: 250,
      duracion_min: 45,
      color: '#10b981',
    },
  ]

  for (const servicio of servicios) {
    await prisma.servicio.upsert({
      where: { nombre: servicio.nombre },
      update: {},
      create: servicio,
    })
  }
  console.log('✅ Servicios creados:', servicios.length)

  // =============================================
  // CLIENTE DE EJEMPLO
  // =============================================
  const cliente = await prisma.cliente.upsert({
    where: { telefono: '+50499991234' },
    update: {},
    create: {
      nombre: 'Juan Pérez',
      telefono: '+50499991234',
      email: 'juan@ejemplo.com',
      direccion_default: 'Col. El Picacho, Comayagua',
    },
  })
  console.log('✅ Cliente de ejemplo creado')

  // Vehículo del cliente de ejemplo
  await prisma.vehiculo.upsert({
    where: { placa: 'ABC-1234' },
    update: {},
    create: {
      cliente_id: cliente.id,
      marca: 'Toyota',
      modelo: 'Hilux',
      anio: 2022,
      color: 'Blanco',
      placa: 'ABC-1234',
      tipo: 'PICKUP',
    },
  })
  console.log('✅ Vehículo de ejemplo creado')

  // =============================================
  // INVENTARIO DE EJEMPLO
  // =============================================
  const inventarioItems = [
    { producto: 'Shampoo para vehículos', unidad: 'litro', cantidad: 20, costo_unitario: 80, stock_minimo: 5 },
    { producto: 'Cera en pasta', unidad: 'unidad', cantidad: 10, costo_unitario: 150, stock_minimo: 2 },
    { producto: 'Microfibras', unidad: 'unidad', cantidad: 30, costo_unitario: 50, stock_minimo: 10 },
    { producto: 'Desengrasante', unidad: 'litro', cantidad: 15, costo_unitario: 120, stock_minimo: 3 },
    { producto: 'Aromatizante', unidad: 'unidad', cantidad: 24, costo_unitario: 40, stock_minimo: 5 },
    { producto: 'Agua (galones)', unidad: 'galón', cantidad: 100, costo_unitario: 5, stock_minimo: 20 },
  ]

  for (const item of inventarioItems) {
    await prisma.inventario.create({ data: item }).catch(() => {})
  }
  console.log('✅ Inventario inicial creado')

  console.log('\n🎉 Seed completado exitosamente!')
  console.log('\n📋 Credenciales de acceso:')
  console.log('   Admin:      admin@wash2go.com / admin123')
  console.log('   Trabajador: carlos@wash2go.com / trabajador123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
