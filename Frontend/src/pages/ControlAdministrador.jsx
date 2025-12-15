import { useState, useEffect } from "react";
import { Layout } from "../components/layout/Layout";
import { FaUsers, FaShoppingCart, FaReceipt, FaCog, FaCashRegister, FaCheckCircle } from "react-icons/fa";
import { leerUsuarios } from "../services/usuarioService";
import { obtenerClientes } from "../services/clientesService";
import { obtenerMovimientos, verificarBaseDiaria, crearBaseDiaria } from "../services/movimientos_caja";
import { obtenerAjustes } from "../services/ajustesService";
import { obtenerAcciones } from "../services/accionesService";
import { obtenerAjustesAccion } from "../services/ajustesAccionService";
import { obtenerPedidos } from "../services/pedidosService";
import { formatCOP } from "../utils/formatCurrency";
import "./ControlAdministrador.css";

export const ControlAdministrador = () => {
  const [pestanaActiva, setPestanaActiva] = useState("dashboard");
  
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState({
    totalUsuarios: 0,
    totalClientes: 0,
    totalPedidos: 0,
    balanceTotal: 0,
    usuariosActivos: 0,
    pedidosPendientes: 0
  });

  // Estados para datos de tablas
  const [usuarios, setUsuarios] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [recursos, setRecursos] = useState({
    arreglos: 0,
    acciones: 0,
    combinaciones: 0
  });

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para base de caja diaria
  const [baseDiariaExiste, setBaseDiariaExiste] = useState(false);
  const [montoBaseDiaria, setMontoBaseDiaria] = useState(0);
  const [nuevoMontoBase, setNuevoMontoBase] = useState("");
  const [cargandoBase, setCargandoBase] = useState(false);

  useEffect(() => {
    cargarTodosLosDatos();
    verificarBaseDelDia();
  }, []);

  const verificarBaseDelDia = async () => {
    try {
      const { existe, monto } = await verificarBaseDiaria();
      setBaseDiariaExiste(existe);
      setMontoBaseDiaria(monto);
    } catch (error) {
      console.error("Error al verificar base diaria:", error);
    }
  };

  const cargarTodosLosDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar datos en paralelo
      const [usuariosData, clientesData, movimientosData, ajustesData, accionesData, ajustesAccionData, pedidosData] = 
        await Promise.all([
          leerUsuarios().catch(() => []),
          obtenerClientes().catch(() => []),
          obtenerMovimientos().catch(() => []),
          obtenerAjustes().catch(() => []),
          obtenerAcciones().catch(() => []),
          obtenerAjustesAccion().catch(() => []),
          obtenerPedidos().catch(() => [])
        ]);

      // Calcular estadísticas
      const usuariosActivos = usuariosData.filter(u => u.activo === true).length;

      // Calcular balance total de movimientos
      const balanceTotal = movimientosData.reduce((acc, mov) => {
        const monto = parseFloat(mov.monto) || 0;
        return mov.tipo === 'entrada' ? acc + monto : acc - monto;
      }, 0);

      setEstadisticas({
        totalUsuarios: usuariosData.length,
        totalClientes: clientesData.length,
        totalPedidos: pedidosData.length,
        balanceTotal: balanceTotal,
        usuariosActivos: usuariosActivos,
        pedidosPendientes: 0
      });

      setUsuarios(usuariosData.slice(0, 10));
      setMovimientos(movimientosData.slice(0, 10));

      setRecursos({
        arreglos: ajustesData.length,
        acciones: accionesData.length,
        combinaciones: ajustesAccionData.length
      });

    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar los datos del sistema");
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO');
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto);
  };

  // Función para ingresar la base de caja diaria
  const handleCrearBaseDiaria = async () => {
    const monto = parseFloat(nuevoMontoBase.replace(/[^\d]/g, ''));
    
    if (!monto || monto <= 0) {
      alert("Por favor ingresa un monto válido para la base de caja");
      return;
    }

    try {
      setCargandoBase(true);
      const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
      const idUsuario = usuarioGuardado?.id_usuario || 1;
      
      await crearBaseDiaria(monto, idUsuario);
      alert("✅ Base de caja del día registrada correctamente.\n\nLos empleados ahora pueden realizar movimientos de caja.");
      setBaseDiariaExiste(true);
      setMontoBaseDiaria(monto);
      setNuevoMontoBase("");
      cargarTodosLosDatos(); // Recargar datos
    } catch (error) {
      console.error("Error:", error);
      alert(error.message || "Error al registrar la base de caja");
    } finally {
      setCargandoBase(false);
    }
  };

  if (cargando) {
    return (
      <Layout>
        <div className="control-admin-container">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando datos del sistema...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="control-admin-container">
        <div className="control-admin-header">
          <h1>Panel de Control Administrador</h1>
        </div>

        {error && (
          <div className="alerta-atencion" style={{ backgroundColor: '#fee2e2', borderLeftColor: '#dc2626' }}>
            <div className="alerta-icon"></div>
            <div className="alerta-contenido">
              <h4 style={{ color: '#991b1b' }}>Error:</h4>
              <p style={{ color: '#991b1b' }}>{error}</p>
            </div>
          </div>
        )}

        {estadisticas.balanceTotal === 0 && !error && (
          <div className="alerta-atencion">
            <div className="alerta-icon"></div>
            <div className="alerta-contenido">
              <h4>Atención:</h4>
              <p>Se detectaron 1 problema(s) en el sistema:</p>
              <ul>
                <li>No hay ingresos registrados en la caja</li>
              </ul>
            </div>
          </div>
        )}

        {/* Pestañas de navegación */}
        <div className="pestanas-admin-container">
          <button
            className={`pestana-admin ${pestanaActiva === "dashboard" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`pestana-admin ${pestanaActiva === "usuarios" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("usuarios")}
          >
            Usuarios
          </button>
          <button
            className={`pestana-admin ${pestanaActiva === "auditoria" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("auditoria")}
          >
            Auditoría
          </button>
          <button
            className={`pestana-admin ${pestanaActiva === "configuracion" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("configuracion")}
          >
            Configuración
          </button>
        </div>

        {/* ========== PESTAÑA DASHBOARD ========== */}
        {pestanaActiva === "dashboard" && (
          <div className="pestana-contenido">
            {/* Cards de estadísticas */}
            <div className="estadisticas-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <p className="stat-label">Total Usuarios</p>
                  <h2 className="stat-numero">{estadisticas.totalUsuarios}</h2>
                  <p className="stat-detalle">Registrados</p>
                </div>
                <div className="stat-icon usuarios">
                  <FaUsers />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <p className="stat-label">Total Clientes</p>
                  <h2 className="stat-numero">{estadisticas.totalClientes}</h2>
                  <p className="stat-detalle">registrados</p>
                </div>
                <div className="stat-icon clientes">
                  <FaShoppingCart />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <p className="stat-label">Total Pedidos</p>
                  <h2 className="stat-numero">{estadisticas.totalPedidos}</h2>
                  <p className="stat-detalle">Registrados</p>
                </div>
                <div className="stat-icon pedidos">
                  <FaReceipt />
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-info">
                  <p className="stat-label">Balance Total</p>
                  <h2 className="stat-numero">{formatearMoneda(estadisticas.balanceTotal)}</h2>
                  <p className="stat-detalle">Acumulado</p>
                </div>
                <div className="stat-icon balance">
                  <FaCog />
                </div>
              </div>
            </div>

            {/* ========== SECCIÓN BASE DE CAJA DIARIA ========== */}
            <div className="base-caja-section">
              <h3><FaCashRegister style={{ marginRight: '10px' }} />Base de Caja del Día</h3>
              
              {baseDiariaExiste ? (
                <div className="base-caja-configurada">
                  <FaCheckCircle style={{ color: '#10b981', fontSize: '24px', marginRight: '15px' }} />
                  <div>
                    <strong>Base configurada para hoy</strong>
                    <p>Monto: <span className="monto-base">{formatearMoneda(montoBaseDiaria)}</span></p>
                    <p className="detalle-texto">Los empleados pueden realizar movimientos de caja normalmente.</p>
                  </div>
                </div>
              ) : (
                <div className="base-caja-formulario">
                  <div className="alerta-base-pendiente">
                    <strong>⚠️ Base de caja no configurada</strong>
                    <p>Los empleados no pueden realizar movimientos de caja hasta que ingrese la base del día.</p>
                  </div>
                  
                  <div className="formulario-base">
                    <label>Ingrese el monto de la base para hoy:</label>
                    <div className="input-base-container">
                      <span className="prefijo-moneda">$</span>
                      <input
                        type="text"
                        placeholder="Ej: 100000"
                        value={nuevoMontoBase}
                        onChange={(e) => {
                          // Solo permitir números
                          const valor = e.target.value.replace(/[^\d]/g, '');
                          // Formatear con separadores de miles
                          const valorFormateado = valor ? parseInt(valor).toLocaleString('es-CO') : '';
                          setNuevoMontoBase(valorFormateado);
                        }}
                        className="input-monto-base"
                        disabled={cargandoBase}
                      />
                    </div>
                    <button 
                      onClick={handleCrearBaseDiaria}
                      className="btn-registrar-base"
                      disabled={cargandoBase || !nuevoMontoBase}
                    >
                      {cargandoBase ? "Registrando..." : "Registrar Base del Día"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estado del Sistema */}
            <div className="estado-sistema-section">
              <h3>Estado del Sistema</h3>
              <div className="sistema-grid">
                <div className="sistema-card">
                  <h4>Servicios</h4>
                  <div className="servicio-item">
                    <span>Base de Datos</span>
                    <span className="estado-badge activo">✓ Activo</span>
                  </div>
                  <div className="servicio-item">
                    <span>Sistema de Autenticación</span>
                    <span className="estado-badge activo">✓ Activo</span>
                  </div>
                  <div className="servicio-item">
                    <span>Módulo de Caja</span>
                    <span className="estado-badge activo">✓ Activo</span>
                  </div>
                </div>

                <div className="sistema-card">
                  <h4>Recursos Configurados</h4>
                  <div className="recurso-item">
                    <span>Ajustes Disponibles</span>
                    <span className="numero-recurso">{recursos.arreglos}</span>
                  </div>
                  <div className="recurso-item">
                    <span>Acciones Disponibles</span>
                    <span className="numero-recurso">{recursos.acciones}</span>
                  </div>
                  <div className="recurso-item">
                    <span>Combinaciones Registradas</span>
                    <span className="numero-recurso">{recursos.combinaciones}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========== PESTAÑA USUARIOS ========== */}
        {pestanaActiva === "usuarios" && (
          <div className="pestana-contenido">
            <h3>Gestión Avanzada de Usuarios</h3>
            {usuarios.length > 0 ? (
              <div className="tabla-contenedor-admin table-responsive-container">
                <table className="tabla-admin">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id_usuario}>
                        <td>{usuario.nombre}</td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className={`rol-badge ${usuario.rol === 'Administrador' ? 'admin' : 'empleado'}`}>
                            {usuario.rol}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No hay usuarios registrados</p>
            )}
          </div>
        )}

        {/* ========== PESTAÑA AUDITORÍA ========== */}
        {pestanaActiva === "auditoria" && (
          <div className="pestana-contenido">
            <h3>Registro de Auditoría - Movimientos de Caja</h3>
            {movimientos.length > 0 ? (
              <div className="tabla-contenedor table-responsive-container">
                <table className="tabla-admin">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Usuario</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id_movimiento_caja}>
                        <td>{formatearFecha(movimiento.fecha_movimiento)}</td>
                        <td>{movimiento.usuario_nombre || 'Sistema'}</td>
                        <td>
                          <span className={`rol-badge ${movimiento.tipo === 'entrada' ? 'admin' : 'empleado'}`}>
                            {movimiento.tipo === 'entrada' ? 'ENTRADA' : 'SALIDA'}
                          </span>
                        </td>
                        <td>{movimiento.descripcion}</td>
                        <td style={{ fontWeight: 'bold', color: movimiento.tipo === 'entrada' ? '#10b981' : '#ef4444' }}>
                          {movimiento.tipo === 'entrada' ? '+' : '-'}{formatearMoneda(movimiento.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No hay movimientos registrados</p>
            )}
          </div>
        )}

        {/* ========== PESTAÑA CONFIGURACIÓN ========== */}
        {pestanaActiva === "configuracion" && (
          <div className="pestana-contenido">
            <h3>Configuración del Sistema</h3>
            <div className="configuracion-section">
              <div className="config-card">
                <h4>General</h4>
                <div className="config-item">
                  <label>Nombre de la Clínica:</label>
                  <input type="text" value="Clínica del Bluyin" disabled />
                </div>
                <div className="config-item">
                  <label>Email de Contacto:</label>
                  <input type="email" value="info@clinica.com" disabled />
                </div>
              </div>

              <div className="config-card">
                <h4>Permisos y Seguridad</h4>
                <div className="config-item">
                  <label>Roles Activos:</label>
                  <p>Administrador, Empleado</p>
                </div>
                <div className="config-item">
                  <label>Última Sincronización:</label>
                  <p>{new Date().toLocaleString('es-CO')}</p>
                </div>
              </div>

              <div className="config-card">
                <h4>Estadísticas Generales</h4>
                <div className="config-item">
                  <label>Total de Registros:</label>
                  <p>
                    Usuarios: {estadisticas.totalUsuarios} | 
                    Clientes: {estadisticas.totalClientes} | 
                    Pedidos: {estadisticas.totalPedidos}
                  </p>
                </div>
                <div className="config-item">
                  <label>Recursos del Sistema:</label>
                  <p>
                    Ajustes: {recursos.arreglos} | 
                    Acciones: {recursos.acciones} | 
                    Combinaciones: {recursos.combinaciones}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};