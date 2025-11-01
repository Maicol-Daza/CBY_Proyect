// src/components/ConfiguracionAjustes.tsx
import { useState, useEffect } from "react";
import "../styles/configuracionAjustes.css";
import { 
  obtenerAjustes, 
  crearAjuste, 
  actualizarAjuste,
  eliminarAjuste,
  type Ajuste 
} from "../services/ajustesService";
import { 
  obtenerAcciones, 
  crearAccion, 
  actualizarAccion,
  eliminarAccion,
  type Accion 
} from "../services/accionesService";
import { 
  obtenerAjustesAccion, 
  crearAjusteAccion, 
  actualizarAjusteAccion,
  eliminarAjusteAccion,
  type AjusteAccion 
} from "../services/ajustesAccionService";

export default function ConfiguracionAjustes() {
  // Estados
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [combinaciones, setCombinaciones] = useState<AjusteAccion[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  // Estados para modales de edición
  const [mostrarModalEditarCombinacion, setMostrarModalEditarCombinacion] = useState(false);
  const [mostrarModalEditarAjuste, setMostrarModalEditarAjuste] = useState(false);
  const [mostrarModalEditarAccion, setMostrarModalEditarAccion] = useState(false);
  
  // Estado para edición
  const [combinacionEditando, setCombinacionEditando] = useState<AjusteAccion | null>(null);
  const [ajusteEditando, setAjusteEditando] = useState<Ajuste | null>(null);
  const [accionEditando, setAccionEditando] = useState<Accion | null>(null);

  // Estado para nueva combinación
  const [nuevaCombinacion, setNuevaCombinacion] = useState({
    id_ajuste: 0,
    id_accion: 0,
    precio: 0
  });

  // Estados para selecciones en el modal (MÚLTIPLES COMBINACIONES)
  const [ajustesSeleccionados, setAjustesSeleccionados] = useState<number[]>([]);
  const [accionesSeleccionadas, setAccionesSeleccionadas] = useState<number[]>([]);

  // Estados para nuevos elementos
  const [nuevoAjuste, setNuevoAjuste] = useState("");
  const [nuevaAccion, setNuevaAccion] = useState("");

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [ajustesData, accionesData, combinacionesData] = await Promise.all([
        obtenerAjustes(),
        obtenerAcciones(),
        obtenerAjustesAccion()
      ]);
      
      setAjustes(ajustesData);
      setAcciones(accionesData);
      setCombinaciones(combinacionesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar los datos de configuración");
    } finally {
      setCargando(false);
    }
  };

  // Manejar selección de ajustes en el modal
  const handleSeleccionarAjuste = (idAjuste: number) => {
    setAjustesSeleccionados(prev => {
      if (prev.includes(idAjuste)) {
        return prev.filter(id => id !== idAjuste);
      } else {
        return [...prev, idAjuste];
      }
    });
  };

  // Manejar selección de acciones en el modal
  const handleSeleccionarAccion = (idAccion: number) => {
    setAccionesSeleccionadas(prev => {
      if (prev.includes(idAccion)) {
        return prev.filter(id => id !== idAccion);
      } else {
        return [...prev, idAccion];
      }
    });
  };

  // Manejar creación de nuevo ajuste
  const handleCrearAjuste = async () => {
    if (!nuevoAjuste.trim()) {
      alert("Por favor ingrese un nombre para el ajuste");
      return;
    }

    try {
      await crearAjuste(nuevoAjuste);
      setNuevoAjuste("");
      cargarDatos();
      alert("Ajuste creado exitosamente");
    } catch (error: any) {
      console.error("Error al crear ajuste:", error);
      if (error.message?.includes('ya existe')) {
        alert("El nombre del ajuste ya existe");
      } else {
        alert("Error al crear el ajuste");
      }
    }
  };

  // Manejar creación de nueva acción
  const handleCrearAccion = async () => {
    if (!nuevaAccion.trim()) {
      alert("Por favor ingrese un nombre para la acción");
      return;
    }

    try {
      await crearAccion(nuevaAccion);
      setNuevaAccion("");
      cargarDatos();
      alert("Acción creada exitosamente");
    } catch (error: any) {
      console.error("Error al crear acción:", error);
      if (error.message?.includes('ya existe')) {
        alert("El nombre de la acción ya existe");
      } else {
        alert("Error al crear la acción");
      }
    }
  };

  // Manejar edición de ajuste
  const handleEditarAjuste = async () => {
    if (!ajusteEditando?.nombre_ajuste.trim()) {
      alert("Por favor ingrese un nombre para el ajuste");
      return;
    }

    try {
      await actualizarAjuste(ajusteEditando.id_ajuste, ajusteEditando.nombre_ajuste);
      setMostrarModalEditarAjuste(false);
      setAjusteEditando(null);
      cargarDatos();
      alert("Ajuste actualizado exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar ajuste:", error);
      alert("Error al actualizar el ajuste");
    }
  };

  // Manejar edición de acción
  const handleEditarAccion = async () => {
    if (!accionEditando?.nombre_accion.trim()) {
      alert("Por favor ingrese un nombre para la acción");
      return;
    }

    try {
      await actualizarAccion(accionEditando.id_accion, accionEditando.nombre_accion);
      setMostrarModalEditarAccion(false);
      setAccionEditando(null);
      cargarDatos();
      alert("Acción actualizada exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar acción:", error);
      alert("Error al actualizar la acción");
    }
  };

  // Manejar edición de combinación
  const handleEditarCombinacion = async () => {
    if (!combinacionEditando) return;

    if (combinacionEditando.precio < 0) {
      alert("El precio no puede ser negativo");
      return;
    }

    try {
      await actualizarAjusteAccion(combinacionEditando.id_ajuste_accion, combinacionEditando.precio);
      setMostrarModalEditarCombinacion(false);
      setCombinacionEditando(null);
      cargarDatos();
      alert("Combinación actualizada exitosamente");
    } catch (error: any) {
      console.error("Error al actualizar combinación:", error);
      alert("Error al actualizar la combinación");
    }
  };

  // Manejar eliminación de ajuste
  const handleEliminarAjuste = async (id: number, nombre: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el ajuste "${nombre}"?`)) {
      return;
    }

    try {
      await eliminarAjuste(id);
      cargarDatos();
      alert("Ajuste eliminado exitosamente");
    } catch (error) {
      console.error("Error al eliminar ajuste:", error);
      alert("Error al eliminar el ajuste");
    }
  };

  // Manejar eliminación de acción
  const handleEliminarAccion = async (id: number, nombre: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar la acción "${nombre}"?`)) {
      return;
    }

    try {
      await eliminarAccion(id);
      cargarDatos();
      alert("Acción eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar acción:", error);
      alert("Error al eliminar la acción");
    }
  };

  // Manejar creación de múltiples combinaciones
  const handleCrearCombinaciones = async () => {
    if (ajustesSeleccionados.length === 0 || accionesSeleccionadas.length === 0) {
      alert("Por favor seleccione al menos un ajuste y una acción");
      return;
    }

    if (nuevaCombinacion.precio < 0) {
      alert("El precio no puede ser negativo");
      return;
    }

    try {
      // Crear todas las combinaciones seleccionadas
      const promesas = [];
      for (const idAjuste of ajustesSeleccionados) {
        for (const idAccion of accionesSeleccionadas) {
          promesas.push(
            crearAjusteAccion(idAjuste, idAccion, nuevaCombinacion.precio)
          );
        }
      }

      await Promise.all(promesas);
      
      // Resetear estados
      setAjustesSeleccionados([]);
      setAccionesSeleccionadas([]);
      setNuevaCombinacion({ id_ajuste: 0, id_accion: 0, precio: 0 });
      setMostrarModal(false);
      
      // Recargar datos
      cargarDatos();
      alert(`Se crearon ${promesas.length} combinaciones exitosamente`);
    } catch (error: any) {
      console.error("Error al crear combinaciones:", error);
      if (error.message?.includes('ya existe')) {
        alert("Algunas combinaciones ya existen y no se pudieron crear");
      } else {
        alert("Error al crear las combinaciones");
      }
    }
  };

  // Manejar eliminación de combinación
  const handleEliminarCombinacion = async (id: number) => {
    if (!confirm("¿Está seguro de que desea eliminar esta combinación?")) {
      return;
    }

    try {
      await eliminarAjusteAccion(id);
      cargarDatos();
      alert("Combinación eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar combinación:", error);
      alert("Error al eliminar la combinación");
    }
  };

  // Agrupar ajustes por categoría
  const agruparAjustes = () => {
    return [
      {
        nombre: "Elementos de la Prenda",
        ajustes: ajustes.filter(a => 
          !a.nombre_ajuste.includes('(menos)') && 
          !a.nombre_ajuste.includes('Zig-Zag') &&
          !a.nombre_ajuste.includes('Coser') &&
          !a.nombre_ajuste.includes('Adapíá') &&
          !a.nombre_ajuste.includes('mano')
        )
      },
      {
        nombre: "Técnicas de Ajuste",
        ajustes: ajustes.filter(a => 
          a.nombre_ajuste.includes('(menos)') || 
          a.nombre_ajuste.includes('Zig-Zag') ||
          a.nombre_ajuste.includes('Coser') ||
          a.nombre_ajuste.includes('Adapíá') ||
          a.nombre_ajuste.includes('mano')
        )
      }
    ];
  };

  // Agrupar acciones por categoría
  const agruparAcciones = () => {
    return [
      {
        nombre: "Acciones Principales",
        acciones: acciones
      }
    ];
  };

  return (
    <div className="configuracion-ajustes">
      <div className="configuracion-header">
        <h1>Constructor de Ajustes - Pantalin</h1>
        <button 
          className="btn-primary"
          onClick={() => setMostrarModal(true)}
        >
          Agregar Combinación
        </button>
      </div>

      {/* Lista de combinaciones existentes */}
      <div className="combinaciones-section card">
        <h2>Combinaciones Configuradas</h2>
        
        {cargando ? (
          <div className="cargando">Cargando combinaciones...</div>
        ) : combinaciones.length === 0 ? (
          <div className="sin-combinaciones">
            <p>No hay ajustes configurados</p>
            <p>Haga clic en "Agregar Combinación" para comenzar</p>
          </div>
        ) : (
          <div className="combinaciones-list">
            <table className="combinaciones-table">
              <thead>
                <tr>
                  <th>Ajuste</th>
                  <th>Acción</th>
                  <th>Precio</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {combinaciones.map((combinacion) => (
                  <tr key={combinacion.id_ajuste_accion}>
                    <td>{combinacion.nombre_ajuste}</td>
                    <td>{combinacion.nombre_accion}</td>
                    <td>${combinacion.precio}</td>
                    <td>
                      <div className="acciones-combinacion">
                        <button 
                          className="btn-editar"
                          onClick={() => {
                            setCombinacionEditando(combinacion);
                            setMostrarModalEditarCombinacion(true);
                          }}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => handleEliminarCombinacion(combinacion.id_ajuste_accion)}
                        >
                          Eliminar
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

      {/* Sección para agregar y gestionar ajustes y acciones */}
      <div className="configuracion-forms">
        {/* Gestión de Ajustes */}
        <div className="form-section card">
          <h3>Gestión de Ajustes</h3>
          <div className="form-group">
            <input
              type="text"
              value={nuevoAjuste}
              onChange={(e) => setNuevoAjuste(e.target.value)}
              placeholder="Nombre del nuevo ajuste"
            />
            <button onClick={handleCrearAjuste} className="btn-secondary">
              Agregar Ajuste
            </button>
          </div>
          
          <div className="lista-elementos">
            <h4>Ajustes Existentes:</h4>
            {ajustes.map((ajuste) => (
              <div key={ajuste.id_ajuste} className="elemento-item">
                <span>{ajuste.nombre_ajuste}</span>
                <div className="acciones-elemento">
                  <button 
                    className="btn-editar"
                    onClick={() => {
                      setAjusteEditando(ajuste);
                      setMostrarModalEditarAjuste(true);
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-eliminar"
                    onClick={() => handleEliminarAjuste(ajuste.id_ajuste, ajuste.nombre_ajuste)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gestión de Acciones */}
        <div className="form-section card">
          <h3>Gestión de Acciones</h3>
          <div className="form-group">
            <input
              type="text"
              value={nuevaAccion}
              onChange={(e) => setNuevaAccion(e.target.value)}
              placeholder="Nombre de la nueva acción"
            />
            <button onClick={handleCrearAccion} className="btn-secondary">
              Agregar Acción
            </button>
          </div>
          
          <div className="lista-elementos">
            <h4>Acciones Existentes:</h4>
            {acciones.map((accion) => (
              <div key={accion.id_accion} className="elemento-item">
                <span>{accion.nombre_accion}</span>
                <div className="acciones-elemento">
                  <button 
                    className="btn-editar"
                    onClick={() => {
                      setAccionEditando(accion);
                      setMostrarModalEditarAccion(true);
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    className="btn-eliminar"
                    onClick={() => handleEliminarAccion(accion.id_accion, accion.nombre_accion)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal para nueva combinación (MÚLTIPLES) */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content grande">
            <h2>Nueva Combinación de Ajuste</h2>
            
            <div className="modal-secciones">
              {/* AJUSTES */}
              <div className="seccion-ajustes">
                <h3>Ajustes ({ajustesSeleccionados.length} seleccionados)</h3>
                <div className="opciones-grid">
                  {agruparAjustes().map((grupo, index) => (
                    <div key={index} className="grupo-opciones">
                      <h4>{grupo.nombre}</h4>
                      {grupo.ajustes.map((ajuste) => (
                        <label key={ajuste.id_ajuste} className="opcion-principal">
                          <input 
                            type="checkbox" 
                            checked={ajustesSeleccionados.includes(ajuste.id_ajuste)}
                            onChange={() => handleSeleccionarAjuste(ajuste.id_ajuste)}
                          />
                          {ajuste.nombre_ajuste}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* ACCIONES */}
              <div className="seccion-ajustes">
                <h3>Acciones ({accionesSeleccionadas.length} seleccionadas)</h3>
                <div className="opciones-grid">
                  {agruparAcciones().map((grupo, index) => (
                    <div key={index} className="grupo-opciones">
                      <h4>{grupo.nombre}</h4>
                      {grupo.acciones.map((accion) => (
                        <label key={accion.id_accion} className="opcion-principal">
                          <input 
                            type="checkbox" 
                            checked={accionesSeleccionadas.includes(accion.id_accion)}
                            onChange={() => handleSeleccionarAccion(accion.id_accion)}
                          />
                          {accion.nombre_accion}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Precio para las combinaciones */}
            <div className="form-combinacion">
              <div className="form-group">
                <label>Precio para todas las combinaciones *</label>
                <input
                  type="number"
                  value={nuevaCombinacion.precio}
                  onChange={(e) => setNuevaCombinacion({
                    ...nuevaCombinacion,
                    precio: Number(e.target.value)
                  })}
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Resumen de selecciones */}
            <div className="resumen-selecciones">
              <h4>Resumen de selecciones:</h4>
              <p>Ajustes seleccionados: {ajustesSeleccionados.length}</p>
              <p>Acciones seleccionadas: {accionesSeleccionadas.length}</p>
              <p><strong>Combinaciones a crear: {ajustesSeleccionados.length * accionesSeleccionadas.length}</strong></p>
            </div>

            {/* Botones del modal */}
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModal(false);
                  setAjustesSeleccionados([]);
                  setAccionesSeleccionadas([]);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleCrearCombinaciones}
                disabled={ajustesSeleccionados.length === 0 || accionesSeleccionadas.length === 0}
              >
                Agregar {ajustesSeleccionados.length * accionesSeleccionadas.length} Combinaciones
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar combinación */}
      {mostrarModalEditarCombinacion && combinacionEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Combinación</h2>
            
            <div className="info-combinacion">
              <p><strong>Ajuste:</strong> {combinacionEditando.nombre_ajuste}</p>
              <p><strong>Acción:</strong> {combinacionEditando.nombre_accion}</p>
            </div>

            <div className="form-combinacion">
              <div className="form-group">
                <label>Precio *</label>
                <input
                  type="number"
                  value={combinacionEditando.precio}
                  onChange={(e) => setCombinacionEditando({
                    ...combinacionEditando,
                    precio: Number(e.target.value)
                  })}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalEditarCombinacion(false);
                  setCombinacionEditando(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditarCombinacion}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar ajuste */}
      {mostrarModalEditarAjuste && ajusteEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Ajuste</h2>
            
            <div className="form-group">
              <label>Nombre del Ajuste *</label>
              <input
                type="text"
                value={ajusteEditando.nombre_ajuste}
                onChange={(e) => setAjusteEditando({
                  ...ajusteEditando,
                  nombre_ajuste: e.target.value
                })}
                placeholder="Nombre del ajuste"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalEditarAjuste(false);
                  setAjusteEditando(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditarAjuste}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar acción */}
      {mostrarModalEditarAccion && accionEditando && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Acción</h2>
            
            <div className="form-group">
              <label>Nombre de la Acción *</label>
              <input
                type="text"
                value={accionEditando.nombre_accion}
                onChange={(e) => setAccionEditando({
                  ...accionEditando,
                  nombre_accion: e.target.value
                })}
                placeholder="Nombre de la acción"
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalEditarAccion(false);
                  setAccionEditando(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditarAccion}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}