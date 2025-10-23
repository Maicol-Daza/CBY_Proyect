CREATE DATABASE IF NOT EXISTS ClinicaBluyin;
USE ClinicaBluyin;

-- ================================================
-- ENTIDADES BASE
-- ================================================

CREATE TABLE negocio (
    id_negocio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    nit VARCHAR(30),
    direccion VARCHAR(200),
    logo LONGBLOB
);

CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

CREATE TABLE rol_permiso (
    id_rol_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT,
    permiso_id INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (permiso_id) REFERENCES permisos(id_permiso)
);

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(300),
    clave VARCHAR(500),
    foto LONGBLOB,
    id_rol INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    nuip VARCHAR(30),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(150)
);

CREATE TABLE cajones (
    id_cajon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cajon VARCHAR(30)
);

CREATE TABLE codigos (
    id_codigo INT AUTO_INCREMENT PRIMARY KEY,
    codigo_numero VARCHAR(50),
    id_cajon INT,
    FOREIGN KEY (id_cajon) REFERENCES cajones(id_cajon)
);

-- ================================================
-- AJUSTES Y ACCIONES
-- ================================================

CREATE TABLE ajustes (
    id_ajuste INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ajuste VARCHAR(100) UNIQUE
);

CREATE TABLE acciones (
    id_accion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_accion VARCHAR(100) UNIQUE
);

CREATE TABLE ajustes_accion (
    id_ajuste_accion INT AUTO_INCREMENT PRIMARY KEY,
    id_ajuste INT,
    id_accion INT,
    precio DECIMAL(10,2),
    FOREIGN KEY (id_ajuste) REFERENCES ajustes(id_ajuste),
    FOREIGN KEY (id_accion) REFERENCES acciones(id_accion),
    UNIQUE (id_ajuste, id_accion)
);

-- ================================================
-- PEDIDOS
-- ================================================

CREATE TABLE pedido_cliente (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_codigo INT,
    fecha_pedido DATE,
    fecha_entrega DATE,
    cantidad_prendas INT,
    total_pedido DECIMAL(10,2),
    observaciones VARCHAR(500),
    estado ENUM('en_proceso','listo','entregado') DEFAULT 'en_proceso',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_codigo) REFERENCES codigos(id_codigo)
);

CREATE TABLE prendas (
    id_prenda INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100),
    descripcion TEXT
);

CREATE TABLE pedido_prenda (
    id_pedido_prenda INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_prenda INT,
    descripcion VARCHAR(200),
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido),
    FOREIGN KEY (id_prenda) REFERENCES prendas(id_prenda)
);

-- ================================================
-- COMBOS
-- ================================================

CREATE TABLE detalle_pedido_combo (
    id_detalle_combo INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido_prenda INT,
    id_ajuste_accion INT,
    precio DECIMAL(10,2),
    FOREIGN KEY (id_pedido_prenda) REFERENCES pedido_prenda(id_pedido_prenda),
    FOREIGN KEY (id_ajuste_accion) REFERENCES ajustes_accion(id_ajuste_accion)
);

-- ================================================
-- FINANZAS
-- ================================================

CREATE TABLE movimientos_caja (
    id_movimiento_caja INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    fecha_movimiento DATE,
    tipo ENUM('entrada', 'salida'),
    descripcion TEXT,
    monto DECIMAL(10,2),
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido)
);

CREATE TABLE historial_abonos (
    id_historial_abono INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    fecha_abono DATE,
    monto DECIMAL(10,2) NOT NULL,
    observaciones VARCHAR(300),
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido)
);


-- ================================================
-- INSERTAR DATOS BASE PARA LOS COMBOS DE AJUSTES
-- ================================================

-- 17 Ajustes
INSERT INTO ajustes (nombre_ajuste) VALUES
('Cintura'),
('Bota'),
('Espalda'),
('Puño'),
('Ruedo'),
('Hombro'),
('Manga'),
('Cierre'),
('Tiro'),
('Lados'),
('Bolsillo'),
('Tinturados'),
('Cuello'),
('Sisa'),
('Dobladillo'),
('Parche'),
('Pretina');

-- 17 Acciones
INSERT INTO acciones (nombre_accion) VALUES
('Entallar'),
('Adaptado'),
('Subir'),
('Bajar'),
('Recoser'),
('Costura Sencilla'),
('Cambiar'),
('Quitar'),
('Pegar'),
('Refuerzo'),
('Desflecado'),
('Reemplazar'),
('Ajustar'),
('Reforzar'),
('a mano'),
('Menos'),
('embonada');

-- ================================================
-- INSERTAR TODAS LAS COMBINACIONES (256)
-- Precio inicial generado automáticamente
-- ================================================
-- Fórmula de precio sugerida: 
-- 10000 + (id_ajuste * 500) + (id_accion * 300)
-- (Estos se pueden modificar en frontend)

