import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Car,
  Check,
  CheckCheck,
  CircleCheck,
  ClipboardCheck,
  Clock,
  HeartPulse,
  Lock,
  MapPin,
  MessageCircle,
  Paperclip,
  Route as RouteIcon,
  Send,
  Syringe,
  Timer,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, Button, Card, IconButton, IconCircle, NumberTicker, Panel, PetAvatar, Segmented, SegmentBar, Tip, VetAvatar, ViewAll } from '@/components/ui'
import { CityMap, MapStatusLegend, type MapVisit } from '@/components/map/CityMap'
import { buildDayRoute, hhmm, nextInfo, NOW_MIN, type DayRoute, type DayStop } from '@/components/map/dayRoute'
import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import { CURRENT_USER, DOSES, KPIS, NOW, PET, ROUTE_LARISSA, TUTOR, VACCINE, VET, VETS, visitsToday, type Pet, type Visit } from '@/data/mock'
import { daysFromToday, fmt, TODAY } from '@/data/time'
import { cn, firstName } from '@/lib/utils'
import { VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'

const EASE = [0.16, 1, 0.3, 1] as const

const petNames = (v: Visit) => {
  const names = v.petIds.map((id) => PET[id]?.name ?? id)
  return names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0]
}
const bairroOf = (v: Visit) => BAIRRO[TUTOR[v.tutorId].bairro]
const zonesOf = (r: DayRoute): ZoneId[] => [...new Set(r.stops.map((s) => bairroOf(s.visit).zone))]
const kmFmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const durFmt = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min} min`)
const zonesTxt = (zs: ZoneId[]) => zs.map((z) => ZONE[z].short).join(' e ')

function greeting() {
  const h = NOW.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

const scrollTop = () => document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })

/* ───────────────────────── página ───────────────────────── */

export default function Hoje() {
  const nav = useNavigate()
  const visitStatus = useDemo((s) => s.visitStatus)
  const optimized = useDemo((s) => s.routeOptimized)
  const setOptimized = useDemo((s) => s.setRouteOptimized)

  const [vetId, setVetId] = React.useState('larissa')
  const [sel, setSel] = React.useState<string | null>(null)

  const statusOf = React.useCallback((v: Visit) => visitStatus[v.id] ?? v.status, [visitStatus])
  const routes = React.useMemo(() => Object.fromEntries(VETS.map((v) => [v.id, buildDayRoute(v.id, optimized, statusOf)])) as Record<string, DayRoute>, [optimized, statusOf])
  const naiveLarissa = React.useMemo(() => buildDayRoute(ROUTE_LARISSA.vetId, false, statusOf), [statusOf])

  const today = visitsToday()
  const allZones = new Set(VETS.flatMap((v) => zonesOf(routes[v.id])))

  const pickVet = (id: string, visitId?: string | null) => {
    setVetId(id)
    setSel(visitId ?? null)
  }
  const optimize = () => {
    pickVet(ROUTE_LARISSA.vetId)
    setOptimized(true)
    toast.success('Rota otimizada por bairro', {
      description: `De ${kmFmt(ROUTE_LARISSA.kmNaive)} para ${kmFmt(ROUTE_LARISSA.kmOptimized)} km. Os horários marcados pelos tutores continuam iguais.`,
    })
  }
  const undo = () => {
    setOptimized(false)
    toast('Rota voltou para a ordem em que os pedidos chegaram')
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      {/* saudação */}
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">
            {greeting()}, {firstName(CURRENT_USER.name)}
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-ink-3">
            {today.length} visitas hoje em {allZones.size} zonas
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[13.5px] font-semibold text-ink-2">{fmt.long(TODAY).replace(/^./, (c) => c.toUpperCase())}</span>
          <IconButton aria-label="Abrir agenda" onClick={() => nav('/agenda')}>
            <CalendarDays className="size-[18px]" strokeWidth={1.9} />
          </IconButton>
        </div>
      </div>

      <Metrics routes={routes} optimized={optimized} />

      {/* mapa + paradas */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:h-[640px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <MapCard
          routes={routes}
          vetId={vetId}
          onVet={(id) => pickVet(id)}
          optimized={optimized}
          naive={naiveLarissa}
          sel={sel}
          onSel={setSel}
          onOptimize={optimize}
          onUndo={undo}
        />
        <StopsPanel route={routes[vetId]} naive={naiveLarissa} optimized={optimized} selected={sel} onSelect={setSel} onOptimize={optimize} onUndo={undo} onAll={() => nav('/agenda')} />
      </div>

      {/* próximas, equipe, assistente */}
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.15fr_1fr]">
        <NextVisits
          routes={routes}
          onPick={(v, id) => {
            pickVet(v, id)
            scrollTop()
          }}
          onAll={() => nav('/agenda')}
        />
        <Team
          routes={routes}
          activeVet={vetId}
          onPick={(id) => {
            pickVet(id)
            scrollTop()
          }}
          onAll={() => nav('/campo')}
        />
        <Assistant className="md:col-span-2 xl:col-span-1" />
      </div>

      <Attention routes={routes} />
    </div>
  )
}

/* ───────────────────────── métricas (ref. logip) ───────────────────────── */

function Trend({ dir, tone, children }: { dir?: 'up' | 'down'; tone: 'green' | 'red' | 'coral' | 'blue'; children: React.ReactNode }) {
  const c = { green: 'text-green', red: 'text-red', coral: 'text-coral', blue: 'text-blue' }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap', c)}>
      {dir && (
        <svg width="8" height="7" viewBox="0 0 8 7" aria-hidden className={dir === 'down' ? 'rotate-180' : ''}>
          <path d="M4 0.5L7.5 6.5H0.5Z" fill="currentColor" />
        </svg>
      )}
      {children}
    </span>
  )
}

function Metrics({ routes, optimized }: { routes: Record<string, DayRoute>; optimized: boolean }) {
  const reminders = useDemo((s) => s.reminders)
  const stops = VETS.flatMap((v) => routes[v.id].stops)
  const done = stops.filter((s) => s.status === 'concluida').length
  const km = VETS.reduce((a, v) => a + routes[v.id].km, 0)
  const saving = ROUTE_LARISSA.kmNaive - ROUTE_LARISSA.kmOptimized
  const due = reminders.filter((r) => r.status === 'programado' && daysFromToday(r.sendDate) <= 7).length
  const noReply = reminders.filter((r) => r.status === 'sem-resposta').length
  const monthUp = Math.round((KPIS.visitsMonth / KPIS.visitsMonthPrev - 1) * 100)

  const items: { icon: LucideIcon; label: string; value: React.ReactNode; trend: React.ReactNode }[] = [
    {
      icon: CircleCheck,
      label: 'Concluídas',
      value: (
        <>
          {done}
          <span className="text-[15px] font-semibold text-ink-3"> de {stops.length}</span>
        </>
      ),
      trend: <Trend tone="green">{Math.round((done / stops.length) * 100)}% do dia</Trend>,
    },
    {
      icon: CalendarDays,
      label: 'Visitas no mês',
      value: KPIS.visitsMonth,
      trend: (
        <Trend dir="up" tone="green">
          +{monthUp}%
        </Trend>
      ),
    },
    {
      icon: Car,
      label: 'Km previstos',
      value: (
        <>
          <NumberTicker value={km} decimals={1} />
          <span className="text-[15px] font-semibold text-ink-3"> km</span>
        </>
      ),
      trend: optimized ? (
        <Trend dir="down" tone="green">
          {kmFmt(saving)} km
        </Trend>
      ) : (
        <Trend tone="coral">{kmFmt(saving)} km a poupar</Trend>
      ),
    },
    {
      icon: BellRing,
      label: 'Lembretes a enviar',
      value: due,
      trend: noReply ? <Trend tone="red">{noReply} sem resposta</Trend> : <Trend tone="green">Em dia</Trend>,
    },
  ]

  return (
    <Card className="grid grid-cols-2 px-1 py-1 lg:grid-cols-4 lg:py-2">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={cn('flex min-w-0 items-center gap-3 px-3 py-3.5 sm:px-5', i % 2 === 1 && 'border-l border-line', i >= 2 && 'border-t border-line lg:border-t-0', i === 2 && 'lg:border-l')}
        >
          <IconCircle size={44} className="max-sm:hidden">
            <it.icon className="size-[19px]" strokeWidth={1.9} />
          </IconCircle>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-ink-2">{it.label}</div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="num text-[22px] leading-tight font-bold tracking-[-0.02em] text-ink">{it.value}</span>
              {it.trend}
            </div>
          </div>
        </div>
      ))}
    </Card>
  )
}

/* ───────────────────────── mapa ───────────────────────── */

function MapCard({
  routes,
  vetId,
  onVet,
  optimized,
  naive,
  sel,
  onSel,
  onOptimize,
  onUndo,
}: {
  routes: Record<string, DayRoute>
  vetId: string
  onVet: (id: string) => void
  optimized: boolean
  naive: DayRoute
  sel: string | null
  onSel: (id: string | null) => void
  onOptimize: () => void
  onUndo: () => void
}) {
  const route = routes[vetId]
  const info = nextInfo(route)
  const vet = VET[vetId]
  const bad = route.optimizable && !optimized

  return (
    <Card className="flex min-h-0 min-w-0 flex-col p-2">
      <div className="flex flex-col gap-2 px-1 pt-1 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Veterinário">
          {VETS.map((v) => {
            const r = routes[v.id]
            const done = r.stops.filter((s) => s.status === 'concluida').length
            const active = v.id === vetId
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
                <VetAvatar vetId={v.id} size={32} className={cn(active && 'ring-2 ring-white/20')} />
                {v.short}
                <span className={cn('num text-[12px] font-semibold', active ? 'text-lime' : 'text-ink-3')}>
                  {done}/{r.stops.length}
                </span>
              </button>
            )
          })}
        </div>
        {route.optimizable ? (
          <Segmented
            className="shrink-0 self-start sm:self-auto"
            value={optimized ? 'opt' : 'naive'}
            onChange={(v) => (v === 'opt' ? onOptimize() : onUndo())}
            options={[
              { value: 'naive', label: 'Como foi marcada' },
              { value: 'opt', label: 'Otimizada' },
            ]}
          />
        ) : (
          <span className="inline-flex h-10 shrink-0 items-center gap-1.5 self-start rounded-full bg-green-soft px-3.5 text-[12.5px] font-semibold text-green sm:self-auto">
            <Check className="size-3.5" strokeWidth={2.4} /> Já agrupada por bairro
          </span>
        )}
      </div>

      <div className="relative aspect-square overflow-hidden rounded-[20px] bg-surface sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
        <CityMap
          visits={route.stops.map<MapVisit>((s, i) => ({
            id: s.visit.id,
            petId: s.visit.petIds[0],
            extraPets: s.visit.petIds.length - 1,
            bairro: TUTOR[s.visit.tutorId].bairro,
            seed: s.visit.tutorId,
            status: s.status,
            order: i + 1,
            caption: `${hhmm(s.startMin)}, ${bairroOf(s.visit).name}`,
          }))}
          focus="visits"
          routeOrder={route.order}
          compareOrder={route.optimizable && optimized ? naive.order : undefined}
          routeVariant={bad ? 'naive' : 'optimized'}
          routeKey={vetId}
          highlightZones={zonesOf(route)}
          selectedVisitId={sel}
          onSelectVisit={onSel}
          vetNow={info.mode !== 'encerrado' ? { at: info.at, color: vet.color, initials: vet.initials, title: `${vet.short} agora, ${hhmm(NOW_MIN)}` } : null}
          ariaLabel={`Rota de hoje da ${vet.name}`}
        />

        {/* resumo da rota */}
        <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2.5 rounded-[18px] bg-card/95 py-2 pr-4 pl-2 shadow-pill backdrop-blur-sm">
          <IconCircle size={34} tone={bad ? 'coral' : 'black'}>
            <RouteIcon className={cn('size-4', !bad && 'text-lime')} strokeWidth={2} />
          </IconCircle>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-ink">
              <NumberTicker value={route.km} decimals={1} /> km
            </div>
            <div className="text-[12px] font-medium text-ink-3">
              {route.stops.length} paradas, <NumberTicker value={route.travelMin} /> min no trânsito
            </div>
          </div>
        </div>

        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex h-8 items-center gap-2 rounded-full bg-black sm:top-3 sm:bottom-auto pr-3.5 pl-3 text-[12.5px] font-semibold text-white shadow-pill">
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

/* ───────────────────────── paradas de hoje ───────────────────────── */

function StopsPanel({
  route,
  naive,
  optimized,
  selected,
  onSelect,
  onOptimize,
  onUndo,
  onAll,
}: {
  route: DayRoute
  naive: DayRoute
  optimized: boolean
  selected: string | null
  onSelect: (id: string | null) => void
  onOptimize: () => void
  onUndo: () => void
  onAll: () => void
}) {
  const vet = VET[route.vetId]
  const listRef = React.useRef<HTMLOListElement>(null)
  const naiveTime = Object.fromEntries(naive.stops.map((s) => [s.visit.id, s.startMin]))
  const fixed = route.stops.filter((s) => s.visit.fixedTime)

  React.useEffect(() => {
    if (!selected) return
    const box = listRef.current
    const el = box?.querySelector<HTMLElement>(`[data-stop="${selected}"]`)
    if (el && box && box.scrollHeight > box.clientHeight + 4) {
      const top = el.offsetTop - box.offsetTop
      if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - 40, behavior: 'smooth' })
    }
  }, [selected])

  // onde entra a linha "agora"
  const liveIdx = route.stops.findIndex((s) => s.status === 'em-atendimento' || s.status === 'a-caminho')
  const nowIdx = liveIdx >= 0 ? (route.stops[liveIdx].status === 'a-caminho' ? liveIdx : liveIdx + 1) : route.stops.findIndex((s) => s.startMin > NOW_MIN)
  type Item = { kind: 'stop'; s: DayStop; i: number } | { kind: 'now' }
  const items: Item[] = []
  route.stops.forEach((s, i) => {
    if (i === nowIdx) items.push({ kind: 'now' })
    items.push({ kind: 'stop', s, i })
  })
  if (nowIdx === -1 || nowIdx >= route.stops.length) items.push({ kind: 'now' })

  return (
    <Panel className="flex min-h-0 flex-col bg-muted">
      <div className="flex items-center justify-between gap-3 px-3 pt-3 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Paradas de hoje</h2>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-ink-3">
            {vet.short}, {route.stops.length} paradas
          </p>
        </div>
        <ViewAll onClick={onAll} />
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {route.optimizable && !optimized && (
          <motion.div key="nudge" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mb-2 rounded-[20px] bg-lime p-4">
            <div className="flex items-start gap-3">
              <IconCircle size={36} tone="black">
                <RouteIcon className="size-4 text-lime" strokeWidth={2} />
              </IconCircle>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-ink">Ordem de chegada no WhatsApp</div>
                <div className="mt-0.5 text-[13px] font-medium text-lime-ink">
                  Agrupar por bairro poupa <b className="num font-bold">{kmFmt(ROUTE_LARISSA.kmNaive - ROUTE_LARISSA.kmOptimized)} km</b> hoje.
                </div>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={onOptimize} className="mt-3 w-full">
              Otimizar rota <ArrowRight className="size-3.5" />
            </Button>
          </motion.div>
        )}
        {route.optimizable && optimized && (
          <motion.div key="opt" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mb-2 rounded-[20px] bg-black p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-white/60">Rota otimizada</span>
              <button onClick={onUndo} className="inline-flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold text-white/80 hover:bg-white/15 hover:text-white">
                <Undo2 className="size-3" /> Desfazer
              </button>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-[28px] leading-none font-bold tracking-[-0.02em]">{kmFmt(ROUTE_LARISSA.kmOptimized)} km</span>
              <span className="num text-[14px] font-semibold text-white/40 line-through">{kmFmt(ROUTE_LARISSA.kmNaive)}</span>
              <span className="ml-auto text-[12.5px] font-semibold text-lime">{ROUTE_LARISSA.minNaive - ROUTE_LARISSA.minOptimized} min a menos</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {fixed.map((s) => (
                <Tip key={s.visit.id} content="Horário marcado pelo tutor. Não mudou.">
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold">
                    <Lock className="size-3 text-white/50" strokeWidth={2.2} />
                    <span className="num">{hhmm(s.startMin)}</span> {PET[s.visit.petIds[0]].name}
                  </span>
                </Tip>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ol ref={listRef} className="scroll-thin relative flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <LayoutGroup>
          {items.map((it) =>
            it.kind === 'now' ? (
              <motion.li key="now" layout transition={{ duration: 0.5, ease: EASE }} className="relative flex h-8 items-center px-1" aria-label={`Agora, ${hhmm(NOW_MIN)}`}>
                <span className="absolute inset-x-3 top-1/2 border-t-[1.5px] border-dashed border-blue/70" />
                <span className="relative inline-flex h-6 items-center gap-1.5 rounded-full bg-blue px-2.5 text-[11.5px] font-bold text-white">
                  <span className="size-1.5 rounded-full bg-white" />
                  Agora <span className="num">{hhmm(NOW_MIN)}</span>
                </span>
              </motion.li>
            ) : (
              <StopCard
                key={it.s.visit.id}
                s={it.s}
                first={it.i === 0}
                selected={selected === it.s.visit.id}
                onSelect={() => onSelect(selected === it.s.visit.id ? null : it.s.visit.id)}
                before={route.optimizable && optimized && naiveTime[it.s.visit.id] !== it.s.startMin ? naiveTime[it.s.visit.id] : undefined}
              />
            ),
          )}
        </LayoutGroup>
      </ol>
    </Panel>
  )
}

function StopCard({ s, first, selected, onSelect, before }: { s: DayStop; first: boolean; selected: boolean; onSelect: () => void; before?: number }) {
  const v = s.visit
  const pet = PET[v.petIds[0]]
  const bairro = bairroOf(v)
  const st = VISIT_STATUS[s.status]
  const live = s.status === 'em-atendimento'
  const done = s.status === 'concluida'
  const elapsed = Math.max(0, Math.min(v.durationMin, NOW_MIN - s.startMin))

  return (
    <motion.li layout transition={{ layout: { duration: 0.55, ease: EASE } }} data-stop={v.id}>
      {/* deslocamento até a parada */}
      <div className="flex h-7 items-center gap-1.5 px-3 text-[11.5px] font-medium text-ink-3">
        <Car className="size-3.5 text-ink-4" strokeWidth={2} />
        {first && 'Saída da base, '}
        <span className="num">
          {kmFmt(s.leg.km)} km, {s.leg.min} min
        </span>
      </div>
      <button
        onClick={onSelect}
        className={cn(
          'grid w-full grid-cols-[44px_40px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-[20px] p-3 text-left transition-[box-shadow,transform,background] duration-150 active:scale-[.99]',
          live ? 'bg-black text-white' : 'bg-card shadow-card hover:shadow-lift',
          selected && (live ? 'ring-2 ring-lime' : 'ring-2 ring-black'),
        )}
      >
        <div className="leading-tight">
          <div className={cn('num text-[14px] font-bold', done ? 'text-ink-3' : live ? 'text-white' : 'text-ink')}>{hhmm(s.startMin)}</div>
          {v.fixedTime ? (
            <span className={cn('mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold', live ? 'text-white/50' : 'text-ink-3')}>
              <Lock className="size-2.5" strokeWidth={2.4} /> fixo
            </span>
          ) : before != null ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num mt-0.5 text-[11px] font-semibold text-ink-4 line-through">
              {hhmm(before)}
            </motion.div>
          ) : (
            <div className={cn('num mt-0.5 text-[11px] font-semibold', live ? 'text-white/50' : 'text-ink-4')}>{v.durationMin} min</div>
          )}
        </div>
        <PetAvatar pet={pet} size={40} className={cn(done && 'opacity-60', live && 'ring-2 ring-lime')} />
        <div className={cn('min-w-0', done && 'opacity-70')}>
          <div className="truncate text-[14px] font-bold">{petNames(v)}</div>
          <div className={cn('truncate text-[12.5px] font-medium', live ? 'text-white/60' : 'text-ink-3')}>
            {v.type}, {bairro.name}
          </div>
        </div>
        <div className="flex justify-end">
          {s.status === 'agendada' ? (
            <ArrowUpRight className="size-4 text-ink-4" strokeWidth={2} />
          ) : (
            <Badge tone={st.tone} dot={live}>
              {done ? <Check className="-mx-0.5 size-3" strokeWidth={3} /> : null}
              {done ? 'Feita' : st.label}
            </Badge>
          )}
        </div>
        {live && (
          <div className="col-span-4 mt-3 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
              <motion.span className="block h-full rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${(elapsed / v.durationMin) * 100}%` }} transition={{ duration: 1, ease: EASE }} />
            </span>
            <span className="num shrink-0 text-[11.5px] font-semibold text-white/60">
              {elapsed} de {v.durationMin} min
            </span>
          </div>
        )}
      </button>
    </motion.li>
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

