import React, { createContext, useContext, useState, useCallback } from 'react';

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    const newAlert = { id, message, type };
    
    setAlerts(prev => [...prev, newAlert]);

    // Auto-cerrar después de 4 segundos
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 4000);

    return id;
  }, []);

  const closeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  // Helpers para diferentes tipos
  const success = useCallback((message) => showAlert(message, 'success'), [showAlert]);
  const error = useCallback((message) => showAlert(message, 'error'), [showAlert]);
  const warning = useCallback((message) => showAlert(message, 'warning'), [showAlert]);
  const info = useCallback((message) => showAlert(message, 'info'), [showAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, closeAlert, success, error, warning, info }}>
      {children}
      
      {/* Container de alertas */}
      <div className="alert-container-global">
        {alerts.map((alert) => (
          <div 
            key={alert.id} 
            className={`alert-custom alert-${alert.type}`}
            onClick={() => closeAlert(alert.id)}
          >
            <div className="alert-icon">
              {alert.type === 'success' && '✓'}
              {alert.type === 'error' && '✕'}
              {alert.type === 'warning' && '⚠'}
              {alert.type === 'info' && 'ℹ'}
            </div>
            <div className="alert-content">
              <p className="alert-message">{alert.message}</p>
            </div>
            <button className="alert-close" onClick={(e) => { e.stopPropagation(); closeAlert(alert.id); }}>
              ×
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export default AlertContext;
