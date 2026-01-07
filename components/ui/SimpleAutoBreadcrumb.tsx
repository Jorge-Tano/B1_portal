'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mapeo de nombres para segmentos de URL
const segmentLabels: Record<string, string> = {
  // Módulos principales (sin roles)
  mis_anticipos: 'Mis Anticipos',
  historial: 'Historial',
  solicitar: 'Solicitar Anticipo',
  aprobaciones: 'Aprobaciones',
  reportes: 'Reportes',
  ajustes: 'Ajustes',
  perfil: 'Mi Perfil',
  dashboard: 'Dashboard',
  
  // Transformaciones comunes
  anticipos: 'Anticipos',
  empleados: 'Empleados',
  nuevo: 'Nuevo',
  editar: 'Editar',
  ver: 'Ver',
}

export function SimpleAutoBreadcrumb() {
  const pathname = usePathname()
  
  if (!pathname || pathname === '/') return null
  
  const segments = pathname.split('/').filter(Boolean)
  
  // Si estamos en el dashboard, no mostrar breadcrumb
  if (segments.length === 1 && segments[0] === 'dashboard') return null
  
  // Si no hay segmentos, no mostrar
  if (segments.length === 0) return null
  
  // Lista de roles conocidos
  const knownRoles = ['encargado', 'supervisor', 'administrador', 'empleado']
  
  // Verificar si el primer segmento es un rol
  const firstSegmentIsRole = segments.length > 0 && knownRoles.includes(segments[0])
  
  // Si el primer segmento es un rol, lo omitimos del breadcrumb
  const displaySegments = firstSegmentIsRole ? segments.slice(1) : segments
  
  // Filtrar IDs y parámetros
  const filteredSegments = displaySegments.filter(segment => {
    // Excluir IDs numéricos
    if (/^\d+$/.test(segment)) return false
    // Excluir UUIDs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return false
    // Excluir segmentos de rutas dinámicas como [id]
    if (segment.startsWith('[') && segment.endsWith(']')) return false
    return true
  })
  
  if (filteredSegments.length === 0) return null
  
  return (
    <nav className="mb-4" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        {/* Dashboard como punto de partida */}
        <li>
          <Link 
            href="/dashboard"
            className="hover:text-gray-800 dark:hover:text-gray-300 hover:underline transition-colors"
          >
            Dashboard
          </Link>
        </li>
        
        {/* Navegación de módulos */}
        {filteredSegments.map((segment, index) => {
          // Reconstruir la ruta completa
          const fullSegments = firstSegmentIsRole 
            ? [segments[0], ...filteredSegments.slice(0, index + 1)]
            : filteredSegments.slice(0, index + 1)
          
          const href = '/' + fullSegments.join('/')
          const label = segmentLabels[segment] || 
                       segment.split(/[_-]/)
                         .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                         .join(' ')
          const isLast = index === filteredSegments.length - 1
          
          return (
            <li key={index} className="flex items-center gap-2">
              <span className="text-gray-400 dark:text-gray-500">/</span>
              {isLast ? (
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  {label}
                </span>
              ) : (
                <Link 
                  href={href}
                  className="hover:text-gray-800 dark:hover:text-gray-300 hover:underline transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}