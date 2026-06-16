// src/services/pedidosProximosService.js
// Servicio para obtener pedidos próximos a entregar (alertas de fechas próximas)

const API_URL = "http://localhost:3000/api/pedidos";

/**
 * Obtiene todos los pedidos y filtra los que están próximos a entregar
 * @param {number} diasLimite - Número de días hacia adelante para considerar "próximo"
 * @returns {Promise<Array>} Array de pedidos próximos a entregar
 */
export async function obtenerPedidosProximos(diasLimite = 3) {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Error al obtener pedidos");
    }

    const pedidos = await response.json();
    
    // Fecha actual sin horas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Fecha límite (hoy + diasLimite)
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(fechaLimite.getDate() + diasLimite);

    const pedidosProximos = pedidos.filter((pedido) => {
      // Solo pedidos no entregados, no cancelados, no reembolsados
      if (
        pedido.estado === "entregado" ||
        pedido.estado === "cancelado" ||
        pedido.estado === "reembolso"
      ) {
        return false;
      }

      // Validar que tenga fecha de entrega
      if (!pedido.fecha_entrega) return false;

      const fechaEntrega = new Date(pedido.fecha_entrega);
      fechaEntrega.setHours(0, 0, 0, 0);

      // Incluir pedidos cuya fecha de entrega esté entre hoy y fecha límite
      // También incluir pedidos vencidos (fecha pasada)
      return fechaEntrega <= fechaLimite;
    });

    // Ordenar por fecha de entrega (más urgentes primero)
    pedidosProximos.sort((a, b) => {
      const fechaA = new Date(a.fecha_entrega || 0);
      const fechaB = new Date(b.fecha_entrega || 0);
      return fechaA - fechaB;
    });

    return pedidosProximos;
  } catch (error) {
    console.error("Error al obtener pedidos próximos:", error);
    return [];
  }
}

/**
 * Calcula los días restantes o de vencimiento
 * @param {string} fechaEntrega - Fecha de entrega del pedido (ISO o YYYY-MM-DD)
 * @returns {{ dias: number, vencido: boolean, hoy: boolean }}
 */
export function calcularDiasRestantes(fechaEntrega) {
  if (!fechaEntrega) return { dias: 0, vencido: false, hoy: false };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const entrega = new Date(fechaEntrega);
  entrega.setHours(0, 0, 0, 0);

  const diffTime = entrega.getTime() - hoy.getTime();
  const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    dias: Math.abs(diffDias),
    vencido: diffDias < 0,
    hoy: diffDias === 0,
    restantes: diffDias,
  };
}

/**
 * Clasifica la urgencia de un pedido según su fecha de entrega
 * @param {string} fechaEntrega
 * @returns {'vencido' | 'hoy' | 'manana' | 'proximo' | 'normal'}
 */
export function clasificarUrgencia(fechaEntrega) {
  const info = calcularDiasRestantes(fechaEntrega);
  if (info.vencido) return 'vencido';
  if (info.hoy) return 'hoy';
  if (info.restantes === 1) return 'manana';
  if (info.restantes <= 3) return 'proximo';
  return 'normal';
}