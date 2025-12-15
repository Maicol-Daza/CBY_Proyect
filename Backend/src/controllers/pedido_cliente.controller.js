const db = require('../config/conexion_db');

class PedidoClienteController {
  async crearPedido(req, res) {
    const {
      cliente,
      pedido,
      id_cajon,
      codigos_seleccionados,
      prendas,
      id_usuario
    } = req.body;

    console.log("Backend recibió id_usuario:", id_usuario);

    if (!cliente || !pedido) {
      return res.status(400).json({ error: "Faltan datos del cliente o pedido" });
    }

    //VALIDACIÓN: El abono inicial no debe ser mayor al total
    const totalPedidoNum = Number(pedido.totalPedido || 0);
    const abonoInicialNum = Number(pedido.abonoInicial || 0);

    if (abonoInicialNum < 0) {
      return res.status(400).json({ 
        message: "Validación fallida",
        detalles: "El abono no puede ser negativo"
      });
    }

    if (abonoInicialNum > totalPedidoNum) {
      return res.status(400).json({ 
        message: "Validación fallida",
        detalles: `El abono inicial ($${abonoInicialNum.toLocaleString()}) no puede ser mayor al total del pedido ($${totalPedidoNum.toLocaleString()})`
      });
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // 1 Validar datos del cliente (direccion y email son opcionales)
      if (!cliente.nombre || !cliente.cedula || !cliente.telefono) {
        return res.status(400).json({ 
          message: "Datos del cliente incompletos",
          detalles: "Los campos 'nombre', 'cedula' y 'telefono' son obligatorios"
        });
      }

      let id_cliente;

      // 2 Verificar si el cliente existe por cédula
      const [clienteExistente] = await connection.query(
        'SELECT id_cliente FROM clientes WHERE nuip = ?',
        [cliente.cedula]
      );

      if (clienteExistente.length > 0) {
        // 3 Si existe, actualizar sus datos
        id_cliente = clienteExistente[0].id_cliente;
        await connection.query(
          `UPDATE clientes 
           SET nombre = ?, 
               direccion = ?, 
               telefono = ?, 
               email = ?
           WHERE id_cliente = ?`,
          [
            cliente.nombre,
            cliente.direccion,
            cliente.telefono,
            cliente.email,
            id_cliente
          ]
        );
      } else {
        // 4 Si no existe, crear nuevo cliente
        const [resultadoInsert] = await connection.query(
          `INSERT INTO clientes (nombre, nuip, direccion, telefono, email) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            cliente.nombre,
            cliente.cedula,
            cliente.direccion,
            cliente.telefono,
            cliente.email
          ]
        );
        
        if (!resultadoInsert.insertId) {
          throw new Error('Error al crear nuevo cliente');
        }
        
        id_cliente = resultadoInsert.insertId;
      }

      // Verificar que tenemos un id_cliente válido
      if (!id_cliente) {
        throw new Error('No se pudo crear/actualizar el cliente');
      }

      //Crear pedido asociado con GARANTÍA
      const [nuevoPedido] = await connection.query(
        `INSERT INTO pedido_cliente 
          (id_cliente, fecha_pedido, fecha_entrega, total_pedido, abono, saldo, observaciones, estado, garantia)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_cliente,
          pedido.fechaInicio,
          pedido.fechaEntrega,
          pedido.totalPedido || 0,
          pedido.abonoInicial || 0,
          (pedido.totalPedido || 0) - (pedido.abonoInicial || 0),
          pedido.observaciones || "",
          pedido.estado === "Finalizado" ? "listo" : "en_proceso",
          pedido.garantia || null  
        ]
      );

      const id_pedido = nuevoPedido.insertId;

      // 2.1 Si se registró un abono inicial, guardarlo en historial_abonos Y en movimientos_caja
      const abonoInicial = Number(pedido.abonoInicial || 0);
      // utilizar campo específico para la observación del abono si se envía: observaciones_abono
      const observacionAbono = pedido.observaciones_abono ?? pedido.observaciones ?? null;

      if (abonoInicial > 0) {
        //Usar la observación enviada, o dejar null si está vacía
        await connection.query(
          `INSERT INTO historial_abonos (id_pedido, fecha_abono, abono, observaciones)
           VALUES (?, NOW(), ?, ?)`,
          [id_pedido, abonoInicial, observacionAbono]  //Cambio aquí
        );

        const usuarioMovimiento = id_usuario || 1;
        
        await connection.query(
          `INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
           VALUES (?, NOW(), 'entrada', ?, ?, ?)`,
          [id_pedido, `Abono inicial${observacionAbono ? ' - ' + observacionAbono : ''}`, abonoInicial, usuarioMovimiento]
        );
      }
      
      // 3 Guardar prendas y arreglos en detalle_pedido_combo
      if (prendas && prendas.length > 0) {
        for (const prenda of prendas) {
          // Insertar prenda asociada al pedido (usar id_pedido en la tabla prendas)
          const [resPrenda] = await connection.query(
            `INSERT INTO prendas (id_pedido, tipo, descripcion, cantidad) VALUES (?, ?, ?, ?)`,
            [
              id_pedido,
              prenda.tipo || null,
              prenda.descripcion || null,
              prenda.cantidad || 1
            ]
          );
          const id_prenda = resPrenda.insertId;

          if (prenda.arreglos && prenda.arreglos.length > 0) {
            // Crear array de descripciones con prioridad: descripcion_combinacion -> descripcion -> nombre_ajuste+nombre_accion -> otros
            const descripciones = prenda.arreglos.map(a => {
              if (a.descripcion_combinacion) return String(a.descripcion_combinacion).trim();
              if (a.descripcion) return String(a.descripcion).trim();
              if (a.nombre_ajuste && a.nombre_accion) return `${String(a.nombre_ajuste).trim()} + ${String(a.nombre_accion).trim()}`;
              return a.nombre_ajuste ?? a.nombre_accion ?? a.nombre ?? a.tipo ?? "Arreglo";
            }).filter(Boolean);

            const descripcionConcatenada = descripciones.join(" / ");

            // Sumar precios (prueba varios campos posibles)
            const precioTotal = prenda.arreglos.reduce((sum, a) => {
              const p = parseFloat((a.precio ?? a.valor ?? a.monto ?? 0).toString()) || 0;
              return sum + p;
            }, 0);

            // Si sólo hay un arreglo con id_ajuste_accion, lo colocamos; si hay varios dejamos null
            const conId = prenda.arreglos.filter(a => a.id_ajuste_accion);
            const idAjusteAccion = conId.length === 1 ? conId[0].id_ajuste_accion : null;

            await connection.query(
              `INSERT INTO detalle_pedido_combo (id_prenda, id_ajuste_accion, descripcion, precio) 
               VALUES (?, ?, ?, ?)`,
              [id_prenda, idAjusteAccion, descripcionConcatenada, precioTotal]
            );
          }
        }
      }

      // 4 Actualizar códigos seleccionados - marcar como ocupado
      if (codigos_seleccionados && codigos_seleccionados.length > 0) {
        for (const id_codigo of codigos_seleccionados) {
          await connection.query(
            `UPDATE codigos SET id_pedido = ?, estado = 'ocupado' WHERE id_codigo = ?`,
            [id_pedido, id_codigo]
          );
        }

        // 5 Verificar si todos los códigos del cajón están ocupados para marcar cajón como ocupado
        const [codigosDelCajon] = await connection.query(
          `SELECT COUNT(*) as total_codigos FROM codigos WHERE id_cajon = ?`,
          [id_cajon]
        );

        const [codigosOcupados] = await connection.query(
          `SELECT COUNT(*) as codigos_ocupados FROM codigos WHERE id_cajon = ? AND estado = 'ocupado'`,
          [id_cajon]
        );

        // Si todos los códigos del cajón están ocupados, marcar cajón como ocupado
        if (codigosOcupados[0].codigos_ocupados === codigosDelCajon[0].total_codigos) {
          await connection.query(
            `UPDATE cajones SET estado = 'ocupado' WHERE id_cajon = ?`,
            [id_cajon]
          );
        }
      }

      await connection.commit();

      res.status(201).json({
        message: "Pedido, prendas y arreglos guardados exitosamente",
        id_cliente,
        id_pedido: id_pedido,
        detalles: {
          prendas_guardadas: prendas ? prendas.length : 0,
          total_unidades: prendas ? prendas.reduce((total, prenda) => total + (prenda.cantidad || 1), 0) : 0,
          arreglos_guardados: prendas ? prendas.reduce((total, prenda) => total + prenda.arreglos.length, 0) : 0,
          codigos_asignados: codigos_seleccionados ? codigos_seleccionados.length : 0
        }
      });

    } catch (error) {
      await connection.rollback();
      console.error("Error al crear pedido:", error);
      res.status(500).json({ 
        message: "Error al crear pedido", 
        error: error.message,
        detalles: "Revise que todas las tablas existan y tengan la estructura correcta"
      });
    } finally {
      connection.release();
    }
  }

