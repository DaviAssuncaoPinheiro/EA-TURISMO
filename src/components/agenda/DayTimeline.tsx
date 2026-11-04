import { motion } from 'motion/react'
import { Check, Lock, Navigation } from 'lucide-react'
import { Badge, PetAvatar, Tip, VetAvatar } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { PET, type Vet } from '@/data/mock'
import { cn } from '@/lib/utils'
import { DAY_END, DAY_START, NOW_MIN, hhmm, hm, km1, legsOf, loadOf, visitsOf, zonesOfDay, type AVisit } from './model'
import { CapacityBar, HATCH, zoneTint } from './shared'

const HPX = 84
const y = (min: number) => ((min - DAY_START) / 60) * HPX
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START / 60 + i)

export function DayTimeline({ off, vets, all, freshId }: { off: number; vets: Vet[]; all: AVisit[]; freshId: string | null }) {
  const total = y(DAY_END)
  return (
    <div className="no-scrollbar overflow-x-auto rounded-xl border border-line bg-card shadow-card">
      <div className="grid" style={{ gridTemplateColumns: `48px repeat(${vets.length}, minmax(228px,1fr))`, minWidth: 48 + vets.length * 228 }}>
        {/* cabeçalho de colunas */}
        <div className="sticky top-0 left-0 z-20 border-b border-line bg-card-2" />
        {vets.map((vet) => {
          const list = visitsOf(all, vet.id, off)
          const zones = zonesOfDay(list, vet.id, off)
          const load = loadOf(list)
          return (
            <div key={vet.id} className="border-b border-l border-line bg-card-2 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <VetAvatar vetId={vet.id} size={26} />
                <div className="min-w-0 flex-1 leading-tight">
                  <div className="truncate text-[13px] font-semibold text-ink">{vet.short}</div>
                  <div className="text-[11px] text-ink-3 num">
                    {load.count} visitas · {hm(load.service + load.travel)} · {km1(load.km)}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {zones.length ? (
                  zones.map((z) => (
                    <span key={z} className="inline-flex h-5 items-center rounded-[5px] px-1.5 text-[10.5px] font-semibold text-ink" style={{ background: zoneTint(z, 22), boxShadow: `inset 0 -2px 0 ${ZONE[z].hex}` }}>
                      {ZONE[z].short}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex h-5 items-center rounded-[5px] px-1.5 text-[10.5px] font-medium text-ink-3" style={{ background: HATCH }}>
                    Sem rota
                  </span>
                )}
              </div>
              <CapacityBar ratio={load.ratio} className="mt-2" />
            </div>
          )
        })}

        {/* gutter de horas */}
        <div className="sticky left-0 z-10 border-r border-line bg-card" style={{ height: total }}>
          {HOURS.slice(0, -1).map((h) => (
            <div key={h} className="absolute right-1.5 -translate-y-1/2 font-mono text-[10.5px] text-ink-3 num" style={{ top: y(h * 60) + (h === DAY_START / 60 ? 8 : 0) }}>
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
          {off === 0 && (
            <span className="absolute right-1 z-10 -translate-y-1/2 rounded-[4px] bg-terra-600 px-1 font-mono text-[10px] font-medium text-white num" style={{ top: y(NOW_MIN) }}>
              {hhmm(NOW_MIN)}
            </span>
          )}
        </div>

        {vets.map((vet) => (
          <Column key={vet.id} off={off} vetId={vet.id} all={all} freshId={freshId} total={total} />
        ))}
      </div>
    </div>
  )
}

function Column({ off, vetId, all, freshId, total }: { off: number; vetId: string; all: AVisit[]; freshId: string | null; total: number }) {
  const list = visitsOf(all, vetId, off)
  const legs = legsOf(list)
  return (
    <div className="relative border-l border-line" style={{ height: total }}>
      {HOURS.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-line/80" style={{ top: y(h * 60) }} />
      ))}
      {HOURS.slice(0, -1).map((h) => (
        <div key={`h${h}`} className="absolute inset-x-0 border-t border-dashed border-line/50" style={{ top: y(h * 60 + 30) }} />
      ))}
      {/* almoço */}
      <div className="absolute inset-x-0 flex items-center justify-center" style={{ top: y(12 * 60), height: y(13 * 60 + 30) - y(12 * 60), background: HATCH, opacity: 0.55 }}>
        <span className="eyebrow !text-[9.5px] bg-card/80 px-1.5">Almoço</span>
      </div>

      {legs.map((l, i) => {
        const h = Math.max(y(l.endMin) - y(l.startMin), 0)
        if (h < 6) return null
        const from = i ? BAIRRO[list[i - 1].bairro].name : 'Base'
        return (
          <Tip key={`leg${l.toId}`} content={`Deslocamento ${from} → ${BAIRRO[list[i].bairro].name} · ${l.min} min · ${km1(l.km)}`}>
            <div
              className="absolute inset-x-1.5 flex items-center gap-1 overflow-hidden rounded-[5px] border border-dashed border-line-2 px-1.5 text-[10px] text-ink-3 num"
              style={{ top: y(l.startMin), height: h, background: HATCH }}
            >
              {h >= 16 && (
                <>
                  <Navigation size={9} strokeWidth={2} className="shrink-0" />
                  <span className="truncate">
                    {l.min} min · {km1(l.km)}
                  </span>
                </>
              )}
            </div>
          </Tip>
        )
      })}

      {list.map((v) => (
        <TimeBlock key={v.id} v={v} fresh={v.id === freshId} past={off < 0 || (off === 0 && v.startMin + v.dur <= NOW_MIN)} />
      ))}

      {off === 0 && (
        <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: y(NOW_MIN) }}>
          <span className="-ml-1 size-2 rounded-full bg-terra-600 ring-2 ring-card" />
          <span className="h-px flex-1 bg-terra-600" />
        </div>
      )}
    </div>
  )
}

function TimeBlock({ v, fresh, past }: { v: AVisit; fresh: boolean; past: boolean }) {
  const pet = PET[v.petIds[0]]
  const z = ZONE[BAIRRO[v.bairro].zone]
  const h = Math.max((v.dur / 60) * HPX - 2, 24)
  const roomy = h >= 66
  const live = v.status === 'em-atendimento'
  return (
    <motion.div
      initial={fresh ? { opacity: 0, scale: 0.94, y: -8 } : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'absolute inset-x-1.5 z-[5] overflow-hidden rounded-[7px] border bg-card py-1 pr-2 pl-3 shadow-card',
        live ? 'border-terra-500' : 'border-line',
        past && 'bg-card-2',
        fresh && 'ring-2 ring-terra-500',
      )}
      style={{ top: y(v.startMin) + 1, height: h, backgroundImage: `linear-gradient(90deg, ${zoneTint(BAIRRO[v.bairro].zone, past ? 10 : 16)}, transparent 70%)` }}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: z.hex }} />
      <div className="flex items-center gap-1.5">
        <PetAvatar pet={pet} size={roomy ? 20 : 16} />
        <span className="truncate text-[12.5px] font-semibold text-ink">
          {v.petIds.map((id) => PET[id].name).join(' e ')}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {v.fixed && <Lock size={11} strokeWidth={2} className="text-ink-3" />}
          {v.status === 'concluida' && <Check size={12} strokeWidth={2.4} className="text-ok" />}
          {live && <Badge tone="terra" className="!h-[18px] !px-1.5 !text-[10px]">Em atendimento</Badge>}
        </span>
      </div>
      {h >= 40 && (
        <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-3 num">
          {hhmm(v.startMin)}–{hhmm(v.startMin + v.dur)} · {BAIRRO[v.bairro].name}
        </div>
      )}
      {roomy && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="rounded-[4px] bg-paper-2 px-1.5 py-px text-[10.5px] font-medium text-ink-2">{v.type}</span>
          <span className="truncate text-[11px] text-ink-3">{v.reason}</span>
        </div>
      )}
    </motion.div>
  )
}
