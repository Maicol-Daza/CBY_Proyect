

const express = require('express');
const MovimientosCajaController = require('../controllers/movimientos_caja.controller');

const router = express.Router();
const movimientosController = new MovimientosCajaController();

router.get('/', (req, res) => movimientosController.obtenerMovimientos(req, res));
router.get('/:id', (req, res) => movimientosController.obtenerMovimientoPorId(req, res));
router.post('/', (req, res) => movimientosController.crearMovimiento(req, res));
router.put('/:id', (req, res) => movimientosController.actualizarMovimiento(req, res));
router.delete('/:id', (req, res) => movimientosController.eliminarMovimiento(req, res));

// Extras
router.get('/tipo/:tipo', (req, res) => movimientosController.obtenerPorTipo(req, res));
router.get('/pedido/:id_pedido', (req, res) => movimientosController.obtenerPorPedido(req, res));

module.exports = router;