  // Método para liberar códigos cuando un pedido se marca como entregado
  async liberarCodigosPedido(id_pedido, connection) {
    try {
      // Obtener los códigos asociados al pedido
      const [codigosAsociados] = await connection.query(
        `SELECT id_codigo, id_cajon FROM codigos WHERE id_pedido = ?`,
        [id_pedido]
      );

      if (codigosAsociados.length > 0) {
        // Liberar los códigos (marcar como disponibles)
        await connection.query(
          `UPDATE codigos SET id_pedido = NULL, estado = 'disponible' WHERE id_pedido = ?`,
          [id_pedido]
        );

        // Verificar cada cajón para ver si se puede marcar como disponible
        const cajonesIds = [...new Set(codigosAsociados.map(codigo => codigo.id_cajon))];
        
        for (const id_cajon of cajonesIds) {
          const [codigosEnCajon] = await connection.query(
            `SELECT COUNT(*) as total FROM codigos WHERE id_cajon = ?`,
            [id_cajon]
          );
          
          const [codigosOcupados] = await connection.query(
            `SELECT COUNT(*) as ocupados FROM codigos WHERE id_cajon = ? AND estado = 'ocupado'`,
            [id_cajon]
          );

          // Si ya no hay códigos ocupados en el cajón, marcarlo como disponible
          if (codigosOcupados[0].ocupados === 0) {
            await connection.query(
              `UPDATE cajones SET estado = NULL WHERE id_cajon = ?`,
              [id_cajon]
            );
          }
        }
      }
    } catch (error) {
      console.error("Error al liberar códigos:", error);
      throw error;
    }
  }

