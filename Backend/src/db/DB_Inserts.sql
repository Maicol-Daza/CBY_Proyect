Use clinicabluyin;
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
       CEIL(n / 26)  -- cada 26 códigos cambia de cajón
FROM seq;





-- 17 Ajustes con precios aleatorios en formato colombiano
INSERT INTO ajustes (nombre_ajuste, precio_ajuste) VALUES
('Cintura', 15000.00),
('Bota', 12000.00),
('Espalda', 18000.00),
('Puño', 10000.00),
('Ruedo', 8500.00),
('Hombro', 20000.00),
('Manga', 16000.00),
('Cierre', 9000.00),
('Tiro', 14000.00),
('Lados', 17000.00),
('Bolsillo', 19000.00),
('Tinturados', 25000.00),
('Cuello', 13000.00),
('Sisa', 11000.00),
('Dobladillo', 7500.00),
('Parche', 22000.00),
('Pretina', 21000.00);

-- 17 Acciones con precios aleatorios en formato colombiano
INSERT INTO acciones (nombre_accion, precio_acciones) VALUES
('Entallar', 35000.00),
('Adaptado', 40000.00),
('Subir', 28000.00),
('Bajar', 28000.00),
('Recoser', 32000.00),
('Costura Sencilla', 25000.00),
('Cambiar', 45000.00),
('Quitar', 22000.00),
('Pegar', 30000.00),
('Refuerzo', 38000.00),
('Desflecado', 26000.00),
('Reemplazar', 50000.00),
('Ajustar', 33000.00),
('Reforzar', 36000.00),
('a mano', 42000.00),
('Menos', 20000.00),
('embonada', 44000.00);

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