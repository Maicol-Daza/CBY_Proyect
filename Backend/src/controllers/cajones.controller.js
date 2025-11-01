const db = require('../config/conexion_db');

class CajonesController {
    // Obtener todos los cajones
    async obtenerCajones(req, res) {
        try {
            const [cajones] = await db.query(
                `SELECT id_cajon, nombre_cajon, estado FROM cajones`
            );
            res.json(cajones);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener cajones' });
        }
    }

    // Obtener cajón por ID
    async obtenerCajonPorId(req, res) {
        const { id } = req.params;
        try {
            const [cajon] = await db.query(
                `SELECT id_cajon, nombre_cajon, estado FROM cajones WHERE id_cajon = ?`,
                [id]
            );

            if (cajon.length === 0) {
                return res.status(404).json({ error: 'Cajón no encontrado' });
            }

            res.json(cajon[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener cajón' });
        }
    }

    // Agregar nuevo cajón
    async agregarCajon(req, res) {
        const { nombre_cajon, estado } = req.body;
        try {
            await db.query(
                `INSERT INTO cajones (nombre_cajon, estado) VALUES (?, ?)`,
                [nombre_cajon, estado || null]
            );
            res.json({ mensaje: 'Cajón agregado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al agregar cajón' });
        }
    }

    // Actualizar cajón
    async actualizarCajon(req, res) {
        const { id } = req.params;
        const { nombre_cajon, estado } = req.body;
        try {
            await db.query(
                `UPDATE cajones SET nombre_cajon = ?, estado = ? WHERE id_cajon = ?`,
                [nombre_cajon, estado, id]
            );
            res.json({ mensaje: 'Cajón actualizado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar cajón' });
        }
    }

    // Eliminar cajón
    async eliminarCajon(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM cajones WHERE id_cajon = ?`, [id]);
            res.json({ mensaje: 'Cajón eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar cajón' });
        }
    }
}

module.exports = CajonesController;
