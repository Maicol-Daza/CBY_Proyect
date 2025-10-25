const db = require('../config/conexion_db');

class CodigosController {
    // Obtener todos los códigos con información del cajón
    async obtenerCodigos(req, res) {
        try {
            const [codigos] = await db.query(`
        SELECT 
          c.id_codigo,
          c.codigo_numero,
          c.id_cajon,
          cj.nombre_cajon AS nombre_cajon,
          cj.estado AS estado_cajon
        FROM codigos c
        LEFT JOIN cajones cj ON c.id_cajon = cj.id_cajon
      `);

            res.json(codigos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los códigos' });
        }
    }

    // Obtener un código por ID
    async obtenerCodigoPorId(req, res) {
        const { id } = req.params;
        try {
            const [codigo] = await db.query(
                `
        SELECT 
          c.id_codigo,
          c.codigo_numero,
          c.id_cajon,
          cj.nombre_cajon AS nombre_cajon,
          cj.estado AS estado_cajon
        FROM codigos c
        LEFT JOIN cajones cj ON c.id_cajon = cj.id_cajon
        WHERE c.id_codigo = ?
        `,
                [id]
            );

            if (codigo.length === 0) {
                return res.status(404).json({ error: 'Código no encontrado' });
            }

            res.json(codigo[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el código' });
        }
    }

    // Agregar un nuevo código
    async agregarCodigo(req, res) {
        const { codigo_numero, id_cajon } = req.body;
        try {
            await db.query(
                `INSERT INTO codigos (codigo_numero, id_cajon) VALUES (?, ?)`,
                [codigo_numero, id_cajon || null]
            );
            res.json({ mensaje: 'Código agregado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al agregar el código' });
        }
    }

    // Actualizar código
    async actualizarCodigo(req, res) {
        const { id } = req.params;
        const { codigo_numero, id_cajon } = req.body;
        try {
            await db.query(
                `UPDATE codigos SET codigo_numero = ?, id_cajon = ? WHERE id_codigo = ?`,
                [codigo_numero, id_cajon || null, id]
            );
            res.json({ mensaje: 'Código actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el código' });
        }
    }

    // Eliminar código
    async eliminarCodigo(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM codigos WHERE id_codigo = ?`, [id]);
            res.json({ mensaje: 'Código eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el código' });
        }
    }
}

module.exports = CodigosController;
