'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface AnticipoAPI {
  id: number;
  employeeid: string;
  monto_valor?: number;
  monto?: number;
  fecha_solicitud?: string;
  estado?: string;
  status?: string;
  request_date?: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
  amount_id?: number;
}

export interface Anticipo {
  id: number;
  employeeid: string;
  monto: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  anticipos?: T[];
}

export const useAnticipos = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [misAnticipos, setMisAnticipos] = useState<Anticipo[]>([]);
  const [anticiposPendientes, setAnticiposPendientes] = useState<Anticipo[]>([]);
  const [anticiposAprobados, setAnticiposAprobados] = useState<Anticipo[]>([]);
  const [anticiposRechazados, setAnticiposRechazados] = useState<Anticipo[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const normalizarAnticipo = useCallback((apiData: AnticipoAPI): Anticipo => {
    
    const estadoOriginal = apiData.status || apiData.estado || 'Pendiente';
    const fecha = apiData.request_date || apiData.fecha_solicitud || new Date().toISOString();
    const monto = apiData.monto_valor || apiData.monto || 0;

    let estadoNormalizado = estadoOriginal;
    const estadoLower = estadoNormalizado.toLowerCase().trim();
    
    if (estadoLower.includes('pend') || estadoLower === 'pending') {
      estadoNormalizado = 'Pendiente';
    } else if (estadoLower.includes('aprob') || estadoLower === 'approved') {
      estadoNormalizado = 'Aprobado';
    } else if (estadoLower.includes('rech') || estadoLower === 'rejected') {
      estadoNormalizado = 'Rechazado';
    }

    const anticipoNormalizado = {
      id: apiData.id,
      employeeid: apiData.employeeid || apiData.usuario_employeeid || '',
      monto: monto,
      fecha_solicitud: fecha,
      estado: estadoNormalizado,
      usuario_nombre: apiData.usuario_nombre || '',
      usuario_employeeid: apiData.usuario_employeeid || '',
      departamento: apiData.departamento || ''
    };

    return anticipoNormalizado;
  }, []);

  const cargarTodosDatos = useCallback(async () => {
  if (!employeeId) {
    return;
  }

  try {
    setLoading(true);
    
    console.log('🔍 DEBUG: Iniciando carga de datos para employeeId:', employeeId);
    
    const urls = [
      `/supervisor/api/sup_anticipos?employeeid=${employeeId}`,
      '/supervisor/api/sup_anticipos?estado=pendiente',
      '/supervisor/api/sup_anticipos?estado=aprobado',
      '/supervisor/api/sup_anticipos?estado=rechazado'
    ];
    
    console.log('📋 URLs a consultar:');
    urls.forEach((url, i) => console.log(`${i+1}. ${url}`));
    
    // Hacer las peticiones una por una para debuggear mejor
    const responsesData = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n=== Procesando URL ${i+1}: ${url} ===`);
      
      try {
        const response = await fetch(url);
        
        console.log(`📡 Status: ${response.status} ${response.statusText}`);
        console.log(`✅ OK: ${response.ok}`);
        
        // Obtener el content-type
        const contentType = response.headers.get('content-type');
        console.log(`📄 Content-Type: ${contentType}`);
        
        // Leer la respuesta como texto primero
        const rawText = await response.text();
        console.log(`📝 Longitud de respuesta: ${rawText.length} caracteres`);
        
        // Mostrar primeros 500 caracteres
        console.log(`📄 Primeros 500 caracteres:`);
        console.log(rawText.substring(0, 500));
        
        // Verificar si es HTML
        const isHtml = rawText.trim().startsWith('<!DOCTYPE') || 
                      rawText.trim().startsWith('<html') ||
                      rawText.includes('</html>') ||
                      rawText.includes('<body');
        
        if (isHtml) {
          console.log('❌ ¡ATENCIÓN! La respuesta parece ser HTML');
          
          // Intentar extraer información del HTML
          if (rawText.includes('<title>')) {
            const titleMatch = rawText.match(/<title>(.*?)<\/title>/);
            if (titleMatch) console.log(`📌 Título de la página: ${titleMatch[1]}`);
          }
          
          if (rawText.includes('<h1>')) {
            const h1Match = rawText.match(/<h1>(.*?)<\/h1>/);
            if (h1Match) console.log(`📌 Encabezado: ${h1Match[1]}`);
          }
        }
        
        // Verificar si es JSON válido
        const isJson = contentType?.includes('application/json');
        let jsonData = null;
        
        if (isJson || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
          try {
            jsonData = JSON.parse(rawText);
            console.log(`✅ JSON parseado correctamente:`, 
              Array.isArray(jsonData) ? `Array de ${jsonData.length} elementos` : 'Objeto JSON');
          } catch (parseError) {
            console.log(`❌ No se pudo parsear como JSON:`, parseError.message);
          }
        }
        
        responsesData.push({
          url,
          response,
          rawText,
          jsonData,
          isHtml,
          isJson: isJson || false,
          status: response.status,
          ok: response.ok
        });
        
      } catch (fetchError) {
        console.error(`❌ Error al hacer fetch a ${url}:`, fetchError);
        responsesData.push({
          url,
          error: fetchError.message,
          ok: false
        });
      }
    }
    
    console.log('\n=== RESUMEN DE TODAS LAS RESPUESTAS ===');
    
    // Analizar qué respuestas fueron exitosas
    const successfulResponses = responsesData.filter(r => r.ok && r.jsonData);
    const failedResponses = responsesData.filter(r => !r.ok || !r.jsonData);
    
    console.log(`✅ Respuestas exitosas: ${successfulResponses.length}/${urls.length}`);
    console.log(`❌ Respuestas fallidas: ${failedResponses.length}/${urls.length}`);
    
    // Mostrar detalles de las fallidas
    if (failedResponses.length > 0) {
      console.log('\n📊 Detalles de respuestas fallidas:');
      failedResponses.forEach((resp, i) => {
        console.log(`\n${i+1}. URL: ${resp.url}`);
        console.log(`   Status: ${resp.status || 'N/A'}`);
        console.log(`   Error: ${resp.error || 'No es JSON válido'}`);
        if (resp.rawText) {
          console.log(`   Primeros 200 chars: ${resp.rawText.substring(0, 200)}...`);
        }
      });
    }
    
    // Si hay fallos, mostrar error específico
    if (successfulResponses.length !== urls.length) {
      const failedUrls = failedResponses.map(r => r.url);
      throw new Error(`Las siguientes URLs fallaron: ${failedUrls.join(', ')}`);
    }
    
    // Extraer los datos JSON de las respuestas exitosas
    const [misData, pendientesData, aprobadosData, rechazadosData] = successfulResponses.map(r => r.jsonData);
    
    console.log('✅ Todos los datos fueron cargados exitosamente');
    
    // ... continúa con el procesamiento normal de datos
    
    const misNormalizados = Array.isArray(misData) ? misData.map(normalizarAnticipo) : [];
    const pendientesNormalizados = Array.isArray(pendientesData) ? pendientesData.map(normalizarAnticipo) : [];
    const aprobadosNormalizados = Array.isArray(aprobadosData) ? aprobadosData.map(normalizarAnticipo) : [];
    const rechazadosNormalizados = Array.isArray(rechazadosData) ? rechazadosData.map(normalizarAnticipo) : []; 

    const ordenarPorFecha = (a: Anticipo, b: Anticipo) =>
      new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime();

    setMisAnticipos(misNormalizados.sort(ordenarPorFecha));
    setAnticiposPendientes(pendientesNormalizados.sort(ordenarPorFecha));
    setAnticiposAprobados(aprobadosNormalizados.sort(ordenarPorFecha));
    setAnticiposRechazados(rechazadosNormalizados.sort(ordenarPorFecha)); 

    setError(null);
    
  } catch (err) {
    console.error('❌ Error crítico en cargarTodosDatos:', err);
    setError(err instanceof Error ? err.message : 'Error al cargar datos');
    
    // Puedes mostrar un error más específico al usuario
    if (err.message.includes('fallaron')) {
      setError('Algunas solicitudes no pudieron completarse. Revisa la consola para más detalles.');
    }
  } finally {
    setLoading(false);
  }
}, [employeeId, normalizarAnticipo]);

  const actualizarAnticiposLocalmente = useCallback((ids: number[], nuevoEstado: string) => {
    console.log(`🔄 Actualizando ${ids.length} anticipos a estado: ${nuevoEstado}`);

    if (nuevoEstado !== 'Pendiente') {
      setAnticiposPendientes(prev => {
        const nuevosPendientes = prev.filter(a => !ids.includes(a.id));
        return nuevosPendientes;
      });
    }

    setMisAnticipos(prev => {
      const nuevosMisAnticipos = prev.map(a => 
        ids.includes(a.id) ? { ...a, estado: nuevoEstado } : a
      );
      return nuevosMisAnticipos;
    });

    if (nuevoEstado === 'Aprobado') {
      const todosAnticipos = [...misAnticipos, ...anticiposPendientes];
      const anticiposActualizados = todosAnticipos
        .filter(a => ids.includes(a.id))
        .map(a => ({ ...a, estado: 'Aprobado' }));
      
      if (anticiposActualizados.length > 0) {
        setAnticiposAprobados(prev => {
          const nuevosAprobados = [...anticiposActualizados, ...prev].sort((a, b) => 
            new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
          );
          return nuevosAprobados;
        });
        
        setAnticiposRechazados(prev => prev.filter(a => !ids.includes(a.id)));
      }
    }

    if (nuevoEstado === 'Rechazado') {
      const todosAnticipos = [...misAnticipos, ...anticiposPendientes];
      const anticiposActualizados = todosAnticipos
        .filter(a => ids.includes(a.id))
        .map(a => ({ ...a, estado: 'Rechazado' }));
      
      if (anticiposActualizados.length > 0) {
        setAnticiposRechazados(prev => {
          const nuevosRechazados = [...anticiposActualizados, ...prev].sort((a, b) => 
            new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
          );
          return nuevosRechazados;
        });
        
        setAnticiposAprobados(prev => prev.filter(a => !ids.includes(a.id)));
      }
      console.log(`❌ ${ids.length} anticipos marcados como rechazados localmente`);
    }

    if (nuevoEstado === 'Pendiente') {
      const todosAnticipos = [...misAnticipos, ...anticiposAprobados, ...anticiposRechazados];
      const anticiposActualizados = todosAnticipos
        .filter(a => ids.includes(a.id))
        .map(a => ({ ...a, estado: 'Pendiente' }));
      
      if (anticiposActualizados.length > 0) {
        setAnticiposPendientes(prev => {
          const nuevosPendientes = [...anticiposActualizados, ...prev].sort((a, b) => 
            new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
          );
          return nuevosPendientes;
        });
        
        setAnticiposAprobados(prev => prev.filter(a => !ids.includes(a.id)));
        setAnticiposRechazados(prev => prev.filter(a => !ids.includes(a.id)));
      }
    }
  }, [misAnticipos, anticiposPendientes, anticiposAprobados, anticiposRechazados]);

  const aprobarAnticipo = useCallback(async (id: number) => {
    try {
      setIsUpdating(true);
      actualizarAnticiposLocalmente([id], 'Aprobado');
      
      const response = await fetch(`/supervisor/api/sup_anticipos?id=${id}&accion=aprobar`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        actualizarAnticiposLocalmente([id], 'Pendiente');
        throw new Error(data.error || 'Error al aprobar anticipo');
      }
      
      
      setTimeout(() => {
        cargarTodosDatos();
      }, 500);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error al aprobar anticipo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [actualizarAnticiposLocalmente, cargarTodosDatos]);

  const rechazarAnticipo = useCallback(async (id: number) => {
    try {
      setIsUpdating(true);

      actualizarAnticiposLocalmente([id], 'Rechazado');
      
      const response = await fetch(`/supervisor/api/sup_anticipos?id=${id}&accion=rechazar`, {
        method: 'PUT',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        actualizarAnticiposLocalmente([id], 'Pendiente');
        throw new Error(data.error || 'Error al rechazar anticipo');
      }
      
      
      setTimeout(() => {
        cargarTodosDatos();
      }, 500);
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error al rechazar anticipo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [actualizarAnticiposLocalmente, cargarTodosDatos]);

  const aprobarAnticiposMasivos = useCallback(async (ids: number[]): Promise<ApiResponse<Anticipo[]>> => {
    try {
      setIsUpdating(true);
      if (!ids || ids.length === 0) {
        return {
          success: false,
          error: 'No se proporcionaron IDs válidos'
        };
      }

      actualizarAnticiposLocalmente(ids, 'Aprobado');
      
      const response = await fetch('/supervisor/api/sup_anticipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accionMasiva: true,
          ids,
          accion: 'aprobar'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        actualizarAnticiposLocalmente(ids, 'Pendiente');
        throw new Error(data.error || 'Error al aprobar anticipos masivamente');
      }
      
      
      setTimeout(() => {
        cargarTodosDatos();
      }, 500);
      
      return { 
        success: true, 
        data: data.anticipos || [],
        message: data.message,
        total: data.total
      };
      
    } catch (error) {
      console.error('❌ Error en aprobarAnticiposMasivos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al aprobar anticipos masivamente' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [actualizarAnticiposLocalmente, cargarTodosDatos]);

  const rechazarAnticiposMasivos = useCallback(async (ids: number[]): Promise<ApiResponse<Anticipo[]>> => {
    try {
      setIsUpdating(true);

      if (!ids || ids.length === 0) {
        return {
          success: false,
          error: 'No se proporcionaron IDs válidos'
        };
      }

      actualizarAnticiposLocalmente(ids, 'Rechazado');
      
      const response = await fetch('/supervisor/api/sup_anticipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accionMasiva: true,
          ids,
          accion: 'rechazar'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Error del servidor:', data);
        actualizarAnticiposLocalmente(ids, 'Pendiente');
        throw new Error(data.error || 'Error al rechazar anticipos masivamente');
      }
      
      
      setTimeout(() => {
        cargarTodosDatos();
      }, 500);
      
      return { 
        success: true, 
        data: data.anticipos || [],
        message: data.message,
        total: data.total
      };
      
    } catch (error) {
      console.error('❌ Error en rechazarAnticiposMasivos:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al rechazar anticipos masivamente' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [actualizarAnticiposLocalmente, cargarTodosDatos]);

  const crearAnticipo = useCallback(async (monto: number, empleadoId?: string) => {
    try {
      setIsUpdating(true);
      const targetEmployeeId = empleadoId || employeeId;
      
      
      const response = await fetch('/supervisor/api/sup_anticipos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto,
          employeeid: targetEmployeeId
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear anticipo');
      }
      
      
      await cargarTodosDatos();
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error al crear anticipo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [employeeId, cargarTodosDatos]);

  const eliminarAnticipo = useCallback(async (id: number) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/supervisor/api/sup_anticipos?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar anticipo');
      }
      
      setMisAnticipos(prev => prev.filter(a => a.id !== id));
      setAnticiposPendientes(prev => prev.filter(a => a.id !== id));
      setAnticiposAprobados(prev => prev.filter(a => a.id !== id));
      setAnticiposRechazados(prev => prev.filter(a => a.id !== id));
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error al eliminar anticipo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const editarAnticipo = useCallback(async (id: number, monto: number) => {
    try {
      setIsUpdating(true);
      
      const response = await fetch(`/supervisor/api/sup_anticipos?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monto }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al editar anticipo');
      }
      
      await cargarTodosDatos();
      
      return { success: true, data };
      
    } catch (error) {
      console.error('❌ Error al editar anticipo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, [cargarTodosDatos]);

  useEffect(() => {
    if (session?.user && !employeeId) {
      const possibleEmployeeId = session.user.adUser?.employeeID || 
                                session.user.email?.split('@')[0] || '';
      
      
      if (possibleEmployeeId) {
        setEmployeeId(possibleEmployeeId);
      } else {
        setError('No se pudo identificar al usuario.');
        setLoading(false);
      }
    }
  }, [session, employeeId]);

  useEffect(() => {
    if (employeeId) {
      cargarTodosDatos();
    }
  }, [employeeId, cargarTodosDatos]);

  return {
    loading,
    error,
    employeeId,
    misAnticipos,
    anticiposPendientes,
    anticiposAprobados,
    anticiposRechazados, 
    isUpdating,
    
    cargarTodosDatos,
    recargarTodos: cargarTodosDatos,
    
    aprobarAnticipo,
    rechazarAnticipo,
    crearAnticipo,
    eliminarAnticipo,
    editarAnticipo, 
    actualizarAnticiposLocalmente,
    
    aprobarAnticiposMasivos,
    rechazarAnticiposMasivos,
    
    normalizarAnticipo
  };
};