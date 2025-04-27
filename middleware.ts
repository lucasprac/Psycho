import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from '@/lib/supabase/database.types'

// Rotas que não requerem autenticação
const publicRoutes = ["/", "/login", "/register", "/forgot-password"]

// Rotas específicas para tipos de usuário
const psychologistRoutes = ["/dashboard"]
const patientRoutes = ["/paciente"]

// In-memory storage for rate limiting
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute in milliseconds
  maxRequests: 100, // limit each IP to 100 requests per windowMs
  // Store structure: { [ip]: { count, resetTime } }
  store: new Map()
}

export async function middleware(request: NextRequest) {
  console.log("Middleware running for path:", request.nextUrl.pathname)
  
  try {
    // cria response e supabase client que usa os cookies
    const response = NextResponse.next()
    const supabase = createMiddlewareClient<Database>({
      req: request,
      res: response,
    })

    // Wait a bit to ensure cookies are properly set
    await new Promise(resolve => setTimeout(resolve, 50))

    const { data: { session }, error } = await supabase.auth.getSession()
    console.log("Session check result:", { 
      hasSession: !!session, 
      error,
      path: request.nextUrl.pathname,
      cookies: request.cookies.getAll().map(c => c.name)
    })

    const pathname = request.nextUrl.pathname

    // Verificar se a rota é para aplicar escalas
    if (pathname === "/dashboard/escalas/aplicar") {
      return NextResponse.next()
    }

    // Skip rate limiting for non-API routes
    if (!pathname.startsWith('/api')) {
      return response
    }
    
    // Get client IP from headers
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'
    
    // Apply rate limiting
    const now = Date.now()
    const clientRecord = rateLimit.store.get(ip) || { count: 0, resetTime: now + rateLimit.windowMs }
    
    // Reset count if the window has expired
    if (clientRecord.resetTime < now) {
      clientRecord.count = 0
      clientRecord.resetTime = now + rateLimit.windowMs
    }
    
    clientRecord.count++
    rateLimit.store.set(ip, clientRecord)
    
    // Set headers
    response.headers.set('X-RateLimit-Limit', rateLimit.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimit.maxRequests - clientRecord.count).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(clientRecord.resetTime / 1000).toString())
    
    // Block if rate limit exceeded
    if (clientRecord.count > rateLimit.maxRequests) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': rateLimit.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(clientRecord.resetTime / 1000).toString()
          }
        }
      )
    }

    // Permitir rotas públicas
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      console.log("Public route, allowing access:", pathname)
      return response
    }

    // Se não houver sessão, redirecionar para login
    if (!session) {
      console.log("No session found, redirecting to login")
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    console.log("Session found, allowing access to:", pathname)

    try {
      // Verificar se o usuário está acessando as rotas corretas com base no tipo
      const isAccessingPsychologistRoutes = psychologistRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      )

      if (isAccessingPsychologistRoutes) {
        // Verificar se o usuário é um psicólogo
        if (session.user.user_metadata.role !== 'psychologist') {
          console.log("Access denied: User is not a psychologist")
          return new NextResponse(
            JSON.stringify({ error: 'Access Denied', message: 'You do not have permission to access this resource' }),
            { status: 403 }
          )
        }
      } else {
        // Verificar se o usuário é um paciente
        if (session.user.user_metadata.role !== 'patient') {
          console.log("Access denied: User is not a patient")
          return new NextResponse(
            JSON.stringify({ error: 'Access Denied', message: 'You do not have permission to access this resource' }),
            { status: 403 }
          )
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error)
      return new NextResponse(
        JSON.stringify({ error: 'Internal Server Error', message: 'An error occurred while checking user role' }),
        { status: 500 }
      )
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow access to public routes
    const { pathname } = request.nextUrl
    if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
      return NextResponse.next()
    }
    // For protected routes, redirect to login
    const url = new URL('/login', request.url)
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}