CREATE DATABASE IF NOT EXISTS ClinicaBluyin;
USE ClinicaBluyin;

CREATE TABLE IF NOT EXISTS negocio (
    id_negocio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    nit VARCHAR(30),
    direccion VARCHAR(200),
    logo LONGBLOB
);

CREATE TABLE IF NOT EXISTS roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS rol_permiso (
    id_rol_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT,
    permiso_id INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(150),
    clave VARCHAR(500),
    foto LONGBLOB,
    id_rol INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    nuip VARCHAR(30) unique,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(150)
);

CREATE TABLE IF NOT EXISTS ajustes (
    id_ajuste INT AUTO_INCREMENT PRIMARY KEY,
    nombre_ajuste VARCHAR(100),
    precio_ajuste DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS acciones (
    id_accion INT AUTO_INCREMENT PRIMARY KEY,
    nombre_accion VARCHAR(100),
	precio_acciones DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS ajustes_accion (
    id_ajuste_accion INT AUTO_INCREMENT PRIMARY KEY,
    id_ajuste INT,
    id_accion INT,
    precio DECIMAL(10,2),
    descripcion_combinacion VARCHAR(255),
    FOREIGN KEY (id_ajuste) REFERENCES ajustes(id_ajuste) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (id_accion) REFERENCES acciones(id_accion) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS pedido_cliente (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    fecha_pedido DATE,
    fecha_entrega DATE,
    total_pedido DECIMAL(10,2),
    abono DECIMAL(10,2) DEFAULT 0,
    saldo DECIMAL(10,2) DEFAULT 0,
    observaciones VARCHAR(500),
    garantia varchar(500),
    estado ENUM('en_proceso','entregado') DEFAULT 'en_proceso',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS cajones (
    id_cajon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cajon VARCHAR(30),
    estado VARCHAR(20) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS codigos (
    id_codigo INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_cajon INT,
	codigo_numero VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'disponible',
    FOREIGN KEY (id_cajon) REFERENCES cajones(id_cajon) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS prendas (
    id_prenda INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,                 -- cada prenda pertenece a un pedido
    tipo VARCHAR(100),
    descripcion TEXT,
    cantidad INT DEFAULT 1,
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS detalle_pedido_combo (
    id_detalle_combo INT AUTO_INCREMENT PRIMARY KEY,
    id_prenda INT,
    id_ajuste_accion INT,
    descripcion VARCHAR(500),
    precio DECIMAL(10,2),
    FOREIGN KEY (id_prenda) REFERENCES prendas(id_prenda) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_ajuste_accion) REFERENCES ajustes_accion(id_ajuste_accion) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id_movimiento_caja INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP,
    tipo ENUM('entrada','salida'),
    descripcion TEXT,
    monto DECIMAL(10,2),
    id_usuario INT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido) ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS historial_abonos (
    id_historial_abono INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    fecha_abono DATETIME DEFAULT CURRENT_TIMESTAMP,
    abono DECIMAL(10,2) NOT NULL,
    observaciones VARCHAR(300),
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido) ON DELETE CASCADE ON UPDATE CASCADE
);



-- Cajones 
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
       CEIL(n / 26)  -- cada 25 códigos cambia de cajón
FROM seq;






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

INSERT INTO prendas (tipo, descripcion) VALUES
('Jean', 'Jean azul clásico'),
('Camisa', 'Camisa manga larga blanca'),
('Chaqueta', 'Chaqueta de mezclilla');




-- Insertar roles
INSERT INTO roles (nombre) VALUES 
('Administrador'),
('Empleado');

-- Insertar permisos
INSERT INTO permisos (nombre, descripcion) VALUES
('Crear', 'Permite crear nuevos registros'),
('Leer', 'Permite visualizar registros'),
('Actualizar', 'Permite modificar registros existentes'),
('Eliminar', 'Permite eliminar registros');

-- Asignar permisos al rol Administrador (id_rol = 1)
INSERT INTO rol_permiso (id_rol, permiso_id) VALUES
(1, 1), -- Crear
(1, 2), -- Leer
(1, 3), -- Actualizar
(1, 4); -- Eliminar

-- Asignar permisos al rol Empleado (id_rol = 2), solo Leer
INSERT INTO rol_permiso (id_rol, permiso_id) VALUES
(2, 2);

-- Insertar usuario Admin (contraseña: 123456)
INSERT INTO usuarios (nombre, email, clave, id_rol)
VALUES 
('Admin', 'admin@gmail.com', '$2b$10$wLyuMd5mP.D5YekcUa2uSOQIRXvXFyKmpz3go/ryHgHU1ihTtioa6', 1); 
-- La contraseña es: 1

-- Insertar usuario Empleado (contraseña: 123456)
INSERT INTO usuarios (nombre, email, clave, id_rol)
VALUES 
('Empleado', 'empleado@gmail.com', '$2b$10$wLyuMd5mP.D5YekcUa2uSOQIRXvXFyKmpz3go/ryHgHU1ihTtioa6', 2);
-- La contraseña es: 1



select * from clientes;
select * from codigos;
select * from detalle_pedido_combo;
select * from pedido_cliente;
select * from prendas;
select * from usuarios;
select * from cajones;
select * from ajustes_accion;
select * from ajustes;
select * from historial_abonos;
select * from movimientos_caja;

ALTER TABLE movimientos_caja 
MODIFY COLUMN fecha_movimiento DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE ajustes_accion ADD COLUMN descripcion_combinacion VARCHAR(255);
ALTER TABLE ajustes_accion DROP CONSTRAINT id_ajuste_id_accion_unique;
ALTER TABLE ajustes_accion DROP INDEX `id_ajuste_id_accion_unique`;
drop database clinicabluyin