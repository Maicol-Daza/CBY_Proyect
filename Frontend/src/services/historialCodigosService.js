const API_URL = 'http://localhost:3000/api/historial_codigos';

export async function obtenerHistorialCodigosPorPedido(idPedido) {
    try {
        const response = await fetch(`${API_URL}/pedido/${idPedido}`);
        if (!response.ok) {
            throw new Error('Error al obtener historial de códigos');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en historialCodigosService:', error);
        throw error;
    }
}

export async function obtenerTodoElHistorial() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Error al obtener todo el historial');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en historialCodigosService:', error);
        throw error;
    }
}