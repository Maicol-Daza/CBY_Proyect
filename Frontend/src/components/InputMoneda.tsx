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
    let raw = e.target.value;
    
    // Remover el símbolo $ si se intenta escribir
    raw = raw.replace(/\$/g, '');
    
    setDisplayValue(raw);
    
    // Extraer solo números
    const cleaned = raw.replace(/[^\d]/g, '');
    const numero = cleaned ? parseInt(cleaned, 10) : 0;
    onChange(numero);
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
      // Posicionar cursor al final
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevenir que el cursor vaya antes del símbolo $
    if (inputRef.current) {
      // Si intenta ir al inicio, mantén el cursor después del $
      if (e.key === 'Home') {
        e.preventDefault();
        inputRef.current.selectionStart = 0;
      }
    }
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