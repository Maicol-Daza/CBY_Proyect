const express = require('express');
const PedidoClienteController = require('../controllers/pedido_cliente.controller');

const router = express.Router();
const pedidoController = new PedidoClienteController();



router.get('/', (req, res) => pedidoController.obtenerPedidos(req, res));
router.get('/:id', (req, res) => pedidoController.obtenerPedidoPorId(req, res));
router.post('/', (req, res) => pedidoController.crearPedido(req, res));
router.put('/:id', (req, res) => pedidoController.actualizarPedido(req, res));
router.delete('/:id', (req, res) => pedidoController.eliminarPedido(req, res));
router.patch('/:id/estado', (req, res) => pedidoController.cambiarEstado(req, res));

module.exports = router;
