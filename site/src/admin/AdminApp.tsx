import { createContext, useContext, useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../shared/Logo'
import { ApiError, ROLE_LABEL, apiGet, apiPost, type Me } from './api'
import Analytics from './Analytics'
import ApplicationDetail from './ApplicationDetail'
import Settings from './Settings'
import Applications from './Applications'
import ContentEditor from './ContentEditor'
import Dashboard from './Dashboard'
import Users from './Users'
import { Button, Field, Notice, Spinner, inputCls } from './ui'

// The private admin area at /admin: applications, website content and team access. Hebrew, RTL, no public sign-up.
const MeCtx = createContext<Me | null>(null)
export const useMe = () => useContext(MeCtx)!

export default function AdminApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = 'ניהול · פסטיבל מדורות'
    document.querySelector('meta[name="robots"]') ?? document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">')
  }, [])
  useEffect(() => {
    if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/accept')) return
    apiGet<Me>('me').then(setMe).catch(() => setMe(null))
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[#f7f4ea] text-black" dir="rtl">
      <Routes>
        <Route path="login" element={<Login onIn={setMe} />} />
        <Route path="accept" element={<Accept onIn={setMe} />} />
        <Route path="*" element={me === undefined ? <Spinner /> : me === null ? <Navigate to={`/admin/login?next=${encodeURIComponent(pathname)}`} replace /> : <MeCtx.Provider value={me}><Shell /></MeCtx.Provider>} />
      </Routes>
    </div>
  )
}

function Shell() {
  const me = useMe()
  const navigate = useNavigate()
  const reviewer = me.role === 'admin' || me.role === 'reviewer'
  const editor = me.role === 'admin' || me.role === 'editor'
  const link = ({ isActive }: { isActive: boolean }) => `block px-3 py-2.5 rounded-md text-lg ${isActive ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`
  return (
    <div className="md:grid md:grid-cols-[15rem_1fr] min-h-dvh">
      <aside className="bg-[#fee801] border-b md:border-b-0 md:border-e border-black/20 p-4 md:p-5 md:sticky md:top-0 md:h-dvh flex flex-col gap-6">
        <Link to="/admin" aria-label="לוח בקרה"><Logo className="w-40" /></Link>
        <nav aria-label="ניהול" className="flex md:flex-col gap-1 overflow-x-auto">
          <NavLink end to="/admin" className={link}>לוח בקרה</NavLink>
          {reviewer && <NavLink to="/admin/applications" className={link}>הגשות</NavLink>}
          {editor && <NavLink to="/admin/content" className={link}>ניהול תוכן האתר</NavLink>}
          <NavLink to="/admin/analytics" className={link}>שימושיות</NavLink>
          {me.role === 'admin' && <NavLink to="/admin/users" className={link}>משתמשים</NavLink>}
          <NavLink to="/admin/settings" className={link}>סיסמה</NavLink>
        </nav>
        <div className="mt-auto text-sm space-y-2 hidden md:block">
          <p className="font-bold">{me.display_name ?? me.email}</p>
          <p className="text-black/70">{ROLE_LABEL[me.role]}</p>
          <a href="/" target="_blank" rel="noreferrer" className="block underline">לאתר הציבורי ↗</a>
          <button type="button" className="underline" onClick={() => apiPost('logout').finally(() => navigate('/admin/login'))}>יציאה</button>
        </div>
      </aside>
      <main className="p-4 md:p-8 min-w-0">
        <Routes>
          <Route index element={<Dashboard />} />
          {reviewer && <Route path="applications" element={<Applications />} />}
          {reviewer && <Route path="applications/:id" element={<ApplicationDetail />} />}
          {editor && <Route path="content" element={<ContentEditor />} />}
          {me.role === 'admin' && <Route path="users" element={<Users />} />}
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="w-full max-w-md bg-white border-2 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0_#fee801]">
        <Logo className="w-48 mb-6" />
        <h1 className="text-3xl font-black mb-5">{title}</h1>
        {children}
      </div>
    </div>
  )
}

// One team password. On the very first visit (no password yet) this screen sets it instead.
function Login({ onIn }: { onIn: (m: Me) => void }) {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [personal, setPersonal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const [q] = useSearchParams()
  useEffect(() => {
    apiGet<{ needsSetup: boolean }>('setup-status').then((r) => setNeedsSetup(r.needsSetup)).catch(() => setNeedsSetup(false))
  }, [])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (needsSetup) {
      if (password.length < 10) return setErr('הסיסמה צריכה להיות באורך 10 תווים לפחות.')
      if (password !== again) return setErr('שתי הסיסמאות לא זהות.')
    }
    setBusy(true)
    setErr('')
    try {
      await apiPost(needsSetup ? 'setup' : 'login', needsSetup ? { password } : { email: personal ? email : '', password })
      onIn(await apiGet<Me>('me'))
      navigate(q.get('next')?.startsWith('/admin') ? q.get('next')! : '/admin', { replace: true })
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'משהו השתבש. נסו שוב.')
    } finally {
      setBusy(false)
    }
  }
  if (needsSetup === null) return <Spinner />
  return (
    <AuthCard title={needsSetup ? 'קביעת סיסמת צוות' : 'כניסה לניהול'}>
      <form onSubmit={submit} className="space-y-4">
        {needsSetup && <p>זו הכניסה הראשונה. בחרו סיסמה אחת לכל צוות הפסטיבל. איתה נכנסים מכל מכשיר, ואפשר להחליף אותה בהמשך.</p>}
        {personal && !needsSetup && <Field label="אימייל" id="l-email"><input id="l-email" type="email" dir="ltr" autoComplete="username" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>}
        <Field label={needsSetup ? 'סיסמה חדשה' : 'סיסמה'} hint={needsSetup ? '10 תווים לפחות' : undefined} id="l-pw">
          <input id="l-pw" type="password" dir="ltr" autoComplete={needsSetup ? 'new-password' : 'current-password'} required autoFocus className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {needsSetup && <Field label="הסיסמה שוב" id="l-pw2"><input id="l-pw2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>}
        {err && <Notice kind="error">{err}</Notice>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'רגע…' : needsSetup ? 'שמירה וכניסה' : 'כניסה'}</Button>
        {!needsSetup && <button type="button" className="text-sm underline text-black/70" onClick={() => setPersonal((p) => !p)}>{personal ? 'כניסה עם סיסמת הצוות' : 'יש לי משתמש אישי (אימייל)'}</button>}
      </form>
    </AuthCard>
  )
}

function Accept({ onIn }: { onIn: (m: Me) => void }) {
  const [q] = useSearchParams()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 10) return setErr('הסיסמה צריכה להיות באורך 10 תווים לפחות.')
    if (password !== again) return setErr('שתי הסיסמאות לא זהות.')
    setBusy(true)
    setErr('')
    try {
      await apiPost('accept-invite', { token: q.get('token'), password, displayName: name })
      onIn(await apiGet<Me>('me'))
      navigate('/admin', { replace: true })
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'משהו השתבש. נסו שוב.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthCard title="ברוכים הבאים">
      <p className="mb-5">הוזמנת למערכת הניהול של פסטיבל מדורות. בחרו שם וסיסמה כדי להיכנס.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="שם לתצוגה" id="a-name"><input id="a-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="סיסמה" hint="10 תווים לפחות" id="a-pw"><input id="a-pw" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="הסיסמה שוב" id="a-pw2"><input id="a-pw2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
        {err && <Notice kind="error">{err}</Notice>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'שומרים…' : 'כניסה למערכת'}</Button>
      </form>
    </AuthCard>
  )
}
