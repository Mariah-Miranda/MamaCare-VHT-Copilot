import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleAlert, Sparkles } from 'lucide-react'
import { PageHeader, Pill, RiskPill } from '../components/Layout'
import { Button, EmptyState, Select, Textarea } from '../components/ui'
import { assessmentApi, careApi } from '../lib/api'
import { useLanguage } from '../i18n'

export default function Assistant() {
  const { t } = useLanguage()
  const [mothers, setMothers] = useState([])
  const [motherId, setMotherId] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    careApi.mothers().then(({ data }) => {
      const records = data.mothers || []
      setMothers(records)
      if (records.length) setMotherId(String(records[0].id))
    }).catch(() => setMothers([]))
  }, [])

  async function assess() {
    const mother = mothers.find((item) => String(item.id) === motherId)
    if (!mother || !question.trim()) return
    setLoading(true); setError('')
    try {
      const { data } = await assessmentApi.analyze({ mother, question: question.trim() })
      setResult(data.assessment)
    } catch (requestError) { setError(requestError.response?.data?.error || 'The assessment could not be generated.') } finally { setLoading(false) }
  }

  return <div>
    <PageHeader eyebrow={t('assistant.eyebrow')} title={t('assistant.title')} description={t('assistant.description')} actions={<Pill tone="purple"><Sparkles size={13} /> {t('assistant.online')}</Pill>} />
    {!mothers.length ? <section className="panel"><EmptyState icon={CircleAlert} title="Register a mother first" description="The copilot needs a real pregnancy record before it can provide decision support." action={<Link to="/mothers/new"><Button>Register mother</Button></Link>} /></section> : <section className="panel ask-panel">
      <div className="panel-header"><div><h2>Start with context</h2><p>Choose a mother and describe what you need help with.</p></div></div>
      <label className="field"><span className="field-label">Mother</span><Select value={motherId} onChange={setMotherId} options={mothers.map((mother) => ({ value: String(mother.id), label: mother.full_name }))} /></label>
      <Textarea label="What would you like to understand?" value={question} onChange={setQuestion} placeholder="Ask about a symptom, danger sign, or next step" rows={4} />
      {error && <div className="form-alert">{error}</div>}
      <Button icon={Sparkles} onClick={assess} disabled={!question.trim() || loading}>{loading ? 'Generating…' : 'Generate assessment'}</Button>
      {result && <div className="assistant-result"><div className="result-risk-row"><div><span>Risk classification</span><strong>{result.riskLevel}</strong></div><RiskPill level={result.riskLevel} /></div><Result title="Possible conditions" value={result.possibleConditions} /><Result title="Danger signs identified" value={result.dangerSignsIdentified} /><Result title="Immediate actions" value={result.immediateActions} /><Result title="Referral recommendation" value={result.referralRecommendation} /><Result title="Follow-up plan" value={result.followUpPlan} /><div className="ai-disclaimer">AI decision support only. Confirm with a supervising health worker.</div></div>}
    </section>}
  </div>
}

function Result({ title, value }) {
  const items = Array.isArray(value) ? value : value ? [value] : []
  return <div className="result-section"><span className="result-section-title">{title}</span>{items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>None recorded.</p>}</div>
}
