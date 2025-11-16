import React, { useState, useEffect } from "react";
import "../styles/clIentesModule.css";
import { Cliente, obtenerClientes, eliminarCliente, actualizarCliente } from "../services/clientesService";
import { FaClipboardList, FaEdit, FaTrash, } from 'react-icons/fa';
import { CgAdd } from "react-icons/cg";

export const ClientesModule = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
    const [formData, setFormData] = useState({
        nombre: "",
        nuip: "",
        telefono: "",
        direccion: "",
        email: "",
    });
    const [confirmAbierto, setConfirmAbierto] = useState(false);
    const [clienteParaPedido, setClienteParaPedido] = useState<Cliente | null>(null);

    useEffect(() => {
        cargarClientesDelServidor();
    }, []);

    const cargarClientesDelServidor = async () => {
        try {
            setCargando(true);
            const datos = await obtenerClientes();
            console.log("Clientes obtenidos:", datos);
            const clientesRecientes = datos.slice(-5).reverse();
            setClientes(clientesRecientes);
            setClientesFiltrados(clientesRecientes);
            setError(null);
        } catch (err) {
            console.error("Error cargando clientes:", err);
            setError("Error al cargar los clientes");
            setClientes([]);
            setClientesFiltrados([]);
        } finally {
            setCargando(false);
        }
    };

    const handleBusqueda = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value.toLowerCase().trim();
        console.log("Buscando:", valor);
        console.log("Clientes totales:", clientes);

        setBusqueda(valor);

        if (valor === "") {
            setClientesFiltrados(clientes);
            console.log("Mostrando todos:", clientes);
        } else {
            const filtrados = clientes.filter((cliente) => {
                const nombre = String(cliente.nombre || "").toLowerCase();
                const nuip = String(cliente.nuip || "").toLowerCase();
                const telefono = String(cliente.telefono || "").toLowerCase();
                const email = String(cliente.email || "").toLowerCase();
                const direccion = String(cliente.direccion || "").toLowerCase();
                const idCliente = String(cliente.id_cliente || "").toLowerCase();

                const coincide =
                    nombre.includes(valor) ||
                    nuip.includes(valor) ||
                    telefono.includes(valor) ||
                    email.includes(valor) ||
                    direccion.includes(valor) ||
                    idCliente.includes(valor);

                return coincide;
            });
            console.log("Filtrados:", filtrados);
            setClientesFiltrados(filtrados);
        }
    };

    const handleAgregarCliente = () => {
        console.log("Agregar nuevo cliente");
    };

    const handleEditar = (cliente: Cliente) => {
        setClienteEditando(cliente);
        setFormData({
            nombre: cliente.nombre,
            nuip: cliente.nuip,
            telefono: cliente.telefono,
            direccion: cliente.direccion,
            email: cliente.email,
        });
        setModalAbierto(true);
    };

    const handleDuplicar = (id: string) => {
        const clienteADuplicar = clientes.find(c => c.id_cliente === id);
        if (clienteADuplicar) {
            console.log("Duplicar cliente:", clienteADuplicar);
        }
    };

    const handleNuevoPedido = (cliente: Cliente) => {
        setClienteParaPedido(cliente);
        setConfirmAbierto(true);
    };

    const confirmarNuevoPedido = () => {
        if (!clienteParaPedido) return;
        const payload = {
            nombre: clienteParaPedido.nombre || "",
            cedula: clienteParaPedido.nuip || "",
            telefono: clienteParaPedido.telefono || "",
            direccion: clienteParaPedido.direccion || "",
            email: clienteParaPedido.email || ""
        };
        try {
            localStorage.setItem("nuevoPedidoCliente", JSON.stringify(payload));
            setConfirmAbierto(false);
            setClienteParaPedido(null);
            window.location.href = "/pedidos";
        } catch (err) {
            console.error("No se pudo abrir nuevo pedido:", err);
        }
    };

    const cancelarConfirmacion = () => {
        setConfirmAbierto(false);
        setClienteParaPedido(null);
    };

    const handleEliminar = async (id: string) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
            try {
                await eliminarCliente(id);
                await cargarClientesDelServidor();
                setBusqueda("");
            } catch (err) {
                console.error("Error al eliminar:", err);
                setError("Error al eliminar el cliente");
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleActualizar = async () => {
        if (!clienteEditando) return;

        try {
            await actualizarCliente(clienteEditando.id_cliente, {
                id_cliente: clienteEditando.id_cliente,
                ...formData,
            });
            setModalAbierto(false);
            setClienteEditando(null);
            await cargarClientesDelServidor();
        } catch (err) {
            console.error("Error al actualizar:", err);
            setError("Error al actualizar el cliente");
        }
    };

    const handleCancelar = () => {
        setModalAbierto(false);
        setClienteEditando(null);
    };

    if (cargando) return <div className="clientes-container"><p>Cargando clientes...</p></div>;

    return (
        <div className="clientes-container">
            <div className="clientes-header">
                <h1>Gestión de Clientes</h1>
            </div>

            <div className="clientes-busqueda">
                <input
                    type="text"
                    placeholder="Buscar por nombre, identificación, teléfono o email..."
                    value={busqueda}
                    onChange={handleBusqueda}
                    className="input-busqueda"
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="clientes-lista">
                <h2>Lista de Clientes ({clientesFiltrados.length})</h2>
                {clientesFiltrados.length > 0 ? (
                    <table className="tabla-clientes">
                        <thead>
                            <tr>
                                <th>Identificación</th>
                                <th>Nombre</th>
                                <th>Teléfono</th>
                                <th>Dirección</th>
                                <th>Email</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clientesFiltrados.map((cliente) => (
                                <tr key={cliente.id_cliente}>
                                    <td>{cliente.nuip}</td>
                                    <td>{cliente.nombre}</td>
                                    <td>{cliente.telefono}</td>
                                    <td>{cliente.direccion}</td>
                                    <td>{cliente.email}</td>
                                    <td className="acciones">
                                        <button
                                            className="btn-accion editar"
                                            onClick={() => handleEditar(cliente)}
                                            title="Editar"
                                        >
                                            <FaEdit /> Editar
                                        </button>
                                        <button
                                            className="btn-accion nuevo-pedido"
                                            onClick={() => handleNuevoPedido(cliente)}
                                            title="Nuevo Pedido"
                                        >
                                            <CgAdd /> Nuevo Pedido
                                        </button>
                                        <button
                                            className="btn-accion eliminar"
                                            onClick={() => handleEliminar(cliente.id_cliente)}
                                            title="Eliminar"
                                        >
                                            <FaTrash /> Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="sin-resultados">No hay clientes que coincidan con la búsqueda</p>
                )}
            </div>

            {modalAbierto && clienteEditando && (
                <div className="modal-overlay" onClick={handleCancelar}>
                    <div className="modal-content compact-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Cliente</h2>
                            <button className="btn-cerrar" onClick={handleCancelar}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Identificación *</label>
                                    <input
                                        type="text"
                                        value={clienteEditando.nuip}
                                        disabled
                                        className="input-disabled"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ingrese el nombre completo"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Teléfono *</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        placeholder="Número de contacto"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleInputChange}
                                        placeholder="Dirección completa"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={handleCancelar}>
                                Cancelar
                            </button>
                            <button className="btn-actualizar" onClick={handleActualizar}>
                                Actualizar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAbierto && clienteParaPedido && (
                <div className="confirm-overlay" onClick={cancelarConfirmacion}>
                    <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-header">
                            <div className="confirm-icon">
                                <FaClipboardList className="clipboard-icon" />
                            </div>
                            <h3 className="confirm-title">Crear nuevo pedido</h3>
                        </div>
                        
                        <div className="confirm-body">
                            <div className="confirm-cliente-info">
                                <div className="info-row">
                                    <span className="info-label">Nombre:</span>
                                    <span className="info-value"><strong>{clienteParaPedido.nombre}</strong></span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Identificación:</span>
                                    <span className="info-value">{clienteParaPedido.nuip}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Teléfono:</span>
                                    <span className="info-value">{clienteParaPedido.telefono}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{clienteParaPedido.email || "No especificado"}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Dirección:</span>
                                    <span className="info-value">{clienteParaPedido.direccion || "No especificada"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="confirm-buttons">
                            <button className="btn-confirm" onClick={confirmarNuevoPedido}>
                                Confirmar
                            </button>
                            <button className="btn-cancel" onClick={cancelarConfirmacion}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientesModule;