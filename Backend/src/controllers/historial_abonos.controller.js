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
    const { id_pedido, abono, observaciones, id_usuario } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      if (!id_pedido || !abono) {
        await connection.rollback();
        return res.status(400).json({ error: 'El id_pedido y el abono son obligatorios' });
      }

      const montoAbono = Number(abono);
      if (montoAbono <= 0) {
        await connection.rollback();
        return res.status(400).json({ error: 'El monto del abono debe ser mayor a 0' });
      }

      // Obtener datos actuales del pedido
      const [pedidoActual] = await connection.query(
        `SELECT total_pedido, abono as abono_actual, saldo, estado FROM pedido_cliente WHERE id_pedido = ?`,
        [id_pedido]
      );

      if (pedidoActual.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const pedido = pedidoActual[0];

      // Validar que el pedido esté en proceso
      if (pedido.estado !== 'en_proceso') {
        await connection.rollback();
        return res.status(400).json({ 
          error: 'Solo se pueden registrar abonos en pedidos con estado "En proceso"',
          message: 'Solo se pueden registrar abonos en pedidos con estado "En proceso"'
        });
      }

      const saldoActual = Number(pedido.saldo);

      // Validar que el abono no sea mayor al saldo pendiente
      if (montoAbono > saldoActual) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `El abono ($${montoAbono.toLocaleString()}) no puede ser mayor al saldo pendiente ($${saldoActual.toLocaleString()})`,
          message: `El abono ($${montoAbono.toLocaleString()}) no puede ser mayor al saldo pendiente ($${saldoActual.toLocaleString()})`
        });
      }

      // Insertar el abono en el historial
      await connection.query(
        `INSERT INTO historial_abonos (id_pedido, abono, observaciones)
         VALUES (?, ?, ?)`,
        [id_pedido, montoAbono, observaciones || null]
      );

      // Actualizar el abono y saldo en el pedido
      const nuevoAbonoTotal = Number(pedido.abono_actual) + montoAbono;
      const nuevoSaldo = saldoActual - montoAbono;

      await connection.query(
        `UPDATE pedido_cliente SET abono = ?, saldo = ? WHERE id_pedido = ?`,
        [nuevoAbonoTotal, Math.max(0, nuevoSaldo), id_pedido]
      );

      // Registrar movimiento en caja
      const usuarioMovimiento = id_usuario || 1;
      await connection.query(
        `INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
         VALUES (?, CURRENT_TIMESTAMP, 'entrada', ?, ?, ?)`,
        [id_pedido, `Abono al pedido #${id_pedido}`, montoAbono, usuarioMovimiento]
      );

      await connection.commit();

      console.log(`✅ Abono registrado: Pedido #${id_pedido}, Monto: $${montoAbono}, Nuevo saldo: $${Math.max(0, nuevoSaldo)}`);

      res.json({ 
        mensaje: 'Abono registrado correctamente',
        nuevo_abono_total: nuevoAbonoTotal,
        nuevo_saldo: Math.max(0, nuevoSaldo)
      });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ error: 'Error al registrar el abono' });
    } finally {
      connection.release();
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

  // Obtener abonos por cliente (todos los pedidos del cliente)
  async obtenerAbonosPorCliente(req, res) {
    const { id } = req.params; // id = id_cliente
    try {
      const [abonos] = await db.query(
        `
        SELECT 
          h.id_historial_abono,
          h.id_pedido,
          p.id_cliente,
          p.fecha_pedido,
          p.total_pedido,
          h.fecha_abono,
          h.abono,
          h.observaciones
        FROM historial_abonos h
        JOIN pedido_cliente p ON h.id_pedido = p.id_pedido
        WHERE p.id_cliente = ?
        ORDER BY h.fecha_abono DESC
        `,
        [id]
      );

      res.json(abonos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los abonos del cliente' });
    }
  }
}

module.exports = HistorialAbonosController;
