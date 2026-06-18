import React, { useEffect, useState } from "react";
import { obtenerCajones, Cajon } from "../services/cajonesService";
import { obtenerCodigosPorCajon, Codigo } from "../services/codigosService";
import { FaBox, FaSearch } from "react-icons/fa";
import "../styles/modalCajonCodigo.css";

interface ModalCajonCodigoProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (cajonId: number, codigosIds: number[], nuevaFechaEntrega?: string) => void;
  cajonInicial?: number | null;
  codigosIniciales?: number[] | null;
}

export const ModalCajonCodigo: React.FC<ModalCajonCodigoProps> = ({
  isOpen,
  onClose,
  onGuardar,
  cajonInicial = null,
  codigosIniciales = null,
}) => {
  const [cajones, setCajones] = useState<Cajon[]>([]);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [cajonSeleccionado, setCajonSeleccionado] = useState<number | null>(cajonInicial);
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<number[]>(codigosIniciales || []);
  const [cargandoCajones, setCargandoCajones] = useState(false);
  const [cargandoCodigos, setCargandoCodigos] = useState(false);
  const [nuevaFechaEntrega, setNuevaFechaEntrega] = useState("");

  useEffect(() => {
    if (isOpen) {
      cargarCajones();
      setCajonSeleccionado(cajonInicial);
      setCodigosSeleccionados(codigosIniciales || []);
    }
  }, [isOpen]);

  useEffect(() => {
    if (cajonSeleccionado) {
      cargarCodigos(cajonSeleccionado);
    } else {
      setCodigos([]);
      setCodigosSeleccionados([]);
    }
  }, [cajonSeleccionado]);

  const cargarCajones = async () => {
    setCargandoCajones(true);
    try {
      const data = await obtenerCajones();
      setCajones(data);
    } catch {
      setCajones([]);
    } finally {
      setCargandoCajones(false);
    }
  };

  const cargarCodigos = async (idCajon: number) => {
    setCargandoCodigos(true);
    try {
      const data = await obtenerCodigosPorCajon(idCajon);
      setCodigos(data);
    } catch {
      setCodigos([]);
    } finally {
      setCargandoCodigos(false);
    }
  };

  const handleGuardar = () => {
    if (cajonSeleccionado && codigosSeleccionados.length > 0) {
      onGuardar(cajonSeleccionado, codigosSeleccionados, nuevaFechaEntrega || undefined);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <button className="modal-close-consistente" onClick={onClose}>&times;</button>
        <h2>
          <FaBox style={{ marginRight: 8 }} /> Seleccionar Cajón y Códigos
        </h2>
        <div className="cajones-section card">
          <h3>Cajones</h3>
          <div className="cajones-grid" style={cargandoCajones ? { opacity: 0.5 } : {}}>
            {cajones.map((cajon) => (
              <div
                key={cajon.id_cajon}
                className={`modal-cajon-codigo__cajon-item${cajonSeleccionado === cajon.id_cajon ? " modal-cajon-codigo__cajon-seleccionado" : ""}${cajon.estado === "ocupado" ? " modal-cajon-codigo__cajon-ocupado" : ""}`}
                onClick={() => cajon.estado !== "ocupado" && setCajonSeleccionado(cajon.id_cajon)}
                style={{ cursor: cajon.estado === "ocupado" ? "not-allowed" : "pointer" }}
              >
                <div>{cajon.nombre_cajon}</div>
              </div>
            ))}
          </div>
        </div>
        {cajonSeleccionado && (
          <div className="codigos-section card">
            <h3>
              <FaSearch style={{ marginRight: 6 }} /> Códigos Disponibles
            </h3>
            <div className="codigos-grid-modal" style={cargandoCodigos ? { opacity: 0.5 } : {}}>
              {codigos.map((codigo) => (
                <label
                  key={codigo.id_codigo}
                  className={`modal-cajon-codigo__codigo-item${codigosSeleccionados.includes(codigo.id_codigo) ? " codigo-seleccionado" : ""}${codigo.estado === "ocupado" ? " codigo-ocupado-disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={codigosSeleccionados.includes(codigo.id_codigo)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCodigosSeleccionados((prev) => [...prev, codigo.id_codigo]);
                      } else {
                        setCodigosSeleccionados((prev) => prev.filter((id) => id !== codigo.id_codigo));
                      }
                    }}
                    disabled={codigo.estado === "ocupado"}
                  />
                  <span>{codigo.codigo_numero}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        {/* Campo de fecha de entrega - obligatorio para nuevo procedimiento gratuito */}
        <div className="card" style={{ marginTop: 16, padding: 12 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#dc2626' }}>
            <FaBox style={{ marginRight: 6 }} /> Nueva Fecha de Entrega *
          </h4>
          <input
            type="date"
            value={nuevaFechaEntrega}
            onChange={(e) => setNuevaFechaEntrega(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.95rem' }}
            min={new Date().toISOString().slice(0, 10)}
          />
          <small style={{ color: '#dc2626', marginTop: 4, display: 'block', fontWeight: 600 }}>
            * Campo obligatorio - Debes seleccionar una fecha para continuar
          </small>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
          <button className="pedidos-btn-primary" onClick={handleGuardar} disabled={!cajonSeleccionado || codigosSeleccionados.length === 0 || !nuevaFechaEntrega}>
            Guardar Selección
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCajonCodigo;
