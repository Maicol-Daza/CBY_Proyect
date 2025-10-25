import React, { useState } from "react";
import "../styles/configAjustes.css";

/**
 * Componente básico de configuración de ajustes.
 * Props opcionales:
 * - tiposPrenda: array de strings con los tipos de prenda
 * - ajustes: array de { id, nombre, precio } (si no se pasa, muestra placeholder)
 */
export default function ConfigAjustes({ tiposPrenda = ["Buso", "Pantalón", "Camisa", "Vestido"], ajustes = [] }) {
    const [tipo, setTipo] = useState(tiposPrenda[0] || "Buso");
    const [constructor, setConstructor] = useState([]); // ajustes temporales añadidos por el usuario

    const agregarAjuste = () => {
        const nuevo = { id: `c-${Date.now()}`, nombre: "Nuevo ajuste", precio: 0 };
        setConstructor((s) => [...s, nuevo]);
    };

    const quitarAjuste = (id) => {
        setConstructor((s) => s.filter((x) => x.id !== id));
    };

    return (
        <div className="cajustes-root">
            <div className="cajustes-card header-card">
                <h2>Configuración de Arreglos por Prenda</h2>

                <div className="field-row">
                    <label className="field-label">Seleccionar Tipo de Prenda</label>
                    <select className="field-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {tiposPrenda.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="cajustes-card constructor-card">
                <div className="constructor-header">
                    <div>
                        <div className="subtitle">Constructor de Ajustes - <strong>{tipo}</strong></div>
                        <div className="subdesc">Arreglos seleccionados para esta prenda</div>
                    </div>

                    <button className="btn-add" onClick={agregarAjuste}>
                        <span className="plus">+</span> Agregar Ajuste
                    </button>
                </div>

                <div className="constructor-area dashed">
                    {constructor.length === 0 ? (
                        <div className="empty">
                            <div>No hay ajustes configurados</div>
                            <div className="hint">Haga clic en "Agregar Ajuste" para comenzar</div>
                        </div>
                    ) : (
                        <ul className="constructor-list">
                            {constructor.map((c) => (
                                <li key={c.id} className="constructor-item">
                                    <div className="item-name">{c.nombre}</div>
                                    <div className="item-actions">
                                        <div className="item-price">${c.precio}</div>
                                        <button className="btn-remove" onClick={() => quitarAjuste(c.id)}>Eliminar</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className="cajustes-card existentes-card">
                <h3>Arreglos Existentes en el Sistema</h3>

                {Array.isArray(ajustes) && ajustes.length > 0 ? (
                    <div className="existing-grid">
                        {ajustes.map((a) => (
                            <div key={a.id} className="existing-item">
                                <div className="existing-name">{a.nombre}</div>
                                <div className="existing-price">${Number(a.precio).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="loading-placeholder">Los arreglos se cargarán dinámicamente desde la base de datos.</div>
                )}
            </div>
        </div>
    );
}