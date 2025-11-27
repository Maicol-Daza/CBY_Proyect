// src/services/codigosService.ts
const API_URL = "http://localhost:3000/api/codigos";

export interface Codigo {
  id_codigo: number;
  codigo_numero: string;
  id_cajon: number;
  nombre_cajon: string;
  estado_cajon: string | null;
  id_pedido: number | null;  
  estado: string;        
}

export async function obtenerCodigos(): Promise<Codigo[]> {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Error al obtener códigos");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en obtenerCodigos:", error);
    throw error;
  }
}

// Función para obtener solo códigos disponibles
export async function obtenerCodigosDisponibles(): Promise<Codigo[]> {
  try {
    const response = await fetch(`${API_URL}/disponibles`);

    if (!response.ok) {
      throw new Error("Error al obtener códigos disponibles");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en obtenerCodigosDisponibles:", error);
    throw error;
  }
}