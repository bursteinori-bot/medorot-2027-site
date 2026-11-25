import { createContext, useContext, useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../shared/Logo'
import { apiGet, apiPost, useAdmin, type Me } from './api'
import Analytics from './Analytics'
import ApplicationDetail from './ApplicationDetail'
import Settings from './Settings'
import Applications from './Applications'
import ContentEditor from './ContentEditor'
import Dashboard from './Dashboard'
import Users from './Users'
import { AdminLangToggle, Button, Field, Notice, Spinner, inputCls } from './ui'

// The private admin area at /admin: applications, website content and team access. Hebrew (RTL) by default, with an
// English (LTR) interface through the language switch. No public sign-up.
const MeCtx = createContext<Me | null>(null)
// eslint-disable-next-line react-refresh/only-export-components
export const useMe = () => useContext(MeCtx)!

export default function AdminApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined)
  const { pathname } = useLocation()
  const { t, dir, withLang } = useAdmin()
  useEffect(() => {
    document.title = t.docTitle
  }, [t])
  useEffect(() => {
    if (!document.querySelector('meta[name="robots"]')) document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex">')
  }, [])
  useEffect(() => {
    if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/accept')) return
    apiGet<Me>('me').then(setMe).catch(() => setMe(null))
  }, [pathname])

  return (
    <div className="min-h-dvh bg-[#f7f4ea] text-black" dir={dir}>
      <Routes>
        <Route path="login" element={<Login onIn={setMe} />} />
        <Route path="accept" element={<Accept onIn={setMe} />} />
        <Route path="*" element={me === undefined ? <Spinner /> : me === null ? <Navigate to={withLang(`/admin/login?next=${encodeURIComponent(pathname)}`)} replace /> : <MeCtx.Provider value={me}><Shell /></MeCtx.Provider>} />
      </Routes>
    </div>
  )
}

function Shell() {
  const me = useMe()
  const navigate = useNavigate()
  const { t, withLang, lang } = useAdmin()
  const s = t.shell
  const nowrap = lang === 'en' ? 'whitespace-nowrap ' : '' // the phone menu scrolls sideways; English names stay on one line
  const reviewer = me.role === 'admin' || me.role === 'reviewer'
  const editor = me.role === 'admin' || me.role === 'editor'
  const link = ({ isActive }: { isActive: boolean }) => `${nowrap}block px-3 py-2.5 rounded-md text-lg ${isActive ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`
  return (
    <div className="md:grid md:grid-cols-[15rem_1fr] min-h-dvh">
      <aside className="bg-[#fee801] border-b md:border-b-0 md:border-e border-black/20 p-4 md:p-5 md:sticky md:top-0 md:h-dvh flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <Link to={withLang('/admin')} aria-label={s.dashboard}><Logo className="w-40" /></Link>
          <AdminLangToggle />
        </div>
        <nav aria-label={s.nav} className="flex md:flex-col gap-1 overflow-x-auto">
          <NavLink end to={withLang('/admin')} className={link}>{s.dashboard}</NavLink>
          {reviewer && <NavLink to={withLang('/admin/applications')} className={link}>{s.applications}</NavLink>}
          {editor && <NavLink to={withLang('/admin/content')} className={link}>{s.content}</NavLink>}
          <NavLink to={withLang('/admin/analytics')} className={link}>{s.analytics}</NavLink>
          {me.role === 'admin' && <NavLink to={withLang('/admin/users')} className={link}>{s.users}</NavLink>}
          <NavLink to={withLang('/admin/settings')} className={link}>{s.password}</NavLink>
        </nav>
        <div className="mt-auto text-sm space-y-2 hidden md:block">
          <p className="font-bold">{me.display_name ?? me.email}</p>
          <p className="text-black/70">{t.roles[me.role]}</p>
          <a href={withLang('/')} target="_blank" rel="noreferrer" className="block underline">{s.publicSite}</a>
          <button type="button" className="underline" onClick={() => apiPost('logout').finally(() => navigate(withLang('/admin/login')))}>{s.logout}</button>
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
          <Route path="*" element={<Navigate to={withLang('/admin')} replace />} />
        </Routes>
      </main>
    </div>
  )
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh grid place-items-center p-4">
      <div className="relative w-full max-w-md bg-white border-2 border-black rounded-xl p-6 md:p-8 shadow-[6px_6px_0_#fee801]">
        <AdminLangToggle className="absolute top-4 end-4" />
        <Logo className="w-48 mb-6" />
        <h1 className="text-3xl font-black mb-5">{title}</h1>
        {children}
      </div>
    </div>
  )
}

// One team password. On the very first visit (no password yet) this screen sets it instead.
function Login({ onIn }: { onIn: (m: Me) => void }) {
  const { t: all, errText, withLang } = useAdmin()
  const t = all.auth
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
      if (password.length < 10) return setErr(t.tooShort)
      if (password !== again) return setErr(t.mismatch)
    }
    setBusy(true)
    setErr('')
    try {
      await apiPost(needsSetup ? 'setup' : 'login', needsSetup ? { password } : { email: personal ? email : '', password })
      onIn(await apiGet<Me>('me'))
      navigate(withLang(q.get('next')?.startsWith('/admin') ? q.get('next')! : '/admin'), { replace: true })
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }
  if (needsSetup === null) return <Spinner />
  return (
    <AuthCard title={needsSetup ? t.setupTitle : t.loginTitle}>
      <form onSubmit={submit} className="space-y-4">
        {needsSetup && <p>{t.setupIntro}</p>}
        {personal && !needsSetup && <Field label={t.email} id="l-email"><input id="l-email" type="email" dir="ltr" autoComplete="username" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>}
        <Field label={needsSetup ? t.newPassword : t.password} hint={needsSetup ? t.minLength : undefined} id="l-pw">
          <input id="l-pw" type="password" dir="ltr" autoComplete={needsSetup ? 'new-password' : 'current-password'} required autoFocus className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {needsSetup && <Field label={t.passwordAgain} id="l-pw2"><input id="l-pw2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>}
        {err && <Notice kind="error">{err}</Notice>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? all.wait : needsSetup ? t.saveAndEnter : t.enter}</Button>
        {!needsSetup && <button type="button" className="text-sm underline text-black/70" onClick={() => setPersonal((p) => !p)}>{personal ? t.useTeam : t.usePersonal}</button>}
      </form>
    </AuthCard>
  )
}

function Accept({ onIn }: { onIn: (m: Me) => void }) {
  const { t: all, errText, withLang } = useAdmin()
  const t = all.auth
  const [q] = useSearchParams()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 10) return setErr(t.tooShort)
    if (password !== again) return setErr(t.mismatch)
    setBusy(true)
    setErr('')
    try {
      await apiPost('accept-invite', { token: q.get('token'), password, displayName: name })
      onIn(await apiGet<Me>('me'))
      navigate(withLang('/admin'), { replace: true })
    } catch (e) {
      setErr(errText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthCard title={t.welcome}>
      <p className="mb-5">{t.inviteIntro}</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t.displayName} id="a-name"><input id="a-name" autoComplete="name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={t.password} hint={t.minLength} id="a-pw"><input id="a-pw" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label={t.passwordAgain} id="a-pw2"><input id="a-pw2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
        {err && <Notice kind="error">{err}</Notice>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? all.saving : t.enterSystem}</Button>
      </form>
    </AuthCard>
  )
}
