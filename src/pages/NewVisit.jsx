import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Camera, Check, ChevronRight, CircleAlert, FileText, Headphones, HeartPulse, Info, Mic, Pause, Phone, Play, Plus, ScanLine, Sparkles, StopCircle, Upload, Volume2, X } from 'lucide-react'
import { isDemoAccount, mothers } from '../data'
import { assessmentApi } from '../lib/api'
import { Avatar, PageHeader, Pill, RiskPill } from '../components/Layout'
import { Button, Checkbox, EmptyState, Field, LoadingButton, Modal, Select, Textarea, useToast } from '../components/ui'
import { ApiScannerModal, ApiVoiceModal } from '../components/FieldAiTools'
import { useLanguage } from '../i18n'

const dangerSigns = ['Severe headache', 'Blurred vision', 'Vaginal bleeding', 'Convulsions', 'Reduced fetal movement', 'Severe abdominal pain', 'Loss of consciousness']

export default function NewVisit({ user, onSaved }) {
  const [params] = useSearchParams()
  const availableMothers = isDemoAccount(user) ? mothers : []
  const motherId = params.get('mother') || availableMothers[0]?.id || ''
  const mother = availableMothers.find((item) => item.id === motherId) || availableMothers[0] || { id: '', name: '', age: '', village: '', gestationalWeeks: 0, risk: 'Low', initials: '', color: 'teal' }
  const navigate = useNavigate()
  const [selectedMother, setSelectedMother] = useState(mother.id)
  const [form, setForm] = useState({ bp: '', weight: '', temperature: '', pulse: '', fetalMovement: 'Normal', gestation: String(mother.gestationalWeeks), symptoms: '', urine: 'Negative', sugar: '', notes: '' })
  const [selectedDanger, setSelectedDanger] = useState([])
  const [voiceText, setVoiceText] = useState('')
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [assessment, setAssessment] = useState(null)
  const { toast, showToast, dismissToast } = useToast()
  const { t } = useLanguage()
  const currentMother = availableMothers.find((item) => item.id === selectedMother) || mother
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }))
  const isUrgent = useMemo(() => selectedDanger.some((item) => ['Severe headache', 'Blurred vision', 'Vaginal bleeding', 'Convulsions', 'Loss of consciousness'].includes(item)) || (Number(form.bp?.split('/')[0]) >= 140 && Number(form.bp?.split('/')[1]) >= 90), [selectedDanger, form.bp])

  function toggleDanger(item) { setSelectedDanger((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]) }
  async function analyze() {
    setAnalyzing(true)
    const context = { mother: currentMother, vitals: { bloodPressure: form.bp, weight: form.weight, temperature: form.temperature, pulseRate: form.pulse, fetalMovement: form.fetalMovement, gestationalAge: form.gestation, urineProtein: form.urine, bloodSugar: form.sugar }, voiceObservations: voiceText, manualNotes: `${form.symptoms}\n${form.notes}`, dangerSigns: selectedDanger }
    try {
      const response = await assessmentApi.analyze(context)
      const result = response.data.assessment
      setAssessment({ risk: result.riskLevel, condition: result.possibleConditions?.[0] || 'Needs clinical review', signs: result.dangerSignsIdentified?.length ? result.dangerSignsIdentified : ['No danger signs identified'], actions: result.immediateActions || [], referral: result.referralRecommendation, urgency: result.followUpPlan || 'Review with supervising health worker', confidence: Math.round((result.confidence || .9) * 100), summary: result.visitSummary || result.explanation || 'Review the structured assessment with your supervising health worker.' })
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      const high = isUrgent
      setAssessment({ risk: high ? 'High' : selectedDanger.length ? 'Moderate' : 'Low', condition: high ? 'Possible gestational hypertension' : selectedDanger.length ? 'Needs closer observation' : 'No immediate concerns identified', signs: selectedDanger.length ? selectedDanger : ['No danger signs selected'], actions: high ? ['Refer immediately to the nearest Health Centre IV or hospital', 'Repeat blood pressure after 15 minutes if safe to do so', 'Contact the supervising midwife'] : ['Continue routine ANC monitoring', 'Reinforce medication and nutrition guidance'], referral: high ? 'Immediate' : 'Routine follow-up', urgency: high ? 'Immediate' : 'Next scheduled ANC visit', confidence: high ? 94 : 88, summary: high ? `${currentMother.name} has a combination of findings that require prompt clinical review. Support referral today and keep the mother accompanied.` : `${currentMother.name} appears stable based on the information recorded. Continue routine monitoring and provide clear return precautions.` })
    } finally { setAnalyzing(false) }
  }
  function saveVisit() { showToast({ title: 'Visit saved', message: `${currentMother.name}’s visit and assessment were added to the record.` }); if (onSaved) onSaved(); }

  if (!availableMothers.length) return <div><div className="back-link-wrap"><button onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button></div><PageHeader eyebrow={t('newVisit.eyebrow')} title={t('newVisit.title')} description={t('newVisit.description')} /><section className="panel empty-state"><EmptyState icon={HeartPulse} title="Register a mother first" description="A new visit needs a mother’s record before you can add observations." action={<Link to="/mothers/new"><Button icon={Plus}>Register mother</Button></Link>} /></section></div>

  return <div><div className="back-link-wrap"><button onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button></div><PageHeader eyebrow={t('newVisit.eyebrow')} title={t('newVisit.title')} description={t('newVisit.description')} actions={<Pill tone="neutral"><span className="pill-dot pill-dot-green" />{t('newVisit.draftSaved')}</Pill>} />
    <div className="visit-layout"><div className="visit-main"><section className="form-card panel"><div className="form-section-title"><div className="section-icon"><HeartPulse size={17} /></div><div><h2>{t('newVisit.who')}</h2><p>{t('newVisit.whoDescription')}</p></div></div><label className="field"><span className="field-label">Mother <em>*</em></span><Select value={selectedMother} onChange={(value) => { setSelectedMother(value); setForm((current) => ({ ...current, gestation: String(availableMothers.find((item) => item.id === value)?.gestationalWeeks || '') })) }} options={availableMothers.map((item) => ({ value: item.id, label: `${item.name} · ${item.gestationalWeeks} weeks` }))} /></label><div className="selected-mother"><Avatar initials={currentMother.initials} color={currentMother.color} /><div><strong>{currentMother.name}</strong><span>{currentMother.age} years · {currentMother.village}</span></div><RiskPill level={currentMother.risk} /><Link to={`/mothers/${currentMother.id}`}>View profile <ChevronRight size={14} /></Link></div></section>
      <section className="form-card panel"><div className="form-section-title"><div className="section-icon"><StethoscopeIcon /></div><div><h2>{t('newVisit.vitals')}</h2><p>{t('newVisit.vitalsDescription')}</p></div></div><div className="form-grid vitals-grid"><Field label="Blood pressure" value={form.bp} onChange={set('bp')} placeholder="e.g. 120/80" hint="mmHg" /><Field label="Weight" value={form.weight} onChange={set('weight')} placeholder="e.g. 62.5" hint="kg" /><Field label="Temperature" value={form.temperature} onChange={set('temperature')} placeholder="e.g. 36.7" hint="°C" /><Field label="Pulse rate" value={form.pulse} onChange={set('pulse')} placeholder="e.g. 78" hint="bpm" /><Field label="Gestational age" value={form.gestation} onChange={set('gestation')} placeholder="Weeks" hint="weeks" /><label className="field"><span className="field-label">Fetal movement</span><Select value={form.fetalMovement} onChange={set('fetalMovement')} options={['Normal', 'Reduced', 'Not yet felt']} /></label><label className="field"><span className="field-label">Urine protein</span><Select value={form.urine} onChange={set('urine')} options={['Negative', '+', '++', '+++']} /></label><Field label="Blood sugar" value={form.sugar} onChange={set('sugar')} placeholder="Optional" hint="mmol/L" /></div><div className="voice-strip"><div className="voice-strip-icon"><Headphones size={17} /></div><div><strong>{t('newVisit.voiceTitle')}</strong><span>{t('newVisit.voiceDescription')}</span></div><Button variant="secondary" icon={Mic} onClick={() => setVoiceOpen(true)}>{t('newVisit.useVoice')}</Button></div><div className="form-grid"><Textarea label={t('newVisit.symptoms')} value={form.symptoms} onChange={set('symptoms')} placeholder="What is the mother feeling today?" className="span-2" /><Textarea label={t('newVisit.notes')} value={form.notes} onChange={set('notes')} placeholder="Anything else worth carrying forward?" className="span-2" /></div></section>
      <section className="form-card panel"><div className="form-section-title"><div className="section-icon section-icon-red"><CircleAlert size={17} /></div><div><h2>{t('newVisit.dangerSigns')}</h2><p>{t('newVisit.dangerSignsDescription')}</p></div></div><div className="danger-grid">{dangerSigns.map((sign) => <Checkbox key={sign} label={sign} checked={selectedDanger.includes(sign)} onChange={() => toggleDanger(sign)} tone="red" />)}</div>{selectedDanger.length > 0 && <div className="selected-warning"><CircleAlert size={16} /><span><strong>{selectedDanger.length} danger sign{selectedDanger.length > 1 ? 's' : ''} selected.</strong> The assessment will prioritise a safety-first recommendation.</span></div>}</section>
      <div className="visit-actions"><Button variant="ghost" onClick={() => navigate(-1)}>{t('newVisit.saveDraft')}</Button><LoadingButton loading={analyzing} icon={Sparkles} onClick={analyze}>{analyzing ? 'Building assessment…' : t('newVisit.analyze')}</LoadingButton></div>
    </div><aside className="visit-side"><div className="side-sticky"><section className="tool-card scanner-card"><div className="tool-card-top"><div className="tool-icon tool-icon-blue"><ScanLine size={19} /></div><Pill tone="blue">Saves time</Pill></div><h3>{t('newVisit.scanCard')}</h3><p>{t('newVisit.scanDescription')}</p><button onClick={() => setScannerOpen(true)} className="tool-link">{t('newVisit.openScanner')} <ChevronRight size={15} /></button></section><section className="tool-card context-card"><div className="tool-card-top"><div className="tool-icon tool-icon-purple"><Sparkles size={19} /></div><span className="context-live"><i />{t('newVisit.liveContext')}</span></div><h3>{t('newVisit.contextTitle')}</h3><div className="context-list"><span><Check size={14} />{t('newVisit.motherProfile')}</span><span><Check size={14} />{t('newVisit.previousVisits')}</span><span><Check size={14} />{t('newVisit.todayVitals')}</span><span><Check size={14} />{t('newVisit.observations')}</span></div><p className="context-footnote"><Info size={13} />You stay in control of the final record.</p></section>{assessment && <AssessmentCard assessment={assessment} onSave={saveVisit} onDismiss={() => setAssessment(null)} />}</div></aside></div>
    {voiceOpen && <ApiVoiceModal initialText={voiceText} onClose={() => setVoiceOpen(false)} onSave={(text) => { setVoiceText(text); setForm((current) => ({ ...current, symptoms: current.symptoms ? `${current.symptoms}\n${text}` : text })); setVoiceOpen(false); showToast({ title: 'AI voice note added', message: 'Review the transcription in the symptoms field before analyzing.' }) }} />}
    {scannerOpen && <ApiScannerModal onClose={() => setScannerOpen(false)} onUse={(data) => { const weeks = String(data.gestationalAge || '').match(/\d+/)?.[0]; const cardNote = [data.healthFacility && `Facility: ${data.healthFacility}`, data.ancNumber && `ANC number: ${data.ancNumber}`, data.bloodGroup && `Blood group: ${data.bloodGroup}`].filter(Boolean).join(' · '); setForm((current) => ({ ...current, gestation: weeks || current.gestation, notes: cardNote ? `${current.notes ? `${current.notes}\n` : ''}ANC card: ${cardNote}` : current.notes })); setScannerOpen(false); showToast({ title: 'AI ANC card data added', message: 'Review the extracted fields and correct anything before saving.' }) }} />}
    {toast && <div className="toast-wrap"><div className="toast toast-success"><div className="toast-check"><Check size={14} /></div><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button onClick={dismissToast}><X size={15} /></button></div></div>}
  </div>
}

