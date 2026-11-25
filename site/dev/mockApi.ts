// Development-only stand-in for the server functions (enabled with MOCK_API=1), so the browser side of a real
// submission (validation, signed uploads with progress, completion) can be exercised before Supabase exists.
// It validates with the same schema as the real server and keeps everything in memory.
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { fieldErrors, startSchema } from '../src/shared/application'

type App = { id: string; key: string; status: 'draft' | 'new'; files: { name: string; size: number }[]; received: Map<number, number> }

const readBody = (req: IncomingMessage) =>
  new Promise<Buffer>((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
  })
const send = (res: ServerResponse, status: number, body?: unknown) => {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(body === undefined ? '' : JSON.stringify(body))
}

export function mockApi(): Plugin {
  const apps = new Map<string, App>()
  return {
    name: 'medorot-mock-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (url === '/api/applications/status') return send(res, 200, { open: true })
        if (url === '/api/content') return send(res, 204)
        if (url === '/api/applications/start' && req.method === 'POST') {
          const parsed = startSchema.safeParse(JSON.parse((await readBody(req)).toString() || 'null'))
          if (!parsed.success) return send(res, 400, { error: 'יש שדות שצריך לתקן לפני השליחה.', fields: fieldErrors(parsed.error) })
          const { key, files, website } = parsed.data
          if (website) return send(res, 400, { error: 'לא הצלחנו לקבל את ההגשה. נסו שוב בעוד רגע.' })
          const found = [...apps.values()].find((a) => a.key === key)
          if (found?.status === 'new') return send(res, 200, { id: found.id, uploads: [], alreadySubmitted: true })
          const app: App = found ?? { id: key, key, status: 'draft', files: [], received: new Map() } // like the real server: id = key
          app.files = files.map((f) => ({ name: f.name, size: f.size }))
          app.received = new Map()
          apps.set(app.id, app)
          console.log('[mock] start', app.id, files.length, 'files')
          return send(res, 200, { id: app.id, uploads: files.map((_, i) => ({ index: i, url: `/__mock_upload/${app.id}/${i}` })) })
        }
        const up = url.match(/^\/__mock_upload\/([\w-]+)\/(\d+)$/)
        if (up && req.method === 'PUT') {
          const app = apps.get(up[1])
          if (!app) return send(res, 404)
          app.received.set(Number(up[2]), (await readBody(req)).length)
          return send(res, 200, {})
        }
        if (url === '/api/applications/complete' && req.method === 'POST') {
          const { key, id } = JSON.parse((await readBody(req)).toString() || '{}')
          const app = apps.get(id)
          if (!app || app.key !== key) return send(res, 404, { error: 'לא מצאנו את ההגשה. נסו לשלוח שוב.' })
          const missing = app.files.filter((f, i) => app.received.get(i) !== f.size)
          if (missing.length) return send(res, 400, { error: `הקבצים האלה לא הגיעו במלואם: ${missing.map((f) => f.name).join(', ')}.` })
          app.status = 'new'
          console.log('[mock] complete', id)
          return send(res, 200, { ok: true, id })
        }
        if (url === '/__mock/applications') return send(res, 200, [...apps.values()].map((a) => ({ id: a.id, status: a.status, files: a.files, received: [...a.received.entries()] })))
        next()
      })
    },
  }
}
