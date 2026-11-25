import { useState, type FormEvent } from 'react'
import { useMe } from './AdminApp'
import { apiPost } from './api'
import { Button, Card, Field, Notice, PageTitle, inputCls } from './ui'

// Change the password of the signed-in account (for the team account: the shared team password).
export default function Settings() {
  const me = useMe()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const team = me.email === 'team@medorot.local'
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 10) return setMsg({ kind: 'error', text: 'הסיסמה החדשה צריכה להיות באורך 10 תווים לפחות.' })
    if (next !== again) return setMsg({ kind: 'error', text: 'שתי הסיסמאות החדשות לא זהות.' })
    setBusy(true)
    setMsg(null)
    try {
      await apiPost('change-password', { current, next })
      setCurrent('')
      setNext('')
      setAgain('')
      setMsg({ kind: 'ok', text: team ? 'סיסמת הצוות הוחלפה. מכשירים אחרים יצטרכו להיכנס מחדש עם הסיסמה החדשה.' : 'הסיסמה הוחלפה.' })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="max-w-xl">
      <PageTitle>{team ? 'סיסמת הצוות' : 'הסיסמה שלי'}</PageTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          {team && <p>זו הסיסמה שכל הצוות נכנס איתה. אחרי ההחלפה, מי שמחובר.ת ממכשיר אחר יצטרך.תצטרך להיכנס מחדש.</p>}
          <Field label="הסיסמה הנוכחית" id="s-cur"><input id="s-cur" type="password" dir="ltr" autoComplete="current-password" required className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} /></Field>
          <Field label="סיסמה חדשה" hint="10 תווים לפחות" id="s-new"><input id="s-new" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <Field label="הסיסמה החדשה שוב" id="s-new2"><input id="s-new2" type="password" dir="ltr" autoComplete="new-password" required className={inputCls} value={again} onChange={(e) => setAgain(e.target.value)} /></Field>
          {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
          <Button type="submit" disabled={busy}>{busy ? 'שומרים…' : 'החלפת סיסמה'}</Button>
        </form>
      </Card>
    </div>
  )
}
