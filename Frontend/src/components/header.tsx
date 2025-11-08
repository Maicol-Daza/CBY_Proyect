import React from "react";
import "../styles/header.css"
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaHome, FaUsers, FaClipboardList, FaHistory, FaCashRegister, FaCog, FaSignOutAlt, FaTshirt } from 'react-icons/fa';

type User = { name: string; role?: string; };
type Props = { user?: User; onLogout?: () => void; };


export default function Header({ user = { name: "", role: "" }, onLogout }: Props) {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { key: "/bienvenido", label: "Inicio", icon: <FaHome className="text-xl" /> },
        { key: "/clientes", label: "Clientes", icon: <FaUsers className="text-xl" /> },
        { key: "/pedidos", label: "Pedidos", icon: <FaClipboardList className="text-xl" /> },
        { key: "/historialPedidos", label: "Historial", icon: <FaHistory className="text-xl" /> },
        { key: "/moduloCaja", label: "Caja", icon: <FaCashRegister className="text-xl" /> },
        { key: "/configuracionAjustes", label: "Config. Ajustes", icon: <FaCog className="text-xl" /> },
    ];

    return (
        <header className="app-header">
            <div className="container mx-auto flex items-center justify-between px-4 py-2">
                <div className="brand">
                    <Link to="/bienvenido" className="flex items-center gap-2">
                        <FaTshirt className="text-2xl" />
                        <span>Clínica del Bluyin</span>
                    </Link>
                </div>

                <nav>
                    <ul className="flex gap-2">
                        {items.map((it) => {
                            const active = location.pathname === it.key;
                            return (
                                <li key={it.key}>
                                    <Link 
                                        to={it.key} 
                                        className={active ? "nav-button active" : "nav-button"}
                                    >
                                        <span className="icon-container">{it.icon}</span>
                                        <span className="label">{it.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="user-info">
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                    </div>
                    <button onClick={() => onLogout?.()} className="logout-button">
                        <FaSignOutAlt />
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
