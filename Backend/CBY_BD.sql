-- DROP DATABASE JeanAndBlues;
CREATE DATABASE IF NOT EXISTS Clinica_Blujean;
USE Clinica_Blujean;

-- Tabla: Negocio
CREATE TABLE Negocio (
    id_negocio INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(100),
    NIT VARCHAR(30),
    Direccion VARCHAR(200),
    Logo LONGBLOB
);

-- Tabla: roles
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50)
);

-- Tabla: permisos
CREATE TABLE permisos (
    id_permiso INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion TEXT
);

-- Tabla intermedia: rol_permiso
CREATE TABLE rol_permiso (
    id_rol_permiso INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT,
    permiso_id INT,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (permiso_id) REFERENCES permisos(id_permiso)
);

-- Tabla: usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    email VARCHAR(300),
    clave VARCHAR(500),
    foto LONGBLOB,
    rol_id INT,
    FOREIGN KEY (rol_id) REFERENCES roles(id_rol)
);

-- Tabla: clientes
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    NUIP VARCHAR(30),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(150)
);

-- Tabla: prendas
CREATE TABLE prendas (
    id_prenda INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(100),
    descripcion TEXT
);

-- Tabla: cajones
CREATE TABLE cajones (
    id_cajon INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cajon VARCHAR(30)
);

-- Tabla: códigos
CREATE TABLE codigos (
    id_codigo INT AUTO_INCREMENT PRIMARY KEY,
    codigo_numero VARCHAR(50),
    id_cajon INT,
    FOREIGN KEY (id_cajon) REFERENCES cajones(id_cajon)
);

-- Tabla: ajustes
CREATE TABLE ajustes (
    id_ajuste INT AUTO_INCREMENT PRIMARY KEY,
    descripcion TEXT,
    precio DECIMAL(10,2)
);


-- Tabla: pedidos del cliente
CREATE TABLE pedido_cliente (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT,
    id_codigo INT,
    fecha_pedido DATE,
    fecha_entrega DATE,
    CantidadPrendas INT,
    abono DECIMAL(10,2),
    saldo DECIMAL(10,2),
    total DECIMAL(10,2),
    Observaciones VARCHAR(500),
    estado ENUM('pendiente','en_proceso','listo','entregado') DEFAULT 'pendiente',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_codigo) REFERENCES codigos(id_codigo)
);

-- Tabla: pedido_prenda (relación pedido con prendas específicas)
CREATE TABLE pedido_prenda (
    id_pedido_prenda INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    id_prenda INT,
    descripcion VARCHAR(200), -- opcional, notas específicas de esa prenda
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido),
    FOREIGN KEY (id_prenda) REFERENCES prendas(id_prenda)
);

-- Tabla: detalle_pedido_ajuste (ajustes aplicados a cada prenda del pedido)
CREATE TABLE detalle_pedido_ajuste (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido_prenda INT,
    id_ajuste INT,
    precio DECIMAL(18,2), -- precio real (puede incluir rebajas)
    FOREIGN KEY (id_pedido_prenda) REFERENCES pedido_prenda(id_pedido_prenda),
    FOREIGN KEY (id_ajuste) REFERENCES ajustes(id_ajuste)
);

-- Tabla: movimientos de caja
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

-- Tabla: historial de abonos
CREATE TABLE historial_abonos (
    id_historial_abono INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT,
    fecha DATE,
    monto DECIMAL(10,2),
    descripcion TEXT,
    FOREIGN KEY (id_pedido) REFERENCES pedido_cliente(id_pedido)
);

