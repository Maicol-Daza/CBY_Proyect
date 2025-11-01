require('dotenv').config();
const express = require('express'); // Framework Express para la creación del servidor
const cors = require('cors');       // Permite solicitudes de otros dominios

const app = express();

// Middlewares
app.use(cors()); 
app.use(express.json({ limit: '20mb' })); // Recibe datos en formato JSON con límite
app.use(express.urlencoded({ extended: true, limit: '20mb' })); // Recibe datos codificados

// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/rol-permiso', require('./routes/roles_permisos.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/usuarios', require('./routes/usuarios.routes'));
app.use('/api/clientes', require('./routes/clientes.routes'));
app.use('/api/cajones', require('./routes/cajones.routes'));
app.use('/api/codigos', require('./routes/codigos.routes'));
app.use('/api/ajustes', require('./routes/ajustes.routes'));
app.use('/api/acciones', require('./routes/acciones.routes'));
app.use('/api/ajustes_accion', require('./routes/ajustes_accion.routes'));
app.use('/api/pedidos', require('./routes/pedido_cliente.routes'));
app.use('/api/prendas', require('./routes/prendas.routes'));
app.use('/api/detalle-pedido-combo', require('./routes/detalle_pedido_combo.routes'));
app.use('/api/movimientos_caja', require('./routes/movimientos_caja.routes'));
app.use('/api/historial_abonos', require('./routes/historial_abonos.routes'));



module.exports = app;
