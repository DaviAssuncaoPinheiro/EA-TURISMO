import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { toast } from 'sonner'
import {
  ArrowRight,
  Bandage,
  Check,
  ClipboardCheck,
  Droplets,
  HeartPulse,
  Lock,
  MessageCircle,
  Plus,
  Repeat,
  Route as RouteIcon,
  Send,
  Stethoscope,
  Syringe,
  TestTube,
  TrendingDown,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import { Badge, Button, Card, CardHeader, NumberTicker, PageHeader, PetAvatar, Segmented, Tip, VetAvatar } from '@/components/ui'
import { CityMap, MapStatusLegend, type MapVisit } from '@/components/map/CityMap'
import { buildDayRoute, hhmm, nextInfo, NOW_MIN, type DayRoute, type DayStop } from '@/components/map/dayRoute'
import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import { CURRENT_USER, DOSES, NOW, PET, ROUTE_LARISSA, TUTOR, VACCINE, VET, VETS, visitsToday, type Pet, type Visit, type VisitType } from '@/data/mock'
import { daysFromToday, fmt, TODAY } from '@/data/time'
import { cn, firstName } from '@/lib/utils'
import { VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'

const EASE = [0.16, 1, 0.3, 1] as const

const TYPE_ICON: Record<VisitType, LucideIcon> = {
  Vacinação: Syringe,
  Consulta: Stethoscope,
  Retorno: Repeat,
  'Coleta de exames': TestTube,
  Curativo: Bandage,
  'Check-up': ClipboardCheck,
  Fluidoterapia: Droplets,
}

const petNames = (v: Visit) => {
  const names = v.petIds.map((id) => PET[id]?.name ?? id)
  return names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0]
}
const zonesOf = (r: DayRoute): ZoneId[] => [...new Set(r.stops.map((s) => BAIRRO[TUTOR[s.visit.tutorId].bairro].zone))]
const kmFmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const durFmt = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}` : `${min} min`)

function greeting() {
  const h = NOW.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

/* ───────────────────────── página ───────────────────────── */

export default function Hoje() {
  const nav = useNavigate()
  const visitStatus = useDemo((s) => s.visitStatus)
  const optimized = useDemo((s) => s.routeOptimized)
  const setOptimized = useDemo((s) => s.setRouteOptimized)
  const reminders = useDemo((s) => s.reminders)

  const [vetId, setVetId] = React.useState('larissa')
  const [sel, setSel] = React.useState<string | null>(null)

  const statusOf = React.useCallback((v: Visit) => visitStatus[v.id] ?? v.status, [visitStatus])
  const routes = React.useMemo(() => Object.fromEntries(VETS.map((v) => [v.id, buildDayRoute(v.id, optimized, statusOf)])) as Record<string, DayRoute>, [optimized, statusOf])
  const naiveLarissa = React.useMemo(() => buildDayRoute(ROUTE_LARISSA.vetId, false, statusOf), [statusOf])
  const optLarissa = React.useMemo(() => buildDayRoute(ROUTE_LARISSA.vetId, true, statusOf), [statusOf])

  const route = routes[vetId]
  const info = nextInfo(route)
  const vet = VET[vetId]

  const today = visitsToday()
  const live = routes.larissa.stops.find((s) => s.status === 'em-atendimento')
  const allZones = new Set(VETS.flatMap((v) => zonesOf(routes[v.id])))

  const optimize = () => {
    setVetId(ROUTE_LARISSA.vetId)
    setSel(null)
    setOptimized(true)
    toast.success('Rotas otimizadas por bairro', {
      description: `Dra. Larissa: ${kmFmt(ROUTE_LARISSA.kmNaive)} km → ${kmFmt(ROUTE_LARISSA.kmOptimized)} km. Os horários marcados pelos tutores não mudaram.`,
    })
  }
  const undo = () => {
    setOptimized(false)
    toast('Rota voltou para a ordem em que os pedidos chegaram')
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow={
          <span>
            {fmt.long(TODAY).replace(/^./, (c) => c.toUpperCase())} · agora {hhmm(NOW_MIN)}
          </span>
        }
        title={`${greeting()}, ${firstName(CURRENT_USER.name)}`}
        description={
          <>
            {today.length} visitas em {allZones.size} zonas de Manaus hoje.
            {live && (
              <>
                {' '}
                A {VET[live.visit.vetId].short} está com {PET[live.visit.petIds[0]].sex === 'F' ? 'a' : 'o'} {petNames(live.visit)} {BAIRRO[TUTOR[live.visit.tutorId].bairro].name.startsWith('Parque') ? 'no' : 'em'}{' '}
                {BAIRRO[TUTOR[live.visit.tutorId].bairro].name}.
              </>
            )}
          </>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => toast('Nova visita', { description: 'Escolha o tutor e o sistema sugere o dia em que a equipe já estará no bairro dele.' })}>
              <Plus className="size-4" strokeWidth={1.8} /> Nova visita
            </Button>
            {optimized ? (
              <Button variant="outline" onClick={undo} className="text-ok">
                <Check className="size-4" strokeWidth={2} /> Rotas otimizadas
              </Button>
            ) : (
              <Button variant="accent" onClick={optimize}>
                <RouteIcon className="size-4" strokeWidth={1.8} /> Otimizar rotas
              </Button>
            )}
          </>
        }
      />

      <KpiStrip routes={routes} optimized={optimized} onOptimize={optimize} reminders={reminders} onReminders={() => nav('/lembretes')} />

      {/* bloco principal */}
      <div className="mt-4 grid gap-4 lg:h-[660px] lg:grid-cols-[minmax(0,1fr)_392px]">
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <VetTabs routes={routes} vetId={vetId} onChange={(id) => { setVetId(id); setSel(null) }} />
          <div className="relative aspect-square border-t border-line sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
            <CityMap
              visits={route.stops.map<MapVisit>((s, i) => ({
                id: s.visit.id,
                petId: s.visit.petIds[0],
                extraPets: s.visit.petIds.length - 1,
                bairro: TUTOR[s.visit.tutorId].bairro,
                seed: s.visit.tutorId,
                status: s.status,
                order: i + 1,
                caption: `${hhmm(s.startMin)} · ${BAIRRO[TUTOR[s.visit.tutorId].bairro].name}`,
              }))}
              focus="visits"
              routeOrder={route.order}
              compareOrder={route.optimizable && optimized ? naiveLarissa.order : undefined}
              routeVariant={route.optimizable && !optimized ? 'naive' : 'optimized'}
              routeKey={vetId}
              highlightZones={zonesOf(route)}
              selectedVisitId={sel}
              onSelectVisit={setSel}
              vetNow={info.mode !== 'encerrado' ? { at: info.at, color: vet.color, initials: vet.initials, title: `${vet.short} agora, ${hhmm(NOW_MIN)}` } : null}
              ariaLabel={`Rota de hoje da ${vet.name}`}
            />
            {/* resumo da rota */}
            <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5">
              <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-line bg-card/95 px-3 py-2 shadow-card backdrop-blur-sm">
                <RouteIcon className={cn('size-4', route.optimizable && !optimized ? 'text-terra-600' : 'text-sage-700')} strokeWidth={1.8} />
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-ink">
                    <NumberTicker value={route.km} decimals={1} /> km
                    <span className="font-normal text-ink-3"> · {route.stops.length} paradas</span>
                  </div>
                  <div className="text-[11.5px] text-ink-3">
                    <NumberTicker value={route.travelMin} /> min no trânsito
                  </div>
                </div>
              </div>
            </div>
            {route.optimizable && (
              <div className="absolute top-3 right-3">
                <Segmented
                  className="bg-card/95 shadow-card ring-1 ring-line backdrop-blur-sm"
                  value={optimized ? 'opt' : 'naive'}
                  onChange={(v) => (v === 'opt' ? optimize() : undo())}
                  options={[
                    {
                      value: 'naive',
                      label: (
                        <>
                          <span className="sm:hidden">Marcada</span>
                          <span className="max-sm:hidden">Como foi marcada</span>
                        </>
                      ),
                    },
                    { value: 'opt', label: 'Otimizada' },
                  ]}
                />
              </div>
            )}
            <div className="absolute bottom-3 left-3 hidden rounded-md bg-card/92 px-2.5 py-1.5 shadow-card ring-1 ring-line backdrop-blur-sm md:block">
              <MapStatusLegend />
            </div>
          </div>
        </Card>

        <Timeline
          route={route}
          optimized={optimized}
          naive={naiveLarissa}
          opt={optLarissa}
          selected={sel}
          onSelect={setSel}
          onOptimize={optimize}
          onUndo={undo}
        />
      </div>

      <TeamPanel
        routes={routes}
        activeVet={vetId}
        onPick={(id, visitId) => {
          setVetId(id)
          setSel(visitId ?? null)
          document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      <Attention routes={routes} />
    </div>
  )
}

/* ───────────────────────── KPIs ───────────────────────── */

function KpiStrip({
  routes,
  optimized,
  onOptimize,
  reminders,
  onReminders,
}: {
  routes: Record<string, DayRoute>
  optimized: boolean
  onOptimize: () => void
  reminders: ReturnType<typeof useDemo.getState>['reminders']
  onReminders: () => void
}) {
  const stops = VETS.flatMap((v) => routes[v.id].stops).sort((a, b) => a.startMin - b.startMin)
  const done = stops.filter((s) => s.status === 'concluida')
  const count = (st: string) => stops.filter((s) => s.status === st).length
  const petsDone = new Set(done.flatMap((s) => s.visit.petIds)).size
  const petsToday = new Set(stops.flatMap((s) => s.visit.petIds)).size
  const km = VETS.reduce((a, v) => a + routes[v.id].km, 0)
  const saving = ROUTE_LARISSA.kmNaive - ROUTE_LARISSA.kmOptimized

  const due = reminders.filter((r) => r.status === 'programado' && daysFromToday(r.sendDate) <= 7)
  const dueToday = due.filter((r) => daysFromToday(r.sendDate) <= 0).length
  const noReply = reminders.filter((r) => r.status === 'sem-resposta').length

  const order = ['concluida', 'em-atendimento', 'a-caminho', 'agendada']
  const bar = [...stops].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
  const barColor: Record<string, string> = { concluida: 'bg-ok', 'em-atendimento': 'bg-terra-500', 'a-caminho': 'bg-info', agendada: 'bg-line-2', cancelada: 'bg-late' }

  return (
    <Card className="grid grid-cols-2 overflow-hidden lg:grid-cols-[1.55fr_1fr_1fr_1fr]">
      <div className="col-span-2 border-b border-line px-5 py-4 lg:col-span-1 lg:border-r lg:border-b-0">
        <div className="eyebrow">Visitas hoje</div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="num font-display text-[40px] leading-none font-medium text-ink">{done.length}</span>
          <span className="num font-display text-[22px] leading-none text-ink-3">/ {stops.length}</span>
          <span className="ml-1 text-[13px] text-ink-2">concluídas</span>
        </div>
        <div className="mt-3 flex h-2 gap-[3px]">
          {bar.map((s) => (
            <Tip key={s.visit.id} content={`${hhmm(s.startMin)} · ${petNames(s.visit)} · ${VISIT_STATUS[s.status].label}`}>
              <motion.span layout className={cn('h-full flex-1 rounded-[2px]', barColor[s.status])} transition={{ duration: 0.4, ease: EASE }} />
            </Tip>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-ink-3">
          <span><b className="num font-semibold text-terra-700">{count('em-atendimento')}</b> em atendimento</span>
          <span><b className="num font-semibold text-info">{count('a-caminho')}</b> a caminho</span>
          <span><b className="num font-semibold text-ink-2">{count('agendada')}</b> agendadas</span>
        </div>
      </div>

      <div className="border-r border-line px-5 py-4">
        <div className="eyebrow">Pacientes atendidos</div>
        <div className="num mt-1.5 font-display text-[34px] leading-none font-medium text-ink">{petsDone}</div>
        <div className="mt-2 text-[12.5px] text-ink-3">de {petsToday} com visita hoje</div>
      </div>

      <div className="px-5 py-4 lg:border-r lg:border-line">
        <div className="eyebrow">Km previstos</div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <NumberTicker value={km} decimals={1} className="font-display text-[34px] leading-none font-medium text-ink" />
          <span className="text-[13px] text-ink-3">km</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {optimized ? (
            <motion.div key="ok" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-ok">
              <TrendingDown className="size-3.5" strokeWidth={2} /> {kmFmt(saving)} km a menos hoje
            </motion.div>
          ) : (
            <motion.button key="cta" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onClick={onOptimize} className="group mt-2 inline-flex items-center gap-1 text-left text-[12.5px] font-medium text-terra-700 hover:text-terra-600">
              Otimizar poupa {kmFmt(saving)} km <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <button onClick={onReminders} className="group col-span-2 border-t border-line px-5 py-4 text-left transition-colors hover:bg-card-2 lg:col-span-1 lg:border-t-0">
        <div className="eyebrow flex items-center justify-between">
          Lembretes a enviar <ArrowRight className="size-3.5 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-2" />
        </div>
        <div className="num mt-1.5 font-display text-[34px] leading-none font-medium text-ink">{due.length}</div>
        <div className="mt-2 text-[12.5px] text-ink-3">
          {dueToday > 0 ? <><b className="font-semibold text-ink-2">{dueToday} hoje</b> · </> : null}
          {due.length - dueToday} nos próximos dias
          {noReply > 0 && <> · <span className="text-late">{noReply} sem resposta</span></>}
        </div>
      </button>
    </Card>
  )
}

/* ───────────────────────── seletor de veterinário ───────────────────────── */

function ZoneChip({ z, className }: { z: ZoneId; className?: string }) {
  return (
    <span className={cn('inline-flex h-5 items-center gap-1 rounded-full bg-paper-2 px-1.5 text-[11px] font-medium text-ink-2', className)}>
      <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
      {ZONE[z].short}
    </span>
  )
}

function VetTabs({ routes, vetId, onChange }: { routes: Record<string, DayRoute>; vetId: string; onChange: (id: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto bg-card-2 p-1.5" role="tablist" aria-label="Veterinário">
      {VETS.map((v) => {
        const r = routes[v.id]
        const done = r.stops.filter((s) => s.status === 'concluida').length
        const active = v.id === vetId
        return (
          <button
            key={v.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v.id)}
            className={cn(
              'relative flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors lg:flex-1',
              active ? 'text-ink' : 'text-ink-2 hover:bg-paper-2',
            )}
          >
            {active && <motion.span layoutId="vet-tab" className="absolute inset-0 rounded-lg bg-card shadow-card ring-1 ring-line" transition={{ duration: 0.35, ease: EASE }} />}
            <span className="relative">
              <VetAvatar vetId={v.id} size={30} />
            </span>
            <span className="relative min-w-0">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap">
                {v.short}
                <span className="num text-[11.5px] font-normal text-ink-3">
                  {done}/{r.stops.length}
                </span>
              </span>
              <span className="mt-0.5 flex gap-1">
                {zonesOf(r).map((z) => (
                  <ZoneChip key={z} z={z} className={active ? 'bg-paper-2' : 'bg-paper-2/70'} />
                ))}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ───────────────────────── linha do tempo ───────────────────────── */

function Timeline({
  route,
  optimized,
  naive,
  opt,
  selected,
  onSelect,
  onOptimize,
  onUndo,
}: {
  route: DayRoute
  optimized: boolean
  naive: DayRoute
  opt: DayRoute
  selected: string | null
  onSelect: (id: string | null) => void
  onOptimize: () => void
  onUndo: () => void
}) {
  const vet = VET[route.vetId]
  const listRef = React.useRef<HTMLOListElement>(null)
  const naiveTime = Object.fromEntries(naive.stops.map((s) => [s.visit.id, s.startMin]))
  const moved = opt.order.filter((id, i) => naive.order[i] !== id).length
  const fixed = opt.stops.filter((s) => s.visit.fixedTime)
  const totalCare = route.stops.reduce((a, s) => a + s.visit.durationMin, 0)

  React.useEffect(() => {
    if (!selected) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-stop="${selected}"]`)
    const box = listRef.current
    if (el && box && box.scrollHeight > box.clientHeight + 4) {
      const top = el.offsetTop - box.offsetTop
      if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTo({ top: top - 60, behavior: 'smooth' })
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
    <Card className="flex min-h-0 flex-col overflow-hidden">
      <CardHeader
        eyebrow="Paradas de hoje"
        title={vet.name}
        action={
          <div className="text-right text-[12px] leading-tight text-ink-3">
            <div className="num font-medium text-ink-2">{route.stops.length} paradas</div>
            <div className="num">{durFmt(totalCare)} em atendimento</div>
          </div>
        }
      />

      <AnimatePresence initial={false} mode="popLayout">
        {route.optimizable && optimized && (
          <motion.div key="opt" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mx-4 mb-3 rounded-lg bg-sage-900 p-3.5 text-paper">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-sage-200 uppercase">Rota otimizada por bairro</span>
              <button onClick={onUndo} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] text-sage-200 hover:bg-white/10 hover:text-paper">
                <Undo2 className="size-3" /> Desfazer
              </button>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2 font-display">
              <span className="num text-[17px] text-sage-300 line-through decoration-1">{kmFmt(ROUTE_LARISSA.kmNaive)} km</span>
              <ArrowRight className="size-4 self-center text-sage-300" />
              <span className="num text-[26px] leading-none font-medium">{kmFmt(ROUTE_LARISSA.kmOptimized)} km</span>
            </div>
            <div className="mt-1 text-[12.5px] text-sage-100">
              <b className="num font-semibold text-paper">{ROUTE_LARISSA.minNaive - ROUTE_LARISSA.minOptimized} min</b> a menos no trânsito · {moved} paradas reordenadas
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-2.5">
              {fixed.map((s) => (
                <span key={s.visit.id} className="inline-flex h-6 items-center gap-1 rounded-full bg-white/10 px-2 text-[11.5px]">
                  <Lock className="size-3 text-sage-300" strokeWidth={2} />
                  <span className="num font-mono">{hhmm(s.startMin)}</span> {PET[s.visit.petIds[0]].name}
                </span>
              ))}
              <span className="text-[11.5px] text-sage-300">horário marcado pelo tutor, mantido</span>
            </div>
          </motion.div>
        )}
        {route.optimizable && !optimized && (
          <motion.div key="nudge" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="mx-4 mb-3 flex items-start gap-3 rounded-lg border border-terra-200 bg-terra-50 p-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-terra-100 text-terra-700">
              <RouteIcon className="size-4" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">Ordem de chegada no WhatsApp</div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-ink-2">
                A tarde vai e volta entre Praça 14 e Flores. Agrupar por bairro poupa <b className="num font-semibold">{kmFmt(ROUTE_LARISSA.kmNaive - ROUTE_LARISSA.kmOptimized)} km</b> sem mexer nos horários dos tutores.
              </div>
            </div>
            <Button size="sm" variant="accent" onClick={onOptimize} className="shrink-0">
              Otimizar
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ol ref={listRef} className="scroll-thin relative min-h-0 flex-1 overflow-y-auto border-t border-line px-2 pt-2 pb-3 max-lg:max-h-none">
        <LayoutGroup>
          {items.map((it) =>
            it.kind === 'now' ? (
              <motion.li key="now" layout transition={{ duration: 0.5, ease: EASE }} className="relative flex items-center gap-2 py-1.5 pr-2 pl-[52px]" aria-label={`Agora, ${hhmm(NOW_MIN)}`}>
                <span className="absolute left-[56px] h-px w-[calc(100%-64px)] bg-terra-500/60" />
                <span className="relative inline-flex h-5 items-center gap-1 rounded-full bg-terra-600 px-2 font-mono text-[10.5px] font-medium tracking-[0.06em] text-white">
                  <span className="relative flex size-1.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-70" />
                    <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                  </span>
                  AGORA {hhmm(NOW_MIN)}
                </span>
              </motion.li>
            ) : (
              <StopRow
                key={it.s.visit.id}
                s={it.s}
                index={it.i}
                last={it.i === route.stops.length - 1}
                selected={selected === it.s.visit.id}
                onSelect={() => onSelect(selected === it.s.visit.id ? null : it.s.visit.id)}
                before={route.optimizable && optimized && naiveTime[it.s.visit.id] !== it.s.startMin ? naiveTime[it.s.visit.id] : undefined}
              />
            ),
          )}
        </LayoutGroup>
      </ol>
    </Card>
  )
}

