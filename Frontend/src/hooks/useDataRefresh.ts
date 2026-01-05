import { useEffect, useCallback, useRef, useState } from 'react';
import { dataEvents, DATA_EVENTS } from '../utils/eventEmitter';

type EventName = typeof DATA_EVENTS[keyof typeof DATA_EVENTS] | string;

/**
 * Hook para suscribirse a eventos de actualización de datos
 * Se desuscribe automáticamente cuando el componente se desmonta
 * 
 * @param events - Array de eventos a los que suscribirse
 * @param callback - Función a ejecutar cuando se emite algún evento
 * @param deps - Dependencias adicionales para el callback (opcional)
 * 
 * @example
 * // Suscribirse a actualizaciones de clientes
 * useDataRefresh([DATA_EVENTS.CLIENTES_UPDATED], () => {
 *   cargarClientes();
 * });
 * 
 * @example
 * // Suscribirse a múltiples eventos
 * useDataRefresh(
 *   [DATA_EVENTS.PEDIDOS_UPDATED, DATA_EVENTS.ABONOS_UPDATED],
 *   () => cargarDatos()
 * );
 */
export function useDataRefresh(
  events: EventName[],
  callback: (...args: any[]) => void,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  
  // Mantener referencia actualizada del callback
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback, ...deps]);

  useEffect(() => {
    const handler = (...args: any[]) => {
      console.log('[useDataRefresh] Handler ejecutado para eventos:', events);
      callbackRef.current(...args);
    };

    console.log('[useDataRefresh] Suscribiéndose a eventos:', events);
    // Suscribirse a todos los eventos
    const unsubscribers = events.map(event => dataEvents.on(event, handler));

    // Limpiar suscripciones al desmontar
    return () => {
      console.log('[useDataRefresh] Desuscribiéndose de eventos:', events);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [events.join(',')]); // Solo re-suscribir si cambian los eventos
}

/**
 * Hook para suscribirse a TODOS los eventos de actualización de un tipo de dato
 * 
 * @param dataType - Tipo de dato: 'clientes' | 'pedidos' | 'movimientos' | etc.
 * @param callback - Función a ejecutar
 */
export function useDataTypeRefresh(
  dataType: 'clientes' | 'pedidos' | 'prendas' | 'movimientos' | 'abonos' | 'ajustes' | 'acciones' | 'codigos' | 'cajones' | 'usuarios',
  callback: (...args: any[]) => void,
  deps: any[] = []
) {
  const eventMap: Record<string, EventName[]> = {
    clientes: [DATA_EVENTS.CLIENTES_UPDATED, DATA_EVENTS.CLIENTE_CREATED, DATA_EVENTS.CLIENTE_DELETED],
    pedidos: [DATA_EVENTS.PEDIDOS_UPDATED, DATA_EVENTS.PEDIDO_CREATED, DATA_EVENTS.PEDIDO_DELETED, DATA_EVENTS.PEDIDO_ENTREGADO],
    prendas: [DATA_EVENTS.PRENDAS_UPDATED, DATA_EVENTS.PRENDA_CREATED, DATA_EVENTS.PRENDA_DELETED],
    movimientos: [DATA_EVENTS.MOVIMIENTOS_UPDATED, DATA_EVENTS.MOVIMIENTO_CREATED, DATA_EVENTS.BASE_DIARIA_CREATED],
    abonos: [DATA_EVENTS.ABONOS_UPDATED, DATA_EVENTS.ABONO_CREATED],
    ajustes: [DATA_EVENTS.AJUSTES_UPDATED],
    acciones: [DATA_EVENTS.ACCIONES_UPDATED],
    codigos: [DATA_EVENTS.CODIGOS_UPDATED],
    cajones: [DATA_EVENTS.CAJONES_UPDATED],
    usuarios: [DATA_EVENTS.USUARIOS_UPDATED],
  };

  useDataRefresh(eventMap[dataType] || [], callback, deps);
}

/**
 * Hook que retorna una función para refrescar datos manualmente
 * y también se auto-refresca cuando se emiten eventos relevantes
 * 
 * @param fetchFn - Función para cargar datos
 * @param events - Eventos que disparan la recarga
 * @param autoRefreshOnMount - Si debe cargar datos al montar (default: true)
 */
export function useAutoRefresh<T>(
  fetchFn: () => Promise<T>,
  events: EventName[],
  autoRefreshOnMount: boolean = true
): {
  refresh: () => Promise<T | undefined>;
  loading: boolean;
  error: Error | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setLoading(false);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, [fetchFn]);

  // Cargar al montar si está habilitado
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoRefreshOnMount) {
      refresh();
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Suscribirse a eventos
  useDataRefresh(events, () => {
    refresh();
  });

  return { refresh, loading, error };
}

export default useDataRefresh;
