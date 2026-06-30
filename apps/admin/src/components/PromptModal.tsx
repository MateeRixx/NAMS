import { useState, useEffect } from 'react';

interface PromptModalProps {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function PromptModal({ open, title, label, placeholder, confirmLabel = 'Submit', cancelLabel = 'Cancel', onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => { if (open) setValue(''); }, [open]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="input-group">
          <label>{label}</label>
          <input className="input" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} autoFocus />
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary" onClick={() => onConfirm(value)} disabled={!value.trim()}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
