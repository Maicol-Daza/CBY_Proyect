import React from "react";
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
        { key: "/configAjustes", label: "Config. Arreglos" },
    ];

    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto flex items-center justify-between px-4 py-2">
                <div className="text-blue-600 font-semibold">Clínica del Bluyin</div>

                <nav>
                    <ul className="flex gap-2">
                        {items.map((it) => {
                            const active = location.pathname === it.key;
                            return (
                                <li key={it.key}>
                                    <button
                                        type="button"
                                        onClick={() => navigate(it.key)}
                                        className={`px-3 py-1 rounded-md ${active ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {it.label}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-700">{user.name} - <span className="text-xs text-gray-500">{user.role}</span></div>
                    <button onClick={() => onLogout?.()} className="text-sm text-gray-600">Salir</button>
                </div>
            </div>
        </header>
    );
}
