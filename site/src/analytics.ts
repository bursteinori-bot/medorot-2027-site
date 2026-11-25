// Anonymous usage statistics for the public site (see api/track.ts). Off unless the live site turns it on, off for
// visitors who ask not to be tracked (Do Not Track / Global Privacy Control), and never for previews or admin pages.
let enabled = false
let session = ''

export function enableTracking() {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl || /[?&]preview=/.test(location.search)) return
  try {
    session = sessionStorage.getItem('medorot-s') ?? ''
    if (!session) sessionStorage.setItem('medorot-s', (session = crypto.randomUUID().slice(0, 18)))
  } catch {
    session ||= crypto.randomUUID().slice(0, 18)
  }
  enabled = true
}

function send(payload: object) {
  if (!enabled) return
  const body = JSON.stringify({ session, ...payload })
  try {
    if (!navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) throw 0
  } catch {
    fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
  }
}

let firstView = true
export function trackPage(section: string) {
  // the referrer only counts on the first page of a visit (later ones are our own navigation)
  send({ type: 'pageview', name: section, ref: firstView ? document.referrer || undefined : undefined })
  firstView = false
}

export const track = (name: string, props?: Record<string, string | number | boolean>) => send({ type: 'event', name, props })
