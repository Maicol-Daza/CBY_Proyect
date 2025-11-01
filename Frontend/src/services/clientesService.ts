// Define la interfaz para el cliente
export interface Cliente {
    nombre: string;
    cedula: string;
    telefono: string;
    direccion: string;
    email: string;
}

// Función para agregar un cliente
export const agregarCliente = async (cliente: Cliente) => {
    const response = await fetch("http://localhost:3000/api/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cliente),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al agregar el cliente");
    }

    return await response.json();
};