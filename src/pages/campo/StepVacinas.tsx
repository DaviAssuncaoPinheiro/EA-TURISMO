import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, ScanLine, Syringe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import { VACCINE } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { useDemo } from '@/store'
import { expiryFor, lotFor, VACCINE_LAB, vName } from './data'
import { Btn, EASE_OUT, Pressable, Sheet, Toggle } from './kit'
import { Block, StepFrame, StepIntro, type StepProps } from './stepKit'
import { vaccineRows, type VaccineRow } from './vaccines'

export function StepVacinas({ pet, draft, patch, layout }: StepProps) {
  const extra = useDemo((s) => s.extraDoses)
  const rows = React.useMemo(() => vaccineRows(pet, extra), [pet, extra])
  const [scanning, setScanning] = React.useState<string | null>(null)
  const [showOk, setShowOk] = React.useState(layout === 'desktop')

  const setPlan = (vid: string, apply: boolean) => {
    patch((d) => ({ vaccines: { ...d.vaccines, [vid]: { ...d.vaccines[vid], apply } } }))
    if (apply && !draft.vaccines[vid]?.lot) window.setTimeout(() => setScanning(vid), 260)
  }
  const appliedCount = Object.values(draft.vaccines).filter((p) => p.apply).length

  const pendentes = rows.due.length > 0 && (
        <Block title="Pendentes" bodyClassName="px-2 pb-2">
          <div className="flex flex-col gap-1">
            {rows.due.map((r) => (
              <VaccineItem key={r.vaccineId} row={r} plan={draft.vaccines[r.vaccineId]} onToggle={(v) => setPlan(r.vaccineId, v)} onScan={() => setScanning(r.vaccineId)} />
            ))}
          </div>
        </Block>
      )
  const emDia = rows.ok.length > 0 && (
        <Block bodyClassName="px-2 py-2">
          <Pressable scale={0.99} onClick={() => setShowOk((o) => !o)} className="flex h-12 w-full items-center justify-between px-3 text-left">
            <span className="flex items-center gap-2 text-[17px] font-bold tracking-[-0.02em] text-ink">
              Em dia <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-[12px] font-bold text-ink-3">{rows.ok.length}</span>
            </span>
            <span className="flex size-9 items-center justify-center rounded-full bg-muted">
              <ChevronDown className={cn('size-[18px] text-ink transition-transform', showOk && 'rotate-180')} />
            </span>
          </Pressable>
          <AnimatePresence initial={false}>
            {showOk && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }} className="overflow-hidden">
                <div className="flex flex-col gap-1 pt-1">
                  {[...rows.ok, ...rows.never].map((r) => (
                    <VaccineItem key={r.vaccineId} row={r} plan={draft.vaccines[r.vaccineId]} onToggle={(v) => setPlan(r.vaccineId, v)} onScan={() => setScanning(r.vaccineId)} anticipate />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Block>
      )
  const count = appliedCount > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pt-3 text-center text-[13.5px] font-medium text-ink-3">
          {appliedCount} {appliedCount === 1 ? 'vacina vai' : 'vacinas vão'} para a carteira digital
        </motion.p>
      )

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow="Etapa 3 de 5" title="Vacinas">
          {rows.due.length ? `${rows.due.length} ${rows.due.length === 1 ? 'pendente' : 'pendentes'} para ${pet.name}` : `Carteira de ${pet.name} em dia`}
        </StepIntro>
      }
      left={
        pendentes ? (
          pendentes
        ) : (
          <>
            {emDia}
            {count}
          </>
        )
      }
      right={
        pendentes ? (
          <>
            {emDia}
            {count}
          </>
        ) : undefined
      }
      extra={
      <ScanSheet
        vaccineId={scanning}
        petId={pet.id}
        onClose={() => setScanning(null)}
        onDone={(vid, lot, lab, expiry) => {
          patch((d) => ({ vaccines: { ...d.vaccines, [vid]: { apply: true, lot, lab, expiry } } }))
          setScanning(null)
        }}
      />
      }
    />
  )
}

