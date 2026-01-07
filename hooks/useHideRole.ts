// hooks/useHideRole.ts
import { useSession } from 'next-auth/react';

const ROLE_HIERARCHY = {
  admin: 100,          
  tesoreria: 90,       
  team_leader: 80,     
  supervisor: 70,      
  encargado: 60,       
  ejecutivo: 50,       
} as const;

type UserRole = keyof typeof ROLE_HIERARCHY | string;

export function useHideRole() {
  const { data: session, status } = useSession();
  
  const userData = session?.user as any;
  const userRole = (userData?.role || userData?.dbUser?.role || null) as UserRole | null;
  
  // Función helper para combinar admin con otros roles
  const isRoleOrAdmin = (rolesToCheck: string | string[]): boolean => {
    if (!userRole) return false;
    
    // Si es admin, siempre true
    if (userRole === 'admin') return true;
    
    const checkArray = Array.isArray(rolesToCheck) ? rolesToCheck : [rolesToCheck];
    return checkArray.includes(userRole);
  };
  
  const shouldHide = (rolesToHide: string | string[]): boolean => {
    if (status === 'loading' || status === 'unauthenticated') {
      return true;
    }
    
    if (!userRole) {
      return true;
    }
    
    const hideArray = Array.isArray(rolesToHide) ? rolesToHide : [rolesToHide];
    const shouldHideResult = hideArray.includes(userRole);
    
    return shouldHideResult;
  };
  
  const showIfRoleLevel = (minLevelRole: UserRole): boolean => {
    if (!userRole) return false;
    
    const userLevel = ROLE_HIERARCHY[userRole as keyof typeof ROLE_HIERARCHY] || 0;
    const requiredLevel = ROLE_HIERARCHY[minLevelRole] || 0;
    
    return userLevel >= requiredLevel;
  };
  
  const hasAccessTo = (pathType: 'anticipos' | 'dashboard' | 'reportes' | 'configuracion'): boolean => {
    if (!userRole) return false;
    
    const accessMap: Record<string, string[]> = {
      anticipos: ['ejecutivo', 'encargado', 'supervisor', 'tesoreria', 'team_leader', 'admin'],
      dashboard: ['admin', 'ejecutivo', 'encargado', 'supervisor', 'team_leader', 'tesoreria'],
      reportes: ['encargado', 'supervisor', 'tesoreria', 'team_leader', 'admin'],
      configuracion: ['admin', 'tesoreria'],
    };
    
    return accessMap[pathType]?.includes(userRole) || false;
  };
  
  const canAccessAnticipos = (): boolean => {
    return hasAccessTo('anticipos');
  };
  
  const canAccessRoute = (routePath: string): boolean => {
    if (!userRole) return false;
    
    const routePermissions: Record<string, string[]> = {
      '/mis_anticipos': ['ejecutivo', 'encargado', 'team_leader', 'admin'],
      '/admin': ['admin'],
      '/dashboard': ['ejecutivo', 'admin'],
      '/encargado/dashboard': ['encargado', 'admin'],
      '/supervisor/dashboard': ['supervisor', 'admin'],
      '/encargado/anticipos': ['encargado', 'tesoreria', 'admin'], 
      '/supervisor/anticipos': ['supervisor', 'team_leader', 'admin'],
    };

    for (const [route, allowedRoles] of Object.entries(routePermissions)) {
      if (routePath.startsWith(route)) {
        return allowedRoles.includes(userRole);
      }
    }
    
    return false;
  };
  
  // Función para verificar múltiples roles incluyendo admin
  const hasAnyRole = (roles: string[]): boolean => {
    if (!userRole) return false;
    if (userRole === 'admin') return true;
    return roles.includes(userRole);
  };
  
  return {
    // Funciones principales
    shouldHide,         
    showIfRoleLevel,     
    hasAccessTo,         
    canAccessAnticipos,  
    canAccessRoute,
    
    // Nueva función combinada con admin
    isRoleOrAdmin,
    hasAnyRole,
    
    // Estado y rol
    userRole,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    
    // Propiedades individuales
    isAdmin: userRole === 'admin',
    isEjecutivo: userRole === 'ejecutivo',
    isEncargado: userRole === 'encargado',          
    isTesoreria: userRole === 'tesoreria',           
    isSupervisor: userRole === 'supervisor',
    isTeamLeader: userRole === 'team_leader',
    
    // Propiedades combinadas
    isAdminOrTesoreria: userRole === 'admin' || userRole === 'tesoreria',
    isAdminOrEjecutivo: userRole === 'admin' || userRole === 'ejecutivo',
    isAdminOrEncargado: userRole === 'admin' || userRole === 'encargado',
    isAdminOrSupervisor: userRole === 'admin' || userRole === 'supervisor',
    isAdminOrTeamLeader: userRole === 'admin' || userRole === 'team_leader',
    
    // Combinaciones específicas
    isEncargadoOrTesoreria: userRole === 'encargado' || userRole === 'tesoreria',            
    isSupervisorOrTeamLeader: userRole === 'supervisor' || userRole === 'team_leader',
    isAdminOrTesoreriaOrTeamLeader: userRole === 'admin' || userRole === 'tesoreria' || userRole === 'team_leader',
    
    // Alias
    hideFor: shouldHide,                    
    showOnlyFor: (roles: string[]) => !shouldHide(roles),
    isAnyOf: hasAnyRole, // Alias para hasAnyRole
  };
}