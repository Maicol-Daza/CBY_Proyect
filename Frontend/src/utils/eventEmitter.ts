/**
 * Sistema de eventos global para actualización dinámica de datos
 * Permite que los componentes se suscriban a eventos de cambio y se actualicen automáticamente
 */

type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Suscribirse a un evento
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Retorna función para desuscribirse
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emitir un evento
   */
  emit(event: string, ...args: any[]): void {
    console.log(`[EventEmitter] Emitiendo evento: ${event}`, args.length > 0 ? args : '');
    const callbacks = this.events.get(event);
    if (callbacks && callbacks.size > 0) {
      console.log(`[EventEmitter] ${callbacks.size} suscriptores para ${event}`);
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error en callback del evento ${event}:`, error);
        }
      });
    } else {
      console.log(`[EventEmitter] No hay suscriptores para ${event}`);
    }
  }

  /**
   * Suscribirse a un evento solo una vez
   */
  once(event: string, callback: EventCallback): () => void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    return this.on(event, onceCallback);
  }

  /**
   * Eliminar todos los listeners de un evento
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Instancia global del EventEmitter
export const dataEvents = new EventEmitter();

// Constantes de eventos para mantener consistencia
export const DATA_EVENTS = {
  // Clientes
  CLIENTES_UPDATED: 'clientes:updated',
  CLIENTE_CREATED: 'clientes:created',
  CLIENTE_DELETED: 'clientes:deleted',
  
  // Pedidos
  PEDIDOS_UPDATED: 'pedidos:updated',
  PEDIDO_CREATED: 'pedidos:created',
  PEDIDO_DELETED: 'pedidos:deleted',
  PEDIDO_ENTREGADO: 'pedidos:entregado',
  
  // Prendas
  PRENDAS_UPDATED: 'prendas:updated',
  PRENDA_CREATED: 'prendas:created',
  PRENDA_DELETED: 'prendas:deleted',
  
  // Caja / Movimientos
  MOVIMIENTOS_UPDATED: 'movimientos:updated',
  MOVIMIENTO_CREATED: 'movimientos:created',
  BASE_DIARIA_CREATED: 'movimientos:baseDiaria',
  
  // Abonos
  ABONOS_UPDATED: 'abonos:updated',
  ABONO_CREATED: 'abonos:created',
  
  // Ajustes y Acciones
  AJUSTES_UPDATED: 'ajustes:updated',
  ACCIONES_UPDATED: 'acciones:updated',
  COMBINACIONES_UPDATED: 'combinaciones:updated',
  
  // Códigos y Cajones
  CODIGOS_UPDATED: 'codigos:updated',
  CAJONES_UPDATED: 'cajones:updated',
  
  // Usuarios
  USUARIOS_UPDATED: 'usuarios:updated',
  
  // Evento general para refrescar todo
  REFRESH_ALL: 'app:refreshAll',
} as const;

// Función helper para emitir eventos fácilmente
export const emitDataEvent = (event: string, data?: any) => {
  console.log(`[DataEvent] Emitiendo: ${event}`, data);
  dataEvents.emit(event, data);
};

export default dataEvents;
