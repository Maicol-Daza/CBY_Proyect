// simple service to fetch movimientos de caja from backend
export async function getMovimientos() {
	const res = await fetch('/api/movimientos_caja');
	if (!res.ok) {
		throw new Error('Error fetching movimientos');
	}
	return res.json();
}

export default { getMovimientos };
