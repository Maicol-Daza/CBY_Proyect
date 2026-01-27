import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, message, onConfirm, onCancel, confirmText = "Aceptar", cancelText = "Cancelar" }) {
  if (!open) return null;
  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <div className="confirm-modal-title">Confirmación</div>
        <div className="confirm-modal-message">{message}</div>
        <div className="confirm-modal-actions">
          <button className="confirm-btn confirm-btn-accept" onClick={onConfirm}>{confirmText}</button>
          <button className="confirm-btn confirm-btn-cancel" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
}
