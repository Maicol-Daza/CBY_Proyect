// src/services/accionesService.ts
import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

const API_URL = "http://localhost:3000/api/acciones";

export interface Accion {
  id_accion: number;
  nombre_accion: string;
  precio_acciones: number;
}

export async function obtenerAcciones(): Promise<Accion[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener acciones');
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerAcciones:", error);
    throw error;
  }
}

export async function crearAccion(nombre_accion: string, precio_acciones: number): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_accion, precio_acciones }),
    });
    if (!response.ok) throw new Error('Error al crear acción');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.ACCIONES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en crearAccion:", error);
    throw error;
  }
}

export async function actualizarAccion(id_accion: number, nombre_accion: string, precio_acciones: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_accion}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_accion, precio_acciones }),
    });
    if (!response.ok) throw new Error('Error al actualizar acción');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.ACCIONES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en actualizarAccion:", error);
    throw error;
  }
}

export async function eliminarAccion(id_accion: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_accion}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error('Error al eliminar acción');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.ACCIONES_UPDATED, { id_accion });
    return result;
  } catch (error) {
    console.error("Error en eliminarAccion:", error);
    throw error;
  }
}