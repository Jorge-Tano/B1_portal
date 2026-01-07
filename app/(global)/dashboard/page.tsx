'use client'

import { useState } from 'react'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'
import { useHideRole } from '@/hooks/useHideRole';

function MoneyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 0 1-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004ZM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 0 1-.921.42Z" />
      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.816a3.836 3.836 0 0 0-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 0 1-.921-.421l-.879-.66a.75.75 0 0 0-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 0 0 1.5 0v-.81a4.124 4.124 0 0 0 1.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 0 0-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 0 0 .933-1.175l-.415-.33a3.836 3.836 0 0 0-1.719-.755V6Z" clipRule="evenodd" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z" />
      <path fillRule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clipRule="evenodd" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
    </svg>
  )
}

export default function Dashboard() {
  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3'
  const {
    shouldHide,
    isAdmin,
    isEjecutivo,
    isEncargado,
    isTesoreria,
    isSupervisor,
    isTeamLeader,
    isAdminOrTesoreria,
    isAdminOrEjecutivo,
    isAdminOrEncargado,
    isAdminOrSupervisor,
    isAdminOrTeamLeader,
    isEncargadoOrTesoreria,
    isSupervisorOrTeamLeader,
    isAdminOrTesoreriaOrTeamLeader,
  } = useHideRole();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!shouldHide(['tesoreria', 'supervisor']) && (
        <NavBar onExpandChange={setIsNavExpanded} />
      )}
      

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

              {!shouldHide(['tesoreria', 'supervisor']) && (
                <a href="/mis_anticipos" className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                        <span className="text-blue-600 dark:text-blue-400">
                          <MoneyIcon />
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center">
                      Anticipos
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
                      Gestiona tus anticipos de salario
                    </p>
                  </div>
                </a>
              )}

              {isAdmin && (
                <a href="/admin" className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300">
                    <div className="flex justify-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                        <span className="text-blue-600 dark:text-blue-400">
                          <ChartIcon />
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-center">
                      Configuración
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-2">
                      Administra los anticipos de los usuarios
                    </p>
                  </div>
                </a>
              )}

              {isAdminOrEncargado && (
                <a href="/encargado/anticipos" className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                        <span className="text-green-600 dark:text-green-400">
                          <CheckIcon />
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        Aprobar anticipos 
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Aprueba los anticipos de los ejecutivos
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {isAdminOrTesoreria && (
                <a href="/encargado/anticipos" className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                        <span className="text-green-600 dark:text-green-400">
                          <ChartIcon />
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        Informe
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Descarga el informe de los anticipos aprobados
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {isAdminOrSupervisor && (
                <a href="/supervisor/anticipos" className="group">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-800/30 transition-colors">
                        <span className="text-green-600 dark:text-green-400">
                          <CheckIcon />
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        Aprobar anticipos
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Aprueba los anticipos de los ejecutivos
                      </p>
                    </div>
                  </div>
                </a>
              )}

              <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-violet-100 dark:border-violet-800/30">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-40 h-40 rounded-xl bg-gradient-to-r from-gray-200 to-gray-100 dark:from-gray-100/40 dark:to-gray-100/40 flex items-center justify-center p-4">
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
                            <MoneyIcon />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Administración de anticipos
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckIcon />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            Aprobación de solicitudes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-4">
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V6z" clipRule="evenodd" />
                        </svg>
                        En construcción
                      </span>
                      <span className="px-3 py-1 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0V6z" clipRule="evenodd" />
                        </svg>
                        Próximamente
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