INSERT INTO ajustes_accion (id_ajuste, id_accion, precio)
SELECT a.id_ajuste, ac.id_accion,
       10000 + (a.id_ajuste * 500) + (ac.id_accion * 300) AS precio
FROM ajustes a
CROSS JOIN Acciones ac;

-- ================================================
-- INSERTAR DATOS BASE PARA LOS CAJONES Y CÓDIGOS
-- ================================================

-- Insertar Series de Cajones
INSERT INTO cajones (nombre_cajon)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 16
)
SELECT CONCAT('CAJON_', LPAD(n, 2, '0'))
FROM seq;

-- Códigos
INSERT INTO codigos (codigo_numero, id_cajon)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 400
)
SELECT LPAD(n, 3, '0'),
       CEIL(n / 25)  -- cada 25 códigos cambia de cajón
FROM seq;

-- ================================================
-- INSERCIONES DE PRUEBAS
-- ================================================

-- Negocio
INSERT INTO negocio (nombre, nit, direccion) 
VALUES ('Clinica Bluyin', '900123456-7', 'Calle 10 #20-30, Palmira');

-- Rol
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Empleado');

-- Permisos genéricos
INSERT INTO permisos (nombre, descripcion) VALUES
('Crear', 'Permite crear nuevos registros'),
('Leer', 'Permite visualizar registros'),
('Actualizar', 'Permite modificar registros existentes'),
('Eliminar', 'Permite eliminar registros');

-- Asignar Permisos al Rol Administrador
INSERT INTO rol_permiso (id_rol, permiso_id)
SELECT 1, id_permiso FROM permisos;

-- Asignar Permisos al Rol Empleado
INSERT INTO rol_permiso (id_rol, permiso_id)
SELECT 2, id_permiso FROM permisos WHERE nombre IN ('Leer','Crear');

-- Consulta para ver permisos por Rol
SELECT r.nombre AS rol, p.nombre AS permiso
FROM roles r
JOIN rol_permiso rp ON r.id_rol = rp.id_rol
JOIN permisos p ON rp.permiso_id = p.id_permiso
ORDER BY r.nombre, p.nombre;

-- Usuario
INSERT INTO usuarios (nombre, email, clave, id_rol) 
VALUES ('Daniel Martínez', 'daniel@clinica.com', 'clave_encriptada', 1);

-- ============================
-- CLIENTES
-- ============================
INSERT INTO clientes (nombre, nuip, direccion, telefono, email)
VALUES
('Juan Pérez', '123456789', 'Calle 10 # 15-30','3001234567', 'juanperez@mail.com'),
('María Gómez', '987654321', 'Carrera 8 # 20-45','3109876543', 'maria@mail.com'),
('Pedro Ramírez', '112233445', 'Av. 6 # 33-12', '3024567890', 'pedro@mail.com');


-- ============================
-- PRENDAS
-- ============================
INSERT INTO prendas (tipo, descripcion) VALUES
('Jean', 'Jean azul clásico'),
('Camisa', 'Camisa manga larga blanca'),
('Chaqueta', 'Chaqueta de mezclilla');

-- ============================
-- PEDIDO CLIENTE
-- ============================
-- Pedido de Juan Pérez (cliente 1) con código 001 del cajón 1
INSERT INTO pedido_cliente (id_cliente, id_codigo, fecha_pedido, fecha_entrega, cantidad_prendas, total_pedido, observaciones, estado)
VALUES (1, 1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 2, 55000, 'Arreglar cintura y bota', 'en_proceso');

-- Pedido de María Gómez (cliente 2)
INSERT INTO pedido_cliente (id_cliente, id_codigo, fecha_pedido, fecha_entrega, cantidad_prendas, total_pedido, observaciones, estado)
VALUES (2, 10, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 1, 30000, 'Ajuste en mangas', 'en_proceso');

-- ============================
-- PEDIDO-PRENDA
-- ============================
-- Juan Pérez: 2 prendas (Jean y Camisa)
INSERT INTO pedido_prenda (id_pedido, id_prenda, descripcion)
VALUES
(1, 1, 'Jean azul ajustado en cintura'),
(1, 2, 'Camisa blanca ajustar ruedo');

-- María Gómez: 1 prenda (Chaqueta)
INSERT INTO pedido_prenda (id_pedido, id_prenda, descripcion)
VALUES
(2, 3, 'Chaqueta ajustar mangas');

-- ============================
-- DETALLE COMBO (Ajustes/Acciones con precios de la tabla ajustes_accion)
-- ============================
-- Para Juan Pérez:
-- Jean: cintura-entallar (ejemplo: id_ajuste_accion = 1) 
-- Camisa: ruedo-subir (ejemplo: id_ajuste_accion = 25)
INSERT INTO detalle_pedido_combo (id_pedido_prenda, id_ajuste_accion, precio)
VALUES
(1, 1, 12000),  -- Jean entallado cintura
(2, 25, 15000); -- Camisa ruedo subir

