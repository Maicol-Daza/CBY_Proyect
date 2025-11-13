// Define la interfaz para el cliente
export interface Cliente {
    id_cliente: string;
    nombre: string;
    nuip: string;
    telefono: string;
    direccion: string;
    email: string;
}

// Función para obtener todos los clientes
export const obtenerClientes = async () => {
    try {
        const response = await fetch("http://localhost:3000/api/clientes", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Error al obtener los clientes");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en obtenerClientes:", error);
        throw error;
    }
};

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

// Función para eliminar un cliente
export const eliminarCliente = async (id: string) => {
    const response = await fetch(`http://localhost:3000/api/clientes/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el cliente");
    }

    return await response.json();
};

// Función para actualizar un cliente
export const actualizarCliente = async (id: string, cliente: Cliente) => {
    const response = await fetch(`http://localhost:3000/api/clientes/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cliente),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el cliente");
    }

    return await response.json();
};