import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import "../styles/pedidos.css";
import { obtenerCajones, type Cajon } from "../services/cajonesService";
import { obtenerCodigos, type Codigo } from "../services/codigosService";
import { obtenerAjustes, type Ajuste } from "../services/ajustesService";
import { obtenerAcciones, type Accion } from "../services/accionesService";
import { obtenerAjustesAccion, type AjusteAccion } from "../services/ajustesAccionService";
import ModalPrenda from "../components/ModalPrenda";
import { type Prenda, type ArregloSeleccionado } from "../services/prendasService";
import { FaEdit } from "react-icons/fa";

// Interfaces (manteniendo las existentes)
interface Pedido {
  fechaInicio: string;
  fechaEntrega: string;
  estado: string;
  observaciones: string;
  abonoInicial: number | string;
  totalPedido: number;
  saldoPendiente: number;
}

interface Cliente {
  nombre: string;
  cedula: string;
  telefono: string;
  direccion: string;
  email: string;
}

interface Errores {
  [key: string]: string;
}

// Configuración de cajones basada en la imagen
const CONFIG_CAJONES = [
  { id: 1, nombre: "Cajón 01", rango: "1-26" },
  { id: 2, nombre: "Cajón 02", rango: "27-53" },
  { id: 3, nombre: "Cajón 03", rango: "54-80" },
  { id: 4, nombre: "Cajón 04", rango: "81-107" },
  { id: 5, nombre: "Cajón 05", rango: "108-134" },
  { id: 6, nombre: "Cajón 06", rango: "Pedidos grandes 135-145" },
  { id: 7, nombre: "Cajón 07", rango: "146-172" },
  { id: 8, nombre: "Cajón 08", rango: "173-199" },
  { id: 9, nombre: "Cajón 09", rango: "200-226" },
  { id: 10, nombre: "Cajón 10", rango: "227-253" },
  { id: 11, nombre: "Cajón 11", rango: "254-280" },
  { id: 12, nombre: "Cajón 12", rango: "281-307" },
  { id: 13, nombre: "Cajón 13", rango: "Bodega (pedidos antiguos)" },
  { id: 14, nombre: "Cajón 14", rango: "Tintes 308-334" }
];

