'use client'

import { useState } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'

export default function Dashboard() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* NavBar con callback */}
      <NavBar onExpandChange={setIsNavExpanded} />

      {/* TODO el contenido que se mueve */}
      <div className={`transition-all duration-400 ease-in-out ${isNavExpanded ? 'pl-64' : 'pl-3'
        }`}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        {/* Contenido principal del dashboard */}
        <div className="flex-1 p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            {/* Encabezado */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                Panel de Control
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Bienvenido de nuevo, aquí puedes gestionar todas tus actividades.
              </p>
            </div>

            {/* Grid de contenido */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a href="/anticipos">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Anticipos</h3>
                  </div>
                </div>
              </a>

              <a href="/#">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Estadísticas</h3>
                  </div>
                </div>
              </a>

              <a href="/#">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-center mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notificaciones</h3>
                  </div>
                </div>
              </a>


              {/* Tarjeta 4 - más ancha */}
              <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-violet-100 dark:border-violet-800/30">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-30 h-30 rounded-xl bg-gradient-to-r flex items-center justify-center">
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