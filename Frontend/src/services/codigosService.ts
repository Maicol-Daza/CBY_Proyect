// src/services/codigosService.ts
import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

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

// Crear un nuevo código
export async function crearCodigo(codigo_numero: string, id_cajon: number): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo_numero, id_cajon }),
    });
    if (!response.ok) throw new Error('Error al crear código');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.CODIGOS_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en crearCodigo:", error);
    throw error;
  }
}

// Eliminar un código
export async function eliminarCodigo(id_codigo: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_codigo}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error('Error al eliminar código');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.CODIGOS_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en eliminarCodigo:", error);
    throw error;
  }
}

// Obtener códigos por cajón
export async function obtenerCodigosPorCajon(id_cajon: number): Promise<Codigo[]> {
  try {
    const codigos = await obtenerCodigos();
    return codigos.filter(c => c.id_cajon === id_cajon);
  } catch (error) {
    console.error("Error en obtenerCodigosPorCajon:", error);
    throw error;
  }
}