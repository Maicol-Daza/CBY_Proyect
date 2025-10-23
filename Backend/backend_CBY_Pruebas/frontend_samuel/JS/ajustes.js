// Datos de ejemplo
let clientes = [
    {
        cedula: '12345678',
        nombre: 'María González',
        telefono: '3001234567',
        email: 'maria@email.com',
        fechaRegistro: '2024-01-15'
    },
    {
        cedula: '87654321',
        nombre: 'Carlos Rodríguez',
        telefono: '3109876543',
        email: 'carlos@email.com',
        fechaRegistro: '2024-02-10'
    }
];

let pedidos = [
    {
        id: 'P001',
        cedula: '12345678',
        cliente: 'María González',
        prenda: 'Pantalón',
        arreglo: 'Ajuste de largo',
        costo: 25000,
        abono: 15000,
        codigoPrenda: 'PR001',
        codigoCajon: 'C-A1',
        descripcion: 'Ajustar largo 5cm',
        estado: 'En Proceso',
        fecha: '2025-01-15'
    },
    {
        id: 'P002',
        cedula: '87654321',
        cliente: 'Carlos Rodríguez',
        prenda: 'Chaqueta',
        arreglo: 'Reparación de costura',
        costo: 18000,
        abono: 10000,
        codigoPrenda: 'PR002',
        codigoCajon: 'C-B2',
        descripcion: 'Reparar manga izquierda',
        estado: 'Pendiente',
        fecha: '2025-01-16'
    }
];

let empleados = [
    {
        id: 'E001',
        cedula: '11111111',
        nombre: 'Ana Patricia Martínez',
        telefono: '3001111111',
        correo: 'ana@bluyin.com',
        clave: '123456',
        foto: null,
        fechaRegistro: '2024-01-01',
        estado: 'Activo'
    }
];

let movimientosCaja = [
    {
        id: 'M001',
        tipo: 'ingreso',
        monto: 25000,
        descripcion: 'Pago de pedido P001 - María González',
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('es-CO')
    },
    {
        id: 'M002',
        tipo: 'egreso',
        monto: 15000,
        descripcion: 'Compra de materiales de costura',
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('es-CO')
    }
];

// Estado inicial de caja
let estadoCaja = {
    dineroInicial: 500000,
    ingresosDia: 125000,
    egresosDia: 25000,
    saldoActual: 600000
};

// Funciones de navegación
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function () {
        const sectionId = this.getAttribute('data-section');

        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');
    });
});

// Función para buscar cliente por cédula
document.getElementById('searchCedula').addEventListener('input', function () {
    const cedula = this.value.replace(/\D/g, '');
    this.value = cedula;

    if (cedula.length >= 6) {
        buscarCliente(cedula);
    } else {
        document.getElementById('clienteEncontrado').style.display = 'none';
        document.getElementById('clienteNoEncontrado').style.display = 'none';
        document.getElementById('historialPedidos').style.display = 'none';
    }
});

function buscarCliente(cedula) {
    const cliente = clientes.find(c => c.cedula === cedula);

    if (cliente) {
        const pedidosCliente = pedidos.filter(p => p.cedula === cedula);
        const totalPedidos = pedidosCliente.length;
        const ultimoPedido = pedidosCliente.length > 0 ? pedidosCliente[pedidosCliente.length - 1] : null;

        document.getElementById('clienteData').innerHTML = `
                    <p><strong>Nombre:</strong> ${cliente.nombre}</p>
                    <p><strong>Cédula:</strong> ${cliente.cedula}</p>
                    <p><strong>Teléfono:</strong> ${cliente.telefono}</p>
                    <p><strong>Email:</strong> ${cliente.email}</p>
                    <p><strong>Total de Pedidos:</strong> ${totalPedidos}</p>
                    ${ultimoPedido ? `<p><strong>Último Pedido:</strong> ${ultimoPedido.prenda} - ${ultimoPedido.arreglo} (${ultimoPedido.fecha})</p>` : ''}
                `;

        document.getElementById('clienteEncontrado').style.display = 'block';
        document.getElementById('clienteNoEncontrado').style.display = 'none';
    } else {
        document.getElementById('clienteEncontrado').style.display = 'none';
        document.getElementById('clienteNoEncontrado').style.display = 'block';
        document.getElementById('historialPedidos').style.display = 'none';
    }
}

// Función para mostrar nuevo pedido para cliente existente
function mostrarNuevoPedidoExistente() {
    const cedula = document.getElementById('searchCedula').value;
    const cliente = clientes.find(c => c.cedula === cedula);

    if (cliente) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-section="nuevo-pedido"]').classList.add('active');
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById('nuevo-pedido').classList.add('active');

        document.getElementById('cedulaPedido').value = cliente.cedula;
        document.getElementById('nombrePedido').value = cliente.nombre;
        document.getElementById('telefonoPedido').value = cliente.telefono;
        document.getElementById('emailPedido').value = cliente.email;

        document.getElementById('cedulaPedido').disabled = true;
        document.getElementById('nombrePedido').disabled = true;
        document.getElementById('telefonoPedido').disabled = true;
        document.getElementById('emailPedido').disabled = true;
    }
}

// Función para mostrar historial completo
function verHistorialCompleto() {
    const cedula = document.getElementById('searchCedula').value;
    const pedidosCliente = pedidos.filter(p => p.cedula === cedula);

    if (pedidosCliente.length > 0) {
        let historialHTML = '';
        pedidosCliente.forEach(pedido => {
            const saldo = pedido.costo - pedido.abono;
            historialHTML += `
                        <div class="order-item">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${pedido.prenda} - ${pedido.arreglo}</strong>
                                    <p style="margin: 5px 0; color: #CCCCCC;">${pedido.descripcion}</p>
                                    <p style="margin: 5px 0; font-size: 0.9em;">
                                        <strong>Código:</strong> ${pedido.codigoPrenda} | 
                                        <strong>Cajón:</strong> ${pedido.codigoCajon} | 
                                        <strong>Fecha:</strong> ${pedido.fecha}
                                    </p>
                                </div>
                                <div style="text-align: right;">
                                    <div><strong>Costo:</strong> ${pedido.costo.toLocaleString()}</div>
                                    <div><strong>Abono:</strong> ${pedido.abono.toLocaleString()}</div>
                                    <div><strong>Saldo:</strong> ${saldo.toLocaleString()}</div>
                                    <div><span class="status-badge status-${pedido.estado.toLowerCase().replace(' ', '-')}">${pedido.estado}</span></div>
                                </div>
                            </div>
                        </div>
                    `;
        });

        document.getElementById('historialContainer').innerHTML = historialHTML;
        document.getElementById('historialPedidos').style.display = 'block';
    }
}

// Función para mostrar registro de nuevo cliente
function mostrarRegistroNuevoCliente() {
    const cedula = document.getElementById('searchCedula').value;

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="nuevo-pedido"]').classList.add('active');
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById('nuevo-pedido').classList.add('active');

    if (cedula) {
        document.getElementById('cedulaPedido').value = cedula;
    }
}

// Función para generar código automático
function generarCodigoPrenda() {
    const count = pedidos.length + 1;
    return `PR${count.toString().padStart(3, '0')}`;
}

