// src/services/pedidosService.ts
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

    return await response.json();
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
