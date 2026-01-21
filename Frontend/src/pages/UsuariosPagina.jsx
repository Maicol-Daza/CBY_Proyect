import { useState, useEffect } from "react";
import { ModalUsuario } from "../components/ui/ModalUsuario";
import { leerUsuarios, eliminarUsuario, actualizarUsuario, crearUsuario } from "../services/usuarioService";
import { leerRoles, crearRol, actualizarRol, eliminarRol } from "../services/rolService";
import { leerPermisos, crearPermiso, actualizarPermiso, eliminarPermiso } from "../services/permisoService";
import { leerRolPermisos, crearRolPermiso, eliminarRolPermiso, leerPermisosDeRol } from "../services/rolPermisoService";
import { ModalRol } from "../components/ui/ModalRol";
import { ModalPermiso } from "../components/ui/ModalPermiso";
import { ModalRolPermiso } from "../components/ui/ModalRolPermiso";
import { Layout } from "../components/layout/Layout";
import { FaUsers, FaBriefcase, FaUser, FaCheckCircle, FaEdit, FaTrash } from "react-icons/fa";
import { FaShieldAlt, FaLock, FaKey } from "react-icons/fa";
import "../styles/Pagina.css";
import "../styles/ModalUsuario.css";
import "../styles/UsuariosPagina.css";

