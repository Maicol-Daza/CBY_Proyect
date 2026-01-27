import { useState, useEffect } from "react";

import { useAlert } from "../context/AlertContext";
import { Layout } from "../components/layout/Layout";
import { FaUsers, FaShoppingCart, FaReceipt, FaCog, FaCashRegister, FaCheckCircle, FaBox, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { FaArrowTrendUp, FaArrowTrendDown, FaFileExcel, FaFilePdf } from "react-icons/fa6";
import { Icon } from "@iconify/react";
import { leerUsuarios } from "../services/usuarioService";
import { obtenerClientes } from "../services/clientesService";
import { obtenerMovimientos, verificarBaseDiaria, crearBaseDiaria } from "../services/movimientos_caja";
import { obtenerAjustes } from "../services/ajustesService";
import { obtenerAcciones } from "../services/accionesService";
import { obtenerAjustesAccion } from "../services/ajustesAccionService";
import { obtenerPedidos } from "../services/pedidosService";
import { obtenerCajones, crearCajon, actualizarCajon, eliminarCajon } from "../services/cajonesService";
import { obtenerCodigos, crearCodigo, eliminarCodigo, actualizarCodigoNumero } from "../services/codigosService";
import { formatCOP } from "../utils/formatCurrency";
import { useDataRefresh } from "../hooks/useDataRefresh";
import { DATA_EVENTS } from "../utils/eventEmitter";
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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../styles/ControlAdministrador.css";

export const ControlAdministrador = () => {
  const { success, error: showError, warning, info } = useAlert();
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
  const [cargaInicial, setCargaInicial] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState(null);

  // Estados para base de caja diaria
  const [baseDiariaExiste, setBaseDiariaExiste] = useState(false);
  const [montoBaseDiaria, setMontoBaseDiaria] = useState(0);
  const [nuevoMontoBase, setNuevoMontoBase] = useState("");
  const [cargandoBase, setCargandoBase] = useState(false);

  // Estados para configuración de cajones
  const [cajones, setCajones] = useState([]);
  const [codigos, setCodigos] = useState([]);
  const [cajonSeleccionado, setCajonSeleccionado] = useState(null);
  const [mostrarModalCajon, setMostrarModalCajon] = useState(false);
  const [nombreNuevoCajon, setNombreNuevoCajon] = useState("");
  const [cantidadCodigosNuevos, setCantidadCodigosNuevos] = useState(26);
  const [cargandoCajones, setCargandoCajones] = useState(false);
  const [editandoCajon, setEditandoCajon] = useState(null);
  const [seccionCajonesExpandida, setSeccionCajonesExpandida] = useState(false);

  // Estados para Auditoría - Filtros y gráficos
  const formatearFechaLocal = (fecha) => {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const día = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${día}`;
  };

  const [fechaInicio, setFechaInicio] = useState(() => {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    return formatearFechaLocal(hace7Dias);
  });
  const [fechaFin, setFechaFin] = useState(formatearFechaLocal(new Date()));
  const [movimientosFiltrados, setMovimientosFiltrados] = useState([]);
  const [ingresoFiltrado, setIngresoFiltrado] = useState(0);
  const [egresoFiltrado, setEgresoFiltrado] = useState(0);
  const [acumuladoFiltrado, setAcumuladoFiltrado] = useState(0);
  const [totalAcumulado, setTotalAcumulado] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [todosLosMovimientos, setTodosLosMovimientos] = useState([]);

  useEffect(() => {
    cargarTodosLosDatos();
    verificarBaseDelDia();
  }, []);

  // Suscribirse a eventos de actualización para refrescar datos dinámicamente
  useDataRefresh(
    [
      DATA_EVENTS.PEDIDOS_UPDATED,
      DATA_EVENTS.PEDIDO_CREATED,
      DATA_EVENTS.PEDIDO_ENTREGADO,
      DATA_EVENTS.CLIENTES_UPDATED,
      DATA_EVENTS.MOVIMIENTOS_UPDATED,
      DATA_EVENTS.MOVIMIENTO_CREATED,
      DATA_EVENTS.BASE_DIARIA_CREATED,
      DATA_EVENTS.USUARIOS_UPDATED,
      DATA_EVENTS.AJUSTES_UPDATED,
      DATA_EVENTS.ACCIONES_UPDATED,
      DATA_EVENTS.COMBINACIONES_UPDATED,
      DATA_EVENTS.ABONOS_UPDATED,
      DATA_EVENTS.CAJONES_UPDATED,
      DATA_EVENTS.CODIGOS_UPDATED
    ],
    () => {
      console.log('[ControlAdministrador] Evento recibido, recargando datos...');
      cargarTodosLosDatos(true); // Actualización silenciosa
      verificarBaseDelDia();
    }
  );

  const verificarBaseDelDia = async () => {
    try {
      const { existe, monto } = await verificarBaseDiaria();
      setBaseDiariaExiste(existe);
      setMontoBaseDiaria(monto);
    } catch (error) {
      console.error("Error al verificar base diaria:", error);
    }
  };

  const cargarTodosLosDatos = async (esActualizacion = false) => {
    try {
      // Solo mostrar loading completo en carga inicial
      if (!esActualizacion && cargaInicial) {
        setCargando(true);
      } else {
        setActualizando(true);
      }
      setError(null);

      // Cargar datos en paralelo
      const [usuariosData, clientesData, movimientosData, ajustesData, accionesData, ajustesAccionData, pedidosData, cajonesData, codigosData] = 
        await Promise.all([
          leerUsuarios().catch(() => []),
          obtenerClientes().catch(() => []),
          obtenerMovimientos().catch(() => []),
          obtenerAjustes().catch(() => []),
          obtenerAcciones().catch(() => []),
          obtenerAjustesAccion().catch(() => []),
          obtenerPedidos().catch(() => []),
          obtenerCajones().catch(() => []),
          obtenerCodigos().catch(() => [])
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
      setTodosLosMovimientos(movimientosData); // Guardar todos los movimientos para auditoría

      // Calcular total acumulado y generar datos del gráfico
      calcularTotalesAuditoria(movimientosData);
      generarDatosGrafico(movimientosData);

      setRecursos({
        arreglos: ajustesData.length,
        acciones: accionesData.length,
        combinaciones: ajustesAccionData.length
      });

      // Guardar cajones y códigos
      setCajones(cajonesData);
      setCodigos(codigosData);

    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("Error al cargar los datos del sistema");
    } finally {
      setCargando(false);
      setCargaInicial(false);
      setActualizando(false);
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

  // ========== FUNCIONES PARA AUDITORÍA ==========
  
  // Calcular totales generales para auditoría
  const calcularTotalesAuditoria = (datos) => {
    let totIngresos = 0;
    let totEgresos = 0;

    datos.forEach((mov) => {
      const monto = Number(mov.monto) || 0;
      if (mov.tipo === "entrada") {
        totIngresos += monto;
      } else if (mov.tipo === "salida") {
        totEgresos += monto;
      }
    });

    setTotalAcumulado(totIngresos - totEgresos);
  };

  // Filtrar movimientos por rango de fechas
  useEffect(() => {
    const filtered = todosLosMovimientos.filter((mov) => {
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
  }, [todosLosMovimientos, fechaInicio, fechaFin]);

  // Regenerar gráficos cuando cambien las fechas de filtro
  useEffect(() => {
    if (todosLosMovimientos.length > 0) {
      generarDatosGrafico(todosLosMovimientos);
    }
  }, [fechaInicio, fechaFin, todosLosMovimientos]);

  // Generar datos para gráficos usando rango de fechas dinámico
  const generarDatosGrafico = (datos) => {
    // Usar el rango de fechas seleccionado dinámicamente
    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    const rangoFechas = {};

    // Generar todas las fechas en el rango seleccionado
    const fechaActual = new Date(fechaInicioDate);
    while (fechaActual <= fechaFinDate) {
      const fechaStr = formatearFechaLocal(fechaActual);
      
      rangoFechas[fechaStr] = {
        fecha: fechaStr,
        ingresos: 0,
        egresos: 0,
        neto: 0
      };
      
      fechaActual.setDate(fechaActual.getDate() + 1);
    }

    // Llenar con datos de movimientos filtrados por rango de fechas
    datos.forEach((mov) => {
      const fechaMov = new Date(mov.fecha_movimiento);
      const fechaMovStr = formatearFechaLocal(fechaMov);
      const monto = Number(mov.monto) || 0;

      // Solo incluir movimientos dentro del rango de fechas
      if (rangoFechas[fechaMovStr]) {
        if (mov.tipo === "entrada") {
          rangoFechas[fechaMovStr].ingresos += monto;
        } else if (mov.tipo === "salida") {
          rangoFechas[fechaMovStr].egresos += monto;
        }
        rangoFechas[fechaMovStr].neto = rangoFechas[fechaMovStr].ingresos - rangoFechas[fechaMovStr].egresos;
      }
    });

    setChartData(Object.values(rangoFechas));
  };

  // Exportar a Excel
  const exportarExcel = () => {
    if (movimientosFiltrados.length === 0) {
      warning("No hay datos para exportar");
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría Caja");
    XLSX.writeFile(workbook, `Auditoria_Caja_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  // Exportar a PDF
  const exportarPDF = async () => {
    if (movimientosFiltrados.length === 0) {
      warning("No hay datos para exportar");
      return;
    }

    const element = document.getElementById("tabla-auditoria-export");
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

      pdf.setFontSize(14);
      pdf.text("Auditoría de Movimientos de Caja", 14, 10);
      pdf.setFontSize(10);
      pdf.text(`Período: ${fechaInicio} a ${fechaFin}`, 14, 18);

      pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);

      pdf.save(`Auditoria_Caja_${fechaInicio}_a_${fechaFin}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      showError("Error al exportar PDF");
    }
  };

  // Función para ingresar la base de caja diaria
  const handleCrearBaseDiaria = async () => {
    const monto = parseFloat(nuevoMontoBase.replace(/[^\d]/g, ''));
    
    if (!monto || monto <= 0) {
      warning("Por favor ingresa un monto válido para la base de caja");
      return;
    }

    try {
      setCargandoBase(true);
      const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
      const idUsuario = usuarioGuardado?.id_usuario || 1;
      
      await crearBaseDiaria(monto, idUsuario);
      success("Base de caja del día registrada correctamente. Los empleados ahora pueden realizar movimientos de caja.");
      setBaseDiariaExiste(true);
      setMontoBaseDiaria(monto);
      setNuevoMontoBase("");
      cargarTodosLosDatos(true); // Actualización silenciosa
    } catch (error) {
      console.error("Error:", error);
      showError(error.message || "Error al registrar la base de caja");
    } finally {
      setCargandoBase(false);
    }
  };

  // ========== FUNCIONES PARA CAJONES Y CÓDIGOS ==========
  
  // Obtener estadísticas de un cajón
  const obtenerEstadisticasCajon = (idCajon) => {
    const codigosCajon = codigos.filter(c => c.id_cajon === idCajon);
    const disponibles = codigosCajon.filter(c => c.estado === 'disponible' || !c.estado).length;
    const ocupados = codigosCajon.filter(c => c.estado === 'ocupado').length;
    return {
      total: codigosCajon.length,
      disponibles,
      ocupados
    };
  };

  // Crear nuevo cajón con códigos
  const handleCrearCajon = async () => {
    if (!nombreNuevoCajon.trim()) {
      warning("Por favor ingresa un nombre para el cajón");
      return;
    }
    if (cantidadCodigosNuevos < 1 || cantidadCodigosNuevos > 100) {
      warning("La cantidad de códigos debe estar entre 1 y 100");
      return;
    }

    setCargandoCajones(true);
    try {
      // Crear el cajón
      const resultCajon = await crearCajon(nombreNuevoCajon.trim());
      
      // Obtener el ID del nuevo cajón (recargar cajones)
      const cajonesActualizados = await obtenerCajones();
      const nuevoCajon = cajonesActualizados.find(c => c.nombre_cajon === nombreNuevoCajon.trim());
      
      if (nuevoCajon) {
        // Obtener el último código para continuar la numeración
        const todosLosCodigos = await obtenerCodigos();
        let ultimoNumero = 0;
        todosLosCodigos.forEach(c => {
          const num = parseInt(c.codigo_numero, 10);
          if (!isNaN(num) && num > ultimoNumero) {
            ultimoNumero = num;
          }
        });

        // Crear los códigos para el nuevo cajón
        for (let i = 1; i <= cantidadCodigosNuevos; i++) {
          const nuevoNumero = ultimoNumero + i;
          await crearCodigo(nuevoNumero.toString(), nuevoCajon.id_cajon);
        }
      }

      success(`Cajón "${nombreNuevoCajon}" creado con ${cantidadCodigosNuevos} códigos`);
      setNombreNuevoCajon("");
      setCantidadCodigosNuevos(26);
      setMostrarModalCajon(false);
      cargarTodosLosDatos(true); // Actualización silenciosa
    } catch (error) {
      console.error("Error al crear cajón:", error);
      showError("Error al crear el cajón");
    } finally {
      setCargandoCajones(false);
    }
  };

  // Eliminar códigos de un cajón (reducir cantidad)
  const handleEliminarCodigosCajon = async (idCajon, cantidadEliminar) => {
    const codigosCajon = codigos.filter(c => c.id_cajon === idCajon);
    const codigosDisponibles = codigosCajon.filter(c => c.estado === 'disponible' || !c.estado);
    if (codigosDisponibles.length < cantidadEliminar) {
      warning(`Solo hay ${codigosDisponibles.length} códigos disponibles para eliminar. Los códigos ocupados no se pueden eliminar.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar ${cantidadEliminar} código(s) de este cajón?`)) {
      return;
    }

    setCargandoCajones(true);
    try {
      // Eliminar los últimos códigos disponibles
      const codigosAEliminar = codigosDisponibles.slice(-cantidadEliminar);
      for (const codigo of codigosAEliminar) {
        await eliminarCodigo(codigo.id_codigo);
      }

      // Renumerar todos los códigos después de eliminar
      let codigosActualizados = await obtenerCodigos();
      codigosActualizados = codigosActualizados.sort((a, b) => {
        if (a.id_cajon === b.id_cajon) {
          return a.id_codigo - b.id_codigo;
        }
        return a.id_cajon - b.id_cajon;
      });
      let numero = 1;
      for (let i = 0; i < codigosActualizados.length; i++) {
        if (codigosActualizados[i].codigo_numero !== numero.toString()) {
          await actualizarCodigoNumero(codigosActualizados[i].id_codigo, numero.toString(), codigosActualizados[i].id_cajon, codigosActualizados[i].estado);
        }
        numero++;
      }

      success(`Se eliminaron ${cantidadEliminar} código(s) y se reenumeraron todos los códigos de todos los cajones.`);
      cargarTodosLosDatos(true); // Actualización silenciosa
    } catch (error) {
      console.error("Error al eliminar códigos:", error);
      showError("Error al eliminar códigos");
    } finally {
      setCargandoCajones(false);
    }
  };

  // Agregar códigos a un cajón existente
  const handleAgregarCodigosCajon = async (idCajon, cantidadAgregar) => {
    if (cantidadAgregar < 1) {
      warning("Ingresa una cantidad válida");
      return;
    }

    setCargandoCajones(true);
    try {
      // Obtener todos los códigos actuales y ordenarlos por número
      let todosLosCodigos = await obtenerCodigos();
      todosLosCodigos = todosLosCodigos.sort((a, b) => parseInt(a.codigo_numero, 10) - parseInt(b.codigo_numero, 10));

      // Insertar los nuevos códigos al final del cajón seleccionado
      for (let i = 0; i < cantidadAgregar; i++) {
        await crearCodigo("0", idCajon); // Temporal, luego se renumera
      }

      // Volver a obtener todos los códigos (incluyendo los nuevos)
      let codigosActualizados = await obtenerCodigos();
      // Ordenar por id_cajon y luego por id_codigo para mantener orden consistente
      codigosActualizados = codigosActualizados.sort((a, b) => {
        if (a.id_cajon === b.id_cajon) {
          return a.id_codigo - b.id_codigo;
        }
        return a.id_cajon - b.id_cajon;
      });

      // Renumerar todos los códigos de todos los cajones de forma secuencial
      let numero = 1;
      for (let i = 0; i < codigosActualizados.length; i++) {
        if (codigosActualizados[i].codigo_numero !== numero.toString()) {
          await actualizarCodigoNumero(codigosActualizados[i].id_codigo, numero.toString(), codigosActualizados[i].id_cajon, codigosActualizados[i].estado);
        }
        numero++;
      }

      success(`Se agregaron ${cantidadAgregar} código(s) al cajón y se reenumeraron todos los códigos de todos los cajones.`);
      cargarTodosLosDatos(true); // Actualización silenciosa
    } catch (error) {
      console.error("Error al agregar códigos:", error);
      showError("Error al agregar códigos");
    } finally {
      setCargandoCajones(false);
    }
  };

  // Eliminar un cajón completo
  const handleEliminarCajon = async (idCajon) => {
    const stats = obtenerEstadisticasCajon(idCajon);
    if (stats.ocupados > 0) {
      warning(`No se puede eliminar el cajón porque tiene ${stats.ocupados} código(s) ocupado(s) con pedidos activos.`);
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar este cajón y todos sus ${stats.total} códigos?`)) {
      return;
    }

    setCargandoCajones(true);
    try {
      // Primero eliminar todos los códigos del cajón
      const codigosCajon = codigos.filter(c => c.id_cajon === idCajon);
      for (const codigo of codigosCajon) {
        await eliminarCodigo(codigo.id_codigo);
      }
      // Luego eliminar el cajón
      await eliminarCajon(idCajon);

      // Renumerar todos los códigos después de eliminar el cajón
      let codigosActualizados = await obtenerCodigos();
      codigosActualizados = codigosActualizados.sort((a, b) => {
        if (a.id_cajon === b.id_cajon) {
          return a.id_codigo - b.id_codigo;
        }
        return a.id_cajon - b.id_cajon;
      });
      let numero = 1;
      for (let i = 0; i < codigosActualizados.length; i++) {
        if (codigosActualizados[i].codigo_numero !== numero.toString()) {
          await actualizarCodigoNumero(codigosActualizados[i].id_codigo, numero.toString(), codigosActualizados[i].id_cajon, codigosActualizados[i].estado);
        }
        numero++;
      }

      success("Cajón eliminado correctamente y se reenumeraron todos los códigos de todos los cajones.");
      cargarTodosLosDatos(true); // Actualización silenciosa
    } catch (error) {
      console.error("Error al eliminar cajón:", error);
      showError("Error al eliminar el cajón");
    } finally {
      setCargandoCajones(false);
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
        {/* Indicador sutil de actualización */}
        {actualizando && (
          <div className="actualizando-indicador">
            <div className="actualizando-spinner"></div>
            <span>Actualizando...</span>
          </div>
        )}

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
            className={`pestana-admin ${pestanaActiva === "configuracion" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("configuracion")}
          >
            Configuración
          </button>
          <button
            className={`pestana-admin ${pestanaActiva === "auditoria" ? "activa" : ""}`}
            onClick={() => setPestanaActiva("auditoria")}
          >
            Auditoría
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

            {/* ========== FILTROS Y EXPORTACIÓN ========== */}
            <div className="filtro-auditoria-section">
              <div className="filtro-group-auditoria">
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

                <div className="botones-exportar">
                  <button 
                    className="btn-exportar excel"
                    onClick={exportarExcel}
                    title="Exportar a Excel"
                  >
                    <FaFileExcel style={{ marginRight: "8px" }} />
                    Excel
                  </button>
                  <button 
                    className="btn-exportar pdf"
                    onClick={exportarPDF}
                    title="Exportar a PDF"
                  >
                    <FaFilePdf style={{ marginRight: "8px" }} />
                    PDF
                  </button>
                </div>
              </div>

              <div className="resumen-filtro-auditoria">
                <strong>Registros encontrados:</strong> {movimientosFiltrados.length}
              </div>
            </div>

            {/* ========== CARDS DE RESUMEN ========== */}
            <div className="cards-auditoria-grid">
              <div className="card-auditoria card-ingreso">
                <div className="card-label">Ingresos (Filtrado)</div>
                <div className="card-value income">{formatCOP(ingresoFiltrado)}</div>
                <span className="card-icon"><FaArrowTrendUp /></span>
              </div>

              <div className="card-auditoria card-egreso">
                <div className="card-label">Egresos (Filtrado)</div>
                <div className="card-value expense">{formatCOP(egresoFiltrado)}</div>
                <span className="card-icon"><FaArrowTrendDown /></span>
              </div>

              <div className="card-auditoria card-acumulado">
                <div className="card-label">Acumulado (Filtrado)</div>
                <div className="card-value">{formatCOP(acumuladoFiltrado)}</div>
                <span className="card-icon"><Icon icon="streamline-ultimate:money-bag-dollar-bold" /></span>
              </div>

              <div className="card-auditoria card-total">
                <div className="card-label">Total General</div>
                <div className="card-value">{formatCOP(totalAcumulado)}</div>
                <span className="card-icon"><Icon icon="streamline-ultimate:cash-briefcase-bold" width="23px" height="26px" /></span>
              </div>
            </div>

            {/* ========== GRÁFICOS ========== */}
            <div className="charts-auditoria-section">
              <div className="chart-box-auditoria">
                <h3>Flujo de Caja (Filtrado por fechas)</h3>
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
                  <p className="no-data-chart">No hay datos disponibles</p>
                )}
              </div>

              <div className="chart-box-auditoria">
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
                  <p className="no-data-chart">No hay datos disponibles</p>
                )}
              </div>
            </div>

            {/* ========== TABLA DE MOVIMIENTOS ========== */}
            <h3 style={{ marginTop: '2rem' }}>Registro de Auditoría - Movimientos de Caja</h3>
            {movimientosFiltrados.length > 0 ? (
              <div className="tabla-contenedor table-responsive-container">
                <table className="tabla-admin" id="tabla-auditoria-export">
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
                    {movimientosFiltrados.map((movimiento) => (
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
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No hay movimientos en el rango de fechas seleccionado</p>
            )}
          </div>
        )}

        {/* ========== PESTAÑA CONFIGURACIÓN ========== */}
        {pestanaActiva === "configuracion" && (
          <div className="pestana-contenido">
            {/* SECCIÓN CAJONES Y CÓDIGOS - PLEGABLE */}
            <div className={`seccion-cajones ${seccionCajonesExpandida ? 'expandida' : 'colapsada'}`}>
              <div 
                className="seccion-header-plegable"
                onClick={() => setSeccionCajonesExpandida(!seccionCajonesExpandida)}
              >
                <div className="header-titulo">
                  <span className="toggle-icon">
                    {seccionCajonesExpandida ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                  <h3><FaBox style={{ marginRight: '8px' }} /> Configuración de Cajones y Códigos</h3>
                  <span className="badge-count">{cajones.length} cajones</span>
                </div>
                <button 
                  className="btn-agregar-cajon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarModalCajon(true);
                  }}
                  disabled={cargandoCajones}
                >
                  <FaPlus /> Nuevo
                </button>
              </div>

              {seccionCajonesExpandida && (
                <div className="seccion-contenido">
                  {cargandoCajones && (
                    <div className="loading-cajones">Cargando cajones...</div>
                  )}

                  <div className="cajones-tabla-container">
                    <table className="cajones-tabla">
                      <thead>
                        <tr>
                          <th className="col-nombre">Cajón</th>
                          <th className="col-stats">Total</th>
                          <th className="col-stats">Disp.</th>
                          <th className="col-stats">Ocup.</th>
                          <th className="col-acciones">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cajones.map((cajon) => {
                          const stats = obtenerEstadisticasCajon(cajon.id_cajon);
                          return (
                            <tr key={cajon.id_cajon} className="cajon-fila">
                              <td className="col-nombre">
                                <span className="nombre-cajon">{cajon.nombre_cajon}</span>
                              </td>
                              <td className="col-stats">
                                <span className="stat-total">{stats.total}</span>
                              </td>
                              <td className="col-stats">
                                <span className="stat-disponible">{stats.disponibles}</span>
                              </td>
                              <td className="col-stats">
                                <span className="stat-ocupado">{stats.ocupados}</span>
                              </td>
                              <td className="col-acciones">
                                <div className="acciones-inline">
                                  <div className="accion-mini">
                                    <input 
                                      type="number" 
                                      min="1" 
                                      max="50" 
                                      defaultValue="1"
                                      id={`agregar-${cajon.id_cajon}`}
                                      className="input-mini"
                                    />
                                    <button 
                                      className="btn-mini btn-add"
                                      onClick={() => {
                                        const input = document.getElementById(`agregar-${cajon.id_cajon}`);
                                        handleAgregarCodigosCajon(cajon.id_cajon, parseInt(input.value) || 1);
                                      }}
                                      disabled={cargandoCajones}
                                      title="Agregar códigos"
                                    >
                                      <FaPlus />
                                    </button>
                                  </div>
                                  <div className="accion-mini">
                                    <input 
                                      type="number" 
                                      min="1" 
                                      max={stats.disponibles}
                                      defaultValue="1"
                                      id={`reducir-${cajon.id_cajon}`}
                                      className="input-mini"
                                    />
                                    <button 
                                      className="btn-mini btn-remove"
                                      onClick={() => {
                                        const input = document.getElementById(`reducir-${cajon.id_cajon}`);
                                        handleEliminarCodigosCajon(cajon.id_cajon, parseInt(input.value) || 1);
                                      }}
                                      disabled={cargandoCajones || stats.disponibles === 0}
                                      title="Reducir códigos"
                                    >
                                      −
                                    </button>
                                  </div>
                                  <button 
                                    className="btn-mini btn-delete"
                                    onClick={() => handleEliminarCajon(cajon.id_cajon)}
                                    disabled={cargandoCajones || stats.ocupados > 0}
                                    title={stats.ocupados > 0 ? "No se puede eliminar" : "Eliminar cajón"}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Vista móvil: Cards compactas */}
                  <div className="cajones-cards-mobile">
                    {cajones.map((cajon) => {
                      const stats = obtenerEstadisticasCajon(cajon.id_cajon);
                      return (
                        <div key={cajon.id_cajon} className="cajon-card-compact">
                          <div className="card-top">
                            <span className="nombre">{cajon.nombre_cajon}</span>
                            <div className="stats-pills">
                              <span className="pill total">{stats.total}</span>
                              <span className="pill disp">{stats.disponibles}</span>
                              <span className="pill ocup">{stats.ocupados}</span>
                            </div>
                          </div>
                          <div className="card-actions">
                            <div className="action-group">
                              <input 
                                type="number" 
                                min="1" 
                                defaultValue="1"
                                id={`m-agregar-${cajon.id_cajon}`}
                                className="input-sm"
                              />
                              <button 
                                className="btn-sm btn-add"
                                onClick={() => {
                                  const input = document.getElementById(`m-agregar-${cajon.id_cajon}`);
                                  handleAgregarCodigosCajon(cajon.id_cajon, parseInt(input.value) || 1);
                                }}
                                disabled={cargandoCajones}
                              >
                                <FaPlus />
                              </button>
                            </div>
                            <div className="action-group">
                              <input 
                                type="number" 
                                min="1" 
                                defaultValue="1"
                                id={`m-reducir-${cajon.id_cajon}`}
                                className="input-sm"
                              />
                              <button 
                                className="btn-sm btn-remove"
                                onClick={() => {
                                  const input = document.getElementById(`m-reducir-${cajon.id_cajon}`);
                                  handleEliminarCodigosCajon(cajon.id_cajon, parseInt(input.value) || 1);
                                }}
                                disabled={cargandoCajones || stats.disponibles === 0}
                              >
                                −
                              </button>
                            </div>
                            <button 
                              className="btn-sm btn-delete"
                              onClick={() => handleEliminarCajon(cajon.id_cajon)}
                              disabled={cargandoCajones || stats.ocupados > 0}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {cajones.length === 0 && (
                    <div className="sin-cajones">
                      <p>No hay cajones configurados</p>
                      <p>Haz clic en "Nuevo" para crear uno</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal para crear nuevo cajón */}
            {mostrarModalCajon && (
              <div className="modal-overlay">
                <div className="modal-content-ca modal-cajon">
                  <div className="modal-header-ca">
                    <h2><FaBox /> Crear Nuevo Cajón</h2>
                    <button className="btn-close" onClick={() => setMostrarModalCajon(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Nombre del Cajón:</label>
                      <input
                        type="text"
                        value={nombreNuevoCajon}
                        onChange={(e) => setNombreNuevoCajon(e.target.value)}
                        placeholder="Ej: Cajón 10, Cajón Grande..."
                      />
                    </div>
                    <div className="form-group">
                      <label>Cantidad de Códigos:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={cantidadCodigosNuevos}
                        onChange={(e) => setCantidadCodigosNuevos(parseInt(e.target.value) || 26)}
                      />
                      <small>Los códigos se numerarán automáticamente continuando desde el último existente</small>
                    </div>
                  </div>
                  <div className="modal-footer-ca">
                    <button 
                      className="btn-crear"
                      onClick={handleCrearCajon}
                      disabled={cargandoCajones}
                    >
                      {cargandoCajones ? 'Creando...' : 'Crear Cajón'}
                    </button>
                    <button
                      className="btn-cancelar-control-admin"
                      type="button"
                      onClick={() => setMostrarModalCajon(false)}
                      disabled={cargandoCajones}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SEPARADOR */}
            <hr className="separador-config" />

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