// hooks/useAnticipos.ts - Versión completa corregida
'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Interfaz para datos crudos de la API
interface AnticipoAPI {
  id: number;
  employeeid: string;
  monto_valor?: number;
  monto?: number;
  fecha_solicitud: string;
  estado: string;
  usuario_nombre?: string;
  usuario_employeeid?: string;
  departamento?: string;
  amount_id?: number;
  request_date?: string;
}

// Interfaz normalizada para uso interno
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

export const useAnticipos = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [misAnticipos, setMisAnticipos] = useState<Anticipo[]>([]);
  const [anticiposPendientes, setAnticiposPendientes] = useState<Anticipo[]>([]);
  const [anticiposAprobados, setAnticiposAprobados] = useState<Anticipo[]>([]);

  // Función para normalizar datos de la API
  const normalizarAnticipo = useCallback((apiData: AnticipoAPI): Anticipo => {
    const fecha = apiData.fecha_solicitud || apiData.request_date || new Date().toISOString();
    const monto = apiData.monto_valor || apiData.monto || 0;

    let estado = apiData.estado || 'Pendiente';

    // Normalización exhaustiva de estados
    if (typeof estado === 'string') {
      const estadoLower = estado.toLowerCase().trim();

      if (estadoLower.includes('pend') || estadoLower.includes('pending')) {
        estado = 'Pendiente';
      } else if (estadoLower.includes('aprob') || estadoLower.includes('approved')) {
        estado = 'Aprobado';
      } else if (estadoLower.includes('rech') || estadoLower.includes('rejected')) {
        estado = 'Rechazado';
      }
    }

    return {
      id: apiData.id,
      employeeid: apiData.employeeid || apiData.usuario_employeeid || '',
      monto: monto,
      fecha_solicitud: fecha,
      estado: estado,
      usuario_nombre: apiData.usuario_nombre || '',
      usuario_employeeid: apiData.usuario_employeeid || '',
      departamento: apiData.departamento || ''
    };
  }, []);

  // Cargar mis anticipos
  const fetchMisAnticipos = useCallback(async (employeeIdParam: string) => {
    try {
      setLoading(true);


      const response = await fetch(`/encargado/api/en_anticipos?employeeid=${encodeURIComponent(employeeIdParam)}`);

      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar mis anticipos`);
      }

      const data: AnticipoAPI[] = await response.json();

      const anticiposNormalizados = data.map(normalizarAnticipo);

      const anticiposOrdenados = anticiposNormalizados.sort((a: Anticipo, b: Anticipo) =>
        new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime()
      );

      setMisAnticipos(anticiposOrdenados);
      setError(null);
    } catch (err) {
      console.error('❌ Error al cargar mis anticipos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setMisAnticipos([]);
    } finally {
      setLoading(false);
    }
  }, [normalizarAnticipo]);

  // hooks/useAnticipos.ts - Actualiza las funciones
  // hooks/useAnticipos.ts - Actualiza fetchAnticiposAprobados
  const fetchAnticiposAprobados = useCallback(async () => {
    try {
      console.log('📞 Cargando anticipos aprobados...');

      // Usar el nuevo parámetro 'estado'
      const response = await fetch('/encargado/api/en_anticipos?estado=aprobado');

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 Anticipos aprobados recibidos:', data);

      const aprobadosNormalizados = Array.isArray(data)
        ? data.map(normalizarAnticipo)
        : [];

      console.log('✅ Anticipos aprobados después de normalizar:', aprobadosNormalizados.length);

      setAnticiposAprobados(aprobadosNormalizados);
      return aprobadosNormalizados;
    } catch (error) {
      console.error('❌ Error al cargar anticipos aprobados:', error);
      setAnticiposAprobados([]);
      return [];
    }
  }, [normalizarAnticipo]);

  // También actualiza fetchAnticiposPendientes
  const fetchAnticiposPendientes = useCallback(async () => {
    try {
      console.log('📞 Cargando anticipos pendientes...');

      const response = await fetch('/encargado/api/en_anticipos?estado=pendiente');

      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar anticipos pendientes`);
      }

      const data = await response.json();
      console.log('📥 Anticipos pendientes recibidos:', data);

      const pendientesNormalizados = Array.isArray(data)
        ? data.map(normalizarAnticipo)
        : [];

      console.log('✅ Anticipos pendientes encontrados:', pendientesNormalizados.length);
      setAnticiposPendientes(pendientesNormalizados);
    } catch (err) {
      console.error('❌ Error al cargar anticipos pendientes:', err);
      setAnticiposPendientes([]);
    }
  }, [normalizarAnticipo]);

  // Recargar todos los datos
  const recargarTodos = useCallback(async () => {
    if (employeeId) {
      await Promise.all([
        fetchMisAnticipos(employeeId),
        fetchAnticiposPendientes(),
        fetchAnticiposAprobados()
      ]);
    }
  }, [employeeId, fetchMisAnticipos, fetchAnticiposPendientes, fetchAnticiposAprobados]);

  // Función para debuggear
  const debugEstadoAnticipos = useCallback(() => {

    const todosAnticipos = [...misAnticipos, ...anticiposPendientes, ...anticiposAprobados];
    const estadosUnicos = [...new Set(todosAnticipos.map(a => a.estado))];

    const anticiposConAprob = misAnticipos.filter(a =>
      a.estado.toLowerCase().includes('aprob')
    );
  }, [misAnticipos, anticiposPendientes, anticiposAprobados]);

  // Efecto inicial
  useEffect(() => {
    const loadData = async () => {
      if (session?.user) {
        const possibleEmployeeId = session.user.adUser?.employeeID || session.user.email?.split('@')[0] || '';

        if (possibleEmployeeId) {
          setEmployeeId(possibleEmployeeId);
          await recargarTodos();
        } else {
          setError('No se pudo identificar al usuario.');
          setLoading(false);
        }
      }
    };

    loadData();
  }, [session, recargarTodos]);

  // Efecto para debuggear cuando cambian los datos
  useEffect(() => {
    if (misAnticipos.length > 0 || anticiposAprobados.length > 0) {
      debugEstadoAnticipos();
    }
  }, [misAnticipos, anticiposAprobados, debugEstadoAnticipos]);

  return {
    loading,
    error,
    employeeId,
    misAnticipos,
    anticiposPendientes,
    anticiposAprobados,
    fetchMisAnticipos,
    fetchAnticiposPendientes,
    fetchAnticiposAprobados,
    recargarTodos,
    normalizarAnticipo,
    debugEstadoAnticipos // Opcional: exportar función de debug
  };
};