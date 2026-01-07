import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Secret de NextAuth
const secret = process.env.NEXTAUTH_SECRET;

// ============================================
// CONFIGURACIÓN DE ROLES Y RUTAS
// ============================================

type Role = 'admin' | 'ejecutivo' | 'encargado' | 'supervisor';

// Rutas públicas (NO necesitan autenticación)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/unauthorized',
  '/api/auth' 
];

// Mapeo de rutas a roles permitidos
const ROLE_ROUTES: Record<string, Role[]> = {
  // Rutas organizadas por carpetas de roles
  '/admin': ['admin'],
  '/ejecutivo': ['ejecutivo','admin'],
  '/encargado': ['encargado','admin','tesoreria'],
  '/supervisor': ['supervisor','admin'],
};

// Rutas que solo requieren estar autenticado (cualquier rol)
const AUTH_ONLY_ROUTES = [
  '/mis_anticipos',
  '/dashboard'
];

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Verificar si una ruta requiere autenticación
function requiresAuth(pathname: string): boolean {
  // Si es ruta pública → NO necesita auth
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return false;
  }
  
  // Si está configurada en ROLE_ROUTES o AUTH_ONLY_ROUTES → SÍ necesita auth
  return true;
}

// Obtener roles permitidos para una ruta
function getAllowedRoles(pathname: string): Role[] | 'auth-only' | null {
  // Buscar coincidencia exacta o por prefijo
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return roles;
    }
  }
  
  // Verificar si es ruta que solo requiere autenticación
  for (const route of AUTH_ONLY_ROUTES) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return 'auth-only'; // Marcador especial
    }
  }
  
  return null; // Ruta no configurada (dejar pasar por ahora)
}

// ============================================
// MIDDLEWARE PRINCIPAL
// ============================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Verificar si la ruta requiere autenticación
  if (!requiresAuth(pathname)) {
    return NextResponse.next();
  }
  
  // 2. Obtener token de sesión (JWT de NextAuth)
  const token = await getToken({ 
    req: request, 
    secret,
    cookieName: 'next-auth.session-token'
  });
  
  // 3. Si no hay token → redirigir a login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(loginUrl);
  }
  
  // 4. Obtener configuración de roles para esta ruta
  const allowedRoles = getAllowedRoles(pathname);
  
  // Si la ruta no está configurada → permitir acceso (por ahora)
  if (allowedRoles === null) {
    return NextResponse.next();
  }
  
  // 5. Si solo requiere autenticación (no rol específico)
  if (allowedRoles === 'auth-only') {
    return NextResponse.next();
  }
  
  // 6. Obtener rol del usuario DESDE EL TOKEN JWT
  // ¡IMPORTANTE! No usamos BD aquí, solo el token
  const userRole = token.dbUser?.role as string;
  
  // 7. Si el usuario NO tiene rol en el token
  if (!userRole) {
    console.warn(`⚠️ Usuario sin rol: ${token.employeeID || token.id}`);
    
    // Para rutas de API → error 403
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Acceso denegado',
          message: 'Usuario sin rol asignado',
          code: 'NO_ROLE'
        },
        { status: 403 }
      );
    }
    
    // Para páginas web → redirigir a una página de "rol pendiente"
    // O puedes redirigir a /unauthorized
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // 8. Verificar si el rol del usuario está permitido
  const hasAccess = allowedRoles.includes(userRole as Role);
  
  if (!hasAccess) {
    // Para API → 403 Forbidden
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { 
          error: 'Acceso denegado',
          message: `Rol "${userRole}" no tiene acceso a esta ruta`,
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }
    
    // Para páginas web → /unauthorized
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }
  
  // 9. Acceso permitido
  return NextResponse.next();
}

// ============================================
// CONFIGURACIÓN DEL MIDDLEWARE
// ============================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folders
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js)$).*)',
  ],
};