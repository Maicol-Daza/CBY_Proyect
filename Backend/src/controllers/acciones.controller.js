const db = require('../config/conexion_db');

class AccionesController {
    // Obtener todas las acciones
    async obtenerAcciones(req, res) {
        try {
            const [acciones] = await db.query(
                `SELECT id_accion, nombre_accion FROM acciones`
            );
            res.json(acciones);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las acciones' });
        }
    }

    // Obtener acción por ID
    async obtenerAccionPorId(req, res) {
        const { id } = req.params;
        try {
            const [accion] = await db.query(
                `SELECT id_accion, nombre_accion FROM acciones WHERE id_accion = ?`,
                [id]
            );

            if (accion.length === 0) {
                return res.status(404).json({ error: 'Acción no encontrada' });
            }

            res.json(accion[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la acción' });
        }
    }

    // Agregar nueva acción
    async agregarAccion(req, res) {
        const { nombre_accion, precio_acciones } = req.body;
        try {
            await db.query(
                `INSERT INTO acciones (nombre_accion, precio_acciones) VALUES (?, ?)`,
                [nombre_accion, precio_acciones]
            );
            res.json({ mensaje: 'Acción agregada correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res
                    .status(400)
                    .json({ error: 'El nombre de la acción ya existe' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al agregar la acción' });
        }
    }

    // Actualizar acción
    async actualizarAccion(req, res) {
        const { id } = req.params;
        const { nombre_accion, precio_acciones } = req.body;
        try {
            await db.query(
                `UPDATE acciones SET nombre_accion = ?, precio_acciones = ? WHERE id_accion = ?`,
                [nombre_accion, precio_acciones, id]
            );
            res.json({ mensaje: 'Acción actualizada correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res
                    .status(400)
                    .json({ error: 'El nombre de la acción ya existe' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar la acción' });
        }
    }

    // Eliminar acción
    async eliminarAccion(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM acciones WHERE id_accion = ?`, [id]);
            res.json({ mensaje: 'Acción eliminada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la acción' });
        }
    }
}

module.exports = AccionesController;
