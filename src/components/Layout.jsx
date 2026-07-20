import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Bell, ChevronDown, ClipboardList, FileBarChart, HeartPulse,
  Languages, LayoutDashboard, LoaderCircle, Menu, MessageSquare, Settings, ShieldCheck, Stethoscope,
  UserRound, Users, X, LogOut,
} from 'lucide-react'
import { useLanguage } from '../i18n'

const primaryNav = [
  { label: 'Dashboard', key: 'nav.dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Mothers', key: 'nav.mothers', to: '/mothers', icon: Users },
  { label: 'New visit', key: 'nav.newVisit', to: '/visits/new', icon: ClipboardList },
  { label: 'Visit history', key: 'nav.visitHistory', to: '/visits', icon: Activity },
  { label: 'AI assistant', key: 'nav.assistant', to: '/assistant', icon: MessageSquare, badge: 'Beta' },
  { label: 'Reports', key: 'nav.reports', to: '/reports', icon: FileBarChart, supervisorOnly: true },
]

function NavItem({ item, onNavigate }) {
  const { t } = useLanguage()
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      end={item.to === '/'}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      <Icon size={18} strokeWidth={1.9} />
      <span>{t(item.key, item.label)}</span>
      {item.badge && <span className="nav-badge">{t('nav.beta', item.badge)}</span>}
    </NavLink>
  )
}

export default function Layout({ user, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const currentItem = primaryNav.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
  const current = currentItem ? t(currentItem.key, currentItem.label) : 'MamaCare'
  const filteredNav = primaryNav.filter((item) => !item.supervisorOnly || user.role === 'Supervisor')

  const handleNavigate = () => setMobileOpen(false)

  return (
    <div className="app-shell">
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      </AnimatePresence>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><HeartPulse size={20} strokeWidth={2.5} /></div>
          <div>
            <div className="brand-name">MamaCare</div>
            <div className="brand-caption">{t('brand.caption', 'VHT copilot')}</div>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="sidebar-section-label">{t('nav.workspace', 'Workspace')}</div>
        <nav className="nav-list">{filteredNav.map((item) => <NavItem key={item.label} item={item} onNavigate={handleNavigate} />)}</nav>
        <div className="sidebar-spacer" />
        <div className="care-card">
          <div className="care-card-icon"><ShieldCheck size={17} /></div>
          <div><strong>{t('nav.careConnected', 'Care is connected')}</strong><span>{t('nav.syncedSecurely', 'Your work is synced securely')}</span></div>
          <span className="online-dot" />
        </div>
        <NavLink to="/settings" onClick={handleNavigate} className={({ isActive }) => `nav-item settings-link ${isActive ? 'active' : ''}`}><Settings size={18} /><span>{t('nav.settings', 'Settings')}</span></NavLink>
        <div className="user-mini" onClick={() => navigate('/settings')} role="button" tabIndex="0">
          <div className="avatar avatar-teal">{user.initials}</div>
          <div className="user-mini-copy"><strong>{user.name}</strong><span>{user.role} · {user.village}</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>
        <button className="logout-button" onClick={() => { handleNavigate(); onLogout() }} type="button"><LogOut size={16} /><span>{t('nav.logout', 'Log out')}</span></button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb"><span>{t('nav.workspace', 'Workspace')}</span><span className="breadcrumb-slash">/</span><strong>{current}</strong></div></div>
          <div className="topbar-actions">
            <LanguageSwitcher />
            <div className="sync-status"><span className="online-dot" />{t('nav.allChangesSaved', 'All changes saved')}</div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button>
            <div className="topbar-avatar avatar avatar-teal">{user.initials}</div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  )
}

function LanguageSwitcher() {
  const { language, loading, error, switchLanguage } = useLanguage()
  return <div className="language-switcher" title={error || 'Translate workspace'}><Languages size={15} /><button className={language === 'en' ? 'active' : ''} onClick={() => switchLanguage('en')} disabled={loading}>EN</button><span>/</span><button className={language === 'lg' ? 'active' : ''} onClick={() => switchLanguage('lg')} disabled={loading}>LG</button>{loading && <LoaderCircle size={13} className="spin" />}</div>
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="page-actions">{actions}</div></div>
}

export function Pill({ children, tone = 'neutral', dot = false }) {
  return <span className={`pill pill-${tone}`}>{dot && <span className="pill-dot" />}{children}</span>
}

export function RiskPill({ level }) {
  const tone = level?.toLowerCase() === 'high' ? 'danger' : level?.toLowerCase() === 'moderate' ? 'warning' : 'success'
  return <Pill tone={tone} dot>{level}</Pill>
}

export function Avatar({ initials, color = 'teal', size = '' }) {
  return <span className={`avatar avatar-${color} ${size ? `avatar-${size}` : ''}`}>{initials}</span>
}