function StopRow({ s, index, last, selected, onSelect, before }: { s: DayStop; index: number; last: boolean; selected: boolean; onSelect: () => void; before?: number }) {
  const v = s.visit
  const pet = PET[v.petIds[0]]
  const tutor = TUTOR[v.tutorId]
  const bairro = BAIRRO[tutor.bairro]
  const st = VISIT_STATUS[s.status]
  const live = s.status === 'em-atendimento'
  const done = s.status === 'concluida'
  const Icon = TYPE_ICON[v.type]
  const elapsed = Math.max(0, Math.min(v.durationMin, NOW_MIN - s.startMin))
  const dot: Record<string, string> = {
    concluida: 'bg-ok border-ok',
    'em-atendimento': 'bg-terra-500 border-terra-500',
    'a-caminho': 'bg-info border-info',
    agendada: 'bg-card border-ink-4',
    cancelada: 'bg-late border-late',
  }

  return (
    <motion.li layout transition={{ layout: { duration: 0.55, ease: EASE } }} data-stop={v.id} className="relative">
      {/* trecho de deslocamento */}
      <div className="relative flex h-6 items-center pl-[52px]">
        <span className={cn('absolute top-0 bottom-0 left-[63px] w-px', index === 0 ? 'bg-gradient-to-b from-transparent to-line-2' : 'bg-line-2')} />
        <span className="num ml-6 font-mono text-[10.5px] text-ink-4">
          {index === 0 ? 'saída da base · ' : ''}
          {kmFmt(s.leg.km)} km · {s.leg.min} min
        </span>
      </div>
      <button
        onClick={onSelect}
        className={cn(
          'group relative grid w-full grid-cols-[44px_24px_minmax(0,1fr)] items-start gap-x-1 rounded-lg py-2 pr-2.5 text-left transition-colors',
          live ? 'bg-terra-50 ring-1 ring-terra-200' : selected ? 'bg-paper-2 ring-1 ring-line-2' : 'hover:bg-card-2',
        )}
      >
        {/* hora */}
        <div className="pt-1 text-right">
          <div className={cn('num font-mono text-[12.5px] font-medium', done ? 'text-ink-3' : 'text-ink')}>{hhmm(s.startMin)}</div>
          {v.fixedTime ? (
            <Tip content="Horário marcado pelo tutor. A otimização não mexe nele.">
              <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-ink-3">
                <Lock className="size-2.5" strokeWidth={2.2} /> fixo
              </span>
            </Tip>
          ) : before != null ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="num mt-0.5 font-mono text-[10px] text-ink-4 line-through">
              {hhmm(before)}
            </motion.div>
          ) : null}
        </div>
        {/* trilho */}
        <div className="relative flex h-full justify-center">
          {!last && <span className="absolute top-3 -bottom-2 w-px bg-line-2" />}
          <span className={cn('relative mt-[7px] size-[11px] rounded-full border-2', dot[s.status])}>
            {live && <span className="absolute -inset-[3px] animate-ping rounded-full bg-terra-500/40" />}
          </span>
        </div>
        {/* conteúdo */}
        <div className={cn('min-w-0', done && 'opacity-75')}>
          <div className="flex items-start gap-2.5">
            <PetAvatar pet={pet} size={34} className="mt-px" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13.5px] font-semibold text-ink">{petNames(v)}</span>
                <span className="ml-auto shrink-0">
                  <Badge tone={st.tone} dot={live}>
                    {st.label}
                  </Badge>
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                <Icon className="size-3.5 shrink-0 text-ink-3" strokeWidth={1.8} />
                <span className="truncate">{v.type}</span>
                <span className="text-ink-4">·</span>
                <span className="num shrink-0 text-ink-3">{v.durationMin} min</span>
              </div>
              <div className="truncate text-[12px] text-ink-3">
                {tutor.name} · {bairro.name}
              </div>
            </div>
          </div>
          {live && (
            <div className="mt-2 flex items-center gap-2 pl-[44px]">
              <span className="h-1 flex-1 overflow-hidden rounded-full bg-terra-100">
                <motion.span className="block h-full rounded-full bg-terra-500" initial={{ width: 0 }} animate={{ width: `${(elapsed / v.durationMin) * 100}%` }} transition={{ duration: 1, ease: EASE }} />
              </span>
              <span className="num shrink-0 text-[11px] text-terra-700">
                {elapsed} de {v.durationMin} min
              </span>
            </div>
          )}
        </div>
      </button>
    </motion.li>
  )
}

