// Browser side of a submission:
//   1. photos are shrunk in the browser (long side ≤ 2400px) so they fit the per-file limit
//   2. POST /api/applications/start   -> the server validates and creates (or finds) the draft record
//   3. PUT each file to /api/applications/file (one request per file, stored privately)
//   4. POST /api/applications/complete -> the server checks every file arrived, marks the application submitted and
//                                        notifies the team. Only its "ok" means the application is saved.
import { UPLOAD, isShrinkableImage, type Application } from './application'

export type SubmitProgress = { file: number; loaded: number; total: number }
export class SubmitError extends Error {
  fields?: Record<string, string>
  constructor(message: string, fields?: Record<string, string>) {
    super(message)
    this.fields = fields
  }
}

export async function applicationsOpen(): Promise<boolean> {
  try {
    const r = await fetch('/api/applications/status')
    if (!r.ok) return false
    return !!(await r.json()).open
  } catch {
    return false
  }
}

const MAX_SIDE = 2400

// Re-encode a photo at a sensible size. Small, already-light images are kept untouched.
export async function shrinkImage(file: File): Promise<File> {
  if (!isShrinkableImage(file.type) || file.size < 900 * 1024) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bmp.width * scale)
    canvas.height = Math.round(bmp.height * scale)
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    bmp.close()
    for (const q of [0.86, 0.75, 0.6]) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', q))
      if (blob && blob.size <= UPLOAD.maxMb * 1024 * 1024) return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
    }
  } catch {
    /* fall through: the original is checked against the limit */
  }
  return file
}

async function post<T>(url: string, body: unknown): Promise<T> {
  let r: Response
  try {
    r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new SubmitError('אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב. מה שכתבתם נשמר בטופס.')
  }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new SubmitError(data.error ?? 'משהו השתבש בשליחה. נסו שוב בעוד רגע. מה שכתבתם נשמר בטופס.', data.fields)
  return data as T
}

function put(url: string, key: string, file: File, onProgress: (loaded: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest()
    x.open('PUT', url)
    x.setRequestHeader('content-type', file.type || 'application/octet-stream')
    x.setRequestHeader('x-application-key', key)
    x.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded)
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) return resolve()
      let msg = `העלאת הקובץ ${file.name} נכשלה. נסו שוב.`
      try { msg = JSON.parse(x.responseText).error ?? msg } catch { /* not json */ }
      reject(new SubmitError(msg))
    }
    x.onerror = () => reject(new SubmitError(`העלאת הקובץ ${file.name} נכשלה. בדקו את החיבור ונסו שוב.`))
    x.send(file)
  })
}

export async function submitApplication(opts: { key: string; answers: Application; files: File[]; startedAt: number; website: string; onProgress: (p: SubmitProgress) => void }) {
  const { key, answers, startedAt, website, onProgress } = opts
  const files = await Promise.all(opts.files.map(shrinkImage))
  const start = await post<{ id: string; uploads: { index: number; url: string }[] }>('/api/applications/start', {
    key,
    answers,
    startedAt,
    website,
    files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  })
  for (const u of start.uploads) {
    const f = files[u.index]
    await put(u.url, key, f, (loaded) => onProgress({ file: u.index, loaded, total: f.size }))
    onProgress({ file: u.index, loaded: f.size, total: f.size })
  }
  return post<{ ok: true; id: string }>('/api/applications/complete', { key, id: start.id })
}
