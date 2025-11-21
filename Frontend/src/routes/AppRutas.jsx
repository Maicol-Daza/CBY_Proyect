import { Routes, Route } from "react-router-dom";
import { Login } from "../components/login/Login";
import { Registro } from "../components/registro/Registro";
import { Principal } from "../pages/Principal";
import { UsuariosPagina } from "../pages/UsuariosPagina";
import { RolesPagina } from "../pages/RolesPagina";
import { PermisosPagina } from "../pages/PermisosPagina";
import { RolPermisoPagina } from "../pages/RolPermisoPagina";
import { ControlAdministrador } from "../pages/ControlAdministrador";
import { Bienvenido } from "../pages/Bienvenido";
import Inicio from "../pages/Inicio";
import Clientes from "../pages/Clientes";
import Pedidos from "../pages/Pedidos";
import HistorialPedidos from "../pages/HistorialPedidos";
import ModuloCaja from "../pages/ModuloCaja";
import ConfiguracionAjustes from "../pages/configuracionAjustes";
import { useAuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles }) => {
    const { user } = useAuthContext();
    if (!user) return <Login />; // no autenticado
    if (allowedRoles && !allowedRoles.includes(user.rol)) return <Bienvenido />; // rol no permitido
    return children;
};

export const AppRutas = () => (
    <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas solo Admin */}
        <Route
            path="/principal"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <Principal />
                </PrivateRoute>
            }
        />
        <Route
            path="/usuarios"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <UsuariosPagina />
                </PrivateRoute>
            }
        />
        <Route
            path="/roles"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <RolesPagina />
                </PrivateRoute>
            }
        />
        <Route
            path="/permisos"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <PermisosPagina />
                </PrivateRoute>
            }
        />
        <Route
            path="/rol-permisos"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <RolPermisoPagina />
                </PrivateRoute>
            }
        />
        <Route
            path="/control-administrador"
            element={
                <PrivateRoute allowedRoles={["Administrador"]}>
                    <ControlAdministrador />
                </PrivateRoute>
            }
        />

        {/* Rutas accesibles para cualquier usuario autenticado */}
        <Route
            path="/bienvenido"
            element={
                <PrivateRoute>
                    <Bienvenido />
                </PrivateRoute>
            }
        />
        <Route
            path="/inicio"
            element={
                <PrivateRoute>
                    <Inicio />
                </PrivateRoute>
            }
        />
        <Route
            path="/clientes"
            element={
                <PrivateRoute>
                    <Clientes />
                </PrivateRoute>
            }
        />
        <Route
            path="/pedidos"
            element={
                <PrivateRoute>
                    <Pedidos />
                </PrivateRoute>
            }
        />
        <Route
            path="/historialPedidos"
            element={
                <PrivateRoute>
                    <HistorialPedidos />
                </PrivateRoute>
            }
        />
        <Route
            path="/moduloCaja"
            element={
                <PrivateRoute>
                    <ModuloCaja />
                </PrivateRoute>
            }
        />
        <Route
            path="/configuracionAjustes"
            element={
                <PrivateRoute>
                    <ConfiguracionAjustes />
                </PrivateRoute>
            }
        />
    </Routes>
);
