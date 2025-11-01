const express = require('express');
const CajonesController = require('../controllers/cajones.controller');

const router = express.Router();
const cajonesController = new CajonesController();

router.get('/', (req, res) => cajonesController.obtenerCajones(req, res));
router.get('/:id', (req, res) => cajonesController.obtenerCajonPorId(req, res));
router.post('/', (req, res) => cajonesController.agregarCajon(req, res));
router.put('/:id', (req, res) => cajonesController.actualizarCajon(req, res));
router.delete('/:id', (req, res) => cajonesController.eliminarCajon(req, res));

module.exports = router;
