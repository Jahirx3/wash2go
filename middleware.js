import { NextResponse } from 'next/server'

// ============================================================
// RATE LIMITER EN MEMORIA (Anti-DDoS y Anti-Fuerza Bruta)
// ============================================================
const rateLimitMap = new Map()
let lastCleanup = Date.now()

function checkRateLimit(ip, limit, windowMs) {
  const now = Date.now()

  // Lazy cleanup (instead of setInterval which is not supported in Edge Runtime)
  if (now - lastCleanup > 60000) {
    lastCleanup = now
    for (const [key, record] of rateLimitMap.entries()) {
      if (now - record.startTime > 60000) {
        rateLimitMap.delete(key)
      }
    }
  }

  const record = rateLimitMap.get(ip)

  if (!record) {
    rateLimitMap.set(ip, { count: 1, startTime: now })
    return { allowed: true, remaining: limit - 1 }
  }

  if (now - record.startTime > windowMs) {
    rateLimitMap.set(ip, { count: 1, startTime: now })
    return { allowed: true, remaining: limit - 1 }
  }

  record.count += 1
  if (record.count > limit) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: limit - record.count }
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1'

  // 1. Protección Anti-Fuerza Bruta en Login (Máx 5 intentos por minuto por IP)
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const { allowed } = checkRateLimit(`login_${ip}`, 5, 60000)
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Demasiados intentos de inicio de sesión. Bloqueo temporal por seguridad anti-DDoS / fuerza bruta.',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // 2. Protección Anti-DDoS general en APIs (Máx 60 peticiones por minuto por IP)
  if (pathname.startsWith('/api/')) {
    const { allowed, remaining } = checkRateLimit(`api_${ip}`, 60, 60000)
    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Límite de solicitudes excedido. Protección anti-DDoS activada.',
          retryAfter: 30,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '30',
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }
  }

  // 3. Cabeceras de Seguridad Avanzada (OWASP Compliant)
  const response = NextResponse.next()

  // Evitar que la web sea embebida en iframes externos (Anti-Clickjacking)
  response.headers.set('X-Frame-Options', 'DENY')

  // Evitar que el navegador interprete archivos con tipos incorrectos (Anti-MIME Sniffing)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Protección contra Cross-Site Scripting (XSS)
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Control estricto de origen en peticiones salientes
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Políticas de permisos de hardware del navegador
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)')

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/login',
    '/trabajador/:path*',
  ],
}
