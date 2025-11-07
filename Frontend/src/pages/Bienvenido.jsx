import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LayoutPublic from "../components/layout/LayoutPublic";

import "./Principal.css";

export const Bienvenido = () => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <LayoutPublic>
            <div className="bienvenido-dashboard">
                <h1 className="bienvenido-saludo">Bienvenido {user?.nombre}</h1>
                <p className="bienvenido-rol">Rol: {user?.rol}</p>
            </div>
        </LayoutPublic>
    );
};
