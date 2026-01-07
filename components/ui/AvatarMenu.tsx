'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEnrichedSession } from '@/hooks/use-enriched-session';

export function AvatarMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const { session, status } = useEnrichedSession();
  const enrichedSession = session as EnrichedSession | null;
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/login"
    });
    router.push("/login");
    setIsOpen(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 p-1.5">
        <div className="flex justify-center items-center w-10 h-10 rounded-full bg-gray-200 animate-pulse">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="hidden md:block text-left">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!enrichedSession?.user) {
    return (
      <a
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Iniciar sesión
      </a>
    );
  }

  const user = enrichedSession.user;

  const getInitials = (): string => {
    if (user.dbUser?.name) {
      const names = user.dbUser.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    return 'U';
  };

  const getDisplayName = (): string => {
    if (user.dbUser?.name) return user.dbUser.name;
    if (user.name) return user.name;
    return 'Usuario';
  };

  const getEmployeeID = (): string => {
    return user.employeeID || 
           user.dbUser?.employeeid || 
           user.adUser?.employeeID || 
           'N/A';
  };

  const getActiveDirectoryUsername = (): string => {
    return user.adUser?.sAMAccountName || 
           user.email?.split('@')[0] || 
           'N/A';
  };

  const getRole = (): string | null => {
    return user.dbUser?.role || null;
  };

  const getRoleColor = (): string => {
    const role = getRole();
    switch (role?.toLowerCase()) {
      case 'administrador':
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50';
      case 'supervisor':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50';
      case 'aprobador':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50';
      case 'revisor':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800/40 dark:text-gray-300 border border-gray-200/50 dark:border-gray-700/50';
    }
  };

  const formatRole = (role: string | null): string => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const userInfo = {
    name: getDisplayName(),
    initials: getInitials(),
    employeeID: getEmployeeID(),
    adUsername: getActiveDirectoryUsername(),
    role: getRole(),
    formattedRole: formatRole(getRole())
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="flex justify-center items-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/90 to-indigo-600/90 shadow-sm backdrop-blur-sm ring-1 ring-white/20 dark:ring-gray-800/50">
          <span className="text-white font-semibold text-base">{userInfo.initials}</span>
        </div>

        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate max-w-[140px]">
            {userInfo.name}
          </p>
          {userInfo.formattedRole && (
            <p className="text-xs text-gray-600/90 dark:text-gray-400/90 truncate max-w-[140px]">
              {userInfo.formattedRole}
            </p>
          )}
        </div>

        <svg
          className={`hidden md:block w-4 h-4 text-gray-500/90 dark:text-gray-400/90 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`absolute top-full right-0 mt-2 transition-all duration-200 origin-top-right z-50 ${
        isOpen
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      }`}>
        <div className="relative">
          {/* Flecha decorativa con efecto vidrio */}
          <div className="absolute -top-2 right-3 w-4 h-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rotate-45 border-l border-t border-white/30 dark:border-gray-700/30" />

          {/* Contenedor principal del menú con efecto vidrio */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl shadow-2xl shadow-black/10 dark:shadow-black/20 border border-white/20 dark:border-gray-700/30 w-80 overflow-hidden">
            {/* Encabezado con información del usuario */}
            <div className="p-5 border-b border-white/20 dark:border-gray-700/30 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-gray-800/60 dark:to-gray-800/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex justify-center items-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-sm ring-3 ring-white/40 dark:ring-gray-800/50 shadow-lg">
                  <span className="text-white font-bold text-xl">{userInfo.initials}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white truncate mb-1">
                    {userInfo.name}
                  </h3>
                  {userInfo.formattedRole && (
                    <div className="mb-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm ${getRoleColor()}`}>
                        {userInfo.formattedRole}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de identificación con transparencia */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-blue-100/60 dark:bg-blue-900/30 backdrop-blur-sm rounded text-blue-600 dark:text-blue-400">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <span className="text-gray-700/90 dark:text-gray-300/90 font-semibold">Cedula:</span>
                  <span className="text-gray-900 dark:text-gray-100 bg-white/30 dark:bg-gray-800/30 px-2 py-0.5 rounded">
                    {userInfo.employeeID}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-indigo-100/60 dark:bg-indigo-900/30 backdrop-blur-sm rounded text-indigo-600 dark:text-indigo-400">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700/90 dark:text-gray-300/90 font-semibold">Usuario:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-mono text-xs bg-white/30 dark:bg-gray-800/30 px-2 py-0.5 rounded backdrop-blur-sm">
                    {userInfo.adUsername}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de cerrar sesión con efecto vidrio */}
            <div className="p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <button
                onClick={handleSignOut}
                className="group flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-red-700 dark:text-red-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md border border-red-200/50 dark:border-red-800/30 hover:border-red-300 dark:hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-white/50 dark:focus:ring-offset-gray-800/50"
              >
                <svg 
                  className="w-4 h-4 mr-2 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.8} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
                <span className="group-hover:tracking-wide transition-all duration-300">
                  Cerrar sesión
                </span>
                <svg 
                  className="w-4 h-4 ml-2 text-red-500/60 dark:text-red-400/60 group-hover:translate-x-1 transition-transform duration-300 opacity-0 group-hover:opacity-100" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M14 5l7 7m0 0l-7 7m7-7H3" 
                  />
                </svg>
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}