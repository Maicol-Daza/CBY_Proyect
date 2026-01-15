import React, { useState } from "react";
import "../styles/header.css"
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaHome, FaUsers, FaClipboardList, FaHistory, FaCashRegister, FaCog, FaSignOutAlt, FaTshirt, FaBars, FaTimes } from 'react-icons/fa';

type User = { name: string; role?: string; };
type Props = { user?: User; onLogout?: () => void; };


export default function Header({ user = { name: "", role: "" }, onLogout }: Props) {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const items = [
        { key: "/pedidos", label: "Pedidos", icon: <FaClipboardList className="text-xl" /> },
        { key: "/clientes", label: "Clientes", icon: <FaUsers className="text-xl" /> },
        { key: "/historialPedidos", label: "Historial", icon: <FaHistory className="text-xl" /> },
        { key: "/moduloCaja", label: "Caja", icon: <FaCashRegister className="text-xl" /> },
        { key: "/configuracionAjustes", label: "Config. Ajustes", icon: <FaCog className="text-xl" /> },
    ];

    const handleNavClick = () => {
        setMenuOpen(false);
    };

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="brand">
                    <Link to="/pedidos" className="brand-link">
                        <FaTshirt className="brand-icon" />
                        <span className="brand-text">Clínica del Bluyin</span>
                    </Link>
                </div>

                {/* Menú hamburguesa */}
                <button 
                    className="hamburger-button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>

                {/* Navegación */}
                <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                    <ul className="nav-list">
                        {items.map((it) => {
                            const active = location.pathname === it.key;
                            return (
                                <li key={it.key}>
                                    <Link 
                                        to={it.key} 
                                        className={active ? "nav-button active" : "nav-button"}
                                        onClick={handleNavClick}
                                    >
                                        <span className="icon-container">{it.icon}</span>
                                        <span className="label">{it.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                    <div className="mobile-user-section">
                        <div className="mobile-user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-role">{user.role}</span>
                        </div>
                        <button 
                            onClick={() => {
                                onLogout?.();
                                setMenuOpen(false);
                            }} 
                            className="mobile-logout-button"
                        >
                            <FaSignOutAlt />
                            <span>Salir</span>
                        </button>
                    </div>
                </nav>

                <div className="user-info">
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                    </div>
                    <button 
                        onClick={() => {
                            onLogout?.();
                            setMenuOpen(false);
                        }} 
                        className="logout-button"
                    >
                        <FaSignOutAlt />
                        <span>Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
