// src/services/accionesService.ts
const API_URL = "http://localhost:3000/api/acciones";

export interface Accion {
  id_accion: number;
  nombre_accion: string;
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

export async function crearAccion(nombre_accion: string): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_accion }),
    });
    if (!response.ok) throw new Error('Error al crear acción');
    return await response.json();
  } catch (error) {
    console.error("Error en crearAccion:", error);
    throw error;
  }
}

export async function actualizarAccion(id_accion: number, nombre_accion: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/${id_accion}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_accion }),
    });
    if (!response.ok) throw new Error('Error al actualizar acción');
    return await response.json();
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
    return await response.json();
  } catch (error) {
    console.error("Error en eliminarAccion:", error);
    throw error;
  }
}