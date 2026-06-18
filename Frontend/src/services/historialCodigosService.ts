const API_URL = "http://localhost:3000/api";

export interface HistorialCodigo {
  id_historial_codigo: number;
  id_pedido: number;
  id_codigo: number;
  id_cajon: number;
  codigo_numero: string;
  nombre_cajon: string;
  accion: string;
  fecha_registro: string;
}

export const obtenerHistorialCodigosPorPedido = async (id_pedido: number): Promise<HistorialCodigo[]> => {
  try {
    const response = await fetch(`${API_URL}/historial_codigos/pedido/${id_pedido}`);
    if (!response.ok) {
      throw new Error("Error al obtener historial de códigos");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error en obtenerHistorialCodigosPorPedido:", error);
    return [];
  }
};