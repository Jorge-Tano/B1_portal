'use client';

import { useState, useRef, useEffect } from 'react'
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface ADUserData {
  dn?: string;
  sAMAccountName?: string;
  displayName?: string;
  mail?: string;
  givenName?: string;
  sn?: string;
  cn?: string;
  title?: string;
  department?: string;
  company?: string;
  physicalDeliveryOfficeName?: string;
  telephoneNumber?: string;
  mobile?: string;
  memberOf?: string[];
  userAccountControl?: number;
  isAccountEnabled?: boolean;
  groupAnalysis?: {
    isAdmin: boolean;
    totalGroups: number;
    adminGroups?: string[];
  };
  _metadata?: {
    source: string;
    hasFullData: boolean;
    readSuccess: boolean;
    timestamp: string;
    methodUsed: string;
  };
}

export function UserAvatarMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [showADModal, setShowADModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { data: session } = useSession()

  // Obtener datos del usuario desde la sesión
  const adUser = session?.user?.adUser as ADUserData | undefined
  const user = session?.user
  
  // Obtener iniciales para el avatar
  const getInitials = () => {
    if (!adUser) return 'U'
    
    if (adUser.displayName) {
      const names = adUser.displayName.split(' ')
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
      }
      return names[0].charAt(0).toUpperCase()
    }
    
    if (adUser.sAMAccountName) {
      return adUser.sAMAccountName.charAt(0).toUpperCase()
    }
    
    return 'U'
  }

  // Obtener nombre para mostrar
  const getDisplayName = () => {
    if (adUser?.displayName) return adUser.displayName
    if (user?.name) return user.name
    return 'Usuario'
  }

  // Obtener departamento/cargo
  const getDepartment = () => {
    if (adUser?.sAMAccountName) return adUser.sAMAccountName
    if (adUser?.title) return adUser.title
    return 'Usuario'
  }

  // Obtener email
  const getEmail = () => {
    if (adUser?.mail) return adUser.mail
    if (user?.email) return user.email
    return 'usuario@2call.cl'
  }

  // Función segura para convertir cualquier valor a string
  const safeStringify = (value: any): string => {
    if (value === undefined || value === null) return '<vacío>'
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return JSON.stringify(value)
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2)
      } catch {
        return '[Objeto]'
      }
    }
    return String(value)
  }

  // Función segura para determinar si un valor está "lleno"
  const isFieldFilled = (value: any): boolean => {
    if (value === undefined || value === null) return false
    if (typeof value === 'string') return value.trim() !== ''
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') {
      // Para objetos, consideramos que están llenos si tienen al menos una propiedad
      return Object.keys(value).length > 0
    }
    return true // Para números, booleanos, etc.
  }

  // Obtener estado del campo
  const getFieldStatus = (value: any): { text: string; className: string } => {
    if (value === undefined || value === null) {
      return { text: 'No definido', className: 'text-red-500' }
    }
    
    if (Array.isArray(value)) {
      return { 
        text: `${value.length} elemento${value.length !== 1 ? 's' : ''}`, 
        className: value.length > 0 ? 'text-green-500' : 'text-yellow-500' 
      }
    }
    
    if (typeof value === 'string') {
      return { 
        text: value.trim() === '' ? 'Vacío' : 'Texto', 
        className: value.trim() === '' ? 'text-yellow-500' : 'text-green-500' 
      }
    }
    
    if (typeof value === 'number') {
      return { text: `Número`, className: 'text-green-500' }
    }
    
    if (typeof value === 'boolean') {
      return { 
        text: value ? 'Verdadero' : 'Falso', 
        className: 'text-blue-500' 
      }
    }
    
    if (typeof value === 'object') {
      return { 
        text: 'Objeto', 
        className: Object.keys(value).length > 0 ? 'text-green-500' : 'text-yellow-500' 
      }
    }
    
    return { text: 'Desconocido', className: 'text-gray-500' }
  }

  // Contar campos llenos
  const countFields = (data: ADUserData | undefined) => {
    if (!data) return { total: 0, filled: 0 }
    
    const fields = Object.keys(data)
    let filled = 0
    
    fields.forEach(field => {
      const value = data[field as keyof ADUserData]
      if (isFieldFilled(value)) {
        filled++
      }
    })
    
    return { total: fields.length, filled }
  }

  const stats = countFields(adUser)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
    setIsOpen(false)
  }

  // Renderizar campos específicos de forma segura
  const renderBasicInfo = () => {
    if (!adUser) return null
    
    const basicFields = [
      { key: 'displayName', label: 'Nombre para mostrar', value: adUser.displayName },
      { key: 'sAMAccountName', label: 'Nombre de usuario', value: adUser.sAMAccountName },
      { key: 'mail', label: 'Email', value: adUser.mail },
      { key: 'cn', label: 'Nombre común (CN)', value: adUser.cn },
      { key: 'givenName', label: 'Nombre', value: adUser.givenName },
      { key: 'sn', label: 'Apellido', value: adUser.sn },
      { key: 'dn', label: 'Distinguished Name', value: adUser.dn },
    ]
    
    return basicFields.map(({ key, label, value }) => {
      const status = getFieldStatus(value)
      const displayValue = safeStringify(value)
      
      return (
        <div key={key} className="border dark:border-gray-700 rounded p-3">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
              <div className="text-sm mt-1">
                <code className={`px-2 py-1 rounded ${status.className} break-all`}>
                  {displayValue}
                </code>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
              {status.text}
            </span>
          </div>
        </div>
      )
    })
  }

  const renderOrganizationalInfo = () => {
    if (!adUser) return null
    
    const orgFields = [
      { key: 'title', label: 'Cargo', value: adUser.title },
      { key: 'department', label: 'Departamento', value: adUser.department },
      { key: 'company', label: 'Empresa', value: adUser.company },
      { key: 'physicalDeliveryOfficeName', label: 'Oficina', value: adUser.physicalDeliveryOfficeName },
    ]
    
    return orgFields.map(({ key, label, value }) => {
      const status = getFieldStatus(value)
      const displayValue = safeStringify(value)
      
      return (
        <div key={key} className="border dark:border-gray-700 rounded p-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
              {status.text}
            </span>
          </div>
          <div className="mt-2">
            <code className="text-sm break-all">{displayValue}</code>
          </div>
        </div>
      )
    })
  }

  const renderContactInfo = () => {
    if (!adUser) return null
    
    const contactFields = [
      { key: 'telephoneNumber', label: 'Teléfono', value: adUser.telephoneNumber },
      { key: 'mobile', label: 'Móvil', value: adUser.mobile },
    ]
    
    return contactFields.map(({ key, label, value }) => {
      const status = getFieldStatus(value)
      const displayValue = safeStringify(value)
      
      return (
        <div key={key} className="border dark:border-gray-700 rounded p-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
              {status.text}
            </span>
          </div>
          <div className="mt-2">
            <code className="text-lg font-mono">{displayValue}</code>
          </div>
        </div>
      )
    })
  }

  const renderGroupsInfo = () => {
    if (!adUser) return null
    
    return (
      <>
        <div className="border dark:border-gray-700 rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Grupos (memberOf)</span>
            <span className={`text-xs px-2 py-1 rounded-full ${adUser.memberOf?.length ? 'text-green-500 bg-green-500/20' : 'text-yellow-500 bg-yellow-500/20'}`}>
              {adUser.memberOf?.length || 0} grupos
            </span>
          </div>
          {adUser.memberOf && adUser.memberOf.length > 0 ? (
            <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
              {adUser.memberOf.map((group, index) => (
                <div key={index} className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                  <code className="break-all">{group}</code>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 text-sm italic">
              No pertenece a ningún grupo
            </div>
          )}
        </div>

        {adUser.groupAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="border dark:border-gray-700 rounded p-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-700 dark:text-gray-300">Es administrador</span>
                <span className={`text-xs px-2 py-1 rounded-full ${adUser.groupAnalysis.isAdmin ? 'text-green-500 bg-green-500/20' : 'text-gray-500 bg-gray-500/20'}`}>
                  {adUser.groupAnalysis.isAdmin ? 'Sí' : 'No'}
                </span>
              </div>
              {adUser.groupAnalysis.adminGroups && adUser.groupAnalysis.adminGroups.length > 0 && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Grupos admin: {adUser.groupAnalysis.adminGroups.length}
                </div>
              )}
            </div>
            <div className="border dark:border-gray-700 rounded p-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-300">Estado cuenta</span>
                <span className={`text-xs px-2 py-1 rounded-full ${adUser.isAccountEnabled ? 'text-green-500 bg-green-500/20' : 'text-red-500 bg-red-500/20'}`}>
                  {adUser.isAccountEnabled ? 'Activa' : 'Inactiva'}
                </span>
              </div>
            </div>
            <div className="border dark:border-gray-700 rounded p-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-300">userAccountControl</span>
                <code className="text-sm">{adUser.userAccountControl || 'N/A'}</code>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  const renderMetadata = () => {
    if (!adUser?._metadata) return null
    
    return (
      <div className="border dark:border-gray-700 rounded p-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(adUser._metadata).map(([key, value]) => {
            const isBool = typeof value === 'boolean'
            const displayValue = key === 'timestamp' && typeof value === 'string' 
              ? new Date(value).toLocaleString() 
              : safeStringify(value)
            
            return (
              <div key={key} className="border-b dark:border-gray-700 pb-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {key}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isBool
                      ? (value ? 'text-green-500 bg-green-500/20' : 'text-red-500 bg-red-500/20')
                      : 'text-blue-500 bg-blue-500/20'
                  }`}>
                    {isBool ? (value ? 'Sí' : 'No') : typeof value}
                  </span>
                </div>
                <div className="mt-1">
                  <code className="text-sm break-all">{displayValue}</code>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Botón del avatar - versión compacta para header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          aria-label="Abrir menú de usuario"
        >
          {/* Avatar */}
          <div className="flex justify-center items-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-sm">
            <strong className="text-white font-semibold text-base">{getInitials()}</strong>
          </div>

          {/* Información - oculta en móvil, visible en desktop */}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
              {getDisplayName()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              {getDepartment()}
            </p>
          </div>

          {/* Ícono flecha */}
          <svg 
            className={`hidden md:block w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Menú desplegable */}
        <div className={`absolute top-full right-0 mt-2 transition-all duration-300 origin-top-right z-40 ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}>
          <div className="relative">
            {/* Triángulo indicador */}
            <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white dark:bg-gray-800 rotate-45 border-l border-t border-gray-200 dark:border-gray-700" />
            
            {/* Contenido del menú */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] overflow-hidden">
              {/* Información del usuario en el menú */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                  {getDisplayName()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {getEmail()}
                </p>
                {/* Información adicional de AD */}
                {(adUser?.title || adUser?.department) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {adUser?.department && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {adUser.department}
                      </span>
                    )}
                    {adUser?.title && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        {adUser.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Opciones */}
              <div className="py-1">
                <a
                  href="/perfil"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mi perfil
                </a>
                
                <a
                  href="/configuracion"
                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Configuración
                </a>
              </div>
              
              {/* Separador */}
              <div className="border-t border-gray-100 dark:border-gray-700" />
              
              {/* Opción de DEBUG - solo si hay datos AD */}
              {adUser && (
                <button
                  onClick={() => {
                    setShowADModal(true)
                    setIsOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Ver datos AD ({stats.filled}/{stats.total})
                </button>
              )}
              
              {/* Cerrar sesión */}
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de datos AD */}
      {showADModal && adUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  📊 Datos del Usuario AD
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {adUser.displayName || 'Usuario'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {stats.filled}/{stats.total} campos llenos
                </div>
                <button
                  onClick={() => setShowADModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Información básica */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  📋 Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderBasicInfo()}
                </div>
              </div>

              {/* Información organizacional */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  🏢 Información Organizacional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderOrganizationalInfo()}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  📞 Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {renderContactInfo()}
                </div>
              </div>

              {/* Grupos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  👥 Grupos y Permisos
                </h3>
                <div className="space-y-3">
                  {renderGroupsInfo()}
                </div>
              </div>

              {/* Metadatos */}
              {adUser._metadata && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                    🔧 Metadatos Técnicos
                  </h3>
                  {renderMetadata()}
                </div>
              )}

              {/* Datos en crudo JSON */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  📄 Datos en Crudo (JSON)
                </h3>
                <div className="border dark:border-gray-700 rounded p-3">
                  <div className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(adUser, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Fuente:</span> {adUser._metadata?.source || 'Desconocida'}
                </div>
                <button
                  onClick={() => setShowADModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}