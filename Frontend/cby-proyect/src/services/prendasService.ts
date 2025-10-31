// src/services/prendasService.ts
const API_URL = "http://localhost:3000/api/prendas";

export interface Prenda {
  tipo: string;
  cantidad: number;
  arreglos: ArregloSeleccionado[];
  descripcion: string;
}

export interface ArregloSeleccionado {
  precio: number;
  tipo: 'combinacion' | 'ajuste' | 'accion';
  id_ajuste_accion?: number;
  nombre_ajuste?: string;
  nombre_accion?: string;
}

export interface PrendaGuardar {
  id_pedido: number;
  tipo: string;
  descripcion: string;
  cantidad: number;
  arreglos: ArregloSeleccionado[];
}

// Este método ya no es necesario si usamos el endpoint de pedidos
export const guardarPrenda = async (prenda: PrendaGuardar) => {
  try {
    const response = await fetch(`${API_URL}/completa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prenda)
    });

    if (!response.ok) {
      throw new Error('Error al guardar la prenda con sus arreglos');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en guardarPrenda:', error);
    throw error;
  }
};