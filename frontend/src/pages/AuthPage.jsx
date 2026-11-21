import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../context/AppContext'
import BrandMark from '../components/BrandMark'

export default function AuthPage({ register = false }) {
  const { user, authLoading, login } = useApp()
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate(); const location = useLocation()
  if (authLoading) return <div className="auth-loading">Loading AgileForge…</div>
  if (user) return <Navigate to="/" replace />
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try { await login(register ? 'register' : 'login', values); navigate(location.state?.from || '/', { replace: true }) }
    catch (e) { setError(e.response?.data?.message || 'Could not connect to AgileForge. Check that the API is running.') }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><div className="auth-decoration"><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-brand"><BrandMark/><span>Agile<span>Forge</span></span></div><div className="auth-pitch"><span className="auth-kicker">PLAN SMARTER. SHIP FASTER.</span><h1>Build something<br/><em>worth shipping.</em></h1><p>One focused workspace to turn your hackathon idea into a working MVP.</p><div className="auth-dots"><i/><i/><i/></div></div><div className="auth-footnote">Built for teams that make things happen.</div></div><section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><BrandMark/><span>Agile<span>Forge</span></span></div><span className="auth-kicker">YOUR NEXT BIG IDEA STARTS HERE</span><h2>{register?'Create your account':'Welcome back'}</h2><p className="auth-subtitle">{register?'Start planning your next hackathon MVP.':'Sign in to pick up where your team left off.'}</p><form onSubmit={submit} className="auth-form">{register&&<label>Full name<input autoComplete="name" required minLength="2" value={values.name} onChange={e=>setValues({...values,name:e.target.value})} placeholder="Jordan Davis"/></label>}<label>Email address<input autoComplete="email" type="email" required value={values.email} onChange={e=>setValues({...values,email:e.target.value})} placeholder="you@company.com"/></label><label>Password<div className="password-field"><input autoComplete={register?'new-password':'current-password'} type={showPassword?'text':'password'} minLength={register?8:undefined} required value={values.password} onChange={e=>setValues({...values,password:e.target.value})} placeholder={register?'At least 8 characters':'Enter your password'}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>{error&&<div className="auth-error" role="alert">{error}</div>}<button className="primary-button auth-submit" disabled={busy}>{busy?'Please wait…':register?'Create account':'Sign in'} {!busy&&<ArrowRight size={16}/>}</button></form><div className="auth-switch">{register?'Already have an account?':'New to AgileForge?'} <Link to={register?'/login':'/register'}>{register?'Sign in':'Create an account'}</Link></div><div className="auth-terms">By continuing, you agree to AgileForge’s Terms of Service and Privacy Policy.</div></div></section></main>
}
