'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEnrichedSession } from '@/hooks/use-enriched-session';

// Definir tipos para la sesión enriquecida
interface ADUser {
  sAMAccountName?: string;
  displayName?: string;
  mail?: string;
  employeeID?: string;
  employeeNumber?: string;
  department?: string;
  title?: string;
  distinguishedName?: string;
}

interface SyncData {
  dbUserId?: number;
  action?: string;
  timestamp?: string;
}

interface DbUser {
  id: number;
  employeeID: string;
  name: string;
  email?: string;
  campaign_id?: number;
  role?: string;
  document_type?: number;
  bank_number?: number;
  ou?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EnrichedSessionUser {
  id: string;
  name: string;
  email?: string;
  employeeID: string;
  ou?: string;
  allOUs: string[];
  adUser: ADUser;
  syncData?: SyncData;
  dbUser: DbUser | null;
}

interface EnrichedSession {
  user: EnrichedSessionUser;
  expires: string;
}

export function AvatarMenu() {
  // === 1. TODOS LOS HOOKS PRIMERO ===
  const [isOpen, setIsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Usar la sesión enriquecida que incluye dbUser
  const { session, status, refreshDbData } = useEnrichedSession();
  const enrichedSession = session as EnrichedSession | null;
  
  // === 2. Effects ===
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // === 3. Handlers ===
  const handleRefreshData = async () => {
    setRefreshing(true);
    await refreshDbData();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut({
      redirect: false,
      callbackUrl: "/login"
    });
    router.push("/login");
    setIsOpen(false);
  };

  // === 4. Lógica condicional DESPUÉS de todos los hooks ===
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

  // === 5. Funciones helper con datos combinados (AD + BD) ===
  const getEmployeeId = (): string | null => {
    // Prioridad 1: dbUser de la base de datos
    if (user.dbUser?.employeeID) {
      return user.dbUser.employeeID.trim();
    }
    
    // Prioridad 2: AD user employeeID
    if (user.adUser?.employeeID && user.adUser.employeeID.trim() !== '') {
      return user.adUser.employeeID.trim();
    }

    // Prioridad 3: AD user employeeNumber
    if (user.adUser?.employeeNumber && user.adUser.employeeNumber.trim() !== '') {
      return user.adUser.employeeNumber.trim();
    }

    // Prioridad 4: Username de la sesión
    return user.id || null;
  };

  const getInitials = (): string => {
    // Prioridad 1: Nombre de la base de datos
    if (user.dbUser?.name) {
      const names = user.dbUser.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    // Prioridad 2: AD user displayName
    if (user.adUser?.displayName) {
      const names = user.adUser.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    // Prioridad 3: Nombre de la sesión
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }

    // Prioridad 4: Email
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return 'U';
  };

  const getDisplayName = (): string => {
    // Prioridad 1: Nombre de la base de datos
    if (user.dbUser?.name) {
      return user.dbUser.name;
    }

    // Prioridad 2: AD user displayName
    if (user.adUser?.displayName) {
      return user.adUser.displayName;
    }

    // Prioridad 3: Nombre de la sesión
    if (user.name) {
      return user.name;
    }

    // Prioridad 4: AD user sAMAccountName
    if (user.adUser?.sAMAccountName) {
      return user.adUser.sAMAccountName;
    }

    return 'Usuario';
  };

  const getUserInfo = (): string => {
    const employeeId = getEmployeeId();

    if (employeeId) {
      return `ID: ${employeeId}`;
    }

    if (user.adUser?.sAMAccountName) {
      return user.adUser.sAMAccountName;
    }

    if (user.adUser?.title) {
      return user.adUser.title;
    }

    return 'Usuario';
  };

  const getEmail = (): string => {
    // Prioridad 1: Email de la base de datos
    if (user.dbUser?.email) {
      return user.dbUser.email;
    }

    // Prioridad 2: AD user mail
    if (user.adUser?.mail) {
      return user.adUser.mail;
    }

    // Prioridad 3: Email de la sesión
    if (user.email) {
      return user.email;
    }

    return 'usuario@ejemplo.com';
  };

  const getDepartment = (): string | null => {
    // Prioridad 1: AD user department
    if (user.adUser?.department) {
      return user.adUser.department;
    }
    
    return null;
  };

  const getTitle = (): string | null => {
    // Prioridad 1: AD user title
    if (user.adUser?.title) {
      return user.adUser.title;
    }
    
    return null;
  };

  const getRole = (): string | null => {
    // Prioridad 1: Rol de la base de datos
    if (user.dbUser?.role) {
      return user.dbUser.role;
    }
    
    return null;
  };

  const getCampaign = (): string | null => {
    // Solo disponible desde la base de datos
    if (user.dbUser?.campaign_id) {
      // Aquí podrías buscar el nombre de la campaña si lo necesitas
      return `Campaña #${user.dbUser.campaign_id}`;
    }
    
    return null;
  };

  const getRoleColor = (role?: string): string => {
    const userRole = role || getRole();
    
    switch (userRole?.toLowerCase()) {
      case 'administrador':
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'aprobador':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'revisor':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ejecutivo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleBadge = () => {
    const role = getRole();
    if (!role) return null;

    return {
      text: role.charAt(0).toUpperCase() + role.slice(1),
      color: getRoleColor(role),
      icon: getRoleIcon(role)
    };
  };

  const getRoleIcon = (role?: string): string => {
    const userRole = role || getRole();
    
    switch (userRole?.toLowerCase()) {
      case 'administrador':
      case 'admin':
        return '👑';
      case 'supervisor':
        return '👔';
      case 'aprobador':
        return '✅';
      case 'revisor':
        return '👁️';
      case 'ejecutivo':
        return '👨‍💼';
      default:
        return '👤';
    }
  };

  const getOUStructure = () => {
    const userAllOUs = user.allOUs || [];
    
    // Si no hay estructura específica, crear una básica
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

  const getPrimaryOU = (): string | null => {
    // Prioridad 1: OU de la base de datos
    if (user.dbUser?.ou) {
      return user.dbUser.ou;
    }

    // Prioridad 2: OU de AD
    const ouStructure = getOUStructure();
    
    if (ouStructure.colombia) return ouStructure.colombia;
    if (ouStructure.ti) return ouStructure.ti;
    if (ouStructure.platform) return ouStructure.platform;
    
    const fullPath = ouStructure.fullPath;
    if (fullPath.length > 0) return fullPath[0];
    
    return user.ou || null;
  };

  // === 6. Obtener datos para render ===
  const employeeId = getEmployeeId();
  const department = getDepartment();
  const title = getTitle();
  const role = getRole();
  const roleBadge = getRoleBadge();
  const locationBadge = getLocationBadge();
  const primaryOU = getPrimaryOU();
  const campaign = getCampaign();

  // === 7. Render principal ===
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

          {locationBadge && (
            <div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 ${locationBadge.badgeColor} rounded-full border-2 border-white dark:border-gray-800`} 
              title={locationBadge.text}
            />
          )}

          {roleBadge && (
            <div 
              className={`absolute -bottom-1 -left-1 w-4 h-4 ${roleBadge.color.split(' ')[0]} rounded-full border-2 border-white dark:border-gray-800`} 
              title={roleBadge.text}
            />
          )}
        </div>

        <div className="hidden md:block text-left min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[140px]">
            {getDisplayName()}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[140px]">
            {getUserInfo()}
          </p>
          
          {(primaryOU || role) && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[140px]">
              {primaryOU}{role ? ` • ${role}` : ''}
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

      <div className={`absolute top-full right-0 mt-2 transition-all duration-200 origin-top-right z-50 ${
        isOpen
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
                  
                  <div className="mt-2 space-y-1">
                    {locationBadge && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${locationBadge.color}`}>
                        <span>{locationBadge.icon}</span>
                        <span>{locationBadge.text}</span>
                      </div>
                    )}

                    {roleBadge && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                        <span>{roleBadge.icon}</span>
                        <span>{roleBadge.text}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {getDisplayName()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                        {getEmail()}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleRefreshData}
                      disabled={refreshing}
                      className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Actualizar datos"
                    >
                      {refreshing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  </div>

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

                  {/* Información de base de datos */}
                  {user.dbUser && (
                    <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-3 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                        Información del Sistema
                      </h4>
                      <div className="space-y-2">
                        {role && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Rol:</span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${getRoleColor()}`}>
                              {role}
                            </span>
                          </div>
                        )}

                        {user.dbUser.campaign_id && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Campaña ID:</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                              #{user.dbUser.campaign_id}
                            </span>
                          </div>
                        )}

                        {user.dbUser.document_type && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Tipo Doc:</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                              {user.dbUser.document_type === 1 ? 'Cédula' :
                               user.dbUser.document_type === 2 ? 'Pasaporte' :
                               user.dbUser.document_type === 3 ? 'NIT' :
                               'Tarjeta de Identidad'}
                            </span>
                          </div>
                        )}

                        {user.dbUser.bank_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Banco:</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-gray-200">
                              {user.dbUser.bank_number}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Información de AD */}
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

                    {primaryOU && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{primaryOU}</span>
                      </div>
                    )}
                  </div>
                </div>
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

            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.syncData?.timestamp && 
                  `Sincronizado: ${new Date(user.syncData.timestamp).toLocaleTimeString()}`
                }
              </span>
              
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg group"
              >
                <div className="mr-2 p-1 rounded-lg bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                  <svg className="w-3.5 h-3.5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}