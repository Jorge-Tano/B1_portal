// app/ejecutivo/anticipos/historial/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { HistorialTable } from './components/HistorialTable'
import { AnticiposStats } from './components/AnticiposStats'
import { NavBar } from '@/components/ui/NavBar'
import { Header } from '@/components/ui/Header'

interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
}

export default function HistorialPage() {
  const { data: session } = useSession();
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  
  const contentPadding = isNavExpanded ? 'pl-64' : 'pl-3';

  // Obtener employeeid del usuario
  useEffect(() => {
    if (session?.user) {
      const possibleEmployeeId = session.user.adUser?.employeeID || session.user.email?.split('@')[0] || '';
      
      if (possibleEmployeeId) {
        setEmployeeId(possibleEmployeeId);
        fetchAnticipos(possibleEmployeeId);
      } else {
        setError('No se pudo identificar al usuario.');
        setLoading(false);
      }
    }
  }, [session]);

  // Cargar anticipos del usuario
  const fetchAnticipos = async (employeeIdParam: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/ejecutivo/api/ej_anticipos?employeeid=${encodeURIComponent(employeeIdParam)}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar historial de anticipos');
      }
      
      const data = await response.json();
      setAnticipos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setAnticipos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar onExpandChange={setIsNavExpanded} />
        
        <div className={`min-h-screen transition-all duration-400 ease-in-out ${contentPadding}`}>
          <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <Header isNavExpanded={isNavExpanded} />
          </div>

          <div className="p-8 pt-20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando historial...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar onExpandChange={setIsNavExpanded} />
      
      <div className={`min-h-screen transition-all duration-400 ease-in-out ${contentPadding}`}>
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <Header isNavExpanded={isNavExpanded} />
        </div>

        <div className="p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Historial de Anticipos
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {employeeId && `Mostrando anticipos para: ${employeeId}`}
                  </p>
                </div>
              </div>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <AnticiposStats anticipos={anticipos} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              {anticipos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No tienes anticipos registrados
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {employeeId 
                      ? 'Todavía no has solicitado ningún anticipo'
                      : 'Esperando identificación del usuario'
                    }
                  </p>
                </div>
              ) : (
                <HistorialTable anticipos={anticipos} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}