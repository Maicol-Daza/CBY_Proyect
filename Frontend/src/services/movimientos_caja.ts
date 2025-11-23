const API_URL = "http://localhost:3000/api/movimientos_caja"; // Cambia 3000 si es otro puerto

export interface Movimiento {
  id_movimiento_caja: number;
  fecha_movimiento: string;
  tipo: "entrada" | "salida";
  descripcion: string;
  monto: number;
  id_pedido?: number;
  usuario_nombre?: string;
  id_usuario?: number;
}

export async function obtenerMovimientos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Error al obtener movimientos");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function crearMovimiento(movimiento: {
  tipo: "entrada" | "salida";
  descripcion: string;
  monto: number;
  id_pedido?: number;
  id_usuario?: number;
}) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...movimiento,
        fecha_movimiento: new Date().toISOString(),
        id_usuario: movimiento.id_usuario // Usar el id_usuario pasado, no 1
      })
    });
    if (!response.ok) throw new Error("Error al crear movimiento");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function obtenerMovimientosPorTipo(tipo: "entrada" | "salida") {
  try {
    const response = await fetch(`${API_URL}/tipo/${tipo}`);
    if (!response.ok) throw new Error("Error al obtener movimientos");
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}