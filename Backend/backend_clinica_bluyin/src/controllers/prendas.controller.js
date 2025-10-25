const db = require('../config/conexion_db');

class PrendasController {
    // Obtener todas las prendas con datos del pedido
    async obtenerPrendas(req, res) {
        try {
            const [resultados] = await db.query(`
        SELECT 
          pr.id_prenda,
          pr.tipo,
          pr.descripcion,
          pr.id_pedido,
          p.fecha_pedido,
          p.fecha_entrega,
          p.estado AS estado_pedido
        FROM prendas pr
        LEFT JOIN pedido_cliente p ON pr.id_pedido = p.id_pedido
        ORDER BY pr.id_prenda DESC
      `);
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las prendas' });
        }
    }

    // Obtener prenda por ID
    async obtenerPrendaPorId(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query(
                `
        SELECT 
          pr.id_prenda,
          pr.tipo,
          pr.descripcion,
          pr.id_pedido,
          p.fecha_pedido,
          p.fecha_entrega,
          p.estado AS estado_pedido
        FROM prendas pr
        LEFT JOIN pedido_cliente p ON pr.id_pedido = p.id_pedido
        WHERE pr.id_prenda = ?
        `,
                [id]
            );

            if (resultado.length === 0) {
                return res.status(404).json({ error: 'Prenda no encontrada' });
            }

            res.json(resultado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la prenda' });
        }
    }

    // Crear nueva prenda
    async crearPrenda(req, res) {
        const { id_pedido, tipo, descripcion } = req.body;
        try {
            await db.query(
                `INSERT INTO prendas (id_pedido, tipo, descripcion)
         VALUES (?, ?, ?)`,
                [id_pedido || null, tipo, descripcion]
            );

            res.json({ mensaje: 'Prenda creada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear la prenda' });
        }
    }

    // Actualizar prenda
    async actualizarPrenda(req, res) {
        const { id } = req.params;
        const { id_pedido, tipo, descripcion } = req.body;
        try {
            await db.query(
                `UPDATE prendas 
         SET id_pedido = ?, tipo = ?, descripcion = ?
         WHERE id_prenda = ?`,
                [id_pedido || null, tipo, descripcion, id]
            );

            res.json({ mensaje: 'Prenda actualizada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar la prenda' });
        }
    }

    // Eliminar prenda
    async eliminarPrenda(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM prendas WHERE id_prenda = ?`, [id]);
            res.json({ mensaje: 'Prenda eliminada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la prenda' });
        }
    }

    // Obtener prendas por pedido (útil para ver todas las prendas de un pedido)
    async obtenerPrendasPorPedido(req, res) {
        const { id_pedido } = req.params;
        try {
            const [resultados] = await db.query(
                `
        SELECT 
          id_prenda,
          tipo,
          descripcion
        FROM prendas
        WHERE id_pedido = ?
        ORDER BY id_prenda DESC
        `,
                [id_pedido]
            );
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las prendas del pedido' });
        }
    }
}

module.exports = PrendasController;
