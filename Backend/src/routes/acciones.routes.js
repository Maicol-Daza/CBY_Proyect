const express = require('express');
const AccionesController = require('../controllers/acciones.controller');

const router = express.Router();
const accionesController = new AccionesController();

router.get('/', (req, res) => accionesController.obtenerAcciones(req, res));
router.get('/:id', (req, res) => accionesController.obtenerAccionPorId(req, res));
router.post('/', (req, res) => accionesController.agregarAccion(req, res));
router.put('/:id', (req, res) => accionesController.actualizarAccion(req, res));
router.delete('/:id', (req, res) => accionesController.eliminarAccion(req, res));

module.exports = router;
