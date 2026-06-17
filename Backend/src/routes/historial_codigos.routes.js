const express = require('express');
const HistorialCodigosController = require('../controllers/historial_codigos.controller');

const router = express.Router();
const historialCodigosController = new HistorialCodigosController();

router.get('/', (req, res) => historialCodigosController.obtenerTodoElHistorial(req, res));
router.get('/pedido/:id_pedido', (req, res) => historialCodigosController.obtenerHistorialPorPedido(req, res));

module.exports = router;