import React, { useState } from 'react';
import '../styles/modalFactura.css';
import { FaPrint, FaDownload, FaTimes, FaEye } from 'react-icons/fa';
import { descargarFacturaPDF, imprimirFactura, generarHTMLFactura, type FacturaData } from '../utils/facturasService';

interface ModalFacturasProps {
  isOpen: boolean;
  facturaData: FacturaData | null;
  onClose: () => void;
}

export default function ModalFacturas({ isOpen, facturaData, onClose }: ModalFacturasProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>('');
  const [vistaPrevia, setVistaPrevia] = useState<{ tipo: 'cliente' | 'bodega', html: string } | null>(null);

  if (!isOpen || !facturaData) return null;

  // Debug: mostrar los datos que se están usando
  console.log('ModalFacturas - Datos de factura:', {
    id_pedido: facturaData.id_pedido,
    cliente: facturaData.cliente_nombre,
    total: facturaData.total_pedido,
    prendas: facturaData.prendas,
    prendasLength: facturaData.prendas ? facturaData.prendas.length : 0
  });

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

  const handleVerPreviewCliente = () => {
    try {
      const html = generarHTMLFactura(facturaData, 'cliente');
      setVistaPrevia({ tipo: 'cliente', html });
    } catch (err) {
      setError('Error al cargar vista previa');
      console.error(err);
    }
  };

  const handleVerPreviewBodega = () => {
    try {
      const html = generarHTMLFactura(facturaData, 'bodega');
      setVistaPrevia({ tipo: 'bodega', html });
    } catch (err) {
      setError('Error al cargar vista previa');
      console.error(err);
    }
  };

  const handleCerrarPreview = () => {
    setVistaPrevia(null);
  };

  // Si hay vista previa, mostrar el modal de preview
  if (vistaPrevia) {
    return (
      <div className="modal-overlay">
        <div className="modal-preview">
          <div className="modal-header">
            <h2>Vista Previa - Factura {vistaPrevia.tipo === 'cliente' ? 'Cliente' : 'Bodega'} #{facturaData.id_pedido}</h2>
            <button className="btn-cerrar" onClick={handleCerrarPreview}>
              <FaTimes />
            </button>
          </div>

          <div className="preview-content">
            <iframe
              srcDoc={vistaPrevia.html}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '4px'
              }}
              title="Vista previa factura"
            />
          </div>

          <div className="modal-footer">
            <button className="btn-cancelar" onClick={handleCerrarPreview}>
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-facturas">
        {/* Header */}
        <div className="modal-header">
          <h2>Gestionar Facturas - Pedido #{facturaData.id_pedido}</h2>
          <button className="btn-cerrar" onClick={onClose} disabled={cargando}>
            <FaTimes />
          </button>
        </div>

        {/* Contenido */}
        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Factura Cliente */}
          <div className="factura-seccion">
            <div className="factura-titulo">
              <h3>📋 Factura para el Cliente</h3>
              <p>Descarga o imprime la factura que se entrega al cliente</p>
            </div>
            <div className="factura-botones">
              <button
                className="btn-accion btn-preview"
                onClick={handleVerPreviewCliente}
                disabled={cargando}
              >
                <FaEye /> Ver Previa
              </button>
              <button
                className="btn-accion btn-descargar"
                onClick={handleDescargarCliente}
                disabled={cargando}
              >
                <FaDownload /> Descargar PDF
              </button>
              <button
                className="btn-accion btn-imprimir"
                onClick={handleImprimirCliente}
                disabled={cargando}
              >
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>

          {/* Factura Bodega */}
          <div className="factura-seccion">
            <div className="factura-titulo">
              <h3>📦 Factura de Bodega (Propietarios)</h3>
              <p>Descarga o imprime la factura interna para el control del negocio</p>
            </div>
            <div className="factura-botones">
              <button
                className="btn-accion btn-preview"
                onClick={handleVerPreviewBodega}
                disabled={cargando}
              >
                <FaEye /> Ver Previa
              </button>
              <button
                className="btn-accion btn-descargar"
                onClick={handleDescargarBodega}
                disabled={cargando}
              >
                <FaDownload /> Descargar PDF
              </button>
              <button
                className="btn-accion btn-imprimir"
                onClick={handleImprimirBodega}
                disabled={cargando}
              >
                <FaPrint /> Imprimir
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancelar"
            onClick={onClose}
            disabled={cargando}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
