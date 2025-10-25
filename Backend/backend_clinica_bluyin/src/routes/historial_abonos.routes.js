const express = require('express');
const HistorialAbonosController = require('../controllers/historial_abonos.controller');

const router = express.Router();
const abonosController = new HistorialAbonosController();

// Rutas principales
router.get('/', (req, res) => abonosController.obtenerAbonos(req, res));
router.get('/:id', (req, res) => abonosController.obtenerAbonoPorId(req, res));
router.post('/', (req, res) => abonosController.crearAbono(req, res));
router.put('/:id', (req, res) => abonosController.actualizarAbono(req, res));
router.delete('/:id', (req, res) => abonosController.eliminarAbono(req, res));

// Extra: obtener abonos por pedido
router.get('/pedido/:id_pedido', (req, res) => abonosController.obtenerAbonosPorPedido(req, res));

module.exports = router;
