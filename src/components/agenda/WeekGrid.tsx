import { motion } from 'motion/react'
import { Check, Lock } from 'lucide-react'
import { PetAvatar, Tip, VetAvatar } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { PET, TUTOR, type Vet } from '@/data/mock'
import { day, fmt } from '@/data/time'
import { cn } from '@/lib/utils'
import { NOW_MIN, cap, hhmm, hm, km1, loadOf, visitsOf, zonesOfDay, type AVisit } from './model'
import { CapacityBar, HATCH, zoneTint } from './shared'

export function VisitBlock({ v, onOpen, fresh, past }: { v: AVisit; onOpen: () => void; fresh?: boolean; past?: boolean }) {
  const pet = PET[v.petIds[0]]
  const z = ZONE[BAIRRO[v.bairro].zone]
  const live = v.status === 'em-atendimento'
  return (
    <Tip
      side="top"
      content={
        <div className="space-y-0.5">
          <div className="font-medium">
            {v.petIds.map((id) => PET[id].name).join(' e ')} · {TUTOR[v.tutorId].name}
          </div>
          <div className="opacity-80">
            {hhmm(v.startMin)}–{hhmm(v.startMin + v.dur)} · {v.type}
          </div>
          <div className="opacity-80">{v.reason}</div>
          <div className="opacity-80">
            {BAIRRO[v.bairro].name} · {z.short}
          </div>
        </div>
      }
    >
      <motion.button
        layout="position"
        initial={fresh ? { opacity: 0, scale: 0.92, y: -6 } : false}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        onClick={onOpen}
        className={cn(
          'group relative flex w-full flex-col gap-0.5 rounded-[7px] border border-line bg-card py-1 pr-1.5 pl-2.5 text-left shadow-card transition-[box-shadow,border-color] hover:border-line-2 hover:shadow-lift',
          past && 'bg-card-2',
          fresh && 'ring-2 ring-terra-500 ring-offset-1 ring-offset-card',
        )}
      >
        <span className="absolute inset-y-0 left-0 w-[3px] rounded-l-[7px]" style={{ background: z.hex }} />
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[10.5px] text-ink-3 num">{hhmm(v.startMin)}</span>
          <PetAvatar pet={pet} size={16} className={past ? 'opacity-70' : ''} />
          <span className={cn('truncate text-[12px] font-semibold', past ? 'text-ink-2' : 'text-ink')}>
            {pet.name}
            {v.petIds.length > 1 && <span className="font-normal text-ink-3"> +{v.petIds.length - 1}</span>}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {v.fixed && <Lock size={10} strokeWidth={2} className="text-ink-3" />}
            {v.status === 'concluida' && <Check size={11} strokeWidth={2.4} className="text-ok" />}
            {live && <span className="size-1.5 animate-pulse rounded-full bg-terra-500" />}
          </span>
        </span>
        <span className="truncate text-[10.5px] text-ink-3">
          {BAIRRO[v.bairro].name} · {v.type}
        </span>
      </motion.button>
    </Tip>
  )
}

export function WeekGrid({
  days,
  vets,
  all,
  freshId,
  onOpenDay,
}: {
  days: number[]
  vets: Vet[]
  all: AVisit[]
  freshId: string | null
  onOpenDay: (off: number) => void
}) {
  const COL = 'minmax(160px,1fr)'
  return (
    <div className="no-scrollbar overflow-x-auto rounded-xl border border-line bg-card shadow-card">
      <div className="grid min-w-[1080px]" style={{ gridTemplateColumns: `120px repeat(${days.length}, ${COL})` }}>
        {/* cabeçalho */}
        <div className="sticky left-0 z-20 border-b border-line bg-card-2" />
        {days.map((off) => {
          const d = day(off)
          const today = off === 0
          return (
            <button
              key={off}
              onClick={() => onOpenDay(off)}
              className={cn('flex items-center gap-2 border-b border-l border-line px-3 py-2.5 text-left transition-colors hover:bg-paper-2/60', today ? 'bg-terra-50' : 'bg-card-2')}
            >
              <span className={cn('flex size-7 items-center justify-center rounded-full font-display text-[15px] font-semibold num', today ? 'bg-terra-600 text-white' : 'text-ink')}>{d.getDate()}</span>
              <span className="leading-tight">
                <span className="block text-[12.5px] font-medium text-ink">{cap(fmt.weekday(d).replace('-feira', ''))}</span>
                <span className="eyebrow !text-[9.5px]">{today ? 'Hoje' : fmt.short(d)}</span>
              </span>
            </button>
          )
        })}

        {/* linhas por veterinário */}
        {vets.map((vet, vi) => (
          <Row key={vet.id} vet={vet} days={days} all={all} freshId={freshId} last={vi === vets.length - 1} onOpenDay={onOpenDay} />
        ))}
      </div>
    </div>
  )
}

function Row({ vet, days, all, freshId, last, onOpenDay }: { vet: Vet; days: number[]; all: AVisit[]; freshId: string | null; last: boolean; onOpenDay: (off: number) => void }) {
  return (
    <>
      <div className={cn('sticky left-0 z-10 flex flex-col gap-1.5 bg-card-2 p-3', !last && 'border-b border-line')}>
        <VetAvatar vetId={vet.id} size={30} />
        <div className="leading-tight">
          <div className="text-[13px] font-semibold text-ink">{vet.short}</div>
          <div className="mt-0.5 text-[11px] text-ink-3">{vet.focus.split(' · ')[0]}</div>
        </div>
      </div>
      {days.map((off) => {
        const list = visitsOf(all, vet.id, off)
        const zones = zonesOfDay(list, vet.id, off)
        const load = loadOf(list)
        const today = off === 0
        const past = off < 0
        return (
          <div key={off} className={cn('flex min-h-[200px] flex-col border-l border-line', !last && 'border-b', today && 'bg-terra-50/40')}>
            {zones.length ? (
              <div className="flex flex-wrap gap-1 px-2 pt-2">
                {zones.map((z) => (
                  <span key={z} className="inline-flex h-[22px] items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-semibold text-ink" style={{ background: zoneTint(z, 22), boxShadow: `inset 0 -2px 0 ${ZONE[z].hex}` }}>
                    {ZONE[z].short}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mx-2 mt-2 flex h-[22px] items-center rounded-[6px] px-2 text-[11px] font-medium text-ink-3" style={{ background: HATCH }}>
                Sem rota
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1 p-2">
              {list.length === 0 && <div className="m-auto text-center text-[11.5px] text-ink-4">Dia livre</div>}
              {list.map((v) => (
                <VisitBlock key={v.id} v={v} fresh={v.id === freshId} past={past || (today && v.startMin + v.dur < NOW_MIN)} onOpen={() => onOpenDay(off)} />
              ))}
            </div>
            {list.length > 0 && (
              <div className="border-t border-line/70 px-2.5 py-2">
                <div className="mb-1.5 flex items-baseline justify-between gap-1 text-[10.5px] text-ink-3 num">
                  <span className="font-medium text-ink-2">{load.count} visitas</span>
                  <span>
                    {hm(load.service + load.travel)} · {km1(load.km).replace(' km', '')} km
                  </span>
                </div>
                <CapacityBar ratio={load.ratio} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
