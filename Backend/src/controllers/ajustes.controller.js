const db = require('../config/conexion_db');

class AjustesController {
    // Obtener todos los ajustes
    async obtenerAjustes(req, res) {
        try {
            const [ajustes] = await db.query(
                `SELECT id_ajuste, nombre_ajuste FROM ajustes`
            );
            res.json(ajustes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los ajustes' });
        }
    }

    // Obtener ajuste por ID
    async obtenerAjustePorId(req, res) {
        const { id } = req.params;
        try {
            const [ajuste] = await db.query(
                `SELECT id_ajuste, nombre_ajuste FROM ajustes WHERE id_ajuste = ?`,
                [id]
            );

            if (ajuste.length === 0) {
                return res.status(404).json({ error: 'Ajuste no encontrado' });
            }

            res.json(ajuste[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el ajuste' });
        }
    }

    // Agregar un nuevo ajuste
    async agregarAjuste(req, res) {
        const { nombre_ajuste } = req.body;

        try {
            await db.query(
                `INSERT INTO ajustes (nombre_ajuste) VALUES (?)`,
                [nombre_ajuste]
            );
            res.json({ mensaje: 'Ajuste agregado correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El nombre del ajuste ya existe' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al agregar el ajuste' });
        }
    }

    // Actualizar ajuste
    async actualizarAjuste(req, res) {
        const { id } = req.params;
        const { nombre_ajuste } = req.body;

        try {
            await db.query(
                `UPDATE ajustes SET nombre_ajuste = ? WHERE id_ajuste = ?`,
                [nombre_ajuste, id]
            );
            res.json({ mensaje: 'Ajuste actualizado correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'El nombre del ajuste ya existe' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el ajuste' });
        }
    }

    // Eliminar ajuste
    async eliminarAjuste(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM ajustes WHERE id_ajuste = ?`, [id]);
            res.json({ mensaje: 'Ajuste eliminado correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el ajuste' });
        }
    }
}

module.exports = AjustesController;
