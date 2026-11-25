import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SEED, type SiteContent } from '../content'
import { adminHe, type AdminDict } from '../i18n/admin.he'
import type { EnOverrides } from '../i18n/content.en'
import { localizeContent, type StoredContent } from '../i18n/localize'
import { tidyUi } from '../i18n/ui'
import { cleanUi } from '../shared/uiOverrides'
import { useMe } from './AdminApp'
import { apiGet, apiPost, uploadMedia, useAdmin } from './api'
import { TextsEditor } from './TextsEditor'
import { Button, Card, Field, Notice, PageTitle, Spinner, inputCls } from './ui'

// "ניהול תוכן האתר": every public text, date, link and image, edited as drafts, previewed, then published.
// The public site reads the published version through /api/content, so what is published here is what visitors see.
// Each part has a Hebrew tab (the main content: texts, links, images, switches) and an English tab, which edits only
// the English versions of the texts, stored under `en` in the same document (shape: EnOverrides in
// src/i18n/content.en.ts). An empty English field stores nothing, so the English site falls back to the automatic
// English (src/i18n/localize.ts), which is shown as the field's placeholder.

type Path = (string | number)[]
type Kind = 'text' | 'textarea' | 'list' | 'bool' | 'url' | 'stages' | 'photos' | 'amounts' | 'nav' | 'partners' | 'legal'
// en: true = the English text lives at ['en', ...path]; a function = its own English path; absent = shared by both languages
type FieldDef = { path: Path; label: string; kind?: Kind; hint?: string; dir?: 'ltr'; en?: true | ((c: StoredContent) => Path) }
type CT = AdminDict['content']
type SectionId = keyof CT['sections']
type Section = { id: SectionId; fields: FieldDef[] }

