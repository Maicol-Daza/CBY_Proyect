import { useState, useEffect } from "react";
import { useAuthContext } from "../context/AuthContext";
import "../styles/moduloCaja.css";
import "../styles/inputMoneda.css";
import { crearMovimiento, obtenerMovimientos, type Movimiento } from "../services/movimientos_caja";
import { formatCOP } from "../utils/formatCurrency";
import { FaArrowTrendUp, FaArrowTrendDown } from "react-icons/fa6";
import { Icon } from "@iconify/react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import { InputMoneda } from "./InputMoneda";

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

  // Totales filtrados según rango de fechas
  const [ingresoFiltrado, setIngresoFiltrado] = useState(0);
  const [egresoFiltrado, setEgresoFiltrado] = useState(0);
  const [acumuladoFiltrado, setAcumuladoFiltrado] = useState(0);

  // Estado para filtro de fechas
  const [fechaInicio, setFechaInicio] = useState(() => {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return formatearFechaLocal(hace7Dias);
  });
  const [fechaFin, setFechaFin] = useState(formatearFechaLocal(new Date()));
  const [movimientosFiltrados, setMovimientosFiltrados] = useState<Movimiento[]>([]);

  useEffect(() => {
    cargarMovimientos();
    const intervalo = setInterval(cargarMovimientos, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Filtrar movimientos por rango de fechas y actualizar totales
  useEffect(() => {
    const filtered = movimientos.filter((mov) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const fechaMovStr = formatearFechaLocal(fechaMov);
      return fechaMovStr >= fechaInicio && fechaMovStr <= fechaFin;
    });
    setMovimientosFiltrados(filtered);

    // Calcular totales filtrados
    let ingFilt = 0;
    let egrFilt = 0;
    filtered.forEach((mov) => {
      const monto = Number(mov.monto) || 0;
      if (mov.tipo === "entrada") {
        ingFilt += monto;
      } else if (mov.tipo === "salida") {
        egrFilt += monto;
      }
    });
    setIngresoFiltrado(ingFilt);
    setEgresoFiltrado(egrFilt);
    setAcumuladoFiltrado(ingFilt - egrFilt);
  }, [movimientos, fechaInicio, fechaFin]);

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

  // Exportar a Excel
  const exportarExcel = () => {
    if (movimientosFiltrados.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const datosExcel = movimientosFiltrados.map((mov) => {
      const fecha = new Date(mov.fecha_movimiento);
      return {
        "Fecha": fecha.toLocaleDateString(),
        "Hora": fecha.toLocaleTimeString(),
        "Tipo": mov.tipo === "entrada" ? "Ingreso" : "Egreso",
        "Descripción": mov.descripcion,
        "Monto": Number(mov.monto),
        "Usuario": mov.usuario_nombre || "Sistema",
        "Pedido": mov.id_pedido ? `#${mov.id_pedido}` : "-"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Movimientos Caja");
    XLSX.writeFile(workbook, `Caja_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  // Exportar a PDF
  const exportarPDF = async () => {
    if (movimientosFiltrados.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const element = document.getElementById("tabla-movimientos-export");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#fff",
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Agregar título
      pdf.setFontSize(14);
      pdf.text("Reporte de Movimientos de Caja", 14, 10);
      pdf.setFontSize(10);
      pdf.text(`Período: ${fechaInicio} a ${fechaFin}`, 14, 18);

      // Agregar tabla
      pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);
      heightLeft -= imgHeight;
      position = heightLeft;

      while (position >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position - imgHeight, imgWidth, imgHeight);
        position -= imgHeight;
      }

      pdf.save(`Caja_${fechaInicio}_a_${fechaFin}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al exportar PDF");
    }
  };

  const handleCrearMovimiento = async () => {
    if (!nuevoMovimiento.descripcion.trim() || nuevoMovimiento.monto <= 0) {
      alert("Por favor completa todos los campos correctamente");
      return;
    }

    // OBTENER usuario del localStorage directamente
    const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
    const idUsuario = usuarioGuardado?.id_usuario || 1;

    console.log("Usuario enviando movimiento:", idUsuario, usuarioGuardado); // DEBUG

    try {
      setCargando(true);
      await crearMovimiento({
        ...nuevoMovimiento,
        id_usuario: idUsuario  // Usar esto en lugar de user?.id_usuario
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
      alert("Error al registrar el movimiento");
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

      {/* Filtro de fechas y exportación */}
      <div className="filtro-fechas-section">
        <div className="filtro-group-caja">
          <div className="field-inline">
            <label>Fecha Inicio:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="field-inline">
            <label>Fecha Fin:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="filtro-input"
            />
          </div>

          <div className="botones-filtro">
            <button 
              className="btn-exportar excel"
              onClick={exportarExcel}
              title="Exportar a Excel"
            >
              📊 Excel
            </button>
            <button 
              className="btn-exportar pdf"
              onClick={exportarPDF}
              title="Exportar a PDF"
            >
              📄 PDF
            </button>
          </div>
        </div>

        <div className="resumen-filtro">
          <strong>Registros encontrados:</strong> {movimientosFiltrados.length}
        </div>
      </div>

      <div className="cards-grid">
        <div className="card card-ingreso">
          <div className="card-label">Ingresos (Filtrado)</div>
          <div className="card-value income">{formatCOP(ingresoFiltrado)}</div>
          <span className="icon"><FaArrowTrendUp /></span>
        </div>

        <div className="card card-egreso">
          <div className="card-label">Egresos (Filtrado)</div>
          <div className="card-value expense">{formatCOP(egresoFiltrado)}</div>
          <span className="icon"><FaArrowTrendDown /></span>
        </div>

        <div className="card card-acumulado">
          <div className="card-label">Acumulado (Filtrado)</div>
          <div className="card-value">{formatCOP(acumuladoFiltrado)}</div>
          <span className="icon"><Icon icon="streamline-ultimate:money-bag-dollar-bold" /></span>
        </div>

        <div className="card card-total">
          <div className="card-label">Total General</div>
          <div className="card-value">{formatCOP(totalAcumulado)}</div>
          <span className="icon"><Icon icon="streamline-ultimate:cash-briefcase-bold" width="23px" height="26px" /></span>
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
        <table className="movimientos-table" id="tabla-movimientos-export">
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
            {movimientosFiltrados.length > 0 ? (
              movimientosFiltrados.map((mov) => {
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
              })
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                  No hay movimientos en el rango de fechas seleccionado
                </td>
              </tr>
            )}
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
                <InputMoneda
                  value={nuevoMovimiento.monto}
                  onChange={(monto) => setNuevoMovimiento({
                    ...nuevoMovimiento,
                    monto
                  })}
                  placeholder="Ingrese el monto"
                />
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