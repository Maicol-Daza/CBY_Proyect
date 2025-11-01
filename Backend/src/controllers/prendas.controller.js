// controllers/prendas.controller.js
const db = require('../config/conexion_db');

class PrendasController {
    // Obtener todas las prendas
    async obtenerPrendas(req, res) {
        try {
            const [resultados] = await db.query('SELECT * FROM prendas');
            res.json(resultados);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las prendas' });
        }
    }

    // Obtener una prenda por ID
    async obtenerPrendaPorId(req, res) {
        const { id } = req.params;
        try {
            const [resultado] = await db.query('SELECT * FROM prendas WHERE id_prenda = ?', [id]);

            if (resultado.length === 0) {
                return res.status(404).json({ error: 'Prenda no encontrada' });
            }

            res.json(resultado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener la prenda' });
        }
    }

    // Crear una nueva prenda (método básico)
    async crearPrenda(req, res) {
        const { id_pedido, tipo, descripcion } = req.body;
        try {
            const [resultado] = await db.query(
                'INSERT INTO prendas (id_pedido, tipo, descripcion) VALUES (?, ?, ?)',
                [id_pedido, tipo, descripcion]
            );
            res.json({ 
                mensaje: 'Prenda creada correctamente', 
                id_prenda: resultado.insertId 
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear la prenda' });
        }
    }

    // Crear prenda completa con sus arreglos (NUEVO MÉTODO)
    async crearPrendaCompleta(req, res) {
        const { id_pedido, tipo, descripcion, cantidad, arreglos } = req.body;
        
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Insertar la prenda principal
            const [resultPrenda] = await connection.query(
                `INSERT INTO prendas (id_pedido, tipo, descripcion) VALUES (?, ?, ?)`,
                [id_pedido, tipo, descripcion]
            );
            
            const idPrenda = resultPrenda.insertId;

            // 2. Insertar cada arreglo en detalle_pedido_combo
            for (const arreglo of arreglos) {
                let idAjusteAccion = null;
                
                // Solo para combinaciones tenemos id_ajuste_accion
                if (arreglo.tipo === 'combinacion' && arreglo.id_ajuste_accion) {
                    idAjusteAccion = arreglo.id_ajuste_accion;
                }
                
                // Para ajustes y acciones individuales, no tenemos id_ajuste_accion
                // pero igual los guardamos con la descripción y precio
                
                const descripcionArreglo = arreglo.tipo === 'combinacion' 
                    ? `${arreglo.nombre_ajuste} ${arreglo.nombre_accion}`
                    : arreglo.tipo === 'ajuste'
                    ? arreglo.nombre_ajuste
                    : arreglo.nombre_accion;

                await connection.query(
                    `INSERT INTO detalle_pedido_combo (id_prenda, id_ajuste_accion, descripcion, precio) 
                     VALUES (?, ?, ?, ?)`,
                    [idPrenda, idAjusteAccion, descripcionArreglo, arreglo.precio]
                );
            }

            await connection.commit();
            
            res.json({ 
                mensaje: 'Prenda y arreglos guardados correctamente',
                id_prenda: idPrenda,
                cantidad: cantidad
            });
            
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ error: 'Error al guardar la prenda completa' });
        } finally {
            connection.release();
        }
    }

    // Actualizar una prenda
    async actualizarPrenda(req, res) {
        const { id } = req.params;
        const { id_pedido, tipo, descripcion } = req.body;
        try {
            await db.query(
                'UPDATE prendas SET id_pedido = ?, tipo = ?, descripcion = ? WHERE id_prenda = ?',
                [id_pedido, tipo, descripcion, id]
            );
            res.json({ mensaje: 'Prenda actualizada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar la prenda' });
        }
    }

    // Eliminar una prenda
    async eliminarPrenda(req, res) {
        const { id } = req.params;
        try {
            await db.query('DELETE FROM prendas WHERE id_prenda = ?', [id]);
            res.json({ mensaje: 'Prenda eliminada correctamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar la prenda' });
        }
    }

    // Obtener todas las prendas de un pedido
    async obtenerPrendasPorPedido(req, res) {
        const { id_pedido } = req.params;
        try {
            const [prendas] = await db.query(
                'SELECT * FROM prendas WHERE id_pedido = ?',
                [id_pedido]
            );

            // Para cada prenda, obtener sus arreglos del detalle_pedido_combo
            for (let prenda of prendas) {
                const [arreglos] = await db.query(
                    `SELECT 
                        dp.id_detalle_combo,
                        dp.descripcion,
                        dp.precio,
                        dp.id_ajuste_accion,
                        aa.id_ajuste,
                        a.nombre_ajuste,
                        aa.id_accion,
                        ac.nombre_accion
                     FROM detalle_pedido_combo dp
                     LEFT JOIN ajustes_accion aa ON dp.id_ajuste_accion = aa.id_ajuste_accion
                     LEFT JOIN ajustes a ON aa.id_ajuste = a.id_ajuste
                     LEFT JOIN acciones ac ON aa.id_accion = ac.id_accion
                     WHERE dp.id_prenda = ?`,
                    [prenda.id_prenda]
                );
                prenda.arreglos = arreglos;
            }

            res.json(prendas);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener las prendas del pedido' });
        }
    }
}

module.exports = PrendasController;