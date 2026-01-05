// src/services/cajonesService.ts
import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

const API_URL = "http://localhost:3000/api/cajones";

export interface Cajon {
  id_cajon: number;
  nombre_cajon: string;
  estado: string | null;
}

export interface CajonConCodigos extends Cajon {
  cantidad_codigos: number;
  codigos_disponibles: number;
  codigos_ocupados: number;
}

export async function obtenerCajones(): Promise<Cajon[]> {
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error('Error al obtener cajones');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en obtenerCajones:", error);
    throw error;
  }
}

export async function crearCajon(nombre_cajon: string): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_cajon, estado: null }),
    });
    if (!response.ok) throw new Error('Error al crear cajón');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.CAJONES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en crearCajon:", error);
    throw error;
  }
}

export async function actualizarCajon(id_cajon: number, nombre_cajon: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_cajon}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_cajon }),
    });
    if (!response.ok) throw new Error('Error al actualizar cajón');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.CAJONES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en actualizarCajon:", error);
    throw error;
  }
}

export async function eliminarCajon(id_cajon: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_cajon}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error('Error al eliminar cajón');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.CAJONES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en eliminarCajon:", error);
    throw error;
  }
}