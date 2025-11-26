const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/email.controller');

const emailController = new EmailController();

router.post('/solicitar-recuperacion', (req, res) => emailController.solicitarRecuperacion(req, res));
router.post('/verificar-codigo', (req, res) => emailController.verificarCodigo(req, res));
router.post('/cambiar-contrasena', (req, res) => emailController.cambiarContraseña(req, res));

module.exports = router;