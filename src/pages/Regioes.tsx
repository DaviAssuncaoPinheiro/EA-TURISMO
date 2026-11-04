import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, CalendarDays, Check, Clock, Lightbulb, PawPrint, Undo2 } from 'lucide-react'
import { Button, Card, IconCircle, Panel, PetAvatar, Segmented, SegmentBar, Tip, VetAvatar, ViewAll } from '@/components/ui'
import { CityMap, heatColor, heatIsDark, type MapCtx } from '@/components/map/CityMap'
import { travelMinutesFromBase } from '@/components/map/geometry'
import { BAIRROS, ZONE, ZONES, type ZoneId } from '@/data/geo'
import { HEATMAP, PETS, TUTOR, VET, VETS, WEEK_PLAN, zoneOfPet } from '@/data/mock'
import { TODAY } from '@/data/time'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

const DAYS = [
  { d: 1, short: 'Seg', plural: 'segundas', long: 'segunda' },
  { d: 2, short: 'Ter', plural: 'terças', long: 'terça' },
  { d: 3, short: 'Qua', plural: 'quartas', long: 'quarta' },
  { d: 4, short: 'Qui', plural: 'quintas', long: 'quinta' },
  { d: 5, short: 'Sex', plural: 'sextas', long: 'sexta' },
  { d: 6, short: 'Sáb', plural: 'sábados', long: 'sábado' },
]

type Plan = Record<string, Record<number, ZoneId[]>>

const clonePlan = (p: Plan): Plan => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Object.fromEntries(Object.entries(v).map(([d, z]) => [d, [...z]]))]))
const coverage = (plan: Plan, z: ZoneId, d: number) => VETS.filter((v) => plan[v.id]?.[d]?.includes(z)).map((v) => v.id)
const offSchedule = (plan: Plan, z: ZoneId) => DAYS.reduce((a, { d }) => a + (coverage(plan, z, d).length ? 0 : HEATMAP[z][d - 1]), 0)
const joinE = (xs: string[]) => (xs.length > 1 ? xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1] : xs[0] ?? '')

const HEAT_MAX = Math.max(...Object.values(HEATMAP).flat())
const TOTAL_VISITS = Object.values(HEATMAP).flat().reduce((a, b) => a + b, 0)

/* sugestão: absorver os encaixes da Zona Sul nos dias em que a Dra. Larissa já está na Centro-Sul */
const SUGGEST = (() => {
  const vet = 'larissa'
  const target: ZoneId = 'sul'
  const anchor: ZoneId = 'centro-sul'
  const days = DAYS.filter(({ d }) => !coverage(WEEK_PLAN, target, d).length && WEEK_PLAN[vet][d]?.includes(anchor) && HEATMAP[target][d - 1] > 0).map((x) => x.d)
  const absorbed = days.reduce((a, d) => a + HEATMAP[target][d - 1], 0)
  const total = offSchedule(WEEK_PLAN, target)
  const savedMin = absorbed * travelMinutesFromBase(target) * 2
  return { vet, target, anchor, days, absorbed, total, savedMin }
})()

const petsByZone = (z: ZoneId) => PETS.filter((p) => zoneOfPet(p) === z)