// Manejar el formulario de nuevo pedido
document.getElementById('pedidoCompleto').addEventListener('submit', function (e) {
    e.preventDefault();

    const cedula = document.getElementById('cedulaPedido').value.replace(/\D/g, '');
    const nombre = document.getElementById('nombrePedido').value;
    const telefono = document.getElementById('telefonoPedido').value;
    const email = document.getElementById('emailPedido').value;
    const prenda = document.getElementById('tipoPrendaPedido').value;
    const arreglo = document.getElementById('tipoArreglo').value;
    const costo = parseInt(document.getElementById('costoArreglo').value);
    const abono = parseInt(document.getElementById('abonoCliente').value);
    const codigoPrenda = document.getElementById('codigoPrenda').value;
    const codigoCajon = document.getElementById('codigoCajon').value;
    const descripcion = document.getElementById('descripcionArreglo').value;
    const observaciones = document.getElementById('observacionesArreglo').value;

    if (abono > costo) {
        alert('El abono no puede ser mayor al costo total');
        return;
    }

    let clienteExistente = clientes.find(c => c.cedula === cedula);

    if (!clienteExistente) {
        clientes.push({
            cedula: cedula,
            nombre: nombre,
            telefono: telefono,
            email: email,
            fechaRegistro: new Date().toISOString().split('T')[0]
        });
    }

    const nuevoPedido = {
        id: `P${(pedidos.length + 1).toString().padStart(3, '0')}`,
        cedula: cedula,
        cliente: nombre,
        prenda: document.querySelector('#tipoPrendaPedido option:checked').text,
        arreglo: document.querySelector('#tipoArreglo option:checked').text,
        costo: costo,
        abono: abono,
        codigoPrenda: codigoPrenda,
        codigoCajon: codigoCajon,
        descripcion: descripcion,
        observaciones: observaciones,
        estado: 'Pendiente',
        fecha: new Date().toISOString().split('T')[0]
    };

    pedidos.push(nuevoPedido);

    // Registrar ingreso en caja
    if (abono > 0) {
        registrarMovimientoCaja('ingreso', abono, `Abono pedido ${nuevoPedido.id} - ${nombre}`);
    }

    alert(`¡Pedido registrado exitosamente!\nCódigo: ${nuevoPedido.id}\nCliente: ${nombre}\nSaldo pendiente: ${(costo - abono).toLocaleString()}`);

    this.reset();
    document.getElementById('cedulaPedido').disabled = false;
    document.getElementById('nombrePedido').disabled = false;
    document.getElementById('telefonoPedido').disabled = false;
    document.getElementById('emailPedido').disabled = false;

    actualizarTablaClientes();
    actualizarTablaPedidos();
});

// Actualizar tabla de clientes
function actualizarTablaClientes() {
    const tbody = document.getElementById('tablaClientes');
    tbody.innerHTML = '';

    clientes.forEach(cliente => {
        const pedidosCliente = pedidos.filter(p => p.cedula === cliente.cedula);
        const ultimoPedido = pedidosCliente.length > 0 ? pedidosCliente[pedidosCliente.length - 1] : null;

        const row = `
                    <tr>
                        <td>${cliente.cedula}</td>
                        <td>${cliente.nombre}</td>
                        <td>${cliente.telefono}</td>
                        <td>${cliente.email || 'N/A'}</td>
                        <td>${pedidosCliente.length}</td>
                        <td>${ultimoPedido ? ultimoPedido.fecha : 'N/A'}</td>
                        <td>
                            <button class="btn btn-primary btn-small" onclick="verDetalleCliente('${cliente.cedula}')">Ver</button>
                            <button class="btn btn-success btn-small" onclick="nuevoPedidoCliente('${cliente.cedula}')">Pedido</button>
                        </td>
                    </tr>
                `;
        tbody.innerHTML += row;
    });
}

// Actualizar tabla de pedidos
function actualizarTablaPedidos() {
    const tbody = document.getElementById('tablaPedidos');
    tbody.innerHTML = '';

    pedidos.forEach(pedido => {
        const saldo = pedido.costo - pedido.abono;
        const statusClass = pedido.estado.toLowerCase().replace(' ', '-');

        const row = `
                    <tr>
                        <td>${pedido.codigoPrenda}</td>
                        <td>${pedido.cliente}</td>
                        <td>${pedido.prenda}</td>
                        <td>${pedido.arreglo}</td>
                        <td>${pedido.costo.toLocaleString()}</td>
                        <td>${pedido.abono.toLocaleString()}</td>
                        <td>${saldo.toLocaleString()}</td>
                        <td><span class="status-badge status-${statusClass}">${pedido.estado}</span></td>
                        <td>${pedido.codigoCajon}</td>
                        <td>
                            <button class="btn btn-warning btn-small" onclick="editarPedido('${pedido.id}')">Editar</button>
                            <button class="btn btn-success btn-small" onclick="cambiarEstado('${pedido.id}')">Estado</button>
                        </td>
                    </tr>
                `;
        tbody.innerHTML += row;
    });
}

