import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/modalFactura.css';
import { formatCOP } from '../utils/formatCurrency';

interface FacturaData {
  id_pedido: number;
  cliente_nombre: string;
  cliente_cedula: string;
  cliente_telefono: string;
  cliente_email: string;
  fecha_pedido: string;
  fecha_entrega: string;
  total_pedido: number;
  abono: number;
  saldo: number;
  prendas: any[];
}

interface ModalFacturaProps {
  isOpen: boolean;
  facturaData: FacturaData | null;
  onClose: () => void;
}

export default function ModalFactura({ isOpen, facturaData, onClose }: ModalFacturaProps) {
  const facturaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !facturaData) return null;

  const handleImpimir = () => {
    window.print();
  };

  const handleDescargarPDF = async () => {
    if (!facturaRef.current) return;

    try {
      const element = facturaRef.current;
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
      alert('Error al generar PDF');
    }
  };

  // Calcular totales por prenda
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

  return (
    <div className="modal-overlay">
      <div className="modal-factura">
        {/* Botones de acción */}
        <div className="factura-acciones">
          <button className="btn-primary" onClick={handleImpimir}>
            🖨️ Imprimir
          </button>
          <button className="btn-primary" onClick={handleDescargarPDF}>
            📥 Descargar PDF
          </button>
          <button className="btn-cancelar" onClick={onClose}>
            ❌ Cerrar
          </button>
        </div>

        {/* Contenido de la factura */}
        <div ref={facturaRef} className="factura-contenido">
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
            <p>NIT: 123456789-0</p>
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
                            // Obtener el nombre del arreglo según su tipo
                            let nombre = '';
                            
                            if (arreglo.tipo === 'combinacion') {
                              nombre = arreglo.descripcion_combinacion?.trim() || 
                                       `${arreglo.nombre_ajuste || ''} + ${arreglo.nombre_accion || ''}`.replace(/\s+/g, ' ').trim();
                            } else if (arreglo.tipo === 'ajuste') {
                              nombre = arreglo.nombre_ajuste || arreglo.descripcion_ajuste || 'Ajuste';
                            } else if (arreglo.tipo === 'accion') {
                              nombre = arreglo.nombre_accion || arreglo.descripcion_accion || 'Acción';
                            } else {
                              nombre = arreglo.nombre || arreglo.descripcion || 'Arreglo';
                            }
                            
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
      </div>
    </div>
  );
}