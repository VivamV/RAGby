import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

//i dont think iska koi use case hai
export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ChatNameModal({ onSubmit, onCancel, initialValue = "", isEdit = false }) {
  const [chatName, setChatName] = useState(initialValue);

  useEffect(() => {
    setChatName(initialValue);
  }, [initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (chatName.trim()) {
      onSubmit(chatName.trim());
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Chat Name' : 'Name Your Chat'}</h3>
          <button className="modal-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <label className="form-label">Chat Name</label>
              <input
                type="text"
                className="input"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter a name for this chat..."
                autoFocus
                maxLength={50}
              />
              <p className="small-muted">Give your chat a descriptive name to easily find it later.</p>
            </div>
            
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn secondary" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!chatName.trim()}>
                {isEdit ? 'Update' : 'Create Chat'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
