import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleAlert, FileText, MessageCircle, Mic, Phone, Sparkles, Stethoscope } from 'lucide-react'
import { Avatar, PageHeader, Pill, RiskPill } from '../components/Layout'
import { ApiVoiceModal } from '../components/FieldAiTools'
import { Button, Select, Textarea } from '../components/ui'
import { useLanguage } from '../i18n'

export default function Assistant() {
  const { t } = useLanguage()
  const [question, setQuestion] = useState('')
  const [showResult, setShowResult] = useState(true)
  const [showVoice, setShowVoice] = useState(false)
  const [mother, setMother] = useState('Amina Nakato')

  return (
    <div>
      <PageHeader eyebrow={t('assistant.eyebrow')} title={t('assistant.title')} description={t('assistant.description')} actions={<Pill tone="purple"><Sparkles size={13} /> {t('assistant.online')}</Pill>} />
      <div className="assistant-intro">
        <div className="assistant-intro-icon"><Sparkles size={22} /></div>
        <div><strong>Ask about a visit, a symptom, or a next step.</strong><span>The copilot brings together mother history, vitals, danger signs and your notes. It supports your judgment — it never replaces it.</span></div>
      </div>

      <div className="assistant-layout">
        <main>
          <section className="panel ask-panel">
            <div className="panel-header"><div><h2>Start with context</h2><p>Choose a mother, then describe what you need help with.</p></div><Pill tone="neutral">Private session</Pill></div>
            <label className="field"><span className="field-label">Mother</span><Select value={mother} onChange={setMother} options={['Amina Nakato', 'Grace Atim', 'Rose Nalwanga', 'Hajara Kintu']} /></label>
            <div className="prompt-box">
              <Textarea label="What would you like to understand?" value={question} onChange={setQuestion} placeholder="e.g. What should I check first given her blood pressure and headache?" rows={4} />
              <div className="prompt-bottom">
                <button className="voice-inline" onClick={() => setShowVoice(true)} type="button"><Mic size={15} />Use voice</button>
                <Button icon={Sparkles} onClick={() => setShowResult(true)}>Generate assessment</Button>
              </div>
            </div>
            <div className="suggestion-row"><span>Try asking:</span><button onClick={() => setQuestion('What danger signs should I ask about today?')}>What danger signs should I ask about today?</button><button onClick={() => setQuestion('Help me explain a same-day referral.')}>Help me explain a same-day referral.</button></div>
          </section>

          {showResult && <section className="panel assistant-result">
            <div className="assistant-result-top"><div><div className="result-kicker"><span className="result-live" />Latest assessment · just now</div><h2>A safety-first review for Amina Nakato</h2><p>Based on the last recorded visit and the context you provided.</p></div><Button variant="secondary" icon={FileText} onClick={() => window.print()}>Save as note</Button></div>
            <div className="result-risk-row"><div><span>Risk classification</span><strong>High</strong><small>94% confidence</small></div><RiskPill level="High" /><div className="result-divider" /><div className="result-fact"><span>Referral</span><strong>Immediate</strong></div><div className="result-fact"><span>Follow-up</span><strong>Today</strong></div></div>
            <ResultSection title="Possible conditions"><div className="condition-card"><div className="condition-icon"><CircleAlert size={16} /></div><div><strong>Possible gestational hypertension</strong><span>Elevated BP with reported headache warrants repeat measurements and clinical review.</span></div></div></ResultSection>
            <ResultSection title="Danger signs identified"><div className="result-tags"><span>Elevated BP · 148/94</span><span>Severe headache</span><span>Swollen feet</span></div></ResultSection>
            <ResultSection title="Immediate actions"><ol className="action-list"><li><b>01</b><span>Support an immediate referral to the nearest Health Centre IV or hospital.</span></li><li><b>02</b><span>Keep the mother accompanied and repeat the measurement if it is safe to do so.</span></li><li><b>03</b><span>Contact the supervising midwife and share this assessment.</span></li></ol></ResultSection>
            <div className="result-counsel"><MessageCircle size={17} /><div><strong>Words you can share</strong><p>“Your blood pressure is higher than we would like, so we want you to be checked by a midwife today. We will help you get there safely.”</p></div></div>
            <div className="result-actions"><Button variant="danger" icon={FileText}>Generate referral note</Button><Button variant="secondary" icon={Phone}>Call supervisor</Button></div>
            <div className="ai-disclaimer"><span className="shield-mark">✦</span> AI decision support only. Confirm with your supervising health worker.</div>
          </section>}
        </main>

        <aside className="assistant-side">
          <section className="panel recent-context">
            <div className="panel-header"><div><h2>Mother context</h2><p>Included in this assessment</p></div></div>
            <div className="context-person"><Avatar initials="AN" color="coral" size="lg" /><div><strong>Amina Nakato</strong><span>32 weeks · G3 P2</span><RiskPill level="High" /></div></div>
            <div className="context-facts"><div><span>Last BP</span><strong className="red-text">148/94</strong></div><div><span>Last visit</span><strong>02 Aug</strong></div><div><span>Blood group</span><strong>O+</strong></div></div>
            <Link to="/mothers/m-1" className="context-profile-link">View full profile <ArrowRight size={14} /></Link>
          </section>
          <section className="panel assistant-tips"><div className="tool-icon tool-icon-purple"><Stethoscope size={18} /></div><h3>Good to know</h3><p>Always ask about headache, changes in vision, vaginal bleeding, abdominal pain and fetal movement during an ANC visit.</p><Link to="/visits/new">Record a new visit <ArrowRight size={14} /></Link></section>
        </aside>
      </div>

      {showVoice && <ApiVoiceModal initialText={question} onClose={() => setShowVoice(false)} onSave={(text) => { setQuestion(text); setShowVoice(false) }} />}
    </div>
  )
}

function ResultSection({ title, children }) {
  return <div className="result-section"><span className="result-section-title">{title}</span>{children}</div>
}