function AssessmentCard({ assessment, onSave, onDismiss }) {
  const urgent = assessment.risk === 'High'
  return <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`assessment-card ${urgent ? 'urgent' : ''}`}><div className="assessment-top"><div className="assessment-top-label"><Sparkles size={15} /><span>Copilot assessment</span></div><button className="assessment-close" onClick={onDismiss}><X size={16} /></button></div>{urgent && <div className="urgent-banner"><CircleAlert size={18} /><div><strong>URGENT REFERRAL REQUIRED</strong><span>Nearest recommended care: Health Centre IV or hospital · {assessment.urgency}</span></div></div>}<div className="assessment-risk"><div><span>Risk level</span><strong>{assessment.risk}</strong></div><RiskPill level={assessment.risk} /><span className="confidence">{assessment.confidence}% confidence</span></div><div className="assessment-section"><span className="assessment-label">Possible condition</span><strong>{assessment.condition}</strong></div><div className="assessment-section"><span className="assessment-label">Danger signs identified</span><div className="assessment-tags">{assessment.signs.map((sign) => <span key={sign}>{sign}</span>)}</div></div><div className="assessment-section"><span className="assessment-label">Immediate actions</span><ul>{assessment.actions.map((action) => <li key={action}>{action}</li>)}</ul></div><div className="assessment-section"><span className="assessment-label">Referral recommendation</span><div className={`referral-recommendation ${urgent ? 'red' : ''}`}><ArrowUpIcon /><div><strong>{assessment.referral}</strong><span>{assessment.urgency}</span></div></div></div><div className="assessment-section"><span className="assessment-label">Counseling to share</span><p className="counseling">“Please rest, keep your phone close, and seek help straight away if the headache worsens or you notice changes in your vision.”</p></div><div className="assessment-summary"><FileText size={15} /><span>{assessment.summary}</span></div><div className="assessment-actions">{urgent && <Button variant="danger" icon={FileText} onClick={() => window.print()}>Generate referral note</Button>} {urgent && <Button variant="secondary" icon={Phone} onClick={() => alert('Supervisor call placeholder')}>Call supervisor</Button>}<Button onClick={onSave}>Review & save visit</Button></div><div className="ai-disclaimer"><ShieldIcon /> Decision support only. Confirm with your supervising health worker.</div></motion.section>
}

