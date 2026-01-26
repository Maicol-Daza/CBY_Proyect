import React, { useState, useRef } from 'react';
import '../styles/modalFactura.css';
import { FaPrint, FaDownload, FaTimes, FaEye, FaFileInvoice, FaWarehouse, FaReceipt } from 'react-icons/fa';
import { descargarFacturaPDF, imprimirFactura, generarHTMLFactura, type FacturaData } from '../utils/facturasService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCOP } from '../utils/formatCurrency';

interface ModalFacturasUnificadoProps {
  isOpen: boolean;
  facturaData: FacturaData | null;
  onClose: () => void;
  initialVista?: VistaActual; // Opcional: abrir directamente una vista de preview al montar
}

type TipoFactura = 'cliente' | 'bodega' | 'original';
type VistaActual = 'menu' | 'preview-cliente' | 'preview-bodega' | 'preview-original';

export default function ModalFacturasUnificado({ isOpen, facturaData, onClose, initialVista }: ModalFacturasUnificadoProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>('');
  // Si el componente recibe `initialVista` queremos evitar renderizar primero el menú
  // para evitar parpadeos. Inicializamos la vista con `initialVista` si está presente.
  const [vistaActual, setVistaActual] = useState<VistaActual>(initialVista ?? 'menu');
  const [htmlPreview, setHtmlPreview] = useState<string>('');
  const facturaOriginalRef = useRef<HTMLDivElement>(null);

  // Si el padre pide abrir directamente una vista (ej. tras entrega), mostrarla al montar
  React.useEffect(() => {
    if (!isOpen) return;
    if (!facturaData) return;
    if (!initialVista) return;

    try {
      // Para 'original' queremos usar la versión cliente (visualmente es la estándar con header grande)
      const tipo = initialVista === 'preview-bodega' ? 'bodega' : 'cliente';
      const html = generarHTMLFactura(facturaData, tipo);
      setHtmlPreview(html);
      setVistaActual(initialVista);
    } catch (err) {
      console.error('Error al generar preview inicial:', err);
    }
  }, [isOpen, facturaData, initialVista]);


  if (!isOpen || !facturaData) return null;

  // Funciones auxiliares para la factura original
  const calcularSubtotalPrenda = (prenda: any) => {
    if (!prenda.arreglos || prenda.arreglos.length === 0) return 0;
    const precioTotal = prenda.arreglos.reduce(
      (total: number, arreglo: any) => total + (Number(arreglo.precio) || 0),
      0
    );
    return precioTotal * (prenda.cantidad || 1);
  };

  const calcularPrecioUnitario = (prenda: any) => {
    if (!prenda.arreglos || prenda.arreglos.length === 0) return 0;
    return prenda.arreglos.reduce(
      (total: number, arreglo: any) => total + (Number(arreglo.precio) || 0),
      0
    );
  };

  // Handlers para Factura Cliente
  const handleDescargarCliente = async () => {
    try {
      setCargando(true);
      setError('');
      await descargarFacturaPDF(facturaData, 'cliente');
    } catch (err) {
      setError('Error al descargar factura del cliente');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleImprimirCliente = async () => {
    try {
      setCargando(true);
      setError('');
      await imprimirFactura(facturaData, 'cliente');
    } catch (err) {
      setError('Error al imprimir factura del cliente');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleVerPreviewCliente = () => {
    try {
      const html = generarHTMLFactura(facturaData, 'cliente');
      setHtmlPreview(html);
      setVistaActual('preview-cliente');
    } catch (err) {
      setError('Error al cargar vista previa');
      console.error(err);
    }
  };

  // Handlers para Factura Bodega
  const handleDescargarBodega = async () => {
    try {
      setCargando(true);
      setError('');
      await descargarFacturaPDF(facturaData, 'bodega');
    } catch (err) {
      setError('Error al descargar factura de bodega');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleImprimirBodega = async () => {
    try {
      setCargando(true);
      setError('');
      await imprimirFactura(facturaData, 'bodega');
    } catch (err) {
      setError('Error al imprimir factura de bodega');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const handleVerPreviewBodega = () => {
    try {
      const html = generarHTMLFactura(facturaData, 'bodega');
      setHtmlPreview(html);
      setVistaActual('preview-bodega');
    } catch (err) {
      setError('Error al cargar vista previa');
      console.error(err);
    }
  };

  // Handlers para Factura Original
  const handleVerPreviewOriginal = () => {
    try {
      const html = generarHTMLFactura(facturaData, 'cliente');
      setHtmlPreview(html);
      setVistaActual('preview-original');
    } catch (err) {
      setError('Error al cargar vista previa');
      console.error(err);
    }
  };

  const handleImprimirOriginal = () => {
    try {
      setCargando(true);
      setError('');

      // Reutilizamos la función que genera el HTML completo con estilos
      const html = generarHTMLFactura(facturaData, 'cliente');

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) throw new Error('No se pudo abrir la ventana de impresión');

      printWindow.document.open();
      // generarHTMLFactura ya incluye <html>, <head> y estilos necesarios
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      // Cerrar la ventana automáticamente después de imprimir (onafterprint)
      let closed = false;
      const tryClose = () => {
        if (closed) return;
        try {
          printWindow.close();
        } catch (e) {
          // Ignorar
        }
        closed = true;
      };

      // onafterprint para cerrar cuando el usuario termine de imprimir
      printWindow.onafterprint = () => {
        tryClose();
      };

      // Fallback: cerrar después de 3s por si onafterprint no se dispara
      const fallback = setTimeout(() => {
        tryClose();
      }, 3000);

      // Lanzar impresión tras un pequeño retraso para que renderice
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          try {
            printWindow.print();
          } catch (e) {
            console.error('Error al iniciar impresión:', e);
          }
          // Limpiamos el estado de carga cuando ya intentamos imprimir
          setCargando(false);
        }, 250);
      });

      // Asegurar que si la ventana se cierra manualmente limpiamos el fallback
      const interval = setInterval(() => {
        if (printWindow.closed) {
          clearTimeout(fallback);
          clearInterval(interval);
          closed = true;
          setCargando(false);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Error al imprimir factura original');
      setCargando(false);
    }
  };



  const handleDescargarOriginal = async () => {
    if (!facturaOriginalRef.current) return;

    try {
      setCargando(true);
      setError('');
      const element = facturaOriginalRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        backgroundColor: '#fff',
        useCORS: true,
        allowTaint: true,
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Factura_${facturaData.id_pedido}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setError('Error al generar PDF');
    } finally {
      setCargando(false);
    }
  };



  const handleCerrarPreview = () => {
    // Si abrimos la vista en modo inicial (preview automática), cerrar completamente el modal al volver
    if (initialVista) {
      handleCerrar();
      return;
    }

    setVistaActual('menu');
    setHtmlPreview('');
  };

  const handleCerrar = () => {
    setVistaActual('menu');
    setHtmlPreview('');
    setError('');
    onClose();
  };

  // Obtener el nombre del arreglo según su tipo
  const obtenerNombreArreglo = (arreglo: any) => {
    if (arreglo.tipo === 'combinacion') {
      return arreglo.descripcion_combinacion?.trim() || 
             `${arreglo.nombre_ajuste || ''} + ${arreglo.nombre_accion || ''}`.replace(/\s+/g, ' ').trim();
    } else if (arreglo.tipo === 'ajuste') {
      return arreglo.nombre_ajuste || arreglo.descripcion_ajuste || 'Ajuste';
    } else if (arreglo.tipo === 'accion') {
      return arreglo.nombre_accion || arreglo.descripcion_accion || 'Acción';
    } else {
      return arreglo.nombre || arreglo.descripcion || 'Arreglo';
    }
  };

  // Renderizar vista previa de factura original (estilo del ModalFactura original)
  const renderFacturaOriginal = () => (
    <div ref={facturaOriginalRef} className="factura-contenido">
      {/* Encabezado */}
      <div className="factura-header">
        <h1>FACTURA DE VENTA</h1>
        <div className="factura-numero">
          <strong>Factura #:</strong> {facturaData.id_pedido}
        </div>
      </div>

      {/* Información de la empresa */}
      <div className="factura-empresa">
        <h3>CLÍNICA BLUYIN</h3>
        <p>Servicios de Arreglos y Confecciones</p>
        <p>89233887-9</p>
        <p>Dirección: Calle Principal, Ciudad</p>
      </div>

      {/* Información del cliente */}
      <div className="factura-cliente-info">
        <div className="info-bloque">
          <strong>Cliente:</strong>
          <p>{facturaData.cliente_nombre || 'No especificado'}</p>
          <p>Cédula: {facturaData.cliente_cedula || 'N/A'}</p>
          <p>Teléfono: {facturaData.cliente_telefono || 'N/A'}</p>
          <p>Email: {facturaData.cliente_email || 'N/A'}</p>
        </div>

        <div className="info-bloque">
          <strong>Fechas:</strong>
          <p>Fecha Pedido: {facturaData.fecha_pedido ? new Date(facturaData.fecha_pedido).toLocaleDateString('es-CO') : 'N/A'}</p>
          <p>Fecha Entrega: {facturaData.fecha_entrega ? new Date(facturaData.fecha_entrega).toLocaleDateString('es-CO') : 'N/A'}</p>
        </div>
      </div>

      {/* Tabla de prendas */}
      <div className="table-responsive-container">
        <table className="factura-tabla">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Valor Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {facturaData.prendas && Array.isArray(facturaData.prendas) && facturaData.prendas.length > 0 ? (
              facturaData.prendas.map((prenda, idx) => (
                <tr key={idx}>
                  <td>
                    <strong>{prenda.tipo || 'Prenda'}</strong>
                    <div className="prenda-arreglos">
                      {prenda.arreglos && Array.isArray(prenda.arreglos) && prenda.arreglos.length > 0 ? (
                        prenda.arreglos.map((arreglo: any, i: number) => {
                          const nombre = obtenerNombreArreglo(arreglo);
                          return (
                            <div key={i} className="arreglo-item">
                              • {nombre} - {formatCOP(Number(arreglo.precio) || 0)}
                            </div>
                          );
                        })
                      ) : (
                        <div className="arreglo-item">Sin arreglos especificados</div>
                      )}
                    </div>
                  </td>
                  <td className="texto-centro">{prenda.cantidad || 1}</td>
                  <td className="texto-derecha">
                    {formatCOP(calcularPrecioUnitario(prenda))}
                  </td>
                  <td className="texto-derecha">
                    <strong>{formatCOP(calcularSubtotalPrenda(prenda))}</strong>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                  Sin prendas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de totales */}
      <div className="factura-totales">
        <div className="total-fila">
          <span>Subtotal:</span>
          <span>{formatCOP(facturaData.total_pedido || 0)}</span>
        </div>
        <div className="total-fila">
          <span>IVA (0%):</span>
          <span>$0</span>
        </div>
        <div className="total-fila total-principal">
          <span>TOTAL:</span>
          <span>{formatCOP(facturaData.total_pedido || 0)}</span>
        </div>
        <div className="total-fila">
          <span>Abonado:</span>
          <span>{formatCOP(facturaData.abono || 0)}</span>
        </div>
        <div className="total-fila saldo-pendiente">
          <span>Saldo Pendiente:</span>
          <span>{formatCOP(facturaData.saldo || 0)}</span>
        </div>
      </div>

      {/* Pie de página */}
      <div className="factura-footer">
        <p>Gracias por su compra</p>
        <p className="fecha-impresion">
          Impreso: {new Date().toLocaleString('es-CO')}
        </p>
      </div>
    </div>
  );

  // Handler genérico para imprimir desde la vista previa (cliente/bodega/estándar)
  const handleImprimirDesdePreview = async (vista: VistaActual) => {
    const tipo = vista === 'preview-bodega' ? 'bodega' : 'cliente'; // 'cliente' sirve también para la versión estándar
    try {
      setCargando(true);
      setError('');
      await imprimirFactura(facturaData, tipo);
    } catch (err) {
      setError('Error al imprimir la factura');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Handler genérico para descargar desde la vista previa (cliente/bodega/estándar)
  const handleDescargarDesdePreview = async (vista: VistaActual) => {
    const tipo = vista === 'preview-bodega' ? 'bodega' : 'cliente'; // usar 'cliente' para la estándar también
    try {
      setCargando(true);
      setError('');
      await descargarFacturaPDF(facturaData, tipo);
    } catch (err) {
      setError('Error al descargar PDF');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  // Vista de preview con iframe (ahora también para la factura estándar)
  if (vistaActual === 'preview-cliente' || vistaActual === 'preview-bodega' || vistaActual === 'preview-original') {
    const tipoFactura = vistaActual === 'preview-cliente' ? 'Cliente' : vistaActual === 'preview-bodega' ? 'Bodega' : 'Estándar';
    return (
      <div className="facturas-modal-overlay">
        <div className="facturas-modal-preview">
          {/* Header: botones grandes SOLO para Factura Estándar, para Cliente/Bodega usar el header pequeño con cerrar */}
          {vistaActual === 'preview-original' ? (
            <div className="facturas-modal-header preview-header" style={{ display: 'flex', alignItems: 'center' }}>
              {/* Título oculto visualmente pero accesible para lectores de pantalla */}
              <h2 className="sr-only">Vista Previa - Factura #{facturaData.id_pedido}</h2>
              <div className="preview-btns" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                <button className="btn-factura btn-imprimir" onClick={() => handleImprimirDesdePreview(vistaActual)} disabled={cargando}>
                  <FaPrint size={18} style={{ marginRight: 8 }} /> Imprimir
                </button>
                <button className="btn-factura btn-descargar" onClick={() => handleDescargarDesdePreview(vistaActual)} disabled={cargando}>
                  <FaDownload size={18} style={{ marginRight: 8 }} /> Descargar PDF
                </button>
                <button className="btn-factura btn-volver" onClick={handleCerrarPreview}>
                  <FaTimes size={18} style={{ marginRight: 8 }} /> Volver
                </button>
              </div>
            </div>
          ) : (
            <div className="facturas-modal-header">
              <h2>Vista Previa - Factura {tipoFactura} #{facturaData.id_pedido}</h2>
              <button className="facturas-btn-cerrar" onClick={handleCerrarPreview}>
                <FaTimes />
              </button>
            </div>
          )}

          <div className="facturas-preview-content">
            <iframe
              srcDoc={htmlPreview}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '4px'
              }}
              title="Vista previa factura"
            />
          </div>

          {vistaActual !== 'preview-original' && (
            <div className="facturas-modal-footer">
              <button className="facturas-btn-cancelar" onClick={handleCerrarPreview}>
                Cerrar Vista Previa
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista principal: Menú de selección de facturas
  return (
    <div className="facturas-modal-overlay">
      <div className="facturas-modal-container">
        {/* Header */}
        <div className="facturas-modal-header">
          <h2>Gestionar Facturas - Pedido #{facturaData.id_pedido}</h2>
          <button className="facturas-btn-cerrar" onClick={handleCerrar} disabled={cargando}>
            <FaTimes />
          </button>
        </div>

        {/* Contenido */}
        <div className="facturas-modal-body">
          {error && (
            <div className="facturas-error-message">
              {error}
            </div>
          )}

          {/* Factura Original: mostrar SOLO si el pedido está entregado y NO se abrió la vista automáticamente (initialVista) */}
          { (facturaData.estado && facturaData.estado.toString().toLowerCase() === 'entregado' && !initialVista) && (
            <div className="facturas-seccion">
              <div className="facturas-titulo">
                <h3><FaReceipt /> Factura Estándar</h3>
                <p>Factura completa con todos los detalles del pedido</p>
              </div>
              <div className="facturas-botones">
                <button
                  className="facturas-btn-accion facturas-btn-preview"
                  onClick={handleVerPreviewOriginal}
                  disabled={cargando}
                >
                  <FaEye /> Ver Factura
                </button>
              </div>
            </div>
          )}

          {/* Factura Cliente */}
          <div className="facturas-seccion">
            <div className="facturas-titulo">
              <h3><FaFileInvoice /> Factura para el Cliente</h3>
              <p>Descarga o imprime la factura que se entrega al cliente</p>
            </div>
            <div className="facturas-botones">
              <button
                className="facturas-btn-accion facturas-btn-preview"
                onClick={handleVerPreviewCliente}
                disabled={cargando}
              >
                <FaEye /> Ver Previa
              </button>
              <button
                className="facturas-btn-accion facturas-btn-descargar"
                onClick={handleDescargarCliente}
                disabled={cargando}
              >
                <FaDownload /> Descargar PDF
              </button>
              <button
                className="facturas-btn-accion facturas-btn-imprimir"
                onClick={handleImprimirCliente}
                disabled={cargando}
              >
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>

          {/* Factura Bodega */}
          <div className="facturas-seccion">
            <div className="facturas-titulo">
              <h3><FaWarehouse /> Factura de Bodega (Propietarios)</h3>
              <p>Descarga o imprime la factura interna para el control del negocio</p>
            </div>
            <div className="facturas-botones">
              <button
                className="facturas-btn-accion facturas-btn-preview"
                onClick={handleVerPreviewBodega}
                disabled={cargando}
              >
                <FaEye /> Ver Previa
              </button>
              <button
                className="facturas-btn-accion facturas-btn-descargar"
                onClick={handleDescargarBodega}
                disabled={cargando}
              >
                <FaDownload /> Descargar PDF
              </button>
              <button
                className="facturas-btn-accion facturas-btn-imprimir"
                onClick={handleImprimirBodega}
                disabled={cargando}
              >
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="facturas-modal-footer">
          <button
            className="facturas-btn-cancelar"
            onClick={handleCerrar}
            disabled={cargando}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
