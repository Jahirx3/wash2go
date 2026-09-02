-- ================================================
-- WASH2GO - Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- USUARIOS DEL SISTEMA
-- ================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  usuario TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  telefono TEXT,
  password TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'TRABAJADOR' CHECK (rol IN ('ADMIN','SUPERVISOR','TRABAJADOR')),
  activo BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- CLIENTES
-- ================================================
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  telefono TEXT UNIQUE NOT NULL,
  whatsapp_id TEXT UNIQUE,
  email TEXT,
  direccion_default TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- VEHICULOS
-- ================================================
CREATE TABLE IF NOT EXISTS vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  color TEXT NOT NULL,
  placa TEXT UNIQUE NOT NULL,
  tipo TEXT DEFAULT 'SEDAN' CHECK (tipo IN ('SEDAN','SUV','PICKUP','VAN','MOTO','CAMION','OTRO')),
  foto_url TEXT,
  notas TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SERVICIOS (catálogo)
-- ================================================
CREATE TABLE IF NOT EXISTS servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL,
  duracion_min INTEGER DEFAULT 60,
  activo BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#0ea5e9',
  icono TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- ORDENES DE LAVADO
-- ================================================
CREATE TABLE IF NOT EXISTS ordenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero TEXT UNIQUE NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
  servicio_id UUID NOT NULL REFERENCES servicios(id),
  trabajador_id UUID REFERENCES usuarios(id),

  estado TEXT DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN_CAMINO','LAVANDO','FINALIZADO','CANCELADO')),

  -- Ubicacion
  direccion TEXT NOT NULL,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  referencia TEXT,

  -- Economico
  precio NUMERIC(10,2) NOT NULL,
  descuento NUMERIC(10,2) DEFAULT 0,
  propina NUMERIC(10,2) DEFAULT 0,
  total_cobrado NUMERIC(10,2) DEFAULT 0,
  forma_pago TEXT DEFAULT 'EFECTIVO' CHECK (forma_pago IN ('EFECTIVO','TRANSFERENCIA','TARJETA')),

  -- Programacion
  fecha_programada DATE,
  hora_programada TEXT,

  -- Fotos
  foto_antes_url TEXT,
  foto_despues_url TEXT,

  -- Calificacion
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  nota_calificacion TEXT,

  -- Timestamps de estados
  iniciado_camino_at TIMESTAMPTZ,
  iniciado_lavado_at TIMESTAMPTZ,
  finalizado_at TIMESTAMPTZ,
  cancelado_at TIMESTAMPTZ,
  motivo_cancelacion TEXT,

  -- WhatsApp
  origen_whatsapp BOOLEAN DEFAULT FALSE,

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- INVENTARIO
-- ================================================
CREATE TABLE IF NOT EXISTS inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto TEXT NOT NULL,
  descripcion TEXT,
  cantidad NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidad TEXT DEFAULT 'unidad',
  costo_unitario NUMERIC(10,2) DEFAULT 0,
  stock_minimo NUMERIC(10,2) DEFAULT 5,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- MOVIMIENTOS DE INVENTARIO
-- ================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES inventario(id),
  orden_id UUID REFERENCES ordenes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA','SALIDA')),
  cantidad NUMERIC(10,2) NOT NULL,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- GASTOS
-- ================================================
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL CHECK (tipo IN ('PRODUCTO','COMBUSTIBLE','SALARIO','MANTENIMIENTO','OTRO')),
  descripcion TEXT NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  registrado_por UUID REFERENCES usuarios(id),
  comprobante_url TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- NOTIFICACIONES
-- ================================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- SESIONES WHATSAPP (para el bot)
-- ================================================
CREATE TABLE IF NOT EXISTS sesiones_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID UNIQUE REFERENCES clientes(id),
  whatsapp_id TEXT UNIQUE NOT NULL,
  estado_flujo TEXT DEFAULT 'INICIO',
  datos_flujo JSONB,
  ultimo_mensaje TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- FUNCION: Auto-numero de orden (ORD-2026-001)
-- ================================================
CREATE OR REPLACE FUNCTION generar_numero_orden()
RETURNS TEXT AS $$
DECLARE
  anio TEXT := TO_CHAR(NOW(), 'YYYY');
  contador INTEGER;
  numero TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO contador FROM ordenes WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  numero := 'ORD-' || anio || '-' || LPAD(contador::TEXT, 4, '0');
  RETURN numero;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- FUNCION: updated_at automático
-- ================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER vehiculos_updated_at BEFORE UPDATE ON vehiculos FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER servicios_updated_at BEFORE UPDATE ON servicios FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER ordenes_updated_at BEFORE UPDATE ON ordenes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER inventario_updated_at BEFORE UPDATE ON inventario FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================
-- USUARIO ADMIN INICIAL
-- password: admin123 (bcrypt hash)
-- ================================================
INSERT INTO usuarios (nombre, usuario, email, telefono, password, rol)
VALUES (
  'Administrador',
  'admin',
  'admin@wash2go.com',
  '+50499999999',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/ohmkDuHGG',
  'ADMIN'
) ON CONFLICT (email) DO UPDATE SET usuario = 'admin';

-- ================================================
-- DESHABILITAR RLS (para desarrollo local simple)
-- Habilitar en produccion con politicas apropiadas
-- ================================================
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario DISABLE ROW LEVEL SECURITY;
ALTER TABLE gastos DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones_whatsapp DISABLE ROW LEVEL SECURITY;

-- ================================================
-- VERIFICAR
-- ================================================
SELECT 'Tablas creadas exitosamente!' as resultado;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
