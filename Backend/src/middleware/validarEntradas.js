// Middleware de validación (lista blanca) para el backend
const ERR = {
  nombre: 'El nombre solo puede contener letras A-Z y espacios (sin acentos).',
  cedula: 'La identificación sólo puede contener dígitos y puntos (ej. 10.123.456).',
  telefono: 'El teléfono sólo puede contener dígitos (ej. 3101234567) y debe tener 10 dígitos.',
  email: 'Formato de correo inválido (ej. ejemplo.usuario@dominio.com).',
  edad: 'La edad debe ser un número entero entre 18 y 100.',
  direccion: 'La dirección sólo puede contener letras, números, espacios, # y -.'
};

const isValidName = (v) => {
  if (!v) return false;
  return /^[A-Za-z ]+$/.test(String(v).trim());
};

const isValidCedula = (v) => {
  if (!v) return false;
  return /^[0-9.]+$/.test(String(v).trim());
};

const isValidTelefono = (v, expectedLength = 10) => {
  if (!v) return false;
  const s = String(v).trim();
  return /^[0-9]+$/.test(s) && s.length === expectedLength;
};

const isValidEmail = (v) => {
  if (!v) return false;
  return /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(v).trim());
};

const isValidDireccion = (v) => {
  if (!v) return true;
  return /^[A-Za-z0-9 #\-]+$/.test(String(v).trim());
};

// Validar cliente en req.body.cliente
const validarCliente = (req, res, next) => {
  const cliente = req.body.cliente || req.body;
  const errores = {};

  if (!cliente || typeof cliente !== 'object') {
    return res.status(400).json({ message: 'Cliente inválido o ausente' });
  }

  // Aceptar tanto 'cedula' como 'nuip' para compatibilidad
  const cedula = cliente.cedula || cliente.nuip;

  if (!cliente.nombre || !isValidName(cliente.nombre)) errores.nombre = ERR.nombre;
  if (!cedula || !isValidCedula(cedula)) errores.cedula = ERR.cedula;
  if (!cliente.telefono || !isValidTelefono(cliente.telefono, 10)) errores.telefono = ERR.telefono;
  if (cliente.email && !isValidEmail(cliente.email)) errores.email = ERR.email;
  if (cliente.direccion && !isValidDireccion(cliente.direccion)) errores.direccion = ERR.direccion;

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ message: 'Errores de validación', errores });
  }

  next();
};

// Validaciones básicas para pedido (fechas, totales)
const validarPedido = (req, res, next) => {
  const pedido = req.body.pedido || {};
  const errores = {};

  if (!pedido.fechaInicio) errores.fechaInicio = 'La fecha de inicio es obligatoria.';
  if (!pedido.fechaEntrega) errores.fechaEntrega = 'La fecha de entrega es obligatoria.';

  if (pedido.fechaInicio && pedido.fechaEntrega) {
    const fi = new Date(pedido.fechaInicio);
    const fe = new Date(pedido.fechaEntrega);
    if (fe < fi) errores.fechas = 'La fecha de entrega no puede ser anterior a la de inicio.';
  }

  // Se retiró la validación estricta sobre abono para permitir mayor flexibilidad en el frontend/back

  if (Object.keys(errores).length > 0) return res.status(400).json({ message: 'Errores de validación en pedido', errores });

  next();
};

// Validar usuario en req.body (crear/actualizar usuario)
const validarUsuario = (req, res, next) => {
  const { nombre, email, clave } = req.body || {};
  const errores = {};

  if (!nombre || !isValidName(nombre)) errores.nombre = ERR.nombre;
  if (!email || !isValidEmail(email)) errores.email = ERR.email;

  // Para creación (POST) la clave es obligatoria y debe tener al menos 6 caracteres
  if (req.method === 'POST') {
    if (!clave || String(clave).trim().length < 6) errores.clave = 'La clave es obligatoria y debe tener al menos 6 caracteres.';
  } else {
    // Para actualización (PUT) sólo validar si se envía clave
    if (clave !== undefined && String(clave).trim() !== '' && String(clave).trim().length < 6) {
      errores.clave = 'La clave debe tener al menos 6 caracteres si desea cambiarla.';
    }
  }

  if (Object.keys(errores).length > 0) return res.status(400).json({ message: 'Errores de validación en usuario', errores });

  next();
};

module.exports = {
  validarCliente,
  validarPedido,
  validarUsuario,
  ERR,
  isValidName,
  isValidCedula,
  isValidTelefono,
  isValidEmail,
  isValidDireccion
};

