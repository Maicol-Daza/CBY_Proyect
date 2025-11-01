const db = require('../config/conexion_db');

class HistorialAbonosController {
  // Obtener todos los abonos con datos del pedido
  async obtenerAbonos(req, res) {
    try {
      const [abonos] = await db.query(`
        SELECT 
          h.id_historial_abono,
          h.id_pedido,
          p.fecha_pedido,
          p.total_pedido,
          h.fecha_abono,
          h.abono,
          h.observaciones
        FROM historial_abonos h
        LEFT JOIN pedido_cliente p ON h.id_pedido = p.id_pedido
        ORDER BY h.fecha_abono DESC
      `);

      res.json(abonos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los abonos' });
    }
  }

  // Obtener abono por ID
  async obtenerAbonoPorId(req, res) {
    const { id } = req.params;

    try {
      const [abono] = await db.query(
        `
        SELECT 
          h.id_historial_abono,
          h.id_pedido,
          p.fecha_pedido,
          p.total_pedido,
          h.fecha_abono,
          h.abono,
          h.observaciones
        FROM historial_abonos h
        LEFT JOIN pedido_cliente p ON h.id_pedido = p.id_pedido
        WHERE h.id_historial_abono = ?
        `,
        [id]
      );

      if (abono.length === 0) {
        return res.status(404).json({ error: 'Abono no encontrado' });
      }

      res.json(abono[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el abono' });
    }
  }

  // Obtener todos los abonos de un pedido específico
  async obtenerAbonosPorPedido(req, res) {
    const { id_pedido } = req.params;

    try {
      const [abonos] = await db.query(
        `
        SELECT 
          h.id_historial_abono,
          h.fecha_abono,
          h.abono,
          h.observaciones
        FROM historial_abonos h
        WHERE h.id_pedido = ?
        ORDER BY h.fecha_abono DESC
        `,
        [id_pedido]
      );

      res.json(abonos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los abonos del pedido' });
    }
  }

  // Crear un nuevo abono
  async crearAbono(req, res) {
    const { id_pedido, abono, observaciones } = req.body;

    try {
      if (!id_pedido || !abono) {
        return res.status(400).json({ error: 'El id_pedido y el abono son obligatorios' });
      }

      await db.query(
        `
        INSERT INTO historial_abonos (id_pedido, abono, observaciones)
        VALUES (?, ?, ?)
        `,
        [id_pedido, abono, observaciones || null]
      );

      res.json({ mensaje: 'Abono registrado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al registrar el abono' });
    }
  }

  // Actualizar un abono existente
  async actualizarAbono(req, res) {
    const { id } = req.params;
    const { id_pedido, abono, observaciones } = req.body;

    try {
      await db.query(
        `
        UPDATE historial_abonos
        SET id_pedido = ?, abono = ?, observaciones = ?
        WHERE id_historial_abono = ?
        `,
        [id_pedido, abono, observaciones || null, id]
      );

      res.json({ mensaje: 'Abono actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el abono' });
    }
  }

  // Eliminar un abono
  async eliminarAbono(req, res) {
    const { id } = req.params;

    try {
      await db.query('DELETE FROM historial_abonos WHERE id_historial_abono = ?', [id]);
      res.json({ mensaje: 'Abono eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el abono' });
    }
  }
}

module.exports = HistorialAbonosController;
