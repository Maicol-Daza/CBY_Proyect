// src/services/pedidosService.ts
import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

const API_URL = "http://localhost:3000/api/pedidos"; // backend Express

export interface Cliente {
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  email: string;
}

export interface Pedido {
  fechaInicio: string;
  fechaEntrega: string;
  estado: string;
  observaciones: string;
  abonoInicial: number | string;
  totalPedido: number;
  saldoPendiente: number;
}

export interface Prenda {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface PedidoCompleto {
  cliente: Cliente;
  pedido: Pedido;
  id_codigo: number;
  prendas: Prenda[];
}

export async function crearPedido(cliente: Cliente, pedido: Pedido) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, pedido }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al guardar el pedido");
    }

    // Emitir eventos de actualización
    emitDataEvent(DATA_EVENTS.PEDIDO_CREATED, data);
    emitDataEvent(DATA_EVENTS.PEDIDOS_UPDATED);
    emitDataEvent(DATA_EVENTS.CLIENTES_UPDATED); // También puede crear cliente
    return data;
  } catch (error) {
    console.error("Error en crearPedido:", error);
    throw error;
  }
}

export async function crearPedidoCompleto(pedidoData: PedidoCompleto & { id_usuario?: number }) {
  try {
    console.log("Enviando al backend:", pedidoData); // DEBUG
    
    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoData)  // Enviar todo incluyendo id_usuario
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al crear pedido");
    }

    const result = await response.json();
    // Emitir eventos de actualización
    emitDataEvent(DATA_EVENTS.PEDIDO_CREATED, result);
    emitDataEvent(DATA_EVENTS.PEDIDOS_UPDATED);
    emitDataEvent(DATA_EVENTS.CLIENTES_UPDATED); // También puede crear cliente
    emitDataEvent(DATA_EVENTS.CODIGOS_UPDATED); // Actualiza códigos disponibles
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function obtenerPedidos() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) {
      throw new Error("Error al obtener pedidos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en obtenerPedidos:", error);
    throw error;
  }
}

export async function contarPedidos() {
  try {
    const pedidos = await obtenerPedidos();
    return pedidos.length || 0;
  } catch (error) {
    console.error("Error en contarPedidos:", error);
    return 0;
  }
}