const buildSections = (t: CT): Section[] => {
  const f = t.f
  return [
    {
      id: 'general',
      fields: [
        { path: ['tagline'], label: f.tagline, en: true },
        { path: ['settings', 'festivalDate'], label: f.festivalDate, hint: f.festivalDateHint, en: true },
        { path: ['settings', 'deadline'], label: f.deadline, en: true },
        { path: ['settings', 'responseDate'], label: f.responseDate, en: true },
        { path: ['settings', 'venue'], label: f.venue, en: true },
        { path: ['settings', 'instagram'], label: f.instagram, dir: 'ltr' },
        { path: ['settings', 'instagramUrl'], label: f.instagramUrl, kind: 'url' },
        { path: ['settings', 'email'], label: f.email, hint: f.emptyHides, dir: 'ltr' },
        { path: ['settings', 'whatsapp'], label: f.whatsapp, hint: f.emptyHides, dir: 'ltr' },
      ],
    },
    {
      id: 'home',
      fields: [
        { path: ['home', 'invite'], label: f.invite, kind: 'textarea', en: true },
        { path: ['home', 'about'], label: f.aboutShort, kind: 'textarea', en: true },
        { path: ['home', 'fields'], label: f.fields, kind: 'textarea', en: true },
        { path: ['home', 'closing'], label: f.closing, en: true },
        { path: ['home', 'ctaPrimary'], label: f.ctaPrimary, en: true },
        { path: ['home', 'ctaSecondary'], label: f.ctaSecondary, en: true },
      ],
    },
    {
      id: 'about',
      fields: [
        { path: ['about', 'title'], label: f.title, en: true },
        { path: ['about', 'paragraphs'], label: f.paragraphs, kind: 'list', en: true },
        { path: ['about', 'words'], label: f.words, kind: 'list', hint: f.wordsHint, en: true },
        { path: ['about', 'nameNote'], label: f.nameNote, kind: 'textarea', en: true },
      ],
    },
    {
      id: 'open-call',
      fields: [
        { path: ['openCall', 'paragraphs'], label: f.paragraphs, kind: 'list', en: true },
        { path: ['openCall', 'spaces'], label: f.spaces, kind: 'textarea', en: true },
        { path: ['openCall', 'who'], label: f.who, kind: 'textarea', en: true },
        { path: ['openCall', 'disciplines'], label: f.disciplines, kind: 'list', hint: f.disciplinesHint, en: true },
        { path: ['openCall', 'stages'], label: f.stages, kind: 'stages', hint: f.stagesHint, en: true },
        { path: ['openCall', 'stagesNote'], label: f.stagesNote, en: true },
      ],
    },
    {
      id: 'spaces',
      fields: [0, 1, 2].flatMap((i): FieldDef[] => [
        { path: ['spaces', i, 'name'], label: f.spaceName(i + 1), en: (c) => ['en', 'spaces', c.spaces[i]?.id ?? String(i), 'name'] },
        { path: ['spaces', i, 'desc'], label: f.spaceDesc(i + 1), kind: 'textarea', en: (c) => ['en', 'spaces', c.spaces[i]?.id ?? String(i), 'desc'] },
        { path: ['spaces', i, 'photos'], label: f.spacePhotos(i + 1), kind: 'photos', en: true },
      ]),
    },
    {
      id: 'apply',
      fields: [
        { path: ['confirmation', 'title'], label: f.confirmationTitle, en: true },
        { path: ['confirmation', 'lines'], label: f.confirmationLines, kind: 'list', en: true },
      ],
    },
    {
      id: 'support',
      fields: [
        { path: ['support', 'title'], label: f.title, en: true },
        { path: ['support', 'paragraphs'], label: f.paragraphs, kind: 'list', en: true },
        { path: ['support', 'closing'], label: f.closing, en: true },
        { path: ['support', 'amounts'], label: f.amounts, kind: 'amounts', hint: f.amountsHint },
        { path: ['support', 'button'], label: f.button, en: true },
        { path: ['support', 'notLive'], label: f.notLive, kind: 'textarea', en: true },
        { path: ['settings', 'donationUrl'], label: f.donationUrl, kind: 'url', hint: f.donationUrlHint },
        { path: ['settings', 'paymentsEnabled'], label: f.paymentsEnabled, kind: 'bool', hint: f.paymentsEnabledHint },
      ],
    },
    {
      id: 'nav',
      fields: [
        { path: ['nav'], label: f.nav, kind: 'nav', en: true },
        { path: ['navHint'], label: f.navHint, en: true },
      ],
    },
    {
      id: 'footer',
      fields: [
        { path: ['finalCta', 'text'], label: f.finalCtaText, en: true },
        { path: ['finalCta', 'button'], label: f.finalCtaButton, en: true },
        { path: ['partners'], label: f.partners, kind: 'partners', en: true },
      ],
    },
    {
      id: 'privacy',
      fields: [
        { path: ['legal', 'privacy'], label: f.privacy, kind: 'legal', en: true },
        { path: ['legal', 'accessibility'], label: f.accessibility, kind: 'legal', en: true },
      ],
    },
    // every fixed text of the site, both languages side by side (TextsEditor.tsx; stored under `ui`)
    { id: 'texts', fields: [] },
  ]
}

const get = (o: unknown, p: Path): unknown => p.reduce<unknown>((x, k) => (x == null ? x : (x as Record<string | number, unknown>)[k]), o)
function set<T>(o: T, p: Path, v: unknown): T {
  if (!p.length) return v as T
  const [k, ...rest] = p
  const copy = (Array.isArray(o) ? [...o] : { ...(o as object) }) as Record<string | number, unknown>
  copy[k] = set(copy[k], rest, v)
  return copy as T
}
// set a value inside the `en` overrides; `undefined` removes it, and objects left empty are removed too
function prune(o: unknown, p: Path, v: unknown): Record<string, unknown> | undefined {
  const copy = { ...(o && typeof o === 'object' && !Array.isArray(o) ? o : {}) } as Record<string, unknown>
  const [k, ...rest] = p
  const nv = rest.length ? prune(copy[k], rest, v) : v
  if (nv === undefined) delete copy[k]
  else copy[k] = nv
  return Object.keys(copy).length ? copy : undefined
}
function withEn(c: StoredContent, enPath: Path, v: unknown): StoredContent {
  const en = prune(c.en, enPath.slice(1), v) as EnOverrides | undefined
  const next = { ...c }
  if (en) next.en = en
  else delete next.en
  return next
}
// before saving: no empty strings or empty list items in the English overrides (empty = use the automatic English)
const tidy = (o: unknown): unknown => {
  if (typeof o === 'string') return o.trim() ? o : undefined
  if (Array.isArray(o)) {
    const a = o.filter((x) => typeof x !== 'string' || x.trim())
    return a.length ? a : undefined
  }
  if (o && typeof o === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(o)) {
      const x = tidy(v)
      if (x !== undefined) out[k] = x
    }
    return Object.keys(out).length ? out : undefined
  }
  return o
}
const fileOf = (src: string) => src.split('/').pop() ?? src
const thumb = (src: string, partner: boolean) => (partner || src.startsWith('/api/media') ? src : `${src}_960.webp`)

