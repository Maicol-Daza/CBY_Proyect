// src/components/ModalPrenda.tsx (MODIFICADO)
import { useState, useEffect, useRef } from "react";
import { useAlert } from "../context/AlertContext";
import { type Ajuste, crearAjuste } from "../services/ajustesService";
import { type Accion, crearAccion } from "../services/accionesService";
import { type AjusteAccion, crearAjusteAccion } from "../services/ajustesAccionService";
import { type Prenda, type ArregloSeleccionado } from "../services/prendasService";
import { FaTrash, FaPlus, FaTshirt } from 'react-icons/fa';
import { formatCOP } from '../utils/formatCurrency';
import { InputMoneda } from './InputMoneda';


interface ModalPrendaProps {
  isOpen: boolean;
  onClose: () => void;
  onAgregarPrenda: (prenda: Prenda) => void;
  ajustes: Ajuste[];
  acciones: Accion[];
  combinaciones: AjusteAccion[];
  prendaEditando?: Prenda | null;
  onArreglosUpdated?: () => void; // Para refrescar datos después de crear
}

// Tipos de prenda predefinidos
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
  combinaciones,
  prendaEditando = null,
  onArreglosUpdated
}: ModalPrendaProps) {
  const { success: showSuccess, error: showError, warning: showWarning } = useAlert();
  
  // Helper: convertir cualquier valor de precio a número seguro
  const parsePrecio = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isNaN(v) ? 0 : v;
    const s = String(v).trim();
    if (s === "") return 0;
    // quitar símbolos no numéricos, mantener punto decimal
    const cleaned = s.replace(/[^\d.-]/g, "").replace(/,/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  // Estados del formulario
  const [tipoPrenda, setTipoPrenda] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [descripcion, setDescripcion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [arreglosSeleccionados, setArreglosSeleccionados] = useState<ArregloSeleccionado[]>([]);
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState(-1);
  const sugerenciasRef = useRef<HTMLDivElement>(null);
  const inputTipoPrendaRef = useRef<HTMLInputElement>(null);

  // Estados para los arreglos disponibles
  const [arreglosFiltrados, setArreglosFiltrados] = useState<any[]>([]);

  // Estados para creación rápida de arreglos
  const [mostrarFormCrear, setMostrarFormCrear] = useState(false);
  const [tipoCrear, setTipoCrear] = useState<'ajuste' | 'accion' | 'combinacion'>('ajuste');
  const [nombreCrear, setNombreCrear] = useState("");
  const [precioCrear, setPrecioCrear] = useState<number>(0);
  const [loadingCrear, setLoadingCrear] = useState(false);
  // Para combinación: selección múltiple de ajustes y acciones
  const [ajustesSeleccionadosCrear, setAjustesSeleccionadosCrear] = useState<number[]>([]);
  const [accionesSeleccionadasCrear, setAccionesSeleccionadasCrear] = useState<number[]>([]);

  // Cargar datos si estamos editando
  useEffect(() => {
    if (isOpen && prendaEditando) {
      setTipoPrenda(prendaEditando.tipo);
      setCantidad(prendaEditando.cantidad || 1);
      setDescripcion(prendaEditando.descripcion || "");
      // Normalizar precios al abrir para editar (evitar strings con $)
      const arreglosNormalizados = (prendaEditando.arreglos || []).map(a => ({
        ...a,
        precio: parsePrecio((a as any).precio)
      }));
      setArreglosSeleccionados(arreglosNormalizados);
    } else if (isOpen) {
      // Resetear formulario para nueva prenda
      setTipoPrenda("");
      setCantidad(1);
      setDescripcion("");
      setBusqueda("");
      setArreglosSeleccionados([]);
      setMostrarSugerencias(false);
    }
  }, [isOpen, prendaEditando]);

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
      // Solo mantener abierto si hay sugerencias diferentes al valor actual
      const hayDiferentes = filtradas.some(s => s.toLowerCase() !== tipoPrenda.toLowerCase());
      if (mostrarSugerencias && !hayDiferentes && filtradas.length === 1) {
        setMostrarSugerencias(false);
      }
    } else {
      // Mostrar todas las sugerencias cuando está vacío
      setSugerencias(TIPOS_PRENDA_PREDEFINIDOS);
    }
    setIndiceSugerencia(-1);
  }, [tipoPrenda]);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sugerenciasRef.current &&
        !sugerenciasRef.current.contains(event.target as Node) &&
        inputTipoPrendaRef.current &&
        !inputTipoPrendaRef.current.contains(event.target as Node)
      ) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cargarArreglosDisponibles = () => {
    const todosLosArreglos = [
      ...combinaciones.map(combinacion => ({
        id: `combinacion_${combinacion.id_ajuste_accion}`,
        nombre: combinacion.descripcion_combinacion && combinacion.descripcion_combinacion.trim().length > 0
                ? combinacion.descripcion_combinacion
                : `${(combinacion.nombre_ajuste ?? '').trim()} ${(combinacion.nombre_accion ?? '').trim()}`.trim(),
        precio: parsePrecio(combinacion.precio),
        tipo: 'combinacion' as const,
        datos: combinacion
      })),
      ...ajustes.map(ajuste => ({
        id: `ajuste_${ajuste.id_ajuste}`,
        nombre: ajuste.nombre_ajuste,
        // usar el precio guardado en la tabla ajustes
        precio: parsePrecio((ajuste as any).precio_ajuste ?? (ajuste as any).precio ?? 0),
        tipo: 'ajuste' as const,
        datos: ajuste
      })),
      ...acciones.map(accion => ({
        id: `accion_${accion.id_accion}`,
        nombre: accion.nombre_accion,
        // usar el precio guardado en la tabla acciones
        precio: parsePrecio((accion as any).precio_acciones ?? (accion as any).precio ?? 0),
        tipo: 'accion' as const,
        datos: accion
      }))
    ];

    // Ordenar alfabéticamente por nombre
    todosLosArreglos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

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
        nombre: combinacion.descripcion_combinacion && combinacion.descripcion_combinacion.trim().length > 0
                ? combinacion.descripcion_combinacion
                : `${(combinacion.nombre_ajuste ?? '').trim()} ${(combinacion.nombre_accion ?? '').trim()}`.trim(),
        precio: parsePrecio(combinacion.precio),
        tipo: 'combinacion' as const,
        datos: combinacion
      })),
      ...ajustes.map(ajuste => ({
        id: `ajuste_${ajuste.id_ajuste}`,
        nombre: ajuste.nombre_ajuste,
        precio: parsePrecio((ajuste as any).precio_ajuste ?? (ajuste as any).precio ?? 0),
        tipo: 'ajuste' as const,
        datos: ajuste
      })),
      ...acciones.map(accion => ({
        id: `accion_${accion.id_accion}`,
        nombre: accion.nombre_accion,
        precio: parsePrecio((accion as any).precio_acciones ?? (accion as any).precio ?? 0),
        tipo: 'accion' as const,
        datos: accion
      }))
    ].filter(arreglo => 
      arreglo.nombre.toLowerCase().includes(termino)
    );

    // Ordenar alfabéticamente por nombre
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    setArreglosFiltrados(filtrados);
  };

  // Funciones para creación rápida de arreglos
  const resetFormCrear = () => {
    setMostrarFormCrear(false);
    setNombreCrear("");
    setPrecioCrear(0);
    setAjustesSeleccionadosCrear([]);
    setAccionesSeleccionadasCrear([]);
    setTipoCrear('ajuste');
  };

  // Handlers para selección múltiple en combinaciones
  const handleAjusteCrearChange = (id: number, checked: boolean) => {
    setAjustesSeleccionadosCrear(prev =>
      checked ? [...prev, id] : prev.filter(a => a !== id)
    );
  };

  const handleAccionCrearChange = (id: number, checked: boolean) => {
    setAccionesSeleccionadasCrear(prev =>
      checked ? [...prev, id] : prev.filter(a => a !== id)
    );
  };

  const handleCrearArregloRapido = async () => {
    if (tipoCrear === 'combinacion') {
      // Para combinación necesitamos al menos un ajuste y una acción seleccionados
      if (ajustesSeleccionadosCrear.length === 0 || accionesSeleccionadasCrear.length === 0) {
        showWarning('Selecciona al menos un ajuste y una acción para la combinación');
        return;
      }
      
      // Validar límite máximo de selecciones
      if (ajustesSeleccionadosCrear.length > 13 || accionesSeleccionadasCrear.length > 13) {
        showWarning('Solo puedes seleccionar un máximo de 13 ajustes y 13 acciones por combinación');
        return;
      }
      
      if (precioCrear <= 0) {
        showWarning('Ingresa un precio válido');
        return;
      }
      
      setLoadingCrear(true);
      try {
        // Generar descripción automática con todos los seleccionados
        const nombresAjustes = ajustesSeleccionadosCrear
          .map(id => ajustes.find(a => a.id_ajuste === id)?.nombre_ajuste)
          .filter(Boolean)
          .join(' + ');
        const nombresAcciones = accionesSeleccionadasCrear
          .map(id => acciones.find(a => a.id_accion === id)?.nombre_accion)
          .filter(Boolean)
          .join(' + ');
        const descripcionComb = nombreCrear.trim() || `${nombresAjustes} / ${nombresAcciones}`.trim();
        
        // Crear la combinación usando el primer ajuste y primera acción (igual que en configuracionAjustes)
        await crearAjusteAccion(
          ajustesSeleccionadosCrear[0], 
          accionesSeleccionadasCrear[0], 
          precioCrear, 
          descripcionComb
        );
        showSuccess('Combinación creada correctamente');
        resetFormCrear();
        if (onArreglosUpdated) onArreglosUpdated();
      } catch (error) {
        console.error('Error al crear combinación:', error);
        showError('Error al crear la combinación');
      } finally {
        setLoadingCrear(false);
      }
    } else {
      // Para ajuste o acción
      if (!nombreCrear.trim()) {
        showWarning(`Ingresa un nombre para ${tipoCrear === 'ajuste' ? 'el ajuste' : 'la acción'}`);
        return;
      }
      if (precioCrear <= 0) {
        showWarning('Ingresa un precio válido');
        return;
      }

      setLoadingCrear(true);
      try {
        if (tipoCrear === 'ajuste') {
          await crearAjuste(nombreCrear.trim(), precioCrear);
          showSuccess('Ajuste creado correctamente');
        } else {
          await crearAccion(nombreCrear.trim(), precioCrear);
          showSuccess('Acción creada correctamente');
        }
        resetFormCrear();
        if (onArreglosUpdated) onArreglosUpdated();
      } catch (error) {
        console.error(`Error al crear ${tipoCrear}:`, error);
        showError(`Error al crear ${tipoCrear === 'ajuste' ? 'el ajuste' : 'la acción'}`);
      } finally {
        setLoadingCrear(false);
      }
    }
  };

  const handleSeleccionarSugerencia = (sugerencia: string) => {
    setTipoPrenda(sugerencia);
    setMostrarSugerencias(false);
    setIndiceSugerencia(-1);
  };

  // Manejador de teclado para navegación en sugerencias
  const handleKeyDownSugerencias = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mostrarSugerencias || sugerencias.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setIndiceSugerencia(prev => 
          prev < sugerencias.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setIndiceSugerencia(prev => 
          prev > 0 ? prev - 1 : sugerencias.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (indiceSugerencia >= 0 && indiceSugerencia < sugerencias.length) {
          handleSeleccionarSugerencia(sugerencias[indiceSugerencia]);
        }
        break;
      case 'Escape':
        setMostrarSugerencias(false);
        setIndiceSugerencia(-1);
        break;
    }
  };

  // Resaltar texto coincidente en sugerencias
  const resaltarCoincidencia = (texto: string, busqueda: string) => {
    if (!busqueda.trim()) return texto;
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const partes = texto.split(regex);
    return partes.map((parte, i) => 
      regex.test(parte) ? <strong key={i} className="sugerencia-match">{parte}</strong> : parte
    );
  };

  const handleSeleccionarArreglo = (arreglo: any) => {
    const precioNum = parsePrecio(arreglo.precio);
    
    // Construir el arreglo seleccionado según el tipo
    let arregloSeleccionado: ArregloSeleccionado;
    
    if (arreglo.tipo === 'combinacion') {
      arregloSeleccionado = {
        precio: precioNum,
        tipo: 'combinacion',
        id_ajuste_accion: arreglo.datos.id_ajuste_accion,
        nombre_ajuste: arreglo.datos.nombre_ajuste ?? '',
        nombre_accion: arreglo.datos.nombre_accion ?? '',
        descripcion_combinacion: arreglo.datos.descripcion_combinacion ?? arreglo.nombre
      };
    } else if (arreglo.tipo === 'ajuste') {
      arregloSeleccionado = {
        precio: precioNum,
        tipo: 'ajuste',
        nombre_ajuste: arreglo.datos.nombre_ajuste
      };
    } else {
      arregloSeleccionado = {
        precio: precioNum,
        tipo: 'accion',
        nombre_accion: arreglo.datos.nombre_accion
      };
    }

    setArreglosSeleccionados(prev => {
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
    return arreglosSeleccionados.reduce((total, arreglo) => {
      const p = parsePrecio((arreglo as any).precio);
      return total + p;
    }, 0);
  };

  const calcularTotal = () => {
    const cant = Number(cantidad) || 1;
    return calcularSubtotal() * (isNaN(cant) || cant <= 0 ? 1 : cant);
  };

  const handleAgregar = () => {
    if (!tipoPrenda.trim()) {
      showWarning("Por favor ingrese el tipo de prenda");
      return;
    }

    if (cantidad < 1) {
      showWarning("La cantidad debe ser al menos 1");
      return;
    }

    // Validación: debe seleccionar al menos un arreglo
    if (arreglosSeleccionados.length === 0) {
      showWarning("Debe seleccionar al menos un arreglo para la prenda");
      return;
    }

    // Construir lista legible de arreglos 
    const nombresArreglos = arreglosSeleccionados.map(a => {
      if (a.tipo === 'combinacion') {
        const nombre = (a as any).descripcion_combinacion
          ?? `${(a as any).nombre_ajuste ?? ''} ${(a as any).nombre_accion ?? ''}`.trim();
        const precio = Number((a as any).precio) || 0;
        const precioStr = precio > 0 ? ` - ${formatCOP(precio)}` : '';
        return `${nombre}${precioStr}`;
      }
      if (a.tipo === 'ajuste') {
        const nombre = (a as any).nombre_ajuste ?? '';
        return nombre;
      }
      if (a.tipo === 'accion') {
        const nombre = (a as any).nombre_accion ?? '';
        return nombre;
      }
      return '';
    }).filter(Boolean).join(' + ');

    const descripcionFinal = descripcion && descripcion.trim()
      ? descripcion.trim()
      : (nombresArreglos ? `${nombresArreglos}` : `Prenda: ${tipoPrenda} - ${arreglosSeleccionados.length} arreglos`);

    // asegurar que los precios en la prenda sean números
    const arreglosParaGuardar = arreglosSeleccionados.map(a => ({
      ...a,
      precio: parsePrecio((a as any).precio)
    }));

    const nuevaPrenda: Prenda = {
      tipo: tipoPrenda,
      cantidad: cantidad,
      arreglos: arreglosParaGuardar,
      descripcion: descripcionFinal
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
    <div className="modal-overlay prenda-modal-overlay">
      <div className="modal-content-prenda prenda-modal-content modal-content">
        <button
          className="modal-close-consistente"
          onClick={handleCancelar}
          aria-label="Cerrar"
          type="button"
          style={{ fontFamily: 'inherit', fontWeight: 700, position: 'absolute', top: 18, right: 24, zIndex: 10 }}
        >
          &times;
        </button>
        <h2>{prendaEditando ? "Editar Prenda" : "Nueva Prenda"}</h2>

        {/* Información básica de la prenda */}
        <div className="prenda-info">
          <div className="form-group">
            <label>Tipo de Prenda *</label>
            <div className="tipo-prenda-container">
              <div className="tipo-prenda-input-wrapper">
                <input
                  ref={inputTipoPrendaRef}
                  type="text"
                  value={tipoPrenda}
                  onChange={(e) => setTipoPrenda(e.target.value)}
                  onFocus={() => setMostrarSugerencias(true)}
                  onKeyDown={handleKeyDownSugerencias}
                  placeholder="Escriba o seleccione un tipo de prenda"
                  autoComplete="off"
                  className="tipo-prenda-input"
                />
                {tipoPrenda && (
                  <button 
                    type="button"
                    className="tipo-prenda-clear"
                    onClick={() => {
                      setTipoPrenda('');
                      inputTipoPrendaRef.current?.focus();
                      setMostrarSugerencias(true);
                    }}
                    title="Limpiar"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {mostrarSugerencias && sugerencias.length > 0 && (
                <div className="sugerencias-lista" ref={sugerenciasRef}>
                  <div className="sugerencias-header">
                    <span>Selecciona un tipo de prenda</span>
                    <span className="sugerencias-count">{sugerencias.length} opciones</span>
                  </div>
                  <div className="sugerencias-items">
                    {sugerencias.map((sugerencia, index) => (
                      <div
                        key={index}
                        className={`sugerencia-item ${indiceSugerencia === index ? 'sugerencia-item-activo' : ''}`}
                        onClick={() => handleSeleccionarSugerencia(sugerencia)}
                        onMouseEnter={() => setIndiceSugerencia(index)}
                      >
                        <FaTshirt className="sugerencia-icono" />
                        <span className="sugerencia-texto">
                          {resaltarCoincidencia(sugerencia, tipoPrenda)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="sugerencias-footer">
                    <span>↑↓ navegar</span>
                    <span>Enter seleccionar</span>
                    <span>Esc cerrar</span>
                  </div>
                </div>
              )}
            </div>
            {/* <small className="texto-ayuda">
              Escriba para filtrar o use las flechas del teclado para navegar
            </small> */}
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
          <div className="search-box-container">
            <div className="search-box">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Busque por palabra clave (ej: entallar, ruedo, cintura...)"
              />
            </div>
            <button 
              type="button" 
              className="btn-crear-rapido"
              onClick={() => setMostrarFormCrear(!mostrarFormCrear)}
              title="Crear nuevo arreglo rápido"
            >
              <FaPlus />
            </button>
          </div>

          {/* Formulario de creación rápida */}
          {mostrarFormCrear && (
            <div className="form-crear-rapido">
              <div className="form-crear-header">
                <h4>Crear Arreglo Rápido</h4>
                <button 
                  type="button" 
                  className="btn-cerrar-crear"
                  onClick={resetFormCrear}
                >
                  ✕
                </button>
              </div>

              <div className="form-crear-tipo">
                <label>Tipo:</label>
                <div className="tipo-buttons">
                  <button 
                    type="button"
                    className={`btn-tipo ${tipoCrear === 'ajuste' ? 'active' : ''}`}
                    onClick={() => setTipoCrear('ajuste')}
                  >
                    Ajuste
                  </button>
                  <button 
                    type="button"
                    className={`btn-tipo ${tipoCrear === 'accion' ? 'active' : ''}`}
                    onClick={() => setTipoCrear('accion')}
                  >
                    Acción
                  </button>
                  <button 
                    type="button"
                    className={`btn-tipo ${tipoCrear === 'combinacion' ? 'active' : ''}`}
                    onClick={() => setTipoCrear('combinacion')}
                  >
                    Combinación
                  </button>
                </div>
              </div>

              {tipoCrear === 'combinacion' ? (
                <>
                  <div className="form-crear-checkboxes">
                    <div className="checkbox-group-mini">
                      <label className="checkbox-group-title">Ajustes ({ajustesSeleccionadosCrear.length} seleccionados):</label>
                      <div className="checkboxes-list-mini">
                        {ajustes.map(ajuste => (
                          <label key={ajuste.id_ajuste} className="checkbox-item-mini">
                            <input
                              type="checkbox"
                              checked={ajustesSeleccionadosCrear.includes(ajuste.id_ajuste)}
                              onChange={(e) => handleAjusteCrearChange(ajuste.id_ajuste, e.target.checked)}
                            />
                            <span>{ajuste.nombre_ajuste}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="checkbox-group-mini">
                      <label className="checkbox-group-title">Acciones ({accionesSeleccionadasCrear.length} seleccionadas):</label>
                      <div className="checkboxes-list-mini">
                        {acciones.map(accion => (
                          <label key={accion.id_accion} className="checkbox-item-mini">
                            <input
                              type="checkbox"
                              checked={accionesSeleccionadasCrear.includes(accion.id_accion)}
                              onChange={(e) => handleAccionCrearChange(accion.id_accion, e.target.checked)}
                            />
                            <span>{accion.nombre_accion}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-crear-campos">
                    <div className="form-group-mini">
                      <label>Descripción (opcional):</label>
                      <input
                        type="text"
                        value={nombreCrear}
                        onChange={(e) => setNombreCrear(e.target.value)}
                        placeholder="Ej: Ruedo + Puño / Subir + Bajar"
                      />
                    </div>
                    <div className="form-group-mini">
                      <label>Precio:</label>
                      <InputMoneda
                        value={precioCrear}
                        onChange={setPrecioCrear}
                        placeholder="$ 0"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="form-crear-campos">
                  <div className="form-group-mini">
                    <label>Nombre:</label>
                    <input
                      type="text"
                      value={nombreCrear}
                      onChange={(e) => setNombreCrear(e.target.value)}
                      placeholder={tipoCrear === 'ajuste' ? 'Ej: Entallar' : 'Ej: Cintura'}
                    />
                  </div>
                  <div className="form-group-mini">
                    <label>Precio:</label>
                    <InputMoneda
                      value={precioCrear}
                      onChange={setPrecioCrear}
                      placeholder="$ 0"
                    />
                  </div>
                </div>
              )}

              <button 
                type="button"
                className="btn-guardar-rapido"
                onClick={handleCrearArregloRapido}
                disabled={loadingCrear}
              >
                {loadingCrear ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
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
                <div className="arreglo-precio-Prendas">
                  {arreglo.precio && Number(arreglo.precio) > 0 ? formatCOP(arreglo.precio) : 'Sin precio'}
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
                        ? (arreglo.descripcion_combinacion ?? `${arreglo.nombre_ajuste} ${arreglo.nombre_accion}`.trim())
                        : arreglo.tipo === 'ajuste'
                        ? arreglo.nombre_ajuste
                        : arreglo.nombre_accion
                      }
                    </span>
                    <span className="arreglo-precio-Prendas">
                      {formatCOP(arreglo.precio)}
                    </span>
                  </div>

                  {/* Espacio entre el boton y el precio en el modal */ }
                  <p className="Espacio-precio"><br /></p>
                  
                  <button
                    type="button"
                    className="btn-eliminar-prendas"
                    onClick={() => handleEliminarArreglo(index)}
                  >
                    <FaTrash /> Eliminar
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de precios */}
            <div className="resumen-precios">
              <div className="precio-linea">
                <span>Subtotal por prenda:</span>
                <span>{formatCOP(calcularSubtotal())}</span>
              </div>
              <div className="precio-linea total">
                <span>Total (prenda):</span>
                <span>{formatCOP(calcularTotal())}</span>
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
             {prendaEditando ? "Actualizar" : "Agregar"}
           </button>
         </div>
       </div>
     </div>
   );
}