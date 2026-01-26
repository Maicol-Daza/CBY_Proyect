import React, { useState } from "react";
import "../styles/header.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaUsers, FaClipboardList, FaHistory, FaCashRegister, FaCog, FaSignOutAlt, FaTshirt, FaBars } from 'react-icons/fa';

type User = { name: string; role?: string };
type Props = { user?: User; onLogout?: () => void };

const navItems = [
    { key: "/pedidos", label: "Pedidos", icon: <FaClipboardList /> },
    { key: "/clientes", label: "Clientes", icon: <FaUsers /> },
    { key: "/historialPedidos", label: "Historial", icon: <FaHistory /> },
    { key: "/moduloCaja", label: "Caja", icon: <FaCashRegister /> },
    { key: "/configuracionAjustes", label: "Config. Ajustes", icon: <FaCog /> },
];

export default function Header({ user = { name: "", role: "" }, onLogout }: Props) {
    const location = useLocation();
    const [showMenu, setShowMenu] = useState(false);

    // Cierra el menú al navegar
    const handleNav = () => setShowMenu(false);

    return (
        <header className="app-header">
            <div className="header-container">
                <div className="brand">
                    <Link to="/pedidos" className="brand-link">
                        <FaTshirt className="brand-icon" />
                        <span className="brand-text">Clínica del Bluyin</span>
                    </Link>
                </div>

                {/* Menú de navegación principal (escritorio) */}
                <nav className="nav-desktop">
                    <ul className="nav-list">
                        {navItems.map((it) => (
                            <li key={it.key}>
                                <Link
                                    to={it.key}
                                    className={location.pathname === it.key ? "nav-button active" : "nav-button"}
                                >
                                    <span className="icon-container">{it.icon}</span>
                                    <span className="label">{it.label}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Botón hamburguesa solo visible en móvil */}
                <button
                    className="hamburger-button"
                    onClick={() => setShowMenu((v) => !v)}
                    aria-label="Abrir menú"
                >
                    <FaBars />
                </button>

                {/* Menú lateral/desplegable para móvil */}
                {showMenu && (
                    <div className="mobile-menu-overlay" onClick={handleNav}>
                        <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
                            <ul>
                                {navItems.map((it) => (
                                    <li key={it.key}>
                                        <Link
                                            to={it.key}
                                            className={location.pathname === it.key ? "nav-button active" : "nav-button"}
                                            onClick={handleNav}
                                        >
                                            <span className="icon-container">{it.icon}</span>
                                            <span className="label">{it.label}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="mobile-user-info">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">{user.role}</span>
                                <button
                                    className="logout-button"
                                    onClick={() => {
                                        onLogout?.();
                                        setShowMenu(false);
                                    }}
                                >
                                    <FaSignOutAlt /> Salir
                                </button>
                            </div>
                        </nav>
                    </div>
                )}

                {/* Info usuario y logout (escritorio) */}
                <div className="user-info">
                    <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-role">{user.role}</span>
                    </div>
                    <button
                        onClick={() => onLogout?.()}
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
