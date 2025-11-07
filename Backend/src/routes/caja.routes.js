const express = require('express');
const CajaController = require('../controllers/caja.controller');

const router = express.Router();

// Resumen de caja
router.get('/summary', (req, res) => CajaController.getSummary(req, res));

module.exports = router;
