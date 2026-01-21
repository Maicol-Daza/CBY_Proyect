import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { FiUsers, FiShield, FiLock, FiLink, FiMonitor } from "react-icons/fi";
import "../../styles/Navbar.css";

export const Navbar = () => {
    const { user } = useAuthContext();

    // Si no hay usuario o no es admin, solo mostramos navbar básico o nada
    if (!user || user.rol !== "Administrador") return null;

    return (
        <nav className="header-nav">
            <NavLink 
                to="/usuarios" 
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
                <FiUsers className="icon-container" />
                <span className="label">Usuarios</span>
            </NavLink>
            
            <NavLink 
                to="/control-administrador" 
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
                <FiMonitor className="icon-container" />
                <span className="label">Control Administrador</span>
            </NavLink>
        </nav>
    );
};
