const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');

class UsuariosController {
  // Obtener todos los usuarios con su rol
async obtenerUsuarios(req, res) {
  try {
    const [usuarios] = await db.query(
      `SELECT u.id_usuario, u.nombre, u.email, u.id_rol, r.nombre AS rol,
        COALESCE(GROUP_CONCAT(p.nombre ORDER BY p.id_permiso SEPARATOR ', '), 'Sin permisos') AS permisos
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN rol_permiso rp ON r.id_rol = rp.id_rol
    LEFT JOIN permisos p ON rp.permiso_id = p.id_permiso
    GROUP BY u.id_usuario, u.nombre, u.email, u.id_rol, r.nombre`
    );

    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

async obtenerUsuarioPorId(req, res) {
  const { id } = req.params;
  try {
    const [usuario] = await db.query(
      `SELECT 
          u.id_usuario,
          u.nombre,
          u.email,
          r.nombre AS rol,
          COALESCE(GROUP_CONCAT(p.nombre SEPARATOR ', '), 'Sin permisos') AS permisos
        FROM usuarios u
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        LEFT JOIN rol_permiso rp ON r.id_rol = rp.id_rol
        LEFT JOIN permisos p ON rp.permiso_id = p.id_permiso
        WHERE u.id_usuario = ?
        GROUP BY u.id_usuario, u.nombre, u.email, r.nombre`,
      [id]
    );

    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

// Agregar un usuario nuevo
  async agregarUsuario(req, res) {
    const { nombre, email, clave, id_rol } = req.body;
    try {
      // Cifrar clave
      const hash = await bcrypt.hash(clave, 10);

      await db.query(
        'INSERT INTO usuarios (nombre, email, clave, id_rol) VALUES (?, ?, ?, ?)',
        [nombre, email, hash, id_rol]
      );
      res.json({ mensaje: 'Usuario agregado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al agregar usuario' });
    }
  }

  // Actualizar usuario (opcionalmente cambiar clave)
  async actualizarUsuario(req, res) {
    const { id } = req.params;
    const { nombre, email, clave, id_rol } = req.body;
    try {
      if (clave && clave.trim() !== '') {
        const hash = await bcrypt.hash(clave, 10);
        await db.query(
          'UPDATE usuarios SET nombre = ?, email = ?, clave = ?, id_rol = ? WHERE id_usuario = ?',
          [nombre, email, hash, id_rol, id]
        );
      } else {
        await db.query(
          'UPDATE usuarios SET nombre = ?, email = ?, id_rol = ? WHERE id_usuario = ?',
          [nombre, email, id_rol, id]
        );
      }
      res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  }

  // Eliminar usuario
  async eliminarUsuario(req, res) {
    const { id } = req.params;
    try {
      await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
      res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
}

module.exports = UsuariosController;