export default function Pedidos() {
  // Estados principales
  const [pedido, setPedido] = useState<Pedido>({
    fechaInicio: "",
    fechaEntrega: "",
    estado: "",
    observaciones: "",
    abonoInicial: "",
    totalPedido: 0,
    saldoPendiente: 0,
  });

  const [cliente, setCliente] = useState<Cliente>({
    nombre: "",
    cedula: "",
    telefono: "",
    direccion: "",
    email: "",
  });

  const [cajones, setCajones] = useState<Cajon[]>([]);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [codigosFiltrados, setCodigosFiltrados] = useState<Codigo[]>([]);
  const [cajonSeleccionado, setCajonSeleccionado] = useState<number | null>(null);
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<number[]>([]);
  
  // Estados para prendas
  const [mostrarModalPrenda, setMostrarModalPrenda] = useState(false);
  const [prendasTemporales, setPrendasTemporales] = useState<Prenda[]>([]);
  const [prendaEditando, setPrendaEditando] = useState<number | null>(null);
  
  // Estados para ajustes y combinaciones
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [combinaciones, setCombinaciones] = useState<AjusteAccion[]>([]);

  // Estados de carga
  const [cargandoCajones, setCargandoCajones] = useState(false);
  const [cargandoCodigos, setCargandoCodigos] = useState(false);
  const [cargandoAjustes, setCargandoAjustes] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [cargando, setCargando] = useState(false);

  // Estado para modificar precio final
  const [mostrarModificarPrecio, setMostrarModificarPrecio] = useState(false);
  const [precioModificado, setPrecioModificado] = useState(0);
  const [motivoModificacion, setMotivoModificacion] = useState("");

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargandoCajones(true);
      setCargandoCodigos(true);
      setCargandoAjustes(true);
      
      const [cajonesData, codigosData, ajustesData, accionesData, combinacionesData] = await Promise.all([
        obtenerCajones(),
        obtenerCodigos(),
        obtenerAjustes(),
        obtenerAcciones(),
        obtenerAjustesAccion()
      ]);
      
      setCajones(cajonesData);
      setCodigos(codigosData);
      setAjustes(ajustesData);
      setAcciones(accionesData);
      setCombinaciones(combinacionesData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Error al cargar los datos");
    } finally {
      setCargandoCajones(false);
      setCargandoCodigos(false);
      setCargandoAjustes(false);
    }
  };

  // Filtrar códigos cuando se selecciona un cajón - mostrar TODOS los códigos
  useEffect(() => {
    if (cajonSeleccionado) {
      const codigosDelCajon = codigos.filter(codigo => 
        codigo.id_cajon === cajonSeleccionado
      );
      setCodigosFiltrados(codigosDelCajon);
    } else {
      setCodigosFiltrados([]);
    }
  }, [cajonSeleccionado, codigos]);

  // Actualizar el total del pedido cuando cambian las prendas
  useEffect(() => {
    const totalPrendas = calcularTotalPrendas();
    setPedido(prev => ({
      ...prev,
      totalPedido: totalPrendas,
      saldoPendiente: totalPrendas - Number(prev.abonoInicial || 0)
    }));
    setPrecioModificado(totalPrendas); // Inicializar el precio modificado
  }, [prendasTemporales]);

  //  Validar campos antes de enviar
  const validarCampos = (): boolean => {
    const nuevosErrores: Errores = {};

    if (!cliente.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio.";
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(cliente.nombre)) {
      nuevosErrores.nombre = "El nombre solo puede contener letras.";
    }

    if (!cliente.cedula.trim()) {
      nuevosErrores.cedula = "La cédula es obligatoria.";
    } else if (cliente.cedula.length > 20) {
      nuevosErrores.cedula = "Máximo 20 caracteres.";
    }

    if (!cliente.telefono.trim()) {
      nuevosErrores.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d+$/.test(cliente.telefono)) {
      nuevosErrores.telefono = "Solo se permiten números.";
    } else if (cliente.telefono.length > 20) {
      nuevosErrores.telefono = "Máximo 20 caracteres.";
    }

    if (!cliente.direccion.trim()) {
      nuevosErrores.direccion = "La dirección es obligatoria.";
    }

    if (!cliente.email.trim()) {
      nuevosErrores.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.(com|co)$/.test(cliente.email)) {
      nuevosErrores.email = "Debe tener un formato válido (ej: usuario@gmail.com).";
    }

    if (!pedido.fechaInicio) {
      nuevosErrores.fechaInicio = "Debe seleccionar una fecha de inicio.";
    }

    if (!pedido.fechaEntrega) {
      nuevosErrores.fechaEntrega = "Debe seleccionar una fecha de entrega.";
    }

    if (!pedido.estado) {
      nuevosErrores.estado = "Debe seleccionar un estado.";
    }

    // EL ABONO NO ES OBLIGATORIO - solo validar que no sea negativo
    if (pedido.abonoInicial !== "" && Number(pedido.abonoInicial) < 0) {
      nuevosErrores.abonoInicial = "El abono no puede ser negativo.";
    }

    // Validar selección de cajón
    if (cajonSeleccionado === null) {
      nuevosErrores.cajon = "Debe seleccionar un cajón.";
    }

    // Validar selección de códigos
    if (codigosSeleccionados.length === 0) {
      nuevosErrores.codigos = "Debe seleccionar al menos un código.";
    }

    // Validar que no se seleccionen códigos ocupados
    const codigosOcupadosSeleccionados = codigosSeleccionados.filter(id => {
      const codigo = codigos.find(c => c.id_codigo === id);
      return codigo?.estado === 'ocupado';
    });

    if (codigosOcupadosSeleccionados.length > 0) {
      nuevosErrores.codigos = "No puede seleccionar códigos que están ocupados.";
    }

    // Validar que haya al menos una prenda
    if (prendasTemporales.length === 0) {
      nuevosErrores.prendas = "Debe agregar al menos una prenda.";
    }

    // Validar que el precio modificado no sea negativo
    if (precioModificado < 0) {
      nuevosErrores.precioModificado = "El precio no puede ser negativo.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejo de inputs cliente
  const handleInputCliente = (e: ChangeEvent<HTMLInputElement>) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  // Manejo de inputs pedido
  const handleInputPedido = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPedido((prev) => {
      const updated = {
        ...prev,
        [name]:
          name === "abonoInicial" || name === "totalPedido"
            ? Number(value)
            : value,
      };

      // Recalcular saldo pendiente
      if (name === "abonoInicial" || name === "totalPedido") {
        updated.saldoPendiente =
          Number(updated.totalPedido) - Number(updated.abonoInicial || 0);
      }

      return updated;
    });
  };

  // Manejar selección de cajón - PERMITIR CUALQUIER CAJÓN
  const handleSeleccionarCajon = (idCajon: number) => {
    setCajonSeleccionado(idCajon);
    setCodigosSeleccionados([]); // Limpiar códigos seleccionados al cambiar de cajón
    
    // Limpiar errores si existen
    if (errores.cajon || errores.codigos) {
      setErrores(prev => {
        const newErrores = { ...prev };
        delete newErrores.cajon;
        delete newErrores.codigos;
        return newErrores;
      });
    }
  };

  // Manejar selección de códigos - PERMITIR VER TODOS LOS CÓDIGOS
  const handleSeleccionarCodigo = (idCodigo: number) => {
    const codigo = codigos.find(c => c.id_codigo === idCodigo);
    
    // No permitir seleccionar códigos ocupados
    if (codigo?.estado === 'ocupado') {
      return;
    }

    setCodigosSeleccionados(prev => {
      if (prev.includes(idCodigo)) {
        return prev.filter(id => id !== idCodigo);
      } else {
        return [...prev, idCodigo];
      }
    });

    // Limpiar error de códigos si existe
    if (errores.codigos) {
      setErrores(prev => {
        const newErrores = { ...prev };
        delete newErrores.codigos;
        return newErrores;
      });
    }
  };

  // Manejar agregar prenda temporal
  const handleAgregarPrendaTemporal = (prenda: Prenda) => {
    if (prendaEditando !== null) {
      // Editar prenda existente
      setPrendasTemporales(prev => 
        prev.map((p, index) => index === prendaEditando ? prenda : p)
      );
      setPrendaEditando(null);
    } else {
      // Agregar nueva prenda
      setPrendasTemporales(prev => [...prev, prenda]);
    }
    
    // Limpiar error de prendas si existe
    if (errores.prendas) {
      setErrores(prev => {
        const newErrores = { ...prev };
        delete newErrores.prendas;
        return newErrores;
      });
    }
  };

  // Manejar editar prenda0
  const handleEditarPrenda = (index: number) => {
    setPrendaEditando(index);
    setMostrarModalPrenda(true);
  };

  // Manejar eliminar prenda temporal
  const handleEliminarPrendaTemporal = (index: number) => {
    setPrendasTemporales(prev => prev.filter((_, i) => i !== index));
  };

  // Calcular el total de las prendas
  const calcularTotalPrendas = () => {
    return prendasTemporales.reduce((total, prenda) => {
      const subtotalPrenda = (prenda.arreglos || []).reduce((subtotal, arreglo) => 
        subtotal + arreglo.precio, 0
      );
      return total + (subtotalPrenda * (prenda.cantidad || 1));
    }, 0);
  };

  // Obtener información del cajón por ID
  const getInfoCajon = (idCajon: number) => {
    return CONFIG_CAJONES.find(cajon => cajon.id === idCajon) || 
           { nombre: `Cajón ${idCajon}`, rango: 'Sin rango definido' };
  };

  // Función para determinar la clase CSS según el estado del cajón
  const getClaseCajon = (cajon: Cajon) => {
    const baseClass = "cajon";
    const seleccionado = cajonSeleccionado === cajon.id_cajon ? "selected" : "";
    
    // Solo aplicar clases de estado para styling, no para deshabilitar
    if (cajon.estado === "ocupado") {
      return `${baseClass} ocupado ${seleccionado}`;
    } else if (cajon.estado === "reservado") {
      return `${baseClass} reservado ${seleccionado}`;
    }
    
    return `${baseClass} ${seleccionado}`;
  };

  // Aplicar modificación de precio
  const handleAplicarModificacionPrecio = () => {
    if (precioModificado < 0) {
      alert("El precio no puede ser negativo");
      return;
    }

    setPedido(prev => ({
      ...prev,
      totalPedido: precioModificado,
      saldoPendiente: precioModificado - Number(prev.abonoInicial || 0)
    }));
    setMostrarModificarPrecio(false);
    setMotivoModificacion("");
  };

  // ✅ Guardar pedido (enviar al backend)
  const handleGuardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarCampos()) {
      alert("⚠️ Corrige los errores antes de guardar.");
      return;
    }

    try {
      setCargando(true);
      const respuesta = await fetch("http://localhost:3000/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cliente, 
          pedido: {
            ...pedido,
            totalPedido: precioModificado, // Usar el precio modificado
            observaciones: motivoModificacion 
              ? `${pedido.observaciones || ''}\nMODIFICACIÓN DE PRECIO: ${motivoModificacion} - Precio original: $${calcularTotalPrendas().toLocaleString()}, Precio final: $${precioModificado.toLocaleString()}`
              : pedido.observaciones
          },
          id_cajon: cajonSeleccionado,
          codigos_seleccionados: codigosSeleccionados,
          prendas: prendasTemporales
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        alert("✅ Pedido guardado exitosamente.");
        console.log("Respuesta del servidor:", data);

        // Resetear formularios
        setCliente({
          nombre: "",
          cedula: "",
          telefono: "",
          direccion: "",
          email: "",
        });
        setPedido({
          fechaInicio: "",
          fechaEntrega: "",
          estado: "",
          observaciones: "",
          abonoInicial: "",
          totalPedido: 0,
          saldoPendiente: 0,
        });
        setCajonSeleccionado(null);
        setCodigosSeleccionados([]);
        setPrendasTemporales([]);
        setPrecioModificado(0);
        setMotivoModificacion("");
        setErrores({});
        
        // Recargar datos para actualizar estados de cajones y códigos
        cargarDatos();
      } else {
        alert(`❌ Error: ${data.message || "No se pudo guardar el pedido."}`);
      }
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert("❌ Error al conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  // Si venimos desde "Nuevo Pedido" (clientes), rellenar cliente automáticamente
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nuevoPedidoCliente");
      if (raw) {
        const data = JSON.parse(raw);
        setCliente({
          nombre: data.nombre || "",
          cedula: data.cedula || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
          email: data.email || ""
        });
        localStorage.removeItem("nuevoPedidoCliente");
      }
    } catch (err) {
      console.error("Error leyendo nuevoPedidoCliente:", err);
    }
  }, []);
  
  // 🎨 Render
  return (
    <div className="pedidos-page">
      <h1 style={{ marginBottom: 12 }}>Gestión de Pedidos</h1>

      <div className="pedido-top">
        {/* Formulario principal */}
        <div className="pedido-form card">
          {/* Información del Cliente */}
          <div className="cliente-form">
            <h2>Información del Cliente</h2>
            {["nombre", "cedula", "telefono", "direccion", "email"].map(
              (campo) => (
                <div className="field" key={campo}>
                  <label>
                    {campo.charAt(0).toUpperCase() + campo.slice(1)}:
                  </label>
                  <input
                    type={campo === "email" ? "email" : "text"}
                    name={campo}
                    value={(cliente as any)[campo]}
                    onChange={handleInputCliente}
                    placeholder={`Ingrese ${campo}`}
                  />
                  {errores[campo] && (
                    <p className="error">{errores[campo]}</p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Información del Pedido */}
          <h2>Información del Pedido</h2>

          <div className="field">
            <label>Fecha de Inicio:</label>
            <input
              type="date"
              name="fechaInicio"
              value={pedido.fechaInicio}
              onChange={handleInputPedido}
            />
            {errores.fechaInicio && (
              <p className="error">{errores.fechaInicio}</p>
            )}
          </div>

          <div className="field">
            <label>Fecha de Entrega:</label>
            <input
              type="date"
              name="fechaEntrega"
              value={pedido.fechaEntrega}
              onChange={handleInputPedido}
            />
            {errores.fechaEntrega && (
              <p className="error">{errores.fechaEntrega}</p>
            )}
          </div>

          <div className="field">
            <label>Estado:</label>
            <select
              name="estado"
              value={pedido.estado}
              onChange={handleInputPedido}
            >
              <option value="">Seleccione una opción</option>
              <option value="En proceso">En proceso</option>
              {/* <option value="Finalizado">Finalizado</option> */}
            </select>
            {errores.estado && <p className="error">{errores.estado}</p>}
          </div>

          <div className="field">
            <label>Observaciones:</label>
            <textarea
              name="observaciones"
              value={pedido.observaciones}
              onChange={handleInputPedido}
              placeholder="Observaciones adicionales del pedido"
            />
          </div>

          <div className="field">
            <label>Abono Inicial (Opcional):</label>
            <input
              type="number"
              name="abonoInicial"
              value={pedido.abonoInicial}
              onChange={handleInputPedido}
              placeholder="0"
            />
            {errores.abonoInicial && (
              <p className="error">{errores.abonoInicial}</p>
            )}
          </div>

          {/* Resumen del pedido con opción de modificar precio */}
          <div className="resumen-pedido">
            <div className="precio-header">
              <h3>Total del Pedido</h3>
              <button 
                type="button"
                className="btn-modificar-precio"
                onClick={() => setMostrarModificarPrecio(true)}
              >
                <FaEdit /> Modificar

              </button>
            </div>
            
            <p><strong>Total calculado:</strong> ${calcularTotalPrendas().toLocaleString()}</p>
            <p><strong>Total final:</strong> ${precioModificado.toLocaleString()}</p>
            {precioModificado !== calcularTotalPrendas() && (
              <p className="diferencia-precio">
                <strong>Diferencia:</strong> 
                <span className={precioModificado < calcularTotalPrendas() ? "rebaja" : "aumento"}>
                  {precioModificado < calcularTotalPrendas() ? " -" : " +"}
                  ${Math.abs(precioModificado - calcularTotalPrendas()).toLocaleString()}
                </span>
              </p>
            )}
            <p><strong>Abono inicial:</strong> ${Number(pedido.abonoInicial || 0).toLocaleString()}</p>
            <p><strong>Saldo pendiente:</strong> ${pedido.saldoPendiente.toLocaleString()}</p>
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 10 }}
            onClick={handleGuardar}
            disabled={cargando}
          >
            {cargando ? "Guardando..." : "Guardar Pedido"}
          </button>
        </div>

        {/* Cajones y Códigos */}
        <div className="cajones-codigos-container">
          {/* Cajones - Cargados dinámicamente */}
          <div className="cajones-section card">
            <h2>Seleccionar Cajón</h2>
            {errores.cajon && <p className="error" style={{textAlign: 'center'}}>{errores.cajon}</p>}
            
            {cargandoCajones ? (
              <div className="cargando">Cargando cajones...</div>
            ) : (
              <div className="cajones-grid">
                {cajones.map((cajon) => {
                  const infoCajon = getInfoCajon(cajon.id_cajon);
                  return (
                    <div 
                      key={cajon.id_cajon}
                      className={getClaseCajon(cajon)}
                      onClick={() => handleSeleccionarCajon(cajon.id_cajon)}
                    >
                      <div className="cajon-nombre">{infoCajon.nombre}</div>
                      <div className="cajon-rango">{infoCajon.rango}</div>
                      {cajon.estado && (
                        <div className={`estado-cajon ${cajon.estado}`}>
                          {cajon.estado}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Códigos del cajón seleccionado */}
          {cajonSeleccionado && (
            <div className="codigos-section card">
              <h2>
                Códigos Disponibles - {getInfoCajon(cajonSeleccionado).nombre}
              </h2>
              {errores.codigos && <p className="error">{errores.codigos}</p>}
              
              {cargandoCodigos ? (
                <div className="cargando">Cargando códigos...</div>
              ) : (
                <div className="codigos-grid">
                  {codigosFiltrados.map((codigo) => (
                    <label 
                      key={codigo.id_codigo} 
                      className={`codigo-item ${codigo.estado === "ocupado" ? "codigo-ocupado" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={codigosSeleccionados.includes(codigo.id_codigo)}
                        onChange={() => handleSeleccionarCodigo(codigo.id_codigo)}
                      />
                      <span className={`codigo-numero ${codigo.estado === "ocupado" ? "ocupado" : ""}`}>
                        {codigo.codigo_numero}
                        {codigo.estado === "ocupado" && " (Ocupado)"}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              
              {codigosFiltrados.length === 0 && !cargandoCodigos && (
                <p className="sin-codigos">No hay códigos disponibles para este cajón</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sección de prendas */}
      <div className="prendas-section card">
        <h2>Gestión de Prendas</h2>
        {errores.prendas && <p className="error">{errores.prendas}</p>}
        
        {/* Lista de prendas temporales */}
        {prendasTemporales.length > 0 && (
          <div className="prendas-lista">
            <table className="prendas-table">
              <thead>
                <tr>
                  <th>Prenda</th>
                  <th>Cantidad</th>
                  <th>Arreglos</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prendasTemporales.map((prenda, index) => (
                  <tr key={index}>
                    <td>{prenda.tipo}</td>
                    <td>{prenda.cantidad}</td>
                    <td>
                      {(prenda.arreglos || []).map((arreglo, i) => (
                        <div key={i} className="arreglo-mini">
                          {arreglo.tipo === 'combinacion' 
                            ? `${arreglo.nombre_ajuste} ${arreglo.nombre_accion}`
                            : arreglo.tipo === 'ajuste'
                            ? arreglo.nombre_ajuste
                            : arreglo.nombre_accion
                          } - ${arreglo.precio.toLocaleString()}
                        </div>
                      ))}
                    </td>
                    <td>
                      ${((prenda.arreglos || []).reduce((total, arreglo) => 
                        total + arreglo.precio, 0) * (prenda.cantidad || 1)
                      ).toLocaleString()}
                    </td>
                    <td>
                      <div className="acciones-prenda">
                        <button 
                          className="btn-editar"
                          onClick={() => handleEditarPrenda(index)}
                          title="Editar prenda"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => handleEliminarPrendaTemporal(index)}
                          title="Eliminar prenda"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Total del pedido */}
            <div className="total-pedido">
              <h3>Total Calculado: ${calcularTotalPrendas().toLocaleString()}</h3>
              <h3>Total Final: ${precioModificado.toLocaleString()}</h3>
            </div>
          </div>
        )}
        
        <button 
          className="btn-primary" 
          onClick={() => {
            setPrendaEditando(null);
            setMostrarModalPrenda(true);
          }}
        >
          Agregar Prenda
        </button>
      </div>

      {/* Modal de prenda */}
      <ModalPrenda
        isOpen={mostrarModalPrenda}
        onClose={() => {
          setMostrarModalPrenda(false);
          setPrendaEditando(null);
        }}
        onAgregarPrenda={handleAgregarPrendaTemporal}
        ajustes={ajustes}
        acciones={acciones}
        combinaciones={combinaciones}
        prendaEditando={prendaEditando !== null ? prendasTemporales[prendaEditando] : null}
      />

      {/* Modal para modificar precio */}
      {mostrarModificarPrecio && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Modificar Precio Final</h2>
            
            <div className="form-group">
              <label>Total Calculado:</label>
              <input
                type="text"
                value={`$${calcularTotalPrendas().toLocaleString()}`}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label>Nuevo Precio Final *</label>
              <input
                type="number"
                value={precioModificado}
                onChange={(e) => setPrecioModificado(Number(e.target.value))}
                min="0"
                step="0.01"
              />
              {errores.precioModificado && (
                <p className="error">{errores.precioModificado}</p>
              )}
            </div>

            <div className="form-group">
              <label>Motivo de la modificación (opcional)</label>
              <textarea
                value={motivoModificacion}
                onChange={(e) => setMotivoModificacion(e.target.value)}
                placeholder="Ej: Descuento por cliente frecuente, promoción especial, etc."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModificarPrecio(false);
                  setPrecioModificado(calcularTotalPrendas());
                  setMotivoModificacion("");
                }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleAplicarModificacionPrecio}
              >
                Aplicar Cambio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}