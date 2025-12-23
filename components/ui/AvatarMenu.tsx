'use client';

import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function UserAvatarMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

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
    )
  }

  if (!session) {
    return (
      <a
        href="/login"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Iniciar sesión
      </a>
    )
  }

  const getEmployeeId = (): string | null => {
    const adUser = session.user?.adUser;
    if (adUser?.employeeID && adUser.employeeID.trim() !== '') {
      return adUser.employeeID.trim();
    }

    if (adUser?.employeeNumber && adUser.employeeNumber.trim() !== '') {
      return adUser.employeeNumber.trim();
    }

    return null;
  };

  const getInitials = (): string => {
    const adUser = session.user?.adUser;

    if (adUser?.displayName) {
      const names = adUser.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    if (session.user?.name) {
      const names = session.user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    if (session.user?.email) {
      return session.user.email.charAt(0).toUpperCase();
    }

    return 'U';
  };

  const getDisplayName = (): string => {
    const adUser = session.user?.adUser;

    if (adUser?.displayName) {
      return adUser.displayName;
    }

    if (session.user?.name) {
      return session.user.name;
    }

    if (adUser?.sAMAccountName) {
      return adUser.sAMAccountName;
    }

    return 'Usuario';
  };

  const getUserInfo = (): string => {
    const employeeId = getEmployeeId();

    if (employeeId) {
      return `ID: ${employeeId}`;
    }

    const adUser = session.user?.adUser;
    if (adUser?.sAMAccountName) {
      return adUser.sAMAccountName;
    }

    if (adUser?.title) {
      return adUser.title;
    }

    return 'Usuario';
  };

  const getEmail = (): string => {
    const adUser = session.user?.adUser;

    if (adUser?.mail) {
      return adUser.mail;
    }

    if (session.user?.email) {
      return session.user.email;
    }

    return 'usuario@2cal1.c1';
  };

  const getDepartment = (): string | null => {
    const adUser = session.user?.adUser;
    return adUser?.department || null;
  };

  const getTitle = (): string | null => {
    const adUser = session.user?.adUser;
    return adUser?.title || null;
  };

  // NUEVO: Obtener estructura de OU
  const getOUStructure = () => {
    const adUser = session.user?.adUser;
    
    if (adUser?.ouStructure) {
      return adUser.ouStructure;
    }
    
    // Si no hay estructura específica, crear una básica
    const userAllOUs = session.user?.allOUs || [];
    
    return {
      colombia: userAllOUs.find(ou => ou.toLowerCase() === 'colombia'),
      ti: userAllOUs.find(ou => ou.toLowerCase() === 'ti'),
      platform: userAllOUs.find(ou => ou.toLowerCase() === 'plataforma'),
      fullPath: userAllOUs,
      isInTI: userAllOUs.some(ou => ou.toLowerCase() === 'ti'),
      isInColombia: userAllOUs.some(ou => ou.toLowerCase() === 'colombia'),
      isInPlatform: userAllOUs.some(ou => ou.toLowerCase() === 'plataforma')
    };
  };

  // NUEVO: Obtener display de OU
  const getOUDisplay = (): string => {
    const ouStructure = getOUStructure();
    
    if (ouStructure.fullPath && ouStructure.fullPath.length > 0) {
      return ouStructure.fullPath.join(' → ');
    }
    
    return session.user?.ou || 'Sin OU';
  };

  // NUEVO: Obtener badge de ubicación
  const getLocationBadge = () => {
    const ouStructure = getOUStructure();
    
    if (ouStructure.isInColombia) {
      if (ouStructure.isInTI) {
        return {
          text: 'TI - Colombia',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          icon: '🇨🇴',
          badgeColor: 'bg-blue-500'
        };
      }
      return {
        text: 'Colombia',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: '🇨🇴',
        badgeColor: 'bg-yellow-500'
      };
    }
    
    if (ouStructure.isInPlatform) {
      return {
        text: 'Plataforma',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        icon: '🏢',
        badgeColor: 'bg-purple-500'
      };
    }
    
    return null;
  };

  // NUEVO: Obtener OU primaria
  const getPrimaryOU = (): string | null => {
    const ouStructure = getOUStructure();
    
    if (ouStructure.colombia) return ouStructure.colombia;
    if (ouStructure.ti) return ouStructure.ti;
    if (ouStructure.platform) return ouStructure.platform;
    
    const fullPath = ouStructure.fullPath;
    if (fullPath.length > 0) return fullPath[0];
    
    return session.user?.ou || null;
  };

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/login"
    });
    router.push("/login");
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const employeeId = getEmployeeId();
  const department = getDepartment();
  const title = getTitle();
  const ouStructure = getOUStructure();
  const locationBadge = getLocationBadge();
  const ouDisplay = getOUDisplay();
  const primaryOU = getPrimaryOU();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
            <span className="text-white font-semibold text-base">{getInitials()}</span>
          </div>

          {employeeId && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
          )}

          {/* NUEVO: Badge de ubicación en el avatar */}
          {locationBadge && (
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${locationBadge.badgeColor} rounded-full border-2 border-white dark:border-gray-800`} 
                 title={locationBadge.text}>
            </div>
          )}
        </div>

        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[140px]">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
            {getUserInfo()}
          </p>
          
          {/* NUEVO: Mostrar OU en el tooltip del botón */}
          {primaryOU && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[140px]">
              {primaryOU}
            </p>
          )}
        </div>

        <svg
          className={`hidden md:block w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`absolute top-full right-0 mt-2 transition-all duration-200 origin-top-right z-50 ${isOpen
        ? 'opacity-100 scale-100 translate-y-0'
        : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}>
        <div className="relative">
          <div className="absolute -top-2 right-3 w-4 h-4 bg-white dark:bg-gray-800 rotate-45 border-l border-t border-gray-200 dark:border-gray-700" />

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[320px] overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex justify-center items-center w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600">
                    <span className="text-white font-bold text-lg">{getInitials()}</span>
                  </div>
                  
                  {/* NUEVO: Badge de ubicación más grande */}
                  {locationBadge && (
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${locationBadge.color}`}>
                      <span>{locationBadge.icon}</span>
                      <span>{locationBadge.text}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {getDisplayName()}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                    {getEmail()}
                  </p>

                  {employeeId && (
                    <div className="mt-2 flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-3 py-2 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">ID Empleado</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{employeeId}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 space-y-1">
                    {department && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{department}</span>
                      </div>
                    )}

                    {title && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* NUEVO: Sección de estructura de OU */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Estructura Organizativa
                  </h4>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <div className="space-y-2">
                  {/* Ruta completa */}
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={ouDisplay}>
                        {ouDisplay}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {ouStructure.fullPath.length} nivel{ouStructure.fullPath.length !== 1 ? 'es' : ''} organizativo{ouStructure.fullPath.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  {/* Detalles específicos */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {ouStructure.colombia && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Colombia</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{ouStructure.colombia}</p>
                        </div>
                      </div>
                    )}
                    
                    {ouStructure.ti && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">TI</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{ouStructure.ti}</p>
                        </div>
                      </div>
                    )}
                    
                    {ouStructure.platform && (
                      <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Plataforma</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{ouStructure.platform}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Indicador visual de la ruta */}
                {ouStructure.fullPath.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>Jerarquía:</span>
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                      <div className="space-y-2">
                        {ouStructure.fullPath.map((ou, index) => (
                          <div key={index} className="flex items-center relative">
                            <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center mr-3 
                              ${index === 0 ? 'bg-blue-500' : 
                                index === ouStructure.fullPath.length - 1 ? 'bg-green-500' : 
                                'bg-gray-400'}`}>
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className={`flex-1 p-2 rounded-lg ${index === ouStructure.fullPath.length - 1 ? 
                              'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 
                              'bg-gray-50 dark:bg-gray-800'}`}>
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ou}</p>
                              {index === 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-500">Nivel superior</p>
                              )}
                              {index === ouStructure.fullPath.length - 1 && (
                                <p className="text-xs text-green-600 dark:text-green-400">Ubicación actual</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="py-2">
              <a
                href="/perfil"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="mr-3 p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Mi perfil
              </a>

              <a
                href="/configuracion"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="mr-3 p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                Configuración
              </a>

              {/* NUEVO: Enlace a información de OU */}
              <a
                href="/organizacion"
                className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="mr-3 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Mi organización
              </a>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
            >
              <div className="mr-3 p-2 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              Cerrar sesión
            </button>

            {/* NUEVO: Footer con información de metadatos */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Fuente: Active Directory</span>
                {session.user?.adUser?._metadata?.timestamp && (
                  <span title={session.user.adUser._metadata.timestamp}>
                    {new Date(session.user.adUser._metadata.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}