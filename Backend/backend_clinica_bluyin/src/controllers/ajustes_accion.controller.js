const db = require('../config/conexion_db');

class AjustesAccionController {
    // Obtener todas las combinaciones de ajustes y acciones con sus nombres
    async obtenerAjustesAccion(req, res) {
        try {
            const [resultados] = await db.query(`
        SELECT 
          aa.id_ajuste_accion,
          aa.precio,
          a.id_ajuste,
          a.nombre_ajuste,
          ac.id_accion,
          ac.nombre_accion
        FROM ajustes_accion aa
        INNER JOIN ajustes a ON aa.id_ajuste = a.id_ajuste
        INNER JOIN acciones ac ON aa.id_accion = ac.id_accion
      `);
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los ajustes-acción' });
        }
    }

    // Obtener una relación por ID
    async obtenerAjusteAccionPorId(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query(
                `
        SELECT 
          aa.id_ajuste_accion,
          aa.precio,
          a.id_ajuste,
          a.nombre_ajuste,
          ac.id_accion,
          ac.nombre_accion
        FROM ajustes_accion aa
        INNER JOIN ajustes a ON aa.id_ajuste = a.id_ajuste
        INNER JOIN acciones ac ON aa.id_accion = ac.id_accion
        WHERE aa.id_ajuste_accion = ?
        `,
                [id]
            );

            if (resultado.length === 0) {
                return res.status(404).json({ error: 'Relación ajuste-acción no encontrada' });
            }

            res.json(resultado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la relación ajuste-acción' });
        }
    }

    // Agregar una nueva relación ajuste-acción
    async agregarAjusteAccion(req, res) {
        const { id_ajuste, id_accion, precio } = req.body;
        try {
            await db.query(
                `INSERT INTO ajustes_accion (id_ajuste, id_accion, precio) VALUES (?, ?, ?)`,
                [id_ajuste, id_accion, precio]
            );
            res.json({ mensaje: 'Relación ajuste-acción agregada correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res
                    .status(400)
                    .json({ error: 'Esta combinación de ajuste y acción ya existe' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al agregar la relación ajuste-acción' });
        }
    }

    // Actualizar una relación
    async actualizarAjusteAccion(req, res) {
        const { id } = req.params;
        const { id_ajuste, id_accion, precio } = req.body;
        try {
            await db.query(
                `UPDATE ajustes_accion 
         SET id_ajuste = ?, id_accion = ?, precio = ?
         WHERE id_ajuste_accion = ?`,
                [id_ajuste, id_accion, precio, id]
            );
            res.json({ mensaje: 'Relación ajuste-acción actualizada correctamente' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res
                    .status(400)
                    .json({ error: 'Ya existe otra relación con este ajuste y acción' });
            }
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar la relación ajuste-acción' });
        }
    }

    // Eliminar una relación
    async eliminarAjusteAccion(req, res) {
        const { id } = req.params;
        try {
            await db.query(`DELETE FROM ajustes_accion WHERE id_ajuste_accion = ?`, [id]);
            res.json({ mensaje: 'Relación ajuste-acción eliminada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la relación ajuste-acción' });
        }
    }
}

module.exports = AjustesAccionController;
