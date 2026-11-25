import { useEffect, useState, type FormEvent } from 'react'
import { useMe } from './AdminApp'
import { ROLE_LABEL, apiGet, apiPost, fmtDate, type Role } from './api'
import { Button, Card, Field, Notice, PageTitle, Spinner, inputCls } from './ui'

type User = { id: string; email: string; display_name: string | null; role: Role; can_publish: boolean; created_at: string; last_login_at: string | null; pending: boolean }

const ROLE_HELP: Record<Role, string> = {
  admin: 'הכל: הגשות, תוכן, פרסום ומשתמשים',
  editor: 'עריכת תוכן האתר. פרסום רק אם מסומן',
  reviewer: 'צפייה בהגשות ובקבצים, סטטוסים והערות',
}

export default function Users() {
  const me = useMe()
  const [users, setUsers] = useState<User[] | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [link, setLink] = useState('')
  const [form, setForm] = useState({ email: '', role: 'reviewer' as Role, canPublish: false })
  const [busy, setBusy] = useState(false)
  const load = () => apiGet<{ users: User[] }>('users').then((d) => setUsers(d.users))
  useEffect(() => {
    load().catch((e) => setMsg({ kind: 'error', text: e.message }))
  }, [])

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      await load()
      if (ok) setMsg({ kind: 'ok', text: ok })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }
  const invite = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      const r = await apiPost<{ link: string }>('invite', form)
      setLink(r.link)
      setForm({ email: '', role: 'reviewer', canPublish: false })
    })
  }

  return (
    <div className="max-w-4xl space-y-6">
      <PageTitle>משתמשים והרשאות</PageTitle>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <Card>
        <h2 className="text-xl font-bold mb-3">הזמנת חבר.ת צוות</h2>
        <form onSubmit={invite} className="grid sm:grid-cols-[1fr_14rem] gap-3 items-end">
          <Field label="אימייל" id="inv-email"><input id="inv-email" type="email" dir="ltr" required className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="תפקיד" id="inv-role">
            <select id="inv-role" className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
          <p className="text-sm text-black/60 sm:col-span-2">{ROLE_HELP[form.role]}</p>
          {form.role === 'editor' && (
            <label className="flex gap-2 items-center sm:col-span-2"><input type="checkbox" className="size-5 accent-black" checked={form.canPublish} onChange={(e) => setForm({ ...form, canPublish: e.target.checked })} /> רשאי.ת לפרסם שינויים באתר</label>
          )}
          <Button type="submit" disabled={busy} className="sm:col-span-2 justify-self-start">יצירת קישור הזמנה</Button>
        </form>
        {link && (
          <div className="mt-4 space-y-2">
            <Notice kind="ok">קישור ההזמנה מוכן. שלחו אותו לחבר.ת הצוות (בוואטסאפ או במייל). הוא תקף ל-14 יום ולשימוש חד-פעמי.</Notice>
            <div className="flex gap-2">
              <input readOnly dir="ltr" className={`${inputCls} text-sm`} value={link} onFocus={(e) => e.target.select()} aria-label="קישור ההזמנה" />
              <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(link).then(() => setMsg({ kind: 'ok', text: 'הקישור הועתק.' })).catch(() => {})}>העתקה</Button>
            </div>
          </div>
        )}
      </Card>
      <Card>
        <h2 className="text-xl font-bold mb-3">צוות</h2>
        {!users ? <Spinner /> : (
          <ul className="divide-y divide-black/10">
            {users.map((u) => (
              <li key={u.id} className="py-3 grid md:grid-cols-[1fr_13rem_auto] gap-3 items-center">
                <div>
                  <p className="font-bold">{u.display_name ?? u.email} {u.id === me.id && <span className="text-sm font-normal text-black/60">(את.ה)</span>}</p>
                  <p className="text-sm text-black/60" dir="ltr">{u.email}</p>
                  <p className="text-sm text-black/60">{u.pending ? 'הזמנה ממתינה' : `כניסה אחרונה: ${fmtDate(u.last_login_at)}`}</p>
                </div>
                <div className="space-y-1">
                  <select aria-label={`תפקיד של ${u.email}`} className={inputCls} value={u.role} disabled={busy || u.id === me.id} onChange={(e) => run(() => apiPost('user-update', { id: u.id, role: e.target.value, canPublish: u.can_publish }), 'התפקיד עודכן.')}>
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  {u.role === 'editor' && (
                    <label className="flex gap-2 items-center text-sm"><input type="checkbox" className="size-4 accent-black" checked={u.can_publish} disabled={busy} onChange={(e) => run(() => apiPost('user-update', { id: u.id, role: u.role, canPublish: e.target.checked }), 'ההרשאה עודכנה.')} /> רשאי.ת לפרסם</label>
                  )}
                </div>
                {u.id !== me.id && <Button variant="danger" disabled={busy} onClick={() => run(() => apiPost('user-remove', { id: u.id }), 'הגישה הוסרה.')}>הסרת גישה</Button>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
