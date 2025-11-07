import { useState, useEffect } from "react";
import { loginRequest } from "../services/authService";

export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    useEffect(() => {
        if (token && !user) {
        // Aquí se valida el token del backend
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) setUser(storedUser);
        }
    }, [token]);

    const login = async (email, password) => {
        const data = await loginRequest({ email, password });

        if (data.token) {
        setToken(data.token);
        setUser(data.usuario);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.usuario));

        return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return { user, token, login, logout };
};
