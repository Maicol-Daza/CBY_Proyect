const express = require('express');
const AjustesAccionController = require('../controllers/ajustes_accion.controller');

const router = express.Router();
const ajustesAccionController = new AjustesAccionController();

router.get('/', (req, res) => ajustesAccionController.obtenerAjustesAccion(req, res));
router.get('/:id', (req, res) => ajustesAccionController.obtenerAjusteAccionPorId(req, res));
router.post('/', (req, res) => ajustesAccionController.agregarAjusteAccion(req, res));
router.put('/:id', (req, res) => ajustesAccionController.actualizarAjusteAccion(req, res));
router.delete('/:id', (req, res) => ajustesAccionController.eliminarAjusteAccion(req, res));

module.exports = router;
