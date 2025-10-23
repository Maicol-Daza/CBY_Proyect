    const tablaSelect = document.getElementById('tablaSelect');
    const tituloTabla = document.getElementById('tituloTabla');
    const contenedorCards = document.getElementById('contenedorCards');
    const templateCard = document.getElementById('templateCard');
    const datoForm = document.getElementById('datoForm');
    const inputsContainer = document.getElementById('inputsContainer');
    const btnCancelar = document.getElementById('btnCancelar');

    // Campo oculto para ID dinámico
    const inputId = document.createElement('input');
    inputId.type = 'hidden';
    datoForm.appendChild(inputId);

    let API_URL = '';
    let META_URL = '';
    let idCampo = null;

    // ============================
    // Configuración dinámica de API
    // ============================
    function setTabla(tabla) {
        API_URL = `http://localhost:3000/api/${tabla}`;
        META_URL = `${API_URL}/meta`;
        tituloTabla.textContent = `Registros de ${tabla}`;
    }

    // ============================
    // Generar inputs dinámicos
    // ============================
    async function generarFormulario() {
        const res = await fetch(META_URL);
        const meta = await res.json();

        idCampo = meta.idCampo;
        inputId.name = idCampo;

        inputsContainer.innerHTML = '';
        meta.columnas.forEach(col => {
            if (col === idCampo) return;

            const div = document.createElement('div');
            const label = document.createElement('label');
            label.textContent = col + ':';
            label.setAttribute('for', col);

            const input = document.createElement('input');
            input.name = col;
            input.required = true;

            div.appendChild(label);
            div.appendChild(input);
            inputsContainer.appendChild(div);
        });
    }

    // ============================
    // CRUD básico
    // ============================
    async function obtenerRegistros() {
        const res = await fetch(API_URL);
        return await res.json();
    }

    async function crearRegistro(data) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    }

    async function actualizarRegistro(id, data) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    }

    async function eliminarRegistro(id) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        return await res.json();
    }

    // ============================
    // Mostrar registros
    // ============================
    async function mostrarRegistros() {
    contenedorCards.innerHTML = '';
    const respuesta = await obtenerRegistros(); // Recibir el objeto completo
    const registros = respuesta.data || [];     // Acceder al array

    registros.forEach(registro => {
        const clone = templateCard.content.cloneNode(true);

        const campos = Object.keys(registro);
        const campoNombre = campos.find(c => c !== idCampo);
        clone.querySelector('.nombreRegistro').textContent = registro[campoNombre];

        clone.querySelector('.btn-editar').onclick = () => cargarRegistroParaEditar(registro);
        clone.querySelector('.btn-eliminar').onclick = () => eliminarRegistroHandler(registro[idCampo]);

        contenedorCards.appendChild(clone);
    });
}

    // ============================
    // Guardar / actualizar
    // ============================
    datoForm.onsubmit = async (e) => {
        e.preventDefault();
        const data = {};
        new FormData(datoForm).forEach((value, key) => {
            if (key !== idCampo) data[key] = value;
        });

        if (inputId.value) {
            await actualizarRegistro(inputId.value, data);
        } else {
            await crearRegistro(data);
        }

        datoForm.reset();
        inputId.value = '';
        mostrarRegistros();
    };

    btnCancelar.onclick = () => {
        datoForm.reset();
        inputId.value = '';
    };

    function cargarRegistroParaEditar(registro) {
        inputId.value = registro[idCampo];
        Object.keys(registro).forEach(key => {
            const input = datoForm.querySelector(`[name="${key}"]`);
            if (input) input.value = registro[key];
        });
    }

    async function eliminarRegistroHandler(id) {
        await eliminarRegistro(id);
        mostrarRegistros();
    }

    // ============================
    // Cargar tablas dinámicamente
    // ============================
    async function cargarTablas() {
        const res = await fetch('http://localhost:3000/api/tablas');
        const tablas = await res.json();

        tablaSelect.innerHTML = '';
        tablas.forEach(tabla => {
            const option = document.createElement('option');
            option.value = tabla;
            option.textContent = tabla.charAt(0).toUpperCase() + tabla.slice(1);
            tablaSelect.appendChild(option);
        });

        if (tablas.length > 0) {
            init(tablas[0]);
        }
    }

    // ============================
    // Inicializar
    // ============================
    async function init(tabla) {
        setTabla(tabla);
        await generarFormulario();
        mostrarRegistros();
    }

    tablaSelect.onchange = (e) => init(e.target.value);

    // Arrancar cargando tablas dinámicas
    cargarTablas();
