// src/services/ajustesService.ts
import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

const API_URL = "http://localhost:3000/api/ajustes";

export interface Ajuste {
  id_ajuste: number;
  nombre_ajuste: string;
  precio_ajuste: number;
}

export async function obtenerAjustes(): Promise<Ajuste[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error en obtenerAjustes');
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerAjustes:", error);
    throw error;
  }
}

export async function crearAjuste(nombre_ajuste: string, precio_ajuste: number): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_ajuste, precio_ajuste }),
    });
    if (!response.ok) throw new Error('Error al crear ajuste');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.AJUSTES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en crearAjuste:", error);
    throw error;
  }
}

export async function actualizarAjuste(id_ajuste: number, nombre_ajuste: string, precio_ajuste: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_ajuste}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_ajuste, precio_ajuste }),
    });
    if (!response.ok) throw new Error('Error al actualizar ajuste');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.AJUSTES_UPDATED, result);
    return result;
  } catch (error) {
    console.error("Error en actualizarAjuste:", error);
    throw error;
  }
}

export async function eliminarAjuste(id_ajuste: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_ajuste}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error('Error al eliminar ajuste');
    const result = await response.json();
    emitDataEvent(DATA_EVENTS.AJUSTES_UPDATED, { id_ajuste });
    return result;
  } catch (error) {
    console.error("Error en eliminarAjuste:", error);
    throw error;
  }
}