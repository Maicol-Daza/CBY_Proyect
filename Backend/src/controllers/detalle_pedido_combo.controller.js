const db = require('../config/conexion_db');

class DetallePedidoComboController {
    // Obtener todos los detalles del combo con datos relacionados
    async obtenerDetalles(req, res) {
        try {
            const [resultados] = await db.query(`
        SELECT 
          dc.id_detalle_combo,
          dc.descripcion,
          dc.precio,
          pr.id_prenda,
          pr.tipo AS tipo_prenda,
          aa.id_ajuste_accion,
          a.nombre_accion,
          aj.nombre_ajuste
        FROM detalle_pedido_combo dc
        LEFT JOIN prendas pr ON dc.id_prenda = pr.id_prenda
        LEFT JOIN ajustes_accion aa ON dc.id_ajuste_accion = aa.id_ajuste_accion
        LEFT JOIN ajustes aj ON aa.id_ajuste = aj.id_ajuste
        LEFT JOIN acciones a ON aa.id_accion = a.id_accion
        ORDER BY dc.id_detalle_combo DESC
      `);
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los detalles del combo' });
        }
    }

    // Obtener un detalle por ID
    async obtenerDetallePorId(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query(
                `
        SELECT 
          dc.id_detalle_combo,
          dc.descripcion,
          dc.precio,
          pr.id_prenda,
          pr.tipo AS tipo_prenda,
          aa.id_ajuste_accion,
          a.nombre_accion,
          aj.nombre_ajuste
        FROM detalle_pedido_combo dc
        LEFT JOIN prendas pr ON dc.id_prenda = pr.id_prenda
        LEFT JOIN ajustes_accion aa ON dc.id_ajuste_accion = aa.id_ajuste_accion
        LEFT JOIN ajustes aj ON aa.id_ajuste = aj.id_ajuste
        LEFT JOIN acciones a ON aa.id_accion = a.id_accion
        WHERE dc.id_detalle_combo = ?
        `,
                [id]
            );

            if (resultado.length === 0) {
                return res.status(404).json({ error: 'Detalle no encontrado' });
            }

            res.json(resultado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el detalle del combo' });
        }
    }

    // Crear un nuevo detalle
    async crearDetalle(req, res) {
        const { id_prenda, id_ajuste_accion, descripcion, precio } = req.body;

        try {
            await db.query(
                `
        INSERT INTO detalle_pedido_combo (id_prenda, id_ajuste_accion, descripcion, precio)
        VALUES (?, ?, ?, ?)
        `,
                [id_prenda, id_ajuste_accion, descripcion, precio]
            );

            res.json({ mensaje: 'Detalle de combo creado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el detalle del combo' });
        }
    }

    // Actualizar un detalle
    async actualizarDetalle(req, res) {
        const { id } = req.params;
        const { id_prenda, id_ajuste_accion, descripcion, precio } = req.body;

        try {
            await db.query(
                `
        UPDATE detalle_pedido_combo
        SET id_prenda = ?, id_ajuste_accion = ?, descripcion = ?, precio = ?
        WHERE id_detalle_combo = ?
        `,
                [id_prenda, id_ajuste_accion, descripcion, precio, id]
            );

            res.json({ mensaje: 'Detalle de combo actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el detalle del combo' });
        }
    }

    // Eliminar un detalle
    async eliminarDetalle(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM detalle_pedido_combo WHERE id_detalle_combo = ?`, [id]);
            res.json({ mensaje: 'Detalle de combo eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el detalle del combo' });
        }
    }

    // Obtener detalles por prenda específica
    async obtenerDetallesPorPrenda(req, res) {
        const { id_prenda } = req.params;
        try {
            const [resultados] = await db.query(
                `
        SELECT 
          dc.id_detalle_combo,
          dc.descripcion,
          dc.precio,
          aa.id_ajuste_accion,
          a.nombre_accion,
          aj.nombre_ajuste
        FROM detalle_pedido_combo dc
        LEFT JOIN ajustes_accion aa ON dc.id_ajuste_accion = aa.id_ajuste_accion
        LEFT JOIN ajustes aj ON aa.id_ajuste = aj.id_ajuste
        LEFT JOIN acciones a ON aa.id_accion = a.id_accion
        WHERE dc.id_prenda = ?
        ORDER BY dc.id_detalle_combo DESC
        `,
                [id_prenda]
            );
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los detalles por prenda' });
        }
    }
}

module.exports = DetallePedidoComboController;
