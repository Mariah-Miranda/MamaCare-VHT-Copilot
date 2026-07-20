import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { demoUser } from './data'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mothers, { RegisterMother } from './pages/Mothers'
import MotherProfile from './pages/MotherProfile'
import NewVisit from './pages/NewVisit'
import Visits from './pages/Visits'
import Assistant from './pages/Assistant'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import { LanguageProvider } from './i18n'

export default function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mamacare_user')) || null } catch { return null }
  })
  useEffect(() => { if (user) localStorage.setItem('mamacare_user', JSON.stringify(user)); else localStorage.removeItem('mamacare_user') }, [user])
  function login(nextUser) { setUser(nextUser) }
  function logout() { setUser(null); localStorage.removeItem('mamacare_token') }
  if (!user) return <LanguageProvider><Login onLogin={login} /></LanguageProvider>
  return <LanguageProvider><Layout user={user} onLogout={logout}><Routes><Route path="/" element={<Dashboard user={user} />} /><Route path="/mothers" element={<Mothers user={user} onRegister={() => navigate('/mothers/new')} />} /><Route path="/mothers/new" element={<RegisterMother onBack={() => navigate('/mothers')} onRegistered={() => navigate('/mothers')} />} /><Route path="/mothers/:id" element={<MotherProfile user={user} onNewVisit={(id) => navigate(`/visits/new?mother=${id}`)} />} /><Route path="/visits/new" element={<NewVisit user={user} onSaved={() => {}} />} /><Route path="/visits" element={<Visits user={user} />} /><Route path="/assistant" element={<Assistant />} /><Route path="/reports" element={user.role === 'Supervisor' ? <Reports /> : <Navigate to="/" replace />} /><Route path="/settings" element={<Settings user={user} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Layout></LanguageProvider>
}
