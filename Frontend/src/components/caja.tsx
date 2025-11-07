import React, { useEffect, useState } from 'react';
import { getMovimientos } from '../services/caja';
import '../styles/caja.css';

type Movimiento = {
	id_movimiento_caja: number;
	fecha_movimiento: string;
	tipo: string;
	descripcion: string;
	monto: number | string;
	usuario_nombre?: string;
};

const formatMoney = (v: number) =>
	v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

const Caja: React.FC = () => {
	const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await getMovimientos();
				setMovimientos(data || []);
			} catch (error) {
				console.error('Error cargando movimientos:', error);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, []);

	const today = new Date().toISOString().slice(0, 10);

	const ingresosHoy = movimientos
		.filter((m) => m.tipo === 'entrada' && (m.fecha_movimiento || '').startsWith(today))
		.reduce((s, m) => s + Number(m.monto || 0), 0);

	const egresosHoy = movimientos
		.filter((m) => m.tipo === 'salida' && (m.fecha_movimiento || '').startsWith(today))
		.reduce((s, m) => s + Number(m.monto || 0), 0);

	const totalIngresos = movimientos
		.filter((m) => m.tipo === 'entrada')
		.reduce((s, m) => s + Number(m.monto || 0), 0);

	const totalEgresos = movimientos
		.filter((m) => m.tipo === 'salida')
		.reduce((s, m) => s + Number(m.monto || 0), 0);

	const totalAcumulado = totalIngresos - totalEgresos;

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-semibold">Caja y Movimientos</h2>
				<button className="bg-blue-600 text-white px-4 py-2 rounded">+ Nuevo Movimiento</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<div className="card">
					<div className="card-title">Ingresos Hoy</div>
					<div className="card-value text-green-600">{formatMoney(ingresosHoy)}</div>
				</div>
				<div className="card">
					<div className="card-title">Egresos Hoy</div>
					<div className="card-value text-red-600">{formatMoney(egresosHoy)}</div>
				</div>
				<div className="card">
					<div className="card-title">Total Ingresos</div>
					<div className="card-value text-blue-600">{formatMoney(totalIngresos)}</div>
				</div>
				<div className="card">
					<div className="card-title">Total Acumulado</div>
					<div className="card-value text-green-700">{formatMoney(totalAcumulado)}</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
				<div className="bg-white rounded shadow p-4 h-64">
					<div className="text-sm text-gray-600 mb-2">Flujo de Caja (Últimos 7 días)</div>
					<div className="placeholder-graph w-full h-44 flex items-end gap-2">
						{/* Simple placeholder bars based on last 7 días computed from movimientos */}
						{Array.from({ length: 7 }).map((_, i) => {
							// quick mock heights using modulo so chart looks varied
							const h = 6 + ((i * 37) % 80);
							return <div key={i} className="bg-gray-200" style={{ width: 20, height: `${h}%` }} />;
						})}
					</div>
				</div>

				<div className="bg-white rounded shadow p-4 h-64">
					<div className="text-sm text-gray-600 mb-2">Tendencia Neta</div>
					<div className="w-full h-44 flex items-center justify-center text-gray-400">(Gráfico sencillo)</div>
				</div>
			</div>

			<div className="bg-white rounded shadow p-4">
				<div className="mb-4 font-semibold">Movimientos Recientes</div>
				{loading ? (
					<div>Cargando movimientos...</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-left text-sm">
							<thead>
								<tr className="text-gray-600">
									<th className="py-2 pr-4">Fecha</th>
									<th className="py-2 pr-4">Tipo</th>
									<th className="py-2 pr-4">Monto</th>
									<th className="py-2 pr-4">Descripción</th>
									<th className="py-2 pr-4">Usuario</th>
								</tr>
							</thead>
							<tbody>
								{movimientos.map((m) => (
									<tr key={m.id_movimiento_caja} className="border-t">
										<td className="py-3 pr-4">{m.fecha_movimiento?.slice(0, 10) || ''}</td>
										<td className="py-3 pr-4">
											<span className={`px-3 py-1 rounded-full text-xs ${m.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
												{m.tipo === 'entrada' ? 'Ingreso' : 'Egreso'}
											</span>
										</td>
										<td className={`py-3 pr-4 ${m.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatMoney(Number(m.monto || 0))}</td>
										<td className="py-3 pr-4 text-gray-700">{m.descripcion}</td>
										<td className="py-3 pr-4 text-gray-600">{m.usuario_nombre || 'Administrador'}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export default Caja;