function NextVisits({ routes, onPick, onAll }: { routes: Record<string, DayRoute>; onPick: (vetId: string, visitId: string) => void; onAll: () => void }) {
  const upcoming = VETS.flatMap((v) => routes[v.id].stops)
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
      </div>
    </Panel>
  )
}

/* ───────────────────────── equipe em campo (ref. Onboarding) ───────────────────────── */

function Team({ routes, activeVet, onPick, onAll }: { routes: Record<string, DayRoute>; activeVet: string; onPick: (vetId: string) => void; onAll: () => void }) {
  const stops = VETS.flatMap((v) => routes[v.id].stops)
  const count = (st: string) => stops.filter((s) => s.status === st).length
  const parts = [
    { key: 'concluida', label: 'Feitas', color: 'var(--color-green)' },
    { key: 'em-atendimento', label: 'Atendendo', color: 'var(--color-lime-2)' },
    { key: 'a-caminho', label: 'A caminho', color: 'var(--color-blue)' },
    { key: 'agendada', label: 'Agendadas', color: 'var(--color-line-2)' },
  ]

  return (
    <Panel className="flex flex-col bg-muted">
      <SectionHead title="Equipe em campo" action={<ViewAll onClick={onAll}>App do vet</ViewAll>} />
      <div className="grid flex-1 grid-cols-3 gap-2">
        {VETS.map((v) => {
          const r = routes[v.id]
          const info = nextInfo(r)
          const done = r.stops.filter((s) => s.status === 'concluida').length
          const active = v.id === activeVet
          const state = info.mode === 'atendimento' ? 'bg-lime-2' : info.mode === 'deslocamento' ? 'bg-blue' : 'bg-ink-4'
          const stateTxt =
            info.mode === 'atendimento' && info.current
              ? `Com ${PET[info.current.visit.petIds[0]].name}`
              : info.mode === 'deslocamento' && info.next
                ? `Indo até ${PET[info.next.visit.petIds[0]].name}`
                : info.mode === 'encerrado'
                  ? 'Dia encerrado'
                  : 'Livre'
          return (
            <button
              key={v.id}
              onClick={() => onPick(v.id)}
              className={cn(
                'flex min-w-0 flex-col items-center justify-center rounded-[20px] bg-card px-2 pt-4 pb-3 text-center shadow-card transition-[box-shadow,transform] duration-150 hover:shadow-lift active:scale-[.98]',
                active && 'ring-2 ring-black',
              )}
            >
              <span className="relative">
                <VetAvatar vetId={v.id} size={52} />
                <span className={cn('absolute right-0 bottom-0 size-3.5 rounded-full ring-[3px] ring-card', state)} />
              </span>
              <span className="mt-2.5 w-full truncate text-[13.5px] font-bold text-ink">{v.short}</span>
              <span className="w-full truncate text-[12px] font-medium text-ink-3">{zonesTxt(zonesOf(r))}</span>
              <span className="mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[11.5px] font-semibold text-ink-2">
                <ClipboardCheck className="size-3.5 text-ink-3" strokeWidth={2} />
                <span className="num">
                  {done}/{r.stops.length}
                </span>
                <span className="max-[420px]:hidden">visitas</span>
              </span>
              <span className="mt-2 w-full truncate text-[11.5px] font-semibold text-ink-2">{stateTxt}</span>
            </button>
          )
        })}
      </div>
      <div className="mt-2 rounded-[20px] bg-card p-4 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="text-[13.5px] font-bold text-ink">Andamento do dia</span>
          <span className="num text-[12.5px] font-semibold text-ink-3">
            {count('concluida')} de {stops.length}
          </span>
        </div>
        <SegmentBar className="mt-3" parts={parts.map((p) => ({ value: count(p.key), color: p.color }))} />
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 sm:grid-cols-4">
          {parts.map((p) => (
            <span key={p.key} className="flex items-center gap-1.5 text-[12px] font-medium text-ink-2">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.label}
              <span className="num ml-auto font-bold text-ink sm:ml-0">{count(p.key)}</span>
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}

/* ───────────────────────── assistente ───────────────────────── */

function Assistant({ className }: { className?: string }) {
  const nav = useNavigate()
  const reminders = useDemo((s) => s.reminders)
  const setReminderStatus = useDemo((s) => s.setReminderStatus)
  const [msg, setMsg] = React.useState('')

  const sendReminders = () => {
    const due = reminders.filter((r) => r.status === 'programado' && daysFromToday(r.sendDate) <= 0)
    if (!due.length) {
      toast('Nenhum lembrete para enviar hoje')
      return
    }
    due.forEach((r) => setReminderStatus(r.id, 'enviado'))
    toast.success(`${due.length} ${due.length === 1 ? 'lembrete enviado' : 'lembretes enviados'} por WhatsApp`, { description: 'As respostas aparecem em Lembretes.' })
  }
  const lateVaccines = () => {
    document.getElementById('atencao')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const send = (e: React.FormEvent) => {
    e.preventDefault()
    if (!msg.trim()) return
    toast('Mensagem recebida', { description: 'No protótipo, use os atalhos acima.' })
    setMsg('')
  }

  const chips: { label: string; icon: LucideIcon; run: () => void }[] = [
    { label: 'Encaixar visita', icon: CalendarPlus, run: () => nav('/agenda?novo=1') },
    { label: 'Vacinas atrasadas', icon: Syringe, run: lateVaccines },
    { label: 'Enviar lembretes', icon: Send, run: sendReminders },
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

function Attention({ routes }: { routes: Record<string, DayRoute> }) {
  const nav = useNavigate()
  const extraDoses = useDemo((s) => s.extraDoses)
  const reminders = useDemo((s) => s.reminders)
  const setReminderStatus = useDemo((s) => s.setReminderStatus)
  const [resolved, setResolved] = React.useState<Record<string, boolean>>({})
  const resolve = (id: string) => setResolved((r) => ({ ...r, [id]: true }))

  const stops = VETS.flatMap((v) => routes[v.id].stops)
  const pendingStops = stops.filter((s) => s.status !== 'concluida' && s.status !== 'cancelada')
  const items: AttnItem[] = []

  // atrasos
  for (const v of VETS) {
    const info = nextInfo(routes[v.id])
    if (info.next && info.delayMin != null && info.delayMin > 10) {
      const t = TUTOR[info.next.visit.tutorId]
      const id = `late-${v.id}`
      items.push({
        id,
        tone: 'red',
        kind: 'Atraso',
        icon: Timer,
        pet: PET[info.next.visit.petIds[0]],
        title: (
          <>
            {v.short} chega {info.delayMin} min depois na visita de {petNames(info.next.visit)}
          </>
        ),
        sub: (
          <>
            Marcada para {hhmm(info.next.startMin)}, chegada prevista {hhmm(info.etaMin!)}
          </>
        ),
        action: {
          label: 'Avisar tutor',
          done: 'Tutor avisado',
          run: () => {
            resolve(id)
            toast.success(`Mensagem enviada para ${t.name}`, { description: `"${v.short} está a caminho e chega por volta de ${hhmm(info.etaMin!)}. Obrigado pela paciência!"` })
          },
        },
      })
    }
  }

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
                toast.success(`Doses de ${names.join(' e ')} separadas`, { description: `Vão no kit da ${vet.short} para a visita das ${hhmm(s.startMin)}.` })
              },
            }
          : {
              label: 'Incluir na visita',
              done: 'Incluída',
              run: () => {
                resolve(id)
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
              className={cn('flex flex-col rounded-[20px] p-4 sm:min-h-[164px] transition-colors duration-300', t.bg)}
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
