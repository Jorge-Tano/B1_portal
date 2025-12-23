'use client'

import { useState } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'

export default function Dashboard() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  const gridItems = [
    { title: "Anticipos", href: "/supervisor/anticipos" },
  ]

  // Funciones temporales para los botones
  const handleDescargarPlantilla = () => {
    alert('Descargando plantilla de Excel... (Función en desarrollo)')
  }

  const handleAprobacion = () => {
    alert('Accediendo a aprobaciones... (Función en desarrollo)')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />

      <div className={`transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="flex-1 p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                  Panel de Control
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Bienvenido de nuevo, aquí puedes gestionar todas tus actividades.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridItems.map((item, index) => (
                <a key={index} href={item.href} className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                        <span className="text-xl">💰</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center">
                      <div>{item.title}</div>
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
                      Gestiona tus anticipos de salario
                    </p>
                  </div>
                </a>
              ))}

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Reportes
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Genera reportes detallados de tus actividades
                  </p>
                  <button className="mt-4 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    Próximamente
                  </button>
                </div>
              </div>

              {/* Tarjeta informativa adicional */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-4">
                    <span className="text-xl">🔔</span>
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                    Notificaciones
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Revisa tus alertas y notificaciones importantes
                  </p>
                  <button className="mt-4 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    Próximamente
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-violet-100 dark:border-violet-800/30">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 rounded-xl bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center p-4">
                      <img src="/gato.png" alt="" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      Dashboard en Desarrollo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Estamos trabajando para implementar todas las funcionalidades del dashboard.
                      Pronto encontrarás aquí gráficos interactivos, estadísticas detalladas
                      y herramientas avanzadas de gestión.
                    </p>
                    
                    {/* Información sobre los botones */}
                    <div className="mt-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                        Nuevas funcionalidades agregadas:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-sm">✅</span>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Panel de aprobaciones
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-full">
                        🚧 En construcción
                      </span>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-full">
                        ⏳ Próximamente
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}