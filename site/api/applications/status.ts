import { applicationsOpen, json } from '../_lib/server.js'

// Is the online form accepting applications? (backend configured and not switched off with APPLICATIONS_OPEN=false)
export function GET() {
  return json({ open: applicationsOpen() })
}
