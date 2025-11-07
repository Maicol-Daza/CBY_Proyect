import { useState, useEffect } from "react";
import { ModalUsuario } from "../components/ui/ModalUsuario";
import { leerUsuarios, eliminarUsuario, actualizarUsuario, crearUsuario } from "../services/usuarioService";
import { leerRoles } from "../services/rolService";
import { Layout } from "../components/layout/Layout";
import "./Pagina.css";

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

    return (
        <Layout>
        <div className="pagina-contenedor">
            <h2 className="pagina-titulo">Gestión de Usuarios</h2>

            <button
            className="pagina-boton"
            onClick={() => {
                setUsuarioSeleccionado(null);
                setOpenModal(true);
            }}
            >
            Crear Usuario
            </button>

            <div className="tabla-contenedor">
            <table className="tabla">
                <thead>
                <tr>
                    <th className="ocultar-columna">ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Acciones</th>
                </tr>
                </thead>
                <tbody>
                {usuarios.length > 0 ? (
                    usuarios.map((u) => (
                    <tr key={u.id_usuario}>
                        <td className="ocultar-columna">{u.id_usuario}</td>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.rol}</td>
                        <td className="tabla-acciones">
                        <button
                            onClick={() => {
                            setUsuarioSeleccionado(u);
                            setOpenModal(true);
                            }}
                            className="boton-accion boton-editar"
                        >
                            Editar
                        </button>
                        <button
                            onClick={() => eliminarUsuario(u.id_usuario).then(fetchUsuarios)}
                            className="boton-accion boton-eliminar"
                        >
                            Eliminar
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
