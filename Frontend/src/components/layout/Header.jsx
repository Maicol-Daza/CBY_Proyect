import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { Navbar } from "./Navbar";
import { FaTshirt } from 'react-icons/fa';
import "../../styles/HeaderLayout.css";

export const Header = () => {
    const { user, logout } = useAuthContext();
    const navigate = useNavigate();
    const isAdmin = user?.rol === "Administrador";

    return (
        <header className={`app-header ${isAdmin ? "admin-header" : "employee-header"}`}>
            <div className="container">
                <div className="header-left">
                    <div className="brand">
                        <a onClick={() => navigate("/usuarios")}> 
                            <span><FaTshirt className="text-2xl" /></span>
                            Clínica del Bluyin
                        </a>
                    </div>
                </div>
                {isAdmin && <Navbar />}
                <div className="header-right">
                    <div className="user-info">
                        <div className="user-details">
                            <span className="user-name">{user?.nombre}</span>
                            <span className="user-role">{user?.rol}</span>
                        </div>
                    </div>
                    <button onClick={logout} className="logout-button">
                        <FiLogOut />
                        <span className="label">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
};