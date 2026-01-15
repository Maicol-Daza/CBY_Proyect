import { ChangeEvent, useState, useEffect, useRef } from 'react';
import { formatCOP } from '../utils/formatCurrency';

interface InputMonedaProps {
  value: number;
  onChange: (valor: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  step?: string;
}

export const InputMoneda = ({
  value,
  onChange,
  placeholder = '$ 0,00',
  disabled = false,
  min = 0,
  step = '1'
}: InputMonedaProps) => {
  const [displayValue, setDisplayValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar displayValue cuando value cambia externamente
  useEffect(() => {
    if (value > 0) {
      setDisplayValue(formatCOP(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const raw = input.value;
    // Extraer solo números
    const cleaned = raw.replace(/[^\d]/g, '');
    const numero = cleaned ? parseInt(cleaned, 10) : 0;
    // Formatear el número
    const formatted = cleaned ? formatCOP(numero) : '';
    // Calcular la nueva posición del cursor
    let selectionStart = input.selectionStart || 0;
    // Contar dígitos antes del cursor en el valor sin formato
    let digitsBeforeCursor = raw.slice(0, selectionStart).replace(/[^\d]/g, '').length;
    // Encontrar la nueva posición del cursor después de formatear
    let newCursorPos = 0;
    let digitCount = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      if (digitCount === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    setDisplayValue(formatted);
    onChange(numero);
    // Actualizar el cursor después del renderizado
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = inputRef.current.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  const handleBlur = () => {
    // Formatear al perder el foco
    if (displayValue.trim() === '') {
      setDisplayValue('');
    } else {
      setDisplayValue(value > 0 ? formatCOP(value) : '');
    }
  };

  const handleFocus = () => {
    // Al hacer foco, mostrar solo números sin formato
    if (value > 0) {
      setDisplayValue(value.toString());
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 0);
    }
  };

  // Ya no es necesario forzar el cursor por el símbolo $
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Permitir comportamiento normal
  };

  return (
    <div className="input-moneda-container">
      <span className="currency-symbol"></span>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="input-moneda"
      />
    </div>
  );
};