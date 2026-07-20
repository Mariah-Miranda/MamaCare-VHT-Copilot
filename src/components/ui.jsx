import { useState } from 'react'
import { Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react'

export function Button({ children, variant = 'primary', icon: Icon, className = '', type = 'button', onClick, disabled = false }) {
  return <button type={type} className={`button button-${variant} ${className}`} onClick={onClick} disabled={disabled}>{Icon && <Icon size={16} strokeWidth={2} />}{children}</button>
}

export function StatCard({ label, value, note, icon: Icon, tone = 'blue', trend }) {
  return <div className="stat-card"><div className="stat-top"><div className={`stat-icon stat-icon-${tone}`}><Icon size={18} /></div>{trend && <span className={`stat-trend ${trend.startsWith('+') ? 'positive' : ''}`}>{trend}</span>}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{note && <div className="stat-note">{note}</div>}</div>
}

export function SearchBox({ value, onChange, placeholder = 'Search...' }) {
  return <div className="search-box"><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />{value && <button onClick={() => onChange('')} aria-label="Clear search"><X size={14} /></button>}</div>
}

export function Select({ value, onChange, options, placeholder, className = '' }) {
  return <div className={`select-wrap ${className}`}><select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{placeholder || 'Select'}</option>{options.map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}</select><ChevronDown size={15} /></div>
}

export function Field({ label, value, onChange, placeholder, type = 'text', required = false, error, hint, className = '' }) {
  return <label className={`field ${className}`}><span className="field-label">{label}{required && <em>*</em>}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{hint && <span className="field-hint">{hint}</span>}{error && <span className="field-error">{error}</span>}</label>
}

export function Textarea({ label, value, onChange, placeholder, rows = 4, className = '' }) {
  return <label className={`field ${className}`}><span className="field-label">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} /></label>
}

export function Checkbox({ checked, onChange, label, tone = 'blue' }) {
  return <label className="checkbox-row"><button type="button" className={`checkbox ${checked ? `checked ${tone}` : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>{checked && <Check size={13} strokeWidth={3} />}</button><span>{label}</span></label>
}

export function LoadingButton({ loading, children, ...props }) {
  return <Button {...props} disabled={loading || props.disabled}>{loading && <LoaderCircle size={16} className="spin" />}{children}</Button>
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  return <div className={`toast toast-${toast.tone || 'success'}`}><div className="toast-check"><Check size={14} /></div><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button onClick={onClose}><X size={15} /></button></div>
}

export function Modal({ title, description, children, onClose, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`modal ${wide ? 'modal-wide' : ''}`}><div className="modal-header"><div><h3>{title}</h3>{description && <p>{description}</p>}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="empty-state">{Icon && <div className="empty-icon"><Icon size={24} /></div>}<h3>{title}</h3><p>{description}</p>{action}</div>
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const showToast = (next) => { setToast(next); window.setTimeout(() => setToast(null), 4200) }
  return { toast, showToast, dismissToast: () => setToast(null) }
}
