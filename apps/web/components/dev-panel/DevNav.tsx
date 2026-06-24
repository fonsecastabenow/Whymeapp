'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type StoredUser = {
  id: string
  name: string
  role: string
  candidate_id?: string
  company_id?: string
}

const HIDE_ON = ['/', '/login', '/register']

export function DevNav() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('whyme_token')
    const str = localStorage.getItem('whyme_user')
    if (!token || !str) return
    try { setUser(JSON.parse(str)) } catch {}
  }, [pathname])

  if (!user || HIDE_ON.includes(pathname)) return null

  const cid = user.candidate_id
  const oid = user.company_id

  const GROUPS = [
    {
      label: 'Auth', links: [
        { name: 'Gate /', href: '/' },
        { name: 'Login', href: '/login' },
        { name: 'Register', href: '/register' },
      ],
    },
    {
      label: 'Públicas', links: [
        { name: 'Home', href: '/home' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Terms', href: '/terms' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Accessibility', href: '/accessibility' },
      ],
    },
    {
      label: 'Interno', links: [
        { name: 'Notifications', href: '/notifications' },
      ],
    },
    {
      label: 'Candidato', links: [
        { name: 'Dashboard',  href: cid ? `/candidate/${cid}/dashboard`  : null },
        { name: 'Profile',    href: cid ? `/candidate/${cid}/profile`    : null },
        { name: 'Onboarding', href: cid ? `/candidate/${cid}/onboarding` : null },
        { name: 'Report',     href: cid ? `/candidate/${cid}/report`     : null },
        { name: 'Orbita',     href: '/candidate/orbita' },
      ],
    },
    {
      label: 'Empresa', links: [
        { name: 'Dashboard',  href: oid ? `/company/${oid}/dashboard` : null },
        { name: 'Profile',    href: oid ? `/company/${oid}/profile`   : null },
        { name: 'Jobs',       href: oid ? `/company/${oid}/jobs`      : null },
        { name: 'Orbita',     href: '/company/orbita' },
        { name: 'Onboarding', href: '/company/onboarding' },
      ],
    },
    {
      label: 'Admin', links: [
        { name: 'Dashboard', href: '/admin/dashboard' },
      ],
    },
  ]

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[9999] flex items-center">
      {open && (
        <div className="glass-card border border-[#3AB0FF]/20 rounded-l-2xl w-52 max-h-[80vh] overflow-y-auto shadow-2xl shadow-black/60">
          <div className="px-3 py-2.5 border-b border-[#3AB0FF]/10">
            <p className="text-[10px] font-black text-[#3AB0FF] uppercase tracking-widest">⚙ Dev Nav</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user.name} · {user.role}</p>
          </div>
          <nav className="p-2 space-y-3">
            {GROUPS.map(g => (
              <div key={g.label}>
                <p className="text-[9px] text-muted-foreground/40 uppercase tracking-widest px-2 mb-1">{g.label}</p>
                {g.links.map(l => l.href ? (
                  <Link
                    key={l.name}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block px-2 py-1 rounded-lg text-xs transition-colors ${
                      pathname === l.href
                        ? 'bg-[#3AB0FF]/15 text-[#3AB0FF] font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    {l.name}
                  </Link>
                ) : (
                  <span key={l.name} className="block px-2 py-1 text-xs text-muted-foreground/25 cursor-default select-none">
                    {l.name} <span className="text-[9px]">sem ID</span>
                  </span>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-5 h-14 bg-[#3AB0FF]/15 hover:bg-[#3AB0FF]/25 border border-[#3AB0FF]/25 border-r-0 rounded-l-lg flex items-center justify-center transition-colors"
        title="Dev Navigation"
      >
        <span
          className="text-[8px] font-black text-[#3AB0FF] tracking-widest"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          DEV
        </span>
      </button>
    </div>
  )
}
