import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import "../styles/pedidos.css";
import "../styles/inputMoneda.css";
import { obtenerCajones, type Cajon } from "../services/cajonesService";
import { obtenerCodigos, type Codigo } from "../services/codigosService";
import { obtenerAjustes, type Ajuste } from "../services/ajustesService";
import { obtenerAcciones, type Accion } from "../services/accionesService";
import { obtenerAjustesAccion, type AjusteAccion } from "../services/ajustesAccionService";
import ModalPrenda from "../components/ModalPrenda";
import { type Prenda, type ArregloSeleccionado } from "../services/prendasService";
import { FaEdit, FaTrash } from "react-icons/fa";
import { obtenerClientes, type Cliente as ClienteService } from "../services/clientesService";
import { formatCOP } from '../utils/formatCurrency';
import { InputMoneda } from "./InputMoneda";

// Interfaces (manteniendo las existentes)
interface Pedido {
  fechaInicio: string;
  fechaEntrega: string;
  estado: string;
  observaciones: string;
  abonoInicial: number | string;
  abonoObservaciones?: string;
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

// Clave para localStorage
const PEDIDO_STORAGE_KEY = "pedido_en_proceso";

export default function Pedidos() {
  // Estados principales - cargando desde localStorage si existe
  const [pedido, setPedido] = useState<Pedido>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.pedido || {
        fechaInicio: "",
        fechaEntrega: "",
        estado: "",
        observaciones: "",
        abonoInicial: "",
        abonoObservaciones: "",
        totalPedido: 0,
        saldoPendiente: 0,
      };
    }
    return {
      fechaInicio: "",
      fechaEntrega: "",
      estado: "",
      observaciones: "",
      abonoInicial: "",
      abonoObservaciones: "",
      totalPedido: 0,
      saldoPendiente: 0,
    };
  });

  const [cliente, setCliente] = useState<Cliente>(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.cliente || {
        nombre: "",
        cedula: "",
        telefono: "",
        direccion: "",
        email: "",
      };
    }
    return {
      nombre: "",
      cedula: "",
      telefono: "",
      direccion: "",
      email: "",
    };
  });

  // Estados para entrega de pedidos - CORRECCIÓN
  const [mostrarModalEntrega, setMostrarModalEntrega] = useState(false);
  const [pedidosLista, setPedidosLista] = useState<PedidoEntrega[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<PedidoEntrega | null>(null);
  const [busquedaPedido, setBusquedaPedido] = useState("");
  const [abonoEntrega, setAbonoEntrega] = useState<number>(0); // Cambiar a number
  const [cargandoEntrega, setCargandoEntrega] = useState(false);

  // Mini búsqueda de clientes dentro del formulario
  const [clientesLista, setClientesLista] = useState<ClienteService[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [sugerenciasClientes, setSugerenciasClientes] = useState<ClienteService[]>([]);

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
  
  // Estados para prendas
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
  const [precioModificado, setPrecioModificado] = useState(() => {
    const guardado = localStorage.getItem(PEDIDO_STORAGE_KEY);
    if (guardado) {
      const datos = JSON.parse(guardado);
      return datos.precioModificado || 0;
    }
    return 0;
  });
  const [motivoModificacion, setMotivoModificacion] = useState("");

  // Estados para foto del pedido (preview + archivo)
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);

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
      precioModificado
    };
    localStorage.setItem(PEDIDO_STORAGE_KEY, JSON.stringify(datosParaGuardar));
  }, [pedido, cliente, cajonSeleccionado, codigosSeleccionados, prendasTemporales, precioModificado]);

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

  // Función para manejar la entrega del pedido - CORRECCIÓN
  const handleEntregarPedido = async () => {
    if (!pedidoSeleccionado) return;

    // OBTENER usuario del localStorage
    const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
    const idUsuario = usuarioGuardado?.id_usuario || 1;

    console.log("Entregando pedido con usuario:", idUsuario);

    try {
      setCargandoEntrega(true);
      
      const response = await fetch(`http://localhost:3000/api/pedidos/${pedidoSeleccionado.id_pedido}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estado: "Entregado",
          abonoEntrega: abonoEntrega > 0 ? abonoEntrega : 0,
          id_usuario: idUsuario  // Usar esto
        }),
      });

      if (response.ok) {
        alert("✓ Pedido marcado como entregado exitosamente");
        setMostrarModalEntrega(false);
        setPedidoSeleccionado(null);
        setAbonoEntrega(0); // Reset a 0
        setBusquedaPedido("");
        
        // Recargar la lista de pedidos
        cargarPedidosParaEntrega();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.message || "No se pudo entregar el pedido"}`);
      }
    } catch (error) {
      console.error("Error al entregar pedido:", error);
      alert("❌ Error al conectar con el servidor");
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
    setPedido(prev => ({
      ...prev,
      totalPedido: totalPrendas,
      saldoPendiente: totalPrendas - Number(prev.abonoInicial || 0)
    }));
    
    // Solo inicializar el precio modificado si no hay un valor guardado
    if (precioModificado === 0) {
      setPrecioModificado(totalPrendas);
    }
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

  // Mini búsqueda: filtrar sugerencias en vivo
  const handleBusquedaCliente = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBusquedaCliente(val);
    if (!val.trim()) {
      setSugerenciasClientes([]);
      return;
    }
    const term = val.toLowerCase();
    const filtradas = clientesLista.filter(c => {
      return (
        String(c.nombre || "").toLowerCase().includes(term) ||
        String(c.nuip || "").toLowerCase().includes(term) ||
        String(c.telefono || "").toLowerCase().includes(term) ||
        String(c.email || "").toLowerCase().includes(term)
      );
    }).slice(0, 6);
    setSugerenciasClientes(filtradas);
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
    const firstInput = document.querySelector('.pedido-form input[name="fechaInicio"]') as HTMLInputElement | null;
    if (firstInput) firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  //  Guardar pedido (enviar al backend)
  const handleGuardar = async (e: FormEvent) => {
    e.preventDefault();
    if (!validarCampos()) {
      alert(" Completa todos los campos antes de guardar.");
      return;
    }

    // OBTENER usuario del localStorage
    const usuarioGuardado = JSON.parse(localStorage.getItem("user") || "{}");
    const idUsuario = usuarioGuardado?.id_usuario || 1;

    console.log("Guardando pedido con usuario:", idUsuario);

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
            // enviar campo específico para observación del abono
            observaciones_abono: pedido.abonoObservaciones || null,
            observaciones: motivoModificacion 
              ? `${pedido.observaciones || ''}\nMODIFICACIÓN DE PRECIO: ${motivoModificacion} - Precio original: $${calcularTotalPrendas().toLocaleString()}, Precio final: $${precioModificado.toLocaleString()}`
              : pedido.observaciones
          },
          id_cajon: cajonSeleccionado,
          codigos_seleccionados: codigosSeleccionados,
          prendas: prendasTemporales,
          id_usuario: idUsuario  // Agregar aquí
        }),
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        alert(" Pedido guardado exitosamente.");
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
        
        // Limpiar localStorage después de guardar exitosamente
        localStorage.removeItem(PEDIDO_STORAGE_KEY);
        
        // Recargar datos para actualizar estados de cajones y códigos
        cargarDatos();
      } else {
        alert(` Error: ${data.message || "No se pudo guardar el pedido."}`);
      }
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert(" Error al conectar con el servidor.");
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
        localStorage.removeItem("nuevoPedidoCliente");
      }
    } catch (err) {
      console.error("Error leyendo nuevoPedidoCliente:", err);
    }
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
           Entrega de Pedidos
        </button>
      </div>

      <div className="pedido-top">
        {/* Formulario principal */}
        <div className="pedido-form card">
          {/* Información del Cliente */}
          <div className="cliente-form">
            <h2>Información del Cliente</h2>
            {/* Mini búsqueda rápida de clientes */}
            <div className="cliente-mini-search">
              <input
                type="text"
                placeholder="Buscar cliente rápido..."
                value={busquedaCliente}
                onChange={handleBusquedaCliente}
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

          {/* Sección de prendas (movida): Gestión de Prendas integrada aquí */}
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
                
                {/* Total del pedido */}
                <div className="total-pedido">
                  <h3>Total Calculado: {formatCOP(calcularTotalPrendas())}</h3>
                  <h3>Total Final: {formatCOP(precioModificado)}</h3>
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
            <label>Abono Inicial (Opcional):</label>
            <InputMoneda
              value={Number(pedido.abonoInicial || 0)}
              onChange={(valor) => {
                setPedido(prev => ({
                  ...prev,
                  abonoInicial: valor,
                  saldoPendiente: precioModificado - valor
                }));
              }}
              placeholder="Ingrese el abono"
            />
            {errores.abonoInicial && (
              <p className="error">{errores.abonoInicial}</p>
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
            
            <p><strong>Total calculado:</strong> {formatCOP(calcularTotalPrendas())}</p>
            <p><strong>Total final:</strong> {formatCOP(precioModificado)}</p>
            {precioModificado !== calcularTotalPrendas() && (
              <p className="diferencia-precio">
                <strong>Diferencia:</strong> 
                <span className={precioModificado < calcularTotalPrendas() ? "rebaja" : "aumento"}>
                  {precioModificado < calcularTotalPrendas() ? " -" : " +"}
                  {formatCOP(Math.abs(precioModificado - calcularTotalPrendas()))}
                </span>
              </p>
            )}
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
          <div className="modal-content-modificar">
            <h2>Modificar Precio Final</h2>
            
            <div className="form-group-modificar">
              <label>Total Calculado:</label>
              <input
                type="text"
                value={`$${calcularTotalPrendas().toLocaleString()}`}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group-modifica">
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

            <div className="forform-group-modifica">
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

      {/* Modal de Entrega de Pedidos */}
      {mostrarModalEntrega && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <h2>📦 Entrega de Pedidos</h2>
            
            {/* Barra de búsqueda */}
            <div className="field">
              <label>Buscar Pedido:</label>
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
                      // Establecer el saldo como abono inicial (convertir a número)
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
                          Cédula: {pedido.cliente_cedula} | Pedido #: {pedido.id_pedido}
                        </div>
                        <div style={{ fontSize: "0.9rem", color: "#666" }}>
                          Total: {formatCOP(Number(pedido.total_pedido))} | Abonado: {formatCOP(Number(pedido.abono))} | Saldo: {formatCOP(Number(pedido.saldo))}
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
                          Pedido
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
                
                <div className="field">
                  <label>Ingrese el abono en este momento (Saldo Pendiente):</label>
                  <InputMoneda
                    value={abonoEntrega}
                    onChange={(valor) => setAbonoEntrega(Number(valor))}
                    placeholder="Ingrese el abono"
                  />
                  <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                    💰 Saldo pendiente total: <strong>{formatCOP(Number(pedidoSeleccionado.saldo))}</strong>
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
                    <strong>👤 Cliente:</strong> {pedidoSeleccionado.cliente_nombre}
                  </div>
                  <div>
                    <strong>🆔 Cédula:</strong> {pedidoSeleccionado.cliente_cedula}
                  </div>
                  <div>
                    <strong>💵 Total Pedido:</strong> {formatCOP(Number(pedidoSeleccionado.total_pedido))}
                  </div>
                  <div>
                    <strong>✓ Abonado:</strong> {formatCOP(Number(pedidoSeleccionado.abono))}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <strong>⚠️ Saldo Pendiente:</strong> {formatCOP(Number(pedidoSeleccionado.saldo))}
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
                {cargandoEntrega ? "⏳ Procesando..." : "✓ Entregar Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}