function VaccineItem({ row, plan, onToggle, onScan, anticipate }: { row: VaccineRow; plan?: { apply: boolean; lot?: string; lab?: string; expiry?: string }; onToggle: (v: boolean) => void; onScan: () => void; anticipate?: boolean }) {
  const v = VACCINE[row.vaccineId]
  const on = !!plan?.apply
  return (
    <div className={cn('rounded-[22px] px-3 py-3 transition-colors', on && 'bg-lime-soft')}>
      <div className="flex items-center gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'bg-lime text-ink' : row.state?.key === 'late' ? 'bg-red-soft text-red' : row.state?.key === 'soon' ? 'bg-yellow-soft text-yellow-ink' : 'bg-muted text-ink-3')}>
          {on ? <Check className="size-5" strokeWidth={2.4} /> : <Syringe className="size-[18px]" strokeWidth={1.9} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[16px] font-bold text-ink">{vName(row.vaccineId)}</span>
            {row.state && row.state.key !== 'ok' && <Badge tone={row.state.tone}>{row.state.label}</Badge>}
          </div>
          <div className="mt-0.5 text-[13px] font-medium text-ink-3">
            {row.last ? (
              <>
                Última em {fmt.short(row.last.date)}
                {row.state?.key === 'ok' && <> · próxima {relDays(row.last.nextDate)}</>}
              </>
            ) : (
              'Nunca aplicada'
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Toggle checked={on} onChange={onToggle} label={`Aplicar ${vName(row.vaccineId)}`} />
          <span className="text-[11.5px] font-semibold text-ink-3">{anticipate ? 'Antecipar' : 'Aplicar'}</span>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {on && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="overflow-hidden">
            {plan?.lot ? (
              <div className="mt-3 ml-14 flex items-center gap-3 rounded-[18px] bg-card px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-ink-3">Lote · {plan.lab}</div>
                  <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="num text-[18px] font-bold tracking-[0.02em] text-ink">
                    {plan.lot}
                  </motion.div>
                  <div className="text-[12px] font-medium text-ink-3">Validade {plan.expiry}</div>
                </div>
                <Pressable onClick={onScan} className="flex h-10 items-center gap-1.5 rounded-full bg-muted px-3.5 text-[13px] font-bold text-ink">
                  <ScanLine className="size-4" /> Reler
                </Pressable>
              </div>
            ) : (
              <Pressable onClick={onScan} className="mt-3 ml-14 flex h-12 w-[calc(100%-3.5rem)] items-center justify-center gap-2 rounded-full bg-black text-[15px] font-semibold text-white">
                <ScanLine className="size-[18px] text-lime" /> Ler etiqueta do lote
              </Pressable>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1]
  let x = 0
  return (
    <svg viewBox="0 0 90 26" className="h-7 w-[110px]" aria-hidden>
      {bars.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={26} fill="#111214" /> : null
        x += w + 0.6
        return r
      })}
    </svg>
  )
}

function ScanSheet({ vaccineId, petId, onClose, onDone }: { vaccineId: string | null; petId: string; onClose: () => void; onDone: (vid: string, lot: string, lab: string, expiry: string) => void }) {
  const [phase, setPhase] = React.useState<'scan' | 'done'>('scan')
  const [vid, setVid] = React.useState<string | null>(vaccineId)
  React.useEffect(() => {
    if (!vaccineId) return
    setVid(vaccineId)
    setPhase('scan')
    const t = window.setTimeout(() => setPhase('done'), 1900)
    return () => window.clearTimeout(t)
  }, [vaccineId])
  if (!vid) return null
  const v = VACCINE[vid]
  const meta = VACCINE_LAB[vid]
  const lot = lotFor(vid, petId)
  const expiry = expiryFor(vid)
  return (
    <Sheet
      dark
      open={!!vaccineId}
      onOpenChange={(o) => !o && onClose()}
      title="Ler etiqueta do lote"
      description={`${vName(vid)} · ${meta.lab} ${meta.product}`}
      footer={
        <Btn tone={phase === 'done' ? 'lime' : 'dark'} className="w-full" disabled={phase !== 'done'} onClick={() => onDone(vid, lot, `${meta.lab} · ${meta.product}`, expiry)}>
          {phase === 'done' ? (
            <>
              <Check className="size-5" /> Usar estes dados
            </>
          ) : (
            'Procurando etiqueta'
          )}
        </Btn>
      }
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_50%_40%,#3a3d44_0%,#16181b_70%)]">
        {/* frasco/etiqueta */}
        <motion.div
          initial={{ rotate: -7, scale: 0.92, y: 8 }}
          animate={{ rotate: phase === 'done' ? -3 : [-7, -5, -7], scale: 1, y: 0 }}
          transition={phase === 'done' ? { duration: 0.4 } : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-card p-3 text-ink shadow-[0_20px_40px_rgba(0,0,0,.45)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold">{meta.product}</span>
            <span className="text-[10px] font-semibold text-ink-3">{meta.lab}</span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-ink-2">{vName(vid)} · uso veterinário · 1 dose</div>
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="num text-[10.5px] leading-tight font-medium">
              <div>
                Lote <b>{lot}</b>
              </div>
              <div>Val. {expiry}</div>
            </div>
            <Barcode />
          </div>
        </motion.div>
        {/* moldura de foco */}
        <div className="pointer-events-none absolute inset-[14%_10%]">
          {['top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl', 'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl', 'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl', 'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl'].map((c) => (
            <span key={c} className={cn('absolute size-7 transition-colors duration-300', c, phase === 'done' ? 'border-lime' : 'border-white/85')} />
          ))}
          {phase === 'scan' && (
            <motion.span
              className="absolute inset-x-2 h-[2px] rounded-full bg-lime shadow-[0_0_14px_4px_rgba(216,243,90,.55)]"
              initial={{ top: '8%' }}
              animate={{ top: ['8%', '92%', '8%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>
        <AnimatePresence>
          {phase === 'done' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-x-0 bottom-3 flex justify-center">
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[13.5px] font-bold text-ink">
                <Check className="size-4" strokeWidth={2.6} /> Etiqueta lida
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { l: 'Lote', v: lot },
          { l: 'Validade', v: expiry },
        ].map((x) => (
          <div key={x.l} className="rounded-[20px] bg-white/[0.07] px-4 py-3">
            <div className="text-[12px] font-medium text-white/55">{x.l}</div>
            <div className="num mt-0.5 h-6 text-[17px] font-bold tracking-[0.02em]">
              {phase === 'done' ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {x.v}
                </motion.span>
              ) : (
                <span className="inline-block h-4 w-24 animate-pulse rounded-full bg-white/10" />
              )}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
