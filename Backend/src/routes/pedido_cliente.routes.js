const express = require('express');
const PedidoClienteController = require('../controllers/pedido_cliente.controller');
const { validarCliente, validarPedido } = require('../middleware/validarEntradas');

const router = express.Router();
const pedidoController = new PedidoClienteController();

router.get('/', (req, res) => pedidoController.obtenerPedidos(req, res));
router.get('/:id', (req, res) => pedidoController.obtenerPedidoPorId(req, res));
router.post('/', validarCliente, validarPedido, (req, res) => pedidoController.crearPedido(req, res));
router.put('/:id', validarCliente, validarPedido, (req, res) => pedidoController.actualizarPedido(req, res));
router.delete('/:id', (req, res) => pedidoController.eliminarPedido(req, res));
router.put('/:id/estado', (req, res) => pedidoController.cambiarEstado(req, res));
router.post('/:id/devolucion', (req, res) => pedidoController.registrarDevolucion(req, res));

module.exports = router;
