const API_URL = "http://localhost:3000/api/auth"

export const loginRequest = async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) {
        // Propaga el mensaje de error específico del backend
        throw new Error(data.error || "Error en login");
    }
    return data;
};
