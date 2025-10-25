const express = require('express');
const AjustesController = require('../controllers/ajustes.controller');

const router = express.Router();
const ajustesController = new AjustesController();

router.get('/', (req, res) => ajustesController.obtenerAjustes(req, res));
router.get('/:id', (req, res) => ajustesController.obtenerAjustePorId(req, res));
router.post('/', (req, res) => ajustesController.agregarAjuste(req, res));
router.put('/:id', (req, res) => ajustesController.actualizarAjuste(req, res));
router.delete('/:id', (req, res) => ajustesController.eliminarAjuste(req, res));

module.exports = router;
