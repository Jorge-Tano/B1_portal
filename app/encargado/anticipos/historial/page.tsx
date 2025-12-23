'use client'

import { useState } from 'react'
import { HistorialTable } from './components/HistorialTable'
import { AnticiposStats } from './components/AnticiposStats'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'

export default function HistorialPage() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />
      
      <div className={`min-h-screen transition-all duration-400 ease-in-out ${contentPadding}`}>
        {/* Header sticky */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        {/* Contenido principal */}
        <div className="p-8 pt-4"> {/* Reducido pt-20 a pt-4 */}
          <div className="max-w-7xl mx-auto">
            {/* Header de la página */}
            <div className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Historial de Anticipos
                  </h1>   
                </div>
              </div>
              
              <div className="mb-6">
                <AnticiposStats />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <HistorialTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}