import { emitDataEvent, DATA_EVENTS } from '../utils/eventEmitter';

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
    const result = await response.json();
    // Emitir eventos de actualización
    emitDataEvent(DATA_EVENTS.MOVIMIENTO_CREATED, result);
    emitDataEvent(DATA_EVENTS.MOVIMIENTOS_UPDATED);
    return result;
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

// ============ FUNCIONES PARA BASE DE CAJA DIARIA ============

const DESCRIPCION_BASE_DIARIA = "BASE_CAJA_DIARIA";

// Formatear fecha local a string YYYY-MM-DD
const formatearFechaLocal = (fecha: Date): string => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const día = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
};

// Verificar si existe la base de caja para el día actual
export async function verificarBaseDiaria(): Promise<{ existe: boolean; monto: number }> {
  try {
    const movimientos = await obtenerMovimientos();
    const hoy = formatearFechaLocal(new Date());
    
    const baseDiaria = movimientos.find((mov: Movimiento) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const fechaMovStr = formatearFechaLocal(fechaMov);
      return fechaMovStr === hoy && 
             mov.tipo === "entrada" && 
             mov.descripcion.includes(DESCRIPCION_BASE_DIARIA);
    });
    
    return {
      existe: !!baseDiaria,
      monto: baseDiaria ? Number(baseDiaria.monto) : 0
    };
  } catch (error) {
    console.error("Error al verificar base diaria:", error);
    return { existe: false, monto: 0 };
  }
}

// Crear la base de caja diaria (solo admin)
export async function crearBaseDiaria(monto: number, id_usuario: number) {
  try {
    // Verificar si ya existe base para hoy
    const { existe } = await verificarBaseDiaria();
    if (existe) {
      throw new Error("Ya existe una base de caja para el día de hoy");
    }
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "entrada",
        descripcion: `${DESCRIPCION_BASE_DIARIA} - Base inicial del día`,
        monto: monto,
        fecha_movimiento: new Date().toISOString(),
        id_usuario: id_usuario
      })
    });
    
    if (!response.ok) throw new Error("Error al crear base diaria");
    const result = await response.json();
    // Emitir eventos de actualización
    emitDataEvent(DATA_EVENTS.BASE_DIARIA_CREATED, result);
    emitDataEvent(DATA_EVENTS.MOVIMIENTOS_UPDATED);
    return result;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}