-- Para María Gómez:
-- Chaqueta: manga-acortar (ejemplo: id_ajuste_accion = 110)
INSERT INTO detalle_pedido_combo (id_pedido_prenda, id_ajuste_accion, precio)
VALUES
(3, 110, 30000);

-- ============================
-- HISTORIAL DE ABONOS
-- ============================
INSERT INTO historial_abonos (id_pedido, fecha_abono, monto, observaciones)
VALUES
(1, CURDATE(), 20000, 'Abono inicial efectivo'),
(2, CURDATE(), 15000, 'Abono transferencia');

-- ============================
-- MOVIMIENTOS DE CAJA
-- ============================
INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
VALUES
(1, CURDATE(), 'entrada', 'Abono Juan Pérez', 20000, 1),
(2, CURDATE(), 'entrada', 'Abono María Gómez', 15000, 1);

-- Ver pedidos con cliente y estado
SELECT p.id_pedido, c.nombre AS cliente, p.fecha_pedido, p.fecha_entrega, p.total_pedido, p.estado
FROM pedido_cliente p
JOIN clientes c ON p.id_cliente = c.id_cliente;

-- Ver prendas por pedido
SELECT pp.id_pedido_prenda, c.nombre AS cliente, pr.tipo, pp.descripcion
FROM pedido_prenda pp
JOIN pedido_cliente p ON pp.id_pedido = p.id_pedido
JOIN clientes c ON p.id_cliente = c.id_cliente
JOIN prendas pr ON pp.id_prenda = pr.id_prenda;

-- Ver ajustes y acciones por prenda
SELECT c.nombre AS cliente, pr.tipo AS prenda, aj.nombre_ajuste, ac.nombre_accion, dpc.precio
FROM detalle_pedido_combo dpc
JOIN pedido_prenda pp ON dpc.id_pedido_prenda = pp.id_pedido_prenda
JOIN pedido_cliente p ON pp.id_pedido = p.id_pedido
JOIN clientes c ON p.id_cliente = c.id_cliente
JOIN ajustes_accion aa ON dpc.id_ajuste_accion = aa.id_ajuste_accion
JOIN ajustes aj ON aa.id_ajuste = aj.id_ajuste
JOIN acciones ac ON aa.id_accion = ac.id_accion
JOIN prendas pr ON pp.id_prenda = pr.id_prenda;

-- Ver abonos por pedido
SELECT h.id_historial_abono, c.nombre AS cliente, h.fecha_abono, h.monto, h.observaciones
FROM historial_abonos h
JOIN pedido_cliente p ON h.id_pedido = p.id_pedido
JOIN clientes c ON p.id_cliente = c.id_cliente;

-- Estado de Caja
SELECT tipo, SUM(monto) AS total
FROM movimientos_caja
GROUP BY tipo;

-- Consolidada
SELECT 
    c.nombre            AS cliente,
    p.id_pedido         AS pedido_id,
    p.fecha_pedido,
    p.fecha_entrega,
    p.estado,
    pr.tipo             AS prenda,
    pp.descripcion      AS detalle_prenda,
    aj.nombre_ajuste,
    ac.nombre_accion,
    dpc.precio          AS precio_ajuste,

    p.total_pedido,
    IFNULL(SUM(DISTINCT h.monto),0) AS total_abonos,
    (p.total_pedido - IFNULL(SUM(DISTINCT h.monto),0)) AS saldo_pendiente

FROM pedido_cliente p
JOIN clientes c 
    ON p.id_cliente = c.id_cliente
LEFT JOIN pedido_prenda pp 
    ON p.id_pedido = pp.id_pedido
LEFT JOIN prendas pr 
    ON pp.id_prenda = pr.id_prenda
LEFT JOIN detalle_pedido_combo dpc 
    ON pp.id_pedido_prenda = dpc.id_pedido_prenda
LEFT JOIN ajustes_accion aa 
    ON dpc.id_ajuste_accion = aa.id_ajuste_accion
LEFT JOIN ajustes aj 
    ON aa.id_ajuste = aj.id_ajuste
LEFT JOIN acciones ac 
    ON aa.id_accion = ac.id_accion
LEFT JOIN historial_abonos h 
    ON p.id_pedido = h.id_pedido

GROUP BY 
    c.nombre, p.id_pedido, pr.tipo, pp.descripcion, 
    aj.nombre_ajuste, ac.nombre_accion, dpc.precio, 
    p.total_pedido, p.fecha_pedido, p.fecha_entrega, p.estado
ORDER BY 
    c.nombre, p.id_pedido, pr.tipo;

