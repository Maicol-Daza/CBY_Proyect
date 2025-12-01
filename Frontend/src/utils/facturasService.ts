import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCOP } from './formatCurrency';

export interface FacturaData {
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
  nombre_cajon?: string;
  id_cajon?: number;
}

interface ArregloItem {
  tipo?: string;
  descripcion_combinacion?: string;
  nombre_ajuste?: string;
  nombre_accion?: string;
  descripcion_ajuste?: string;
  descripcion_accion?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
}

/**
 * Obtiene el nombre formateado del arreglo según su tipo
 */
const obtenerNombreArreglo = (arreglo: ArregloItem): string => {
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

/**
 * Calcula el subtotal de una prenda
 */
const calcularSubtotalPrenda = (prenda: any): number => {
  if (!prenda.arreglos || prenda.arreglos.length === 0) return 0;
  const precioTotal = prenda.arreglos.reduce(
    (total: number, arreglo: any) => total + (Number(arreglo.precio) || 0),
    0
  );
  return precioTotal * (prenda.cantidad || 1);
};

/**
 * Calcula el precio unitario de una prenda
 */
const calcularPrecioUnitario = (prenda: any): number => {
  if (!prenda.arreglos || prenda.arreglos.length === 0) return 0;
  return prenda.arreglos.reduce(
    (total: number, arreglo: any) => total + (Number(arreglo.precio) || 0),
    0
  );
};

/**
 * Genera el HTML de la factura (cliente o bodega)
 */
export const generarHTMLFactura = (data: FacturaData, tipo: 'cliente' | 'bodega'): string => {
  const fechaPedido = data.fecha_pedido ? new Date(data.fecha_pedido).toLocaleDateString('es-CO') : 'N/A';
  const fechaEntrega = data.fecha_entrega ? new Date(data.fecha_entrega).toLocaleDateString('es-CO') : 'N/A';
  
  const prendas = data.prendas && Array.isArray(data.prendas) ? data.prendas : [];
  
  const filasArreglos = prendas && prendas.length > 0 ? prendas.map((prenda, idx) => {
    const arreglosHTML = prenda.arreglos && Array.isArray(prenda.arreglos) && prenda.arreglos.length > 0
      ? prenda.arreglos
          .map((arreglo: any) => {
            const nombre = obtenerNombreArreglo(arreglo);
            return `<div class="arreglo-item">• ${nombre} - ${formatCOP(Number(arreglo.precio) || 0)}</div>`;
          })
          .join('')
      : '<div class="arreglo-item" style="color: #999;">Sin arreglos especificados</div>';

    const precioUnitario = calcularPrecioUnitario(prenda);
    const subtotal = calcularSubtotalPrenda(prenda);
    const cantidad = prenda.cantidad || 1;

    return `
      <tr>
        <td class="descripcion-col">
          <div class="prenda-nombre">${prenda.tipo || prenda.descripcion || 'Prenda sin descripción'}</div>
          <div>${arreglosHTML}</div>
        </td>
        <td class="cantidad-col">${cantidad}</td>
        <td class="precio-col">${formatCOP(precioUnitario)}</td>
        <td class="subtotal-col">${formatCOP(subtotal)}</td>
      </tr>
    `;
  }).join('') : '';

  const tipoFacturaTexto = tipo === 'cliente' ? 'FACTURA DE CLIENTE' : 'FACTURA DE BODEGA/PROPIETARIOS';
  const clienteSection = tipo === 'cliente' 
    ? `
      <div class="info-cliente">
        <h4>INFORMACIÓN DEL CLIENTE</h4>
        <p><strong>Nombre:</strong> ${data.cliente_nombre || 'No especificado'}</p>
        <p><strong>Cédula:</strong> ${data.cliente_cedula || 'N/A'}</p>
        <p><strong>Teléfono:</strong> ${data.cliente_telefono || 'N/A'}</p>
        <p><strong>Email:</strong> ${data.cliente_email || 'N/A'}</p>
      </div>
    `
    : `
      <div class="info-cliente" style="border-left-color: #ff9800; background-color: #fff3cd;">
        <h4>INFORMACIÓN INTERNA (BODEGA)</h4>
        <p><strong>Cliente:</strong> ${data.cliente_nombre || 'No especificado'}</p>
        <p><strong>Cédula:</strong> ${data.cliente_cedula || 'N/A'}</p>
        <p><strong>Cajón:</strong> ${data.nombre_cajon || `#${data.id_cajon || 'N/A'}`}</p>
      </div>
    `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          padding: 15px;
          background-color: white;
          line-height: 1.4;
        }
        .factura-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          color: #333;
        }
        .factura-header {
          text-align: center;
          margin-bottom: 25px;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 15px;
        }
        .factura-header h1 {
          margin: 0 0 10px 0;
          font-size: 26px;
          color: #1976d2;
          text-transform: uppercase;
        }
        .factura-header p {
          margin: 3px 0;
          color: #666;
          font-size: 13px;
        }
        .factura-numero {
          font-size: 13px;
          margin-top: 8px;
          color: #666;
        }
        .factura-empresa {
          margin-bottom: 20px;
          padding: 12px;
          background-color: #f5f5f5;
          border-radius: 4px;
          text-align: center;
        }
        .factura-empresa h3 {
          margin: 0 0 8px 0;
          color: #1976d2;
          font-size: 16px;
        }
        .factura-empresa p {
          margin: 3px 0;
          font-size: 12px;
          color: #666;
        }
        .factura-fechas {
          margin: 15px 0;
          padding: 12px;
          background-color: #ecf0f1;
          border-radius: 4px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          font-size: 13px;
        }
        .factura-fechas strong {
          display: block;
          margin-bottom: 4px;
          color: #333;
          font-weight: bold;
        }
        .factura-fechas p {
          margin: 0;
          color: #666;
        }
        .info-cliente {
          margin-bottom: 20px;
          padding: 12px;
          background-color: #f9f9f9;
          border-left: 4px solid #1976d2;
          border-radius: 4px;
        }
        .info-cliente h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #333;
        }
        .info-cliente p {
          margin: 3px 0;
          font-size: 12px;
          color: #666;
        }
        table {
          width: 100%;
          margin: 20px 0;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #1976d2;
          color: white;
          padding: 10px;
          text-align: left;
          font-weight: bold;
          font-size: 13px;
          border: 1px solid #1565c0;
        }
        td {
          padding: 8px 10px;
          border: 1px solid #e0e0e0;
          vertical-align: top;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .descripcion-col {
          text-align: left;
          width: 50%;
        }
        .cantidad-col {
          text-align: center;
          width: 12%;
        }
        .precio-col {
          text-align: right;
          width: 19%;
        }
        .subtotal-col {
          text-align: right;
          width: 19%;
        }
        .prenda-nombre {
          font-weight: bold;
          margin-bottom: 3px;
        }
        .arreglo-item {
          margin: 2px 0;
          color: #555;
          font-size: 11px;
          padding-left: 10px;
        }
        .sin-prendas {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }
        .totales {
          margin-top: 20px;
          padding: 15px;
          background-color: #f5f5f5;
          border-radius: 4px;
          font-size: 13px;
        }
        .total-fila {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #ddd;
        }
        .total-fila span:first-child {
          text-align: left;
        }
        .total-fila span:last-child {
          text-align: right;
          min-width: 100px;
        }
        .total-fila.total-principal {
          border: none;
          font-size: 15px;
          font-weight: bold;
          padding: 10px 0;
          margin-top: 8px;
          border-top: 2px solid #1976d2;
          color: #1976d2;
        }
        .total-fila.saldo-pendiente {
          background-color: #ffebee;
          padding: 8px;
          margin-top: 8px;
          border-radius: 3px;
          border: 1px solid #ef5350;
          font-weight: bold;
          color: #c62828;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #ddd;
          color: #999;
          font-size: 11px;
        }
        .tipo-factura {
          text-align: center;
          background-color: #e3f2fd;
          padding: 8px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-weight: bold;
          color: #1976d2;
          font-size: 13px;
        }
        @media print {
          body {
            padding: 0;
          }
          .factura-container {
            border: none;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="factura-container">
        <div class="tipo-factura">${tipoFacturaTexto}</div>

        <div class="factura-header">
          <h1>FACTURA DE VENTA</h1>
          <div class="factura-numero">
            <strong>Factura #:</strong> ${data.id_pedido}
          </div>
        </div>

        <div class="factura-empresa">
          <h3>CLÍNICA BLUYIN</h3>
          <p>Servicios de Arreglos y Confecciones</p>
          <p>NIT: 123456789-0</p>
          <p>Dirección: Calle Principal, Ciudad</p>
        </div>

        <div class="factura-fechas">
          <div>
            <strong>Fecha Pedido:</strong>
            <p>${fechaPedido}</p>
          </div>
          <div>
            <strong>Fecha Entrega:</strong>
            <p>${fechaEntrega}</p>
          </div>
        </div>

        ${clienteSection}

        <table>
          <thead>
            <tr>
              <th class="descripcion-col">Descripción</th>
              <th class="cantidad-col">Cantidad</th>
              <th class="precio-col">Valor Unitario</th>
              <th class="subtotal-col">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${filasArreglos ? filasArreglos : '<tr><td colspan="4" class="sin-prendas">Sin prendas registradas</td></tr>'}
          </tbody>
        </table>

        <div class="totales">
          <div class="total-fila">
            <span>Subtotal:</span>
            <span>${formatCOP(data.total_pedido || 0)}</span>
          </div>
          <div class="total-fila">
            <span>IVA (0%):</span>
            <span>$0</span>
          </div>
          <div class="total-fila total-principal">
            <span>TOTAL:</span>
            <span>${formatCOP(data.total_pedido || 0)}</span>
          </div>
          <div class="total-fila">
            <span>Abonado:</span>
            <span>${formatCOP(data.abono || 0)}</span>
          </div>
          <div class="total-fila saldo-pendiente">
            <span>Saldo Pendiente:</span>
            <span>${formatCOP(data.saldo || 0)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por su compra</p>
          <p>Impreso: ${new Date().toLocaleString('es-CO')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Descarga una factura como PDF
 */
export const descargarFacturaPDF = async (data: FacturaData, tipo: 'cliente' | 'bodega'): Promise<void> => {
  try {
    const html = generarHTMLFactura(data, tipo);
    
    // Crear div temporal
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-10000px';
    tempDiv.style.top = '-10000px';
    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      backgroundColor: '#fff',
      useCORS: true,
      allowTaint: true,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight
    });

    document.body.removeChild(tempDiv);

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

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const tipoNombre = tipo === 'cliente' ? 'Cliente' : 'Bodega';
    pdf.save(`Factura_${tipoNombre}_${data.id_pedido}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error(`Error al generar PDF de la factura (${tipo})`);
  }
};

/**
 * Imprime una factura
 */
export const imprimirFactura = async (data: FacturaData, tipo: 'cliente' | 'bodega'): Promise<void> => {
  try {
    const html = generarHTMLFactura(data, tipo);
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('No se pudo abrir la ventana de impresión');
    }

    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  } catch (error) {
    console.error('Error imprimiendo factura:', error);
    throw new Error(`Error al imprimir factura (${tipo})`);
  }
};
