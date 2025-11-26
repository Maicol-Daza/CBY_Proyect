// Utilidades de validación (lista blanca) para el frontend
export const ERR = {
  nombre: 'Error: El nombre solo puede contener letras A-Z y espacios (sin acentos).',
  cedula: 'Error: La identificación sólo puede contener dígitos y puntos (ej. 10.123.456).',
  telefono: 'Error: El teléfono sólo puede contener dígitos (ej. 3101234567) y debe tener 10 dígitos.',
  email: 'Error: Formato de correo inválido (ej. ejemplo.usuario@dominio.com).',
  edad: 'Error: La edad debe ser un número entero entre 18 y 100.',
  direccion: 'Error: La dirección sólo puede contener letras, números, espacios, # y -.'
};

export const isValidName = (v: string): boolean => {
  if (!v) return false;
  // Permitir sólo letras A-Z (mayúsculas o minúsculas) y espacios, sin acentos
  const re = /^[A-Za-z ]+$/;
  return re.test(v.trim());
};

export const isValidCedula = (v: string): boolean => {
  if (!v) return false;
  // Sólo dígitos y puntos
  const re = /^[0-9.]+$/;
  return re.test(v.trim());
};

export const isValidTelefono = (v: string, expectedLength = 10): boolean => {
  if (!v) return false;
  const re = /^[0-9]+$/;
  const s = v.trim();
  return re.test(s) && s.length === expectedLength;
};

export const isValidEmail = (v: string): boolean => {
  if (!v) return false;
  // Permitir letras, números, puntos, guiones en la parte local y dominio
  const re = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(v.trim());
};

export const isValidEdad = (v: number | string, min = 18, max = 100): boolean => {
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  if (isNaN(n)) return false;
  return Number.isInteger(n) && n >= min && n <= max;
};

export const isValidDireccion = (v: string): boolean => {
  if (!v) return true; // campo opcional
  // Permitir letras, números, espacios, # y -
  const re = /^[A-Za-z0-9 #\-]+$/;
  return re.test(v.trim());
};

export default {
  ERR,
  isValidName,
  isValidCedula,
  isValidTelefono,
  isValidEmail,
  isValidEdad,
  isValidDireccion
};
