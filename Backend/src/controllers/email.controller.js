const nodemailer = require('nodemailer');
const db = require('../config/conexion_db');
const bcrypt = require('bcrypt');

class EmailController {
  // Configurar transporte de Nodemailer
  static getTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Solicitar recuperación de contraseña
  async solicitarRecuperacion(req, res) {
    const { email } = req.body;
    try {
      // Verificar que el usuario exista
      const [usuario] = await db.query(
        'SELECT id_usuario, nombre FROM usuarios WHERE email = ?',
        [email]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ error: 'Email no encontrado' });
      }

      // Generar código de 6 dígitos
      const codigo = Math.floor(100000 + Math.random() * 900000).toString();
      const codigoHash = await bcrypt.hash(codigo, 10);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Guardar código en base de datos
      await db.query(
        'UPDATE usuarios SET reset_codigo = ?, reset_codigo_expires = ? WHERE email = ?',
        [codigoHash, expiresAt, email]
      );

      // Configurar email
      const transporter = EmailController.getTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Código de Recuperación - CBY Project',
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
            <div style="background-color: #fff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f7fb3;">Código de Recuperación</h2>
              <p>Hola ${usuario[0].nombre},</p>
              <p>Recibimos una solicitud para recuperar tu contraseña. Usa el siguiente código para establecer una nueva contraseña:</p>
              <p style="text-align: center; margin: 30px 0;">
                <span style="background-color: #0f7fb3; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; border-radius: 5px; display: inline-block; letter-spacing: 5px;">
                  ${codigo}
                </span>
              </p>
              <p style="color: #666; font-size: 12px;">Este código expira en 15 minutos.</p>
              <p style="color: #666; font-size: 12px;">Si no solicitaste esto, ignora este correo.</p>
            </div>
          </div>
        `
      };

      // Enviar email
      await transporter.sendMail(mailOptions);

      res.json({ mensaje: 'Se envió un código a tu email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  }

  // Verificar código y cambiar contraseña
  async cambiarContraseña(req, res) {
    const { email, codigo, nuevaContraseña } = req.body;
    
    try {
      // Validar datos
      if (!email || !codigo || !nuevaContraseña) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      // Buscar usuario por email
      const [usuarios] = await db.query(
        `SELECT id_usuario, email, reset_codigo, reset_codigo_expires 
         FROM usuarios WHERE email = ?`,
        [email]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuario = usuarios[0];

      // Verificar que el código no haya expirado
      if (new Date() > new Date(usuario.reset_codigo_expires)) {
        return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      // Verificar que el código sea correcto
      const codigoValido = await bcrypt.compare(codigo, usuario.reset_codigo);
      if (!codigoValido) {
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      // Cifrar nueva contraseña
      const hash = await bcrypt.hash(nuevaContraseña, 10);

      // Actualizar contraseña y limpiar código
      await db.query(
        'UPDATE usuarios SET clave = ?, reset_codigo = NULL, reset_codigo_expires = NULL WHERE id_usuario = ?',
        [hash, usuario.id_usuario]
      );

      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al cambiar la contraseña' });
    }
  }

  // Verificar código (nuevo endpoint)
  async verificarCodigo(req, res) {
    const { email, codigo } = req.body;
    try {
      // Buscar usuario por email
      const [usuarios] = await db.query(
        `SELECT id_usuario, reset_codigo, reset_codigo_expires 
         FROM usuarios WHERE email = ?`,
        [email]
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const usuario = usuarios[0];

      // Verificar que el código no haya expirado
      if (new Date() > new Date(usuario.reset_codigo_expires)) {
        return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
      }

      // Verificar que el código sea correcto
      const codigoValido = await bcrypt.compare(codigo, usuario.reset_codigo);
      if (!codigoValido) {
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      res.json({ mensaje: 'Código verificado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al verificar el código' });
    }
  }
}

module.exports = EmailController;