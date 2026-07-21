import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, Filter, MapPin, Plus, SlidersHorizontal, UserRoundPlus, Users, X } from 'lucide-react'
import { Avatar, PageHeader, RiskPill } from '../components/Layout'
import { Button, EmptyState, SearchBox, Select, useToast } from '../components/ui'
import { useLanguage } from '../i18n'
import { careApi } from '../lib/api'

export default function Mothers({ user, onRegister }) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [visibleMothers, setVisibleMothers] = useState([])
  useEffect(() => { careApi.mothers().then(({ data }) => setVisibleMothers((data.mothers || []).map(mapMother))).catch(() => setVisibleMothers([])) }, [])
  const filtered = useMemo(() => visibleMothers.filter((mother) => `${mother.name} ${mother.village} ${mother.phone}`.toLowerCase().includes(search.toLowerCase()) && (!risk || mother.risk === risk)), [visibleMothers, search, risk])
  const { toast, showToast, dismissToast } = useToast()
  return <div>
    <PageHeader eyebrow={t('mothers.eyebrow')} title={t('mothers.title')} description={t('mothers.description')} actions={<Button icon={Plus} onClick={onRegister}>{t('mothers.register')}</Button>} />
    <div className="list-toolbar"><SearchBox value={search} onChange={setSearch} placeholder={t('mothers.search')} /><button className={`filter-button ${showFilters || risk ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={16} /> Filters{risk && <span>1</span>}</button><div className="toolbar-spacer" /><div className="view-count">{filtered.length} {t('mothers.of')} {visibleMothers.length} {t('mothers.mothers')}</div></div>
    {showFilters && <div className="filter-drawer"><div className="filter-label">Risk status</div><div className="filter-options"><button className={!risk ? 'selected' : ''} onClick={() => setRisk('')}>All mothers</button>{['High', 'Moderate', 'Low'].map((item) => <button key={item} className={risk === item ? 'selected' : ''} onClick={() => setRisk(item)}>{item} risk</button>)}</div><button className="icon-button" onClick={() => setShowFilters(false)}><X size={16} /></button></div>}
    <div className="mothers-table panel"><div className="table-header"><span>Mother</span><span>Pregnancy</span><span>Last visit</span><span>Next follow-up</span><span>Risk status</span><span /></div>{filtered.map((mother) => <Link to={`/mothers/${mother.id}`} className="mother-row" key={mother.id}><div className="mother-cell"><Avatar initials={mother.initials} color={mother.color} /><div><strong>{mother.name}</strong><span><MapPin size={12} />{mother.village}</span></div></div><div className="pregnancy-cell"><strong>{mother.gestationalWeeks} weeks</strong><span>G{mother.gravidity} P{mother.parity}</span></div><div className="date-cell"><strong>{mother.lastVisit}</strong><span>ANC visit</span></div><div className="date-cell"><strong className={mother.nextVisit === 'Today' ? 'today-text' : ''}>{mother.nextVisit}</strong><span>{mother.nextVisit === 'Today' ? 'Needs attention' : 'Scheduled'}</span></div><div><RiskPill level={mother.risk} /><span className="risk-reason">{mother.riskReason}</span></div><ChevronRight size={17} className="row-chevron" /></Link>)}{filtered.length === 0 && <EmptyState icon={Users} title={t('mothers.noResults')} description={t('mothers.tryFilters')} action={<Button variant="secondary" onClick={() => { setSearch(''); setRisk('') }}>Clear filters</Button>} />}</div>
    <div className="list-footer"><span><span className="footer-dot" />Care list synced just now</span><span>{visibleMothers.length ? `${visibleMothers.length} record${visibleMothers.length === 1 ? '' : 's'}` : 'No records yet'}</span></div>
    {toast && <div className="toast-wrap"><div className="toast toast-success"><strong>{toast.title}</strong><span>{toast.message}</span><button onClick={dismissToast}><X size={15} /></button></div></div>}
  </div>
}

export function RegisterMother({ onBack, onRegistered }) {
  const { t } = useLanguage()
  const [form, setForm] = useState({ fullName: '', age: '', village: '', phone: '', weeks: '', gravida: '', parity: '', contact: '', bloodGroup: '', edd: '', history: '', allergies: '', complications: '' })
  const [errors, setErrors] = useState({})
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.fullName) nextErrors.fullName = 'Enter the mother’s name.'
    if (!form.age) nextErrors.age = 'Required'
    if (!form.phone) nextErrors.phone = 'Required'
    if (!form.weeks) nextErrors.weeks = 'Required'
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) {
      try {
        await careApi.registerMother({ fullName: form.fullName, age: Number(form.age), village: form.village, phone: form.phone, weeksPregnant: Number(form.weeks), gravida: Number(form.gravida || 0), parity: Number(form.parity || 0), emergencyContact: form.contact, bloodGroup: form.bloodGroup, expectedDeliveryDate: form.edd, medicalHistory: form.history, allergies: form.allergies, previousComplications: form.complications, emergencyNotes: '' })
        onRegistered(form)
      } catch (error) { setErrors({ form: error.response?.data?.error || 'Unable to save this record.' }) }
    }
  }
  return <div>
    <PageHeader eyebrow={t('mothers.newEyebrow')} title={t('mothers.newTitle')} description={t('mothers.newDescription')} actions={<Button variant="ghost" onClick={onBack}>Cancel</Button>} />
    <form className="form-layout" onSubmit={submit}>
      <div className="form-main">
        <section className="form-card panel"><FormSection title={t('mothers.personalInfo')} description={t('mothers.personalDescription')} icon={<UserRoundPlus size={17} />}><div className="form-grid"><Input label="Full name" value={form.fullName} onChange={set('fullName')} required error={errors.fullName} placeholder="e.g. Maria Nankya" /><Input label="Age" value={form.age} onChange={set('age')} required error={errors.age} placeholder="Years" type="number" /><Input label="Phone number" value={form.phone} onChange={set('phone')} required error={errors.phone} placeholder="+256 7XX XXX XXX" /><SelectField label="Village / parish" value={form.village} onChange={set('village')} options={['Kanyanya Parish', 'Kawempe Parish', 'Mpererwe Parish']} /><Input label="Emergency contact" value={form.contact} onChange={set('contact')} placeholder="Name and phone number" className="span-2" /></div></FormSection></section>
        <section className="form-card panel"><FormSection title={t('mothers.pregnancyDetails')} description={t('mothers.pregnancyDescription')} icon={<MapPin size={17} />}><div className="form-grid"><Input label="Weeks pregnant" value={form.weeks} onChange={set('weeks')} required error={errors.weeks} placeholder="e.g. 24" type="number" /><Input label="Gravida" value={form.gravida} onChange={set('gravida')} placeholder="e.g. 2" type="number" /><Input label="Parity" value={form.parity} onChange={set('parity')} placeholder="e.g. 1" type="number" /><SelectField label="Blood group" value={form.bloodGroup} onChange={set('bloodGroup')} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} /><Input label="Expected delivery date" value={form.edd} onChange={set('edd')} placeholder="dd / mm / yyyy" type="date" className="span-2" /></div></FormSection></section>
        <section className="form-card panel"><FormSection title={t('mothers.healthContext')} description={t('mothers.healthDescription')} icon={<ShieldIcon />}><div className="form-grid"><TextField label="Medical history" value={form.history} onChange={set('history')} placeholder="Previous conditions, surgeries or ongoing care" /><TextField label="Allergies" value={form.allergies} onChange={set('allergies')} placeholder="Medicines or other known allergies" /><TextField label="Previous pregnancy complications" value={form.complications} onChange={set('complications')} placeholder="e.g. high blood pressure, haemorrhage" className="span-2" /></div></FormSection></section>
      </div>
      <aside className="form-side"><div className="info-card"><div className="info-card-icon"><ShieldIcon /></div><strong>Good records support good care</strong><p>Complete as much as you can. You can always update this record after registration.</p></div><div className="form-actions panel"><Button variant="ghost" onClick={onBack}>Cancel</Button><Button type="submit">Save mother <ArrowUpRight size={15} /></Button></div></aside>
    </form>
  </div>
}

function mapMother(item) {
  const name = item.full_name || ''
  return { id: String(item.id), name, age: item.age, village: item.village || '', phone: item.phone || '', gestationalWeeks: item.weeks_pregnant || 0, gravidity: item.gravida || 0, parity: item.parity || 0, lastVisit: 'No visits yet', nextVisit: 'Not scheduled', risk: 'Low', riskReason: 'Not assessed', initials: name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(), color: 'teal' }
}

function FormSection({ title, description, icon, children }) { return <div className="form-section"><div className="form-section-title"><div className="section-icon">{icon}</div><div><h2>{title}</h2><p>{description}</p></div></div>{children}</div> }
function Input({ label, value, onChange, placeholder, type, required, error, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}{required && <em>*</em>}</span><input type={type || 'text'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />{error && <span className="field-error">{error}</span>}</label> }
function TextField({ label, value, onChange, placeholder, className = '' }) { return <label className={`field ${className}`}><span className="field-label">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows="3" /></label> }
function SelectField({ label, value, onChange, options }) { return <label className="field"><span className="field-label">{label}</span><Select value={value} onChange={onChange} options={options} /></label> }
function ShieldIcon() { return <ShieldMark /> }
function ShieldMark() { return <span className="shield-mark">✦</span> }
