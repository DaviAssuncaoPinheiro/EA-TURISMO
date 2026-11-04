import { motion } from 'motion/react'
import { Tip, VetAvatar } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { PET, TUTOR, type Vet } from '@/data/mock'
import { day, fmt } from '@/data/time'
import { cn } from '@/lib/utils'
import { NOW_MIN, cap, hhmm, hm, km1, loadOf, visitsOf, zonesOfDay, type AVisit } from './model'
import { CapacityBar, InnerBadge, zoneInk, zoneTint } from './shared'

export function visitBadge(v: AVisit) {
  if (v.status === 'concluida') return 'Concluída'
  if (v.status === 'em-atendimento') return 'Agora'
  if (v.status === 'a-caminho') return 'A caminho'
  if (v.origin === 'encaixe') return 'Encaixe'
  if (v.fixed) return 'Fixo'
  return null
}

export function VisitBlock({ v, onOpen, fresh, past }: { v: AVisit; onOpen: () => void; fresh?: boolean; past?: boolean }) {
  const pet = PET[v.petIds[0]]
  const zid = BAIRRO[v.bairro].zone
  const z = ZONE[zid]
  const badge = visitBadge(v)
  return (
    <Tip
      side="top"
      content={
        <div className="space-y-0.5">
          <div className="font-semibold">
            {v.petIds.map((id) => PET[id].name).join(' e ')} · {TUTOR[v.tutorId].name}
          </div>
          <div className="opacity-80">
            {hhmm(v.startMin)} às {hhmm(v.startMin + v.dur)} · {v.type}
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
        animate={{ opacity: past ? 0.62 : 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={onOpen}
        className={cn('flex w-full flex-col gap-1 rounded-[14px] px-2.5 py-2 text-left transition-[filter,box-shadow] hover:brightness-95', fresh && 'ring-2 ring-black ring-offset-2 ring-offset-card')}
        style={{ background: z.hex, color: zoneInk(zid) }}
      >
        <span className="flex items-center gap-1.5 text-[12.5px] leading-tight font-bold">
          <span className="truncate">
            {pet.name}
            {v.petIds.length > 1 && <span className="font-semibold opacity-75"> +{v.petIds.length - 1}</span>}
          </span>
          <span className="ml-auto shrink-0 text-[11px] font-semibold opacity-85 num">{hhmm(v.startMin)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium opacity-85">{BAIRRO[v.bairro].name}</span>
          {badge && <InnerBadge>{badge}</InnerBadge>}
        </span>
      </motion.button>
    </Tip>
  )
}

const LEFT = 150
const COL = 'minmax(172px,1fr)'

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
  const template = `${LEFT}px repeat(${days.length}, ${COL})`
  const todayIdx = days.indexOf(0)
  return (
    <div className="no-scrollbar overflow-x-auto rounded-[28px] bg-surface p-2">
      <div className="relative min-w-[1190px]">
        <div className="grid gap-1.5" style={{ gridTemplateColumns: template }}>
          {/* cabeçalho */}
          <div className="sticky left-0 z-20 flex items-end rounded-[16px] bg-surface px-3 pb-1 text-[12.5px] font-semibold text-ink-3">Equipe</div>
          {days.map((off) => {
            const d = day(off)
            const today = off === 0
            const idle = vets.every((v) => visitsOf(all, v.id, off).length === 0 && zonesOfDay([], v.id, off).length === 0)
            return (
              <button
                key={off}
                onClick={() => onOpenDay(off)}
                className={cn(
                  'flex h-11 items-center justify-center gap-1.5 rounded-[14px] text-[12.5px] font-semibold transition-colors',
                  today ? 'bg-blue text-white shadow-pill' : idle ? 'bg-muted-2 text-ink-3' : 'bg-card text-ink-2 shadow-pill hover:text-ink',
                )}
              >
                <span>{cap(fmt.weekdayShort(d))}</span>
                <span className="num font-bold">{d.getDate()}</span>
              </button>
            )
          })}

          {vets.map((vet) => (
            <Row key={vet.id} vet={vet} days={days} all={all} freshId={freshId} onOpenDay={onOpenDay} />
          ))}
        </div>

        {/* linha de agora */}
        {todayIdx >= 0 && (
          <div className="pointer-events-none absolute inset-y-0 z-[6] grid gap-1.5" style={{ gridTemplateColumns: template, left: 0, right: 0 }}>
            <div style={{ gridColumn: todayIdx + 2 }} className="flex justify-center pt-12">
              <div className="h-full border-l-2 border-dashed border-blue" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ vet, days, all, freshId, onOpenDay }: { vet: Vet; days: number[]; all: AVisit[]; freshId: string | null; onOpenDay: (off: number) => void }) {
  return (
    <>
      <div className="sticky left-0 z-20 flex flex-col gap-2 self-stretch rounded-[18px] bg-card p-3 shadow-card">
        <VetAvatar vetId={vet.id} size={36} />
        <div className="leading-tight">
          <div className="text-[13.5px] font-bold text-ink">{vet.short}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-3">{vet.focus.split(' · ')[0]}</div>
        </div>
      </div>
      {days.map((off) => {
        const list = visitsOf(all, vet.id, off)
        const zones = zonesOfDay(list, vet.id, off)
        const load = loadOf(list)
        const today = off === 0
        const past = off < 0
        if (!list.length && !zones.length) {
          return (
            <div key={off} className="hatch flex min-h-[132px] items-center justify-center rounded-[18px]">
              <span className="rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-semibold text-ink-3">Sem rota</span>
            </div>
          )
        }
        return (
          <div key={off} className="flex min-h-[132px] flex-col rounded-[18px] bg-card p-1.5 shadow-card">
            <div className="flex flex-wrap gap-1 px-0.5 pb-1.5">
              {zones.map((z) => (
                <span key={z} className="inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10.5px] font-bold text-ink" style={{ background: zoneTint(z, 22) }}>
                  <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
                  {ZONE[z].short}
                </span>
              ))}
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {list.length === 0 && <div className="m-auto py-3 text-center text-[11.5px] font-medium text-ink-4">Livre</div>}
              {list.map((v) => (
                <VisitBlock key={v.id} v={v} fresh={v.id === freshId} past={past || (today && v.startMin + v.dur < NOW_MIN)} onOpen={() => onOpenDay(off)} />
              ))}
            </div>
            {list.length > 0 && (
              <div className="px-1 pt-2 pb-0.5">
                <div className="mb-1.5 flex items-baseline justify-between gap-1 text-[10.5px] font-medium text-ink-3 num">
                  <span className="font-bold text-ink-2">{load.count} visitas</span>
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
