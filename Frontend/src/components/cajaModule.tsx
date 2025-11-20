import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import "../styles/moduloCaja.css";
import { crearMovimiento, obtenerMovimientos, type Movimiento } from "../services/movimientos_caja";
import { formatCOP } from "../utils/formatCurrency";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { Icon } from "@iconify/react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface ChartData {
  fecha: string;
  ingresos: number;
  egresos: number;
  neto: number;
}

const formatearFechaLocal = (fecha: Date): string => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const día = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
};

export const CajaModule = () => {
  const { user } = useAuthContext();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [ingresoHoy, setIngresoHoy] = useState(0);
  const [egresoHoy, setEgresoHoy] = useState(0);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalAcumulado, setTotalAcumulado] = useState(0);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Estado para modal de nuevo movimiento
  const [mostrarModalMovimiento, setMostrarModalMovimiento] = useState(false);
  const [nuevoMovimiento, setNuevoMovimiento] = useState({
    tipo: "entrada" as "entrada" | "salida",
    descripcion: "",
    monto: 0
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarMovimientos();
    const intervalo = setInterval(cargarMovimientos, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const cargarMovimientos = async () => {
    try {
      const datos = await obtenerMovimientos();
      setMovimientos(datos);
      calcularTotales(datos);
      generarDatosGrafico(datos);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    }
  };

  const calcularTotales = (datos: Movimiento[]) => {
    const hoy = new Date();
    const fechaHoy = formatearFechaLocal(hoy);
    
    let ingHoy = 0;
    let egrHoy = 0;
    let totIngresos = 0;
    let totEgresos = 0;

    datos.forEach((mov) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const fechaMovStr = formatearFechaLocal(fechaMov);
      const monto = Number(mov.monto) || 0;
      
      if (mov.tipo === "entrada") {
        totIngresos += monto;
        if (fechaMovStr === fechaHoy) ingHoy += monto;
      } else if (mov.tipo === "salida") {
        totEgresos += monto;
        if (fechaMovStr === fechaHoy) egrHoy += monto;
      }
    });

    const totAcumulado = totIngresos - totEgresos;

    setIngresoHoy(ingHoy);
    setEgresoHoy(egrHoy);
    setTotalIngresos(totIngresos);
    setTotalAcumulado(totAcumulado);
  };

  const generarDatosGrafico = (datos: Movimiento[]) => {
    // Obtener últimos 7 días
    const hoy = new Date();
    const ultimos7Dias: { [key: string]: ChartData } = {};

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = formatearFechaLocal(fecha);
      
      ultimos7Dias[fechaStr] = {
        fecha: fechaStr,
        ingresos: 0,
        egresos: 0,
        neto: 0
      };
    }

    // Llenar con datos de movimientos
    datos.forEach((mov) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const fechaMovStr = formatearFechaLocal(fechaMov);
      const monto = Number(mov.monto) || 0;

      if (ultimos7Dias[fechaMovStr]) {
        if (mov.tipo === "entrada") {
          ultimos7Dias[fechaMovStr].ingresos += monto;
        } else if (mov.tipo === "salida") {
          ultimos7Dias[fechaMovStr].egresos += monto;
        }
        ultimos7Dias[fechaMovStr].neto = ultimos7Dias[fechaMovStr].ingresos - ultimos7Dias[fechaMovStr].egresos;
      }
    });

    setChartData(Object.values(ultimos7Dias));
  };

  const handleCrearMovimiento = async () => {
    if (!nuevoMovimiento.descripcion.trim() || nuevoMovimiento.monto <= 0) {
      alert("Por favor completa todos los campos correctamente");
      return;
    }

    try {
      setCargando(true);
      await crearMovimiento({
        ...nuevoMovimiento,
        id_usuario: user?.id_usuario
      });
      
      alert("Movimiento registrado correctamente");
      setNuevoMovimiento({
        tipo: "entrada",
        descripcion: "",
        monto: 0
      });
      setMostrarModalMovimiento(false);
      
      cargarMovimientos();
    } catch (error) {
      console.error("Error:", error);
      alert(" Error al registrar el movimiento");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="caja-container">
      <div className="caja-header">
        <h1>Caja y Movimientos</h1>
        <button 
          className="btn-nuevo"
          onClick={() => setMostrarModalMovimiento(true)}
        >
          + Nuevo Movimiento
        </button>
      </div>

      <div className="cards-grid">
        <div className="card">
          <div className="card-label">Ingresos Hoy</div>
          <div className="card-value income">{formatCOP(ingresoHoy)}</div>
          <span className="icon"><FaArrowTrendUp /></span>
        </div>

        <div className="card">
          <div className="card-label">Egresos Hoy</div>
          <div className="card-value expense">{formatCOP(egresoHoy)}</div>
          <span className="icon"><FaArrowTrendDown /></span>
        </div>

        <div className="card">
          <div className="card-label">Total Ingresos</div>
          <div className="card-value">{formatCOP(totalIngresos)}</div>
          <span className="icon"><Icon icon="streamline-ultimate:cash-briefcase-bold" width="23px" height="26px" /></span>
        </div>

        <div className="card">
          <div className="card-label">Total Acumulado</div>
          <div className="card-value">{formatCOP(totalAcumulado)}</div>
          <span className="icon"><Icon icon="streamline-ultimate:money-bag-dollar-bold" /></span>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-box">
          <h3>Flujo de Caja (Últimos 7 días)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCOP(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#ef4444" name="Egresos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No hay datos disponibles</p>
          )}
        </div>

        <div className="chart-box">
          <h3>Tendencia Neta</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value) => [formatCOP(Number(value)), 'Neto']}
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="neto" 
                  stroke="#0066cc" 
                  strokeWidth={2}
                  dot={{ fill: '#0066cc', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Neto"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No hay datos disponibles</p>
          )}
        </div>
      </div>

      <div className="movimientos-section">
        <h3>Movimientos Recientes</h3>
        <table className="movimientos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th>Pedido</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.slice(0, 15).map((mov) => {
              const fecha = new Date(mov.fecha_movimiento);
              return (
                <tr key={mov.id_movimiento_caja} className={mov.tipo}>
                  <td>{fecha.toLocaleDateString()}</td>
                  <td>{fecha.toLocaleTimeString()}</td>
                  <td className={`tipo-${mov.tipo}`}>
                    {mov.tipo === "entrada" ? " Entrada" : " Salida"}
                  </td>
                  <td>{mov.descripcion}</td>
                  <td className={`monto-${mov.tipo}`}>
                    {mov.tipo === "entrada" ? "+" : "-"}{formatCOP(Number(mov.monto))}
                  </td>
                  <td>{mov.usuario_nombre || "Sistema"}</td>
                  <td>{mov.id_pedido ? `#${mov.id_pedido}` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para nuevo movimiento */}
      {mostrarModalMovimiento && (
        <div className="modal-overlay">
          <div className="modal-content-movimiento">
            <div className="modal-header">
              <h2>Registrar Movimiento de Caja</h2>
              <button 
                className="modal-close"
                onClick={() => setMostrarModalMovimiento(false)}
              >
                ✕
              </button>
            </div>

            <div className="form-movimiento">
              <div className="field">
                <label>Tipo de Movimiento *</label>
                <select 
                  value={nuevoMovimiento.tipo}
                  onChange={(e) => setNuevoMovimiento({
                    ...nuevoMovimiento,
                    tipo: e.target.value as "entrada" | "salida"
                  })}
                  className="tipo-select"
                >
                  <option value="entrada">Ingreso (Entrada)</option>
                  <option value="salida">Egreso (Salida)</option>
                </select>
              </div>

              <div className="field">
                <label>Monto *</label>
                <div className="input-monto">
                  <span className="currency">$</span>
                  <input 
                    type="number"
                    value={nuevoMovimiento.monto}
                    onChange={(e) => setNuevoMovimiento({
                      ...nuevoMovimiento,
                      monto: Number(e.target.value)
                    })}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="field">
                <label>Descripción / Motivo *</label>
                <textarea 
                  value={nuevoMovimiento.descripcion}
                  onChange={(e) => setNuevoMovimiento({
                    ...nuevoMovimiento,
                    descripcion: e.target.value
                  })}
                  placeholder="Ej: Pago a proveedores, devolución de cliente, cambio, etc."
                  rows={4}
                  className="textarea-descripcion"
                />
              </div>

              <div className="resumen-movimiento">
                <div className="resumen-item">
                  <span>Tipo:</span>
                  <strong>{nuevoMovimiento.tipo === "entrada" ? "Ingreso" : "Egreso"}</strong>
                </div>
                <div className="resumen-item">
                  <span>Monto:</span>
                  <strong className={nuevoMovimiento.tipo}>
                    {nuevoMovimiento.tipo === "entrada" ? "+" : "-"}{formatCOP(nuevoMovimiento.monto)}
                  </strong>
                </div>
                <div className="resumen-item">
                  <span>Descripción:</span>
                  <strong>{nuevoMovimiento.descripcion || "Sin descripción"}</strong>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancelar"
                  onClick={() => setMostrarModalMovimiento(false)}
                  disabled={cargando}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleCrearMovimiento}
                  disabled={cargando}
                >
                  {cargando ? "Registrando..." : "Registrar Movimiento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CajaModule;