type Version = { id: string; status: 'draft' | 'published' | 'archived'; note: string | null; created_at: string; published_at: string | null; author: string | null }

export default function ContentEditor() {
  const me = useMe()
  const { t: all, fmt, errText } = useAdmin()
  const t = all.content
  const sections = useMemo(() => buildSections(t), [t])
  const [content, setContent] = useState<StoredContent | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [versions, setVersions] = useState<Version[]>([])
  const [dirty, setDirty] = useState(false)
  const [section, setSection] = useState<SectionId>('general')
  const [edLang, setEdLang] = useState<'he' | 'en'>('he')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)

  const load = () =>
    apiGet<{ current: { id: string | null; content: StoredContent; status: string }; versions: Version[] }>('content').then((d) => {
      // fill fields added to the seed after this version was saved (the saved `en` overrides come along as they are)
      setContent({ ...SEED, ...d.current.content, legal: { ...SEED.legal, ...(d.current.content.legal ?? {}) }, ui: cleanUi(d.current.content.ui) })
      setDraftId(d.current.status === 'draft' ? d.current.id : null)
      setStatus(d.current.status)
      setVersions(d.versions)
      setDirty(false)
    })
  useEffect(() => {
    load().catch((e) => setMsg({ kind: 'error', text: errText(e) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirty && e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  // what the English site shows right now, for the placeholders of the English tab
  const localized = useMemo(() => (content && edLang === 'en' ? localizeContent(content) : null), [content, edLang])
  // "All site texts": one replacement (or none) per language and text key
  const putUi = useCallback((l: 'he' | 'en', key: string, v: string | undefined) => {
    setContent((c) => {
      if (!c) return c
      const texts = { ...(c.ui?.[l] ?? {}) }
      if (v === undefined) delete texts[key]
      else texts[key] = v
      const ui = { ...c.ui, [l]: texts }
      if (!Object.keys(texts).length) delete ui[l]
      return { ...c, ui: ui.he || ui.en ? ui : undefined }
    })
    setDirty(true)
  }, [])

  if (!content) return msg ? <Notice kind="error">{msg.text}</Notice> : <Spinner />

  const update = (p: Path, v: unknown) => {
    setContent((c) => set(c!, p, v))
    setDirty(true)
  }
  const updateEn = (enPath: Path, v: unknown) => {
    setContent((c) => withEn(c!, enPath, v))
    setDirty(true)
  }
  const save = async () => {
    const r = await apiPost<{ id: string }>('content-save', { id: draftId, content: { ...content, en: tidy(content.en), ui: tidyUi(content.ui) } })
    setDraftId(r.id)
    setStatus('draft')
    setDirty(false)
    return r.id
  }
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      setMsg({ kind: 'ok', text: ok })
    } catch (e) {
      setMsg({ kind: 'error', text: errText(e) })
    } finally {
      setBusy(false)
    }
  }
  const preview = () =>
    run(async () => {
      const id = dirty || !draftId ? await save() : draftId
      window.open(`/?preview=${id}${edLang === 'en' ? '&lang=en' : ''}`, '_blank', 'noopener')
    }, t.previewOpened)
  const publish = () =>
    run(async () => {
      const id = dirty || !draftId ? await save() : draftId
      await apiPost('content-publish', { id })
      setConfirmPublish(false)
      await load()
    }, t.published)

  const sec = sections.find((s) => s.id === section)!
  const secText = t.sections[sec.id]
  const enFields = sec.fields.filter((f) => f.en)
  const tab = (l: 'he' | 'en', label: string) => (
    <button
      type="button"
      aria-pressed={edLang === l}
      lang={l}
      onClick={() => setEdLang(l)}
      className={`min-h-10 px-4 rounded-md font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c42a7d] ${edLang === l ? 'bg-black text-white' : 'hover:bg-black/5'}`}
    >
      {label}
    </button>
  )
  return (
    <div className="max-w-5xl">
      <PageTitle
        actions={
          <>
            <Button variant="secondary" disabled={busy || !dirty} onClick={() => run(save, t.draftSaved)}>{t.saveDraft}</Button>
            <Button variant="secondary" disabled={busy} onClick={preview}>{edLang === 'en' ? t.previewEn : t.preview}</Button>
            {me.canPublish && <Button disabled={busy || (status === 'published' && !dirty) || status === 'seed' && !dirty} onClick={() => setConfirmPublish(true)}>{t.publish}</Button>}
          </>
        }
      >
        {t.title}
      </PageTitle>
      <p className="mb-4 text-black/70">
        {status === 'seed' && t.stateSeed}
        {status === 'draft' && (dirty ? t.stateDirty : t.stateDraft)}
        {status === 'published' && (dirty ? t.statePublishedDirty : t.statePublished)}
        {!me.canPublish && t.noPublish}
      </p>
      {msg && <div className="mb-4"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {confirmPublish && (
        <div role="alertdialog" aria-labelledby="pub-t" className="mb-5 border-2 border-black rounded-lg p-5 bg-[#fff7c2]">
          <p id="pub-t" className="text-lg font-bold">{t.confirmTitle}</p>
          <p className="mt-1">{t.confirmText}</p>
          <div className="mt-3 flex gap-2">
            <Button disabled={busy} onClick={publish}>{t.confirmYes}</Button>
            <Button variant="secondary" onClick={() => setConfirmPublish(false)}>{t.cancel}</Button>
          </div>
        </div>
      )}

      <div className="md:grid md:grid-cols-[12rem_1fr] gap-6">
        <nav aria-label={t.parts} className="flex md:flex-col gap-1 overflow-x-auto mb-4 md:mb-0">
          {sections.map((s) => (
            <button key={s.id} type="button" aria-current={s.id === section ? 'page' : undefined} onClick={() => setSection(s.id)} className={`text-start whitespace-nowrap px-3 py-2 rounded-md ${s.id === section ? 'bg-black text-white font-bold' : 'hover:bg-black/5'}`}>
              {t.sections[s.id].title}
            </button>
          ))}
        </nav>
        <Card className="space-y-6 min-w-0 max-sm:p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">{secText.title}</h2>
            {sec.id !== 'texts' && (
              <div role="group" aria-label={t.langTabs} className="flex gap-1 bg-[#f7f4ea] border border-black/15 rounded-lg p-1">
                {tab('he', t.tabHe)}
                {tab('en', t.tabEn)}
              </div>
            )}
          </div>
          {sec.id === 'texts' ? (
            <TextsEditor ui={content.ui} put={putUi} />
          ) : edLang === 'he' ? (
            <>
              {secText.note && <Notice>{secText.note}</Notice>}
              {sec.fields.map((f) => <Editor key={f.path.join('.')} def={f} value={get(content, f.path)} onChange={(v) => update(f.path, v)} />)}
            </>
          ) : (
            <>
              <Notice>{enFields.length ? t.enIntro : t.enNone}</Notice>
              {localized && enFields.map((f) => <EnEditor key={f.path.join('.')} def={f} c={content} loc={localized} put={updateEn} />)}
            </>
          )}
        </Card>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl font-bold mb-3">{t.versions}</h2>
        {versions.length === 0 ? <p className="text-black/60">{t.noVersions}</p> : (
          <ul className="divide-y divide-black/10">
            {versions.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className={`font-bold px-2 py-0.5 rounded ${v.status === 'published' ? 'bg-[#1f7a3d] text-white' : v.status === 'draft' ? 'bg-[#fee801]' : 'bg-black/10'}`}>{t.versionStatus[v.status]}</span>
                <span className="tabular-nums">{fmt(v.published_at ?? v.created_at)}</span>
                <span className="text-black/60"><bdi>{v.author ?? ''}</bdi>{v.note ? <> · <bdi>{v.note === adminHe.content.restoredNote ? t.restoredNote : v.note}</bdi></> : ''}</span>
                {v.status === 'archived' && (
                  <Button variant="ghost" className="ms-auto min-h-8" disabled={busy} onClick={() => run(async () => { await apiPost('content-restore', { id: v.id }); await load() }, t.restored)}>
                    {t.restore}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function Editor({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const { t: all, lang } = useAdmin()
  // the main content is Hebrew: in the English interface its fields stay right-to-left
  const he = lang === 'en' ? ({ dir: 'rtl', lang: 'he' } as const) : {}
  const t = all.content
  const id = `f-${def.path.join('-')}`
  const kind = def.kind ?? 'text'
  if (kind === 'bool')
    return (
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 size-5 accent-black" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span><span className="font-bold">{def.label}</span>{def.hint && <span className="block text-sm text-black/60">{def.hint}</span>}</span>
      </label>
    )
  if (kind === 'list') {
    const arr = (value as string[]) ?? []
    return (
      <Field label={def.label} hint={def.hint ?? t.listHint}>
        <ListEditor items={arr} onChange={onChange} render={(v, set) => <textarea aria-label={def.label} {...he} className={`${inputCls} min-h-20`} value={v} onChange={(e) => set(e.target.value)} />} empty="" />
      </Field>
    )
  }
  if (kind === 'amounts')
    return (
      <Field label={def.label} hint={def.hint} id={id}>
        <input id={id} dir="ltr" className={inputCls} defaultValue={((value as number[]) ?? []).join(', ')} onBlur={(e) => onChange(e.target.value.split(/[,\s]+/).map(Number).filter((n) => n > 0))} />
      </Field>
    )
  if (kind === 'stages') {
    const arr = value as { id: string; label: string; desc: string }[]
    return (
      <Field label={def.label} hint={def.hint}>
        <div className="space-y-2">
          {arr.map((s, i) => (
            <div key={s.id} className="grid sm:grid-cols-[10rem_1fr] gap-2 items-center">
              <span className="font-bold">{s.label}</span>
              <input aria-label={t.stageAria(s.label)} {...he} className={inputCls} value={s.desc} onChange={(e) => onChange(arr.map((x, j) => (j === i ? { ...x, desc: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      </Field>
    )
  }
  if (kind === 'nav') {
    const arr = value as { id: string; label: string }[]
    return (
      <Field label={def.label} hint={t.navHint}>
        <ListEditor items={arr} onChange={onChange} fixed render={(v, set) => <input aria-label={t.navItem} {...he} className={inputCls} value={v.label} onChange={(e) => set({ ...v, label: e.target.value })} />} />
      </Field>
    )
  }
  if (kind === 'photos' || kind === 'partners') {
    const arr = (value as { src: string; alt?: string; name?: string }[]) ?? []
    const isPartner = kind === 'partners'
    return (
      <Field label={def.label} hint={isPartner ? t.partnersHint : t.photosHint}>
        <ListEditor
          items={arr}
          onChange={onChange}
          render={(v, set) => (
            <div className="flex gap-3 items-start">
              <img src={thumb(v.src, isPartner)} alt="" className={`${isPartner ? 'h-12 w-auto bg-black/5 p-1' : 'w-28 aspect-[4/3] object-cover'} rounded border border-black/15 shrink-0`} />
              <input aria-label={isPartner ? t.partnerName : t.altText} {...he} className={inputCls} placeholder={isPartner ? t.partnerName : t.altPh} value={(isPartner ? v.name : v.alt) ?? ''} onChange={(e) => set(isPartner ? { ...v, name: e.target.value } : { ...v, alt: e.target.value })} />
            </div>
          )}
          adder={<Uploader onUploaded={(src, name) => onChange([...arr, isPartner ? { name, src } : { src, alt: '' }])} />}
        />
      </Field>
    )
  }
  if (kind === 'legal')
    return (
      <Field label={def.label} hint={t.legalHint} id={id}>
        <textarea id={id} {...he} className={`${inputCls} min-h-72 font-mono text-sm`} value={(value as string | null) ?? ''} onChange={(e) => onChange(e.target.value.trim() ? e.target.value : null)} />
      </Field>
    )
  return (
    <Field label={def.label} hint={def.hint} id={id}>
      {kind === 'textarea' ? (
        <textarea id={id} {...he} className={`${inputCls} min-h-28`} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} {...he} dir={def.dir ?? (kind === 'url' ? 'ltr' : lang === 'en' ? 'rtl' : undefined)} type={kind === 'url' ? 'url' : 'text'} className={inputCls} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value || (def.path[0] === 'settings' && ['email', 'whatsapp', 'donationUrl'].includes(String(def.path[1])) ? null : ''))} />
      )}
    </Field>
  )
}

// English inputs: left-to-right, marked as English for spell-checking and screen readers
const EN = { dir: 'ltr', lang: 'en' } as const
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const orUndef = (v: string) => (v.trim() ? v : undefined)

// the Hebrew it translates, for reference (clipped to two lines)
function HeSource({ text }: { text: unknown }) {
  const { t } = useAdmin()
  if (!str(text).trim()) return null
  return (
    <p className="text-sm text-black/60 mb-1.5 line-clamp-2">
      {t.content.heSource} <span dir="rtl" lang="he">{str(text)}</span>
    </p>
  )
}

function EnEditor({ def, c, loc, put }: { def: FieldDef; c: StoredContent; loc: SiteContent; put: (enPath: Path, v: unknown) => void }) {
  const { t: all, lang } = useAdmin()
  const t = all.content
  const kind = def.kind ?? 'text'
  const id = `en-${def.path.join('-')}`
  const enPath = typeof def.en === 'function' ? def.en(c) : ['en', ...def.path]
  const own = get(c, enPath)
  const auto = get(loc, def.path)
  const he = get(c, def.path)

  if (kind === 'text' || kind === 'textarea')
    return (
      <div>
        <label htmlFor={id} className="block font-bold mb-1">{def.label}</label>
        <HeSource text={he} />
        {kind === 'textarea' ? (
          <textarea id={id} {...EN} className={`${inputCls} min-h-28`} placeholder={str(auto)} value={str(own)} onChange={(e) => put(enPath, orUndef(e.target.value))} />
        ) : (
          <input id={id} {...EN} className={inputCls} placeholder={str(auto)} value={str(own)} onChange={(e) => put(enPath, orUndef(e.target.value))} />
        )}
      </div>
    )

  if (kind === 'list') {
    const items = Array.isArray(own) ? (own as string[]) : []
    const current = Array.isArray(auto) ? (auto as string[]) : []
    return (
      <Field label={def.label} hint={def.hint ? `${def.hint}. ${t.enListHint}` : t.enListHint}>
        {items.length ? (
          <div className="space-y-2">
            <ListEditor items={items} onChange={(v) => put(enPath, v.length ? v : undefined)} render={(v, set) => <textarea aria-label={def.label} {...EN} className={`${inputCls} min-h-20`} value={v} onChange={(e) => set(e.target.value)} />} empty="" />
            <Button variant="ghost" onClick={() => put(enPath, undefined)}>{t.enListReset}</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="border border-dashed border-black/30 rounded-md p-3 text-sm">
              <p className="text-black/60 mb-1">{t.enAuto}</p>
              <ul className="list-disc ps-5 space-y-1" {...EN}>{current.map((x, i) => <li key={i}>{x}</li>)}</ul>
            </div>
            <Button variant="secondary" onClick={() => put(enPath, current.length ? [...current] : [''])}>{t.enListEdit}</Button>
          </div>
        )}
      </Field>
    )
  }

  if (kind === 'stages')
    return (
      <Field label={def.label} hint={def.hint}>
        <div className="space-y-2">
          {c.openCall.stages.map((s, i) => {
            const p = ['en', 'openCall', 'stages', s.id, 'desc']
            const label = loc.openCall.stages[i]?.label ?? s.label
            return (
              <div key={s.id} className="grid sm:grid-cols-[10rem_1fr] gap-2 items-center">
                <span className="font-bold" {...EN}>{label}</span>
                <input aria-label={t.enStage(label)} {...EN} className={inputCls} placeholder={loc.openCall.stages[i]?.desc} value={str(get(c, p))} onChange={(e) => put(p, orUndef(e.target.value))} />
              </div>
            )
          })}
        </div>
      </Field>
    )

  if (kind === 'nav')
    return (
      <Field label={def.label}>
        <div className="space-y-2">
          {c.nav.map((n, i) => {
            const p = ['en', 'nav', n.id]
            return (
              <div key={n.id} className="grid sm:grid-cols-[10rem_1fr] gap-2 items-center">
                <span className="font-bold" dir="rtl" lang="he">{n.label}</span>
                <input aria-label={t.enNavItem(lang === 'en' ? (loc.nav[i]?.label ?? n.label) : n.label)} {...EN} className={inputCls} placeholder={loc.nav[i]?.label} value={str(get(c, p))} onChange={(e) => put(p, orUndef(e.target.value))} />
              </div>
            )
          })}
        </div>
      </Field>
    )

  if (kind === 'photos' || kind === 'partners') {
    const partner = kind === 'partners'
    const i = Number(def.path[1])
    const space = partner ? null : c.spaces[i]
    const list = partner ? c.partners : (space?.photos ?? [])
    const locList = partner ? loc.partners : (loc.spaces[i]?.photos ?? [])
    return (
      <Field label={def.label}>
        <div className="space-y-2">
          {list.map((x, j) => {
            const p = partner ? ['en', 'partners', fileOf(x.src)] : ['en', 'spaces', space!.id, 'photos', fileOf(x.src)]
            const he = partner ? (x as { name: string }).name : (x as { alt: string }).alt
            const ph = partner ? (locList[j] as { name?: string })?.name : (locList[j] as { alt?: string })?.alt
            return (
              <div key={x.src} className="flex gap-3 items-start">
                <img src={thumb(x.src, partner)} alt="" className={`${partner ? 'h-12 w-auto bg-black/5 p-1' : 'w-28 aspect-[4/3] object-cover'} rounded border border-black/15 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <HeSource text={he} />
                  <input aria-label={partner ? t.enPartner : t.enPhotoAlt} {...EN} className={inputCls} placeholder={ph} value={str(get(c, p))} onChange={(e) => put(p, orUndef(e.target.value))} />
                </div>
              </div>
            )
          })}
        </div>
      </Field>
    )
  }

  if (kind === 'legal')
    return (
      <Field label={def.label} hint={t.enLegalHint} id={id}>
        <textarea id={id} {...EN} className={`${inputCls} min-h-72 font-mono text-sm`} value={str(own)} onChange={(e) => put(enPath, orUndef(e.target.value))} />
      </Field>
    )
  return null
}

function ListEditor<T>({ items, onChange, render, empty, fixed, adder }: { items: T[]; onChange: (v: T[]) => void; render: (v: T, set: (v: T) => void) => React.ReactNode; empty?: T; fixed?: boolean; adder?: React.ReactNode }) {
  const { t } = useAdmin()
  const c = t.content
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= items.length) return
    const n = [...items]
    ;[n[i], n[j]] = [n[j], n[i]]
    onChange(n)
  }
  return (
    <div className="space-y-2">
      {items.map((v, i) => (
        <div key={i} className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">{render(v, (nv) => onChange(items.map((x, j) => (j === i ? nv : x))))}</div>
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" aria-label={c.moveUp} disabled={i === 0} onClick={() => move(i, -1)} className="size-8 rounded border border-black/20 disabled:opacity-30">↑</button>
            <button type="button" aria-label={c.moveDown} disabled={i === items.length - 1} onClick={() => move(i, 1)} className="size-8 rounded border border-black/20 disabled:opacity-30">↓</button>
          </div>
          {!fixed && <button type="button" aria-label={c.remove} onClick={() => onChange(items.filter((_, j) => j !== i))} className="size-8 rounded border border-[#b3261e]/40 text-[#b3261e] shrink-0">×</button>}
        </div>
      ))}
      {adder ?? (!fixed && empty !== undefined && <Button variant="ghost" onClick={() => onChange([...items, empty])}>{c.add}</Button>)}
    </div>
  )
}

function Uploader({ onUploaded }: { onUploaded: (src: string, name: string) => void }) {
  const { t, errText } = useAdmin()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  return (
    <div>
      <Button variant="secondary" disabled={busy} onClick={() => input.current?.click()}>{busy ? t.content.uploading : t.content.addImage}</Button>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          setErr('')
          try {
            const { shrinkImage } = await import('../shared/submit')
            const small = f.type === 'image/png' ? f : await shrinkImage(f)
            const r = await uploadMedia(small)
            onUploaded(r.src, f.name.replace(/\.\w+$/, ''))
          } catch (e) {
            setErr(errText(e))
          } finally {
            setBusy(false)
          }
        }}
      />
      {err && <p role="alert" className="text-sm text-[#b3261e] mt-1">{err}</p>}
    </div>
  )
}
