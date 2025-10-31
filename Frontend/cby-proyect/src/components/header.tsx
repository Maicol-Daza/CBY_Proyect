// import React from "react";
import "../styles/header.css"
import { useNavigate, useLocation } from "react-router-dom";

type User = { name: string; role?: string; };
type Props = { user?: User; onLogout?: () => void; };


export default function Header({ user = { name: "", role: "" }, onLogout }: Props) {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { key: "/", label: "Inicio" },
        { key: "/clientes", label: "Clientes" },
        { key: "/pedidos", label: "Pedidos" },
        { key: "/historialPedidos", label: "Historial" },
        { key: "/moduloCaja", label: "Caja" },
        { key: "/ConfiguracionAjustes", label: "Config. Ajustes" },
    ];

    return (
        <header className="app-header"> {/* agregado app-header */}
            <div className="container mx-auto flex items-center justify-between px-4 py-2">
                <div className="brand">Clínica del Bluyin</div>

                <nav>
                    <ul className="flex gap-2">
                        {items.map((it) => {
                            const active = location.pathname === it.key;
                            return (
                                <li key={it.key}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(it.key)}
                                        className={`nav-button ${active ? "active" : ""}`} // usa clase nav-button
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {it.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="user-info">
                    <div className="text-sm text-gray-700">{user.name} - <span className="text-xs text-gray-500">{user.role}</span></div>
                    <button onClick={() => onLogout?.()} className="logout">Salir</button>
                </div>
            </div>
        </header>
    );
}
// ...existing code...
