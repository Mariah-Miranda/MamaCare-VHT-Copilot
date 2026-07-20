import { useState } from 'react'
import { Bell, ChevronRight, LockKeyhole, Save, ShieldCheck, SlidersHorizontal, UserRound } from 'lucide-react'
import { PageHeader, Pill } from '../components/Layout'
import { Button, Field, Select, useToast } from '../components/ui'
import { useLanguage } from '../i18n'

const tabs = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: LockKeyhole },
  { id: 'workspace', label: 'Workspace', icon: SlidersHorizontal },
]

export default function Settings({ user }) {
  const { t, language, switchLanguage, loading } = useLanguage()
  const { toast, showToast, dismissToast } = useToast()
  const [activeTab, setActiveTab] = useState('profile')

  function selectTab(tab) {
    setActiveTab(tab)
  }

  return <div>
    <PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.title')} description={t('settings.description')} />
    <div className="settings-layout">
      <aside className="settings-nav panel" aria-label="Settings sections">
        {tabs.map(({ id, label, icon: Icon }) => <button key={id} className={`settings-nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => selectTab(id)} type="button" aria-current={activeTab === id ? 'page' : undefined}><Icon size={16} /> {label}</button>)}
      </aside>

      <main className="settings-main">
        {activeTab === 'profile' && <section className="panel settings-card">
          <div className="settings-heading"><div><h2>Profile details</h2><p>How your name appears across MamaCare.</p></div><Pill tone="blue">{user.role}</Pill></div>
          <div className="settings-profile"><div className="avatar avatar-teal avatar-xl">{user.initials}</div><button className="text-button" onClick={() => showToast({ title: 'Photo upload', message: 'Profile photo upload is not connected yet.' })} type="button">Change photo</button></div>
          <div className="form-grid"><Field label="Full name" value={user.name} onChange={() => {}} /><Field label="Email address" value={user.email} onChange={() => {}} type="email" /><label className="field"><span className="field-label">Role</span><Select value={user.role} onChange={() => {}} options={['VHT', 'Supervisor']} /></label><Field label="Assigned village" value={user.village} onChange={() => {}} /></div>
          <div className="settings-actions"><Button onClick={() => showToast({ title: 'Profile saved', message: 'Your workspace details are up to date.' })} icon={Save}>Save changes</Button></div>
        </section>}

        {activeTab === 'notifications' && <section className="panel settings-card">
          <div className="settings-heading"><div><h2>Notifications</h2><p>Choose when MamaCare should check in with you.</p></div><Bell size={18} className="muted-icon" /></div>
          <div className="toggle-list"><Toggle label="High-risk pregnancy alerts" description="Be notified when an assessment needs urgent review." checked /><Toggle label="Upcoming visit reminders" description="A gentle reminder before a scheduled follow-up." checked /><Toggle label="Weekly care summary" description="A Monday overview of your care list." checked={false} /></div>
          <div className="settings-actions"><Button onClick={() => showToast({ title: 'Notifications saved', message: 'Your notification preferences were updated.' })} icon={Save}>Save preferences</Button></div>
        </section>}

        {activeTab === 'security' && <section className="panel settings-card">
          <div className="settings-heading"><div><h2>Security & privacy</h2><p>Your data is protected with secure access controls.</p></div><ShieldCheck size={18} className="green-icon" /></div>
          <div className="security-row"><div className="security-icon"><LockKeyhole size={16} /></div><div><strong>Password</strong><span>Last updated 24 days ago</span></div><button className="text-button" onClick={() => showToast({ title: 'Password update', message: 'Password update is ready to connect to your account service.' })} type="button">Update <ChevronRight size={14} /></button></div>
          <div className="security-row"><div className="security-icon"><ShieldCheck size={16} /></div><div><strong>Two-factor authentication</strong><span>Recommended for all care team members</span></div><Pill tone="warning">Not enabled</Pill><button className="text-button" onClick={() => showToast({ title: 'Two-factor authentication', message: 'Two-factor setup is ready to connect to your account service.' })} type="button">Enable <ChevronRight size={14} /></button></div>
        </section>}

        {activeTab === 'workspace' && <section className="panel settings-card">
          <div className="settings-heading"><div><h2>Workspace preferences</h2><p>Manage the language and local care workspace used by this device.</p></div><SlidersHorizontal size={18} className="muted-icon" /></div>
          <div className="form-grid"><label className="field"><span className="field-label">Interface language</span><Select value={language} onChange={switchLanguage} options={[{ value: 'en', label: 'English' }, { value: 'lg', label: 'Luganda' }]} /></label><Field label="Assigned workspace" value={user.village || 'Kanyanya Parish'} onChange={() => {}} /></div>
          <div className="info-card workspace-info"><strong>{loading ? 'Translating workspace…' : 'Language changes apply across MamaCare.'}</strong><p>Choose English or Luganda. The selected language is saved on this device.</p></div>
        </section>}
      </main>
    </div>
    {toast && <div className="toast-wrap"><div className="toast toast-success"><strong>{toast.title}</strong><span>{toast.message}</span><button onClick={dismissToast} type="button">×</button></div></div>}
  </div>
}

function Toggle({ label, description, checked: initial }) {
  return <div className="toggle-row"><div><strong>{label}</strong><span>{description}</span></div><label className="switch"><input type="checkbox" defaultChecked={initial} /><i /></label></div>
}
