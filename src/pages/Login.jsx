import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Eye, EyeOff, HeartPulse, LockKeyhole, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Button, Select } from '../components/ui'
import { authApi } from '../lib/api'

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('VHT')
  const [village, setVillage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const isRegister = mode === 'register'

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    if (nextMode === 'register') {
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setVillage('')
    } else {
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
  }

  function completeLogin(response) {
    const nextUser = response.data.user
    localStorage.setItem('mamacare_token', response.data.token)
    onLogin({ ...nextUser, firstName: nextUser.name.split(' ')[0], initials: nextUser.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() })
  }

  async function submit(event) {
    event.preventDefault()
    if (isRegister && !name.trim()) { setError('Enter your full name to create an account.'); return }
    if (!email || !password) { setError('Enter your email and password to continue.'); return }
    if (isRegister && password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    try {
      const response = isRegister
        ? await authApi.register({ name: name.trim(), email: email.trim(), password, role, village: village.trim() })
        : await authApi.login({ email, password })
      completeLogin(response)
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isRegister ? 'Unable to create your account right now. Check your connection and try again.' : 'Unable to sign in right now. Check your connection and try again.'))
    } finally { setLoading(false) }
  }

  return <div className="login-page">
    <div className="login-visual"><div className="login-visual-inner">
      <div className="brand-lockup login-brand"><div className="brand-mark"><HeartPulse size={20} strokeWidth={2.5} /></div><div><div className="brand-name">MamaCare</div><div className="brand-caption">VHT copilot</div></div></div>
      <div className="visual-copy"><div className="mini-kicker"><Sparkles size={13} /> Care, connected</div><h1>More confidence<br /><span>in every visit.</span></h1><p>A calm, intelligent workspace for the people who care for mothers first.</p></div>
      <div className="care-illustration"><div className="illustration-glow" /><div className="illustration-circle"><HeartPulse size={72} strokeWidth={1.1} /></div></div>
      <div className="login-quote"><span>“</span><p>When information is clear, I can focus on what matters most — the mother in front of me.</p><small>Sarah · Village Health Team, Kampala</small></div>
    </div></div>

    <div className="login-form-side"><div className="login-form-wrap">
      <div className="mobile-login-brand"><div className="brand-mark"><HeartPulse size={19} /></div><div className="brand-name">MamaCare</div></div>
      <div className="login-heading"><div className="eyebrow">{isRegister ? 'Join MamaCare' : 'Welcome back'}</div><h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2><p>{isRegister ? 'Set up your care workspace and start supporting mothers.' : 'Pick up where you left off with your care team.'}</p></div>
      <form onSubmit={submit} className="login-form">
        {isRegister && <label className="field"><span className="field-label">Full name</span><div className="input-icon"><UserRound size={17} /><input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" /></div></label>}
        <label className="field"><span className="field-label">Email address</span><div className="input-icon"><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div></label>
        <label className="field"><span className="field-label">Password</span><div className="input-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete={isRegister ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        {isRegister && <><label className="field"><span className="field-label">Confirm password</span><div className="input-icon"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" /></div></label><label className="field"><span className="field-label">Role</span><Select value={role} onChange={setRole} options={['VHT', 'Supervisor']} /></label><label className="field"><span className="field-label">Village or workspace</span><div className="input-icon"><MapPin size={17} /><input type="text" value={village} onChange={(event) => setVillage(event.target.value)} placeholder="e.g. Kanyanya Parish" /></div></label></>}
        {!isRegister && <div className="login-options"><label className="checkbox-row"><input type="checkbox" defaultChecked /><span>Remember me</span></label><button type="button" className="text-button" onClick={() => setError('Password recovery needs to be connected to your email service.')}>Forgot password?</button></div>}
        {error && <div className="form-alert">{error}</div>}
        <Button type="submit" className="login-submit" disabled={loading}>{loading ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}<ArrowRight size={17} /></Button>
      </form>
      <div className="login-switch"><span>{isRegister ? 'Already have an account?' : 'New to MamaCare?'}</span><button type="button" className="text-button" onClick={() => switchMode(isRegister ? 'signin' : 'register')}>{isRegister ? 'Sign in' : 'Create an account'}</button></div>
      <div className="login-footer"><ShieldCheck size={15} /><span>Your data is encrypted and securely stored</span></div>
    </div></div>
  </div>
}
