const express = require('express');
const PrendasController = require('../controllers/prendas.controller');

const router = express.Router();
const prendasController = new PrendasController();

router.get('/', (req, res) => prendasController.obtenerPrendas(req, res));
router.get('/:id', (req, res) => prendasController.obtenerPrendaPorId(req, res));
router.post('/', (req, res) => prendasController.crearPrenda(req, res));
router.put('/:id', (req, res) => prendasController.actualizarPrenda(req, res));
router.delete('/:id', (req, res) => prendasController.eliminarPrenda(req, res));

// Extra: obtener todas las prendas de un pedido
router.get('/pedido/:id_pedido', (req, res) => prendasController.obtenerPrendasPorPedido(req, res));

module.exports = router;