  async obtenerPedidos(req, res) {
    try {
      const [rows] = await db.query(
        `SELECT 
          p.*, 
          c.nombre AS cliente_nombre,
          c.nuip AS cliente_cedula,
          c.telefono AS cliente_telefono,
          c.email AS cliente_email,
          ca.id_cajon,
          ca.nombre_cajon
         FROM pedido_cliente p 
         LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
         LEFT JOIN (
           SELECT DISTINCT c.id_pedido, caj.id_cajon, caj.nombre_cajon 
           FROM codigos c
           LEFT JOIN cajones caj ON c.id_cajon = caj.id_cajon
           WHERE c.id_pedido IS NOT NULL
         ) ca ON p.id_pedido = ca.id_pedido
         ORDER BY p.fecha_pedido DESC`
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener pedidos", error: error.message });
    }
  }

  async obtenerPedidoPorId(req, res) {
    const { id } = req.params;
    try {
      const [pedido] = await db.query(
        `SELECT 
          p.*, 
          c.nombre AS cliente_nombre,
          c.nuip AS cliente_cedula,
          c.direccion AS cliente_direccion,
          c.telefono AS cliente_telefono,
          c.email AS cliente_email,
          ca.id_cajon,
          ca.nombre_cajon
         FROM pedido_cliente p 
         LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
         LEFT JOIN (
           SELECT DISTINCT c.id_pedido, caj.id_cajon, caj.nombre_cajon 
           FROM codigos c
           LEFT JOIN cajones caj ON c.id_cajon = caj.id_cajon
           WHERE c.id_pedido IS NOT NULL
         ) ca ON p.id_pedido = ca.id_pedido
         WHERE p.id_pedido = ?`,
        [id]
      );

      if (pedido.length === 0) {
        return res.status(404).json({ message: "Pedido no encontrado" });
      }

      // Obtener prendas del pedido (INCLUYENDO CANTIDAD)
      const [prendas] = await db.query(
        `SELECT * FROM prendas WHERE id_pedido = ?`,
        [id]
      );

      // Obtener arreglos de cada prenda
      for (let prenda of prendas) {
        const [arreglos] = await db.query(
          `SELECT 
            dp.id_detalle_combo,
            dp.descripcion AS descripcion_combinacion,
            dp.precio,
            dp.id_ajuste_accion,
            aa.id_ajuste,
            a.nombre_ajuste,
            a.precio_ajuste,
            aa.id_accion,
            ac.nombre_accion,
            ac.precio_acciones,
            CASE 
              WHEN aa.id_ajuste_accion IS NOT NULL THEN 'combinacion'
              WHEN a.id_ajuste IS NOT NULL AND ac.id_accion IS NULL THEN 'ajuste'
              WHEN ac.id_accion IS NOT NULL AND a.id_ajuste IS NULL THEN 'accion'
              ELSE 'combinacion'
            END AS tipo
           FROM detalle_pedido_combo dp
           LEFT JOIN ajustes_accion aa ON dp.id_ajuste_accion = aa.id_ajuste_accion
           LEFT JOIN ajustes a ON aa.id_ajuste = a.id_ajuste
           LEFT JOIN acciones ac ON aa.id_accion = ac.id_accion
           WHERE dp.id_prenda = ?`,
          [prenda.id_prenda]
        );
        prenda.arreglos = arreglos;
        
        // Calcular subtotal por prenda
        prenda.subtotal = arreglos.reduce((total, arreglo) => total + (arreglo.precio || 0), 0) * (prenda.cantidad || 1);
      }

      // Obtener códigos asignados al pedido
      const [codigos] = await db.query(
        `SELECT 
          c.id_codigo,
          c.codigo_numero,
          ca.id_cajon,
          ca.nombre_cajon AS cajon_nombre
         FROM codigos c
         LEFT JOIN cajones ca ON c.id_cajon = ca.id_cajon
         WHERE c.id_pedido = ?`,
        [id]
      );

      res.json({
        ...pedido[0],
        prendas: prendas,
        codigos: codigos
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener pedido", error: error.message });
    }
  }

  async actualizarPedido(req, res) {
    const { id } = req.params;
    const { cliente, pedido, prendas } = req.body;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Actualizar datos del pedido CON GARANTÍA
      await connection.query(
        `UPDATE pedido_cliente 
         SET fecha_entrega = ?, total_pedido = ?, abono = ?, saldo = ?, observaciones = ?, estado = ?, garantia = ?
         WHERE id_pedido = ?`,
        [
          pedido.fechaEntrega,
          pedido.totalPedido,
          pedido.abonoInicial,
          pedido.saldoPendiente,
          pedido.observaciones,
          pedido.estado === "Finalizado" ? "listo" : "en_proceso",
          pedido.garantia || null,  
          id
        ]
      );

      // Actualizar datos del cliente
      await connection.query(
        `UPDATE clientes 
         SET nombre = ?, direccion = ?, telefono = ?, email = ?
         WHERE id_cliente = (SELECT id_cliente FROM pedido_cliente WHERE id_pedido = ?)`,
        [cliente.nombre, cliente.direccion, cliente.telefono, cliente.email, id]
      );

      // Si se enviaron prendas, actualizarlas
      if (prendas && prendas.length > 0) {
        // Primero eliminar prendas y arreglos existentes
        const [prendasExistentes] = await connection.query(
          `SELECT id_prenda FROM prendas WHERE id_pedido = ?`,
          [id]
        );

        for (const prendaExistente of prendasExistentes) {
          await connection.query(
            `DELETE FROM detalle_pedido_combo WHERE id_prenda = ?`,
            [prendaExistente.id_prenda]
          );
        }

        await connection.query(
          `DELETE FROM prendas WHERE id_pedido = ?`,
          [id]
        );

        // Insertar nuevas prendas y arreglos (CON CANTIDAD)
        for (const prenda of prendas) {
          const [resultPrenda] = await connection.query(
            `INSERT INTO prendas (id_pedido, tipo, descripcion, cantidad) VALUES (?, ?, ?, ?)`,
            [id, prenda.tipo, prenda.descripcion, prenda.cantidad || 1]
          );
          
          const id_prenda = resultPrenda.insertId;

          for (const arreglo of prenda.arreglos) {
            let idAjusteAccion = null;
            
            if (arreglo.tipo === 'combinacion' && arreglo.id_ajuste_accion) {
              idAjusteAccion = arreglo.id_ajuste_accion;
            }
            
            let descripcionArreglo = "";
            if (arreglo && (arreglo.descripcion_combinacion || arreglo.descripcion)) {
              descripcionArreglo = String(arreglo.descripcion_combinacion ?? arreglo.descripcion).trim();
            } else if (arreglo && (arreglo.nombre_ajuste || arreglo.nombre_accion)) {
              descripcionArreglo = `${arreglo.nombre_ajuste ?? ''} ${arreglo.nombre_accion ?? ''}`.trim();
            } else if (arreglo && arreglo.tipo) {
              if (arreglo.tipo === 'ajuste' && arreglo.nombre_ajuste) descripcionArreglo = String(arreglo.nombre_ajuste).trim();
              else if (arreglo.tipo === 'accion' && arreglo.nombre_accion) descripcionArreglo = String(arreglo.nombre_accion).trim();
            }
            if (!descripcionArreglo) descripcionArreglo = "Arreglo";

            await connection.query(
              `INSERT INTO detalle_pedido_combo (id_prenda, id_ajuste_accion, descripcion, precio) 
               VALUES (?, ?, ?, ?)`,
              [id_prenda, idAjusteAccion, descripcionArreglo, arreglo.precio]
            );
          }
        }
      }

      await connection.commit();

      res.json({ 
        message: "Pedido actualizado correctamente",
        id_pedido: parseInt(id)
      });

    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Error al actualizar pedido", error: error.message });
    } finally {
      connection.release();
    }
  }

  async eliminarPedido(req, res) {
    const { id } = req.params;

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Liberar códigos asociados al pedido (VERSIÓN CORREGIDA)
      await connection.query(
        `UPDATE codigos SET id_pedido = NULL, estado = 'disponible' WHERE id_pedido = ?`,
        [id]
      );

      // Obtener prendas para eliminar sus arreglos
      const [prendas] = await connection.query(
        `SELECT id_prenda FROM prendas WHERE id_pedido = ?`,
        [id]
      );

      // Eliminar arreglos de las prendas
      for (const prenda of prendas) {
        await connection.query(
          `DELETE FROM detalle_pedido_combo WHERE id_prenda = ?`,
          [prenda.id_prenda]
        );
      }

      // Eliminar prendas
      await connection.query(`DELETE FROM prendas WHERE id_pedido = ?`, [id]);

      // Eliminar pedido
      await connection.query(`DELETE FROM pedido_cliente WHERE id_pedido = ?`, [id]);

      await connection.commit();

      res.json({ message: "Pedido eliminado correctamente" });

    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "Error al eliminar pedido", error: error.message });
    } finally {
      connection.release();
    }
  }
  async cambiarEstado(req, res) {
  const { id } = req.params;
  const { estado, abonoEntrega, id_usuario, fecha_entrega } = req.body;

  console.log("Datos Recibido:", { id, estado, abonoEntrega, id_usuario, fecha_entrega });

  if (!id || !estado) {
    return res.status(400).json({ error: "ID y estado son requeridos" });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    let estadoBD = 'en_proceso';
    
    if (estado === "Finalizado") estadoBD = "listo";
    else if (estado === "Entregado") estadoBD = "entregado";
    else if (estado === "Cancelado") estadoBD = "cancelado";

    // Obtener datos del pedido actual
    const [pedidoActual] = await connection.query(
      `SELECT id_cliente, total_pedido, abono, saldo FROM pedido_cliente WHERE id_pedido = ?`,
      [id]
    );

    if (pedidoActual.length === 0) {
      throw new Error('Pedido no encontrado');
    }

    const totalPedido = Number(pedidoActual[0].total_pedido);
    const abonoAnterior = Number(pedidoActual[0].abono);
    const saldoAnterior = Number(pedidoActual[0].saldo);

    // Si el estado es "entregado", validar abono y guardar registro
    if (estadoBD === 'entregado') {
      //VALIDACIÓN: No permitir abono mayor al saldo pendiente
      const abonoEntregaNum = abonoEntrega ? Number(abonoEntrega) : 0;
      
      if (abonoEntregaNum < 0) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Validación fallida",
          message: "El abono no puede ser negativo." 
        });
      }

      if (abonoEntregaNum > saldoAnterior) {
        await connection.rollback();
        return res.status(400).json({ 
          error: "Validación fallida",
          message: `El abono ingresado ($${abonoEntregaNum.toLocaleString()}) no puede ser mayor al saldo pendiente ($${saldoAnterior.toLocaleString()}).` 
        });
      }
      try {
        const [pedidoData] = await connection.query(
          `SELECT id_cajon FROM pedido_cliente WHERE id_pedido = ?`,
          [id]
        );

        if (pedidoData.length > 0 && pedidoData[0].id_cajon) {
          await connection.query(
            `INSERT INTO historial_cajon_pedido 
             (id_pedido, id_cajon, fecha_liberacion, estado_anterior)
             VALUES (?, ?, NOW(), 'ocupado')`,
            [id, pedidoData[0].id_cajon]
          );
        }
      } catch (e) {
        console.warn(" Aviso al guardar historial de cajón:", e.message);
      }

      // Liberar los códigos
      await this.liberarCodigosPedido(id, connection);

      //CREAR MOVIMIENTO EN CAJA Y ACTUALIZAR SALDO
      const montoACobrar = abonoEntrega ? Number(abonoEntrega) : saldoAnterior;
      
      if (montoACobrar > 0) {
        // USAR id_usuario del request
        const usuarioMovimiento = id_usuario || 1;
        
        await connection.query(
          `INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
           VALUES (?, CURRENT_TIMESTAMP, 'entrada', ?, ?, ?)`,
          [id, `Cobro en entrega - Pedido #${id}`, montoACobrar, usuarioMovimiento]
        );

        console.log(`Movimiento registrado por usuario ${usuarioMovimiento}: $${montoACobrar}`);
      }

      // ACTUALIZAR ABONO Y SALDO CUANDO SE ENTREGA
      const nuevoAbono = abonoAnterior + montoACobrar;
      const nuevoSaldo = totalPedido - nuevoAbono; // Debería ser 0 si se pagó completo

      await connection.query(
        `UPDATE pedido_cliente SET abono = ?, saldo = ? WHERE id_pedido = ?`,
        [nuevoAbono, Math.max(0, nuevoSaldo), id] // Math.max asegura que no sea negativo
      );

      console.log(`💾 Saldo actualizado: Abono: $${nuevoAbono}, Saldo: $${Math.max(0, nuevoSaldo)}`);
    }

    // Actualizar estado del pedido y fecha de entrega si corresponde
    if (estadoBD === 'entregado' && fecha_entrega) {
      // Si se entrega, actualizar también la fecha de entrega con la fecha real
      await connection.query(
        `UPDATE pedido_cliente SET estado = ?, fecha_entrega = ? WHERE id_pedido = ?`,
        [estadoBD, fecha_entrega, id]
      );
      console.log(`📅 Fecha de entrega actualizada a: ${fecha_entrega}`);
    } else {
      await connection.query(
        `UPDATE pedido_cliente SET estado = ? WHERE id_pedido = ?`,
        [estadoBD, id]
      );
    }

    await connection.commit();
    
    return res.json({ 
      message: "Estado actualizado correctamente y movimiento registrado en caja",
      nuevo_estado: estadoBD,
      id_pedido: id,
      saldo_actualizado: Math.max(0, totalPedido - (abonoAnterior + (abonoEntrega || saldoAnterior)))
    });
    
  } catch (error) {
    await connection.rollback();
    console.error(" Error:", error);
    return res.status(500).json({ 
      message: "Error al cambiar estado", 
      error: error.message 
    });
  } finally {
    connection.release();
  }
}

  async obtenerEstadisticas(req, res) {
    try {
      const [totalPedidos] = await db.query(
        `SELECT COUNT(*) as total FROM pedido_cliente`
      );
      
      const [pedidosProceso] = await db.query(
        `SELECT COUNT(*) as total FROM pedido_cliente WHERE estado = 'en_proceso'`
      );
      
      const [pedidosListos] = await db.query(
        `SELECT COUNT(*) as total FROM pedido_cliente WHERE estado = 'listo'`
      );
      
      const [ingresosTotales] = await db.query(
        `SELECT COALESCE(SUM(total_pedido), 0) as total FROM pedido_cliente`
      );

      res.json({
        total_pedidos: totalPedidos[0].total,
        pedidos_proceso: pedidosProceso[0].total,
        pedidos_listos: pedidosListos[0].total,
        ingresos_totales: parseFloat(ingresosTotales[0].total)
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener estadísticas", error: error.message });
    }
  }

  async registrarDevolucion(req, res) {
    const { id } = req.params;
    const {
      motivo_devolucion,
      descripcion_devolucion,
      solucion_devolucion,
      monto_devolucion
    } = req.body;

    if (!id || !motivo_devolucion) {
      return res.status(400).json({
        error: "Faltan datos obligatorios"
      });
    }

    const connection = await db.getConnection();

    try {
      await connection.query(
        `UPDATE pedido_cliente 
         SET motivo_devolucion = ?, 
             descripcion_devolucion = ?, 
             solucion_devolucion = ?, 
             monto_devolucion = ?,
             fecha_devolucion = NOW(),
             estado = ?
         WHERE id_pedido = ?`,
        [
          motivo_devolucion,
          descripcion_devolucion || null,
          solucion_devolucion || "reembolso",
          monto_devolucion || 0,
          "devuelto",
          id
        ]
      );

      res.status(200).json({
        success: true,
        message: "✓ Devolución registrada correctamente"
      });
    } catch (error) {
      console.error("Error al registrar devolución:", error);
      res.status(500).json({
        error: "Error al registrar la devolución"
      });
    } finally {
      connection.release();
    }
  }
}

module.exports = PedidoClienteController;