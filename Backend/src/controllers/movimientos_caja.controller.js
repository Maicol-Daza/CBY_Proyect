const db = require('../config/conexion_db');

class MovimientosCajaController {
    async obtenerMovimientos(req, res) {
        try {
            const [movimientos] = await db.query(`
                SELECT 
                  m.id_movimiento_caja,
                  m.fecha_movimiento,
                  m.tipo,
                  m.descripcion,
                  m.monto,
                  m.id_pedido,
                  p.fecha_pedido,
                  p.fecha_entrega,
                  m.id_usuario,
                  u.nombre AS usuario_nombre
                FROM movimientos_caja m
                LEFT JOIN pedido_cliente p ON m.id_pedido = p.id_pedido
                LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
                ORDER BY m.fecha_movimiento DESC, m.id_movimiento_caja DESC
            `);

            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los movimientos de caja' });
        }
    }

    async obtenerMovimientoPorId(req, res) {
        const { id } = req.params;
        try {
            const [movimiento] = await db.query(
                `SELECT * FROM movimientos_caja WHERE id_movimiento_caja = ?`,
                [id]
            );

            if (movimiento.length === 0) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }

            res.json(movimiento[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el movimiento' });
        }
    }

    async crearMovimiento(req, res) {
        const { id_pedido, tipo, descripcion, monto, id_usuario } = req.body;

        if (!tipo || !descripcion || !monto) {
            return res.status(400).json({ error: 'Campos requeridos: tipo, descripcion, monto' });
        }

        try {
            const [resultado] = await db.query(
                `INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
                 VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?, ?)`,
                [id_pedido || null, tipo, descripcion, monto, id_usuario || 1]
            );

            res.status(201).json({ 
                id_movimiento_caja: resultado.insertId,
                message: 'Movimiento creado exitosamente'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el movimiento', detalle: error.message });
        }
    }

    async actualizarMovimiento(req, res) {
        const { id } = req.params;
        const { id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario } = req.body;

        try {
            const [resultado] = await db.query(
                `UPDATE movimientos_caja 
                 SET id_pedido = ?, fecha_movimiento = ?, tipo = ?, descripcion = ?, monto = ?, id_usuario = ?
                 WHERE id_movimiento_caja = ?`,
                [id_pedido || null, fecha_movimiento, tipo, descripcion, monto, id_usuario || 1, id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }

            res.json({ message: 'Movimiento actualizado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el movimiento' });
        }
    }

    async eliminarMovimiento(req, res) {
        const { id } = req.params;

        try {
            const [resultado] = await db.query(
                `DELETE FROM movimientos_caja WHERE id_movimiento_caja = ?`,
                [id]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }

            res.json({ message: 'Movimiento eliminado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el movimiento' });
        }
    }

    async obtenerPorTipo(req, res) {
        const { tipo } = req.params;

        if (!['entrada', 'salida'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo debe ser "entrada" o "salida"' });
        }

        try {
            const [movimientos] = await db.query(
                `SELECT * FROM movimientos_caja WHERE tipo = ? ORDER BY fecha_movimiento DESC`,
                [tipo]
            );

            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener movimientos por tipo' });
        }
    }

    async obtenerPorPedido(req, res) {
        const { id_pedido } = req.params;

        try {
            const [movimientos] = await db.query(
                `SELECT * FROM movimientos_caja WHERE id_pedido = ? ORDER BY fecha_movimiento DESC`,
                [id_pedido]
            );

            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener movimientos del pedido' });
        }
    }
}

module.exports = MovimientosCajaController;
