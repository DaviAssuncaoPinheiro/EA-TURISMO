import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCheck,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  HeartPulse,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Paperclip,
  Pill,
  Plus,
  Send,
  Stethoscope,
  Syringe,
  TestTube,
  type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, Button, Card, Empty, IconButton, IconCircle, Panel, PetAvatar, VetAvatar, ViewAll } from '@/components/ui'
import { CityMap, MapStatusLegend, type MapVisit } from '@/components/map/CityMap'
import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import { CURRENT_USER, DOSES, NOW, PET, TUTOR, VACCINE, VET, VETS, visitsToday, type Pet, type Visit, type VisitStatus } from '@/data/mock'
import { daysFromToday, fmt, TODAY } from '@/data/time'
import { buildKit, navLinks, type KitItem } from '@/lib/fieldkit'
import { cn, firstName } from '@/lib/utils'
import { VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'

const EASE = [0.16, 1, 0.3, 1] as const

/* ───────────────────────── tempo e dados do dia ───────────────────────── */

const pad = (n: number) => String(n).padStart(2, '0')
const minOf = (d: string | Date) => {
  const x = new Date(d)
  return x.getHours() * 60 + x.getMinutes()
}
const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`
const NOW_MIN = minOf(NOW)
const durFmt = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min} min`)

interface Stop {
  visit: Visit
  status: VisitStatus
  startMin: number
}

const TODAY_VISITS = visitsToday()

const petNames = (v: Visit) => joinE(v.petIds.map((id) => PET[id]?.name ?? id))
const joinE = (xs: string[]) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0] ?? '')
const bairroOf = (v: Visit) => BAIRRO[TUTOR[v.tutorId].bairro]
const zonesOf = (stops: Stop[]): ZoneId[] => [...new Set(stops.map((s) => bairroOf(s.visit).zone))]
const zonesTxt = (zs: ZoneId[]) => zs.map((z) => ZONE[z].short).join(' e ')

function greeting() {
  const h = NOW.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const scrollTop = () => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
const openVisit = (nav: ReturnType<typeof useNavigate>, v: Visit) => nav(`/campo/visita/${v.id}`)

/* ───────────────────────── página ───────────────────────── */

export default function Hoje() {
  const nav = useNavigate()
  const visitStatus = useDemo((s) => s.visitStatus)

  const [vetId, setVetId] = React.useState('larissa')
  const [sel, setSel] = React.useState<string | null>(null)

  const byVet = React.useMemo(() => {
    const out: Record<string, Stop[]> = {}
    for (const v of VETS) {
      out[v.id] = TODAY_VISITS.filter((x) => x.vetId === v.id)
        .map((x) => ({ visit: x, status: visitStatus[x.id] ?? x.status, startMin: minOf(x.start) }))
        .filter((s) => s.status !== 'cancelada')
        .sort((a, b) => a.startMin - b.startMin)
    }
    return out
  }, [visitStatus])

  const pickVet = (id: string, visitId?: string | null) => {
    setVetId(id)
    setSel(visitId ?? null)
  }

  const dateTxt = fmt.long(TODAY).replace(/^./, (c) => c.toUpperCase())

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 lg:pb-8">
      {/* saudação */}
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">
            {greeting()}, {firstName(CURRENT_USER.name)}
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-ink-3">{dateTxt}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => nav('/agenda?novo=1')}>
            <Plus className="size-4" strokeWidth={2.2} /> Nova visita
          </Button>
          <IconButton aria-label="Abrir agenda" onClick={() => nav('/agenda')}>
            <CalendarDays className="size-[18px]" strokeWidth={1.9} />
          </IconButton>
        </div>
      </div>

      {/* mapa + visitas de hoje */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:h-[680px] lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <MapCard stops={byVet[vetId]} vetId={vetId} onVet={(id) => pickVet(id)} sel={sel} onSel={setSel} />
        <VisitsPanel stops={byVet[vetId]} vetId={vetId} selected={sel} onHover={setSel} onAll={() => nav('/agenda')} />
      </div>

      {/* kit do dia + próximas + assistente */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <DayKit vetId={vetId} stops={byVet[vetId]} />
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-1">
          <NextVisits
            byVet={byVet}
            onPick={(v, id) => {
              pickVet(v, id)
              scrollTop()
            }}
            onAll={() => nav('/agenda')}
          />
          <Assistant />
        </div>
      </div>

      {/* equipe */}
      <div className="mt-4">
        <Team
          byVet={byVet}
          activeVet={vetId}
          onPick={(id) => {
            pickVet(id)
            scrollTop()
          }}
          onAll={() => nav('/campo')}
        />
      </div>

      <Attention byVet={byVet} />
    </div>
  )
}

/* ───────────────────────── abas de veterinário ───────────────────────── */

function VetTabs({ vetId, onVet, byVet }: { vetId: string; onVet: (id: string) => void; byVet?: Record<string, Stop[]> }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Veterinário">
      {VETS.map((v) => {
        const active = v.id === vetId
        const live = byVet?.[v.id]?.some((s) => s.status === 'em-atendimento')
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            onClick={() => onVet(v.id)}
            className={cn(
              'flex h-11 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-[13.5px] font-semibold transition-colors active:scale-[.97]',
              active ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2 hover:text-ink',
            )}
          >
            <span className="relative">
              <VetAvatar vetId={v.id} size={32} className={cn(active && 'ring-2 ring-white/20')} />
              {live && <span className={cn('absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-lime-2 ring-2', active ? 'ring-black' : 'ring-muted')} />}
            </span>
            {v.short}
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── mapa (só os pontos) ───────────────────────── */

function MapCard({ stops, vetId, onVet, sel, onSel }: { stops: Stop[]; vetId: string; onVet: (id: string) => void; sel: string | null; onSel: (id: string | null) => void }) {
  const vet = VET[vetId]
  const zones = zonesOf(stops)
  const visits = React.useMemo(
    () =>
      stops.map<MapVisit>((s) => ({
        id: s.visit.id,
        petId: s.visit.petIds[0],
        extraPets: s.visit.petIds.length - 1,
        bairro: TUTOR[s.visit.tutorId].bairro,
        seed: s.visit.tutorId,
        status: s.status,
        caption: `${hhmm(s.startMin)}, ${bairroOf(s.visit).name}`,
      })),
    [stops],
  )

  return (
    <Card className="flex min-h-0 min-w-0 flex-col p-2">
      <div className="px-1 pt-1 pb-2">
        <VetTabs vetId={vetId} onVet={onVet} />
      </div>

      <div className="relative aspect-[5/4] overflow-hidden rounded-[20px] bg-surface sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
        <CityMap
          visits={visits}
          focus="visits"
          showRoute={false}
          showBase={false}
          showScale={false}
          highlightZones={zones}
          selectedVisitId={sel}
          onSelectVisit={onSel}
          ariaLabel={`Visitas de hoje da ${vet.name}`}
        />

        <div className="pointer-events-none absolute top-3 left-3 hidden max-w-[calc(100%-120px)] items-center sm:flex gap-2 rounded-full bg-card/95 py-1.5 pr-3.5 pl-1.5 shadow-pill backdrop-blur-sm">
          <VetAvatar vetId={vetId} size={26} />
          <span className="flex min-w-0 items-center gap-1.5 truncate text-[12.5px] font-semibold text-ink">
            {zones.map((z) => (
              <span key={z} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: ZONE[z].hex }} />
                {ZONE[z].short}
              </span>
            ))}
          </span>
        </div>

        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex h-8 sm:top-3 sm:bottom-auto items-center gap-2 rounded-full bg-black pr-3.5 pl-3 text-[12.5px] font-semibold text-white shadow-pill">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-lime" />
          </span>
          Agora <span className="num">{hhmm(NOW_MIN)}</span>
        </span>

        <div className="absolute bottom-3 left-3 hidden h-9 items-center rounded-full bg-card/95 px-4 shadow-pill backdrop-blur-sm md:flex">
          <MapStatusLegend />
        </div>
      </div>
    </Card>
  )
}

/* ───────────────────────── visitas de hoje ───────────────────────── */

function VisitsPanel({ stops, vetId, selected, onHover, onAll }: { stops: Stop[]; vetId: string; selected: string | null; onHover: (id: string) => void; onAll: () => void }) {
  const nav = useNavigate()
  const vet = VET[vetId]
  const listRef = React.useRef<HTMLDivElement>(null)

  const groups = React.useMemo(() => {
    const m = new Map<ZoneId, Stop[]>()
    for (const s of stops) {
      const z = bairroOf(s.visit).zone
      if (!m.has(z)) m.set(z, [])
      m.get(z)!.push(s)
    }
    return [...m.entries()]
  }, [stops])

  React.useEffect(() => {
    if (!selected) return
    const box = listRef.current
    const el = box?.querySelector<HTMLElement>(`[data-stop="${selected}"]`)
    if (!el || !box || box.scrollHeight <= box.clientHeight + 4) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - 48, behavior: 'smooth' })
  }, [selected])

  return (
    <Panel className="flex min-h-0 min-w-0 flex-col bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Visitas de hoje</h2>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">{vet.short}</p>
        </div>
        <ViewAll onClick={onAll} />
      </div>

      <div ref={listRef} className="scroll-thin relative flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={vetId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="flex flex-col gap-4">
            {groups.map(([z, ss]) => (
              <section key={z}>
                <div className="flex items-center gap-2 px-2 pb-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: ZONE[z].hex }} />
                  <span className="shrink-0 text-[13.5px] font-bold whitespace-nowrap text-ink">{ZONE[z].name}</span>
                  <span className="min-w-0 truncate text-[12.5px] font-medium text-ink-3">{joinE([...new Set(ss.map((s) => bairroOf(s.visit).name))])}</span>
                </div>
                <ol className="flex flex-col gap-2">
                  {ss.map((s, i) => (
                    <VisitCard key={s.visit.id} s={s} i={i} selected={selected === s.visit.id} onHover={() => onHover(s.visit.id)} onOpen={() => openVisit(nav, s.visit)} />
                  ))}
                </ol>
              </section>
            ))}
            {!groups.length && <Empty title="Sem visitas hoje" />}
          </motion.div>
        </AnimatePresence>
      </div>
    </Panel>
  )
}

function NavPill({ href, icon: Icon, label, dark }: { href: string; icon: LucideIcon; label: string; dark?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir no ${label}`}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition-[background,transform] duration-150 active:scale-[.97]',
        dark ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-muted text-ink hover:bg-muted-2',
      )}
    >
      <Icon className={cn('size-3.5', dark ? 'text-white/70' : 'text-ink-2')} strokeWidth={2} />
      {label}
    </a>
  )
}

function VisitCard({ s, i, selected, onHover, onOpen }: { s: Stop; i: number; selected: boolean; onHover: () => void; onOpen: () => void }) {
  const v = s.visit
  const pet = PET[v.petIds[0]]
  const st = VISIT_STATUS[s.status]
  const live = s.status === 'em-atendimento'
  const done = s.status === 'concluida'
  const links = navLinks(v)
  const t = TUTOR[v.tutorId]
  const elapsed = Math.max(0, Math.min(v.durationMin, NOW_MIN - s.startMin))

  return (
    <motion.li
      data-stop={v.id}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.03, ease: EASE }}
      onMouseEnter={onHover}
      className={cn(
        'rounded-[20px] p-3 transition-[box-shadow] duration-150',
        live ? 'bg-black text-white' : 'bg-card shadow-card hover:shadow-lift',
        selected && (live ? 'ring-2 ring-lime' : 'ring-2 ring-black'),
      )}
    >
      <button onClick={onOpen} className="grid w-full grid-cols-[44px_40px_minmax(0,1fr)_auto] items-center gap-x-3 text-left" aria-label={`Abrir visita de ${petNames(v)}`}>
        <div className="leading-tight">
          <div className={cn('num text-[14px] font-bold', done ? 'text-ink-3' : live ? 'text-white' : 'text-ink')}>{hhmm(s.startMin)}</div>
          {v.fixedTime ? (
            <span className={cn('mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold', live ? 'text-white/50' : 'text-ink-3')}>
              <Lock className="size-2.5" strokeWidth={2.4} /> fixo
            </span>
          ) : (
            <div className={cn('num mt-0.5 text-[11px] font-semibold', live ? 'text-white/50' : 'text-ink-4')}>{v.durationMin} min</div>
          )}
        </div>
        <PetAvatar pet={pet} size={40} className={cn(done && 'opacity-60', live && 'ring-2 ring-lime')} />
        <div className={cn('min-w-0', done && 'opacity-70')}>
          <div className="truncate text-[14px] font-bold">{petNames(v)}</div>
          <div className={cn('truncate text-[12.5px] font-medium', live ? 'text-white/60' : 'text-ink-3')}>
            {v.type}, {t.address}
          </div>
        </div>
        <div className="flex justify-end">
          {s.status === 'agendada' ? null : (
            <Badge tone={st.tone} dot={live}>
              {done ? <Check className="-mx-0.5 size-3" strokeWidth={3} /> : null}
              {done ? 'Feita' : st.label}
            </Badge>
          )}
        </div>
      </button>

      {live && (
        <div className="mt-3 flex items-center gap-2.5">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.span className="block h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${(elapsed / v.durationMin) * 100}%` }} transition={{ duration: 1, ease: EASE }} />
          </span>
          <span className="num shrink-0 text-[11.5px] font-semibold text-white/60">Desde {hhmm(s.startMin)}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <NavPill href={links.waze} icon={Navigation} label="Waze" dark={live} />
        <NavPill href={links.maps} icon={MapPin} label="Maps" dark={live} />
        {!live && (
          <Button variant={done ? 'ghost' : 'subtle'} size="sm" onClick={onOpen} className="ml-auto">
            {done ? 'Ver visita' : 'Abrir visita'}
            <ArrowUpRight className="size-3.5" strokeWidth={2.2} />
          </Button>
        )}
      </div>
      {live && (
        <Button variant="lime" size="md" onClick={onOpen} className="mt-2 w-full">
          Continuar atendimento <ArrowRight className="size-4" strokeWidth={2.2} />
        </Button>
      )}
    </motion.li>
  )
}

/* ───────────────────────── kit do dia ───────────────────────── */

const KIT_GROUPS: { id: KitItem['group']; icon: LucideIcon; tone: 'blue' | 'violet' | 'yellow' | 'green' }[] = [
  { id: 'Vacinas', icon: Syringe, tone: 'blue' },
  { id: 'Coleta', icon: TestTube, tone: 'violet' },
  { id: 'Procedimentos', icon: Stethoscope, tone: 'yellow' },
  { id: 'Medicamentos', icon: Pill, tone: 'green' },
]

function qtyLabel(it: KitItem) {
  const n = it.qty
  const plural: Record<string, [string, string]> = { dose: ['dose', 'doses'], frasco: ['frasco', 'frascos'], kit: ['kit', 'kits'] }
  const u = it.unit && plural[it.unit]
  if (u) return `${n} ${n === 1 ? u[0] : u[1]}`
  return `${n} un`
}

function DayKit({ vetId, stops }: { vetId: string; stops: Stop[] }) {
  const kitChecked = useDemo((s) => s.kitChecked)
  const toggleKit = useDemo((s) => s.toggleKit)
  const vet = VET[vetId]

  const items = React.useMemo(() => buildKit(stops.map((s) => s.visit)), [stops])
  const petByName = React.useMemo(() => {
    const m: Record<string, Pet> = {}
    for (const s of stops) for (const id of s.visit.petIds) m[PET[id].name] = PET[id]
    return m
  }, [stops])
  const key = (it: KitItem) => `${vetId}:${it.id}`
  const done = items.filter((it) => kitChecked[key(it)]).length
  const groups = KIT_GROUPS.map((g) => ({ ...g, items: items.filter((i) => i.group === g.id) })).filter((g) => g.items.length)
  const ready = items.length > 0 && done === items.length

  const copy = async () => {
    const lines = [`Kit do dia, ${vet.short}`]
    for (const g of groups) {
      lines.push('', g.id)
      for (const it of g.items) lines.push(`${kitChecked[key(it)] ? '[x]' : '[ ]'} ${it.label}, ${qtyLabel(it)} (${joinE(it.forPets)})`)
    }
    try {
      if (!navigator.clipboard) throw new Error('sem clipboard')
      await navigator.clipboard.writeText(lines.join('\n'))
      toast.success('Lista copiada', { description: 'Cole no WhatsApp ou nas notas.' })
    } catch {
      toast.error('Não foi possível copiar a lista')
    }
  }

  return (
    <Panel id="kit" className="scroll-mt-4 bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Kit do dia</h2>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">O que levar no carro, {vet.short}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copy} disabled={!items.length}>
          <Copy className="size-3.5" strokeWidth={2} /> Copiar lista
        </Button>
      </div>

      {items.length ? (
        <>
          <div className="rounded-[20px] bg-card p-4 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13.5px] font-bold text-ink">
                <span className="num">{done}</span> de <span className="num">{items.length}</span> separados
              </span>
              {ready ? (
                <Badge tone="ok">
                  <Check className="-mx-0.5 size-3" strokeWidth={3} /> Kit pronto
                </Badge>
              ) : (
                <span className="text-[12.5px] font-medium text-ink-3">Toque para marcar</span>
              )}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <motion.div className={cn('h-full rounded-full', ready ? 'bg-green' : 'bg-black')} initial={false} animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.45, ease: EASE }} />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[minmax(0,1fr)] items-start gap-2 md:grid-cols-2">
            {groups.map((g) => {
              const gDone = g.items.filter((it) => kitChecked[key(it)]).length
              return (
                <div key={g.id} className="rounded-[20px] bg-card p-2 shadow-card">
                  <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2">
                    <IconCircle size={30} tone={g.tone}>
                      <g.icon className="size-3.5" strokeWidth={2.1} />
                    </IconCircle>
                    <span className="text-[14px] font-bold text-ink">{g.id}</span>
                    <span className="num ml-auto text-[12px] font-semibold text-ink-3">
                      {gDone}/{g.items.length}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {g.items.map((it) => {
                      const on = !!kitChecked[key(it)]
                      const pets = it.forPets.map((n) => petByName[n]).filter(Boolean)
                      return (
                        <li key={it.id} className="border-t border-line first:border-t-0">
                          <button
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleKit(key(it))}
                            className="flex w-full items-center gap-3 rounded-[14px] px-2 py-2.5 text-left transition-colors hover:bg-surface"
                          >
                            <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full transition-colors duration-150', on ? 'bg-black text-lime' : 'bg-card ring-[1.5px] ring-line-2 ring-inset')}>
                              <AnimatePresence initial={false}>
                                {on && (
                                  <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.18 }}>
                                    <Check className="size-3.5" strokeWidth={3} />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn('block truncate text-[13.5px] font-semibold transition-colors', on ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{it.label}</span>
                              <span className="mt-1 flex min-w-0 items-center gap-1.5">
                                {pets.length > 0 && (
                                  <AvatarStack size={20}>
                                    {pets.slice(0, 3).map((p) => (
                                      <PetAvatar key={p.id} pet={p} size={20} />
                                    ))}
                                  </AvatarStack>
                                )}
                                <span className="min-w-0 truncate text-[12px] font-medium text-ink-3">{joinE(it.forPets)}</span>
                              </span>
                            </span>
                            <span className={cn('num inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-[12px] font-semibold', on ? 'bg-muted text-ink-3' : 'bg-muted text-ink')}>{qtyLabel(it)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <Empty icon={<ClipboardList className="size-5" strokeWidth={2} />} title="Nada para separar">
            As visitas de hoje não pedem material extra.
          </Empty>
        </Card>
      )}
    </Panel>
  )
}

/* ───────────────────────── próximas visitas (ref. Future Events) ───────────────────────── */

function SectionHead({ title, sub, action }: { title: string; sub?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
      <div className="min-w-0">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {sub && <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function InfoPill({ icon: Icon, children, className }: { icon: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', className)}>
      <Icon className="size-3.5 shrink-0 opacity-70" strokeWidth={2} />
      <span className="num truncate">{children}</span>
    </span>
  )
}

function NextVisits({ byVet, onPick, onAll }: { byVet: Record<string, Stop[]>; onPick: (vetId: string, visitId: string) => void; onAll: () => void }) {
  const upcoming = VETS.flatMap((v) => byVet[v.id])
    .filter((s) => s.status === 'agendada' && s.startMin > NOW_MIN)
    .sort((a, b) => a.startMin - b.startMin)
    .slice(0, 3)

  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Próximas visitas" action={<ViewAll onClick={onAll} />} />
      <div className="flex flex-col gap-2">
        {upcoming.map((s, i) => {
          const v = s.visit
          const hot = i === 0
          const pet = PET[v.petIds[0]]
          return (
            <motion.button
              key={v.id}
              layout
              onClick={() => onPick(v.vetId, v.id)}
              className={cn('rounded-[20px] p-4 text-left transition-[box-shadow,transform] duration-150 active:scale-[.99]', hot ? 'bg-yellow' : 'bg-card shadow-card hover:shadow-lift')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-ink">
                    {petNames(v)}, {v.type.toLowerCase()}
                  </div>
                  <div className={cn('mt-0.5 line-clamp-1 text-[13px] font-medium', hot ? 'text-yellow-ink' : 'text-ink-3')}>{v.reason}</div>
                </div>
                {hot && (
                  <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold text-ink">
                    <span className="size-1.5 rounded-full bg-ink" />
                    em {durFmt(s.startMin - NOW_MIN)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex min-w-0 flex-1 gap-1.5">
                  <InfoPill icon={Clock} className={hot ? 'bg-white/55 text-ink' : 'bg-muted text-ink-2'}>
                    {hhmm(s.startMin)} às {hhmm(s.startMin + v.durationMin)}
                  </InfoPill>
                  <InfoPill icon={MapPin} className={cn('max-sm:hidden', hot ? 'bg-white/55 text-ink' : 'bg-muted text-ink-2')}>
                    {bairroOf(v).name}
                  </InfoPill>
                </div>
                <AvatarStack size={32}>
                  <PetAvatar pet={pet} size={32} />
                  <VetAvatar vetId={v.vetId} size={32} />
                </AvatarStack>
              </div>
            </motion.button>
          )
        })}
        {!upcoming.length && (
          <Card>
            <Empty title="Sem mais visitas hoje" />
          </Card>
        )}
      </div>
    </Panel>
  )
}

/* ───────────────────────── equipe em campo (ref. Onboarding) ───────────────────────── */

function vetState(stops: Stop[]) {
  const cur = stops.find((s) => s.status === 'em-atendimento')
  if (cur) return { dot: 'bg-lime-2', txt: `Com ${PET[cur.visit.petIds[0]].name}` }
  const way = stops.find((s) => s.status === 'a-caminho')
  if (way) return { dot: 'bg-blue', txt: `Indo até ${PET[way.visit.petIds[0]].name}` }
  const next = stops.find((s) => s.status === 'agendada')
  if (next) return { dot: 'bg-ink-4', txt: `Próxima às ${hhmm(next.startMin)}` }
  return { dot: 'bg-green', txt: 'Dia encerrado' }
}

function Team({ byVet, activeVet, onPick, onAll }: { byVet: Record<string, Stop[]>; activeVet: string; onPick: (vetId: string) => void; onAll: () => void }) {
  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Equipe em campo" action={<ViewAll onClick={onAll}>App do vet</ViewAll>} />
      <div className="grid grid-cols-3 gap-2">
        {VETS.map((v) => {
          const stops = byVet[v.id]
          const state = vetState(stops)
          const done = stops.filter((s) => s.status === 'concluida').length
          const active = v.id === activeVet
          return (
            <button
              key={v.id}
              onClick={() => onPick(v.id)}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center rounded-[20px] bg-card px-2 pt-5 pb-4 text-center shadow-card transition-[box-shadow,transform] duration-150 hover:shadow-lift active:scale-[.98]',
                active && 'ring-2 ring-black',
              )}
            >
              <span className="relative">
                <VetAvatar vetId={v.id} size={56} />
                <span className={cn('absolute right-0 bottom-0 size-3.5 rounded-full ring-[3px] ring-card', state.dot)} />
              </span>
              <span className="mt-3 w-full truncate text-[13.5px] font-bold text-ink">{v.short}</span>
              <span className="w-full truncate text-[12px] font-medium text-ink-3">{zonesTxt(zonesOf(stops))}</span>
              <span className="mt-3 inline-flex h-7 max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 text-[11.5px] font-semibold text-ink-2">
                <ClipboardCheck className="size-3.5 shrink-0 text-ink-3" strokeWidth={2} />
                <span className="num">
                  {done}/{stops.length}
                </span>
                <span className="max-[460px]:hidden">visitas</span>
              </span>
              <span className="mt-2 w-full truncate text-[11.5px] font-semibold text-ink-2">{state.txt}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

/* ───────────────────────── assistente ───────────────────────── */

function Assistant({ className }: { className?: string }) {
  const nav = useNavigate()
  const [msg, setMsg] = React.useState('')

  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    toast('Mensagem recebida', { description: 'No protótipo, use os atalhos acima.' })
    setMsg('')
  }

  const chips: { label: string; icon: LucideIcon; run: () => void }[] = [
    { label: 'Encaixar visita', icon: CalendarPlus, run: () => nav('/agenda?novo=1') },
    { label: 'Vacinas atrasadas', icon: Syringe, run: () => scrollToId('atencao') },
    { label: 'Kit do dia', icon: ClipboardList, run: () => scrollToId('kit') },
  ]

  return (
    <Panel className={cn('flex flex-col bg-muted', className)}>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-5 text-center">
        <motion.span className="orb size-[76px] rounded-full" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
        <h2 className="mt-5 text-[20px] leading-snug font-bold tracking-[-0.02em] text-ink">
          Olá, {firstName(CURRENT_USER.name)}
          <br />
          <span className="text-ink-2">Como posso ajudar hoje?</span>
        </h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <button key={c.label} onClick={c.run} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 text-[12.5px] font-semibold text-ink shadow-pill transition-[background,transform] hover:bg-surface active:scale-[.97]">
              <c.icon className="size-3.5 text-ink-2" strokeWidth={2} />
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={send} className="rounded-[20px] bg-card p-3 shadow-card">
        <div className="flex items-center gap-2">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value.slice(0, 300))}
            placeholder="Pergunte sobre a agenda de hoje"
            className="h-9 min-w-0 flex-1 bg-transparent px-1 text-[13.5px] font-medium text-ink outline-none placeholder:text-ink-4"
            aria-label="Mensagem para o assistente"
          />
          <IconButton type="submit" tone="black" size={36} aria-label="Enviar">
            <Send className="size-4" strokeWidth={2} />
          </IconButton>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <button type="button" onClick={() => toast('Anexos ficam na ficha do paciente')} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[12px] font-semibold text-ink-2 hover:bg-muted-2">
            <Paperclip className="size-3" strokeWidth={2.2} /> Anexar
          </button>
          <span className="num text-[11.5px] font-medium text-ink-4">{msg.length}/300</span>
        </div>
      </form>
    </Panel>
  )
}

/* ───────────────────────── precisa de atenção (ref. cartão Alert) ───────────────────────── */

const CLINICAL_HINT: Record<string, string> = {
  bob: 'Contenção sem estresse. Auscultar antes de manipular.',
  pipoca: 'Contenção pelo peitoral, nunca pela coleira.',
  zeus: 'O tutor segura. Levar focinheira.',
  fred: 'Atender na sombra e evitar esforço no calor.',
  frida: 'Não erguer pela coluna. Evitar escadas.',
  nina: 'Arisca no manejo. Usar toalha.',
}

type AttnTone = 'red' | 'yellow' | 'blue'
type AttnItem = {
  id: string
  tone: AttnTone
  kind: string
  icon: LucideIcon
  pet?: Pet
  title: React.ReactNode
  sub: React.ReactNode
  action: { label: string; done: string; run: () => void; nav?: boolean }
}

const ATTN_TONE: Record<AttnTone, { bg: string; fg: string }> = {
  red: { bg: 'bg-red-soft', fg: 'text-red' },
  yellow: { bg: 'bg-yellow-soft', fg: 'text-yellow-ink' },
  blue: { bg: 'bg-blue-soft', fg: 'text-blue' },
}

function Attention({ byVet }: { byVet: Record<string, Stop[]> }) {
  const nav = useNavigate()
  const extraDoses = useDemo((s) => s.extraDoses)
  const reminders = useDemo((s) => s.reminders)
  const setReminderStatus = useDemo((s) => s.setReminderStatus)
  const toggleKit = useDemo((s) => s.toggleKit)
  const [resolved, setResolved] = React.useState<Record<string, boolean>>({})
  const resolve = (id: string) => setResolved((r) => ({ ...r, [id]: true }))

  const stops = VETS.flatMap((v) => byVet[v.id])
  const pendingStops = stops.filter((s) => s.status !== 'concluida' && s.status !== 'cancelada')
  const items: AttnItem[] = []

  // vacinas atrasadas de quem tem visita hoje
  const allDoses = [...DOSES, ...extraDoses]
  for (const s of pendingStops) {
    for (const petId of s.visit.petIds) {
      const latest = new Map<string, (typeof allDoses)[number]>()
      for (const d of allDoses.filter((d) => d.petId === petId)) {
        const cur = latest.get(d.vaccineId)
        if (!cur || new Date(d.date) > new Date(cur.date)) latest.set(d.vaccineId, d)
      }
      const late = [...latest.values()].filter((d) => daysFromToday(d.nextDate) < 0).sort((a, b) => +new Date(a.nextDate) - +new Date(b.nextDate))
      if (!late.length) continue
      const pet = PET[petId]
      const days = -daysFromToday(late[0].nextDate)
      const names = late.map((d) => VACCINE[d.vaccineId].short)
      const reason = s.visit.reason.toLowerCase()
      const covered = /atrasad|dose|raiva|vacina/.test(reason) || late.some((d) => reason.includes(VACCINE[d.vaccineId].short.toLowerCase()))
      const vet = VET[s.visit.vetId]
      const id = `vac-${petId}`
      const markKit = () => {
        const checked = useDemo.getState().kitChecked
        for (const d of late) {
          const k = `${s.visit.vetId}:vac-${d.vaccineId}`
          if (!checked[k]) toggleKit(k)
        }
      }
      items.push({
        id,
        tone: days > 20 ? 'red' : 'yellow',
        kind: names.length > 1 ? 'Vacinas atrasadas' : 'Vacina atrasada',
        icon: Syringe,
        pet,
        title: (
          <>
            {pet.name}: {names.join(' e ')} há {days} dias
          </>
        ),
        sub: (
          <>
            Visita às {hhmm(s.startMin)} com {vet.short}
            {!covered && '. Fora do motivo da visita.'}
          </>
        ),
        action: covered
          ? {
              label: 'Separar doses',
              done: 'No kit',
              run: () => {
                resolve(id)
                markKit()
                toast.success(`Doses de ${names.join(' e ')} separadas`, { description: `Marcadas no kit do dia da ${vet.short}.` })
              },
            }
          : {
              label: 'Incluir na visita',
              done: 'Incluída',
              run: () => {
                resolve(id)
                markKit()
                toast.success(`${names.join(' e ')} incluída na visita de ${pet.name}`, { description: `${vet.short} recebeu o aviso no app. O tutor será informado do valor.` })
              },
            },
      })
    }
  }

  // alertas clínicos
  for (const s of pendingStops) {
    for (const petId of s.visit.petIds) {
      const pet = PET[petId]
      if (!pet.alerts?.length) continue
      items.push({
        id: `clin-${petId}`,
        tone: 'blue',
        kind: 'Alerta clínico',
        icon: HeartPulse,
        pet,
        title: (
          <>
            {pet.name}: {pet.alerts[0].split(':')[0]}
          </>
        ),
        sub: CLINICAL_HINT[petId] ?? pet.temperament ?? pet.alerts[0],
        action: { label: 'Abrir ficha', done: '', nav: true, run: () => nav(`/pacientes/${petId}`) },
      })
    }
  }

  // lembretes sem resposta
  for (const r of reminders.filter((r) => r.status === 'sem-resposta' || (r.status === 'lido' && daysFromToday(r.dueDate) < 0))) {
    const pet = PET[r.petId]
    const t = TUTOR[pet.tutorId]
    const id = `rem-${r.id}`
    items.push({
      id,
      tone: 'yellow',
      kind: r.status === 'lido' ? 'Lido, sem resposta' : 'Sem resposta',
      icon: MessageCircle,
      pet,
      title: (
        <>
          {pet.name}: {r.title}
        </>
      ),
      sub: (
        <>
          {r.status === 'lido' ? 'Lido' : `Enviado há ${Math.max(1, -daysFromToday(r.sendDate))} dias`} para {t.name}
        </>
      ),
      action: {
        label: 'Reenviar',
        done: 'Reenviado',
        run: () => {
          resolve(id)
          setReminderStatus(r.id, 'enviado')
          toast.success(`Lembrete reenviado para ${t.name}`, { description: 'A resposta aparece em Lembretes.' })
        },
      },
    })
  }

  const open = items.filter((i) => !resolved[i.id]).length
  const [all, setAll] = React.useState(false)
  const shown = all ? items : items.slice(0, 8)

  return (
    <Card id="atencao" className="mt-4 scroll-mt-4 p-2">
      <SectionHead
        title="Precisa de atenção"
        sub={open ? 'Resolva antes das próximas visitas' : 'Tudo resolvido por hoje'}
        action={open ? <Badge tone="dark">{open} abertos</Badge> : <Badge tone="ok">Em dia</Badge>}
      />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shown.map((it, i) => {
          const done = resolved[it.id]
          const t = done ? { bg: 'bg-green-soft', fg: 'text-green' } : ATTN_TONE[it.tone]
          return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03, ease: EASE }}
              className={cn('flex flex-col rounded-[20px] p-4 transition-colors duration-300 sm:min-h-[164px]', t.bg)}
            >
              <div className="flex items-center gap-2">
                <IconCircle size={30} tone="white" className="shadow-none">
                  {done ? <CheckCheck className={cn('size-3.5', t.fg)} strokeWidth={2.2} /> : <it.icon className={cn('size-3.5', t.fg)} strokeWidth={2.2} />}
                </IconCircle>
                <span className={cn('text-[13px] font-bold', t.fg)}>{done ? it.action.done : it.kind}</span>
                {it.pet && <PetAvatar pet={it.pet} size={30} className={cn('ml-auto', done && 'opacity-50')} />}
              </div>
              <div className={cn('mt-3 text-[14px] leading-snug font-semibold text-ink', done && 'text-ink-3 line-through decoration-ink-4')}>{it.title}</div>
              <div className="mt-1 text-[12.5px] leading-snug font-medium text-ink-2">{it.sub}</div>
              {!done && (
                <button onClick={it.action.run} className={cn('group mt-auto inline-flex items-center gap-1 self-start pt-3 text-[13px] font-bold', t.fg)}>
                  {it.action.label}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
      {items.length > 8 && (
        <div className="flex justify-center pt-3 pb-1">
          <Button variant="subtle" size="sm" onClick={() => setAll((x) => !x)}>
            {all ? 'Mostrar menos' : `Ver mais ${items.length - 8}`}
          </Button>
        </div>
      )}
    </Card>
  )
}
