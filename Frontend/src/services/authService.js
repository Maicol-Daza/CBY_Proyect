const API_URL = "http://localhost:3000/api/auth"

export const loginRequest = async (credentials) => {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Error en login");
    return res.json();
};