// Función para ver detalle del cliente
function verDetalleCliente(cedula) {
    document.getElementById('searchCedula').value = cedula;
    buscarCliente(cedula);
    verHistorialCompleto();

    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('[data-section="buscar-cliente"]').classList.add('active');
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById('buscar-cliente').classList.add('active');
}

// Función para crear nuevo pedido para cliente existente
function nuevoPedidoCliente(cedula) {
    const cliente = clientes.find(c => c.cedula === cedula);
    if (cliente) {
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector('[data-section="nuevo-pedido"]').classList.add('active');
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
        document.getElementById('nuevo-pedido').classList.add('active');

        document.getElementById('cedulaPedido').value = cliente.cedula;
        document.getElementById('nombrePedido').value = cliente.nombre;
        document.getElementById('telefonoPedido').value = cliente.telefono;
        document.getElementById('emailPedido').value = cliente.email;

        document.getElementById('cedulaPedido').disabled = true;
        document.getElementById('nombrePedido').disabled = true;
        document.getElementById('telefonoPedido').disabled = true;
        document.getElementById('emailPedido').disabled = true;
    }
}

// Función para cambiar estado del pedido
function cambiarEstado(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
        const estados = ['Pendiente', 'En Proceso', 'Completado', 'Entregado'];
        const currentIndex = estados.indexOf(pedido.estado);
        const nextIndex = (currentIndex + 1) % estados.length;

        pedido.estado = estados[nextIndex];

        // Si se marca como entregado, registrar el pago del saldo
        if (pedido.estado === 'Entregado') {
            const saldo = pedido.costo - pedido.abono;
            if (saldo > 0) {
                registrarMovimientoCaja('ingreso', saldo, `Pago final pedido ${pedido.id} - ${pedido.cliente}`);
                pedido.abono = pedido.costo; // Marcar como totalmente pagado
            }
        }

        actualizarTablaPedidos();
        alert(`Estado del pedido ${pedidoId} cambiado a: ${pedido.estado}`);
    }
}

// Gestión de empleados
document.getElementById('formularioEmpleado').addEventListener('submit', function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreEmpleado').value;
    const cedula = document.getElementById('cedulaEmpleado').value.replace(/\D/g, '');
    const telefono = document.getElementById('telefonoEmpleado').value;
    const correo = document.getElementById('correoEmpleado').value;
    const clave = document.getElementById('claveEmpleado').value;
    const confirmarClave = document.getElementById('confirmarClaveEmpleado').value;
    const foto = document.getElementById('previewImg').src;

    // Validaciones
    if (clave !== confirmarClave) {
        alert('Las contraseñas no coinciden');
        return;
    }

    if (empleados.find(e => e.cedula === cedula)) {
        alert('Ya existe un empleado con esta cédula');
        return;
    }

    if (empleados.find(e => e.correo === correo)) {
        alert('Ya existe un empleado con este correo');
        return;
    }

    const nuevoEmpleado = {
        id: `E${(empleados.length + 1).toString().padStart(3, '0')}`,
        cedula: cedula,
        nombre: nombre,
        telefono: telefono,
        correo: correo,
        clave: clave,
        foto: foto !== window.location.href ? foto : null,
        fechaRegistro: new Date().toISOString().split('T')[0],
        estado: 'Activo'
    };

    empleados.push(nuevoEmpleado);
    actualizarTablaEmpleados();

    alert(`Empleado registrado exitosamente!\nID: ${nuevoEmpleado.id}\nNombre: ${nombre}`);
    this.reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('uploadText').style.display = 'block';
});