/* Legacy browser-only demo components kept out of the live flow.
function VoiceModal({ onClose, onSave, initialText }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState(initialText)
  const timer = useRef(null)
  const recognitionRef = useRef(null)
  function toggle() {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      setProcessing(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => { setProcessing(false); setText((current) => current || 'The mother is 28 weeks pregnant and reports severe headache with blurred vision since this morning.') }, 700)
      return
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setRecording(true)
      timer.current = window.setTimeout(() => { setRecording(false); setProcessing(false); setText((current) => current || 'The mother is 28 weeks pregnant and reports severe headache with blurred vision since this morning.') }, 1500)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ')
      setText(transcript)
    }
    recognition.onerror = () => { setRecording(false); setProcessing(false) }
    recognition.onend = () => setRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }
  return <Modal title="Voice observations" description="Speak naturally. You can edit the transcript before adding it to the visit." onClose={onClose} wide><div className={`voice-modal ${recording ? 'is-recording' : ''} ${processing ? 'is-processing' : ''}`}><div className="voice-visual"><div className="voice-pulse pulse-one" /><div className="voice-pulse pulse-two" /><button className="record-button" onClick={toggle}>{processing ? <LoaderIcon /> : recording ? <StopCircle size={26} /> : <Mic size={26} />}</button></div><div className="voice-status">{recording ? <><span className="live-dot" />Listening… speak clearly</> : processing ? 'Processing your voice note…' : text ? 'Transcript ready for review' : 'Tap the microphone to begin'}</div><Textarea label="Transcript" value={text} onChange={setText} placeholder="Your transcription will appear here" rows={5} /><div className="voice-language"><Volume2 size={14} />English & Luganda supported on compatible devices</div></div><div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(text)} disabled={!text}>Add to visit</Button></div></Modal>
}

function ScannerModal({ onClose, onUse }) {
  const [scanned, setScanned] = useState(false)
  const [fileName, setFileName] = useState('')
  const uploadRef = useRef(null)
  const cameraRef = useRef(null)
  function handleFile(event) { const file = event.target.files?.[0]; if (!file) return; setFileName(file.name); setScanned(true) }
  return <Modal title="ANC card scanner" description="Capture a clear photo of the mother’s card. We’ll extract the details for you to review." onClose={onClose}><input ref={uploadRef} type="file" accept="image/*" hidden onChange={handleFile} /><input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} /><div className={`scanner-view ${scanned ? 'scanned' : ''}`}>{scanned ? <><div className="scan-success"><Check size={26} /></div><strong>Card details extracted</strong><span>{fileName || 'Review the fields below before using them.'}</span></> : <><ScanLine size={34} /><strong>Position the ANC card inside the frame</strong><span>Make sure the text is in focus and well lit.</span><div className="scan-frame" /></>}</div>{scanned && <div className="ocr-results"><OcrRow label="Mother’s name" value="Amina Nakato" confidence="98%" /><OcrRow label="Gestational age" value="32 weeks" confidence="94%" /><OcrRow label="Expected delivery" value="18 Sep 2025" confidence="91%" /><OcrRow label="ANC number" value="KAW-02418" confidence="87%" /></div>}<div className="scanner-actions">{!scanned && <><Button variant="secondary" icon={Upload} onClick={() => uploadRef.current?.click()}>Upload image</Button><Button icon={Camera} onClick={() => cameraRef.current?.click()}>Open camera</Button></>}{scanned && <><Button variant="ghost" onClick={() => setScanned(false)}>Scan again</Button><Button onClick={() => onUse({ weeks: '32' })}>Use details</Button></>}</div></Modal>
}

*/
function OcrRow({ label, value, confidence }) { return <div className="ocr-row"><span>{label}</span><strong>{value}</strong><Pill tone="success">{confidence}</Pill></div> }
function StethoscopeIcon() { return <span className="stethoscope-glyph">⌁</span> }
function ArrowUpIcon() { return <ChevronRight size={16} /> }
function LoaderIcon() { return <span className="spinner-ring" /> }
function ShieldIcon() { return <ShieldCheckIcon /> }
function ShieldCheckIcon() { return <span className="shield-mark">✦</span> }
