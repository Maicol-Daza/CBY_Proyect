// src/services/ajustesAccionService.ts
const API_URL = "http://localhost:3000/api/ajustes_accion";

export interface AjusteAccion {
  id_ajuste_accion: number;
  id_ajuste: number;
  id_accion: number;
  precio: number;
  nombre_ajuste: string;
  nombre_accion: string;
  descripcion_combinacion?: string;
}

export async function obtenerAjustesAccion(): Promise<AjusteAccion[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener combinaciones');
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerAjustesAccion:", error);
    throw error;
  }
}

export async function crearAjusteAccion(
  id_ajuste: number, 
  id_accion: number, 
  precio: number,
  descripcion_combinacion?: string
): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_ajuste, id_accion, precio, descripcion_combinacion }),
    });
    if (!response.ok) throw new Error('Error al crear combinación');
    return await response.json();
  } catch (error) {
    console.error("Error en crearAjusteAccion:", error);
    throw error;
  }
}

export async function eliminarAjusteAccion(id: number): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error('Error al eliminar combinación');
    return await response.json();
  } catch (error) {
    console.error("Error en eliminarAjusteAccion:", error);
    throw error;
  }
}