export const UsuariosPagina = () => {
    // Estados para Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
    const [openModalUsuario, setOpenModalUsuario] = useState(false);

    // Estados para Roles
    const [roles, setRoles] = useState([]);
    const [rolSeleccionado, setRolSeleccionado] = useState(null);
    const [openModalRol, setOpenModalRol] = useState(false);

    // Estados para Permisos
    const [permisos, setPermisos] = useState([]);
    const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
    const [openModalPermiso, setOpenModalPermiso] = useState(false);

    // Estados para Rol-Permiso
    const [rolPermisos, setRolPermisos] = useState([]);
    const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);
    const [openModalRolPermiso, setOpenModalRolPermiso] = useState(false);

    // Estado para control de pestañas
    const [pestanaActiva, setPestanaActiva] = useState("usuarios");

    useEffect(() => {
        fetchUsuarios();
        fetchRoles();
        fetchPermisos();
        fetchRolPermisos();
    }, []);

    // Funciones para Usuarios
    const fetchUsuarios = async () => setUsuarios(await leerUsuarios());

    const handleSaveUsuario = async (usuarioData) => {
        if (usuarioSeleccionado) {
            await actualizarUsuario(usuarioData.id_usuario, usuarioData);
        } else {
            await crearUsuario(usuarioData);
        }
        await fetchUsuarios();
        setOpenModalUsuario(false);
        setUsuarioSeleccionado(null);
    };

    // Funciones para Roles
    const fetchRoles = async () => setRoles(await leerRoles());

    const handleSaveRol = async (rolData) => {
        if (rolSeleccionado) {
            await actualizarRol(rolData.id_rol, rolData);
        } else {
            await crearRol(rolData);
        }
        await fetchRoles();
        setOpenModalRol(false);
        setRolSeleccionado(null);
    };

    // Funciones para Permisos
    const fetchPermisos = async () => setPermisos(await leerPermisos());

    const handleSavePermiso = async (permisoData) => {
        if (permisoSeleccionado) {
            await actualizarPermiso(permisoData.id_permiso, permisoData);
        } else {
            await crearPermiso(permisoData);
        }
        await fetchPermisos();
        setOpenModalPermiso(false);
        setPermisoSeleccionado(null);
    };

    // Funciones para Rol-Permiso
    const fetchRolPermisos = async () => setRolPermisos(await leerRolPermisos());

    const handleSaveRolPermiso = async ({ id_rol, permisos: permisosSeleccionados }) => {
        for (const permisoId of permisosSeleccionados) {
            await crearRolPermiso(id_rol, permisoId);
        }
        await fetchRolPermisos();
        setOpenModalRolPermiso(false);
        setRelacionSeleccionada(null);
    };

    const handleEditRolPermiso = async (relacion) => {
        const roleId = relacion.id_rol;
        const permisosDeRol = await leerPermisosDeRol(roleId);
        const permisoIds = [...new Set(permisosDeRol.map((p) => Number(p.id_permiso)))];

        setRelacionSeleccionada({
            id_rol: Number(roleId),
            permisosSeleccionados: permisoIds,
        });
        setOpenModalRolPermiso(true);
    };

    // Cálculos de estadísticas
    const totalUsuarios = usuarios.length;
    const administradores = usuarios.filter(u => u.rol === "Administrador").length;
    const empleados = usuarios.filter(u => u.rol === "Empleado").length;
    
    return (
        <Layout>
            <div className="pagina-contenedor">
                {/* Pestañas de navegación */}
                <div className="pestanas-container">
                    <button
                        className={`pestana ${pestanaActiva === "usuarios" ? "activa" : ""}`}
                        onClick={() => setPestanaActiva("usuarios")}
                    >
                        Usuarios
                    </button>
                    <button
                        className={`pestana ${pestanaActiva === "roles" ? "activa" : ""}`}
                        onClick={() => setPestanaActiva("roles")}
                    >
                        Roles
                    </button>
                    <button
                        className={`pestana ${pestanaActiva === "permisos" ? "activa" : ""}`}
                        onClick={() => setPestanaActiva("permisos")}
                    >
                        Permisos
                    </button>
                    <button
                        className={`pestana ${pestanaActiva === "rolpermisos" ? "activa" : ""}`}
                        onClick={() => setPestanaActiva("rolpermisos")}
                    >
                        Rol-Permiso
                    </button>
                </div>

                {/* PESTAÑA USUARIOS */}
                {pestanaActiva === "usuarios" && (
                    <>
                        <div className="usuarios-header">
                            <h2 className="pagina-titulo">Lista de Usuarios</h2>
                            <button
                                className="pagina-boton"
                                onClick={() => {
                                    setUsuarioSeleccionado(null);
                                    setOpenModalUsuario(true);
                                }}
                            >
                                + Agregar Usuario
                            </button>
                        </div>

                                                {/* Cards de estadísticas estilo dashboard */}
                                                <div className="estadisticas-grid" style={{marginBottom: '2rem'}}>
                                                    <div className="stat-card">
                                                        <div className="stat-info">
                                                            <p className="stat-label">TOTAL USUARIOS</p>
                                                            <h2 className="stat-numero">{totalUsuarios}</h2>
                                                        </div>
                                                        <div className="stat-icon usuarios">
                                                            <FaUsers />
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-info">
                                                            <p className="stat-label">ADMINISTRADORES</p>
                                                            <h2 className="stat-numero">{administradores}</h2>
                                                        </div>
                                                        <div className="stat-icon">
                                                            <FaBriefcase />
                                                        </div>
                                                    </div>
                                                    <div className="stat-card">
                                                        <div className="stat-info">
                                                            <p className="stat-label">EMPLEADOS</p>
                                                            <h2 className="stat-numero">{empleados}</h2>
                                                        </div>
                                                        <div className="stat-icon">
                                                            <FaUser />
                                                        </div>
                                                    </div>
                                                </div>

                        {/* Tabla de usuarios */}
                        <div className="usuarios-tabla-section">
                            <h3 className="usuarios-tabla-titulo">Lista de Usuarios</h3>
                            <div className="tabla-contenedor table-responsive-container">
                                <table className="tabla">
                                    <thead>
                                        <tr>
                                            <th>USUARIO</th>
                                            <th>EMAIL</th>
                                            <th>ROL</th>
                                            <th>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usuarios.length > 0 ? (
                                            usuarios.map((u) => (
                                                <tr key={u.id_usuario}>
                                                    <td>{u.nombre}</td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`rol-badge rol-${u.rol ? u.rol.toLowerCase() : 'empleado'}`}>
                                                            {u.rol || 'Empleado'}
                                                        </span>
                                                    </td>
                                                    
                                                    <td className="tabla-acciones">
                                                        <button
                                                            onClick={() => {
                                                                setUsuarioSeleccionado(u);
                                                                setOpenModalUsuario(true);
                                                            }}
                                                            className="boton-accion boton-editar"
                                                            title="Editar usuario"
                                                        >
                                                            <FaEdit /> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => eliminarUsuario(u.id_usuario).then(fetchUsuarios)}
                                                            className="boton-accion boton-eliminar"
                                                            title="Eliminar usuario"
                                                        >
                                                            <FaTrash /> Eliminar
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
                    </>
                )}

                {/* PESTAÑA ROLES*/}
                {pestanaActiva === "roles" && (
                    <>
                        <div className="usuarios-header">
                            <h2 className="pagina-titulo">Gestión de Roles</h2>
                            <button
                                className="pagina-boton"
                                onClick={() => {
                                    setRolSeleccionado(null);
                                    setOpenModalRol(true);
                                }}
                            >
                                + Crear Rol
                            </button>
                        </div>

                        <div className="tabla-contenedor table-responsive-container">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roles.length > 0 ? (
                                        roles.map((r) => (
                                            <tr key={r.id_rol}>
                                                <td>{r.nombre}</td>
                                                <td className="tabla-acciones">
                                                    <button
                                                        onClick={() => {
                                                            setRolSeleccionado(r);
                                                            setOpenModalRol(true);
                                                        }}
                                                        className="boton-accion boton-editar"
                                                        title="Editar rol"
                                                    >
                                                        <FaEdit /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarRol(r.id_rol).then(fetchRoles)}
                                                        className="boton-accion boton-eliminar"
                                                        title="Eliminar rol"
                                                    >
                                                        <FaTrash /> Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="tabla-vacia">
                                                No hay roles registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ========== PESTAÑA PERMISOS ========== */}
                {pestanaActiva === "permisos" && (
                    <>
                        <div className="usuarios-header">
                            <h2 className="pagina-titulo">Gestión de Permisos</h2>
                            <button
                                className="pagina-boton"
                                onClick={() => {
                                    setPermisoSeleccionado(null);
                                    setOpenModalPermiso(true);
                                }}
                            >
                                + Crear Permiso
                            </button>
                        </div>

                        <div className="tabla-contenedor table-responsive-container">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Descripción</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {permisos.length > 0 ? (
                                        permisos.map((p) => (
                                            <tr key={p.id_permiso}>
                                                <td>{p.nombre}</td>
                                                <td>{p.descripcion}</td>
                                                <td className="tabla-acciones">
                                                    <button
                                                        onClick={() => {
                                                            setPermisoSeleccionado(p);
                                                            setOpenModalPermiso(true);
                                                        }}
                                                        className="boton-accion boton-editar"
                                                        title="Editar permiso"
                                                    >
                                                        <FaEdit /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarPermiso(p.id_permiso).then(fetchPermisos)}
                                                        className="boton-accion boton-eliminar"
                                                        title="Eliminar permiso"
                                                    >
                                                        <FaTrash /> Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="tabla-vacia">
                                                No hay permisos registrados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* ========== PESTAÑA ROL-PERMISO ========== */}
                {pestanaActiva === "rolpermisos" && (
                    <>
                        <div className="usuarios-header">
                            <h2 className="pagina-titulo">Asignación Rol - Permiso</h2>
                            <button
                                className="pagina-boton"
                                onClick={() => {
                                    setRelacionSeleccionada(null);
                                    setOpenModalRolPermiso(true);
                                }}
                            >
                                + Asignar Permiso
                            </button>
                        </div>

                        <div className="tabla-contenedor table-responsive-container">
                            <table className="tabla">
                                <thead>
                                    <tr>
                                        <th>Rol</th>
                                        <th>Permiso</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rolPermisos.length > 0 ? (
                                        rolPermisos.map((rp) => (
                                            <tr key={rp.id_rol_permiso}>
                                                <td>
                                                    <span className={`rol-badge rol-${rp.rol ? rp.rol.toLowerCase() : 'empleado'}`}>
                                                        {rp.rol || 'Empleado'}
                                                    </span>
                                                </td>
                                                <td>{rp.permiso}</td>
                                                <td className="tabla-acciones">
                                                    <button
                                                        onClick={() => handleEditRolPermiso(rp)}
                                                        className="boton-accion boton-editar"
                                                        title="Editar asignación"
                                                    >
                                                        <FaEdit /> Editar
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarRolPermiso(rp.id_rol_permiso).then(fetchRolPermisos)}
                                                        className="boton-accion boton-eliminar"
                                                        title="Eliminar asignación"
                                                    >
                                                        <FaTrash /> Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="tabla-vacia">
                                                No hay asignaciones registradas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Modales */}
                {openModalUsuario && (
                    <ModalUsuario
                        onClose={() => {
                            setOpenModalUsuario(false);
                            setUsuarioSeleccionado(null);
                        }}
                        onSave={handleSaveUsuario}
                        usuarioSeleccionado={usuarioSeleccionado}
                        roles={roles}
                    />
                )}

                {openModalRol && (
                    <ModalRol
                        onClose={() => {
                            setOpenModalRol(false);
                            setRolSeleccionado(null);
                        }}
                        onSave={handleSaveRol}
                        rolSeleccionado={rolSeleccionado}
                    />
                )}

                {openModalPermiso && (
                    <ModalPermiso
                        onClose={() => {
                            setOpenModalPermiso(false);
                            setPermisoSeleccionado(null);
                        }}
                        onSave={handleSavePermiso}
                        permisoSeleccionado={permisoSeleccionado}
                    />
                )}

                {openModalRolPermiso && (
                    <ModalRolPermiso
                        onClose={() => {
                            setOpenModalRolPermiso(false);
                            setRelacionSeleccionada(null);
                        }}
                        onSave={handleSaveRolPermiso}
                        roles={roles}
                        permisos={permisos}
                        relacionSeleccionada={relacionSeleccionada}
                    />
                )}
            </div>
        </Layout>
    );
};