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

export async function crearPedidoCompleto(pedidoData: PedidoCompleto) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedidoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Error al guardar el pedido");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en crearPedidoCompleto:", error);
    throw error;
  }
}
