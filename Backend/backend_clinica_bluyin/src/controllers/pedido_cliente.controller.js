const db = require('../config/conexion_db');

class PedidoClienteController {
  // Obtener todos los pedidos
  async obtenerPedidos(req, res) {
    try {
      const [resultados] = await db.query(`
        SELECT 
          p.id_pedido,
          p.id_cliente,
          c.nombre AS cliente,
          c.telefono,
          c.email,
          p.id_codigo,
          co.codigo_numero,
          p.fecha_pedido,
          p.fecha_entrega,
          p.cantidad_prendas,
          p.total_pedido,
          p.abono,
          p.saldo,
          p.observaciones,
          p.garantia,
          p.estado
        FROM pedido_cliente p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        LEFT JOIN codigos co ON p.id_codigo = co.id_codigo
        ORDER BY p.id_pedido DESC
      `);
      res.json(resultados);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener los pedidos' });
    }
  }

  // Obtener pedido por ID
  async obtenerPedidoPorId(req, res) {
    const { id } = req.params;
    try {
      const [resultado] = await db.query(
        `
        SELECT 
          p.id_pedido,
          p.id_cliente,
          c.nombre AS cliente,
          c.telefono,
          c.email,
          p.id_codigo,
          co.codigo_numero,
          p.fecha_pedido,
          p.fecha_entrega,
          p.cantidad_prendas,
          p.total_pedido,
          p.abono,
          p.saldo,
          p.observaciones,
          p.garantia,
          p.estado
        FROM pedido_cliente p
        LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
        LEFT JOIN codigos co ON p.id_codigo = co.id_codigo
        WHERE p.id_pedido = ?
        `,
        [id]
      );

      if (resultado.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      res.json(resultado[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener el pedido' });
    }
  }

  // Crear nuevo pedido
  async crearPedido(req, res) {
    const {
      id_cliente,
      id_codigo,
      fecha_pedido,
      fecha_entrega,
      cantidad_prendas,
      total_pedido,
      abono,
      saldo,
      observaciones,
      garantia,
      estado
    } = req.body;

    try {
      await db.query(
        `INSERT INTO pedido_cliente 
        (id_cliente, id_codigo, fecha_pedido, fecha_entrega, cantidad_prendas, total_pedido, abono, saldo, observaciones, garantia, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_cliente || null,
          id_codigo || null,
          fecha_pedido,
          fecha_entrega,
          cantidad_prendas,
          total_pedido,
          abono || 0,
          saldo || (total_pedido - (abono || 0)),
          observaciones,
          garantia,
          estado || 'en_proceso'
        ]
      );

      res.json({ mensaje: 'Pedido creado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear el pedido' });
    }
  }

  // Actualizar pedido
  async actualizarPedido(req, res) {
    const { id } = req.params;
    const {
      id_cliente,
      id_codigo,
      fecha_pedido,
      fecha_entrega,
      cantidad_prendas,
      total_pedido,
      abono,
      saldo,
      observaciones,
      garantia,
      estado
    } = req.body;

    try {
      await db.query(
        `UPDATE pedido_cliente 
        SET id_cliente = ?, id_codigo = ?, fecha_pedido = ?, fecha_entrega = ?, cantidad_prendas = ?, 
            total_pedido = ?, abono = ?, saldo = ?, observaciones = ?, garantia = ?, estado = ?
        WHERE id_pedido = ?`,
        [
          id_cliente || null,
          id_codigo || null,
          fecha_pedido,
          fecha_entrega,
          cantidad_prendas,
          total_pedido,
          abono,
          saldo || (total_pedido - abono),
          observaciones,
          garantia,
          estado,
          id
        ]
      );
      res.json({ mensaje: 'Pedido actualizado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el pedido' });
    }
  }

  // Eliminar pedido
  async eliminarPedido(req, res) {
    const { id } = req.params;
    try {
      await db.query(`DELETE FROM pedido_cliente WHERE id_pedido = ?`, [id]);
      res.json({ mensaje: 'Pedido eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el pedido' });
    }
  }

  // Cambiar estado del pedido
  async cambiarEstado(req, res) {
    const { id } = req.params;
    const { estado } = req.body;
    try {
      await db.query(`UPDATE pedido_cliente SET estado = ? WHERE id_pedido = ?`, [estado, id]);
      res.json({ mensaje: `Estado del pedido actualizado a "${estado}"` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al cambiar el estado del pedido' });
    }
  }
}

module.exports = PedidoClienteController;
