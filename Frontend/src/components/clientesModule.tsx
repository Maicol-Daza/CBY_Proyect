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
    const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
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
        // Aplicar lógica de lista blanca en el frontend (saneamiento en tiempo real)
        let sanitized = value;
        if (name === 'nombre') {
            // Solo letras A-Z y espacios (sin acentos)
            sanitized = value.replace(/[^A-Za-z ]/g, '');
        } else if (name === 'nuip') {
            // Solo dígitos y puntos
            sanitized = value.replace(/[^0-9.]/g, '');
        } else if (name === 'telefono') {
            // Solo dígitos
            sanitized = value.replace(/[^0-9]/g, '');
        } else if (name === 'direccion') {
            // Letras, números, espacios, # y -
            sanitized = value.replace(/[^A-Za-z0-9 #\-]/g, '');
        } else if (name === 'email') {
            // Permitir caracteres básicos de email
            sanitized = value.replace(/[^A-Za-z0-9@._\-]/g, '');
        }

        setFormData({
            ...formData,
            [name]: sanitized,
        });

        // Validación inmediata (solo para feedback)
        try {
            // importar validadores dinámicamente para evitar problemas de orden
            // (se importó arriba en parche siguiente)
        } catch (err) {}
    };

    const handleActualizar = async () => {
        if (!clienteEditando) return;

        // Validar con lista blanca antes de enviar
        const validators = require('../utils/validators');
        const errs: { [k: string]: string } = {};

        if (!validators.isValidName(formData.nombre)) errs.nombre = validators.ERR.nombre;
        if (!validators.isValidCedula(formData.nuip)) errs.nuip = validators.ERR.cedula;
        if (!validators.isValidTelefono(formData.telefono)) errs.telefono = validators.ERR.telefono;
        if (formData.email && !validators.isValidEmail(formData.email)) errs.email = validators.ERR.email;
        if (formData.direccion && !validators.isValidDireccion(formData.direccion)) errs.direccion = validators.ERR.direccion;

        setFormErrors(errs);
        if (Object.keys(errs).length > 0) {
            setError('Por favor corrija los errores del formulario antes de continuar.');
            return;
        }

        try {
            await actualizarCliente(clienteEditando.id_cliente, {
                id_cliente: clienteEditando.id_cliente,
                ...formData,
            });
            setModalAbierto(false);
            setClienteEditando(null);
            setFormErrors({});
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

    if (cargando) return <div className="cm-clientes-container"><p>Cargando clientes...</p></div>;

    return (
        <div className="cm-clientes-container">
            <div className="cm-clientes-header">
                <h1>Gestión de Clientes</h1>
            </div>

            <div className="cm-clientes-busqueda">
                <input
                    type="text"
                    placeholder="Buscar por nombre, identificación, teléfono o email..."
                    value={busqueda}
                    onChange={handleBusqueda}
                    className="cm-input-busqueda"
                />
            </div>

            {error && <div className="cm-error-message">{error}</div>}

            <div className="cm-clientes-lista">
                <h2>Lista de Clientes ({clientesFiltrados.length})</h2>
                {clientesFiltrados.length > 0 ? (
                    <table className="cm-tabla-clientes">
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
                                    <td className="cm-acciones">
                                        <button
                                            className="cm-btn-accion cm-editar"
                                            onClick={() => handleEditar(cliente)}
                                            title="Editar"
                                        >
                                            <FaEdit /> Editar
                                        </button>
                                        <button
                                            className="cm-btn-accion cm-nuevo-pedido"
                                            onClick={() => handleNuevoPedido(cliente)}
                                            title="Nuevo Pedido"
                                        >
                                            <CgAdd /> Nuevo Pedido
                                        </button>
                                        <button
                                            className="cm-btn-accion cm-eliminar"
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
                    <p className="cm-sin-resultados">No hay clientes que coincidan con la búsqueda</p>
                )}
            </div>

            {modalAbierto && clienteEditando && (
                <div className="cm-modal-overlay" onClick={handleCancelar}>
                    <div className="cm-modal-content-clientes cm-compact-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal-header">
                            <h2>Editar Cliente</h2>
                            <button className="cm-btn-cerrar" onClick={handleCancelar}>✕</button>
                        </div>

                        <div className="cm-modal-body-clientes">
                            <div className="cm-form-grid">
                                <div className="cm-form-group">
                                    <label>Identificación *</label>
                                    <input
                                        type="text"
                                        value={clienteEditando.nuip}
                                        disabled
                                        className="cm-input-disabled"
                                    />
                                </div>

                                <div className="cm-form-group">
                                    <label>Nombre *</label>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        placeholder="Ingrese el nombre completo"
                                    />
                                    {formErrors.nombre && (
                                        <div className="field-error">{formErrors.nombre}</div>
                                    )}
                                </div>

                                <div className="cm-form-group">
                                    <label>Teléfono *</label>
                                    <input
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleInputChange}
                                        placeholder="Número de contacto"
                                    />
                                    {formErrors.telefono && (
                                        <div className="field-error">{formErrors.telefono}</div>
                                    )}
                                </div>

                                <div className="cm-form-group cm-full-width">
                                    <label>Dirección</label>
                                    <input
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleInputChange}
                                        placeholder="Dirección completa"
                                    />
                                    {formErrors.direccion && (
                                        <div className="field-error">{formErrors.direccion}</div>
                                    )}
                                </div>

                                <div className="cm-form-group cm-full-width">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="correo@ejemplo.com"
                                    />
                                    {formErrors.email && (
                                        <div className="field-error">{formErrors.email}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="cm-modal-footer">
                            <button className="cm-btn-cancelar" onClick={handleCancelar}>
                                Cancelar
                            </button>
                            <button className="cm-btn-actualizar" onClick={handleActualizar}>
                                Actualizar Cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmAbierto && clienteParaPedido && (
                <div className="cm-confirm-overlay" onClick={cancelarConfirmacion}>
                    <div className="cm-confirm-box" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-confirm-header">
                            <div className="cm-confirm-icon">
                                <FaClipboardList className="cm-clipboard-icon" />
                            </div>
                            <h3 className="cm-confirm-title">Crear nuevo pedido</h3>
                        </div>
                        
                        <div className="cm-confirm-body">
                            <div className="cm-confirm-cliente-info">
                                <div className="cm-info-row">
                                    <span className="cm-info-label">Nombre:</span>
                                    <span className="cm-info-value"><strong>{clienteParaPedido.nombre}</strong></span>
                                </div>
                                <div className="cm-info-row">
                                    <span className="cm-info-label">Identificación:</span>
                                    <span className="cm-info-value">{clienteParaPedido.nuip}</span>
                                </div>
                                <div className="cm-info-row">
                                    <span className="cm-info-label">Teléfono:</span>
                                    <span className="cm-info-value">{clienteParaPedido.telefono}</span>
                                </div>
                                <div className="cm-info-row">
                                    <span className="cm-info-label">Email:</span>
                                    <span className="cm-info-value">{clienteParaPedido.email || "No especificado"}</span>
                                </div>
                                <div className="cm-info-row">
                                    <span className="cm-info-label">Dirección:</span>
                                    <span className="cm-info-value">{clienteParaPedido.direccion || "No especificada"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="cm-confirm-buttons">
                            <button className="cm-btn-confirm" onClick={confirmarNuevoPedido}>
                                Confirmar
                            </button>
                            <button className="cm-btn-cancel" onClick={cancelarConfirmacion}>
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