export default function Regioes() {
  const nav = useNavigate()
  const dow = TODAY.getDay()
  const [day, setDay] = React.useState<number>(dow === 0 ? 1 : dow)
  const [zone, setZone] = React.useState<ZoneId | null>('sul')
  const [plan, setPlan] = React.useState<Plan>(() => clonePlan(WEEK_PLAN))
  const [applied, setApplied] = React.useState(false)
  const tableRef = React.useRef<HTMLDivElement>(null)

  const heat = Object.fromEntries(ZONES.map((z) => [z.id, HEATMAP[z.id][day - 1]])) as Record<ZoneId, number>
  const dayInfo = DAYS[day - 1]

  const apply = () => {
    const next = clonePlan(plan)
    for (const d of SUGGEST.days) next[SUGGEST.vet][d] = [...(next[SUGGEST.vet][d] ?? []), SUGGEST.target]
    setPlan(next)
    setApplied(true)
    setZone(SUGGEST.target)
    toast.success('Escala atualizada', {
      description: `${VET[SUGGEST.vet].short} cobre Centro-Sul e Sul às ${joinE(SUGGEST.days.map((d) => DAYS[d - 1].plural))}.`,
    })
  }
  const undo = () => {
    setPlan(clonePlan(WEEK_PLAN))
    setApplied(false)
    toast('Escala restaurada')
  }

  const overlay = ({ u }: MapCtx) => (
    <g pointerEvents="none">
      {ZONES.map((z) => {
        const vets = coverage(plan, z.id, day)
        const [x, y0] = z.label
        const y = y0 + 48 * u
        if (!vets.length) {
          if (!heat[z.id]) return null
          const w = 74 * u
          return (
            <g key={z.id} transform={`translate(${x} ${y})`}>
              <rect x={-w / 2} y={-10 * u} width={w} height={20 * u} rx={10 * u} fill="#fff" />
              <circle cx={-w / 2 + 11 * u} r={3 * u} fill="var(--color-coral)" />
              <text x={5 * u} y={3.6 * u} textAnchor="middle" fontSize={10 * u} fontWeight={700} fill="var(--color-coral)">
                Sem escala
              </text>
            </g>
          )
        }
        return (
          <g key={z.id} transform={`translate(${x - ((vets.length - 1) * 16 * u) / 2} ${y})`}>
            {vets.map((id, i) => (
              <g key={id} transform={`translate(${i * 16 * u} 0)`}>
                <circle r={10.5 * u} fill={VET[id].color} stroke="#fff" strokeWidth={2.2 * u} />
                <text y={3.2 * u} textAnchor="middle" fontSize={8 * u} fontWeight={800} fill="#fff">
                  {VET[id].initials}
                </text>
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Regiões</h1>
          <p className="mt-1.5 text-[14px] font-medium text-ink-3">{TOTAL_VISITS} visitas nas últimas 8 semanas</p>
        </div>
        <Button variant="outline" onClick={() => nav('/agenda')} className="self-start sm:self-auto">
          <CalendarDays className="size-4" strokeWidth={2} /> Agenda por região
        </Button>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
        <Card className="p-2">
          <div className="flex flex-col gap-3 px-2 pt-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Mapa de calor</h2>
              <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">Visitas por zona às {dayInfo.plural}</p>
            </div>
            <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
              <Segmented value={String(day)} onChange={(v) => setDay(Number(v))} options={DAYS.map((x) => ({ value: String(x.d), label: x.short }))} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-surface">
            <CityMap
              aspect={1000 / 680}
              heat={heat}
              heatMax={HEAT_MAX}
              selectedZone={zone}
              onSelectZone={setZone}
              bairroHighlight={zone ? BAIRROS.filter((b) => b.zone === zone).map((b) => b.id) : undefined}
              showBairros={false}
              overlay={overlay}
              ariaLabel={`Mapa de calor das visitas às ${dayInfo.plural}`}
            />
          </div>
          <div className="flex flex-col gap-3 px-2 pt-3 pb-1.5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="num text-[12px] font-semibold text-ink-3">0</span>
              <span className="h-2 w-32 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map((t) => heatColor(t)).join(',')})` }} />
              <span className="num text-[12px] font-semibold text-ink-3">{HEAT_MAX} visitas</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {VETS.map((v) => {
                const zs = plan[v.id][day] ?? []
                return (
                  <span key={v.id} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted pr-3 pl-1 text-[12px] font-semibold text-ink-2">
                    <VetAvatar vetId={v.id} size={24} />
                    <span className={cn(!zs.length && 'text-ink-4')}>{zs.length ? zs.map((z) => ZONE[z].short).join(' e ') : 'Folga'}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </Card>
        <CoverageTable tableRef={tableRef} plan={plan} day={day} onDay={setDay} zone={zone} onZone={setZone} />
        </div>

        <div className="flex flex-col gap-4">
          <Insight applied={applied} onApply={apply} onUndo={undo} onShow={() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />
          <ZonePanel zone={zone} onZone={setZone} plan={plan} day={day} />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── sugestão ───────────────────────── */

function Insight({ applied, onApply, onUndo, onShow }: { applied: boolean; onApply: () => void; onUndo: () => void; onShow: () => void }) {
  const vet = VET[SUGGEST.vet]
  const plurals = joinE(SUGGEST.days.map((d) => DAYS[d - 1].plural))
  const h = Math.floor(SUGGEST.savedMin / 60)
  const m = Math.round((SUGGEST.savedMin % 60) / 10) * 10
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!applied ? (
        <motion.div key="s" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-[24px] bg-lime p-5">
          <div className="flex items-center gap-2.5">
            <IconCircle size={34} tone="black">
              <Lightbulb className="size-4 text-lime" strokeWidth={2} />
            </IconCircle>
            <span className="text-[13px] font-bold text-lime-ink">Sugestão para a escala</span>
          </div>
          <h2 className="mt-3.5 text-[19px] leading-snug font-bold tracking-[-0.02em] text-ink">Zona Sul teve {SUGGEST.total} visitas fora da escala</h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed font-medium text-lime-ink">
            {vet.short} já atende a Centro-Sul às {plurals}. Incluir a Zona Sul nesses dias cobre {SUGGEST.absorbed} dessas visitas.
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="num text-[26px] leading-none font-bold tracking-[-0.02em] text-ink">
              {h}h{m ? String(m).padStart(2, '0') : ''}
            </span>
            <span className="text-[12.5px] font-semibold text-lime-ink">a menos de trânsito a cada 8 semanas</span>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={onApply} className="flex-1">
              Aplicar à escala <ArrowRight className="size-4" />
            </Button>
            <Button variant="ghost" onClick={onShow} className="bg-white/45 text-ink hover:bg-white/70">
              Ver escala
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div key="a" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="rounded-[24px] bg-black p-5 text-white">
          <div className="flex items-center gap-2.5">
            <IconCircle size={34} tone="lime">
              <Check className="size-4" strokeWidth={2.4} />
            </IconCircle>
            <span className="text-[15px] font-bold">Escala atualizada</span>
            <button onClick={onUndo} className="ml-auto inline-flex h-8 items-center gap-1 rounded-full bg-white/10 px-3 text-[12.5px] font-semibold text-white/80 hover:bg-white/15 hover:text-white">
              <Undo2 className="size-3.5" /> Desfazer
            </button>
          </div>
          <p className="mt-3 text-[13.5px] leading-relaxed font-medium text-white/65">
            {vet.short} cobre Centro-Sul e Sul às {plurals}.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="num text-[14px] font-semibold text-white/40 line-through">{SUGGEST.total}</span>
            <span className="num text-[26px] leading-none font-bold text-lime">{SUGGEST.total - SUGGEST.absorbed}</span>
            <span className="text-[12.5px] font-semibold text-white/60">visitas fora da escala no Sul</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ───────────────────────── zonas ───────────────────────── */

function ZonePanel({ zone, onZone, plan, day }: { zone: ZoneId | null; onZone: (z: ZoneId | null) => void; plan: Plan; day: number }) {
  return (
    <Panel className="bg-muted">
      <div className="px-3 pt-3 pb-3">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Zonas</h2>
        <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">Visitas por dia da semana</p>
      </div>
      <ul className="flex flex-col gap-2">
        {ZONES.map((z) => {
          const sel = zone === z.id
          const pets = petsByZone(z.id)
          const visits = HEATMAP[z.id].reduce((a, b) => a + b, 0)
          const days = DAYS.filter(({ d }) => coverage(plan, z.id, d).length)
          const off = offSchedule(plan, z.id)
          return (
            <li key={z.id} className={cn('rounded-[20px] bg-card shadow-card transition-shadow', sel ? 'ring-2 ring-black' : 'hover:shadow-lift')}>
              <button onClick={() => onZone(sel ? null : z.id)} className="block w-full p-4 text-left">
                <span className="flex items-center gap-2.5">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: z.hex }} />
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{z.name}</span>
                  <span className="num text-[14px] font-bold text-ink">{visits}</span>
                  <span className="text-[12px] font-medium text-ink-3">visitas</span>
                </span>
                <SegmentBar className="mt-3" parts={DAYS.map(({ d }) => ({ value: HEATMAP[z.id][d - 1], color: coverage(plan, z.id, d).length ? z.hex : 'var(--color-coral-soft)' }))} />
                <span className="mt-2.5 flex items-center gap-2 text-[12px] font-medium text-ink-3">
                  <span className="truncate">{days.length ? days.map((x) => x.short).join(', ') : 'Sem dia fixo'}</span>
                  <span className="text-ink-4">·</span>
                  <span className="num shrink-0">{pets.length} pets</span>
                  {off > 0 && <span className="num ml-auto shrink-0 font-semibold text-coral">{off} fora da escala</span>}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {sel && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <ZoneDetail z={z.id} plan={plan} day={day} />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function ZoneDetail({ z, plan, day }: { z: ZoneId; plan: Plan; day: number }) {
  const pets = petsByZone(z)
  const bairros = BAIRROS.filter((b) => b.zone === z).map((b) => ({ ...b, n: pets.filter((p) => TUTOR[p.tutorId].bairro === b.id).length }))
  const visits = HEATMAP[z].reduce((a, b) => a + b, 0)
  return (
    <div className="border-t border-line px-4 pt-3.5 pb-4">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { k: 'Pacientes', v: String(pets.length), icon: PawPrint },
          { k: 'Por semana', v: (visits / 8).toLocaleString('pt-BR', { maximumFractionDigits: 1 }), icon: CalendarDays },
          { k: 'Da base', v: `${travelMinutesFromBase(z)} min`, icon: Clock },
        ].map((s) => (
          <div key={s.k} className="rounded-[14px] bg-surface px-3 py-2.5">
            <s.icon className="size-3.5 text-ink-3" strokeWidth={2} />
            <div className="num mt-1.5 text-[17px] leading-none font-bold text-ink">{s.v}</div>
            <div className="mt-1 text-[11.5px] font-medium text-ink-3">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-[12.5px] font-bold text-ink">Quem atende</div>
      <div className="mt-2 grid grid-cols-6 gap-1">
        {DAYS.map(({ d, short }) => {
          const vets = coverage(plan, z, d)
          const demand = HEATMAP[z][d - 1]
          const gap = !vets.length && demand > 0
          return (
            <Tip key={d} content={vets.length ? `${short}: ${vets.map((v) => VET[v].short).join(', ')}, ${demand} visitas em 8 semanas` : gap ? `${short}: ninguém escalado, ${demand} visitas em 8 semanas` : `${short}: sem demanda`}>
              <div className={cn('flex h-[54px] flex-col items-center justify-between rounded-[12px] py-1.5', gap ? 'bg-coral-soft' : 'bg-surface', d === day && 'ring-2 ring-black')}>
                <span className={cn('text-[11px] font-semibold', d === day ? 'text-ink' : 'text-ink-3')}>{short}</span>
                {vets.length ? (
                  <span className="flex -space-x-1.5">
                    {vets.map((v) => (
                      <VetAvatar key={v} vetId={v} size={20} className="ring-2 ring-surface" />
                    ))}
                  </span>
                ) : (
                  <span className={cn('num text-[12px] font-bold', gap ? 'text-coral' : 'text-ink-4')}>{gap ? `+${demand}` : '0'}</span>
                )}
              </div>
            </Tip>
          )
        })}
      </div>

      <div className="mt-4 text-[12.5px] font-bold text-ink">Bairros</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {bairros.map((b) => (
          <span key={b.id} className={cn('inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold', b.n ? 'bg-muted text-ink' : 'bg-surface text-ink-3')}>
            {b.name}
            {b.n > 0 && <span className="num text-ink-3">{b.n}</span>}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-ink">Pacientes</span>
        {pets.length > 5 && (
          <Link to="/pacientes" className="text-[12px] font-semibold text-ink-3 hover:text-ink">
            Ver todos
          </Link>
        )}
      </div>
      {pets.length ? (
        <ul className="mt-1 flex flex-col">
          {pets.slice(0, 5).map((p) => (
            <li key={p.id}>
              <Link to={`/pacientes/${p.id}`} className="group -mx-2 flex items-center gap-2.5 rounded-[12px] px-2 py-1.5 hover:bg-surface">
                <PetAvatar pet={p} size={28} />
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="font-medium text-ink-3"> {p.breed}</span>
                </span>
                <ArrowRight className="size-3.5 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-1 text-[12.5px] font-medium text-ink-3">Nenhum paciente nesta zona ainda.</div>
      )}
    </div>
  )
}

/* ───────────────────────── escala da semana ───────────────────────── */

function CoverageTable({
  tableRef,
  plan,
  day,
  onDay,
  zone,
  onZone,
}: {
  tableRef: React.RefObject<HTMLDivElement>
  plan: Plan
  day: number
  onDay: (d: number) => void
  zone: ZoneId | null
  onZone: (z: ZoneId | null) => void
}) {
  const nav = useNavigate()
  const totalOff = ZONES.reduce((a, z) => a + offSchedule(plan, z.id), 0)
  return (
    <div ref={tableRef} className="scroll-mt-4">
      <Card className="p-2">
        <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-3">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Escala da semana</h2>
            <p className="mt-0.5 text-[12.5px] font-medium text-ink-3">
              <span className="num font-semibold text-coral">{totalOff}</span> visitas fora da escala em 8 semanas
            </p>
          </div>
          <ViewAll onClick={() => nav('/agenda')}>Agenda</ViewAll>
        </div>
        <div className="no-scrollbar overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-1 text-[12.5px]">
            <thead>
              <tr>
                <th className="w-[170px] px-3 text-left text-[12px] font-semibold text-ink-3">Zona</th>
                {DAYS.map(({ d, short }) => (
                  <th key={d} className="font-normal">
                    <button onClick={() => onDay(d)} className={cn('h-8 w-full rounded-full text-[12px] font-semibold transition-colors', d === day ? 'bg-black text-white' : 'text-ink-3 hover:bg-muted hover:text-ink')}>
                      {short}
                    </button>
                  </th>
                ))}
                <th className="w-[96px] px-3 text-right text-[12px] font-semibold text-ink-3">Fora</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z) => {
                const off = offSchedule(plan, z.id)
                const sel = zone === z.id
                return (
                  <tr key={z.id} onClick={() => onZone(sel ? null : z.id)} className="group cursor-pointer">
                    <td className={cn('rounded-[12px] px-3 transition-colors', sel ? 'bg-muted' : 'group-hover:bg-surface')}>
                      <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: z.hex }} />
                        <span className="font-semibold text-ink">{z.name}</span>
                      </span>
                    </td>
                    {DAYS.map(({ d }) => {
                      const n = HEATMAP[z.id][d - 1]
                      const vets = coverage(plan, z.id, d)
                      const gap = !vets.length && n > 0
                      const t = n / HEAT_MAX
                      return (
                        <td key={d}>
                          <motion.div
                            layout
                            className={cn('flex h-11 items-center justify-between gap-1 rounded-[12px] px-2.5', gap && 'border-[1.5px] border-dashed border-coral/60', d === day && !gap && 'ring-2 ring-black/80 ring-inset')}
                            style={{ background: gap ? 'var(--color-coral-soft)' : heatColor(t) }}
                          >
                            <span className={cn('num text-[14px] font-bold', gap ? 'text-coral' : heatIsDark(t) ? 'text-white' : 'text-ink')}>{n}</span>
                            <span className="flex -space-x-1.5">
                              <AnimatePresence initial={false}>
                                {vets.map((v) => (
                                  <motion.span key={v} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                                    <VetAvatar vetId={v} size={20} className="ring-2 ring-white" />
                                  </motion.span>
                                ))}
                              </AnimatePresence>
                            </span>
                          </motion.div>
                        </td>
                      )
                    })}
                    <td className="px-3 text-right">
                      <span className={cn('num text-[14px] font-bold', off ? 'text-coral' : 'text-ink-4')}>{off}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 pt-2 pb-2 text-[12px] font-medium text-ink-3">
          <span className="inline-flex items-center gap-2">
            <span className="size-3.5 rounded-[5px] border-[1.5px] border-dashed border-coral/60 bg-coral-soft" /> Sem veterinário escalado
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-16 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.5, 1].map((t) => heatColor(t)).join(',')})` }} /> Visitas em 8 semanas
          </span>
        </div>
      </Card>
    </div>
  )
}
