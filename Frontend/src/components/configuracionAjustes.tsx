import React, { useState, useEffect } from 'react';
import '../styles/configuracionAjustes.css';
import '../styles/inputMoneda.css';
import { 
  obtenerAjustes, 
  Ajuste, 
  crearAjuste, 
  actualizarAjuste, 
  eliminarAjuste 
} from '../services/ajustesService';
import { 
  obtenerAcciones, 
  Accion, 
  crearAccion, 
  actualizarAccion, 
  eliminarAccion 
} from '../services/accionesService';
import { obtenerAjustesAccion, crearAjusteAccion, eliminarAjusteAccion, AjusteAccion } from '../services/ajustesAccionService';
import { FaEdit, FaTrash, } from 'react-icons/fa';
import { formatCOP } from '../utils/formatCurrency';
import { InputMoneda } from './InputMoneda';

export default function ConfiguracionAjustes() {
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [combinaciones, setCombinaciones] = useState<AjusteAccion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedAjustes, setSelectedAjustes] = useState<number[]>([]);
  const [selectedAcciones, setSelectedAcciones] = useState<number[]>([]);
  // valor numérico real
  const [precio, setPrecio] = useState<number>(0);
  // valor mostrado en el input (formateado / mientras se escribe)
  const [precioDisplay, setPrecioDisplay] = useState<string>(formatCOP(0));
  const [loading, setLoading] = useState(false);

  // Estados para crear ajustes
  const [showModalAjuste, setShowModalAjuste] = useState(false);
  const [nuevoAjuste, setNuevoAjuste] = useState('');
  const [precioAjuste, setPrecioAjuste] = useState<number>(0);
  const [loadingAjuste, setLoadingAjuste] = useState(false);
  const [editandoAjuste, setEditandoAjuste] = useState<number | null>(null);

  // Estados para crear acciones
  const [showModalAccion, setShowModalAccion] = useState(false);
  const [nuevaAccion, setNuevaAccion] = useState('');
  const [precioAccion, setPrecioAccion] = useState<number>(0);
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [editandoAccion, setEditandoAccion] = useState<number | null>(null);

  const parsePrecio = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return isNaN(v) ? 0 : v;
    const s = String(v).trim();
    if (s === '') return 0;
    const cleaned = s.replace(/[^\d.-]/g, '').replace(/,/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [ajustesData, accionesData, combinacionesData] = await Promise.all([
        obtenerAjustes(),
        obtenerAcciones(),
        obtenerAjustesAccion(),
      ]);
      setAjustes(ajustesData);
      setAcciones(accionesData);
      setCombinaciones(combinacionesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleAjusteChange = (id: number, checked: boolean) => {
    setSelectedAjustes(prev =>
      checked ? [...prev, id] : prev.filter(a => a !== id)
    );
  };

  const handleAccionChange = (id: number, checked: boolean) => {
    setSelectedAcciones(prev =>
      checked ? [...prev, id] : prev.filter(a => a !== id)
    );
  };

  const handleAgregarCombinacion = async () => {
    if (selectedAjustes.length === 0 || selectedAcciones.length === 0 || precio <= 0) {
      alert('Selecciona al menos un ajuste y una acción, e ingresa un precio válido');
      return;
    }

    setLoading(true);
    try {
      const nombresAjustes = selectedAjustes.map(id =>
        ajustes.find(a => a.id_ajuste === id)?.nombre_ajuste
      ).join(' + ');

      const nombresAcciones = selectedAcciones.map(id =>
        acciones.find(a => a.id_accion === id)?.nombre_accion
      ).join(' + ');

      const descripcion = `${nombresAjustes} / ${nombresAcciones}`;

      await crearAjusteAccion(
        selectedAjustes[0],
        selectedAcciones[0],
        precio,
        descripcion
      );

      alert('Combinación agregada correctamente');
      resetModal();
      await cargarDatos();
    } catch (error) {
      console.error('Error al agregar combinación:', error);
      alert('Error al agregar la combinación');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarAjuste = async () => {
    if (nuevoAjuste.trim() === '') {
      alert('Ingresa un nombre para el ajuste');
      return;
    }
    if (precioAjuste <= 0) {
      alert('Ingresa un precio válido para el ajuste');
      return;
    }

    setLoadingAjuste(true);
    try {
      if (editandoAjuste) {
        await actualizarAjuste(editandoAjuste, nuevoAjuste, precioAjuste);
        alert('Ajuste actualizado correctamente');
      } else {
        await crearAjuste(nuevoAjuste, precioAjuste);
        alert('Ajuste creado correctamente');
      }
      setNuevoAjuste('');
      setPrecioAjuste(0);
      setEditandoAjuste(null);
      setShowModalAjuste(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar ajuste:', error);
      alert(`Error al ${editandoAjuste ? 'actualizar' : 'crear'} el ajuste`);
    } finally {
      setLoadingAjuste(false);
    }
  };

  const handleAgregarAccion = async () => {
    if (nuevaAccion.trim() === '') {
      alert('Ingresa un nombre para la acción');
      return;
    }
    if (precioAccion <= 0) {
      alert('Ingresa un precio válido para la acción');
      return;
    }

    setLoadingAccion(true);
    try {
      if (editandoAccion) {
        // Modo edición
        await actualizarAccion(editandoAccion, nuevaAccion, precioAccion);
        alert('Acción actualizada correctamente');
      } else {
        // Modo creación
        await crearAccion(nuevaAccion, precioAccion);
        alert('Acción creada correctamente');
      }
      setNuevaAccion('');
      setPrecioAccion(0);
      setEditandoAccion(null);
      setShowModalAccion(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar acción:', error);
      alert(`Error al ${editandoAccion ? 'actualizar' : 'crear'} la acción`);
    } finally {
      setLoadingAccion(false);
    }
  };

  const handleEditarAjuste = (ajuste: Ajuste) => {
    setEditandoAjuste(ajuste.id_ajuste);
    setNuevoAjuste(ajuste.nombre_ajuste);
    setPrecioAjuste(ajuste.precio_ajuste ?? 0);
    setShowModalAjuste(true);
  };

  const handleEliminarAjuste = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este ajuste?')) {
      try {
        await eliminarAjuste(id);
        alert('Ajuste eliminado correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar ajuste:', error);
        alert('Error al eliminar el ajuste');
      }
    }
  };

  const handleEditarAccion = (accion: Accion) => {
    setEditandoAccion(accion.id_accion);
    setNuevaAccion(accion.nombre_accion);
    setPrecioAccion(accion.precio_acciones ?? 0);
    setShowModalAccion(true);
  };

  const handleEliminarAccion = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta acción?')) {
      try {
        await eliminarAccion(id);
        alert('Acción eliminada correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar la acción:', error);
        alert('Error al eliminar la acción');
      }
    }
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta combinación?')) {
      try {
        await eliminarAjusteAccion(id);
        alert('Combinación eliminada correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la combinación');
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedAjustes([]);
    setSelectedAcciones([]);
    setPrecio(0);
    setPrecioDisplay(formatCOP(0));
  };

  const resetModalAjuste = () => {
    setShowModalAjuste(false);
    setEditandoAjuste(null);
    setNuevoAjuste('');
    setPrecioAjuste(0);
  };

  const resetModalAccion = () => {
    setShowModalAccion(false);
    setEditandoAccion(null);
    setNuevaAccion('');
    setPrecioAccion(0);
  };

  const obtenerNombresCombinacion = (combinacion: AjusteAccion) => {
    return combinacion.descripcion_combinacion || 'Combinación sin descripción';
  };

  return (
    <div className="configuracion-container">
      <div className="header-section">
        <h1>Constructor de Ajustes</h1>
        <button className="btn-agregar" onClick={() => { setSelectedAjustes([]); setSelectedAcciones([]); setPrecio(0); setShowModal(true); }}>
          + Agregar Combinación
        </button>
      </div>

      {/* Sección de Combinaciones */}
      <div className="combinaciones-section">
        <h2>Combinaciones Configuradas</h2>
        {combinaciones.length === 0 ? (
          <div className="empty-state">
            <p>No hay ajustes configurados</p>
            <p>Haz clic en "Agregar combinación" para comenzar</p>
          </div>
        ) : (
          <table className="combinaciones-table">
            <thead>
              <tr>
                <th>Combinación</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {combinaciones.map((comb) => (
                <tr key={comb.id_ajuste_accion}>
                  <td>{obtenerNombresCombinacion(comb)}</td>
                  <td>${Number(comb.precio).toFixed(2)}</td>
                  <td className="actions-cell">
                    <div className="actions-group">
                      <button className="btn-eliminar" onClick={() => handleEliminar(comb.id_ajuste_accion)} title="Eliminar">
                        <FaTrash /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sección de Gestión de Ajustes y Acciones */}
      <div className="gestion-section">
        <div className="gestion-card">
          <h3>Gestión de Ajustes</h3>
          <p>Total: {ajustes.length} ajustes</p>
          <button className="btn-crear" onClick={() => { setEditandoAjuste(null); setNuevoAjuste(''); setShowModalAjuste(true); }}>
            + Nuevo Ajuste
          </button>
          <div className="lista-items">
            {ajustes.map((ajuste) => (
              <div key={ajuste.id_ajuste} className="item-badge-container">
                <div className="item-badge">
                  {ajuste.nombre_ajuste}
                </div>
                <div className="item-actions">
                  <button className="btn-item-edit" onClick={() => handleEditarAjuste(ajuste)} title="Editar"> <FaEdit /></button>
                  <button className="btn-item-delete" onClick={() => handleEliminarAjuste(ajuste.id_ajuste)} title="Eliminar"> <FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gestion-card">
          <h3>Gestión de Acciones</h3>
          <p>Total: {acciones.length} acciones</p>
          <button className="btn-crear" onClick={() => { setEditandoAccion(null); setNuevaAccion(''); setShowModalAccion(true); }}>
            + Nueva Acción
          </button>
          <div className="lista-items">
            {acciones.map((accion) => (
              <div key={accion.id_accion} className="item-badge-container">
                <div className="item-badge">
                  {accion.nombre_accion}
                </div>
                <div className="item-actions">
                  <button className="btn-item-edit" onClick={() => handleEditarAccion(accion)} title="Editar"> <FaEdit /></button>
                  <button className="btn-item-delete" onClick={() => handleEliminarAccion(accion.id_accion)} title="Eliminar"><FaTrash /> </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Combinaciones */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Nueva Combinación de Ajuste</h2>
              <button className="btn-close" onClick={resetModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="selectors-container">
                <div className="selector-group">
                  <h3>Ajustes ({selectedAjustes.length} seleccionados)</h3>
                  <div className="checkboxes-list">
                    {ajustes.map((ajuste) => (
                      <label key={ajuste.id_ajuste} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedAjustes.includes(ajuste.id_ajuste)}
                          onChange={(e) =>
                            handleAjusteChange(ajuste.id_ajuste, e.target.checked)
                          }
                        />
                        <span>{ajuste.nombre_ajuste}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="selector-group">
                  <h3>Acciones ({selectedAcciones.length} seleccionadas)</h3>
                  <div className="checkboxes-list">
                    {acciones.map((accion) => (
                      <label key={accion.id_accion} className="checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedAcciones.includes(accion.id_accion)}
                          onChange={(e) =>
                            handleAccionChange(accion.id_accion, e.target.checked)
                          }
                        />
                        <span>{accion.nombre_accion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="precio-section">
                <label htmlFor="precio">Precio para todas las combinaciones *</label>
                <InputMoneda
                  value={precio}
                  onChange={(valor) => setPrecio(valor)}
                  placeholder="Ingrese el precio"
                />
              </div>

              <div className="resumen-section">
                <h4>Resumen de selecciones:</h4>
                <p>Ajustes seleccionados: {selectedAjustes.length}</p>
                <p>Acciones seleccionadas: {selectedAcciones.length}</p>
                <p>Combinaciones a crear: 1</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={resetModal}>
                Cancelar
              </button>
              <button
                className="btn-agregar-modal"
                onClick={handleAgregarCombinacion}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Agregar 1 Combinación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Ajuste */}
      {showModalAjuste && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h2>{editandoAjuste ? 'Editar Ajuste' : 'Crear Nuevo Ajuste'}</h2>
              <button className="btn-close" onClick={resetModalAjuste}>×</button>
            </div>

            <div className="modal-body">
              <label htmlFor="nombreAjuste">Nombre del Ajuste *</label>
              <input
                id="nombreAjuste"
                type="text"
                value={nuevoAjuste}
                onChange={(e) => setNuevoAjuste(e.target.value)}
                placeholder="Ej: Color Azul"
                onKeyPress={(e) => e.key === 'Enter' && handleAgregarAjuste()}
              />
              <label htmlFor="precioAjuste">Precio *</label>
              <InputMoneda
                value={precioAjuste}
                onChange={(valor) => setPrecioAjuste(valor)}
                placeholder="Ingrese el precio del ajuste"
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={resetModalAjuste}>
                Cancelar
              </button>
              <button
                className="btn-agregar-modal"
                onClick={handleAgregarAjuste}
                disabled={loadingAjuste}
              >
                {loadingAjuste ? 'Procesando...' : (editandoAjuste ? 'Guardar Cambios' : 'Crear Ajuste')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Acción */}
      {showModalAccion && (
        <div className="modal-overlay">
          <div className="modal-content modal-small">
            <div className="modal-header">
              <h2>{editandoAccion ? 'Editar Acción' : 'Crear Nueva Acción'}</h2>
              <button className="btn-close" onClick={resetModalAccion}>×</button>
            </div>

            <div className="modal-body">
              <label htmlFor="nombreAccion">Nombre de la Acción *</label>
              <input
                id="nombreAccion"
                type="text"
                value={nuevaAccion}
                onChange={(e) => setNuevaAccion(e.target.value)}
                placeholder="Ej: Envío Gratis"
                onKeyPress={(e) => e.key === 'Enter' && handleAgregarAccion()}
              />
              <label htmlFor="precioAccion">Precio *</label>
              <InputMoneda
                value={precioAccion}
                onChange={(valor) => setPrecioAccion(valor)}
                placeholder="Ingrese el precio de la acción"
              />
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={resetModalAccion}>
                Cancelar
              </button>
              <button
                className="btn-agregar-modal"
                onClick={handleAgregarAccion}
                disabled={loadingAccion}
              >
                {loadingAccion ? 'Procesando...' : (editandoAccion ? 'Guardar Cambios' : 'Crear Acción')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}