// src/components/ConfiguracionAjustes.tsx
import { useState, useEffect } from "react";
import "../styles/configuracionAjustes.css";
import { 
  obtenerAjustes, 
  crearAjuste, 
  type Ajuste 
} from "../services/ajustesService";
import { 
  obtenerAcciones, 
  crearAccion, 
  type Accion 
} from "../services/accionesService";
import { 
  obtenerAjustesAccion, 
  crearAjusteAccion, 
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
  
  // Estado para nueva combinación
  const [nuevaCombinacion, setNuevaCombinacion] = useState({
    id_ajuste: 0,
    id_accion: 0,
    precio: 0
  });

  // Estados para selecciones en el modal
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
      cargarDatos(); // Recargar datos
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
      cargarDatos(); // Recargar datos
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
      cargarDatos(); // Recargar datos
      alert("Combinación eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar combinación:", error);
      alert("Error al eliminar la combinación");
    }
  };

  // Agrupar ajustes por categoría (simulando la estructura de la imagen)
  const agruparAjustes = () => {
    // Aquí puedes personalizar cómo agrupar los ajustes
    // Por ahora los mostramos todos en una lista
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
    // Agrupar acciones de manera similar
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
                      <button 
                        className="btn-eliminar"
                        onClick={() => handleEliminarCombinacion(combinacion.id_ajuste_accion)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sección para agregar nuevos ajustes y acciones */}
      <div className="configuracion-forms">
        <div className="form-section card">
          <h3>Agregar Nuevo Ajuste</h3>
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
        </div>

        <div className="form-section card">
          <h3>Agregar Nueva Acción</h3>
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
        </div>
      </div>

      {/* Modal para nueva combinación */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Nueva Combinación de Ajuste</h2>
            
            {/* CONTENEDOR QUE MUESTRA DOS COLUMNAS LADO A LADO */}
            <div className="modal-secciones">
              {/* AJUSTES (antes "Elementos de la Prenda") */}
              <div className="seccion-ajustes">
                <h3>Ajustes</h3>
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

              {/* ACCIONES (antes "Técnicas de Ajuste") */}
              <div className="seccion-ajustes">
                <h3>Acciones</h3>
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
                <label>Precio Asociado *</label>
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
              <p>Combinaciones a crear: {ajustesSeleccionados.length * accionesSeleccionadas.length}</p>
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
    </div>
  );
}