USE ClinicaBluyin;

-- ================================================
-- 1. 🔝 Top clientes por valor total en pedidos
-- ================================================
SELECT c.nombre AS cliente,
       SUM(p.total_pedido) AS total_compras,
       COUNT(p.id_pedido) AS cantidad_pedidos
FROM pedido_cliente p
JOIN clientes c ON p.id_cliente = c.id_cliente
GROUP BY c.id_cliente, c.nombre
ORDER BY total_compras DESC
LIMIT 10;

-- ================================================
-- 2. 👕 Prendas más ajustadas (por tipo)
-- ================================================
SELECT pr.tipo AS prenda,
       COUNT(pp.id_pedido_prenda) AS veces_ajustada
FROM pedido_prenda pp
JOIN prendas pr ON pp.id_prenda = pr.id_prenda
GROUP BY pr.tipo
ORDER BY veces_ajustada DESC
LIMIT 10;

-- ================================================
-- 3. ✂️ Ajustes y acciones más frecuentes
-- ================================================
SELECT aj.nombre_ajuste,
       ac.nombre_accion,
       COUNT(dpc.id_detalle_combo) AS veces_solicitado
FROM detalle_pedido_combo dpc
JOIN ajustes_accion aa ON dpc.id_ajuste_accion = aa.id_ajuste_accion
JOIN ajustes aj ON aa.id_ajuste = aj.id_ajuste
JOIN acciones ac ON aa.id_accion = ac.id_accion
GROUP BY aj.nombre_ajuste, ac.nombre_accion
ORDER BY veces_solicitado DESC
LIMIT 15;

-- ================================================
-- 4. 💰 Ingresos mensuales (por caja)
-- ================================================
SELECT DATE_FORMAT(fecha_movimiento, '%Y-%m') AS mes,
       SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE 0 END) AS ingresos,
       SUM(CASE WHEN tipo = 'salida' THEN monto ELSE 0 END) AS egresos,
       SUM(CASE WHEN tipo = 'entrada' THEN monto ELSE -monto END) AS balance
FROM movimientos_caja
GROUP BY DATE_FORMAT(fecha_movimiento, '%Y-%m')
ORDER BY mes DESC;

-- ================================================
-- 5. 📌 Pedidos con saldo pendiente
-- ================================================
SELECT p.id_pedido,
       c.nombre AS cliente,
       p.total_pedido,
       IFNULL(SUM(h.monto),0) AS total_abonado,
       (p.total_pedido - IFNULL(SUM(h.monto),0)) AS saldo_pendiente
FROM pedido_cliente p
JOIN clientes c ON p.id_cliente = c.id_cliente
LEFT JOIN historial_abonos h ON p.id_pedido = h.id_pedido
GROUP BY p.id_pedido, c.nombre, p.total_pedido
HAVING saldo_pendiente > 0
ORDER BY saldo_pendiente DESC;

-- ================================================
-- 6. 📅 Pedidos en proceso vs entregados
-- ================================================
SELECT estado,
       COUNT(*) AS cantidad,
       SUM(total_pedido) AS total
FROM pedido_cliente
GROUP BY estado;
