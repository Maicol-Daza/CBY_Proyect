import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import "../styles/pedidos.css";
import "../styles/inputMoneda.css";
import { obtenerCajones, type Cajon } from "../services/cajonesService";
import { obtenerCodigos, type Codigo } from "../services/codigosService";
import { obtenerAjustes, type Ajuste } from "../services/ajustesService";
import { obtenerAcciones, type Accion } from "../services/accionesService";
import { obtenerAjustesAccion, type AjusteAccion } from "../services/ajustesAccionService";
import ModalPrenda from "../components/ModalPrenda";
import ModalFactura from "../components/ModalFactura";
import validators from '../utils/validators';
import { type Prenda } from "../services/prendasService";
import { FaEdit, FaTrash, FaBox, FaSearch, FaUser, FaIdCard, FaPhone, FaMapMarkerAlt, FaEnvelope, FaCalendarAlt, FaClock, FaCheckCircle, FaDollarSign, FaExclamationTriangle, FaShoppingCart, FaFileInvoice, FaPercent } from "react-icons/fa";
import { obtenerClientes, type Cliente as ClienteService } from "../services/clientesService";
import { formatCOP } from '../utils/formatCurrency';
import { InputMoneda } from "./InputMoneda";

interface Pedido {
  fechaInicio: string;
  fechaEntrega: string;
  estado: string;
  observaciones: string;
  abonoInicial: number | string;
  abonoObservaciones?: string;
  totalPedido: number;
  saldoPendiente: number;
  garantia?: string;  
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

interface PedidoEntrega {
  id_pedido: number;
  cliente_nombre: string;
  cliente_cedula: string;
  total_pedido: number;
  abono: number;
  saldo: number;
  estado: string;
  fecha_pedido: string;
  fecha_entrega: string;
}

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

const PEDIDO_STORAGE_KEY = "pedido_en_proceso";

export default function Pedidos() {
  //ESTADO DE PEDIDO
  const [pedido, setPedido] = useState<Pedido>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.pedido || getDefaultPedido();
    }
    return getDefaultPedido();
  });

  //ESTADO DE CLIENTE
  const [cliente, setCliente] = useState<Cliente>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.cliente || getDefaultCliente();
    }
    return getDefaultCliente();
  });

  //ESTADOS DE ENTREGA (SIN DUPLICADOS)
  const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
  const [pedidosLista, setPedidosLista] = useState<PedidoEntrega[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoEntrega | null>(null);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [abonoEntrega, setAbonoEntrega] = useState<number>(0);
  const [cargandoEntrega, setCargandoEntrega] = useState(false);
  const [errorEntrega, setErrorEntrega] = useState<string>("");

  //ESTADOS DE FACTURA (AGREGADOS)
  const [mostrarModalFactura, setMostrarModalFactura] = useState(false);
  const [datosFactura, setDatosFactura] = useState<any>(null);

  //ESTADO DE CONFIRMACIÓN DE ENTREGA
  const [mostrarConfirmacionEntrega, setMostrarConfirmacionEntrega] = useState(false);

  //BÚSQUEDA DE CLIENTES
  const [clientesLista, setClientesLista] = useState<ClienteService[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [sugerenciasClientes, setSugerenciasClientes] = useState<ClienteService[]>([]);
  const [clienteCargado, setClienteCargado] = useState(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.clienteCargado || false;
    }
    return false;
  });

  //DATOS DEL FORMULARIO
  const [cajones, setCajones] = useState<Cajon[]>([]);
  const [codigos, setCodigos] = useState<Codigo[]>([]);
  const [codigosFiltrados, setCodigosFiltrados] = useState<Codigo[]>([]);
  const [cajonSeleccionado, setCajonSeleccionado] = useState<number | null>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.cajonSeleccionado || null;
    }
    return null;
  });
  const [codigosSeleccionados, setCodigosSeleccionados] = useState<number[]>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.codigosSeleccionados || [];
    }
    return [];
  });

  //PRENDAS
  const [mostrarModalPrenda, setMostrarModalPrenda] = useState(false);
  const [prendasTemporales, setPrendasTemporales] = useState<Prenda[]>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.prendasTemporales || [];
    }
    return [];
  });
  const [prendaEditando, setPrendaEditando] = useState<number | null>(null);

  //AJUSTES Y ACCIONES
  const [ajustes, setAjustes] = useState<Ajuste[]>([]);
  const [acciones, setAcciones] = useState<Accion[]>([]);
  const [combinaciones, setCombinaciones] = useState<AjusteAccion[]>([]);

  //CARGANDO
  const [cargandoCajones, setCargandoCajones] = useState(false);
  const [cargandoCodigos, setCargandoCodigos] = useState(false);
  const [cargandoAjustes, setCargandoAjustes] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [cargando, setCargando] = useState(false);

  //ESTADOS DE IMAGEN (AGREGAR AQUÍ)
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  //MODIFICACIÓN DE PRECIO
  const [mostrarModificarPrecio, setMostrarModificarPrecio] = useState(false);
  const [precioModificado, setPrecioModificado] = useState(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.precioModificado || 0;
    }
    return 0;
  });
  const [motivoModificacion, setMotivoModificacion] = useState("");

  //FUNCIONES AUXILIARES
  function getDefaultPedido(): Pedido {
    return {
      fechaInicio: "",
      fechaEntrega: "",
      estado: "En proceso",
      observaciones: "",
      abonoInicial: "",
      abonoObservaciones: "",
      totalPedido: 0,
      saldoPendiente: 0,
      garantia: "",  
    };
  }

  function getDefaultCliente(): Cliente {
    return {
      nombre: "",
      cedula: "",
      telefono: "",
      direccion: "",
      email: "",
    };
  }

  // Obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayString = () => new Date().toISOString().slice(0, 10);

  // Handler para cambiar la imagen (preview)
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagenFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagenPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagenFile(null);
    setImagenPreview(null);
  };

  // Cargar todos los datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  // Guardar en localStorage cada vez que cambien los datos importantes
  useEffect(() => {
    const datosParaGuardar = {
      pedido,
      cliente,
      cajonSeleccionado,
      codigosSeleccionados,
      prendasTemporales,
      precioModificado,
      clienteCargado
    };
    localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(datosParaGuardar));
  }, [pedido, cliente, cajonSeleccionado, codigosSeleccionados, prendasTemporales, precioModificado, clienteCargado]);

  // Cargar lista de clientes para la mini búsqueda (opcional)
  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const datos = await obtenerClientes();
        setClientesLista(datos || []);
      } catch (err) {
        console.warn("No se pudieron cargar clientes para búsqueda rápida:", err);
      }
    };

    cargarClientes();
  }, []);

  // Cargar pedidos cuando se abre el modal de entrega
  useEffect(() => {
    if (mostrarModalEntrega) {
      cargarPedidosParaEntrega();
    }
  }, [mostrarModalEntrega]);

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

  // Función para cargar pedidos listos para entrega
  const cargarPedidosParaEntrega = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/pedidos");
      if (response.ok) {
        const data = await response.json();
        // Mostrar TODOS los pedidos EXCEPTO los ya entregados
        const pedidosNoEntregados = data.filter((pedido: any) => 
          pedido.estado !== 'entregado' && pedido.estado !== 'cancelado'
        );
        setPedidosLista(pedidosNoEntregados);
      }
    } catch (error) {
      console.error("Error al cargar pedidos:", error);
      alert("Error al cargar los pedidos");
    }
  };

  // Función para mostrar modal de confirmación de entrega
  const handleEntregarPedido = () => {
    if (!pedidoSeleccionado) return;
    setMostrarConfirmacionEntrega(true);
  };

  // Función para confirmar la entrega del pedido
  const confirmarEntregaPedido = async () => {
    if (!pedidoSeleccionado) return;

    setMostrarConfirmacionEntrega(false);
    setErrorEntrega("");

    const saldoPendiente = Number(pedidoSeleccionado.saldo);
    const abonoIngresado = Number(abonoEntrega);

    if (abonoIngresado < 0) {
      setErrorEntrega(`El abono no puede ser negativo.`);
      return;
    }

    if (abonoIngresado > saldoPendiente) {
      setErrorEntrega(
        `El abono ingresado (${formatCOP(abonoIngresado)}) no puede ser mayor al saldo pendiente (${formatCOP(saldoPendiente)}). Ingrese un monto igual o menor.`
      );
      return;
    }

    const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
    const idUsuario = usuarioGuardado?.id_usuario || 1;

    try {
      setCargandoEntrega(true);

      // Si la entrega ocurre antes de la fecha prevista, usar la fecha actual.
      // Parsear robustamente la fecha original (ISO 'YYYY-MM-DD' o 'DD/MM/YYYY').
      const todayStr = getTodayString();
      const todayDate = new Date(todayStr + "T00:00:00");
      const fechaOriginalRaw = pedidoSeleccionado.fecha_entrega || "";

      const parseToDate = (s: string): Date | null => {
        if (!s) return null;
        // Si contiene '-' intentar parseo ISO
        if (s.includes("-")) {
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            d.setHours(0,0,0,0);
            return d;
          }
        }
        // Si contiene '/', asumir formato DD/MM/YYYY
        if (s.includes("/")) {
          const parts = s.split('/').map(p => parseInt(p, 10));
          if (parts.length === 3) {
            const [d, m, y] = parts;
            const dt = new Date(y, m - 1, d);
            if (!isNaN(dt.getTime())) {
              dt.setHours(0,0,0,0);
              return dt;
            }
          }
        }
        // Fallback: try Date parse
        const fallback = new Date(s);
        if (!isNaN(fallback.getTime())) {
          fallback.setHours(0,0,0,0);
          return fallback;
        }
        return null;
      };

      const fechaOriginalDate = parseToDate(fechaOriginalRaw);

      // SIEMPRE usar la fecha actual como fecha de entrega real
      // La fecha de entrega es cuando realmente se entregó el pedido
      let fechaEntregaEnviar = todayStr;

      const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoSeleccionado.id_pedido}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estado: "Entregado",
          abonoEntrega: abonoEntrega > 0 ? abonoEntrega : 0,
          id_usuario: idUsuario,
          fecha_entrega: fechaEntregaEnviar
        }),
      });

      if (response.ok) {
        //OBTENER datos completos del pedido para la factura
        const responsePedido = await fetch(`http://localhost:3000/api/pedidos/${pedidoSeleccionado.id_pedido}`);
        const pedidoCompleto = await responsePedido.json();
        // Forzar que la fecha de entrega mostrada en la factura sea la que enviamos
        // (fechaEntregaEnviar viene del scope superior)
        if (pedidoCompleto) {
          pedidoCompleto.fecha_entrega = pedidoCompleto.fecha_entrega || fechaEntregaEnviar;
        }

        //Mostrar modal de factura usando la fecha de entrega enviada si es necesario
        setDatosFactura({
          ...pedidoSeleccionado,
          prendas: pedidoCompleto.prendas || [],
          ...pedidoCompleto,
          fecha_entrega: pedidoCompleto.fecha_entrega || fechaEntregaEnviar
        });

        // Actualizar la lista local de pedidos: marcar como Entregado y fijar fecha
        setPedidosLista(prev => prev.map(p => {
          if (p.id_pedido === pedidoSeleccionado.id_pedido) {
            return {
              ...p,
              estado: 'Entregado',
              fecha_entrega: pedidoCompleto.fecha_entrega || fechaEntregaEnviar
            };
          }
          return p;
        }).filter(p => p.estado !== 'entregado'));
        setMostrarModalFactura(true);

        // Cerrar modal de entrega
        setMostrarModalEntrega(false);
        setPedidoSeleccionado(null);
        setAbonoEntrega(0);
        setBusquedaPedido("");
        setErrorEntrega("");
        
        cargarPedidosParaEntrega();
      } else {
        const error = await response.json();
        setErrorEntrega(error.message || "No se pudo entregar el pedido");
      }
    } catch (error) {
      console.error("Error al entregar pedido:", error);
      setErrorEntrega("Error al conectar con el servidor");
    } finally {
      setCargandoEntrega(false);
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
    const nuevoTotal = totalPrendas;

    setPedido(prev => {
      // Si hay un precio modificado activo, conservarlo como total final
      const totalFinal = (precioModificado && precioModificado > 0) ? precioModificado : nuevoTotal;
      return {
        ...prev,
        totalPedido: totalFinal,
        saldoPendiente: totalFinal - Number(prev.abonoInicial || 0)
      };
    });
  }, [prendasTemporales]);

  // Agregar esta función de validación de fechas
  const validarFechas = (): string => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaInicio = pedido.fechaInicio ? new Date(pedido.fechaInicio) : null;
    const fechaEntrega = pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : null;

    //Solo validar que fecha de entrega no sea anterior a fecha de inicio
    if (fechaInicio && fechaEntrega && fechaEntrega < fechaInicio) {
      return "La fecha de entrega no puede ser anterior a la fecha de inicio.";
    }

    return "";
  };

  // Reemplazar la función validarCampos - VERSIÓN ESTRICTA (lista blanca)
  const validarCampos = (): boolean => {
    const nuevosErrores: Errores = {};

    // Nombre (obligatorio)
    if (!cliente.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio.';
    } else if (!validators.isValidName(cliente.nombre)) {
      nuevosErrores.nombre = validators.ERR.nombre;
    }

    // Cédula (obligatorio)
    if (!cliente.cedula.trim()) {
      nuevosErrores.cedula = 'La cédula es obligatoria.';
    } else if (!validators.isValidCedula(cliente.cedula)) {
      nuevosErrores.cedula = validators.ERR.cedula;
    }

    // Teléfono (obligatorio) - 10 dígitos (Colombia)
    if (!cliente.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono es obligatorio.';
    } else if (!validators.isValidTelefono(cliente.telefono, 10)) {
      nuevosErrores.telefono = validators.ERR.telefono;
    }

    // Dirección (opcional)
    if (cliente.direccion && !validators.isValidDireccion(cliente.direccion)) {
      nuevosErrores.direccion = validators.ERR.direccion;
    }

    // Email (opcional)
    if (cliente.email && !validators.isValidEmail(cliente.email)) {
      nuevosErrores.email = validators.ERR.email;
    }

    // Validaciones de fechas
    if (!pedido.fechaInicio) {
      nuevosErrores.fechaInicio = 'Debe seleccionar una fecha de inicio.';
    }

    if (!pedido.fechaEntrega) {
      nuevosErrores.fechaEntrega = 'Debe seleccionar una fecha de entrega.';
    }

    if (pedido.fechaInicio && pedido.fechaEntrega) {
      const errorFechas = validarFechas();
      if (errorFechas) nuevosErrores.fechas = errorFechas;
    }

    // Nota: se removieron validaciones estrictas sobre el abono (permitir manejo flexible desde backend)

    // Cajón y códigos
    if (cajonSeleccionado === null) nuevosErrores.cajon = 'Debe seleccionar un cajón.';
    if (codigosSeleccionados.length === 0) nuevosErrores.codigos = 'Debe seleccionar al menos un código.';

    const codigosOcupadosSeleccionados = codigosSeleccionados.filter(id => {
      const codigo = codigos.find(c => c.id_codigo === id);
      return codigo?.estado === 'ocupado';
    });
    if (codigosOcupadosSeleccionados.length > 0) nuevosErrores.codigos = 'No puede seleccionar códigos que están ocupados.';

    if (prendasTemporales.length === 0) nuevosErrores.prendas = 'Debe agregar al menos una prenda.';
    if (precioModificado < 0) nuevosErrores.precioModificado = 'El precio no puede ser negativo.';

    //VALIDACIÓN: El abono no debe ser mayor al total
    const totalActual = (precioModificado && precioModificado > 0) ? precioModificado : calcularTotalPrendas();
    const abonoActual = Number(pedido.abonoInicial || 0);
    
    if (abonoActual > totalActual) {
      nuevosErrores.abonoInicial = `El abono (${formatCOP(abonoActual)}) no puede ser mayor al total del pedido (${formatCOP(totalActual)}).`;
    }

    //VALIDACIÓN DE GARANTÍA - OBLIGATORIA
    if (!pedido.garantia || pedido.garantia.toString().trim() === '') {
      nuevosErrores.garantia = 'Debe especificar los días de garantía.';
    } else {
      const garantiaNum = Number(pedido.garantia);
      if (isNaN(garantiaNum) || garantiaNum < 1 || garantiaNum > 30) {
        nuevosErrores.garantia = 'La garantía debe ser entre 1 y 30 días.';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Manejo de inputs cliente
  const handleInputCliente = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitized = value;
    if (name === 'nombre') sanitized = value.replace(/[^A-Za-z ]/g, '');
    if (name === 'cedula') sanitized = value.replace(/[^0-9.]/g, '');
    if (name === 'telefono') sanitized = value.replace(/[^0-9]/g, '');
    if (name === 'direccion') sanitized = value.replace(/[^A-Za-z0-9 #\-]/g, '');
    if (name === 'email') sanitized = value.replace(/[^A-Za-z0-9@._\-]/g, '');

    setCliente({ ...cliente, [name]: sanitized });

    // Limpiar error de ese campo si ahora es válido
    setErrores(prev => {
      const copy = { ...prev };
      if (name === 'nombre' && validators.isValidName(sanitized)) delete copy.nombre;
      if (name === 'cedula' && validators.isValidCedula(sanitized)) delete copy.cedula;
      if (name === 'telefono' && validators.isValidTelefono(sanitized, 10)) delete copy.telefono;
      if (name === 'email' && (sanitized === '' || validators.isValidEmail(sanitized))) delete copy.email;
      if (name === 'direccion' && (sanitized === '' || validators.isValidDireccion(sanitized))) delete copy.direccion;
      return copy;
    });
  };

  // Mini búsqueda: filtrar sugerencias en vivo
  const handleBusquedaCliente = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusquedaCliente(val);
    
    if (!val.trim()) {
      // Si está vacío, mostrar los 5 clientes más recientes
      const clientesRecientes = clientesLista.slice(0, 5);
      setSugerenciasClientes(clientesRecientes);
      return;
    }
    
    const term = val.toLowerCase();
    const filtradas = clientesLista
      .filter(c => 
        c.nombre?.toLowerCase().includes(term) || 
        c.nuip?.includes(term)
      )
      .slice(0, 5); // Limitar a 5 resultados
  
    setSugerenciasClientes(filtradas);
  };

  //Mostrar 5 clientes al hacer clic
  const handleFocusCliente = () => {
    const clientesRecientes = clientesLista.slice(0, 5);
    setSugerenciasClientes(clientesRecientes);
  };

  // Usar cliente seleccionado para rellenar el formulario de pedido
  const handleUsarCliente = (c: ClienteService) => {
    setCliente({
      nombre: c.nombre || "",
      cedula: c.nuip || "",
      telefono: c.telefono || "",
      direccion: c.direccion || "",
      email: c.email || "",
    });
    setBusquedaCliente("");
    setSugerenciasClientes([]);
    setClienteCargado(true); //Marcar cliente como cargado
    const firstInput = document.querySelector('.pedido-form input[name="fechaInicio"]') as HTMLInputElement | null;
    if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Manejo de inputs pedido
  const handleInputPedido = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Calcular el nuevo estado del pedido de forma inmediata
    const updatedPedido = {
      ...pedido,
      [name]: name === "abonoInicial" || name === "totalPedido" ? Number(value) : value,
    } as Pedido;

    // Recalcular saldo pendiente si cambia abono o total
    if (name === "abonoInicial" || name === "totalPedido") {
      updatedPedido.saldoPendiente =
        Number(updatedPedido.totalPedido) - Number(updatedPedido.abonoInicial || 0);
    }

    setPedido(updatedPedido);

    // Validación inmediata de fechas para dar retroalimentación instantánea
    setErrores((prev) => {
      const copy = { ...prev } as Errores;
      const today = getTodayString();

      if (name === "fechaInicio") {
        // fechaInicio no puede ser menor a hoy
        if (value && value < today) {
          copy.fechaInicio = 'La fecha de inicio no puede ser anterior a la fecha de hoy.';
        } else {
          delete copy.fechaInicio;

          // Si hay fechaEntrega y ahora es menor a la nueva fechaInicio, marcar error en entrega
          if (updatedPedido.fechaEntrega && updatedPedido.fechaEntrega < (value || today)) {
            copy.fechaEntrega = 'La fecha de entrega no puede ser anterior a la fecha de inicio.';
          } else {
            delete copy.fechaEntrega;
          }
        }
      }

      if (name === "fechaEntrega") {
        const minEntrega = updatedPedido.fechaInicio ? updatedPedido.fechaInicio : today;
        if (value && value < minEntrega) {
          copy.fechaEntrega = 'La fecha de entrega no puede ser anterior a la fecha de inicio.';
        } else {
          delete copy.fechaEntrega;
        }
      }

      return copy;
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
      const subtotalPrenda = (prenda.arreglos || []).reduce((subtotal, arreglo) => {
        const precio = Number(arreglo?.precio ?? 0);
        return subtotal + (isNaN(precio) ? 0 : precio);
      }, 0);

      const cantidad = Number(prenda?.cantidad ?? 1);
      const cantidadSegura = isNaN(cantidad) || cantidad <= 0 ? 1 : cantidad;

      return total + subtotalPrenda * cantidadSegura;
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
    
    // Solo aplicar clases de estado para styling
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

  // Agregar esta función cerca de handleAplicarModificacionPrecio
  const aplicarDescuentoAutomatico = (porcentaje: number) => {
    const totalCalculado = calcularTotalPrendas();
    const descuento = totalCalculado * (porcentaje / 100);
    const nuevoPrecio = totalCalculado - descuento;
    
    setPrecioModificado(nuevoPrecio);
    setMotivoModificacion(`Descuento automático del ${porcentaje}%`);

    // Aplicar inmediatamente al pedido y recalcular saldo según abono actual
    setPedido(prev => ({
      ...prev,
      totalPedido: nuevoPrecio,
      saldoPendiente: nuevoPrecio - Number(prev.abonoInicial || 0)
    }));
  };


  //  Guardar pedido (enviar al backend)
  const handleGuardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarCampos()) {
      alert("⚠ Completa todos los campos antes de guardar.");
      return;
    }

    // OBTENER usuario del localStorage
    const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
    const idUsuario = usuarioGuardado?.id_usuario || 1;

    console.log("Guardando pedido con usuario:", idUsuario);

    try {
      setCargando(true);

      // Determinar el total final que se guardará: usar precioModificado solo si es válido (>0)
      const totalFinal = (precioModificado && precioModificado > 0)
        ? precioModificado
        : (pedido.totalPedido || calcularTotalPrendas());

      const respuesta = await fetch("http://localhost:3000/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cliente, 
          pedido: {
            ...pedido,
            totalPedido: totalFinal,
            garantia: pedido.garantia || null,  
            observaciones_abono: pedido.abonoObservaciones || null,
            observaciones: motivoModificacion 
              ? `${pedido.observaciones || ''}\nMODIFICACIÓN DE PRECIO: ${motivoModificacion} - Precio original: $${calcularTotalPrendas().toLocaleString()}, Precio final: $${totalFinal.toLocaleString()}`
              : pedido.observaciones
        },
        id_cajon: cajonSeleccionado,
        codigos_seleccionados: codigosSeleccionados,
        prendas: prendasTemporales,
        id_usuario: idUsuario
      }),
    });

    const data = await respuesta.json();

    if (respuesta.ok) {
      alert("✓ Pedido guardado exitosamente.");
      console.log("Respuesta del servidor:", data);

      // Resetear formularios y limpiar localStorage
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
        estado: "En proceso",
        observaciones: "",
        abonoInicial: "",
        abonoObservaciones: "",
        totalPedido: 0,
        saldoPendiente: 0,
        garantia: "",  
      });
      setCajonSeleccionado(null);
      setCodigosSeleccionados([]);
      setPrendasTemporales([]);
      setPrecioModificado(0); //Aquí se resetea correctamente
      setMotivoModificacion(""); //Limpiar motivo también
      setClienteCargado(false); //Resetear estado de cliente cargado
      setErrores({});
      setImagenFile(null);
      setImagenPreview(null);
      
      // Limpiar localStorage después de guardar exitosamente
      localStorage.removeItem(PEDIDO_STORAGE_KEY);
      
      // Recargar datos para actualizar estados de cajones y códigos
      cargarDatos();
    } else {
      alert(`Error: ${data.message || "No se pudo guardar el pedido."}`);
    }
  } catch (error) {
    console.error("Error al guardar pedido:", error);
    alert("Error al conectar con el servidor.");
  } finally {
    setCargando(false);
  }
};

  // Agregar esta función después de handleGuardar
  const handleLimpiarTodo = () => {
    if (window.confirm("¿Estás seguro de que deseas limpiar todo el formulario? Esta acción no se puede deshacer.")) {
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
        abonoObservaciones: "",
        totalPedido: 0,
        saldoPendiente: 0,
      });
      setCajonSeleccionado(null);
      setCodigosSeleccionados([]);
      setPrendasTemporales([]);
      setPrecioModificado(0);
      setMotivoModificacion("");
      setErrores({});
      setImagenFile(null);
      setImagenPreview(null);
      setClienteCargado(false); //Resetear estado de cliente cargado
      localStorage.removeItem(PEDIDO_STORAGE_KEY);
      alert("✓ Formulario limpiado correctamente");
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
        setClienteCargado(true); //Marcar cliente como cargado
        localStorage.removeItem("nuevoPedidoCliente");
      }
    } catch (err) {
      console.error("Error leyendo nuevoPedidoCliente:", err);
    }
  }, []);
  
  // AGREGAR ESTA FUNCIÓN: Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      const elemento = document.querySelector('.cliente-mini-search');
      if (elemento && !elemento.contains(e.target as Node)) {
        setSugerenciasClientes([]);
        setBusquedaCliente("");
      }
    };

    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  //  Render
  return (
    <div className="pedidos-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Gestión de Pedidos</h1>
        <button
          className="btn-primary"
          onClick={() => setMostrarModalEntrega(true)}
          style={{
            padding: "12px 24px",
            fontSize: "1rem",
            backgroundColor: "#3b82f6"
          }}
        >
          <FaBox style={{ marginRight: "8px" }} /> Entrega de Pedidos
        </button>
      </div>

      <div className="pedido-top">
        {/* Formulario principal */}
        <div className="pedido-form card">
          {/* Información del Cliente */}
          <div className="cliente-form">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0 }}><FaUser style={{ marginRight: "8px" }} /> Información del Cliente</h2>
              {clienteCargado && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setClienteCargado(false);
                    setCliente(getDefaultCliente());
                    setBusquedaCliente("");
                    setSugerenciasClientes([]);
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Cambiar Cliente
                </button>
              )}
            </div>
            {/* Mini búsqueda rápida de clientes */}
            <div className="cliente-mini-search">
              <input
                type="text"
                placeholder="Buscar cliente rápido..."
                value={busquedaCliente}
                onChange={handleBusquedaCliente}
                onFocus={handleFocusCliente}
                className="input-mini-busqueda"
              />
              {sugerenciasClientes.length > 0 && (
                <div className="sugerencias-clientes">
                  {sugerenciasClientes.map((c) => (
                    <div key={c.id_cliente} className="sugerencia-row">
                      <div className="sugerencia-info">
                        <strong>{c.nombre}</strong>
                        <div className="sugerencia-meta">{c.nuip} · {c.email} · {c.telefono} </div>
                      </div>
                      <div>
                        <button type="button" className="btn-primary btn-usar-cliente" onClick={() => handleUsarCliente(c)}>Usar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {["nombre", "cedula", "telefono", "direccion", "email"].map(
              (campo) => (
                <div className="field" key={campo}>
                  <label>
                    {campo === "nombre" && <FaUser style={{ marginRight: "6px" }} />}
                    {campo === "cedula" && <FaIdCard style={{ marginRight: "6px" }} />}
                    {campo === "telefono" && <FaPhone style={{ marginRight: "6px" }} />}
                    {campo === "direccion" && <FaMapMarkerAlt style={{ marginRight: "6px" }} />}
                    {campo === "email" && <FaEnvelope style={{ marginRight: "6px" }} />}
                    {campo.charAt(0).toUpperCase() + campo.slice(1)}:
                  </label>
                  <input
                    type={campo === "email" ? "email" : "text"}
                    name={campo}
                    value={(cliente as any)[campo]}
                    onChange={handleInputCliente}
                    placeholder={`Ingrese ${campo}`}
                    disabled={clienteCargado}
                    className={clienteCargado ? "input-disabled" : ""}
                  />
                  {errores[campo] && (
                    <p className="pedido-error">{errores[campo]}</p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Información del Pedido */}
          <h2><FaShoppingCart style={{ marginRight: "8px" }} /> Información del Pedido</h2>

          <div className="field">
            <label><FaCalendarAlt style={{ marginRight: "6px" }} /> Fecha de Inicio:</label>
            <input
              type="date"
              name="fechaInicio"
              value={pedido.fechaInicio}
              onChange={handleInputPedido}
              min={getTodayString()}
              className="pedido-input-date"
            />
            {errores.fechaInicio && (
              <p className="pedido-error">{errores.fechaInicio}</p>
            )}
          </div>

          <div className="field">
            <label><FaCalendarAlt style={{ marginRight: "6px" }} /> Fecha de Entrega:</label>
            <input
              type="date"
              name="fechaEntrega"
              value={pedido.fechaEntrega}
              onChange={handleInputPedido}
              min={pedido.fechaInicio || getTodayString()}
              className="pedido-input-date"
            />
            {errores.fechaEntrega && (
              <p className="pedido-error">{errores.fechaEntrega}</p>
            )}
          </div>

          <div className="field">
            <label><FaClock style={{ marginRight: "6px" }} /> Estado:</label>
            <select
              name="estado"
              value={pedido.estado}
              onChange={handleInputPedido}
              disabled
              className="input-disabled"
            >
              <option value="En proceso">En proceso</option>
            </select>
            {errores.estado && <p className="pedido-error">{errores.estado}</p>}
          </div>

          {/* NUEVO CAMPO DE GARANTÍA */}
          <div className="field">
            <label><FaCheckCircle style={{ marginRight: "6px" }} /> Garantía (Plazo en días):</label>
            <input
              type="number"
              name="garantia"
              value={pedido.garantia || ""}
              onChange={(e) => {
                const valor = e.target.value;
                if (valor === "") {
                  setPedido(prev => ({
                    ...prev,
                    garantia: ""
                  }));
                } else {
                  const num = Math.max(0, Math.min(30, Number(valor)));
                  setPedido(prev => ({
                    ...prev,
                    garantia: num.toString()
                  }));
                }
              }}
              placeholder="Ej: 30"
              min="0"
              max="30"
              step="1"
              className="input-garantia"
            />
            {errores.garantia && (
              <p className="pedido-error">{errores.garantia}</p>
            )}
            <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
              Máximo 30 días (Ej: 5, 15, 30)
            </small>
          </div>

          {/* Sección de prendas */}
          <div className="prendas-section card">
            <h2><FaShoppingCart style={{ marginRight: "8px" }} /> Gestión de Prendas</h2>
            {errores.prendas && <p className="pedido-error">{errores.prendas}</p>}
            
            {/* Lista de prendas temporales */}
            {prendasTemporales.length > 0 && (
              <div className="prendas-lista">
                <div className="table-responsive-container">
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
                            {(prenda.arreglos || []).map((arreglo, i) => {
                              const nombreArreglo = arreglo.tipo === 'combinacion'
                                ? (arreglo.descripcion_combinacion && arreglo.descripcion_combinacion.trim()
                                    ? arreglo.descripcion_combinacion
                                    : `${arreglo.nombre_ajuste ?? ''} ${arreglo.nombre_accion ?? ''}`.trim()
                                  )
                                : arreglo.tipo === 'ajuste'
                                  ? arreglo.nombre_ajuste
                                  : arreglo.nombre_accion;

                              return (
                                <div key={i} className="arreglo-mini">
                                  {nombreArreglo} - {formatCOP(Number(arreglo.precio) || 0)}
                                </div>
                              );
                            })}
                          </td>
                          <td>
                            {formatCOP(
                              (prenda.arreglos || []).reduce(
                                (total, arreglo) => total + Number(arreglo.precio || 0),
                                0
                              ) * (prenda.cantidad || 1)
                            )}
                          </td>
                          <td>
                            <div className="acciones-prenda">
                              <button 
                                className="btn-editar"
                                onClick={() => handleEditarPrenda(index)}
                                title="Editar prenda"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="btn-eliminar"
                                onClick={() => handleEliminarPrendaTemporal(index)}
                                title="Eliminar prenda"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Total del pedido */}
                <div className="total-pedido">
                  <h3><FaDollarSign style={{ marginRight: "6px" }} /> Total Calculado: {formatCOP(calcularTotalPrendas())}</h3>
                  <h3><FaDollarSign style={{ marginRight: "6px" }} /> Total Final: {formatCOP(precioModificado && precioModificado > 0 ? precioModificado : calcularTotalPrendas())}</h3>
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
            <label><FaDollarSign style={{ marginRight: "6px" }} /> Abono Inicial (Opcional):</label>
            <InputMoneda
              value={Number(pedido.abonoInicial || 0)}
              onChange={(valor) => {
                setPedido(prev => {
                  const totalActual = (precioModificado && precioModificado > 0)
                    ? precioModificado
                    : (prev.totalPedido || calcularTotalPrendas());
                  return ({
                    ...prev,
                    abonoInicial: valor,
                    saldoPendiente: totalActual - Number(valor || 0)
                  });
                });
              }}
              placeholder="Ingrese el abono"
            />
            {errores.abonoInicial && (
              <p className="pedido-error">{errores.abonoInicial}</p>
            )}
          </div>

          <div className="field">
            <label>Observaciones del Abono (opcional):</label>
            <input
              type="text"
              name="abonoObservaciones"
              value={pedido.abonoObservaciones || ""}
              onChange={handleInputPedido}
              placeholder="Ej: Pago parcial, recibo #123, etc."
            />
          </div>
          
          {/* Resumen del pedido */}
          <div className="resumen-pedido">
            <div className="precio-header">
              <h3><FaDollarSign style={{ marginRight: "6px" }} /> Total del Pedido</h3>
              <button 
                type="button"
                className="btn-modificar-precio"
                onClick={() => setMostrarModificarPrecio(true)}
              >
                <FaEdit /> Modificar
              </button>
            </div>
            
            <p><strong>Total calculado:</strong> {formatCOP(calcularTotalPrendas())}</p>
            <p><strong>Total final:</strong> {formatCOP(precioModificado && precioModificado > 0 ? precioModificado : calcularTotalPrendas())}</p>
            <p><strong>Abono inicial:</strong> {formatCOP(Number(pedido.abonoInicial || 0))}</p>
            <p><strong>Saldo pendiente:</strong> {formatCOP(Number(pedido.saldoPendiente || 0))}</p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: 10 }}>
            <button
              className="btn-primary"
              onClick={handleGuardar}
              disabled={cargando}
              style={{ flex: 1 }}
            >
              {cargando ? "Guardando..." : "Guardar Pedido"}
            </button>
            
            <button
              className="btn-cancelar"
              onClick={handleLimpiarTodo}
              style={{ flex: 1 }}
            >
              Limpiar Todo
            </button>
          </div>
        </div>

        {/* Cajones y Códigos */}
        <div className="cajones-codigos-container">
          {/* Cajones */}
          <div className="cajones-section card">
            <h2><FaBox style={{ marginRight: "8px" }} /> Seleccionar Cajón</h2>
            {errores.cajon && <p className="pedido-error" style={{textAlign: 'center'}}>{errores.cajon}</p>}
            
            {cargandoCajones ? (
              <div className="cargando">Cargando cajones...</div>
            ) : (
              <div className="cajones-grid">
                {cajones.map((cajon) => {
                  const infoCajon = getInfoCajon(cajon.id_cajon);
                  const estaOcupado = cajon.estado === "ocupado";
                  
                  return (
                    <div 
                      key={cajon.id_cajon}
                      className={getClaseCajon(cajon)}
                      onClick={() => !estaOcupado && handleSeleccionarCajon(cajon.id_cajon)}
                      style={{
                        opacity: estaOcupado ? 0.5 : 1,
                        cursor: estaOcupado ? "not-allowed" : "pointer",
                        pointerEvents: estaOcupado ? "none" : "auto"
                      }}
                    >
                      <div className="cajon-nombre">{infoCajon.nombre}</div>
                      <div className="cajon-rango">{infoCajon.rango}</div>
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
                <FaSearch style={{ marginRight: "6px" }} /> Códigos Disponibles - {getInfoCajon(cajonSeleccionado).nombre}
              </h2>
              {errores.codigos && <p className="pedido-error">{errores.codigos}</p>}
              
              {cargandoCodigos ? (
                <div className="cargando">Cargando códigos...</div>
              ) : (
                <div className="codigos-grid">
                  {codigosFiltrados.map((codigo) => (
                    <label 
                      key={codigo.id_codigo} 
                      className={`codigo-item ${codigo.estado === "ocupado" ? "codigo-ocupado-disabled" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={codigosSeleccionados.includes(codigo.id_codigo)}
                        onChange={() => handleSeleccionarCodigo(codigo.id_codigo)}
                        disabled={codigo.estado === "ocupado"}
                        className={codigo.estado === "ocupado" ? "input-disabled" : ""}
                      />
                      <span className={`codigo-numero ${codigo.estado === "ocupado" ? "ocupado" : ""}`}>
                        {codigo.codigo_numero}
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

      {/* Modal de Entrega de Pedidos */}
      {mostrarModalEntrega && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <h2><FaBox style={{ marginRight: "8px" }} /> Entrega de Pedidos</h2>
            
            {/* Barra de búsqueda */}
            <div className="field">
              <label><FaSearch style={{ marginRight: "6px" }} /> Buscar Pedido:</label>
              <input
                type="text"
                placeholder="Buscar por nombre del cliente, cédula o ID..."
                value={busquedaPedido}
                onChange={(e) => setBusquedaPedido(e.target.value)}
                style={{ width: "100%", padding: "10px" }}
              />
            </div>

            {/* Lista de pedidos */}
            <div className="pedidos-lista" style={{ maxHeight: "400px", overflowY: "auto", margin: "20px 0" }}>
              <h3>Pedidos Listos para Entrega</h3>
              
              {pedidosLista
                .filter(pedido => 
                  pedido.cliente_nombre.toLowerCase().includes(busquedaPedido.toLowerCase()) ||
                  pedido.cliente_cedula.includes(busquedaPedido) ||
                  pedido.id_pedido.toString().includes(busquedaPedido)
                )
                .map(pedido => (
                  <div 
                    key={pedido.id_pedido}
                    className={`pedido-item ${pedidoSeleccionado?.id_pedido === pedido.id_pedido ? 'selected' : ''}`}
                    onClick={() => {
                      setPedidoSeleccionado(pedido);
                      setAbonoEntrega(Number(pedido.saldo) || 0);
                    }}
                    style={{
                      padding: "15px",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      marginBottom: "10px",
                      cursor: "pointer",
                      backgroundColor: pedidoSeleccionado?.id_pedido === pedido.id_pedido ? "#e3f2fd" : "#fff",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{pedido.cliente_nombre}</strong>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                          <FaIdCard style={{ marginRight: "4px" }} /> Cédula: {pedido.cliente_cedula} | <FaFileInvoice style={{ marginRight: "4px" }} /> Pedido #: {pedido.id_pedido}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                          <FaDollarSign style={{ marginRight: "4px" }} /> Total: {formatCOP(Number(pedido.total_pedido))} | Abonado: {formatCOP(Number(pedido.abono))} | Saldo: {formatCOP(Number(pedido.saldo))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ 
                          padding: "4px 8px", 
                          borderRadius: "4px", 
                          backgroundColor: "#3b82f6",
                          color: "#fff",
                          fontSize: "0.8rem",
                          fontWeight: "bold"
                        }}>
                          <FaShoppingCart style={{ marginRight: "4px" }} /> Pedido
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              {pedidosLista.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                  No hay pedidos listos para entrega
                </div>
              )}
            </div>

            {/* Información del pedido seleccionado */}
            {pedidoSeleccionado && (
              <div className="pedido-seleccionado" style={{ 
                padding: "20px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px",
                marginTop: "20px"
              }}>
                <h3>Información de Entrega</h3>
                
                {errorEntrega && (
                  <p className="pedido-error" style={{ 
                    padding: "10px", 
                    backgroundColor: "#fee",
                    borderLeft: "4px solid #f66",
                    marginBottom: "15px",
                    borderRadius: "4px",
                    color: "#c33"
                  }}>
                    <FaExclamationTriangle style={{ marginRight: "6px" }} /> {errorEntrega}
                  </p>
                )}
                
                <div className="field">
                  <label><FaDollarSign style={{ marginRight: "6px" }} /> Ingrese el abono en este momento (Saldo Pendiente):</label>
                  <InputMoneda
                    value={abonoEntrega}
                    onChange={(valor) => {
                      setAbonoEntrega(Number(valor));
                      setErrorEntrega("");
                    }}
                    placeholder="Ingrese el abono"
                  />
                  <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                    <FaDollarSign style={{ marginRight: "4px" }} /> Saldo pendiente total: <strong>{formatCOP(Number(pedidoSeleccionado.saldo))}</strong>
                  </small>
                </div>

                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "1fr 1fr", 
                  gap: "10px",
                  marginTop: "15px",
                  padding: "15px",
                  backgroundColor: "#fff",
                  borderRadius: "6px"
                }}>
                  <div>
                    <strong><FaUser style={{ marginRight: "4px" }} /> Cliente:</strong> {pedidoSeleccionado.cliente_nombre}
                  </div>
                  <div>
                    <strong><FaIdCard style={{ marginRight: "4px" }} /> Cédula:</strong> {pedidoSeleccionado.cliente_cedula}
                  </div>
                  <div>
                    <strong><FaDollarSign style={{ marginRight: "4px" }} /> Total Pedido:</strong> {formatCOP(Number(pedidoSeleccionado.total_pedido))}
                  </div>
                  <div>
                    <strong><FaCheckCircle style={{ marginRight: "4px" }} /> Abonado:</strong> {formatCOP(Number(pedidoSeleccionado.abono))}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong><FaExclamationTriangle style={{ marginRight: "4px" }} /> Saldo Pendiente:</strong> {formatCOP(Number(pedidoSeleccionado.saldo))}
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="modal-actions" style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalEntrega(false);
                  setPedidoSeleccionado(null);
                  setAbonoEntrega(0);
                  setBusquedaPedido("");
                }}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleEntregarPedido}
                disabled={!pedidoSeleccionado || cargandoEntrega}
                style={{ 
                  flex: 1,
                  backgroundColor: "#3b82f6",
                  opacity: !pedidoSeleccionado ? 0.6 : 1
                }}
              >
                {cargandoEntrega ? <FaClock style={{ marginRight: "6px" }} /> : <FaCheckCircle style={{ marginRight: "6px" }} />}
                {cargandoEntrega ? "Procesando..." : "Entregar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Factura */}
      <ModalFactura
        isOpen={mostrarModalFactura}
        facturaData={datosFactura}
        onClose={() => {
          setMostrarModalFactura(false);
          setDatosFactura(null);
        }}
      />

      {/* Modal de modificar precio final */}
      {mostrarModificarPrecio && (
        <div className="modal-overlay">
          <div className="modal-content-modificar">
            <h2><FaDollarSign style={{ marginRight: "8px" }} /> Modificar Precio Final</h2>
            
            <div className="form-group-modificar">
              <label>Total Calculado:</label>
              <input
                type="text"
                value={formatCOP(calcularTotalPrendas())}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group-modificar">
              <label><FaPercent style={{ marginRight: "6px" }} /> Descuentos Rápidos:</label>
              <select
                onChange={(e) => {
                  const porcentaje = Number(e.target.value);
                  if (porcentaje > 0) {
                    aplicarDescuentoAutomatico(porcentaje);
                  }
                }}
                defaultValue="0"
                className="descuentos-selector"
              >
                <option value="0">Seleccionar descuento...</option>
                <option value="5">-5%</option>
                <option value="10">-10%</option>
                <option value="15">-15%</option>
                <option value="20">-20%</option>
                <option value="25">-25%</option>
                <option value="30">-30%</option>
                <option value="35">-35%</option>
                <option value="40">-40%</option>
                <option value="45">-45%</option>
                <option value="50">-50%</option>
              </select>
            </div>

            <div className="form-group-modifica">
              <label><FaDollarSign style={{ marginRight: "6px" }} /> Nuevo Precio Final *</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <InputMoneda
                    value={precioModificado}
                    onChange={(valor) => setPrecioModificado(Number(valor))}
                    placeholder="$ 0,00"
                  />
                </div>
              </div>
            </div>

            <div className="forform-group-modifica">
              <label>Motivo de la modificación (opcional)</label>
              <textarea
                value={motivoModificacion}
                onChange={(e) => setMotivoModificacion(e.target.value)}
                placeholder="Ej: Descuento por cliente frecuente, promoción especial, etc."
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

      {/* Modal de Confirmación de Entrega */}
      {mostrarConfirmacionEntrega && pedidoSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-confirmacion-entrega">
            <div className="confirmacion-header">
              <div className="confirmacion-icono">
                <FaCheckCircle />
              </div>
              <h2>¿Confirmar Entrega?</h2>
            </div>
            
            <div className="confirmacion-body">
              <p className="confirmacion-pregunta">
                ¿Está seguro que desea entregar este pedido?
              </p>
              
              <div className="confirmacion-detalles">
                <div className="confirmacion-item">
                  <FaUser className="confirmacion-item-icon" />
                  <div>
                    <span className="confirmacion-label">Cliente</span>
                    <span className="confirmacion-valor">{pedidoSeleccionado.cliente_nombre}</span>
                  </div>
                </div>
                
                <div className="confirmacion-item">
                  <FaDollarSign className="confirmacion-item-icon" />
                  <div>
                    <span className="confirmacion-label">Total del pedido</span>
                    <span className="confirmacion-valor">{formatCOP(pedidoSeleccionado.total_pedido)}</span>
                  </div>
                </div>
                
                <div className="confirmacion-item">
                  <FaDollarSign className="confirmacion-item-icon saldo" />
                  <div>
                    <span className="confirmacion-label">Saldo pendiente</span>
                    <span className="confirmacion-valor saldo">{formatCOP(pedidoSeleccionado.saldo)}</span>
                  </div>
                </div>
              </div>

              <div className="confirmacion-aviso">
                <FaExclamationTriangle className="aviso-icono" />
                <span>El pago se registrará automáticamente en <strong>EFECTIVO</strong></span>
              </div>
            </div>

            <div className="confirmacion-actions">
              <button 
                type="button"
                className="btn-cancelar-confirmacion"
                onClick={() => setMostrarConfirmacionEntrega(false)}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className="btn-confirmar-entrega"
                onClick={confirmarEntregaPedido}
              >
                <FaCheckCircle style={{ marginRight: "8px" }} />
                Sí, Entregar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}