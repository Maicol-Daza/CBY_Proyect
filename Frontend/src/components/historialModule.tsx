import React, { useState, useEffect } from "react";
import "../styles/historialModule.css";
import { FaDownload, FaEye, FaTimes } from "react-icons/fa";
import { obtenerCodigos } from "../services/codigosService";
import { obtenerCajones } from "../services/cajonesService";

export const HistorialModule = () => {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [filtros, setFiltros] = useState({
        busqueda: "",
        estado: "todos",
        fecha: ""
    });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [cargandoDetalles, setCargandoDetalles] = useState(false);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            setCargando(true);
            const response = await fetch("http://localhost:3000/api/pedidos");
            
            if (!response.ok) {
                throw new Error("Error al cargar pedidos");
            }
            
            const data = await response.json();
            setPedidos(data);
            setError(null);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
            setError("No se pudieron cargar los pedidos");
            setPedidos([]);
        } finally {
            setCargando(false);
        }
    };

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return "-";
        try {
            const date = new Date(fecha);
            return date.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
        } catch {
            return fecha;
        }
    };

    const handleVerDetalles = async (id_pedido: number) => {
        try {
            setCargandoDetalles(true);
            const response = await fetch(`http://localhost:3000/api/pedidos/${id_pedido}`);
            
            if (!response.ok) {
                throw new Error("Error al cargar detalles");
            }
            
            const data = await response.json();
            console.log("Datos del pedido (raw):", data);

            // Normalizar campo id_cajon
            const cajonNormalizado =
                data.id_cajon ??
                data.cajon?.id ??
                data.cajon?.numero ??
                data.cajon_id ??
                (typeof data.cajon === "number" ? data.cajon : undefined) ??
                null;

            // Normalizar campo observaciones (puede venir con varios nombres)
            const observacionesNormalizado =
                data.observaciones ??
                data.observacion ??
                data.notas ??
                data.nota ??
                data.comentarios ??
                data.comentario ??
                null;

            const pedidoNormalizado: any = {
                ...data,
                id_cajon: cajonNormalizado,
                observaciones: observacionesNormalizado
            };

            // Resolver nombre del cajón
            let nombreCajon: string | null = data.nombre_cajon ?? data.nombre_cajon_cajon ?? null;

            if (!nombreCajon && pedidoNormalizado.id_cajon) {
                try {
                    const cajones = await obtenerCajones();
                    const cajonMatch = cajones.find((c: any) => Number(c.id_cajon) === Number(pedidoNormalizado.id_cajon));
                    if (cajonMatch) nombreCajon = cajonMatch.nombre_cajon;
                } catch (e) {
                    console.warn("No se pudieron obtener cajones para resolver nombre:", e);
                }
            }

            if (!nombreCajon) {
                try {
                    const codigos = await obtenerCodigos();
                    const codigoMatch = codigos.find((c: any) =>
                        Number(c.id_codigo) === Number(data.id_codigo) ||
                        Number(c.id_pedido) === Number(pedidoNormalizado.id_pedido) ||
                        Number(c.id_cajon) === Number(pedidoNormalizado.id_cajon)
                    );
                    if (codigoMatch) nombreCajon = codigoMatch.nombre_cajon;
                } catch (e) {
                    console.warn("No se pudieron obtener códigos para resolver nombre del cajón:", e);
                }
            }

            pedidoNormalizado.nombre_cajon = nombreCajon ?? null;

            console.log("Prendas:", pedidoNormalizado.prendas);
            console.log("Observaciones normalizadas:", pedidoNormalizado.observaciones);
            
            if (pedidoNormalizado.prendas && pedidoNormalizado.prendas[0]) {
                console.log("Primera prenda arreglos:", pedidoNormalizado.prendas[0].arreglos);
            }

            setPedidoSeleccionado(pedidoNormalizado);
        } catch (error) {
            console.error("Error cargando detalles:", error);
            alert("Error al cargar los detalles del pedido");
        } finally {
            setCargandoDetalles(false);
        }
    };

    const handleCerrarDetalles = () => {
        setPedidoSeleccionado(null);
    };

    const pedidosFiltrados = pedidos.filter(pedido => {
        const cumpleBusqueda = 
            pedido.id_pedido?.toString().includes(filtros.busqueda.toLowerCase()) ||
            pedido.cliente_nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase());
        
        const cumpleEstado = 
            filtros.estado === "todos" || pedido.estado === filtros.estado;
        
        const cumpleFecha = 
            filtros.fecha === "" || pedido.fecha_pedido?.split("T")[0] === filtros.fecha;
        
        return cumpleBusqueda && cumpleEstado && cumpleFecha;
    });

    return (
        <div className="historial-container">
            <div className="historial-header">
                <h1>Historial de Pedidos</h1>
                <div className="export-buttons">
                    <button className="btn-export btn-excel" type="button">
                        <FaDownload /> Excel
                    </button>
                    <button className="btn-export btn-pdf" type="button">
                        <FaDownload /> PDF
                    </button>
                </div>
            </div>

            <div className="filtros-section">
                <h3 className="filtros-title">Filtros de Búsqueda</h3>
                
                <div className="filtros-grid">
                    <div className="filtro-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            name="busqueda"
                            placeholder="Código o cliente..."
                            value={filtros.busqueda}
                            onChange={handleFiltroChange}
                            className="input-filtro"
                        />
                    </div>

                    <div className="filtro-group">
                        <label>Estado</label>
                        <select
                            name="estado"
                            value={filtros.estado}
                            onChange={handleFiltroChange}
                            className="select-filtro"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="en_proceso">En proceso</option>
                            <option value="listo">Finalizado</option>
                            <option value="entregado">Entregado</option>
                        </select>
                    </div>

                    <div className="filtro-group">
                        <label>Fecha</label>
                        <input
                            type="date"
                            name="fecha"
                            value={filtros.fecha}
                            onChange={handleFiltroChange}
                            className="input-filtro"
                        />
                    </div>
                </div>
            </div>

            <div className="pedidos-section">
                <h3 className="pedidos-title">Pedidos ({pedidosFiltrados.length})</h3>

                <div className="tabla-container">
                    {cargando ? (
                        <p className="cargando">Cargando pedidos...</p>
                    ) : error ? (
                        <p className="error">{error}</p>
                    ) : pedidosFiltrados && pedidosFiltrados.length > 0 ? (
                        <table className="tabla-pedidos">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Cliente</th>
                                    <th>Fecha Pedido</th>
                                    <th>Fecha Entrega</th>
                                    <th>Estado</th>
                                    <th>Total</th>
                                    <th>Saldo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pedidosFiltrados.map((pedido) => (
                                    <tr key={pedido.id_pedido}>
                                        <td>{pedido.id_pedido || "-"}</td>
                                        <td>{pedido.cliente_nombre || "-"}</td>
                                        <td>{formatearFecha(pedido.fecha_pedido)}</td>
                                        <td>{formatearFecha(pedido.fecha_entrega)}</td>
                                        <td>
                                            <span className={`estado-badge estado-${pedido.estado?.toLowerCase() || "en_proceso"}`}>
                                                {pedido.estado === "en_proceso" ? "En proceso" :
                                                 pedido.estado === "listo" ? "Finalizado" :
                                                 pedido.estado === "entregado" ? "Entregado" :
                                                 pedido.estado || "En proceso"}
                                            </span>
                                        </td>
                                        <td className="monto">${parseFloat(pedido.total_pedido || 0).toLocaleString("es-CO")}</td>
                                        <td className={parseFloat(pedido.saldo || 0) > 0 ? "monto pendiente" : "monto pagado"}>
                                            ${parseFloat(pedido.saldo || 0).toLocaleString("es-CO")}
                                        </td>
                                        <td className="acciones">
                                            <button 
                                                className="btn-accion-ver" 
                                                title="Ver detalles" 
                                                type="button"
                                                onClick={() => handleVerDetalles(pedido.id_pedido)}
                                            >
                                                <FaEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="sin-resultados">No hay pedidos que coincidan con los filtros</p>
                    )}
                </div>
            </div>

            {/* MODAL DETALLES DEL PEDIDO */}
            {pedidoSeleccionado && (
                <div className="modal-overlay" onClick={handleCerrarDetalles}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalle del Pedido - {pedidoSeleccionado.id_pedido}</h2>
                            <button className="btn-cerrar" onClick={handleCerrarDetalles} type="button">
                                <FaTimes />
                            </button>
                        </div>

                        {cargandoDetalles ? (
                            <p className="cargando">Cargando detalles...</p>
                        ) : (
                            <div className="modal-body">
                                {/* INFORMACIÓN DEL CLIENTE Y PEDIDO - LADO A LADO */}
                                <div className="info-container">
                                    {/* INFORMACIÓN DEL CLIENTE */}
                                    <div className="detalle-seccion cliente-info">
                                        <h3>Información del Cliente</h3>
                                        <div className="info-items">
                                            <div className="info-item">
                                                <label>Nombre:</label>
                                                <p>{pedidoSeleccionado.cliente_nombre || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Identificación:</label>
                                                <p>{pedidoSeleccionado.cliente_cedula || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Teléfono:</label>
                                                <p>{pedidoSeleccionado.cliente_telefono || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Email:</label>
                                                <p>{pedidoSeleccionado.cliente_email || "-"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INFORMACIÓN DEL PEDIDO */}
                                    <div className="detalle-seccion pedido-info">
                                        <h3>Información del Pedido</h3>
                                        <div className="info-items">
                                            <div className="info-item">
                                                <label>Código:</label>
                                                <p>{pedidoSeleccionado.id_pedido}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Cajón:</label>
                                              <p>{pedidoSeleccionado.nombre_cajon ?? pedidoSeleccionado.id_cajon ?? "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Fecha Inicio:</label>
                                                <p>{formatearFecha(pedidoSeleccionado.fecha_pedido)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Fecha Entrega:</label>
                                                <p>{formatearFecha(pedidoSeleccionado.fecha_entrega)}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Estado:</label>
                                                <p>
                                                    <span className={`estado-badge estado-${pedidoSeleccionado.estado?.toLowerCase()}`}>
                                                        {pedidoSeleccionado.estado === "en_proceso" ? "En proceso" :
                                                         pedidoSeleccionado.estado === "listo" ? "Finalizado" :
                                                         pedidoSeleccionado.estado === "entregado" ? "Entregado" :
                                                         pedidoSeleccionado.estado || "En proceso"}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* PRENDAS Y ARREGLOS */}
                                {pedidoSeleccionado.prendas && pedidoSeleccionado.prendas.length > 0 && (
                                    <div className="detalle-seccion prendas-seccion">
                                        <h3>Prendas y Arreglos</h3>
                                        <div className="prendas-list">
                                            {pedidoSeleccionado.prendas.map((prenda: any, idx: number) => (
                                                <div key={idx} className="prenda-card">
                                                    <div className="prenda-top">
                                                        <div className="prenda-info">
                                                            <p className="prenda-nombre">
                                                                <strong>{prenda.descripcion || prenda.nombre || "Sin descripción"}</strong>
                                                            </p>
                                                            <p className="prenda-cantidad">
                                                                Cantidad: <strong>{prenda.cantidad || 0}</strong>
                                                            </p>
                                                        </div>
                                                        <p className="prenda-precio">
                                                            ${parseFloat(prenda.precio_unitario || prenda.precio || 0).toLocaleString("es-CO")}
                                                        </p>
                                                    </div>
                                                    
                                                    {prenda.arreglos && Array.isArray(prenda.arreglos) && prenda.arreglos.length > 0 ? (
                                                        <div className="arreglos-container">
                                                            <p className="arreglos-titulo"><strong>Ajustes/Arreglos:</strong></p>
                                                            {prenda.arreglos.map((arreglo: any, idx2: number) => {
                                                                const nombreArreglo = arreglo.nombre || arreglo.tipo || arreglo.descripcion || "Sin nombre";
                                                                const precioArreglo = parseFloat(arreglo.precio || arreglo.valor || 0);
                                                                
                                                                return (
                                                                    <div key={idx2} className="arreglo-item">
                                                                        <div className="arreglo-content">
                                                                            <span className="arreglo-nombre">{nombreArreglo}</span>
                                                                        </div>
                                                                        <span className="arreglo-precio">
                                                                            ${precioArreglo.toLocaleString("es-CO")}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="arreglos-container">
                                                            <p className="arreglos-titulo"><strong>Ajustes/Arreglos:</strong></p>
                                                            <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>
                                                                No hay ajustes registrados
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OBSERVACIONES */}
                                <div className="detalle-seccion observaciones-seccion">
                                    <h3>Observaciones</h3>
                                    {pedidoSeleccionado.observaciones ? (
                                        <p>{pedidoSeleccionado.observaciones}</p>
                                    ) : (
                                        <p style={{ color: "#999", fontStyle: "italic" }}>
                                            No hay observaciones registradas
                                        </p>
                                    )}
                                </div>

                                {/* RESUMEN FINANCIERO */}
                                <div className="detalle-seccion resumen-financiero">
                                    <h3>Resumen Financiero</h3>
                                    <div className="resumen-items">
                                        <div className="resumen-item">
                                            <label>Total del pedido:</label>
                                            <p>${parseFloat(pedidoSeleccionado.total_pedido || 0).toLocaleString("es-CO")}</p>
                                        </div>
                                        <div className="resumen-item">
                                            <label>Abono inicial:</label>
                                            <p>${parseFloat(pedidoSeleccionado.abono || 0).toLocaleString("es-CO")}</p>
                                        </div>
                                        <div className="resumen-item highlight">
                                            <label>Saldo pendiente:</label>
                                            <p>${parseFloat(pedidoSeleccionado.saldo || 0).toLocaleString("es-CO")}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialModule;