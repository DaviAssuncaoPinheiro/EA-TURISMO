import * as React from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'motion/react'
import { Bell, CalendarDays, ChevronRight, House, Map, MessageCircleHeart, PawPrint, Search, Smartphone, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CLINIC, CURRENT_USER, PETS, TUTOR, VETS } from '@/data/mock'
import { BAIRRO } from '@/data/geo'
import { fmt, TODAY } from '@/data/time'
import { Kbd, PetAvatar, VetAvatar } from './ui'
import { useDemo } from '@/store'
import { DemoGuide } from './DemoGuide'

export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--color-sage-800)" />
      <path d="M17 41c0-8.3 6.7-15 15-15s15 6.7 15 15" fill="none" stroke="var(--color-paper)" strokeWidth="5" strokeLinecap="round" />
      <path d="M24 41h16" stroke="var(--color-paper)" strokeWidth="5" strokeLinecap="round" opacity=".35" />
      <circle cx="32" cy="17.5" r="5" fill="var(--color-terra-500)" />
    </svg>
  )
}

const NAV = [
  { to: '/', label: 'Hoje', icon: House, end: true },
  { to: '/agenda', label: 'Agenda por região', icon: CalendarDays },
  { to: '/regioes', label: 'Mapa e regiões', icon: Map },
  { to: '/pacientes', label: 'Pacientes', icon: PawPrint },
  { to: '/lembretes', label: 'Lembretes', icon: MessageCircleHeart, badge: 'remindersDue' as const },
]

export function AppShell() {
  const [cmdOpen, setCmdOpen] = React.useState(false)
  const loc = useLocation()
  const reminders = useDemo((s) => s.reminders)
  const reset = useDemo((s) => s.reset)
  const due = reminders.filter((r) => r.status === 'programado' || r.status === 'sem-resposta').length

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  React.useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0 })
  }, [loc.pathname])

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-paper">
      {/* Sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-line bg-paper-2/60 lg:flex">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6">
          <LogoMark size={32} />
          <div className="leading-tight">
            <div className="font-display text-[17px] font-semibold text-ink">{CLINIC.name}</div>
            <div className="text-[11.5px] text-ink-3">{CLINIC.city}</div>
          </div>
        </div>

        <button
          onClick={() => setCmdOpen(true)}
          className="mx-3 mb-4 flex h-9 items-center gap-2 rounded-md border border-line bg-card px-2.5 text-[13px] text-ink-3 shadow-card transition-colors hover:border-line-2"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar pet, tutor…</span>
          <Kbd>⌘K</Kbd>
        </button>

        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'group relative flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13.5px] font-medium transition-colors',
                  isActive ? 'bg-card text-ink shadow-card' : 'text-ink-2 hover:bg-paper-2 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon className={cn('size-[17px]', isActive ? 'text-sage-700' : 'text-ink-3 group-hover:text-ink-2')} strokeWidth={1.8} />
                  <span className="flex-1">{n.label}</span>
                  {n.badge && due > 0 && <span className="num rounded-full bg-terra-600 px-1.5 text-[11px] leading-[18px] font-semibold text-white">{due}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-3 mt-6 mb-2 eyebrow px-2.5">Em campo agora</div>
        <div className="flex flex-col gap-0.5 px-3">
          {VETS.map((v) => (
            <NavLink key={v.id} to={`/campo?vet=${v.id}`} className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-ink-2 hover:bg-paper-2">
              <span className="relative">
                <VetAvatar vetId={v.id} size={22} />
                <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-2 border-paper bg-ok" />
              </span>
              <span className="flex-1 truncate">{v.short}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto p-3">
          <NavLink
            to="/campo"
            className="group relative flex items-center gap-3 overflow-hidden rounded-lg bg-sage-900 p-3 text-paper shadow-lift transition-transform hover:-translate-y-px"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-white/10">
              <Smartphone className="size-[18px]" strokeWidth={1.8} />
            </span>
            <span className="flex-1 leading-tight">
              <span className="block text-[13px] font-semibold">App do veterinário</span>
              <span className="block text-[11.5px] text-sage-200">Abrir a versão de celular</span>
            </span>
            <ChevronRight className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </NavLink>
          <div className="mt-3 flex items-center gap-2.5 px-1">
            <span className="flex size-8 items-center justify-center rounded-full bg-terra-100 text-[12px] font-semibold text-terra-700">{CURRENT_USER.initials}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium text-ink">{CURRENT_USER.name}</div>
              <div className="truncate text-[11.5px] text-ink-3">{CURRENT_USER.role}</div>
            </div>
            <button title="Reiniciar dados da demonstração" onClick={reset} className="rounded-md p-1.5 text-ink-4 hover:bg-paper-2 hover:text-ink-2">
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-paper/80 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark size={26} />
            <span className="font-display text-[15px] font-semibold">{CLINIC.name}</span>
          </div>
          <div className="hidden items-center gap-2 text-[13px] text-ink-3 lg:flex">
            <span className="first-letter:uppercase">{fmt.long(TODAY)}</span>
            <span className="text-ink-4">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-ok" />
              </span>
              3 veterinários em rota
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => setCmdOpen(true)} className="rounded-md p-2 text-ink-2 hover:bg-paper-2 lg:hidden">
              <Search className="size-[18px]" />
            </button>
            <button className="relative rounded-md p-2 text-ink-2 hover:bg-paper-2">
              <Bell className="size-[18px]" strokeWidth={1.8} />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border-2 border-paper bg-terra-500" />
            </button>
            <NavLink to="/campo" className="ml-1 hidden h-8 items-center gap-1.5 rounded-md border border-line-2 bg-card px-3 text-[13px] font-medium text-ink shadow-card hover:bg-card-2 md:inline-flex lg:hidden">
              <Smartphone className="size-4" /> App do vet
            </NavLink>
          </div>
        </header>

        <main className="scroll-thin flex-1 overflow-y-auto pb-24 lg:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={loc.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Tab bar mobile */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          {[...NAV.slice(0, 2), { to: '/campo', label: 'App vet', icon: Smartphone }, ...NAV.slice(3)].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={'end' in n ? n.end : undefined}
              className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-0.5 py-2 text-[10.5px] font-medium', isActive ? 'text-sage-800' : 'text-ink-3')}
            >
              <n.icon className="size-5" strokeWidth={1.8} />
              {n.label.split(' ')[0]}
            </NavLink>
          ))}
        </nav>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <DemoGuide />
    </div>
  )
}

function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate()
  const go = (to: string) => {
    onOpenChange(false)
    nav(to)
  }
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-start justify-center bg-sage-950/25 p-4 pt-[12vh] backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => onOpenChange(false)}>
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-card shadow-float"
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Busca" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5">
              <div className="flex items-center gap-2 border-b border-line px-4">
                <Search className="size-4 text-ink-3" />
                <Command.Input autoFocus placeholder="Buscar paciente, tutor, bairro ou tela…" className="h-12 flex-1 bg-transparent text-[14.5px] outline-none placeholder:text-ink-4" />
                <Kbd>esc</Kbd>
              </div>
              <Command.List className="scroll-thin max-h-[380px] overflow-y-auto p-1.5">
                <Command.Empty className="px-3 py-8 text-center text-[13px] text-ink-3">Nada encontrado.</Command.Empty>
                <Command.Group heading="Pacientes">
                  {PETS.map((p) => {
                    const t = TUTOR[p.tutorId]
                    return (
                      <Command.Item
                        key={p.id}
                        value={`${p.name} ${p.breed} ${t.name} ${BAIRRO[t.bairro].name}`}
                        onSelect={() => go(`/pacientes/${p.id}`)}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 data-[selected=true]:bg-paper-2"
                      >
                        <PetAvatar pet={p} size={30} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium text-ink">
                            {p.name} <span className="font-normal text-ink-3">· {p.breed}</span>
                          </div>
                          <div className="truncate text-[12px] text-ink-3">
                            {t.name} · {BAIRRO[t.bairro].name}
                          </div>
                        </div>
                      </Command.Item>
                    )
                  })}
                </Command.Group>
                <Command.Group heading="Telas">
                  {[...NAV, { to: '/campo', label: 'App do veterinário (celular)' }].map((n) => (
                    <Command.Item key={n.to} value={n.label} onSelect={() => go(n.to)} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[13.5px] data-[selected=true]:bg-paper-2">
                      <ChevronRight className="size-4 text-ink-4" /> {n.label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
