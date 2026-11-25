import { useState, type FormEvent } from 'react'
import { useMe } from './AdminApp'
import { apiPost, useAdmin } from './api'
import { Button, Card, Field, Notice, PageTitle, inputCls } from './ui'

// Change the password of the signed-in account (for the team account: the shared team password).
export default function Settings() {
  const me = useMe()
  const { t: all, errText } = useAdmin()
  const t = all.settings
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const team = me.email === 'team@medorot.local'
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 10) return setMsg({ kind: 'error', text: t.tooShort })
    if (next !== again) return setMsg({ kind: 'error', text: t.mismatch })
    setBusy(true)
    setMsg(null)
    try {
      await apiPost('change-password', { current, next })
      setCurrent('')
      setNext('')
      setAgain('')
      setMsg({ kind: 'ok', text: team ? t.teamDone : t.done })
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="max-w-xl">
      <PageTitle>{team ? t.teamTitle : t.myTitle}</PageTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {team && <p>{t.teamIntro}</p>}
          <Field label={t.current} id="s-cur"><input id="s-cur" type="password" dir="ltr" autoComplete="current-password" required className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
          <Field label={t.next} hint={t.minLength} id="s-new"><input id="s-new" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <Field label={t.again} id="s-new2"><input id="s-new2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <Button type="submit" disabled={busy}>{busy ? all.saving : t.submit}</Button>
        </form>
      </Card>
    </div>
  )
}
