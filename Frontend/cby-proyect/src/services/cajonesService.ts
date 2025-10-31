// src/services/cajonesService.ts
const API_URL = "http://localhost:3000/api/cajones";

export interface Cajon {
  id_cajon: number;
  nombre_cajon: string;
  estado: string | null;
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