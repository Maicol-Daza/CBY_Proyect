const db = require('../config/db'); // ajusta la ruta si tu conexión está en otro archivo

class PedidoClienteController {
  async crearPedido(req, res) {
    const {
      cliente,
      pedido
    } = req.body;

    if (!cliente || !pedido) {
      return res.status(400).json({ message: "Datos incompletos." });
    }

    const connection = await db.promise().getConnection();
    await connection.beginTransaction();

    try {
      // 1️⃣ Crear o verificar cliente (por cédula o email)
      const [clienteExistente] = await connection.query(
        `SELECT id_cliente FROM clientes WHERE nuip = ? OR email = ? LIMIT 1`,
        [cliente.cedula, cliente.email]
      );

      let id_cliente;

      if (clienteExistente.length > 0) {
        id_cliente = clienteExistente[0].id_cliente;
      } else {
        const [nuevoCliente] = await connection.query(
          `INSERT INTO clientes (nombre, nuip, direccion, telefono, email) VALUES (?, ?, ?, ?, ?)`,
          [
            cliente.nombre,
            cliente.cedula,
            cliente.direccion,
            cliente.telefono,
            cliente.email
          ]
        );
        id_cliente = nuevoCliente.insertId;
      }

      // 2️⃣ Crear pedido asociado
      const [nuevoPedido] = await connection.query(
        `INSERT INTO pedido_cliente 
          (id_cliente, fecha_pedido, fecha_entrega, total_pedido, abono, saldo, observaciones, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_cliente,
          pedido.fechaInicio,
          pedido.fechaEntrega,
          pedido.totalPedido || 0,
          pedido.abonoInicial || 0,
          pedido.saldoPendiente || 0,
          pedido.observaciones || "",
          pedido.estado === "Finalizado" ? "listo" : "en_proceso"
        ]
      );

      await connection.commit();

      res.status(201).json({
        message: "Pedido y cliente guardados exitosamente",
        id_cliente,
        id_pedido: nuevoPedido.insertId
      });

    } catch (error) {
      await connection.rollback();
      console.error("Error al crear pedido:", error);
      res.status(500).json({ message: "Error al crear pedido", error: error.message });
    } finally {
      connection.release();
    }
  }

  async obtenerPedidos(req, res) {
    try {
      const [rows] = await db.promise().query(
        `SELECT p.*, c.nombre AS cliente_nombre 
         FROM pedido_cliente p 
         LEFT JOIN clientes c ON p.id_cliente = c.id_cliente`
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener pedidos" });
    }
  }

  async obtenerPedidoPorId(req, res) {
    try {
      const [rows] = await db.promise().query(
        `SELECT * FROM pedido_cliente WHERE id_pedido = ?`,
        [req.params.id]
      );
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener pedido" });
    }
  }

  async actualizarPedido(req, res) {
    try {
      const [result] = await db.promise().query(
        `UPDATE pedido_cliente SET ? WHERE id_pedido = ?`,
        [req.body, req.params.id]
      );
      res.json({ message: "Pedido actualizado", result });
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar pedido" });
    }
  }

  async eliminarPedido(req, res) {
    try {
      await db.promise().query(
        `DELETE FROM pedido_cliente WHERE id_pedido = ?`,
        [req.params.id]
      );
      res.json({ message: "Pedido eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error al eliminar pedido" });
    }
  }

  async cambiarEstado(req, res) {
    try {
      await db.promise().query(
        `UPDATE pedido_cliente SET estado = ? WHERE id_pedido = ?`,
        [req.body.estado, req.params.id]
      );
      res.json({ message: "Estado actualizado" });
    } catch (error) {
      res.status(500).json({ message: "Error al cambiar estado" });
    }
  }
}

module.exports = PedidoClienteController;