-- Inserciones en ajustes (columna precio corregida)
INSERT INTO ajustes (descripcion, precio) VALUES
('Bajar pretina', 24000),
('Cambiar de botones a cierre', 24000),
('Cambio de botón sencillo', 3000),
('Cambio de botón zigzag sin parche', 5000),
('Cambio de cierre', 14000),
('Entallar largo y bota no', 32000),
('-Cintura -bota ambos lados y ruedo costura sencilla', 42000),
('-Cintura -bota ambos lados costuras abiertas ruedo a mano', 46000),
('Entallar -bota ruedo adaptado normal', 42000),
('Entallar -bota ruedo normal', 40000),
('Camisa -espalda entallar costura sencilla', 30000),
('Camisa Entallar costura sencilla ruedo normal', 34000),
('Entallar ruedo adaptado', 40000),
('-Espalda entallar subir puño y sangria ruedo con abertura', 66000),
('Entallar subir puño con abertura sencilla', 36000),
('Injerto de ambos lados normal', 38000),
('Injerto de solo pretina', 28000),
('-Cintura', 24000),
('Camisa -espalda entallar embonada', 34000),
('-Espalda entallar y ruedo recto costura sencilla', 34000),
('-Lados sobrepisado', 22000),
('Refuerzo desflecado 10-15 cm', 15000),
('Parche botón', 6000),
('Refuerzo en piernas zigzag normal 10-15 cm', 18000),
('Parche en borde de bolsillos delanteros', 12000),
('Parche pasador', 5000),
('Parche tiro 10-15 cm', 18000),
('Pinzas normales Jean y Pant', 8000),
('Pinzas en camisas o blusas desde cero ', 16000),
('Alforzas', 28000),
('Recoser botones a mano cada uno', 6000),
('-Tiro sencillo', 12000),
('Ruedo adaptado desflecado', 28000),
('-Bota ruedo normal ', 22000),
('Ruedo adaptado sencillo', 20000),
('-Rodilla normal', 12000),
('Ruedo a mano', 18000),
('Ruedo con abertura', 28000),
('Ruedo normal', 18000),
('Reforzar tiro 10-15 cm', 18000),
('Cambiar bolsillos delanteros', 40000),
('-Lados bota-no, ruedo igual', 28000),
('Tinturados negros café turquí', 25000),
('Entallar embonada -espalda subir puño y sangria', 58000),
('Faja entallar solo cintura', 22000),
('Entallar costura sencilla buso', 12000),
('Profundizar pinzas', 12000),
('Camisa entallar embonada', 18000),
('Subir puño de saco de traje', 38000),
('Buso entallar y ruedo normal', 28000),
('Buso -espalda entallar y ruedo abajo normal', 36000),
('Buso entallar abertura costura sencilla', 22000),
('Camisa -espalda entallar costura sencilla y ruedo abajo con abertura ', 45000),
('Camisa -espalda entallar costura sencilla con abertura largo bien', 36000),
('Sudadera entallar levantando bolsillo -tiro -b ruedo igual poner resorte', 56000),
('-Tiro -rodilla -bota ruedo igual', 32000),
('Camisa -espalda entallar embonada ruedo camisero ', 48000),
('Camisa ruedo camisero ', 20000),
('Ruedo collarín', 20000),
('Chaqueta de Jean -espalda entallar ruedo con abertura costura sencilla subir puño y sangría', 60000),
('Ruedo igual de 2cm', 22000),
('Pant -lados -rlla y bota ambos lados costura sencilla rdo a mano', 30000),
('Pant -lados -rlla y bota ambos lados costura abierta rdo a mano', 34000),
('Camisa subir puño y sangría', 32000),
('Ruedo normal ancho', 26000),
('-Cintura -rodilla -bota ruedo igual', 40000),
('Blusa entallar -espalda ruedo con abertura costura sencilla poner cierre ', 50000),
('Buso entallar con abertura costura sencilla ', 28000),
('Buso -espalda entallar costura sencilla ruedo con abertura', 42000),
('Blusa entallar con abertura costura sencilla ', 28000),
('Blusa entallar costura sencilla quitar leva ', 24000),
('Blusa -resorte hombro sencillo ', 12000),
('Blusa ruedo camisero sin leva -resorte del puño ', 28000),
('Pantalón -resorte poner resorte en los hilos resorte ', 28000),
('Blusa -espalda entallar ruedo con abertura costura sencilla subir puño y sangria ', 55000),
('Blusa entallar quitar leva subir puño y sangria ', 48000),
('Chaqueta cambiar resorte del puño con forro', 28000),
('Vestido ruedo ancho con forro fileteado', 35000),
('Camisa entallar embonada ruedo recto', 38000),
('Pant -rodilla -bota ambos lados costuras abiertas ruedo a mano', 32000),
('Pant -ct -bota ruedo normal', 34000),
('Pant bajar 1 pretina -lados', 36000),
('Bajar 1 pretina entallar ruedo igual', 46000),
('Pant soltar ct -rodilla bota-no, ruedo adaptado', 36000),
('Camisa entallar subir puño costura sencilla', 38000),
('Camisa -espalda entallar costura sencilla ruedo abajo igual ', 40000),
('Jean bajar pretina de arriba -tiro -rodilla costura sencilla', 36000);
