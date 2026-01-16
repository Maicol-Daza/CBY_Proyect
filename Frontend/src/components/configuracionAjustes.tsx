import React, { useState, useEffect } from 'react';
import { useAlert } from '../context/AlertContext';
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
import { obtenerAjustesAccion, crearAjusteAccion, actualizarAjusteAccion, eliminarAjusteAccion, AjusteAccion } from '../services/ajustesAccionService';
import { FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { formatCOP } from '../utils/formatCurrency';
import { InputMoneda } from './InputMoneda';
import { useDataRefresh } from '../hooks/useDataRefresh';
import { DATA_EVENTS } from '../utils/eventEmitter';

export default function ConfiguracionAjustes() {
  const { success, error: showError, warning } = useAlert();
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

  // Estado para editar combinaciones
  const [editandoCombinacion, setEditandoCombinacion] = useState<number | null>(null);

  // Estados para búsqueda/filtro
  const [busquedaAjuste, setBusquedaAjuste] = useState('');
  const [busquedaAccion, setBusquedaAccion] = useState('');
  // Estado para búsqueda de combinaciones
  const [busquedaCombinacion, setBusquedaCombinacion] = useState('');

  // Función para obtener nombres de la combinación (debe ir antes de usarla)
  const obtenerNombresCombinacion = (combinacion: AjusteAccion) => {
    return combinacion.descripcion_combinacion || 'Combinación sin descripción';
  };

  // Filtrar ajustes y acciones
  const ajustesFiltrados = ajustes.filter(ajuste =>
    ajuste.nombre_ajuste.toLowerCase().includes(busquedaAjuste.toLowerCase())
  );
  const accionesFiltradas = acciones.filter(accion =>
    accion.nombre_accion.toLowerCase().includes(busquedaAccion.toLowerCase())
  );
  // Filtrar combinaciones
  const combinacionesFiltradas = combinaciones.filter(comb => {
    const descripcion = obtenerNombresCombinacion(comb).toLowerCase();
    return descripcion.includes(busquedaCombinacion.toLowerCase());
  });

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

  // Suscribirse a eventos de actualización de ajustes, acciones y combinaciones
  useDataRefresh(
    [
      DATA_EVENTS.AJUSTES_UPDATED,
      DATA_EVENTS.ACCIONES_UPDATED,
      DATA_EVENTS.COMBINACIONES_UPDATED
    ],
    () => {
      cargarDatos();
    }
  );

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
      warning('Selecciona al menos un ajuste y una acción, e ingresa un precio válido');
      return;
    }

    // Validar límite máximo de selecciones
    if (selectedAjustes.length > 13 || selectedAcciones.length > 13) {
      warning('Solo puedes seleccionar un máximo de 13 ajustes y 13 acciones por combinación');
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

      if (editandoCombinacion) {
        // Modo edición
        await actualizarAjusteAccion(
          editandoCombinacion,
          selectedAjustes[0],
          selectedAcciones[0],
          precio,
          descripcion
        );
        success('Combinación actualizada correctamente');
      } else {
        // Modo creación
        await crearAjusteAccion(
          selectedAjustes[0],
          selectedAcciones[0],
          precio,
          descripcion
        );
        success('Combinación agregada correctamente');
      }

      resetModal();
      await cargarDatos();
    } catch (error) {
      console.error('Error al procesar combinación:', error);
      showError(`Error al ${editandoCombinacion ? 'actualizar' : 'agregar'} la combinación`);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarAjuste = async () => {
    if (nuevoAjuste.trim() === '') {
      warning('Ingresa un nombre para el ajuste');
      return;
    }
    if (precioAjuste <= 0) {
      warning('Ingresa un precio válido para el ajuste');
      return;
    }

    setLoadingAjuste(true);
    try {
      if (editandoAjuste) {
        await actualizarAjuste(editandoAjuste, nuevoAjuste, precioAjuste);
        success('Ajuste actualizado correctamente');
      } else {
        await crearAjuste(nuevoAjuste, precioAjuste);
        success('Ajuste creado correctamente');
      }
      setNuevoAjuste('');
      setPrecioAjuste(0);
      setEditandoAjuste(null);
      setShowModalAjuste(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar ajuste:', error);
      showError(`Error al ${editandoAjuste ? 'actualizar' : 'crear'} el ajuste`);
    } finally {
      setLoadingAjuste(false);
    }
  };

  const handleAgregarAccion = async () => {
    if (nuevaAccion.trim() === '') {
      warning('Ingresa un nombre para la acción');
      return;
    }
    if (precioAccion <= 0) {
      warning('Ingresa un precio válido para la acción');
      return;
    }

    setLoadingAccion(true);
    try {
      if (editandoAccion) {
        // Modo edición
        await actualizarAccion(editandoAccion, nuevaAccion, precioAccion);
        success('Acción actualizada correctamente');
      } else {
        // Modo creación
        await crearAccion(nuevaAccion, precioAccion);
        success('Acción creada correctamente');
      }
      setNuevaAccion('');
      setPrecioAccion(0);
      setEditandoAccion(null);
      setShowModalAccion(false);
      await cargarDatos();
    } catch (error) {
      console.error('Error al guardar acción:', error);
      showError(`Error al ${editandoAccion ? 'actualizar' : 'crear'} la acción`);
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
        success('Ajuste eliminado correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar ajuste:', error);
        showError('Error al eliminar el ajuste');
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
        success('Acción eliminada correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar la acción:', error);
        showError('Error al eliminar la acción');
      }
    }
  };

  const handleEditarCombinacion = (combinacion: AjusteAccion) => {
    setEditandoCombinacion(combinacion.id_ajuste_accion);
    
    // Parsear la descripción para obtener todos los ajustes y acciones
    const descripcion = combinacion.descripcion_combinacion || '';
    const [partAjustes, partAcciones] = descripcion.split(' / ');
    
    // Extraer nombres de ajustes
    const nombresAjustes = partAjustes ? partAjustes.split(' + ').map(n => n.trim()) : [];
    const idsAjustes = nombresAjustes
      .map(nombre => ajustes.find(a => a.nombre_ajuste === nombre)?.id_ajuste)
      .filter((id): id is number => id !== undefined);
    
    // Extraer nombres de acciones
    const nombresAcciones = partAcciones ? partAcciones.split(' + ').map(n => n.trim()) : [];
    const idsAcciones = nombresAcciones
      .map(nombre => acciones.find(a => a.nombre_accion === nombre)?.id_accion)
      .filter((id): id is number => id !== undefined);
    
    setSelectedAjustes(idsAjustes.length > 0 ? idsAjustes : [combinacion.id_ajuste]);
    setSelectedAcciones(idsAcciones.length > 0 ? idsAcciones : [combinacion.id_accion]);
    setPrecio(Number(combinacion.precio));
    setPrecioDisplay(formatCOP(Number(combinacion.precio)));
    setShowModal(true);
  };

  const handleEliminar = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta combinación?')) {
      try {
        await eliminarAjusteAccion(id);
        success('Combinación eliminada correctamente');
        await cargarDatos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        showError('Error al eliminar la combinación');
      }
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditandoCombinacion(null);
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

  // ...existing code...

  return (
    <div className="configuracion-container">
      <div className="caja-header">
        <h1>Constructor de Ajustes</h1>
        <button className="btn-nuevo" onClick={() => { setEditandoCombinacion(null); setSelectedAjustes([]); setSelectedAcciones([]); setPrecio(0); setShowModal(true); }}>
          + Agregar Combinación
        </button>
      </div>

      {/* Sección de Combinaciones */}
      <div className="combinaciones-section">
        <h2>Combinaciones Configuradas</h2>
        <div className="search-filter" style={{ marginBottom: '1rem', maxWidth: 400 }}>
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar combinación..."
            value={busquedaCombinacion}
            onChange={e => setBusquedaCombinacion(e.target.value)}
            className="search-input"
            style={{ width: '100%' }}
          />
        </div>
        {combinacionesFiltradas.length === 0 ? (
          <div className="cfg-empty-state">
            <p>No hay combinaciones configuradas</p>
            <p>Haz clic en "Agregar combinación" para comenzar</p>
          </div>
        ) : (
          <div className="table-responsive-container" style={{overflowX: 'auto', maxWidth: '100%', padding: 0, border: '1.5px solid #d1d5db', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', background: '#fff'}}>
            <table className="combinaciones-table" style={{minWidth: 500, borderCollapse: 'separate', borderSpacing: 0, width: '100%', border: 'none', boxShadow: 'none', background: 'transparent'}}>
              <thead style={{background: '#f5f5f5'}}>
                <tr>
                  <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Combinación</th>
                  <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Precio</th>
                  <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '2px solid #e0e0e0'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {combinacionesFiltradas.map((comb, idx) => (
                  <tr key={comb.id_ajuste_accion} style={{background: idx % 2 === 0 ? '#fff' : '#f9f9f9'}}>
                    <td style={{padding: '10px 16px', borderBottom: '1px solid #ececec'}}>{obtenerNombresCombinacion(comb)}</td>
                    <td style={{padding: '10px 16px', borderBottom: '1px solid #ececec'}}>{formatCOP(Number(comb.precio))}</td>
                    <td className="cfg-actions-cell" style={{padding: '10px 16px', borderBottom: '1px solid #ececec'}}>
                      <div className="cfg-actions-group">
                        <button className="cfg-btn-editar" onClick={() => handleEditarCombinacion(comb)} title="Editar" style={{marginRight: '8px'}}>
                          <FaEdit /> Editar
                        </button>
                        <button className="cfg-btn-eliminar" onClick={() => handleEliminar(comb.id_ajuste_accion)} title="Eliminar">
                          <FaTrash /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="search-filter">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar ajuste..."
              value={busquedaAjuste}
              onChange={(e) => setBusquedaAjuste(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="lista-items">
            {ajustesFiltrados.map((ajuste) => (
              <div key={ajuste.id_ajuste} className="item-badge-container">
                <div className="item-badge">
                  {ajuste.nombre_ajuste}
                  <span className="item-price">{formatCOP(ajuste.precio_ajuste ?? 0)}</span>
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
          <div className="search-filter">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar acción..."
              value={busquedaAccion}
              onChange={(e) => setBusquedaAccion(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="lista-items">
            {accionesFiltradas.map((accion) => (
              <div key={accion.id_accion} className="item-badge-container">
                <div className="item-badge">
                  {accion.nombre_accion}
                  <span className="item-price">{formatCOP(accion.precio_acciones ?? 0)}</span>
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
        <div className="cfg-modal-overlay">
          <div className="cfg-modal-content cfg-modal-lg">
            {/* HEADER CONSISTENTE CON DETALLE DE PEDIDO */}
            <div className="modal-header-consistente">
              <span className="modal-title-consistente">{editandoCombinacion ? 'Editar Combinación de Ajuste' : 'Nueva Combinación de Ajuste'}</span>
              <button className="modal-close-consistente" onClick={resetModal} aria-label="Cerrar">×</button>
            </div>

            <div className="cfg-modal-body">
              <div className="cfg-selectors-container">
                <div className="cfg-selector-group">
                  <h3>Ajustes ({selectedAjustes.length} seleccionados)</h3>
                  <div className="cfg-checkboxes-list">
                    {ajustes.map((ajuste) => (
                      <label key={ajuste.id_ajuste} className="cfg-checkbox-item">
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

                <div className="cfg-selector-group">
                  <h3>Acciones ({selectedAcciones.length} seleccionadas)</h3>
                  <div className="cfg-checkboxes-list">
                    {acciones.map((accion) => (
                      <label key={accion.id_accion} className="cfg-checkbox-item">
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

              <div className="cfg-precio-section">
                <label htmlFor="precio">Precio para todas las combinaciones *</label>
                <InputMoneda
                  value={precio}
                  onChange={(valor) => setPrecio(valor)}
                  placeholder="Ingrese el precio"
                />
              </div>

              <div className="cfg-resumen-section">
                <h4>Resumen de selecciones:</h4>
                <p>Ajustes seleccionados: {selectedAjustes.length}</p>
                <p>Acciones seleccionadas: {selectedAcciones.length}</p>
                <p>Combinaciones a crear: 1</p>
              </div>
            </div>

            <div className="cfg-modal-footer">
              <button className="cfg-btn-cancelar" onClick={resetModal}>
                Cancelar
              </button>
              <button
                className="cfg-btn-primary"
                onClick={handleAgregarCombinacion}
                disabled={loading}
              >
                {loading ? 'Procesando...' : (editandoCombinacion ? 'Actualizar Combinación' : 'Agregar 1 Combinación')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Ajuste */}
      {showModalAjuste && (
        <div className="cfg-modal-overlay">
          <div className="cfg-modal-content cfg-modal-sm">
            <div className="cfg-modal-header">
              <h2>{editandoAjuste ? 'Editar Ajuste' : 'Crear Nuevo Ajuste'}</h2>
              <button className="cfg-btn-close" onClick={resetModalAjuste}>×</button>
            </div>

            <div className="cfg-modal-body">
              <div className="cfg-form-group">
                <label htmlFor="nombreAjuste">Nombre del Ajuste *</label>
                <input
                  id="nombreAjuste"
                  type="text"
                  value={nuevoAjuste}
                  onChange={(e) => setNuevoAjuste(e.target.value)}
                  placeholder="Ej: Color Azul"
                  onKeyPress={(e) => e.key === 'Enter' && handleAgregarAjuste()}
                />
              </div>
              <div className="cfg-form-group">
                <label htmlFor="precioAjuste">Precio *</label>
                <InputMoneda
                  value={precioAjuste}
                  onChange={(valor) => setPrecioAjuste(valor)}
                  placeholder="Ingrese el precio del ajuste"
                />
              </div>
            </div>

            <div className="cfg-modal-footer">
              <button className="cfg-btn-cancelar" onClick={resetModalAjuste}>
                Cancelar
              </button>
              <button
                className="cfg-btn-primary"
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
        <div className="cfg-modal-overlay">
          <div className="cfg-modal-content cfg-modal-sm">
            <div className="cfg-modal-header">
              <h2>{editandoAccion ? 'Editar Acción' : 'Crear Nueva Acción'}</h2>
              <button className="cfg-btn-close" onClick={resetModalAccion}>×</button>
            </div>

            <div className="cfg-modal-body">
              <div className="cfg-form-group">
                <label htmlFor="nombreAccion">Nombre de la Acción *</label>
                <input
                  id="nombreAccion"
                  type="text"
                  value={nuevaAccion}
                  onChange={(e) => setNuevaAccion(e.target.value)}
                  placeholder="Ej: Envío Gratis"
                  onKeyPress={(e) => e.key === 'Enter' && handleAgregarAccion()}
                />
              </div>
              <div className="cfg-form-group">
                <label htmlFor="precioAccion">Precio *</label>
                <InputMoneda
                  value={precioAccion}
                  onChange={(valor) => setPrecioAccion(valor)}
                  placeholder="Ingrese el precio de la acción"
                />
              </div>
            </div>

            <div className="cfg-modal-footer">
              <button className="cfg-btn-cancelar" onClick={resetModalAccion}>
                Cancelar
              </button>
              <button
                className="cfg-btn-primary"
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