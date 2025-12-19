// components/ADDataDebugModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";

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

export function ADDataDebugModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [adUserData, setAdUserData] = useState<ADUserData | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.adUser) {
      setAdUserData(session.user.adUser as ADUserData);
    }
  }, [session]);

  const getFieldStatus = (value: any): { text: string; className: string } => {
    if (value === undefined || value === null) {
      return { text: 'No definido', className: 'text-red-500' };
    }
    
    if (Array.isArray(value)) {
      return { 
        text: `Array (${value.length} elementos)`, 
        className: value.length > 0 ? 'text-green-500' : 'text-yellow-500' 
      };
    }
    
    if (typeof value === 'string') {
      return { 
        text: value.trim() === '' ? 'Cadena vacía' : 'Texto', 
        className: value.trim() === '' ? 'text-yellow-500' : 'text-green-500' 
      };
    }
    
    if (typeof value === 'number') {
      return { text: `Número (${value})`, className: 'text-green-500' };
    }
    
    if (typeof value === 'boolean') {
      return { 
        text: value ? 'Verdadero' : 'Falso', 
        className: 'text-blue-500' 
      };
    }
    
    if (typeof value === 'object') {
      return { 
        text: 'Objeto', 
        className: Object.keys(value).length > 0 ? 'text-green-500' : 'text-yellow-500' 
      };
    }
    
    return { text: 'Desconocido', className: 'text-gray-500' };
  };

  const countFields = (data: ADUserData | null) => {
    if (!data) return { total: 0, filled: 0 };
    
    const fields = Object.keys(data);
    let filled = 0;
    
    fields.forEach(field => {
      const value = data[field as keyof ADUserData];
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          if (value.length > 0) filled++;
        } else if (typeof value === 'string') {
          if (value.trim() !== '') filled++;
        } else if (typeof value === 'object') {
          if (Object.keys(value).length > 0) filled++;
        } else {
          filled++;
        }
      }
    });
    
    return { total: fields.length, filled };
  };

  const stats = countFields(adUserData);

  if (!adUserData) {
    return null;
  }

  return (
    <>
      {/* Botón para abrir el modal */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm"
      >
        🔍 Ver datos AD
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  📊 Datos del Usuario AD
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {adUserData.displayName || 'Usuario'}
                </p>
              </div>
              <div className="text-sm bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                {stats.filled}/{stats.total} campos llenos
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Contenido - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Información básica */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  📋 Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'displayName', label: 'Nombre para mostrar', value: adUserData.displayName },
                    { key: 'sAMAccountName', label: 'Nombre de usuario', value: adUserData.sAMAccountName },
                    { key: 'mail', label: 'Email', value: adUserData.mail },
                    { key: 'cn', label: 'Nombre común (CN)', value: adUserData.cn },
                    { key: 'givenName', label: 'Nombre', value: adUserData.givenName },
                    { key: 'sn', label: 'Apellido', value: adUserData.sn },
                    { key: 'dn', label: 'Distinguished Name', value: adUserData.dn },
                  ].map(({ key, label, value }) => {
                    const status = getFieldStatus(value);
                    return (
                      <div key={key} className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                            <div className="text-sm mt-1">
                              <code className={`px-2 py-1 rounded ${status.className}`}>
                                {value || '<vacío>'}
                              </code>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
                            {status.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información organizacional */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  🏢 Información Organizacional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'title', label: 'Cargo', value: adUserData.title },
                    { key: 'department', label: 'Departamento', value: adUserData.department },
                    { key: 'company', label: 'Empresa', value: adUserData.company },
                    { key: 'physicalDeliveryOfficeName', label: 'Oficina', value: adUserData.physicalDeliveryOfficeName },
                  ].map(({ key, label, value }) => {
                    const status = getFieldStatus(value);
                    return (
                      <div key={key} className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="mt-2">
                          <code className="text-sm break-all">{value || '<vacío>'}</code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Información de contacto */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  📞 Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'telephoneNumber', label: 'Teléfono', value: adUserData.telephoneNumber },
                    { key: 'mobile', label: 'Móvil', value: adUserData.mobile },
                  ].map(({ key, label, value }) => {
                    const status = getFieldStatus(value);
                    return (
                      <div key={key} className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${status.className} bg-opacity-20 ${status.className.replace('text-', 'bg-')}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="mt-2">
                          <code className="text-lg font-mono">{value || '<vacío>'}</code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grupos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  👥 Grupos y Permisos
                </h3>
                <div className="space-y-3">
                  <div className="border dark:border-gray-700 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Grupos (memberOf)</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${adUserData.memberOf?.length ? 'text-green-500 bg-green-500/20' : 'text-yellow-500 bg-yellow-500/20'}`}>
                        {adUserData.memberOf?.length || 0} grupos
                      </span>
                    </div>
                    {adUserData.memberOf && adUserData.memberOf.length > 0 ? (
                      <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                        {adUserData.memberOf.map((group, index) => (
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

                  {adUserData.groupAnalysis && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Es administrador</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${adUserData.groupAnalysis.isAdmin ? 'text-green-500 bg-green-500/20' : 'text-gray-500 bg-gray-500/20'}`}>
                            {adUserData.groupAnalysis.isAdmin ? 'Sí' : 'No'}
                          </span>
                        </div>
                      </div>
                      <div className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-800 dark:text-gray-300">Estado cuenta</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${adUserData.isAccountEnabled ? 'text-green-500 bg-green-500/20' : 'text-red-500 bg-red-500/20'}`}>
                            {adUserData.isAccountEnabled ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>
                      <div className="border dark:border-gray-700 rounded p-3">
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-800 dark:text-gray-300">userAccountControl</span>
                          <code className="text-sm">{adUserData.userAccountControl || 'N/A'}</code>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadatos */}
              {adUserData._metadata && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                    🔧 Metadatos Técnicos
                  </h3>
                  <div className="border dark:border-gray-700 rounded p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(adUserData._metadata).map(([key, value]) => (
                        <div key={key} className="border-b dark:border-gray-700 pb-2 last:border-0">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {key}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              typeof value === 'boolean' 
                                ? (value ? 'text-green-500 bg-green-500/20' : 'text-red-500 bg-red-500/20')
                                : 'text-blue-500 bg-blue-500/20'
                            }`}>
                              {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : typeof value}
                            </span>
                          </div>
                          <div className="mt-1">
                            <code className="text-sm break-all">
                              {key === 'timestamp' && typeof value === 'string' 
                                ? new Date(value).toLocaleString() 
                                : String(value)
                              }
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                      {JSON.stringify(adUserData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Fuente:</span> {adUserData._metadata?.source || 'Desconocida'}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
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
  );
}