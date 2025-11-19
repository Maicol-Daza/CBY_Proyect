import { useState, useEffect } from "react";
import { ModalUsuario } from "../components/ui/ModalUsuario";
import { leerUsuarios, eliminarUsuario, actualizarUsuario, crearUsuario } from "../services/usuarioService";
import { leerRoles } from "../services/rolService";
import { Layout } from "../components/layout/Layout";
import { FaUsers, FaBriefcase, FaUser, FaCheckCircle, FaPen, FaTrash } from "react-icons/fa";
import "./Pagina.css";
import "../components/ui/ModalUsuario.css"
import "./UsuariosPagina.css";

export const UsuariosPagina = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
    }, []);

    const fetchUsuarios = async () => setUsuarios(await leerUsuarios());
    const fetchRoles = async () => setRoles(await leerRoles());

    const handleSaveUsuario = async (usuarioData) => {
        if (usuarioSeleccionado) {
            await actualizarUsuario(usuarioData.id_usuario, usuarioData);
        } else {
            await crearUsuario(usuarioData);
        }
        await fetchUsuarios();
        setOpenModal(false);
        setUsuarioSeleccionado(null);
    };

    // Cálculos de estadísticas
    const totalUsuarios = usuarios.length;
    const administradores = usuarios.filter(u => u.rol === "Administrador").length;
    const empleados = usuarios.filter(u => u.rol === "Empleado").length;
    const usuariosActivos = usuarios.filter(u => u.activo === true).length;

    return (
        <Layout>
            <div className="pagina-contenedor">
                <div className="usuarios-header">
                    <h2 className="pagina-titulo">Gestión de Usuarios</h2>
                    <button
                        className="pagina-boton"
                        onClick={() => {
                            setUsuarioSeleccionado(null);
                            setOpenModal(true);
                        }}
                    >
                        + Nuevo Usuario
                    </button>
                </div>

                {/* Cards de estadísticas */}
                <div className="usuarios-cards">
                    <div className="card-stat">
                        <div className="card-stat-content">
                            <p className="card-stat-label">Total Usuarios</p>
                            <h3 className="card-stat-numero">{totalUsuarios}</h3>
                        </div>
                        <div className="card-stat-icon icon-users">
                            <FaUsers />
                        </div>
                    </div>

                    <div className="card-stat">
                        <div className="card-stat-content">
                            <p className="card-stat-label">Administradores</p>
                            <h3 className="card-stat-numero">{administradores}</h3>
                        </div>
                        <div className="card-stat-icon icon-briefcase">
                            <FaBriefcase />
                        </div>
                    </div>

                    <div className="card-stat">
                        <div className="card-stat-content">
                            <p className="card-stat-label">Empleados</p>
                            <h3 className="card-stat-numero">{empleados}</h3>
                        </div>
                        <div className="card-stat-icon icon-user">
                            <FaUser />
                        </div>
                    </div>

                    <div className="card-stat">
                        <div className="card-stat-content">
                            <p className="card-stat-label">Usuarios Activos</p>
                            <h3 className="card-stat-numero">{usuariosActivos}</h3>
                        </div>
                        <div className="card-stat-icon icon-check">
                            <FaCheckCircle />
                        </div>
                    </div>
                </div>

                {/* Tabla de usuarios */}
                <div className="usuarios-tabla-section">
                    <h3 className="usuarios-tabla-titulo">Lista de Usuarios</h3>
                    <div className="tabla-contenedor">
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.length > 0 ? (
                                    usuarios.map((u) => (
                                        <tr key={u.id_usuario}>
                                            <td>{u.nombre}</td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`rol-badge rol-${u.rol.toLowerCase()}`}>
                                                    {u.rol}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`estado-badge ${u.activo ? 'activo' : 'inactivo'}`}>
                                                    {u.activo ? '🟢 Activo' : '🔴 Inactivo'}
                                                </span>
                                            </td>
                                            <td className="tabla-acciones">
                                                <button
                                                    onClick={() => {
                                                        setUsuarioSeleccionado(u);
                                                        setOpenModal(true);
                                                    }}
                                                    className="boton-accion boton-editar"
                                                    title="Editar usuario"
                                                >
                                                    <FaPen />
                                                </button>
                                                <button
                                                    onClick={() => eliminarUsuario(u.id_usuario).then(fetchUsuarios)}
                                                    className="boton-accion boton-eliminar"
                                                    title="Eliminar usuario"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="tabla-vacia">
                                            No hay usuarios registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {openModal && (
                    <ModalUsuario
                        onClose={() => {
                            setOpenModal(false);
                            setUsuarioSeleccionado(null);
                        }}
                        onSave={handleSaveUsuario}
                        usuarioSeleccionado={usuarioSeleccionado}
                        roles={roles}
                    />
                )}
            </div>
        </Layout>
    );
};
