// Configuración centralizada de nombres de rutas
export const routeLabels: Record<string, string> = {
    // Rutas principales
    '': 'Inicio',
    encargado: 'Encargado',
    admin: 'Administrador',
    empleado: 'Empleado',

    // Subrutas de encargado
    'dashboard': 'Dashboard',
    'mis_anticipos': 'Solicitar Anticipo',
    'encargado/anticipos': 'Aprobación'
    'encargado/anticipos/historial': 'Historial',
    'supervisor/anticipos': 'Aprobación'
    'supervisor/anticipos/historial': 'Historial',
    'encargado/empleados': 'Empleados',
    'encargado/reportes': 'Reportes',
    'encargado/ajustes': 'Ajustes',

    // Subrutas de admin
    'admin/usuarios': 'Usuarios',
    'admin/configuracion': 'Configuración',

    // Agrega todas tus rutas aquí
}

// Rutas a excluir del breadcrumb
export const excludedRoutes = ['app', 'components', 'api', 'lib', '_next']

// Función para generar breadcrumb items
export function generateBreadcrumbs(pathname: string) {
    const segments = pathname.split('/').filter(segment =>
        segment && !excludedRoutes.includes(segment)
    )

    const breadcrumbs = []

    // Agrega inicio si no es la página principal
    if (segments.length > 0) {
        breadcrumbs.push({
            href: '/',
            label: 'Inicio'
        })
    }

    // Construye el camino
    let currentPath = ''
    for (let i = 0; i < segments.length; i++) {
        currentPath += '/' + segments[i]

        // Busca etiqueta específica o genera una genérica
        const routeKey = segments.slice(0, i + 1).join('/')
        const label = routeLabels[routeKey] ||
            segments[i].charAt(0).toUpperCase() +
            segments[i].slice(1).replace(/-/g, ' ')

        breadcrumbs.push({
            href: i === segments.length - 1 ? undefined : currentPath,
            label,
            active: i === segments.length - 1
        })
    }

    return breadcrumbs
}