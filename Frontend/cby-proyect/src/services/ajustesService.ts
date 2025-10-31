// src/services/ajustesService.ts
const API_URL = "http://localhost:3000/api/ajustes";

export interface Ajuste {
  id_ajuste: number;
  nombre_ajuste: string;
}

export async function obtenerAjustes(): Promise<Ajuste[]> {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener ajustes');
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerAjustes:", error);
    throw error;
  }
}

export async function crearAjuste(nombre_ajuste: string): Promise<any> {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre_ajuste }),
    });
    if (!response.ok) throw new Error('Error al crear ajuste');
    return await response.json();
  } catch (error) {
    console.error("Error en crearAjuste:", error);
    throw error;
  }
}