// src/components/NotificacionPedidosProximos.jsx
// Componente de campana de notificación para alertar sobre pedidos próximos a entregar

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaTimes, FaExclamationTriangle, FaClock } from "react-icons/fa";
import {
  obtenerPedidosProximos,
  calcularDiasRestantes,
} from "../services/pedidosProximosService";
import "../styles/notificacionPedidos.css";

const INTERVALO_REFRESCO = 60000; // 60 segundos
const DIAS_LIMITE = 3;

export default function NotificacionPedidosProximos() {
  const [pedidosProximos, setPedidosProximos] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [cargando, setCargando] = useState(true);
  const dropdownRef = useRef(null);
  const botonRef = useRef(null);
  const navigate = useNavigate();

  const cargarPedidos = useCallback(async () => {
    try {
      const pedidos = await obtenerPedidosProximos(DIAS_LIMITE);
      setPedidosProximos(pedidos);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();

    // Refrescar periódicamente
    const intervalo = setInterval(cargarPedidos, INTERVALO_REFRESCO);
    return () => clearInterval(intervalo);
  }, [cargarPedidos]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        botonRef.current &&
        !botonRef.current.contains(e.target)
      ) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Suscribirse a eventos de actualización de pedidos
  useEffect(() => {
    const handlePedidosUpdated = () => {
      cargarPedidos();
    };

    window.addEventListener("pedidos-updated", handlePedidosUpdated);
    window.addEventListener("pedido-created", handlePedidosUpdated);
    window.addEventListener("pedido-entregado", handlePedidosUpdated);

    return () => {
      window.removeEventListener("pedidos-updated", handlePedidosUpdated);
      window.removeEventListener("pedido-created", handlePedidosUpdated);
      window.removeEventListener("pedido-entregado", handlePedidosUpdated);
    };
  }, [cargarPedidos]);

  const toggleDropdown = () => {
    setMostrarDropdown((prev) => !prev);
    if (!mostrarDropdown) {
      cargarPedidos(); // Refrescar al abrir
    }
  };

  const irAHistorial = () => {
    setMostrarDropdown(false);
    navigate("/historialPedidos");
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "-";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  // Obtener texto y clase CSS según urgencia
  const getInfoUrgencia = (fechaEntrega) => {
    const info = calcularDiasRestantes(fechaEntrega);

    if (info.vencido) {
      return {
        clase: "urgencia-vencido",
        texto: `VENCIDO (hace ${info.dias} día${info.dias !== 1 ? "s" : ""})`,
        icono: <FaExclamationTriangle />,
      };
    }
    if (info.hoy) {
      return {
        clase: "urgencia-hoy",
        texto: "¡HOY!",
        icono: <FaExclamationTriangle />,
      };
    }
    if (info.restantes === 1) {
      return {
        clase: "urgencia-manana",
        texto: "Mañana",
        icono: <FaClock />,
      };
    }
    return {
      clase: "urgencia-proximo",
      texto: `${info.restantes} día${info.restantes !== 1 ? "s" : ""}`,
      icono: <FaClock />,
    };
  };

  const cantidadTotal = pedidosProximos.length;
  const cantidadVencidos = pedidosProximos.filter((p) => {
    const info = calcularDiasRestantes(p.fecha_entrega);
    return info.vencido;
  }).length;
  const cantidadHoy = pedidosProximos.filter((p) => {
    const info = calcularDiasRestantes(p.fecha_entrega);
    return info.hoy;
  }).length;

  // Determinar color del badge según urgencia máxima
  const badgeClase =
    cantidadVencidos > 0
      ? "badge-vencido"
      : cantidadHoy > 0
      ? "badge-hoy"
      : "badge-normal";

  return (
    <div className="notificacion-container">
      <button
        ref={botonRef}
        className="notificacion-boton"
        onClick={toggleDropdown}
        title="Pedidos próximos a entregar"
        aria-label="Notificaciones de pedidos"
      >
        <FaBell className="notificacion-icono" />
        {cantidadTotal > 0 && (
          <span className={`notificacion-badge ${badgeClase}`}>
            {cantidadTotal > 99 ? "99+" : cantidadTotal}
          </span>
        )}
      </button>

      {mostrarDropdown && (
        <div ref={dropdownRef} className="notificacion-dropdown">
          <div className="notificacion-dropdown-header">
            <h3>Pedidos Próximos a Entregar</h3>
            <button
              className="notificacion-cerrar"
              onClick={() => setMostrarDropdown(false)}
            >
              <FaTimes />
            </button>
          </div>

          <div className="notificacion-dropdown-body">
            {cargando ? (
              <div className="notificacion-cargando">
                <div className="spinner-mini"></div>
                <span>Cargando pedidos...</span>
              </div>
            ) : pedidosProximos.length === 0 ? (
              <div className="notificacion-vacia">
                <FaBell className="notificacion-vacia-icono" />
                <p>No hay pedidos próximos a entregar</p>
                <p className="notificacion-vacia-sub">
                  Revisa dentro de unos minutos
                </p>
              </div>
            ) : (
              <ul className="notificacion-lista">
                {pedidosProximos.map((pedido) => {
                  const urgencia = getInfoUrgencia(pedido.fecha_entrega);
                  return (
                    <li key={pedido.id_pedido} className="notificacion-item">
                      <div className="notificacion-item-header">
                        <span className="notificacion-cliente">
                          {pedido.cliente_nombre || "Cliente"}
                        </span>
                        <span className="notificacion-pedido-id">
                          #{pedido.id_pedido}
                        </span>
                      </div>
                      <div className="notificacion-item-detalle">
                        <span className="notificacion-fecha">
                          Entrega: {formatearFecha(pedido.fecha_entrega)}
                        </span>
                        <span className={`notificacion-urgencia ${urgencia.clase}`}>
                          {urgencia.icono}
                          {urgencia.texto}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="notificacion-dropdown-footer">
            <button
              className="notificacion-ver-todos"
              onClick={irAHistorial}
            >
              Ver todos en Historial
            </button>
          </div>
        </div>
      )}
    </div>
  );
}