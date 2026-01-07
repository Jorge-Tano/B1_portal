'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const user = session?.user;
  const userRole = user?.dbUser?.role;
  const userName = user?.name || user?.employeeID || 'Usuario';

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 p-3 rounded-full">
              <svg 
                className="w-10 h-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center">Acceso Restringido</h1>
          <p className="text-center text-red-100 mt-2">
            No tienes permisos para acceder a esta sección
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{userName}</p>
                <div className="flex items-center mt-1">
                  {userRole ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span className="text-sm text-gray-600">
                        Rol: <span className="font-semibold">{userRole}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                      <span className="text-sm text-yellow-600 font-medium">
                        Sin rol asignado
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {!userRole && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ Contacta al administrador para que te asigne un rol en el sistema.
                </p>
              </div>
            )}
          </div>

          <div className="text-center mb-8">
            <p className="text-gray-700 mb-4">
              Tu rol actual <strong>{userRole ? `"${userRole}"` : "no está definido"}</strong> no tiene 
              permisos suficientes para acceder a esta página.
            </p>
            <p className="text-gray-600 text-sm">
              Si crees que esto es un error, contacta al equipo de soporte.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-center shadow-md hover:shadow-lg"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Volver al Dashboard
              </div>
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center shadow-sm hover:shadow"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Ir al Inicio
              </div>
            </Link>

            <button
              onClick={handleGoBack}
              className="w-full py-3 px-4 text-gray-600 hover:text-gray-800 font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 text-center"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Volver a la página anterior
              </div>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              ¿Necesitas ayuda? 
              <a 
                href="mailto:soporte@empresa.com" 
                className="text-blue-600 hover:text-blue-800 font-medium ml-1"
              >
                Contactar soporte
              </a>
            </p>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-center text-gray-400 text-xs">
            Sistema de gestión • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}