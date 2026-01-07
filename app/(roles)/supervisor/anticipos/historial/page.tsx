'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { HistorialTable } from './components/HistorialTable'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'
import { SimpleAutoBreadcrumb } from '@/components/ui/SimpleAutoBreadcrumb'

export default function HistorialPage() {
  const { data: session } = useSession()
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const [campanaFilter, setCampanaFilter] = useState<string>('todas') 
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('todos') 
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  
  // CAMBIADO: Estado por defecto ahora es "aprobado" en lugar de "todos"
  const [estadoFilter, setEstadoFilter] = useState<string>('aprobado')
  
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  // Obtener employeeId del encargado
  const employeeId = session?.user?.adUser?.employeeID || 
                     session?.user?.email?.split('@')[0] || ''

  // Obtener nombre del encargado
  const nombreEncargado = session?.user?.name || 'Encargado'

  // Estado para los filtros (se implementará más adelante con roles)
  const [filtrosActivos, setFiltrosActivos] = useState({
    campana: false,
    empleado: false,
    fecha: false,
    estado: false
  })

  // Función para resetear filtros - CAMBIADO: Ahora resetea a "aprobado"
  const resetearFiltros = () => {
    setCampanaFilter('todas')
    setEmpleadoFilter('todos')
    setFechaInicio('')
    setFechaFin('')
    setEstadoFilter('aprobado') // Cambiado de 'todos' a 'aprobado'
  }

  // Calcular si hay filtros activos - CAMBIADO: No considera "aprobado" como filtro activo especial
  const hayFiltrosActivos = () => {
    return campanaFilter !== 'todas' || 
           empleadoFilter !== 'todos' || 
           fechaInicio || 
           fechaFin || 
           (estadoFilter !== 'aprobado' && estadoFilter !== 'todos') // Solo cuenta si no es "aprobado" o "todos"
  }

  // Formatear fecha para input type="date"
  const getFechaHoy = () => {
    return new Date().toISOString().split('T')[0]
  }

  // Obtener fecha hace 30 días
  const getFechaHace30Dias = () => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - 30)
    return fecha.toISOString().split('T')[0]
  }

  // Establecer fecha inicial por defecto (últimos 30 días)
  useEffect(() => {
    if (!fechaInicio) {
      setFechaInicio(getFechaHace30Dias())
    }
    if (!fechaFin) {
      setFechaFin(getFechaHoy())
    }
  }, [])

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    // Los filtros se aplican automáticamente a través del estado
    console.log('Filtros aplicados:', {
      campana: campanaFilter,
      estado: estadoFilter,
      fechaInicio,
      fechaFin,
      empleado: empleadoFilter
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />
      
      <div className={`min-h-screen transition-all duration-400 ease-in-out ${contentPadding}`}>
        {/* Header sticky */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        {/* Contenido principal */}
        <div className="p-8 pt-4">
          <div className="max-w-7xl mx-auto">
            
            {/* Header de la página */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Historial de Anticipos
                  </h1>
                  <SimpleAutoBreadcrumb />
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {nombreEncargado} • Panel de Encargado
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Employee ID badge */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <span className="font-medium">ID:</span> {employeeId || '--'}
                  </div>
                </div>
              </div>
              
              {/* Filtros */}
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      Filtros
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Filtro por Campaña (se implementará con roles) */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="campana" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Campaña:
                        </label>
                        <select
                          id="campana"
                          value={campanaFilter}
                          onChange={(e) => setCampanaFilter(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          disabled // Deshabilitado hasta implementar roles
                        >
                          <option value="todas">Todas las campañas</option>
                          <option value="campana1">Campaña 1</option>
                          <option value="campana2">Campaña 2</option>
                          <option value="campana3">Campaña 3</option>
                        </select>
                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded">
                          Próximamente
                        </span>
                      </div>

                      {/* Filtro por Estado */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="estado" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Estado:
                        </label>
                        <select
                          id="estado"
                          value={estadoFilter}
                          onChange={(e) => setEstadoFilter(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        >
                          {/* CAMBIADO: Orden y valor por defecto */}
                          <option value="aprobado">Aprobado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="rechazado">Rechazado</option>
                        </select>
                      </div>

                      {/* Filtro por Fecha */}
                      <div className="flex items-center gap-2">
                        <label htmlFor="fechaInicio" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Desde:
                        </label>
                        <input
                          type="date"
                          id="fechaInicio"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          max={getFechaHoy()}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <label htmlFor="fechaFin" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Hasta:
                        </label>
                        <input
                          type="date"
                          id="fechaFin"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          max={getFechaHoy()}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center gap-2">
                    {hayFiltrosActivos() && (
                      <button
                        onClick={resetearFiltros}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpiar filtros
                      </button>
                    )}
                    
                    <button 
                      onClick={aplicarFiltros}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Aplicar filtros
                    </button>
                  </div>
                </div>

                {/* Indicador de filtros activos */}
                {hayFiltrosActivos() && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Filtros aplicados: 
                        {campanaFilter !== 'todas' && ` Campaña: ${campanaFilter}`}
                        {estadoFilter !== 'aprobado' && estadoFilter !== 'todos' && ` Estado: ${estadoFilter}`}
                        {estadoFilter === 'todos' && ` Estado: Todos`}
                        {(fechaInicio || fechaFin) && ` Fecha: ${fechaInicio || '...'} a ${fechaFin || '...'}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de historial */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <HistorialTable 
                filtros={{
                  campana: campanaFilter,
                  estado: estadoFilter,
                  fechaInicio,
                  fechaFin,
                  empleado: empleadoFilter
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}