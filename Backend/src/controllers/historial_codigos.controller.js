const db = require('../config/conexion_db');

class HistorialCodigosController {
    // Obtener todo el historial de códigos de un pedido específico
    async obtenerHistorialPorPedido(req, res) {
        const { id_pedido } = req.params;
        try {
            const [historial] = await db.query(
                `SELECT 
                    h.id_historial_codigo,
                    h.id_pedido,
                    h.id_codigo,
                    h.id_cajon,
                    h.codigo_numero,
                    h.nombre_cajon,
                    h.accion,
                    h.fecha_registro
                 FROM historial_codigo_pedido h
                 WHERE h.id_pedido = ?
                 ORDER BY h.fecha_registro ASC`,
                [id_pedido]
            );
            res.json(historial);
        } catch (error) {
            console.error('Error al obtener historial de códigos:', error);
            res.status(500).json({ error: 'Error al obtener el historial de códigos' });
        }
    }

    // Obtener todos los registros de historial (con filtros opcionales)
    async obtenerTodoElHistorial(req, res) {
        try {
            const [historial] = await db.query(
                `SELECT 
                    h.id_historial_codigo,
                    h.id_pedido,
                    h.id_codigo,
                    h.id_cajon,
                    h.codigo_numero,
                    h.nombre_cajon,
                    h.accion,
                    h.fecha_registro,
                    c.nombre AS cliente_nombre
                 FROM historial_codigo_pedido h
                 LEFT JOIN pedido_cliente p ON h.id_pedido = p.id_pedido
                 LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
                 ORDER BY h.fecha_registro DESC
                 LIMIT 500`
            );
            res.json(historial);
        } catch (error) {
            console.error('Error al obtener todo el historial:', error);
            res.status(500).json({ error: 'Error al obtener el historial' });
        }
    }
}

module.exports = HistorialCodigosController;