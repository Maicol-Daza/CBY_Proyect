import { useState, ChangeEvent, FormEvent } from "react";
import "../styles/pedidos.css";

// Interfaces
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

export default function Pedidos() {
  // Estados
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

  const [errores, setErrores] = useState<Errores>({});
  const [cargando, setCargando] = useState(false);

  // ✅ Validar campos antes de enviar
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
      nuevosErrores.email =
        "Debe tener un formato válido (ej: usuario@gmail.com).";
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

    if (pedido.abonoInicial === "" || Number(pedido.abonoInicial) < 0) {
      nuevosErrores.abonoInicial = "Debe ingresar un abono inicial válido.";
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
        body: JSON.stringify({ cliente, pedido }),
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
        setErrores({});
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
              <option value="Finalizado">Finalizado</option>
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
            <label>Total del Pedido:</label>
            <input
              type="number"
              name="totalPedido"
              value={pedido.totalPedido}
              onChange={handleInputPedido}
              placeholder="Ingrese el total del pedido"
            />
          </div>

          <div className="field">
            <label>Abono Inicial:</label>
            <input
              type="number"
              name="abonoInicial"
              value={pedido.abonoInicial}
              onChange={handleInputPedido}
            />
            {errores.abonoInicial && (
              <p className="error">{errores.abonoInicial}</p>
            )}
          </div>

          <div>
            <p>Total del pedido: ${pedido.totalPedido}</p>
            <p>Abono inicial: ${pedido.abonoInicial}</p>
            <p>Saldo pendiente: ${pedido.saldoPendiente}</p>
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

        {/* Cajones */}
        <div className="cajones-section card">
          <h2>Seleccionar Cajón</h2>
          <div className="cajones-grid">
            {[...Array(14)].map((_, index) => (
              <div key={index} className="cajon">
                Cajón {index + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de prendas */}
      <div className="prendas-section card">
        <h2>Gestión de Prendas</h2>
        <button className="btn-primary">Agregar Prenda</button>
      </div>
    </div>
  );
}
    