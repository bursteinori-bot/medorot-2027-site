import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LangToggle } from '../shared/LangToggle'
import { useAdmin } from './api'

// Small, calm building blocks for the admin area.
export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const v = {
    primary: 'bg-black text-white hover:bg-[#333]',
    secondary: 'bg-white border-2 border-black hover:bg-[#fff7c2]',
    danger: 'bg-white border-2 border-[#b3261e] text-[#b3261e] hover:bg-[#fde8e7]',
    ghost: 'underline underline-offset-4 hover:bg-black/5',
  }[variant]
  return <button type="button" {...p} className={`min-h-11 px-4 rounded-md text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed ${v} ${className}`} />
}

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`bg-white border border-black/15 rounded-lg p-5 ${className}`}>{children}</div>

export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <h1 id="admin-title" tabIndex={-1} className="text-3xl md:text-4xl font-black outline-none">{children}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  const c = { info: 'bg-[#fff7c2] border-[#d9c400]', error: 'bg-[#fde8e7] border-[#b3261e]', ok: 'bg-[#e4f4e8] border-[#1f7a3d]' }[kind]
  return <p role={kind === 'error' ? 'alert' : 'status'} className={`border-s-4 px-4 py-3 rounded text-base ${c}`}>{children}</p>
}

export const inputCls = 'w-full bg-white border-2 border-black/30 focus:border-black rounded-md px-3 py-2.5 text-base outline-none'

export function Field({ label, hint, children, id }: { label: string; hint?: string; children: ReactNode; id?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block font-bold mb-1">{label}</label>
      {hint && <p className="text-sm text-black/60 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useAdmin()
  return <p role="status" className="text-black/60 py-8">{label ?? t.loading}</p>
}

// the Hebrew / English switch, in the admin's look (black outline, yellow hover, a clear keyboard focus ring)
export const AdminLangToggle = ({ className = '' }: { className?: string }) => (
  <LangToggle className={`shrink-0 min-h-10 min-w-11 px-2.5 rounded-md border-2 border-black bg-white text-sm hover:bg-[#fff7c2] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#c42a7d] ${className}`} />
)
