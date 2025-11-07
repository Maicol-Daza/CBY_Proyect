const db = require('../config/conexion_db');

class CajaController {
	// Devuelve un resumen de caja: ingresos hoy, egresos hoy, totales y acumulado
	async getSummary(req, res) {
		try {
			const [ingHoyRows] = await db.query(
				"SELECT IFNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE tipo = 'entrada' AND fecha_movimiento = CURDATE()"
			);
			const [egHoyRows] = await db.query(
				"SELECT IFNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE tipo = 'salida' AND fecha_movimiento = CURDATE()"
			);

			const [totInRows] = await db.query(
				"SELECT IFNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE tipo = 'entrada'"
			);
			const [totEgRows] = await db.query(
				"SELECT IFNULL(SUM(monto), 0) AS total FROM movimientos_caja WHERE tipo = 'salida'"
			);

			const ingresosHoy = Number(ingHoyRows[0].total || 0);
			const egresosHoy = Number(egHoyRows[0].total || 0);
			const totalIngresos = Number(totInRows[0].total || 0);
			const totalEgresos = Number(totEgRows[0].total || 0);

			const totalAcumulado = totalIngresos - totalEgresos;

			res.json({ ingresosHoy, egresosHoy, totalIngresos, totalEgresos, totalAcumulado });
		} catch (error) {
			console.error('Error obteniendo resumen de caja:', error);
			res.status(500).json({ error: 'Error al obtener resumen de caja' });
		}
	}
}

module.exports = new CajaController();