// Manejar carga de imagen
document.getElementById('fotoEmpleado').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('El archivo es muy grande. Máximo 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('previewImg').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
            document.getElementById('uploadText').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Actualizar tabla de empleados
function actualizarTablaEmpleados() {
    const tbody = document.getElementById('tablaEmpleados');
    tbody.innerHTML = '';

    empleados.forEach(empleado => {
        const fotoHtml = empleado.foto
            ? `<img src="${empleado.foto}" class="employee-photo" alt="${empleado.nombre}">`
            : '<div style="width: 50px; height: 50px; background: var(--gris-suave); border-radius: 50%; display: flex; align-items: center; justify-content: center;">👤</div>';

        const row = `
                    <tr>
                        <td>${fotoHtml}</td>
                        <td>${empleado.nombre}</td>
                        <td>${empleado.cedula}</td>
                        <td>${empleado.telefono}</td>
                        <td>${empleado.correo}</td>
                        <td>${empleado.fechaRegistro}</td>
                        <td><span class="status-badge status-completado">${empleado.estado}</span></td>
                        <td>
                            <button class="btn btn-warning btn-small" onclick="editarEmpleado('${empleado.id}')">Editar</button>
                            <button class="btn btn-secondary btn-small" onclick="toggleEstadoEmpleado('${empleado.id}')">Toggle</button>
                        </td>
                    </tr>
                `;
        tbody.innerHTML += row;
    });
}

// Gestión de caja
function registrarMovimientoCaja(tipo, monto, descripcion) {
    const nuevoMovimiento = {
        id: `M${(movimientosCaja.length + 1).toString().padStart(3, '0')}`,
        tipo: tipo,
        monto: parseInt(monto),
        descripcion: descripcion,
        fecha: new Date().toISOString(),
        hora: new Date().toLocaleTimeString('es-CO')
    };

    movimientosCaja.push(nuevoMovimiento);

    if (tipo === 'ingreso') {
        estadoCaja.ingresosDia += nuevoMovimiento.monto;
        estadoCaja.saldoActual += nuevoMovimiento.monto;
    } else {
        estadoCaja.egresosDia += nuevoMovimiento.monto;
        estadoCaja.saldoActual -= nuevoMovimiento.monto;
    }

    actualizarEstadoCaja();
    actualizarMovimientos();
}

function actualizarEstadoCaja() {
    document.getElementById('dineroInicial').textContent = `${estadoCaja.dineroInicial.toLocaleString()}`;
    document.getElementById('ingresosDia').textContent = `${estadoCaja.ingresosDia.toLocaleString()}`;
    document.getElementById('egresosDia').textContent = `${estadoCaja.egresosDia.toLocaleString()}`;
    document.getElementById('saldoActual').textContent = `${estadoCaja.saldoActual.toLocaleString()}`;
}

function actualizarMovimientos() {
    const container = document.getElementById('listaMovimientos');
    container.innerHTML = '';

    const movimientosHoy = movimientosCaja
        .filter(m => {
            const fechaMovimiento = new Date(m.fecha).toDateString();
            const fechaHoy = new Date().toDateString();
            return fechaMovimiento === fechaHoy;
        })
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    movimientosHoy.forEach(movimiento => {
        const tipoClass = movimiento.tipo === 'ingreso' ? 'transaction-in' : 'transaction-out';
        const signo = movimiento.tipo === 'ingreso' ? '+' : '-';
        const color = movimiento.tipo === 'ingreso' ? 'var(--verde-exito)' : 'var(--rojo-error)';

        const movimientoHtml = `
                    <div class="transaction-item ${tipoClass}">
                        <div>
                            <strong>${movimiento.descripcion}</strong>
                            <p style="margin: 5px 0; color: #CCCCCC; font-size: 0.9em;">
                                ${movimiento.hora} - ${movimiento.tipo.charAt(0).toUpperCase() + movimiento.tipo.slice(1)}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 1.2rem; font-weight: bold; color: ${color};">
                                ${signo}${movimiento.monto.toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
        container.innerHTML += movimientoHtml;
    });

    if (movimientosHoy.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #CCCCCC; padding: 2rem;">No hay movimientos registrados para hoy</p>';
    }
}

// Formulario de movimientos de caja
document.getElementById('formularioMovimiento').addEventListener('submit', function (e) {
    e.preventDefault();

    const tipo = document.getElementById('tipoMovimiento').value;
    const monto = parseInt(document.getElementById('montoMovimiento').value);
    const descripcion = document.getElementById('descripcionMovimiento').value;

    registrarMovimientoCaja(tipo, monto, descripcion);

    alert(`Movimiento registrado exitosamente!\nTipo: ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}\nMonto: ${monto.toLocaleString()}`);
    this.reset();
});

// Función para editar empleado
function editarEmpleado(empleadoId) {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (empleado) {
        alert(`Función de edición para: ${empleado.nombre}\n(Esta funcionalidad se puede implementar con un modal)`);
    }
}

// Función para cambiar estado del empleado
function toggleEstadoEmpleado(empleadoId) {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (empleado) {
        empleado.estado = empleado.estado === 'Activo' ? 'Inactivo' : 'Activo';
        actualizarTablaEmpleados();
        alert(`Estado del empleado ${empleado.nombre} cambiado a: ${empleado.estado}`);
    }
}

// Filtros de búsqueda
document.getElementById('filtroClientes').addEventListener('input', function () {
    const filtro = this.value.toLowerCase();
    const rows = document.querySelectorAll('#tablaClientes tr');

    rows.forEach(row => {
        const texto = row.textContent.toLowerCase();
        row.style.display = texto.includes(filtro) ? '' : 'none';
    });
});

document.getElementById('filtroPedidos').addEventListener('input', function () {
    const filtro = this.value.toLowerCase();
    const rows = document.querySelectorAll('#tablaPedidos tr');

    rows.forEach(row => {
        const texto = row.textContent.toLowerCase();
        row.style.display = texto.includes(filtro) ? '' : 'none';
    });
});

document.getElementById('filtroEmpleados').addEventListener('input', function () {
    const filtro = this.value.toLowerCase();
    const rows = document.querySelectorAll('#tablaEmpleados tr');

    rows.forEach(row => {
        const texto = row.textContent.toLowerCase();
        row.style.display = texto.includes(filtro) ? '' : 'none';
    });
});

document.getElementById('filtroMovimientos').addEventListener('input', function () {
    const filtro = this.value.toLowerCase();
    const items = document.querySelectorAll('.transaction-item');

    items.forEach(item => {
        const texto = item.textContent.toLowerCase();
        item.style.display = texto.includes(filtro) ? '' : 'none';
    });
});

// Auto-generar código de prenda si está vacío
document.getElementById('tipoPrendaPedido').addEventListener('change', function () {
    if (document.getElementById('codigoPrenda').value === '') {
        document.getElementById('codigoPrenda').value = generarCodigoPrenda();
    }
});

// Validaciones de formularios
document.getElementById('costoArreglo').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
});

document.getElementById('abonoCliente').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');

    const costo = parseInt(document.getElementById('costoArreglo').value) || 0;
    const abono = parseInt(this.value) || 0;

    if (abono > costo) {
        this.style.borderColor = 'var(--rojo-error)';
    } else {
        this.style.borderColor = '';
    }
});

document.getElementById('cedulaPedido').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
});

document.getElementById('cedulaEmpleado').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
});

document.getElementById('montoMovimiento').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '');
});

// Drag and drop para imagen
const fileUploadArea = document.querySelector('.file-upload-area');

fileUploadArea.addEventListener('dragover', function (e) {
    e.preventDefault();
    this.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', function (e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
            document.getElementById('fotoEmpleado').files = files;
            document.getElementById('fotoEmpleado').dispatchEvent(new Event('change'));
        } else {
            alert('Por favor, selecciona un archivo de imagen válido');
        }
    }
});

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function () {
    actualizarTablaClientes();
    actualizarTablaPedidos();
    actualizarTablaEmpleados();
    actualizarEstadoCaja();
    actualizarMovimientos();

    // Simular algunos movimientos iniciales
    setTimeout(() => {
        registrarMovimientoCaja('ingreso', 75000, 'Abono pedido P001 - María González');
        registrarMovimientoCaja('ingreso', 50000, 'Pago completo pedido anterior');
        registrarMovimientoCaja('egreso', 10000, 'Compra de hilos y cremalleras');
    }, 1000);
});

// Función placeholder para editar pedido
function editarPedido(pedidoId) {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
        alert(`Función de edición para pedido: ${pedido.id}\nCliente: ${pedido.cliente}\n(Esta funcionalidad se puede implementar con un modal)`);
    }
}
