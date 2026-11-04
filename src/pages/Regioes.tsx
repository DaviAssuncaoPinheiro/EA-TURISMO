import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowRight, CalendarDays, Check, Clock, Lightbulb, PawPrint, Undo2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, PageHeader, PetAvatar, Segmented, Tip, VetAvatar } from '@/components/ui'
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
      description: `${VET[SUGGEST.vet].short} cobre Centro-Sul e Sul às ${SUGGEST.days.map((d) => DAYS[d - 1].plural).join(' e ')}. Novos pedidos do Sul já entram nesses dias.`,
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
        const y = y0 + 44 * u
        if (!vets.length) {
          if (!heat[z.id]) return null
          const w = 64 * u
          return (
            <g key={z.id} transform={`translate(${x} ${y})`}>
              <rect x={-w / 2} y={-8 * u} width={w} height={16 * u} rx={8 * u} fill="var(--color-terra-50)" stroke="var(--color-terra-500)" strokeWidth={1 * u} strokeDasharray={`${2.5 * u} ${2 * u}`} />
              <text y={3.3 * u} textAnchor="middle" fontSize={9 * u} fontWeight={600} fill="var(--color-terra-700)">
                sem escala
              </text>
            </g>
          )
        }
        return (
          <g key={z.id} transform={`translate(${x - ((vets.length - 1) * 15 * u) / 2} ${y})`}>
            {vets.map((id, i) => (
              <g key={id} transform={`translate(${i * 15 * u} 0)`}>
                <circle r={9.5 * u} fill={VET[id].color} stroke="#fffcf6" strokeWidth={1.8 * u} />
                <text y={3 * u} textAnchor="middle" fontSize={7.5 * u} fontWeight={700} fill="#fff">
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
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow={`Últimas 8 semanas · ${TOTAL_VISITS} visitas`}
        title="Mapa e regiões"
        description="Onde está a demanda e quem cobre cada zona de Manaus em cada dia da semana."
        actions={
          <Button variant="outline" onClick={() => nav('/agenda')}>
            <CalendarDays className="size-4" strokeWidth={1.8} /> Agenda por região
          </Button>
        }
      />

      <Insight applied={applied} onApply={apply} onUndo={undo} onShow={() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} />

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_372px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 px-5 pt-4 pb-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="eyebrow mb-1">Mapa de calor</div>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
                Visitas por zona às <span className="font-display text-[17px] font-medium italic">{dayInfo.plural}</span>
              </h3>
            </div>
            <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
              <Segmented value={String(day)} onChange={(v) => setDay(Number(v))} options={DAYS.map((x) => ({ value: String(x.d), label: x.short }))} />
            </div>
          </div>
          <div className="border-y border-line">
            <CityMap
              aspect={1000 / 680}
              heat={heat}
              heatMax={HEAT_MAX}
              selectedZone={zone}
              onSelectZone={setZone}
              bairroHighlight={zone ? BAIRROS.filter((b) => b.zone === zone).map((b) => b.id) : undefined}
              showBairros="auto"
              overlay={overlay}
              ariaLabel={`Mapa de calor das visitas às ${dayInfo.plural}`}
            />
          </div>
          <div className="flex flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="eyebrow shrink-0">Visitas / 8 sem.</span>
              <span className="num font-mono text-[11px] text-ink-3">0</span>
              <span className="h-2 w-36 rounded-full" style={{ background: `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map((t) => heatColor(t)).join(',')})` }} />
              <span className="num font-mono text-[11px] text-ink-3">{HEAT_MAX}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-ink-2">
              <span className="eyebrow">Escala · {dayInfo.long}</span>
              {VETS.map((v) => {
                const zs = plan[v.id][day] ?? []
                return (
                  <span key={v.id} className="inline-flex items-center gap-1.5">
                    <VetAvatar vetId={v.id} size={18} />
                    <span className={cn(!zs.length && 'text-ink-4')}>{zs.length ? zs.map((z) => ZONE[z].short).join(' + ') : 'sem rota'}</span>
                  </span>
                )
              })}
            </div>
          </div>
        </Card>

        <ZonePanel zone={zone} onZone={setZone} plan={plan} day={day} />
      </div>

      <CoverageTable tableRef={tableRef} plan={plan} day={day} onDay={setDay} zone={zone} onZone={setZone} applied={applied} />
    </div>
  )
}

/* ───────────────────────── insight ───────────────────────── */

function Insight({ applied, onApply, onUndo, onShow }: { applied: boolean; onApply: () => void; onUndo: () => void; onShow: () => void }) {
  const vet = VET[SUGGEST.vet]
  const daysTxt = SUGGEST.days.map((d) => DAYS[d - 1].long).join(' e ')
  const offDays = DAYS.filter(({ d }) => !coverage(WEEK_PLAN, SUGGEST.target, d).length && HEATMAP[SUGGEST.target][d - 1] > 0).map((x) => x.long)
  const h = Math.floor(SUGGEST.savedMin / 60)
  const m = Math.round((SUGGEST.savedMin % 60) / 10) * 10
  return (
    <Card className={cn('relative overflow-hidden transition-colors duration-300', applied ? 'border-ok/30 bg-ok-bg/40' : 'border-terra-200')}>
      {!applied && <span className="absolute inset-y-0 left-0 w-1 bg-terra-500" />}
      <AnimatePresence mode="wait" initial={false}>
        {!applied ? (
          <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid gap-4 p-4 pl-5 md:p-5 md:pl-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="flex gap-3.5">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-terra-100 text-terra-700">
                <Lightbulb className="size-[18px]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <div className="eyebrow mb-1">Sugestão para a escala</div>
                <h2 className="font-display text-[20px] leading-tight font-medium text-ink md:text-[22px]">
                  Zona Sul teve {SUGGEST.total} visitas em dias sem veterinário escalado
                </h2>
                <p className="mt-1.5 max-w-[760px] text-[13.5px] leading-relaxed text-ink-2">
                  Nas últimas 8 semanas, os encaixes de {offDays.join(', ').replace(/, ([^,]*)$/, ' e $1')} viraram saídas avulsas. A {vet.short} já está na Centro-Sul, vizinha, às {SUGGEST.days.map((d) => DAYS[d - 1].plural).join(' e ')}: incluir a Zona Sul nesses dias absorve{' '}
                  <b className="font-semibold text-ink">
                    {SUGGEST.absorbed} dos {SUGGEST.total}
                  </b>{' '}
                  encaixes.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 pl-[50px] lg:pl-0">
              <div className="leading-tight">
                <div className="num font-display text-[26px] font-medium text-ink">
                  −{h}h{m ? String(m).padStart(2, '0') : ''}
                </div>
                <div className="text-[11.5px] text-ink-3">de trânsito a cada 8 semanas</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={onShow}>
                  Ver na escala
                </Button>
                <Button variant="accent" onClick={onApply}>
                  Aplicar à escala <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:p-5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ok text-white">
              <Check className="size-[18px]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold text-ink">Escala atualizada</div>
              <div className="text-[13px] text-ink-2">
                {vet.short} agora cobre Centro-Sul + Sul na {daysTxt}. Encaixes fora da escala no Sul: {SUGGEST.total} → {SUGGEST.total - SUGGEST.absorbed}.
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onUndo}>
              <Undo2 className="size-3.5" /> Desfazer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

/* ───────────────────────── painel de zonas ───────────────────────── */

function ZonePanel({ zone, onZone, plan, day }: { zone: ZoneId | null; onZone: (z: ZoneId | null) => void; plan: Plan; day: number }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader eyebrow="Zonas" title="Pacientes, demanda e cobertura" />
      <ul className="border-t border-line">
        {ZONES.map((z) => {
          const sel = zone === z.id
          const pets = petsByZone(z.id)
          const visits = HEATMAP[z.id].reduce((a, b) => a + b, 0)
          const days = DAYS.filter(({ d }) => coverage(plan, z.id, d).length)
          const off = offSchedule(plan, z.id)
          return (
            <li key={z.id} className="border-b border-line last:border-b-0">
              <button onClick={() => onZone(sel ? null : z.id)} className={cn('relative flex w-full items-center gap-3 px-5 py-3 text-left transition-colors', sel ? 'bg-card-2' : 'hover:bg-card-2')}>
                <span className={cn('absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-opacity', sel ? 'opacity-100' : 'opacity-0')} style={{ background: z.hex }} />
                <span className="size-2.5 shrink-0 rounded-full" style={{ background: z.hex }} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold text-ink">{z.name}</span>
                  <span className="mt-0.5 block text-[12px] text-ink-3">
                    {days.length ? days.map((x) => x.short).join(' · ') : 'sem dia fixo'}
                    {off > 0 && <span className="text-terra-700"> · {off} encaixes</span>}
                  </span>
                </span>
                <span className="text-right leading-tight">
                  <span className="num block text-[13px] font-medium text-ink">{visits}</span>
                  <span className="block text-[11px] text-ink-3">visitas</span>
                </span>
                <span className="w-9 text-right leading-tight">
                  <span className="num block text-[13px] font-medium text-ink">{pets.length}</span>
                  <span className="block text-[11px] text-ink-3">pets</span>
                </span>
              </button>
              <AnimatePresence initial={false}>
                {sel && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden bg-card-2">
                    <ZoneDetail z={z.id} plan={plan} day={day} />
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ZoneDetail({ z, plan, day }: { z: ZoneId; plan: Plan; day: number }) {
  const pets = petsByZone(z)
  const bairros = BAIRROS.filter((b) => b.zone === z).map((b) => ({ ...b, n: pets.filter((p) => TUTOR[p.tutorId].bairro === b.id).length }))
  const visits = HEATMAP[z].reduce((a, b) => a + b, 0)
  return (
    <div className="px-5 pt-1 pb-4">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
        {[
          { k: 'Pacientes ativos', v: String(pets.length), icon: PawPrint },
          { k: 'Visitas / semana', v: (visits / 8).toLocaleString('pt-BR', { maximumFractionDigits: 1 }), icon: CalendarDays },
          { k: 'Deslocamento', v: `${travelMinutesFromBase(z)} min`, icon: Clock },
        ].map((s) => (
          <div key={s.k} className="bg-card px-3 py-2.5">
            <div className="num font-display text-[20px] leading-none font-medium text-ink">{s.v}</div>
            <div className="mt-1 text-[11px] leading-tight text-ink-3">{s.k}</div>
          </div>
        ))}
      </div>

      <div className="mt-3.5">
        <div className="eyebrow mb-1.5">Quem atende, por dia</div>
        <div className="grid grid-cols-6 gap-1">
          {DAYS.map(({ d, short }) => {
            const vets = coverage(plan, z, d)
            const demand = HEATMAP[z][d - 1]
            const gap = !vets.length && demand > 0
            return (
              <Tip key={d} content={vets.length ? `${short}: ${vets.map((v) => VET[v].short).join(', ')} · ${demand} visitas em 8 sem.` : gap ? `${short}: ninguém escalado, ${demand} encaixes em 8 sem.` : `${short}: sem demanda`}>
                <div className={cn('flex h-[52px] flex-col items-center justify-between rounded-md border py-1.5', gap ? 'border-dashed border-terra-200 bg-terra-50' : 'border-line bg-card', d === day && 'ring-1 ring-sage-700')}>
                  <span className={cn('font-mono text-[10px] uppercase', d === day ? 'text-ink' : 'text-ink-3')}>{short}</span>
                  {vets.length ? (
                    <span className="flex -space-x-1">
                      {vets.map((v) => (
                        <VetAvatar key={v} vetId={v} size={18} className="ring-2 ring-card" />
                      ))}
                    </span>
                  ) : (
                    <span className={cn('num text-[11px] font-medium', gap ? 'text-terra-700' : 'text-ink-4')}>{gap ? `+${demand}` : '—'}</span>
                  )}
                </div>
              </Tip>
            )
          })}
        </div>
      </div>

      <div className="mt-3.5">
        <div className="eyebrow mb-1.5">Bairros</div>
        <div className="flex flex-wrap gap-1.5">
          {bairros.map((b) => (
            <span key={b.id} className={cn('inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[12px]', b.n ? 'border-line-2 bg-card text-ink' : 'border-line text-ink-3')}>
              {b.name}
              {b.n > 0 && <span className="num font-mono text-[10.5px] text-ink-3">{b.n}</span>}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3.5">
        <div className="eyebrow mb-1.5">Pacientes</div>
        {pets.length ? (
          <ul className="flex flex-col">
            {pets.map((p) => (
              <li key={p.id}>
                <Link to={`/pacientes/${p.id}`} className="group -mx-2 flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-paper-2">
                  <PetAvatar pet={p} size={26} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    <span className="font-medium text-ink">{p.name}</span>
                    <span className="text-ink-3">
                      {' '}
                      · {p.breed} · {TUTOR[p.tutorId].name}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[12.5px] text-ink-3">Nenhum paciente cadastrado nesta zona ainda.</div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── tabela cobertura × demanda ───────────────────────── */

function CoverageTable({
  tableRef,
  plan,
  day,
  onDay,
  zone,
  onZone,
  applied,
}: {
  tableRef: React.RefObject<HTMLDivElement>
  plan: Plan
  day: number
  onDay: (d: number) => void
  zone: ZoneId | null
  onZone: (z: ZoneId | null) => void
  applied: boolean
}) {
  const totalOff = ZONES.reduce((a, z) => a + offSchedule(plan, z.id), 0)
  return (
    <div ref={tableRef} className="mt-4">
    <Card className="overflow-hidden">
      <CardHeader
        eyebrow="Escala × demanda"
        title="Quem cobre cada zona, e onde sobram encaixes"
        action={
          <Badge tone={applied ? 'ok' : 'terra'}>
            <span className="num">{totalOff}</span> encaixes fora da escala
          </Badge>
        }
      />
      <div className="no-scrollbar overflow-x-auto border-t border-line">
        <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
          <thead>
            <tr className="bg-card-2">
              <th className="eyebrow w-[180px] px-5 py-2 text-left font-normal">Zona</th>
              {DAYS.map(({ d, short }) => (
                <th key={d} className="px-1 py-1.5 font-normal">
                  <button onClick={() => onDay(d)} className={cn('h-7 w-full rounded-md font-mono text-[10.5px] tracking-[0.08em] uppercase transition-colors', d === day ? 'bg-sage-900 text-paper' : 'text-ink-3 hover:bg-paper-2 hover:text-ink')}>
                    {short}
                  </button>
                </th>
              ))}
              <th className="eyebrow w-[110px] px-5 py-2 text-right font-normal">Encaixes</th>
            </tr>
          </thead>
          <tbody>
            {ZONES.map((z) => {
              const off = offSchedule(plan, z.id)
              const sel = zone === z.id
              return (
                <tr key={z.id} onClick={() => onZone(sel ? null : z.id)} className={cn('cursor-pointer border-t border-line transition-colors', sel ? 'bg-card-2' : 'hover:bg-card-2/70')}>
                  <td className="px-5 py-2">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: z.hex }} />
                      <span className="font-medium text-ink">{z.name}</span>
                    </span>
                  </td>
                  {DAYS.map(({ d }) => {
                    const n = HEATMAP[z.id][d - 1]
                    const vets = coverage(plan, z.id, d)
                    const gap = !vets.length && n > 0
                    const t = n / HEAT_MAX
                    return (
                      <td key={d} className={cn('px-1 py-1.5', d === day && 'bg-sage-50/70')}>
                        <motion.div
                          layout
                          className={cn('flex h-10 items-center justify-between gap-1 rounded-md px-2', gap && 'ring-1 ring-terra-500/60 ring-inset')}
                          style={{ background: gap ? 'var(--color-terra-50)' : heatColor(t * 0.85) }}
                        >
                          <span className={cn('num font-display text-[15px] font-medium', gap ? 'text-terra-700' : heatIsDark(t * 0.85) ? 'text-paper' : 'text-ink')}>{n}</span>
                          <span className="flex -space-x-1">
                            <AnimatePresence initial={false}>
                              {vets.map((v) => (
                                <motion.span key={v} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                                  <VetAvatar vetId={v} size={18} className="ring-2 ring-card" />
                                </motion.span>
                              ))}
                            </AnimatePresence>
                          </span>
                        </motion.div>
                      </td>
                    )
                  })}
                  <td className="px-5 py-2 text-right">
                    <span className={cn('num font-medium', off ? 'text-terra-700' : 'text-ink-4')}>{off || '—'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-5 py-2.5 text-[12px] text-ink-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] ring-1 ring-terra-500/60 ring-inset" style={{ background: 'var(--color-terra-50)' }} /> demanda sem veterinário escalado
        </span>
        <span>Números: visitas nas últimas 8 semanas, por dia da semana.</span>
      </div>
    </Card>
    </div>
  )
}
