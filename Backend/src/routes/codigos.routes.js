const express = require('express');
const CodigosController = require('../controllers/codigos.controller');

const router = express.Router();
const codigosController = new CodigosController();

router.get('/', (req, res) => codigosController.obtenerCodigos(req, res));
router.get('/:id', (req, res) => codigosController.obtenerCodigoPorId(req, res));
router.post('/', (req, res) => codigosController.agregarCodigo(req, res));
router.put('/:id', (req, res) => codigosController.actualizarCodigo(req, res));
router.delete('/:id', (req, res) => codigosController.eliminarCodigo(req, res));
router.get('/disponibles', (req, res) => codigosController.obtenerCodigosDisponibles(req, res));
module.exports = router;
