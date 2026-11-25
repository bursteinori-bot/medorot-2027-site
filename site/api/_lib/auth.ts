// Admin authentication: scrypt password hashes, random session tokens in an HttpOnly cookie (only their sha256 is
// stored), and role checks. There is no public sign-up: accounts exist only through an admin's invite.
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { sql } from './server.js'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>
const N = 16384
const COOKIE = 'medorot_admin'
const SESSION_DAYS = 14

export type Role = 'admin' | 'editor' | 'reviewer'
export type Admin = { id: string; email: string; display_name: string | null; role: Role; can_publish: boolean }

export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const hash = await scrypt(pw, salt, 32, { N, r: 8, p: 1 })
  return `scrypt$${N}$${salt.toString('base64')}$${hash.toString('base64')}`
}

export async function verifyPassword(pw: string, stored: string | null) {
  if (!stored) return false
  const [kind, n, salt, hash] = stored.split('$')
  if (kind !== 'scrypt') return false
  const expected = Buffer.from(hash, 'base64')
  const got = await scrypt(pw, Buffer.from(salt, 'base64'), expected.length, { N: Number(n), r: 8, p: 1 })
  return timingSafeEqual(expected, got)
}

export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
export const newToken = () => randomBytes(32).toString('base64url')

function readCookie(req: Request, name: string) {
  const raw = req.headers.get('cookie') ?? ''
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export async function startSession(userId: string) {
  const token = newToken()
  await sql()`insert into admin_sessions (token_hash, user_id, expires_at) values (${sha256(token)}, ${userId}, now() + ${`${SESSION_DAYS} days`}::interval)`
  await sql()`update admin_users set last_login_at = now() where id = ${userId}`
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`
}

export async function endSession(req: Request) {
  const token = readCookie(req, COOKIE)
  if (token) await sql()`delete from admin_sessions where token_hash = ${sha256(token)}`
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}

export async function currentAdmin(req: Request): Promise<Admin | null> {
  const token = readCookie(req, COOKIE)
  if (!token) return null
  const [row] = await sql()`
    select u.id, u.email, u.display_name, u.role, u.can_publish from admin_sessions s join admin_users u on u.id = s.user_id
    where s.token_hash = ${sha256(token)} and s.expires_at > now() and u.password_hash is not null`
  return (row as Admin) ?? null
}

export const canPublish = (a: Admin) => a.role === 'admin' || (a.role === 'editor' && a.can_publish)
export const hasRole = (a: Admin, roles: Role[]) => roles.includes(a.role)
