const express = require('express');
const router = express.Router();
const MovimientosCajaController = require('../controllers/movimientos_caja.controller');

const controller = new MovimientosCajaController();

// Rutas principales
router.get('/', (req, res) => controller.obtenerMovimientos(req, res));
router.post('/', (req, res) => controller.crearMovimiento(req, res));
router.get('/:id', (req, res) => controller.obtenerMovimientoPorId(req, res));
router.put('/:id', (req, res) => controller.actualizarMovimiento(req, res));
router.delete('/:id', (req, res) => controller.eliminarMovimiento(req, res));

// Rutas por tipo
router.get('/tipo/:tipo', (req, res) => controller.obtenerPorTipo(req, res));

// Rutas por pedido
router.get('/pedido/:id_pedido', (req, res) => controller.obtenerPorPedido(req, res));

module.exports = router;
