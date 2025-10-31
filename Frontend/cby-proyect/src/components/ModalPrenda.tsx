// src/components/ModalPrenda.tsx (MODIFICADO)
import { useState, useEffect } from "react";
import { type Ajuste } from "../services/ajustesService";
import { type Accion } from "../services/accionesService";
import { type AjusteAccion } from "../services/ajustesAccionService";
import { type Prenda, type ArregloSeleccionado } from "../services/prendasService";

interface ModalPrendaProps {
  isOpen: boolean;
  onClose: () => void;
  onAgregarPrenda: (prenda: Prenda) => void;
  ajustes: Ajuste[];
  acciones: Accion[];
  combinaciones: AjusteAccion[];
}

// Tipos de prenda predefinidos (puedes cargarlos desde la DB si prefieres)
const TIPOS_PRENDA_PREDEFINIDOS = [
  "Jean",
  "Camisa",
  "Chaqueta",
  "Pantalón",
  "Vestido",
  "Falda",
  "Blusa",
  "Saco",
  "Short",
  "Suéter",
  "Abrigo",
  "Traje",
  "Camiseta",
  "Polo",
  "Chaleco",
  "Overol",
  "Leggings",
  "Sudadera",
  "Buso",
  "Chaquetón"
];

export default function ModalPrenda({
  isOpen,
  onClose,
  onAgregarPrenda,
  ajustes,
  acciones,
  combinaciones
}: ModalPrendaProps) {
  // Estados del formulario
  const [tipoPrenda, setTipoPrenda] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [descripcion, setDescripcion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [arreglosSeleccionados, setArreglosSeleccionados] = useState<ArregloSeleccionado[]>([]);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Estados para los arreglos disponibles
  const [arreglosFiltrados, setArreglosFiltrados] = useState<any[]>([]);

  // Cargar arreglos disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarArreglosDisponibles();
    }
  }, [isOpen, ajustes, acciones, combinaciones]);

  // Filtrar arreglos cuando cambia la búsqueda
  useEffect(() => {
    filtrarArreglos();
  }, [busqueda, ajustes, acciones, combinaciones]);

  // Filtrar sugerencias cuando cambia el tipo de prenda
  useEffect(() => {
    if (tipoPrenda.trim()) {
      const filtradas = TIPOS_PRENDA_PREDEFINIDOS.filter(tipo =>
        tipo.toLowerCase().includes(tipoPrenda.toLowerCase())
      );
      setSugerencias(filtradas);
      setMostrarSugerencias(filtradas.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [tipoPrenda]);

  const cargarArreglosDisponibles = () => {
    // Combinar todos los tipos de arreglos disponibles
    const todosLosArreglos = [
      // Combinaciones (ajuste + acción)
      ...combinaciones.map(combinacion => ({
        id: `combinacion_${combinacion.id_ajuste_accion}`,
        nombre: `${combinacion.nombre_ajuste} ${combinacion.nombre_accion}`,
        precio: combinacion.precio,
        tipo: 'combinacion' as const,
        datos: combinacion
      })),
      // Ajustes individuales
      ...ajustes.map(ajuste => ({
        id: `ajuste_${ajuste.id_ajuste}`,
        nombre: ajuste.nombre_ajuste,
        precio: 0,
        tipo: 'ajuste' as const,
        datos: ajuste
      })),
      // Acciones individuales
      ...acciones.map(accion => ({
        id: `accion_${accion.id_accion}`,
        nombre: accion.nombre_accion,
        precio: 0,
        tipo: 'accion' as const,
        datos: accion
      }))
    ];

    setArreglosFiltrados(todosLosArreglos);
  };

  const filtrarArreglos = () => {
    if (!busqueda.trim()) {
      cargarArreglosDisponibles();
      return;
    }

    const termino = busqueda.toLowerCase();
    const filtrados = [
      ...combinaciones.map(combinacion => ({
        id: `combinacion_${combinacion.id_ajuste_accion}`,
        nombre: `${combinacion.nombre_ajuste} ${combinacion.nombre_accion}`,
        precio: combinacion.precio,
        tipo: 'combinacion' as const,
        datos: combinacion
      })),
      ...ajustes.map(ajuste => ({
        id: `ajuste_${ajuste.id_ajuste}`,
        nombre: ajuste.nombre_ajuste,
        precio: 0,
        tipo: 'ajuste' as const,
        datos: ajuste
      })),
      ...acciones.map(accion => ({
        id: `accion_${accion.id_accion}`,
        nombre: accion.nombre_accion,
        precio: 0,
        tipo: 'accion' as const,
        datos: accion
      }))
    ].filter(arreglo => 
      arreglo.nombre.toLowerCase().includes(termino)
    );

    setArreglosFiltrados(filtrados);
  };

  const handleSeleccionarSugerencia = (sugerencia: string) => {
    setTipoPrenda(sugerencia);
    setMostrarSugerencias(false);
  };

  const handleSeleccionarArreglo = (arreglo: any) => {
    const arregloSeleccionado: ArregloSeleccionado = {
      precio: arreglo.precio,
      tipo: arreglo.tipo,
      ...(arreglo.tipo === 'combinacion' && {
        id_ajuste_accion: arreglo.datos.id_ajuste_accion,
        nombre_ajuste: arreglo.datos.nombre_ajuste,
        nombre_accion: arreglo.datos.nombre_accion
      }),
      ...(arreglo.tipo === 'ajuste' && {
        nombre_ajuste: arreglo.datos.nombre_ajuste
      }),
      ...(arreglo.tipo === 'accion' && {
        nombre_accion: arreglo.datos.nombre_accion
      })
    };

    setArreglosSeleccionados(prev => {
      // Evitar duplicados
      const existe = prev.some(a => 
        a.tipo === arregloSeleccionado.tipo &&
        ((a.tipo === 'combinacion' && a.id_ajuste_accion === arregloSeleccionado.id_ajuste_accion) ||
         (a.tipo === 'ajuste' && a.nombre_ajuste === arregloSeleccionado.nombre_ajuste) ||
         (a.tipo === 'accion' && a.nombre_accion === arregloSeleccionado.nombre_accion))
      );

      if (existe) {
        return prev.filter(a => 
          !(a.tipo === arregloSeleccionado.tipo &&
            ((a.tipo === 'combinacion' && a.id_ajuste_accion === arregloSeleccionado.id_ajuste_accion) ||
             (a.tipo === 'ajuste' && a.nombre_ajuste === arregloSeleccionado.nombre_ajuste) ||
             (a.tipo === 'accion' && a.nombre_accion === arregloSeleccionado.nombre_accion)))
        );
      } else {
        return [...prev, arregloSeleccionado];
      }
    });
  };

  const handleEliminarArreglo = (index: number) => {
    setArreglosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const calcularSubtotal = () => {
    return arreglosSeleccionados.reduce((total, arreglo) => total + arreglo.precio, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() * cantidad;
  };

  const handleAgregar = () => {
    if (!tipoPrenda.trim()) {
      alert("Por favor ingrese el tipo de prenda");
      return;
    }

    if (cantidad < 1) {
      alert("La cantidad debe ser al menos 1");
      return;
    }

    const nuevaPrenda: Prenda = {
      tipo: tipoPrenda,
      cantidad: cantidad,
      arreglos: arreglosSeleccionados,
      descripcion: descripcion || `Prenda: ${tipoPrenda} - ${arreglosSeleccionados.length} arreglos`
    };

    onAgregarPrenda(nuevaPrenda);
    
    // Resetear formulario
    setTipoPrenda("");
    setCantidad(1);
    setDescripcion("");
    setBusqueda("");
    setArreglosSeleccionados([]);
    setMostrarSugerencias(false);
    onClose();
  };

  const handleCancelar = () => {
    setTipoPrenda("");
    setCantidad(1);
    setDescripcion("");
    setBusqueda("");
    setArreglosSeleccionados([]);
    setMostrarSugerencias(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content prenda-modal">
        <h2>Nueva Prenda</h2>

        {/* Información básica de la prenda */}
        <div className="prenda-info">
          <div className="form-group">
            <label>Tipo de Prenda *</label>
            <div className="tipo-prenda-container">
              <input
                type="text"
                value={tipoPrenda}
                onChange={(e) => setTipoPrenda(e.target.value)}
                onFocus={() => setMostrarSugerencias(true)}
                placeholder="Escriba o seleccione un tipo de prenda"
                list="tipos-prenda-sugerencias"
              />
              
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="sugerencias-lista">
                  {sugerencias.map((sugerencia, index) => (
                    <div
                      key={index}
                      className="sugerencia-item"
                      onClick={() => handleSeleccionarSugerencia(sugerencia)}
                    >
                      {sugerencia}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Datalist para sugerencias nativas del navegador */}
              <datalist id="tipos-prenda-sugerencias">
                {TIPOS_PRENDA_PREDEFINIDOS.map((tipo, index) => (
                  <option key={index} value={tipo} />
                ))}
              </datalist>
            </div>
            <small className="texto-ayuda">
              Escriba el tipo de prenda o seleccione de las sugerencias
            </small>
          </div>

          <div className="form-group">
            <label>Cantidad *</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              min="1"
            />
          </div>
        </div>

        {/* Descripción de la prenda */}
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción adicional de la prenda (color, material, características especiales...)"
            rows={3}
          />
        </div>

        {/* Búsqueda de arreglos */}
        <div className="busqueda-arreglos">
          <h3>Buscar Arreglos</h3>
          <div className="search-box">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Busque por palabra clave (ej: entallar, ruedo, cintura...)"
            />
          </div>
        </div>

        {/* Lista de arreglos disponibles */}
        <div className="arreglos-disponibles">
          <h3>Seleccionar Arreglos *</h3>
          <div className="arreglos-grid">
            {arreglosFiltrados.map((arreglo) => (
              <div
                key={arreglo.id}
                className={`arreglo-item ${
                  arreglosSeleccionados.some(a => 
                    a.tipo === arreglo.tipo &&
                    ((a.tipo === 'combinacion' && a.id_ajuste_accion === arreglo.datos.id_ajuste_accion) ||
                     (a.tipo === 'ajuste' && a.nombre_ajuste === arreglo.datos.nombre_ajuste) ||
                     (a.tipo === 'accion' && a.nombre_accion === arreglo.datos.nombre_accion))
                  ) ? 'selected' : ''
                }`}
                onClick={() => handleSeleccionarArreglo(arreglo)}
              >
                <div className="arreglo-nombre">{arreglo.nombre}</div>
                <div className="arreglo-precio">
                  {arreglo.precio > 0 ? `$${arreglo.precio.toLocaleString()}` : 'Sin precio'}
                </div>
              </div>
            ))}
          </div>

          {arreglosFiltrados.length === 0 && (
            <p className="sin-resultados">No se encontraron arreglos</p>
          )}
        </div>

        {/* Arreglos seleccionados */}
        {arreglosSeleccionados.length > 0 && (
          <div className="arreglos-seleccionados">
            <h3>Arreglos Seleccionados:</h3>
            <div className="lista-arreglos">
              {arreglosSeleccionados.map((arreglo, index) => (
                <div key={index} className="arreglo-seleccionado">
                  <div className="arreglo-info">
                    <span className="arreglo-nombre">
                      {arreglo.tipo === 'combinacion' 
                        ? `${arreglo.nombre_ajuste} ${arreglo.nombre_accion}`
                        : arreglo.tipo === 'ajuste'
                        ? arreglo.nombre_ajuste
                        : arreglo.nombre_accion
                      }
                    </span>
                    <span className="arreglo-precio">
                      ${arreglo.precio.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-eliminar"
                    onClick={() => handleEliminarArreglo(index)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de precios */}
            <div className="resumen-precios">
              <div className="precio-linea">
                <span>Subtotal por prenda:</span>
                <span>${calcularSubtotal().toLocaleString()}</span>
              </div>
              <div className="precio-linea total">
                <span>Total ({cantidad} prenda{cantidad > 1 ? 's' : ''}):</span>
                <span>${calcularTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="modal-actions">
          <button type="button" className="btn-cancelar" onClick={handleCancelar}>
            Cancelar
          </button>
          <button type="button" className="btn-primary" onClick={handleAgregar}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}