/* ───────────────────────── equipe em campo ───────────────────────── */

function Track({ children }: { children: (w: number) => React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [w, setW] = React.useState(0)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return <div ref={ref} className="min-w-0">{children(w)}</div>
}

const AXIS_START = 7.5 * 60
const AXIS_END = 18 * 60
const pctOf = (m: number) => ((m - AXIS_START) / (AXIS_END - AXIS_START)) * 100

function TeamPanel({ routes, activeVet, onPick }: { routes: Record<string, DayRoute>; activeVet: string; onPick: (vetId: string, visitId?: string) => void }) {
  const ticks = [8, 10, 12, 14, 16, 18]
  const block: Record<string, string> = {
    concluida: 'bg-ok-bg text-ok ring-1 ring-inset ring-ok/30',
    'em-atendimento': 'bg-terra-500 text-white',
    'a-caminho': 'bg-info-bg text-info ring-1 ring-inset ring-info/40',
    agendada: 'bg-card text-ink-2 ring-1 ring-inset ring-line-2',
    cancelada: 'bg-late-bg text-late',
  }
  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader eyebrow="Equipe em campo" title="Como está o dia de cada veterinário" action={<MapStatusLegend className="hidden md:flex" />} />
      {/* eixo */}
      <div className="hidden border-y border-line bg-card-2 px-5 py-1.5 lg:grid lg:grid-cols-[230px_minmax(0,1fr)_250px] lg:gap-6">
        <span className="eyebrow">Veterinário</span>
        <div className="relative h-4">
          {ticks.map((h) => (
            <span key={h} className="num absolute -translate-x-1/2 font-mono text-[10.5px] text-ink-3" style={{ left: `${pctOf(h * 60)}%` }}>
              {h}h
            </span>
          ))}
        </div>
        <span className="eyebrow">Próxima parada</span>
      </div>
      <ul className="divide-y divide-line max-lg:border-t max-lg:border-line">
        {VETS.map((v) => {
          const r = routes[v.id]
          const info = nextInfo(r)
          const done = r.stops.filter((s) => s.status === 'concluida').length
          const late = info.delayMin != null && info.delayMin > 10
          const nextPet = info.next ? PET[info.next.visit.petIds[0]] : undefined
          return (
            <li key={v.id} className={cn('grid gap-3 px-5 py-3.5 transition-colors lg:grid-cols-[230px_minmax(0,1fr)_250px] lg:items-center lg:gap-6', activeVet === v.id && 'bg-card-2/70')}>
              <button onClick={() => onPick(v.id)} className="group flex items-center gap-3 text-left">
                <VetAvatar vetId={v.id} size={34} />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink group-hover:underline group-hover:decoration-line-2 group-hover:underline-offset-2">{v.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5">
                    {zonesOf(r).map((z) => (
                      <ZoneChip key={z} z={z} />
                    ))}
                    <span className="num text-[11.5px] text-ink-3">
                      {done}/{r.stops.length}
                    </span>
                  </span>
                </span>
              </button>

              {/* tracker */}
              <Track>
                {(trackW) => (
              <div className="relative h-9 rounded-md bg-paper-2/70">
                {ticks.map((h) => (
                  <span key={h} className="absolute top-0 bottom-0 w-px bg-line/70" style={{ left: `${pctOf(h * 60)}%` }} />
                ))}
                {r.stops.map((s) => {
                  const w = pctOf(s.startMin + s.visit.durationMin) - pctOf(s.startMin)
                  const name = PET[s.visit.petIds[0]].name
                  const bw = (w / 100) * trackW
                  const label = bw >= name.length * 7 + (s.visit.fixedTime ? 26 : 16) ? name : bw >= 16 ? name[0] : ''
                  const showLock = s.visit.fixedTime && bw >= 30
                  return (
                    <Tip key={s.visit.id} content={<><b>{hhmm(s.startMin)} · {petNames(s.visit)}</b><br />{s.visit.type} · {BAIRRO[TUTOR[s.visit.tutorId].bairro].name}<br />{VISIT_STATUS[s.status].label}{s.visit.fixedTime ? ' · horário do tutor' : ''}</>}>
                      <motion.button
                        layout
                        transition={{ duration: 0.5, ease: EASE }}
                        onClick={() => onPick(v.id, s.visit.id)}
                        className={cn('absolute top-1.5 bottom-1.5 flex items-center justify-center overflow-hidden rounded-[5px] px-1 text-[10.5px] font-medium whitespace-nowrap transition-[filter] hover:brightness-95', block[s.status])}
                        style={{ left: `${pctOf(s.startMin)}%`, width: `calc(${w}% - 2px)` }}
                      >
                        {showLock && <Lock className="mr-0.5 size-2.5 shrink-0 opacity-70" strokeWidth={2.2} />}
                        <span className="overflow-hidden">{label}</span>
                      </motion.button>
                    </Tip>
                  )
                })}
                <span className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-terra-600" style={{ left: `${pctOf(NOW_MIN)}%` }}>
                  <span className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-terra-600" />
                </span>
              </div>
                )}
              </Track>

              {/* próxima */}
              {info.next && nextPet ? (
                <button onClick={() => onPick(v.id, info.next!.visit.id)} className="group flex items-center gap-2.5 rounded-md text-left">
                  <PetAvatar pet={nextPet} size={30} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] text-ink">
                      <b className="font-semibold">{petNames(info.next.visit)}</b>
                      <span className="text-ink-3"> · {BAIRRO[TUTOR[info.next.visit.tutorId].bairro].name}</span>
                    </span>
                    <span className="mt-0.5 block text-[12px]">
                      <span className="num font-mono text-ink-2">
                        {info.next.status === 'a-caminho' ? 'chega' : 'ETA'} {hhmm(info.etaMin!)}
                      </span>
                      <span className="text-ink-4"> · </span>
                      {late ? <span className="font-medium text-late">{info.delayMin} min de atraso</span> : <span className="text-ok">no horário ({hhmm(info.next.startMin)})</span>}
                    </span>
                  </span>
                </button>
              ) : (
                <span className="text-[12.5px] text-ink-3">Dia encerrado</span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/* ───────────────────────── precisa de atenção ───────────────────────── */

const CLINICAL_HINT: Record<string, string> = {
  bob: 'Contenção sem estresse; auscultar antes de manipular.',
  pipoca: 'Contenção pelo peitoral, nunca pela coleira.',
  zeus: 'Protetor: o tutor segura. Levar focinheira.',
  fred: 'Atender na sombra; evitar esforço no calor.',
  frida: 'Não erguer pela coluna; evitar escadas.',
  nina: 'Arisca no manejo. Usar toalha.',
}

type AttnItem = {
  id: string
  group: 'vacina' | 'agenda' | 'clinico' | 'lembrete'
  pet?: Pet
  title: React.ReactNode
  sub: React.ReactNode
  tag?: { label: string; tone: 'late' | 'warn' | 'info' | 'neutral' }
  action: { label: string; icon: LucideIcon; done: string; run: () => void }
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
        group: 'agenda',
        pet: PET[info.next.visit.petIds[0]],
        title: <>{v.short} chega {info.delayMin} min atrasad{v.name.startsWith('Dra') ? 'a' : 'o'} à {petNames(info.next.visit)}</>,
        sub: <>Marcada para {hhmm(info.next.startMin)} · {BAIRRO[t.bairro].name} · ETA {hhmm(info.etaMin!)}</>,
        tag: { label: 'Atraso', tone: 'late' },
        action: {
          label: 'Avisar tutor',
          icon: MessageCircle,
          done: 'Tutor avisado',
          run: () => {
            resolve(id)
            toast.success(`Mensagem enviada para ${t.name}`, { description: `"O ${v.short} está a caminho e chega por volta de ${hhmm(info.etaMin!)}. Obrigado pela paciência!"` })
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
        group: 'vacina',
        pet,
        title: (
          <>
            {pet.name} · {names.join(' + ')} {names.length > 1 ? 'atrasadas' : 'atrasada'}
          </>
        ),
        sub: (
          <>
            Visita {hhmm(s.startMin)} com {vet.short}
            {!covered && <span className="text-warn"> · fora do motivo da visita</span>}
          </>
        ),
        tag: { label: `há ${days} dias`, tone: days > 20 ? 'late' : 'warn' },
        action: covered
          ? { label: 'Separar doses', icon: Syringe, done: 'No kit', run: () => { resolve(id); toast.success(`Doses de ${names.join(' e ')} separadas`, { description: `Vão no kit da ${vet.short} para a visita das ${hhmm(s.startMin)}.` }) } }
          : { label: 'Incluir na visita', icon: Plus, done: 'Incluída', run: () => { resolve(id); toast.success(`${names.join(' + ')} incluída na visita do ${pet.name}`, { description: `${vet.short} recebeu o aviso no app. O tutor será informado do valor.` }) } },
      })
    }
  }

  // alertas clínicos
  for (const s of pendingStops) {
    for (const petId of s.visit.petIds) {
      const pet = PET[petId]
      if (!pet.alerts?.length) continue
      const id = `clin-${petId}`
      items.push({
        id,
        group: 'clinico',
        pet,
        title: <>{pet.name} · {pet.alerts[0].replace(/ — .*/, '')}</>,
        sub: <>{s.status === 'em-atendimento' ? 'Em atendimento agora' : `Visita ${hhmm(s.startMin)}`} · {CLINICAL_HINT[petId] ?? pet.temperament ?? pet.alerts[0]}</>,
        action: { label: 'Abrir ficha', icon: ArrowRight, done: '', run: () => nav(`/pacientes/${petId}`) },
      })
    }
  }

  // lembretes sem resposta
  for (const r of reminders.filter((r) => r.status === 'sem-resposta' || (r.status === 'lido' && daysFromToday(r.dueDate) < 0))) {
    const pet = PET[r.petId]
    const t = TUTOR[pet.tutorId]
    const visitToday = stops.find((s) => s.visit.petIds.includes(pet.id))
    const id = `rem-${r.id}`
    items.push({
      id,
      group: 'lembrete',
      pet,
      title: <>{pet.name} · {r.title}</>,
      sub: (
        <>
          {r.status === 'lido' ? 'Lido, sem resposta' : `Enviado há ${Math.max(1, -daysFromToday(r.sendDate))} dias`} · {t.name}
          {visitToday && <span className="text-ink-2"> · tem visita hoje às {hhmm(visitToday.startMin)}</span>}
        </>
      ),
      tag: { label: r.status === 'lido' ? 'Lido' : 'Sem resposta', tone: r.status === 'lido' ? 'info' : 'late' },
      action: {
        label: 'Reenviar',
        icon: Send,
        done: 'Reenviado',
        run: () => {
          resolve(id)
          setReminderStatus(r.id, 'enviado')
          toast.success(`Lembrete reenviado para ${t.name}`, { description: 'WhatsApp · a resposta aparece na tela de Lembretes.' })
        },
      },
    })
  }

  const open = items.filter((i) => !resolved[i.id]).length
  const left = items.filter((i) => i.group === 'vacina')
  const right: [string, AttnItem[]][] = [
    ['Agenda', items.filter((i) => i.group === 'agenda')],
    ['Alertas clínicos', items.filter((i) => i.group === 'clinico')],
    ['Lembretes sem resposta', items.filter((i) => i.group === 'lembrete')],
  ]

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader
        eyebrow="Precisa de atenção"
        title={open ? `${open} ${open === 1 ? 'item' : 'itens'} para resolver antes das visitas` : 'Tudo resolvido por hoje'}
        action={open ? <Badge tone="terra">{open} abertos</Badge> : <Badge tone="ok">Em dia</Badge>}
      />
      <div className="grid grid-cols-1 border-t border-line lg:grid-cols-2 lg:divide-x lg:divide-line">
        <section className="min-w-0 px-5 pt-3 pb-4">
          <h4 className="eyebrow mb-1 flex items-center gap-1.5">
            <Syringe className="size-3" strokeWidth={2} /> Vacinas atrasadas · pacientes de hoje
          </h4>
          <AttnList items={left} resolved={resolved} />
        </section>
        <div className="min-w-0 max-lg:border-t max-lg:border-line">
          {right
            .filter(([, list]) => list.length)
            .map(([title, list], i) => (
              <section key={title} className={cn('px-5 pt-3 pb-4', i > 0 && 'border-t border-line')}>
                <h4 className="eyebrow mb-1 flex items-center gap-1.5">
                  {title === 'Alertas clínicos' ? <HeartPulse className="size-3" strokeWidth={2} /> : title === 'Agenda' ? <RouteIcon className="size-3" strokeWidth={2} /> : <MessageCircle className="size-3" strokeWidth={2} />}
                  {title}
                </h4>
                <AttnList items={list} resolved={resolved} />
              </section>
            ))}
        </div>
      </div>
    </Card>
  )
}

function AttnList({ items, resolved }: { items: AttnItem[]; resolved: Record<string, boolean> }) {
  return (
    <ul className="divide-y divide-line/80">
      {items.map((it) => {
        const done = resolved[it.id]
        const A = it.action.icon
        return (
          <li key={it.id} className="flex items-center gap-3 py-2.5">
            {it.pet && <PetAvatar pet={it.pet} size={32} className={cn(done && 'opacity-50 grayscale')} />}
            <div className={cn('min-w-0 flex-1 transition-opacity', done && 'opacity-55')}>
              <div className="flex items-center gap-2">
                <span className={cn('truncate text-[13px] font-medium text-ink', done && 'line-through decoration-ink-4')}>{it.title}</span>
                {it.tag && !done && (
                  <Badge tone={it.tag.tone} className="shrink-0">
                    {it.tag.label}
                  </Badge>
                )}
              </div>
              <div className="truncate text-[12px] text-ink-3">{it.sub}</div>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {done ? (
                <motion.span key="d" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex h-8 shrink-0 items-center gap-1 px-2 text-[12.5px] font-medium text-ok">
                  <Check className="size-3.5" strokeWidth={2.2} /> {it.action.done}
                </motion.span>
              ) : (
                <motion.span key="a" exit={{ opacity: 0 }} className="shrink-0">
                  <Button size="sm" variant={it.group === 'clinico' ? 'ghost' : 'outline'} onClick={it.action.run} className="max-sm:h-9 max-sm:px-2.5">
                    {it.group !== 'clinico' && <A className="size-3.5" strokeWidth={1.8} />}
                    <span className="max-sm:sr-only">{it.action.label}</span>
                    {it.group === 'clinico' && <A className="size-3.5" strokeWidth={1.8} />}
                  </Button>
                </motion.span>
              )}
            </AnimatePresence>
          </li>
        )
      })}
    </ul>
  )
}
