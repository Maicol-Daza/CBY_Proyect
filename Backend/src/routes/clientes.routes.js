const express = require('express');
const ClientesController = require('../controllers/clientes.controller');
const { validarCliente } = require('../middleware/validarEntradas');

const router = express.Router();
const clientesController = new ClientesController();

router.get('/', (req, res) => clientesController.obtenerClientes(req, res));
router.get('/:id', (req, res) => clientesController.obtenerClientePorId(req, res));
router.post('/', validarCliente, (req, res) => clientesController.agregarCliente(req, res));
router.put('/:id', validarCliente, (req, res) => clientesController.actualizarCliente(req, res));
router.delete('/:id', (req, res) => clientesController.eliminarCliente(req, res));

module.exports = router;
