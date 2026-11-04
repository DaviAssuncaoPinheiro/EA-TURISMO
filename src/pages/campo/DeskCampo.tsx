// Atendimento no computador: cabeçalho do dia e rotas, dentro do AppShell.
import * as React from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Check, ChevronRight, Clock, HeartPulse, Lock, MapPin, Route as RouteIcon, Timer, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Card, IconCircle, PetAvatar, VetAvatar } from '@/components/ui'
import { CityMap, type MapVisit } from '@/components/map/CityMap'
import { TUTOR, VET, VETS, type Visit } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { fmt } from '@/data/time'
import { VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'
import { bairroOf, legOf, minutesSince, petOf, vetVisitsToday, zonesOfDay } from './data'
import { ConnectivityBanner, EASE_OUT, Toggle } from './kit'
import { useVetId } from './nav'
import { useRouteData } from './RouteScreen'
import { DeskVisit } from './DeskVisit'
import { DeskRecord } from './DeskRecord'
import { DeskDone } from './DeskDone'

export function DeskCampo() {
  return (
    <div className="px-4 pb-8 md:px-6">
      <DeskHeader />
      <ConnectivityBanner flush />
      <Routes>
        <Route index element={<DeskRoute />} />
        <Route path="visita/:id" element={<DeskVisit />} />
        <Route path="visita/:id/atendimento" element={<DeskRecord />} />
        <Route path="visita/:id/concluido" element={<DeskDone />} />
        <Route path="*" element={<DeskRoute />} />
      </Routes>
    </div>
  )
}

/* Cabeçalho: título, veterinário e zonas, seletor, sem sinal e progresso */

function DeskHeader() {
  const vetId = useVetId()
  const vet = VET[vetId]
  const nav = useNavigate()
  const status = useDemo((s) => s.visitStatus)
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  const visits = React.useMemo(() => vetVisitsToday(vetId), [vetId])
  const zones = React.useMemo(() => zonesOfDay(visits), [visits])
  const done = visits.filter((v) => status[v.id] === 'concluida').length

  return (
    <header className="pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="text-[30px] leading-[1.1] font-bold tracking-[-0.03em] text-ink xl:text-[32px]">Atendimento</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] font-medium text-ink-3">
            <span className="font-semibold text-ink-2">{vet.name}</span>
            {zones.map((z) => (
              <span key={z} className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: ZONE[z].hex }} />
                {ZONE[z].name}
              </span>
            ))}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className={cn('flex h-11 cursor-pointer items-center gap-2.5 rounded-full pr-1.5 pl-1.5 transition-colors', offline ? 'bg-black text-white' : 'bg-card text-ink shadow-pill')}>
            <span className={cn('flex size-8 items-center justify-center rounded-full', offline ? 'bg-white/10 text-lime' : 'bg-muted text-ink')}>
              <WifiOff className="size-4" strokeWidth={2} />
            </span>
            <span className="text-[13.5px] font-semibold">Sem sinal</span>
            <Toggle checked={offline} onChange={setOffline} label="Sem sinal" />
          </label>
          <div className="flex h-11 items-center gap-3 rounded-full bg-card pr-4 pl-4 shadow-pill">
            <span className="text-[13.5px] font-semibold text-ink-2">
              <span className="num font-bold text-ink">
                {done}/{visits.length}
              </span>{' '}
              concluídas
            </span>
            <span className="flex w-[110px] gap-1">
              {visits.map((v) => (
                <span key={v.id} className={cn('h-1.5 flex-1 rounded-full transition-colors', status[v.id] === 'concluida' ? 'bg-black' : status[v.id] === 'em-atendimento' ? 'bg-lime' : 'bg-muted-2')} />
              ))}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {VETS.map((v) => {
          const vs = vetVisitsToday(v.id)
          const d = vs.filter((x) => status[x.id] === 'concluida').length
          const on = v.id === vetId
          return (
            <button
              key={v.id}
              onClick={() => nav(`/campo?vet=${v.id}`)}
              aria-pressed={on}
              className={cn('flex h-11 items-center gap-2.5 rounded-full pr-4 pl-1 text-[13.5px] font-semibold transition-colors active:scale-[.97]', on ? 'bg-black text-white' : 'bg-card text-ink shadow-pill hover:bg-surface')}
            >
              <VetAvatar vetId={v.id} size={36} className={cn(on && 'ring-2 ring-lime')} />
              {v.short}
              <span className={cn('num text-[12px] font-semibold', on ? 'text-lime' : 'text-ink-3')}>
                {d}/{vs.length}
              </span>
            </button>
          )
        })}
      </div>
    </header>
  )
}

/* Rota do dia: paradas à esquerda, mapa e resumo à direita */

function DeskRoute() {
  const vetId = useVetId()
  const { go, status, startedAt, visits, done, km, featured, remaining, openRecord } = useRouteData(vetId)
  const [sel, setSel] = React.useState<string | null>(null)

  const mapVisits = visits.map<MapVisit>((v, i) => ({
    id: v.id,
    petId: v.petIds[0],
    extraPets: v.petIds.length - 1,
    bairro: TUTOR[v.tutorId].bairro,
    seed: v.tutorId,
    status: status[v.id],
    order: i + 1,
    caption: `${fmt.time(v.start)}, ${bairroOf(v).name}`,
  }))

  const metrics = [
    { icon: RouteIcon, label: 'Rota', value: `${Math.round(km)} km` },
    { icon: Check, label: 'Concluídas', value: `${done} de ${visits.length}` },
    { icon: Clock, label: 'Restantes', value: String(remaining) },
    { icon: Timer, label: 'Saída', value: '07:40' },
  ]

  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section className="min-w-0">
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">Paradas</h2>
          <span className="num text-[13.5px] font-semibold text-ink-3">{visits.length}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {visits.map((v, i) => (
            <StopCard
              key={v.id}
              visit={v}
              n={i + 1}
              index={i}
              selected={sel === v.id}
              featured={featured?.id === v.id}
              startedIso={startedAt[v.id]}
              onHover={setSel}
              onOpen={() => go(`/visita/${v.id}`, { dir: 1 })}
              onContinue={() => openRecord(v)}
            />
          ))}
        </div>
      </section>

      <section className="min-w-0 lg:sticky lg:top-3">
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">Mapa da rota</h2>
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3">
            <MapPin className="size-3.5" strokeWidth={2.2} /> Base Adrianópolis
          </span>
        </div>
        <Card className="overflow-hidden p-2">
          <div className="relative h-[clamp(340px,54vh,580px)] overflow-hidden rounded-[18px] bg-surface">
            <CityMap
              visits={mapVisits}
              focus="visits"
              routeOrder={visits.map((v) => v.id)}
              routeKey={vetId}
              highlightZones={zonesOfDay(visits)}
              selectedVisitId={sel}
              onSelectVisit={setSel}
              ariaLabel={`Rota de hoje de ${VET[vetId].name}`}
            />
          </div>
          <div className="grid grid-cols-4 divide-x divide-line py-4">
            {metrics.map((m) => (
              <div key={m.label} className="flex min-w-0 items-center gap-3 px-4">
                <IconCircle size={38} className="hidden xl:inline-flex">
                  <m.icon className="size-4" strokeWidth={2} />
                </IconCircle>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold text-ink-3">{m.label}</div>
                  <div className="num truncate text-[19px] leading-tight font-bold tracking-[-0.02em] text-ink">{m.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

function StopCard({
  visit,
  n,
  index,
  selected,
  featured,
  startedIso,
  onHover,
  onOpen,
  onContinue,
}: {
  visit: Visit
  n: number
  index: number
  selected: boolean
  featured: boolean
  startedIso?: string
  onHover: (id: string | null) => void
  onOpen: () => void
  onContinue: () => void
}) {
  const st = useDemo((s) => s.visitStatus[visit.id])
  const pet = petOf(visit)
  const b = bairroOf(visit)
  const leg = legOf(visit)
  const inService = st === 'em-atendimento'
  const done = st === 'concluida'
  const alert = pet.alerts?.[0]?.split(':')[0]

  const open = () => onOpen()
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.03 * index }}>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open())}
        onMouseEnter={() => onHover(visit.id)}
        onMouseLeave={() => onHover(null)}
        className={cn(
          'group w-full cursor-pointer rounded-[20px] p-3 pr-4 text-left transition-[box-shadow,background] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-black',
          inService ? 'bg-lime' : 'bg-card shadow-card hover:shadow-lift',
          selected && !inService && 'ring-2 ring-black',
          featured && !inService && !selected && 'ring-1 ring-line-2',
        )}
      >
        <div className="flex items-center gap-3.5">
          <span className={cn('num flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold', inService ? 'bg-black text-lime' : done ? 'bg-muted text-ink-3' : 'bg-black text-white')}>{n}</span>
          <span className="relative shrink-0">
            <PetAvatar pet={pet} size={52} className={cn('rounded-[16px]', done && 'opacity-80')} />
            {done && (
              <span className="absolute -right-1 -bottom-1 flex size-[22px] items-center justify-center rounded-full bg-lime ring-[3px] ring-card">
                <Check className="size-3 text-ink" strokeWidth={3.2} />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            {inService && (
              <div className="mb-0.5 flex items-center gap-1.5 text-[12px] font-semibold text-ink/65">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-black opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-black" />
                </span>
                Em atendimento · <span className="num">{minutesSince(startedIso ?? visit.start)} min</span>
              </div>
            )}
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn('truncate text-[16px] font-bold tracking-[-0.01em]', done ? 'text-ink-2' : 'text-ink')}>{pet.name}</span>
              {visit.petIds.length > 1 && <span className="text-[13px] font-semibold text-ink-3">+{visit.petIds.length - 1}</span>}
              {st === 'a-caminho' || st === 'cancelada' ? (
                <Badge tone={VISIT_STATUS[st].tone} className="shrink-0">
                  {VISIT_STATUS[st].label}
                </Badge>
              ) : null}
            </div>
            <div className={cn('mt-0.5 flex items-center gap-1.5 text-[13px] font-medium', inService ? 'text-ink/65' : 'text-ink-3')}>
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: ZONE[b.zone].hex }} />
              <span className="truncate">
                {visit.type} · {b.name}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className={cn('num text-[15px] font-bold', done ? 'text-ink-3' : 'text-ink')}>{fmt.time(visit.start)}</div>
            <div className={cn('mt-0.5 flex items-center justify-end gap-1 text-[12px] font-medium', inService ? 'text-ink/60' : 'text-ink-3')}>
              {inService ? (
                `${visit.durationMin} min`
              ) : done ? (
                'feita'
              ) : visit.fixedTime ? (
                <>
                  <Lock className="size-3" strokeWidth={2.4} /> fixo
                </>
              ) : (
                `${leg.min} min`
              )}
            </div>
          </div>
          {!inService && <ChevronRight className="size-[18px] shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />}
        </div>
        {inService && (
          <div className="mt-3 flex items-center gap-2 pl-[42px]">
            {alert && (
              <span className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full bg-black/[0.07] px-3.5 text-[13px] font-semibold text-ink">
                <HeartPulse className="size-4 shrink-0 text-red" strokeWidth={2.2} />
                <span className="truncate">{alert}</span>
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onContinue()
              }}
              className={cn(
                'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-black pr-3 pl-4 text-[13px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97]',
                !alert && 'flex-1',
              )}
            >
              Continuar <ArrowUpRight className="size-4 text-lime" strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