-- ============================
-- NUEVO PEDIDO DE EJEMPLO
-- Cliente: Pedro Ramírez (id_cliente = 3)
-- Pedido con 3 prendas y múltiples combos
-- ============================

-- 1) Crear pedido
INSERT INTO pedido_cliente (id_cliente, id_codigo, fecha_pedido, fecha_entrega, cantidad_prendas, total_pedido, observaciones, estado)
VALUES (3, 50, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 3, 120000, 'Pedido completo con varias prendas y ajustes', 'en_proceso');

-- Obtener el id_pedido generado (ejemplo = 3)
SET @id_pedido := LAST_INSERT_ID();

-- 2) Insertar prendas para el pedido
INSERT INTO pedido_prenda (id_pedido, id_prenda, descripcion) VALUES
(@id_pedido, 1, 'Jean negro skinny - ajustar cintura y bota'),
(@id_pedido, 2, 'Camisa azul - subir ruedo y ajustar mangas'),
(@id_pedido, 3, 'Chaqueta de jean - reforzar hombros y pegar parche');

-- Guardar ids de las prendas insertadas
SET @id_prenda1 := LAST_INSERT_ID();   -- Jean
SET @id_prenda2 := @id_prenda1 + 1;   -- Camisa
SET @id_prenda3 := @id_prenda1 + 2;   -- Chaqueta

-- 3) Insertar combos (ajustes/acciones)
-- Jean: cintura-entallar (id=1), bota-subir (id=9)
INSERT INTO detalle_pedido_combo (id_pedido_prenda, id_ajuste_accion, precio) VALUES
(@id_prenda1, 1, 15000),
(@id_prenda1, 9, 12000);

-- Camisa: ruedo-subir (id=25), manga-ajustar (id=90), puño-reforzar (id=70)
INSERT INTO detalle_pedido_combo (id_pedido_prenda, id_ajuste_accion, precio) VALUES
(@id_prenda2, 25, 10000),
(@id_prenda2, 90, 13000),
(@id_prenda2, 70, 8000);

-- Chaqueta: hombro-reforzar (id=65), parche-pegar (id=240)
INSERT INTO detalle_pedido_combo (id_pedido_prenda, id_ajuste_accion, precio) VALUES
(@id_prenda3, 65, 18000),
(@id_prenda3, 240, 14000);

-- 4) Registrar abono inicial
INSERT INTO historial_abonos (id_pedido, fecha_abono, monto, observaciones)
VALUES (@id_pedido, CURDATE(), 50000, 'Abono inicial en efectivo');

-- 5) Registrar movimiento en caja
INSERT INTO movimientos_caja (id_pedido, fecha_movimiento, tipo, descripcion, monto, id_usuario)
VALUES (@id_pedido, CURDATE(), 'entrada', 'Abono Pedro Ramírez', 50000, 1);

-- Consulta 
SELECT 
    c.nombre                      AS cliente,
    p.id_pedido                   AS pedido_id,
    p.fecha_pedido,
    p.fecha_entrega,
    p.estado,
    COUNT(DISTINCT pp.id_pedido_prenda) AS cantidad_prendas,
    pr.tipo                       AS prenda,
    pp.descripcion                AS detalle_prenda,
    GROUP_CONCAT(CONCAT(aj.nombre_ajuste, ' - ', ac.nombre_accion, ' ($', dpc.precio, ')')
                 ORDER BY aj.nombre_ajuste SEPARATOR ', ') AS ajustes_realizados,
    p.total_pedido,
    IFNULL(SUM(DISTINCT h.monto),0) AS total_abonos,
    (p.total_pedido - IFNULL(SUM(DISTINCT h.monto),0)) AS saldo_pendiente
FROM pedido_cliente p
JOIN clientes c 
    ON p.id_cliente = c.id_cliente
LEFT JOIN pedido_prenda pp 
    ON p.id_pedido = pp.id_pedido
LEFT JOIN prendas pr 
    ON pp.id_prenda = pr.id_prenda
LEFT JOIN detalle_pedido_combo dpc 
    ON pp.id_pedido_prenda = dpc.id_pedido_prenda
LEFT JOIN ajustes_accion aa 
    ON dpc.id_ajuste_accion = aa.id_ajuste_accion
LEFT JOIN ajustes aj 
    ON aa.id_ajuste = aj.id_ajuste
LEFT JOIN acciones ac 
    ON aa.id_accion = ac.id_accion
LEFT JOIN historial_abonos h 
    ON p.id_pedido = h.id_pedido
WHERE p.id_pedido = @id_pedido   -- <== aquí pones el ID del pedido que quieres ver
GROUP BY 
    c.nombre, p.id_pedido, pr.tipo, pp.descripcion, 
    p.total_pedido, p.fecha_pedido, p.fecha_entrega, p.estado
ORDER BY 
    cliente, pedido_id, pr.tipo;
-- BD_Normalizada