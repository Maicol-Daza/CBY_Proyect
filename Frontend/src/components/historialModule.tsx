import React, { useState, useEffect } from "react";
import "../styles/historialModule.css";
import { FaEye, FaTimes, FaHistory, FaUndo, FaFileInvoice } from "react-icons/fa";
import { FaFileExcel, FaFilePdf } from "react-icons/fa6";
import { obtenerCodigos } from "../services/codigosService";
import { obtenerCajones } from "../services/cajonesService";
import { FaEdit } from 'react-icons/fa';
import { formatCOP } from '../utils/formatCurrency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { InputMoneda } from './InputMoneda';
import ModalFacturas from './ModalFacturas';

export const HistorialModule = () => {
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [filtros, setFiltros] = useState({
        busqueda: "",
        estado: "todos",
        fechaInicio: "",
        fechaFin: ""
    });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null);
    const [cargandoDetalles, setCargandoDetalles] = useState(false);
    const [abonosPedido, setAbonosPedido] = useState<any[]>([]);
    const [loadingAbonos, setLoadingAbonos] = useState(false);
    const [abonosSoloModalOpen, setAbonosSoloModalOpen] = useState(false);
    const [loadingAbonosSolo, setLoadingAbonosSolo] = useState(false);
    const [abonosSolo, setAbonosSolo] = useState<any[]>([]);
    const [modalDevolucionOpen, setModalDevolucionOpen] = useState(false);
    const [pedidoDevolucion, setPedidoDevolucion] = useState<any>(null);
    const [devolucionData, setDevolucionData] = useState({
      motivo: "",
      descripcion: "",
      solucion: "reembolso",
      monto: 0
    });
    const [cargandoDevolucion, setCargandoDevolucion] = useState(false);
    const [modalFacturasOpen, setModalFacturasOpen] = useState(false);
    const [datosFactura, setDatosFactura] = useState<any>(null);

    useEffect(() => {
        cargarPedidos();
    }, []);

    const cargarPedidos = async () => {
        try {
            setCargando(true);
            const response = await fetch("http://localhost:3000/api/pedidos");

            if (!response.ok) {
                throw new Error("Error al cargar pedidos");
            }

            const data = await response.json();
            setPedidos(data);
            setError(null);
        } catch (error) {
            console.error("Error cargando pedidos:", error);
            setError("No se pudieron cargar los pedidos");
            setPedidos([]);
        } finally {
            setCargando(false);
        }
    };

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return "-";
        try {
            const date = new Date(fecha);
            return date.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
        } catch {
            return fecha;
        }
    };

    const handleVerDetalles = async (id_pedido: number) => {
        try {
            setCargandoDetalles(true);
            const response = await fetch(`http://localhost:3000/api/pedidos/${id_pedido}`);

            if (!response.ok) {
                throw new Error("Error al cargar detalles");
            }

            const data = await response.json();
            console.log("Datos del pedido (raw):", data);

            // Normalizar campo id_cajon
            const cajonNormalizado =
                data.id_cajon ??
                data.cajon?.id ??
                data.cajon?.numero ??
                data.cajon_id ??
                (typeof data.cajon === "number" ? data.cajon : undefined) ??
                null;

            // Normalizar campo observaciones (puede venir con varios nombres)
            const observacionesNormalizado =
                data.observaciones ??
                data.observacion ??
                data.notas ??
                data.nota ??
                data.comentarios ??
                data.comentario ??
                null;

            const pedidoNormalizado: any = {
                ...data,
                id_cajon: cajonNormalizado,
                observaciones: observacionesNormalizado
            };

            // Resolver nombre del cajón
            let nombreCajon: string | null = data.nombre_cajon ?? data.nombre_cajon_cajon ?? null;

            if (!nombreCajon && pedidoNormalizado.id_cajon) {
                try {
                    const cajones = await obtenerCajones();
                    const cajonMatch = cajones.find((c: any) => Number(c.id_cajon) === Number(pedidoNormalizado.id_cajon));
                    if (cajonMatch) nombreCajon = cajonMatch.nombre_cajon;
                } catch (e) {
                    console.warn("No se pudieron obtener cajones para resolver nombre:", e);
                }
            }

            if (!nombreCajon) {
                try {
                    const codigos = await obtenerCodigos();
                    const codigoMatch = codigos.find((c: any) =>
                        Number(c.id_codigo) === Number(data.id_codigo) ||
                        Number(c.id_pedido) === Number(pedidoNormalizado.id_pedido) ||
                        Number(c.id_cajon) === Number(pedidoNormalizado.id_cajon)
                    );
                    if (codigoMatch) nombreCajon = codigoMatch.nombre_cajon;
                } catch (e) {
                    console.warn("No se pudieron obtener códigos para resolver nombre del cajón:", e);
                }
            }

            pedidoNormalizado.nombre_cajon = nombreCajon ?? null;

            console.log("Prendas:", pedidoNormalizado.prendas);
            console.log("Observaciones normalizadas:", pedidoNormalizado.observaciones);

            if (pedidoNormalizado.prendas && pedidoNormalizado.prendas[0]) {
                console.log("Primera prenda arreglos:", pedidoNormalizado.prendas[0].arreglos);
            }

            setPedidoSeleccionado(pedidoNormalizado);

            // Cargar abonos del pedido (para mostrar dentro del detalle)
            try {
                setLoadingAbonos(true);
                const respAb = await fetch(`http://localhost:3000/api/historial_abonos/pedido/${id_pedido}`);
                if (respAb.ok) {
                    const dataAb = await respAb.json();
                    setAbonosPedido(Array.isArray(dataAb) ? dataAb : []);
                } else {
                    setAbonosPedido([]);
                }
            } catch (e) {
                console.warn("Error al cargar abonos del pedido:", e);
                setAbonosPedido([]);
            } finally {
                setLoadingAbonos(false);
            }
        } catch (error) {
            console.error("Error cargando detalles:", error);
            alert("Error al cargar los detalles del pedido");
        } finally {
            setCargandoDetalles(false);
        }
    };

    const handleCerrarDetalles = () => {
        setPedidoSeleccionado(null);
        setAbonosPedido([]);
    };

    //función: obtener y mostrar solo los abonos de un pedido en modal separado
    const verAbonosSolo = async (id_pedido: number) => {
        try {
            setLoadingAbonosSolo(true);
            setAbonosSoloModalOpen(true);
            const resp = await fetch(`http://localhost:3000/api/historial_abonos/pedido/${id_pedido}`);
            if (!resp.ok) {
                setAbonosSolo([]);
                return;
            }
            const data = await resp.json();
            setAbonosSolo(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error al cargar abonos (solo):", err);
            setAbonosSolo([]);
        } finally {
            setLoadingAbonosSolo(false);
        }
    };

    const exportarPDF = () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Titulo
            doc.setFontSize(16);
            doc.text("Historial de Pedidos", 14, 15);

            // Fecha de generacion
            doc.setFontSize(10);
            doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 14, 25);

            // Informacion de filtros
            doc.setFontSize(9);
            let filtrosTexto = "Filtros aplicados: ";
            const filtrosAplicados = [];
            if (filtros.busqueda) filtrosAplicados.push(`Busqueda: ${filtros.busqueda}`);
            if (filtros.estado !== "todos") filtrosAplicados.push(`Estado: ${filtros.estado}`);
            if (filtros.fechaInicio) filtrosAplicados.push(`Desde: ${filtros.fechaInicio}`);
            if (filtros.fechaFin) filtrosAplicados.push(`Hasta: ${filtros.fechaFin}`);

            if (filtrosAplicados.length > 0) {
                filtrosTexto += filtrosAplicados.join(" | ");
            } else {
                filtrosTexto += "Ninguno (todos los registros)";
            }
            doc.text(filtrosTexto, 14, 32);

            //TABLA DE DATOS CON GARANTÍA
            const datosTabla = pedidosFiltrados.map(pedido => {
                const total = parseFloat((pedido.total_pedido ?? pedido.totalPedido ?? 0).toString());
                const saldo = parseFloat((pedido.saldo ?? pedido.saldoPendiente ?? 0).toString());
                const garantia = pedido.garantia ? `${pedido.garantia} días` : "Sin garantía";
                
                return [
                    pedido.id_pedido || "-",
                    pedido.cliente_nombre || "-",
                    formatearFecha(pedido.fecha_pedido),
                    formatearFecha(pedido.fecha_entrega),
                    pedido.estado === "en_proceso" ? "En proceso" :
                    pedido.estado === "listo" ? "Finalizado" :
                    pedido.estado === "entregado" ? "Entregado" : pedido.estado || "En proceso",
                    garantia,
                    `$${total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$${saldo.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ];
            });

            autoTable(doc, {
                head: [['Codigo', 'Cliente', 'Fecha Pedido', 'Fecha Entrega', 'Estado', 'Garantía', 'Total', 'Saldo']],
                body: datosTabla,
                startY: 38,
                margin: { left: 14, right: 14 },
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 5,
                    halign: 'right'
                },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'left' },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' },
                    5: { halign: 'center' },
                    6: { halign: 'right' },
                    7: { halign: 'right' }
                },
                headStyles: {
                    fillColor: [25, 118, 210],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });

            // Resumen al pie
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.text(`Total de registros: ${pedidosFiltrados.length}`, 14, finalY);

            const totalMontos = pedidosFiltrados.reduce((sum, p) => {
                return sum + parseFloat((p.total_pedido ?? p.totalPedido ?? 0).toString());
            }, 0);
            
            const totalSaldos = pedidosFiltrados.reduce((sum, p) => {
                return sum + parseFloat((p.saldo ?? p.saldoPendiente ?? 0).toString());
            }, 0);

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total en pedidos: $${totalMontos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 7);
            doc.text(`Total saldo pendiente: $${totalSaldos.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, finalY + 14);

            doc.save(`Historial_Pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Error al exportar PDF:", err);
            alert("Error al exportar a PDF");
        }
    };

    // GARANTÍA EN EXCEL
    const exportarExcel = () => {
        try {
            const datosExportar = pedidosFiltrados.map(pedido => {
                const total = parseFloat((pedido.total_pedido ?? pedido.totalPedido ?? 0).toString());
                const saldo = parseFloat((pedido.saldo ?? pedido.saldoPendiente ?? 0).toString());
                
                return {
                    'Código': pedido.id_pedido,
                    'Cliente': pedido.cliente_nombre,
                    'Fecha Pedido': formatearFecha(pedido.fecha_pedido),
                    'Fecha Entrega': formatearFecha(pedido.fecha_entrega),
                    'Estado': pedido.estado === "en_proceso" ? "En proceso" :
                             pedido.estado === "listo" ? "Finalizado" :
                             pedido.estado === "entregado" ? "Entregado" : pedido.estado,
                    'Garantía (días)': pedido.garantia || "Sin garantía",
                    'Total': total,
                    'Saldo Pendiente': saldo
                };
            });

            const ws = XLSX.utils.json_to_sheet(datosExportar);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

            ws['!cols'] = [
                { wch: 12 },
                { wch: 20 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 }
            ];

            XLSX.writeFile(wb, `Historial_Pedidos_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error("Error al exportar Excel:", err);
            alert("Error al exportar a Excel");
        }
    };

    const pedidosFiltrados = pedidos.filter(pedido => {
        const cumpleBusqueda =
            pedido.id_pedido?.toString().includes(filtros.busqueda.toLowerCase()) ||
            pedido.cliente_nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase());

        const cumpleEstado =
            filtros.estado === "todos" || pedido.estado === filtros.estado;

        // Mejorar filtro de fecha: verifica fecha_pedido Y fecha_entrega
        let cumpleFecha = true;
        if (filtros.fechaInicio || filtros.fechaFin) {
            const fechaPedido = pedido.fecha_pedido?.split("T")[0];
            const fechaEntrega = pedido.fecha_entrega?.split("T")[0];
            
            if (filtros.fechaInicio && filtros.fechaFin) {
                cumpleFecha = (fechaPedido >= filtros.fechaInicio && fechaPedido <= filtros.fechaFin) ||
                             (fechaEntrega >= filtros.fechaInicio && fechaEntrega <= filtros.fechaFin);
            } else if (filtros.fechaInicio) {
                cumpleFecha = fechaPedido >= filtros.fechaInicio || fechaEntrega >= filtros.fechaInicio;
            } else if (filtros.fechaFin) {
                cumpleFecha = fechaPedido <= filtros.fechaFin || fechaEntrega <= filtros.fechaFin;
            }
        }

        return cumpleBusqueda && cumpleEstado && cumpleFecha;
    });

    //Función para calcular la fecha final de garantía
    const calcularFechaGarantia = (fechaEntrega: string, diasGarantia: number): string => {
      try {
        const fecha = new Date(fechaEntrega);
        fecha.setDate(fecha.getDate() + diasGarantia);
        return fecha.toLocaleDateString("es-CO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
      } catch {
        return "-";
      }
    };

    // Función para verificar si la garantía está vigente
    const verificarGarantiaVigente = (fechaEntrega: string, diasGarantia: number): boolean => {
      if (!fechaEntrega || !diasGarantia) return false;
      
      try {
        const fechaFin = new Date(fechaEntrega);
        fechaFin.setDate(fechaFin.getDate() + diasGarantia);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaFin.setHours(0, 0, 0, 0);
        
        return hoy <= fechaFin;
      } catch {
        return false;
      }
    };

    //Función para obtener el estado de la garantía
    const obtenerEstadoGarantia = (fechaEntrega: string, diasGarantia: number): string => {
      if (!diasGarantia) return "Sin garantía";
      
      const vigente = verificarGarantiaVigente(fechaEntrega, diasGarantia);
      const diasRestantes = calcularDiasRestantes(fechaEntrega, diasGarantia);
      
      if (vigente) {
        return `Vigente (${diasRestantes} días restantes)`;
      } else {
        return "Vencida";
      }
    };

    // Función para calcular días restantes
    const calcularDiasRestantes = (fechaEntrega: string, diasGarantia: number): number => {
      if (!fechaEntrega || !diasGarantia) return 0;
      
      try {
        const fechaFin = new Date(fechaEntrega);
        fechaFin.setDate(fechaFin.getDate() + diasGarantia);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaFin.setHours(0, 0, 0, 0);
        
        const diferencia = fechaFin.getTime() - hoy.getTime();
        const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
        
        return dias > 0 ? dias : 0;
      } catch {
        return 0;
      }
    };

    // Función para abrir el modal de devolución
    const handleAbrirDevolucion = (pedido: any) => {
      // VALIDACIÓN: Solo permitir devolución si está entregado
      if (pedido.estado !== "entregado") {
        alert("❌ Solo se pueden devolver pedidos en estado 'Entregado'.\nEstado actual: " + 
          (pedido.estado === "en_proceso" ? "En proceso" : pedido.estado));
        return;
      }

      // Si elige reembolso, cargar automáticamente el monto total
      const montoTotal = parseFloat((pedido.total_pedido ?? pedido.totalPedido ?? 0).toString());
      
      setPedidoDevolucion(pedido);
      setDevolucionData({
        motivo: "",
        descripcion: "",
        solucion: "reembolso",
        monto: montoTotal
      });
      setModalDevolucionOpen(true);
    };

    // Función para cerrar el modal de devolución
    const handleCerrarDevolucion = () => {
      setModalDevolucionOpen(false);
      setPedidoDevolucion(null);
      setDevolucionData({
        motivo: "",
        descripcion: "",
        solucion: "reembolso",
        monto: 0
      });
    };

    // Función para abrir el modal de facturas
    const handleAbrirFacturas = async (pedido: any) => {
      try {
        // Cargar detalles completos del pedido (incluyendo prendas)
        const response = await fetch(`http://localhost:3000/api/pedidos/${pedido.id_pedido}`);
        
        if (!response.ok) {
          throw new Error("Error al cargar detalles del pedido");
        }

        const datosCompletos = await response.json();

        // Preparar datos para las facturas con todos los detalles
        const datosParaFactura = {
          id_pedido: datosCompletos.id_pedido,
          cliente_nombre: datosCompletos.cliente_nombre || 'No especificado',
          cliente_cedula: datosCompletos.cliente_cedula || 'N/A',
          cliente_telefono: datosCompletos.cliente_telefono || 'N/A',
          cliente_email: datosCompletos.cliente_email || 'N/A',
          fecha_pedido: datosCompletos.fecha_pedido,
          fecha_entrega: datosCompletos.fecha_entrega,
          total_pedido: datosCompletos.total_pedido || 0,
          abono: datosCompletos.abono || 0,
          saldo: datosCompletos.saldo || 0,
          prendas: datosCompletos.prendas || [],
          nombre_cajon: datosCompletos.nombre_cajon,
          id_cajon: datosCompletos.id_cajon
        };
        
        setDatosFactura(datosParaFactura);
        setModalFacturasOpen(true);
      } catch (error) {
        console.error("Error al abrir facturas:", error);
        alert("❌ Error al cargar los datos del pedido para las facturas");
      }
    };

    const handleCerrarFacturas = () => {
      setModalFacturasOpen(false);
      setDatosFactura(null);
    };


    const handleGuardarDevolucion = async () => {
      //VALIDACIÓN: Verificar si la garantía está vencida
      if (!verificarGarantiaVigente(pedidoDevolucion.fecha_entrega, pedidoDevolucion.garantia)) {
        alert("No se puede registrar la devolución: La garantía ha vencido");
        return;
      }

      if (!pedidoDevolucion || !devolucionData.motivo) {
        alert("Por favor selecciona un motivo de devolución");
        return;
      }

      setCargandoDevolucion(true);

      try {
        const response = await fetch(
          `http://localhost:3000/api/pedidos/${pedidoDevolucion.id_pedido}/devolucion`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              motivo_devolucion: devolucionData.motivo,
              descripcion_devolucion: devolucionData.descripcion || null,
              solucion_devolucion: devolucionData.solucion,
              monto_devolucion: devolucionData.solucion === "reembolso" ? devolucionData.monto : 0
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al registrar devolución");
        }

        alert("✓ Devolución registrada correctamente");
        
        await cargarPedidos();
        handleCerrarDevolucion();
      } catch (error) {
        console.error("Error:", error);
        alert(`❌ ${error instanceof Error ? error.message : "Error al registrar"}`);
      } finally {
        setCargandoDevolucion(false);
      }
    };



    return (
        <div className="historial-container">
            <div className="historial-header">
                <h1>Historial de Pedidos</h1>
                <div className="export-buttons">
                    <button className="btn-export btn-excel" type="button" onClick={exportarExcel}>
                        <FaFileExcel style={{ marginRight: "8px" }} /> Excel
                    </button>
                    <button className="btn-export btn-pdf" type="button" onClick={exportarPDF}>
                        <FaFilePdf style={{ marginRight: "8px" }} /> PDF
                    </button>
                </div>
            </div>

            {/* Actualizar sección de filtros */}
            <div className="filtros-section">
                <h3 className="filtros-title">Filtros de Búsqueda</h3>

                <div className="filtros-grid">
                    <div className="filtro-group">
                        <label>Buscar</label>
                        <input
                            type="text"
                            name="busqueda"
                            placeholder="Código o cliente..."
                            value={filtros.busqueda}
                            onChange={handleFiltroChange}
                            className="input-filtro"
                        />
                    </div>

                    <div className="filtro-group">
  <label>Estado</label>
  <select
    name="estado"
    value={filtros.estado}
    onChange={handleFiltroChange}
    className="select-filtro"
  >
    <option value="todos">Todos los estados</option>
    <option value="en_proceso">En proceso</option>
    <option value="entregado">Entregado</option>
    <option value="devuelto">Devuelto</option>
  </select>
</div>

                    <div className="filtro-group">
                        <label>Fecha desde</label>
                        <input
                            type="date"
                            name="fechaInicio"
                            value={filtros.fechaInicio}
                            onChange={handleFiltroChange}
                            className="input-filtro"
                        />
                    </div>

                    <div className="filtro-group">
                        <label>Fecha hasta</label>
                        <input
                            type="date"
                            name="fechaFin"
                            value={filtros.fechaFin}
                            onChange={handleFiltroChange}
                            className="input-filtro"
                        />
                    </div>
                </div>
            </div>

            <div className="pedidos-section">
                <h3 className="pedidos-title">Pedidos ({pedidosFiltrados.length})</h3>

                <div className="tabla-container">
                    {cargando ? (
                        <p className="cargando">Cargando pedidos...</p>
                    ) : error ? (
                        <p className="error">{error}</p>
                    ) : pedidosFiltrados && pedidosFiltrados.length > 0 ? (
                        <div className="table-responsive-container">
                            <table className="tabla-pedidos">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Cliente</th>
                                        <th>Fecha Pedido</th>
                                        <th>Fecha Entrega</th>
                                        <th>Estado</th>
                                        <th>Garantía</th>
                                        <th>Total</th>
                                        <th>Saldo Pediente</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidosFiltrados.map((pedido) => (
                                        <tr key={pedido.id_pedido}>
                                            <td>{pedido.id_pedido || "-"}</td>
                                            <td>{pedido.cliente_nombre || "-"}</td>
                                            <td>{formatearFecha(pedido.fecha_pedido)}</td>
                                            <td>{formatearFecha(pedido.fecha_entrega)}</td>
                                            <td>
                                                <span className={`estado-badge estado-${pedido.estado?.toLowerCase() || "en_proceso"}`}>
                                                    {pedido.estado === "en_proceso" ? "En proceso" :
                                                        pedido.estado === "listo" ? "Finalizado" :
                                                        pedido.estado === "entregado" ? "Entregado" :
                                                        pedido.estado === "devuelto" ? "DEVUELTO" :
                                                        pedido.estado || "En proceso"}
                                                </span>
                                            </td>
                                        {/* NUEVA COLUMNA DE GARANTÍA */}
                                        <td>
                                            <span className="garantia-badge">
                                                {pedido.garantia ? `${pedido.garantia} días` : "Sin garantía"}
                                            </span>
                                        </td>
                                        <td>{formatCOP(pedido.total_pedido ?? pedido.totalPedido ?? 0)}</td>
                                        <td className={parseFloat(pedido.saldo || 0) > 0 ? "monto pendiente" : "monto pagado"}>
                                            {formatCOP(pedido.saldo ?? pedido.saldoPendiente ?? 0)}
                                        </td>
                                        <td className="acciones-historial">
                                            <button
                                                className="btn-accion-ver"
                                                title="Ver detalles"
                                                type="button"
                                                onClick={() => handleVerDetalles(pedido.id_pedido)}
                                            >
                                                <FaEye /> Ver
                                            </button>
                                            <button
                                                className="btn-accion-facturas"
                                                title="Gestionar Facturas"
                                                onClick={() => handleAbrirFacturas(pedido)}
                                            >
                                                <FaFileInvoice /> Facturas
                                            </button>
                                            <button
                                                className="btn-accion-abono"
                                                title="Ver Abonos"
                                                onClick={() => verAbonosSolo(pedido.id_pedido)}
                                            >
                                                <FaHistory /> Abonos
                                            </button>
                                            <button
                                                className="btn-accion-devolucion"
                                                title={pedido.estado !== "entregado" ? "Solo se pueden devolver pedidos entregados" : "Registrar Devolución"}
                                                onClick={() => handleAbrirDevolucion(pedido)}
                                                disabled={pedido.estado !== "entregado"}  // ✅ DESHABILITAR BOTÓN
                                                style={{
                                                    opacity: pedido.estado !== "entregado" ? 0.5 : 1,
                                                    cursor: pedido.estado !== "entregado" ? "not-allowed" : "pointer"
                                                }}
                                            >
                                                <FaUndo /> Devolución
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="sin-resultados">No hay pedidos que coincidan con los filtros</p>
                    )}
                </div>
            </div>

            {/* MODAL DETALLES DEL PEDIDO */}
            {pedidoSeleccionado && (
                <div className="modal-overlay" onClick={handleCerrarDetalles}>
                    <div className="modal-content-detalle" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detalle del Pedido - {pedidoSeleccionado.id_pedido}</h2>
                            <button className="btn-cerrar" onClick={handleCerrarDetalles} type="button">
                                <FaTimes />
                            </button>
                        </div>

                        {cargandoDetalles ? (
                            <p className="cargando">Cargando detalles...</p>
                        ) : (
                            <div className="modal-body">
                                {/* INFORMACIÓN DEL CLIENTE Y PEDIDO - LADO A LADO */}
                                <div className="info-container">
                                    {/* INFORMACIÓN DEL CLIENTE */}
                                    <div className="detalle-seccion cliente-info">
                                        <h3>Información del Cliente</h3>
                                        <div className="info-items">
                                            <div className="info-item">
                                                <label>Nombre:</label>
                                                <p>{pedidoSeleccionado.cliente_nombre || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Identificación:</label>
                                                <p>{pedidoSeleccionado.cliente_cedula || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Teléfono:</label>
                                                <p>{pedidoSeleccionado.cliente_telefono || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Email:</label>
                                                <p>{pedidoSeleccionado.cliente_email || "-"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* INFORMACIÓN DEL PEDIDO */}
                                    <div className="detalle-seccion pedido-info">
                                      <h3>Información del Pedido</h3>
                                      <div className="info-items">
                                        <div className="info-item">
                                          <label>Código:</label>
                                          <p>{pedidoSeleccionado.id_pedido}</p>
                                        </div>
                                        
                                        {/*  OCULTAR CAJÓN SI EL PEDIDO YA ESTÁ ENTREGADO */}
                                        {pedidoSeleccionado.estado !== "entregado" && (
                                          <div className="info-item">
                                            <label>Cajón:</label>
                                            <p>{pedidoSeleccionado.nombre_cajon ?? pedidoSeleccionado.id_cajon ?? "-"}</p>
                                          </div>
                                        )}
                                        
                                        <div className="info-item">
                                          <label>Fecha Inicio:</label>
                                          <p>{formatearFecha(pedidoSeleccionado.fecha_pedido)}</p>
                                        </div>
                                        <div className="info-item">
                                          <label>Fecha Entrega:</label>
                                          <p>{formatearFecha(pedidoSeleccionado.fecha_entrega)}</p>
                                        </div>
                                        
                                        {/* ✅ NUEVA SECCIÓN: INFORMACIÓN DE GARANTÍA */}
                                        <div className="info-item">
                                          <label>Garantía:</label>
                                          <p>
                                            {pedidoSeleccionado.garantia ? (
                                              <span className="garantia-info">
                                                <strong>{pedidoSeleccionado.garantia} días</strong>
                                                {pedidoSeleccionado.fecha_entrega && (
                                                  <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "5px" }}>
                                                    Válida hasta: <strong>{calcularFechaGarantia(pedidoSeleccionado.fecha_entrega, pedidoSeleccionado.garantia)}</strong>
                                                  </div>
                                                )}
                                                {pedidoSeleccionado.estado === "entregado" && (
                                                  <div style={{ fontSize: "0.85rem", color: verificarGarantiaVigente(pedidoSeleccionado.fecha_entrega, pedidoSeleccionado.garantia) ? "#28a745" : "#dc3545", marginTop: "5px" }}>
                                                    {verificarGarantiaVigente(pedidoSeleccionado.fecha_entrega, pedidoSeleccionado.garantia) ? "✓ Garantía vigente" : "✗ Garantía vencida"}
                                                  </div>
                                                )}
                                              </span>
                                            ) : (
                                              <span style={{ color: "#999" }}>Sin garantía</span>
                                            )}
                                          </p>
                                        </div>

                                        <div className="info-item">
                                          <label>Estado:</label>
                                          <p>
                                            <span className={`estado-badge estado-${pedidoSeleccionado.estado?.toLowerCase()}`}>
                                              {pedidoSeleccionado.estado === "en_proceso" ? "En proceso" :
                                                pedidoSeleccionado.estado === "listo" ? "Finalizado" :
                                                  pedidoSeleccionado.estado === "entregado" ? " Entregado (Cajón Liberado)" :
                                                    pedidoSeleccionado.estado === "devuelto" ? "DEVUELTO" :
                                                    pedidoSeleccionado.estado || "En proceso"}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                </div>

                                {/* PRENDAS Y ARREGLOS */}
                                {pedidoSeleccionado.prendas && pedidoSeleccionado.prendas.length > 0 && (
                                    <div className="detalle-seccion prendas-seccion">
                                        <h3>Prendas y Arreglos</h3>
                                        <div className="prendas-list">
                                            {pedidoSeleccionado.prendas.map((prenda: any, idx: number) => (
                                                <div key={idx} className="prenda-card">
                                                    <div className="prenda-top">
                                                        <div className="prenda-info">
                                                            <p className="prenda-nombre">
                                                                <strong>{prenda.descripcion || prenda.nombre || "Sin descripción"}</strong>
                                                            </p>
                                                            <p className="prenda-tipo" style={{ margin: 4, color: '#666', fontSize: 13 }}>
                                                                Tipo: <strong>{prenda.tipo ?? prenda.tipo_prenda ?? prenda.nombre_tipo ?? "-"}</strong>
                                                            </p>
                                                            <p className="prenda-cantidad">
                                                                Cantidad: <strong>{prenda.cantidad || 0}</strong>
                                                            </p>
                                                        </div>
                                                        {/* <p className="prenda-precio">
                                                            ${parseFloat(prenda.precio_unitario || prenda.precio || 0).toLocaleString("es-CO")}
                                                        </p> */}
                                                    </div>

                                                    {prenda.arreglos && Array.isArray(prenda.arreglos) && prenda.arreglos.length > 0 ? (
                                                        <div className="arreglos-container">
                                                            <p className="arreglos-titulo"><strong>Ajustes/Arreglos:</strong></p>
                                                            {prenda.arreglos.map((arreglo: any, idx2: number) => {
                                                                // Normalizar nombre: PRIORIDAD ->
                                                                // 1) descripcion (desde detalle_pedido_combo.descripcion),
                                                                // 2) descripcion_combinacion,
                                                                // 3) nombre_ajuste + nombre_accion,
                                                                // 4) nombre_ajuste / nombre_accion / nombre,
                                                                // 5) tipo o "Sin nombre"
                                                                const nombreArreglo = (arreglo.descripcion && String(arreglo.descripcion).trim())
                                                                    ? String(arreglo.descripcion).trim()
                                                                    : (arreglo.descripcion_combinacion && String(arreglo.descripcion_combinacion).trim())
                                                                        ? String(arreglo.descripcion_combinacion).trim()
                                                                        : (arreglo.nombre_ajuste && arreglo.nombre_accion)
                                                                            ? `${String(arreglo.nombre_ajuste).trim()} + ${String(arreglo.nombre_accion).trim()}`
                                                                            : arreglo.nombre_ajuste
                                                                                ? String(arreglo.nombre_ajuste).trim()
                                                                                : arreglo.nombre_accion
                                                                                    ? String(arreglo.nombre_accion).trim()
                                                                                    : arreglo.nombre || arreglo.tipo || "Sin nombre";

                                                                // Normalizar precio probando múltiples campos que pueden venir desde backend
                                                                const precioArregloNum = parseFloat(
                                                                    (arreglo.precio ?? arreglo.valor ?? arreglo.precio_ajuste ?? arreglo.precio_acciones ?? arreglo.monto ?? 0)
                                                                        .toString()
                                                                ) || 0;

                                                                return (
                                                                    <div key={idx2} className="arreglo-item">
                                                                        <div className="arreglo-content">
                                                                            <span className="arreglo-nombre">{nombreArreglo}</span>
                                                                        </div>
                                                                        <span className="arreglo-precio">
                                                                            {formatCOP(precioArregloNum)}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="arreglos-container">
                                                            <p className="arreglos-titulo"><strong>Ajustes/Arreglos:</strong></p>
                                                            <p style={{ fontSize: "13px", color: "#999", margin: 0 }}>
                                                                No hay ajustes registrados
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* OBSERVACIONES */}
                                <div className="detalle-seccion observaciones-seccion">
                                    <h3>Observaciones</h3>
                                    {pedidoSeleccionado.observaciones ? (
                                        <p>{pedidoSeleccionado.observaciones}</p>
                                    ) : (
                                        <p style={{ color: "#999", fontStyle: "italic" }}>
                                            No hay observaciones registradas
                                        </p>
                                    )}
                                </div>

                                {/* RESUMEN FINANCIERO */}
                                <div className="detalle-seccion resumen-financiero">
                                    <h3>Resumen Financiero</h3>
                                    <div className="resumen-items">
                                        <div className="line-item">
                                            <span>Total pedido:</span>
                                            <strong>{formatCOP(pedidoSeleccionado.total_pedido ?? pedidoSeleccionado.totalPedido ?? 0)}</strong>
                                        </div>
                                        <div className="line-item">
                                            <span>Abono inicial:</span>
                                            <strong>{formatCOP(pedidoSeleccionado.abono_inicial ?? pedidoSeleccionado.abonoInicial ?? 0)}</strong>
                                        </div>
                                        <div className="line-item">
                                            <span>Saldo pendiente:</span>
                                            <strong>{formatCOP(pedidoSeleccionado.saldo ?? pedidoSeleccionado.saldoPendiente ?? 0)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* HISTORIAL DE ABONOS DEL PEDIDO */}
                                {/* <div className="detalle-seccion abonos-seccion">
                                    <h3>Historial de Abonos</h3>
                                    {loadingAbonos ? (
                                        <p>Cargando abonos...</p>
                                    ) : abonosPedido.length === 0 ? (
                                        <p style={{ color: "#999", fontStyle: "italic" }}>No hay abonos registrados para este pedido</p>
                                    ) : (
                                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                            <thead>
                                                <tr>
                                                    <th>Fecha</th>
                                                    <th>Monto</th>
                                                    <th>Observaciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {abonosPedido.map((a: any) => (
                                                    <tr key={a.id_historial_abono}>
                                                        <td>{formatearFecha(a.fecha_abono || a.fecha)}</td>
                                                        <td>{formatCOP(Number(a.abono || 0))}</td>
                                                        <td>{a.observaciones || "-"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div> */}

                                {/* SECCIÓN DE DEVOLUCIÓN - SOLO SI ESTADO ES DEVUELTO */}
                                {pedidoSeleccionado.estado === "devuelto" && (
                                    <div className="detalle-seccion devolucion-seccion">
                                        <h3>Información de Devolución</h3>
                                        <div className="info-items">
                                            <div className="info-item">
                                                <label>Motivo de Devolución:</label>
                                                <p>
                                                    {pedidoSeleccionado.motivo_devolucion ? (
                                                        pedidoSeleccionado.motivo_devolucion
                                                            .replace(/_/g, " ")
                                                            .split(" ")
                                                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                                            .join(" ")
                                                    ) : (
                                                        "-"
                                                    )}
                                                </p>
                                            </div>
                                            <div className="info-item">
                                                <label>Descripción del Defecto:</label>
                                                <p>{pedidoSeleccionado.descripcion_devolucion || "-"}</p>
                                            </div>
                                            <div className="info-item">
                                                <label>Solución Aplicada:</label>
                                                <p>
                                                    {pedidoSeleccionado.solucion_devolucion ? (
                                                        pedidoSeleccionado.solucion_devolucion === "reembolso"
                                                            ? "Reembolso Total"
                                                            : pedidoSeleccionado.solucion_devolucion === "nuevo_procedimiento"
                                                            ? "Nuevo Procedimiento Gratuito"
                                                            : pedidoSeleccionado.solucion_devolucion
                                                    ) : (
                                                        "-"
                                                    )}
                                                </p>
                                            </div>
                                            <div className="info-item">
                                                <label>Monto de Reembolso:</label>
                                                <p style={{ color: "#d32f2f", fontWeight: "600" }}>
                                                    {formatCOP(pedidoSeleccionado.monto_devolucion ?? 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL ABONOS SOLOS */}
            {abonosSoloModalOpen && (
                <div className="modal-overlay" onClick={() => setAbonosSoloModalOpen(false)}>
                    <div className="modal-content compact-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Abonos del Pedido</h2>
                            <button className="btn-cerrar" onClick={() => setAbonosSoloModalOpen(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            {loadingAbonosSolo ? (
                                <p className="cargando">Cargando abonos...</p>
                            ) : abonosSolo.length === 0 ? (
                                <div className="sin-abonos">
                                    <div className="icono">💳</div>
                                    <p>No se encontraron abonos para este pedido.</p>
                                </div>
                            ) : (
                                <div className="table-responsive-container">
                                    <table className="tabla-abonos">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Monto</th>
                                                <th>Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {abonosSolo.map((a) => (
                                                <tr key={a.id_historial_abono}>
                                                    <td>{new Date(a.fecha_abono).toLocaleDateString('es-CO', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}</td>
                                                    <td>{formatCOP(Number(a.abono || 0))}</td>
                                                    <td>{a.observaciones || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancelar" onClick={() => setAbonosSoloModalOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR DEVOLUCIÓN - SIMPLIFICADO */}
            {modalDevolucionOpen && pedidoDevolucion && (
  <div className="modal-overlay" onClick={handleCerrarDevolucion}>
    <div className="modal-content-devolucion" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Registrar Devolución - Pedido #{pedidoDevolucion.id_pedido}</h2>
        <button className="btn-cerrar" onClick={handleCerrarDevolucion} type="button">
          <FaTimes />
        </button>
      </div>

      <div className="modal-body-devolucion">
        {/* INFORMACIÓN DEL PEDIDO */}
        <div className="devolucion-info-pedido">
          <div className="info-row">
            <span><strong>Cliente:</strong> {pedidoDevolucion.cliente_nombre}</span>
            <span><strong>Cédula:</strong> {pedidoDevolucion.cliente_cedula}</span>
          </div>
          <div className="info-row">
            <span><strong>Fecha Entrega:</strong> {formatearFecha(pedidoDevolucion.fecha_entrega)}</span>
            <span><strong>Garantía:</strong> {pedidoDevolucion.garantia} días</span>
          </div>

          {/*ADVERTENCIA SI ESTÁ FUERA DE PLAZO */}
          {!verificarGarantiaVigente(pedidoDevolucion.fecha_entrega, pedidoDevolucion.garantia) && (
            <div className="advertencia-garantia-vencida">
              <strong>ADVERTENCIA: Garantía Vencida</strong>
              <p>
                La garantía venció el {calcularFechaGarantia(pedidoDevolucion.fecha_entrega, pedidoDevolucion.garantia)}.
              </p>
            </div>
          )}
        </div>

        {/* FORMULARIO DEVOLUCIÓN */}
        <div className="formulario-devolucion">
          {/* MOTIVO */}
          <div className="form-group">
            <label htmlFor="motivo">
              <strong>Motivo de la Devolución *</strong>
            </label>
            <select
              id="motivo"
              value={devolucionData.motivo}
              onChange={(e) =>
                setDevolucionData({ ...devolucionData, motivo: e.target.value })
              }
              className="input-devolucion"
            >
              <option value="">Selecciona un motivo...</option>
              <option value="medidas_incorrectas">Medidas Incorrectas</option>
              <option value="defecto_costura">Defecto de Costura</option>
              <option value="diferencia_pedido">Diferencia con lo Solicitado</option>
              <option value="calidad_material">Calidad del Material</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="form-group">
            <label htmlFor="descripcion">
              <strong>Descripción del Defecto</strong>
            </label>
            <textarea
              id="descripcion"
              value={devolucionData.descripcion}
              onChange={(e) =>
                setDevolucionData({ ...devolucionData, descripcion: e.target.value })
              }
              placeholder="Describe detalladamente el defecto encontrado..."
              className="input-devolucion textarea"
              rows={4}
            />
          </div>

          {/* SOLUCIÓN */}
          <div className="form-group">
            <label htmlFor="solucion">
              <strong>Solución a Aplicar *</strong>
            </label>
            <select
              id="solucion"
              value={devolucionData.solucion}
              onChange={(e) => {
                const nuevaSolucion = e.target.value;
                // Si elige reembolso, cargar automáticamente el monto total
                const nuevoMonto = nuevaSolucion === "reembolso" 
                  ? parseFloat((pedidoDevolucion.total_pedido ?? pedidoDevolucion.totalPedido ?? 0).toString())
                  : 0;
                
                setDevolucionData({ 
                  ...devolucionData, 
                  solucion: nuevaSolucion,
                  monto: nuevoMonto
                });
              }}
              className="input-devolucion"
            >
              <option value="reembolso">Reembolso Total</option>
              <option value="nuevo_procedimiento">Nuevo Procedimiento Gratuito</option>
            </select>
          </div>

          {/* MONTO - SOLO SI ES REEMBOLSO CON InputMoneda */}
          {devolucionData.solucion === "reembolso" && (
            <div className="form-group">
              <label htmlFor="monto">
                <strong>Monto a Reembolsar</strong>
              </label>
              <InputMoneda
                value={devolucionData.monto}
                onChange={(valor) =>
                  setDevolucionData({
                    ...devolucionData,
                    monto: valor
                  })
                }
                placeholder="$ 0,00"
                disabled={true}
              />
              <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                Monto original del pedido: {formatCOP(parseFloat((pedidoDevolucion.total_pedido ?? pedidoDevolucion.totalPedido ?? 0).toString()))}
              </small>
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancelar"
          onClick={handleCerrarDevolucion}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="btn-guardar"
          onClick={handleGuardarDevolucion}
          disabled={cargandoDevolucion}
          type="button"
        >
          {cargandoDevolucion ? "Guardando..." : "✓ Registrar Devolución"}
        </button>
      </div>
    </div>
  </div>
)}

            {/* Modal de Facturas */}
            <ModalFacturas
              isOpen={modalFacturasOpen}
              facturaData={datosFactura}
              onClose={handleCerrarFacturas}
            />
        </div>
    );
};



export default HistorialModule;