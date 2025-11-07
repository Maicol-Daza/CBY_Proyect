import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Layout } from "../components/layout/Layout";

import "./Principal.css";

export const Principal = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="principal-dashboard">
        {/* 👇 Bienvenida dentro del contenido (el header ya está en Layout) */}
        <h1 className="principal-bienvenida">Bienvenido {user?.nombre}</h1>
        <p className="principal-rol">Rol: {user?.rol}</p>

        {/* Cards */}
        <div className="principal-cards">
          <Card
            titulo="Gestión de Usuarios"
            descripcion="Crea, edita y elimina usuarios del sistema."
            onClick={() => navigate("/usuarios")}
          />
          <Card
            titulo="Gestión de Roles"
            descripcion="Administra los diferentes roles disponibles."
            onClick={() => navigate("/roles")}
          />
          <Card
            titulo="Gestión de Permisos"
            descripcion="Define y organiza los permisos del sistema."
            onClick={() => navigate("/permisos")}
          />
          <Card
            titulo="Rol - Permisos"
            descripcion="Asigna permisos a cada rol."
            onClick={() => navigate("/rol-permisos")}
          />
        </div>
      </div>
    </Layout>
  );
};
