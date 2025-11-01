const db = require('../config/conexion_db');

class MovimientosCajaController {
    // Obtener todos los movimientos de caja (con datos del pedido y usuario)
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

    // Obtener un movimiento específico por ID
    async obtenerMovimientoPorId(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query(
                `
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
        WHERE m.id_movimiento_caja = ?
        `,
                [id]
            );

            if (resultado.length === 0) {
                return res.status(404).json({ error: 'Movimiento no encontrado' });
            }

            res.json(resultado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el movimiento de caja' });
        }
    }

    // Crear un nuevo movimiento
    async crearMovimiento(req, res) {
        const { id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario } = req.body;

        try {
            await db.query(
                `
        INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
                [id_pedido || null, fecha_movimiento, tipo, descripcion, monto, id_usuario || null]
            );

            res.json({ mensaje: 'Movimiento de caja registrado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al registrar el movimiento de caja' });
        }
    }

    // Actualizar un movimiento existente
    async actualizarMovimiento(req, res) {
        const { id } = req.params;
        const { id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario } = req.body;

        try {
            await db.query(
                `
        UPDATE movimientos_caja
        SET id_pedido = ?, fecha_movimiento = ?, tipo = ?, descripcion = ?, monto = ?, id_usuario = ?
        WHERE id_movimiento_caja = ?
        `,
                [id_pedido || null, fecha_movimiento, tipo, descripcion, monto, id_usuario || null, id]
            );

            res.json({ mensaje: 'Movimiento de caja actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el movimiento de caja' });
        }
    }

    // Eliminar un movimiento
    async eliminarMovimiento(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM movimientos_caja WHERE id_movimiento_caja = ?', [id]);
            res.json({ mensaje: 'Movimiento de caja eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el movimiento de caja' });
        }
    }

    // Obtener movimientos por tipo (entrada/salida)
    async obtenerPorTipo(req, res) {
        const { tipo } = req.params;
        try {
            const [movimientos] = await db.query(
                `
        SELECT 
          m.id_movimiento_caja,
          m.fecha_movimiento,
          m.tipo,
          m.descripcion,
          m.monto,
          m.id_pedido,
          m.id_usuario,
          u.nombre AS usuario_nombre
        FROM movimientos_caja m
        LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.tipo = ?
        ORDER BY m.fecha_movimiento DESC
        `,
                [tipo]
            );

            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al filtrar los movimientos por tipo' });
        }
    }

    // Obtener movimientos por pedido
    async obtenerPorPedido(req, res) {
        const { id_pedido } = req.params;
        try {
            const [movimientos] = await db.query(
                `
        SELECT 
          m.id_movimiento_caja,
          m.fecha_movimiento,
          m.tipo,
          m.descripcion,
          m.monto,
          m.id_usuario,
          u.nombre AS usuario_nombre
        FROM movimientos_caja m
        LEFT JOIN usuarios u ON m.id_usuario = u.id_usuario
        WHERE m.id_pedido = ?
        ORDER BY m.fecha_movimiento DESC
        `,
                [id_pedido]
            );

            res.json(movimientos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los movimientos del pedido' });
        }
    }
}

module.exports = MovimientosCajaController;
