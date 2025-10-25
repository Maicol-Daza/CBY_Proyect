const express = require('express');
const DetallePedidoComboController = require('../controllers/detalle_pedido_combo.controller');

const router = express.Router();
const detalleController = new DetallePedidoComboController();

router.get('/', (req, res) => detalleController.obtenerDetalles(req, res));
router.get('/:id', (req, res) => detalleController.obtenerDetallePorId(req, res));
router.post('/', (req, res) => detalleController.crearDetalle(req, res));
router.put('/:id', (req, res) => detalleController.actualizarDetalle(req, res));
router.delete('/:id', (req, res) => detalleController.eliminarDetalle(req, res));

// Extra: obtener todos los detalles de una prenda
router.get('/prenda/:id_prenda', (req, res) => detalleController.obtenerDetallesPorPrenda(req, res));

module.exports = router;
