export const formatCOP = (value: number | string | undefined | null) => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
};