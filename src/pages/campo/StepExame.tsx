import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, ArrowDown, ArrowUp, HeartPulse, Scale, Thermometer, Trash, Wind } from 'lucide-react'
import { cn, kg } from '@/lib/utils'
import { HIDRATACAO, MUCOSAS, REF, TPC, FINDINGS, type Region } from './data'
import type { Finding } from './campoStore'
import { BcsPicker, BodyMap } from './BodyMap'
import { Btn, Chip, EASE_OUT, NumberStepper, Pressable, Sheet } from './kit'
import { Block, StepIntro, type StepProps } from './stepKit'

const tone = (v: number, [lo, hi]: [number, number]) => (v < lo || v > hi ? 'late' : undefined)
const ref = (r: [number, number], unit: string, dec = 0) => `Ref. ${r[0].toLocaleString('pt-BR', { minimumFractionDigits: dec })}–${r[1].toLocaleString('pt-BR', { minimumFractionDigits: dec })} ${unit}`

function ChipRow<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="pt-3 first:pt-0">
      <div className="mb-2 text-[13.5px] font-medium text-ink-3">{label}</div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" data-noswipe>
        {options.map((o) => (
          <Chip key={o} size="sm" on={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function StepExame({ pet, draft, patch }: StepProps) {
  const r = REF[pet.species]
  const delta = +(draft.weight - draft.prevWeight).toFixed(1)
  const [lo, hi] = pet.idealKg
  const towardIdeal = (draft.prevWeight > hi && delta < 0) || (draft.prevWeight < lo && delta > 0)
  const [editing, setEditing] = React.useState<Finding | null>(null)

  const addFinding = (x: number, y: number, region: Region) => {
    const n = (draft.findings.at(-1)?.n ?? 0) + 1
    const f: Finding = { id: `f${Date.now()}`, n, x, y, region, tags: [], note: '' }
    patch((d) => ({ findings: [...d.findings, f] }))
    setEditing(f)
  }
  const saveFinding = (f: Finding) => {
    patch((d) => ({ findings: d.findings.map((x) => (x.id === f.id ? f : x)) }))
    setEditing(null)
  }
  const removeFinding = (id: string) => {
    patch((d) => ({ findings: d.findings.filter((x) => x.id !== id) }))
    setEditing(null)
  }

  return (
    <div className="pb-2">
      <StepIntro eyebrow="Etapa 2 de 5" title="Exame físico">
        Toque em − e + ou segure para ajustar rápido. Valores fora da referência ficam em vermelho.
      </StepIntro>

      <Block className="pb-0">
        <NumberStepper
          label="Peso"
          icon={<Scale className="size-3.5" />}
          value={draft.weight}
          onChange={(n) => patch({ weight: n })}
          step={0.1}
          min={0.3}
          max={90}
          decimals={1}
          unit="kg"
          extra={
            <div className="mt-1.5 flex justify-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={delta === 0 ? 'eq' : delta > 0 ? 'up' : 'down'}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[13px] font-semibold',
                    delta === 0 ? 'bg-paper-2 text-ink-3' : towardIdeal ? 'bg-ok-bg text-ok' : 'bg-warn-bg text-warn',
                  )}
                >
                  {delta < 0 ? <ArrowDown className="size-3.5" strokeWidth={2.6} /> : delta > 0 ? <ArrowUp className="size-3.5" strokeWidth={2.6} /> : null}
                  {delta === 0 ? `Igual ao último (${kg(draft.prevWeight)})` : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg vs ${kg(draft.prevWeight)}`}
                </motion.span>
              </AnimatePresence>
            </div>
          }
          hint={`Ideal ${lo.toLocaleString('pt-BR')}–${hi.toLocaleString('pt-BR')} kg`}
        />
      </Block>

      <Block className="pb-0">
        <div className="divide-y divide-line">
          <NumberStepper label="Temperatura" icon={<Thermometer className="size-3.5" />} value={draft.temp} onChange={(n) => patch({ temp: n })} step={0.1} min={34} max={42} decimals={1} unit="°C" hint={ref(r.temp, '°C', 1)} tone={tone(draft.temp, r.temp)} />
          <NumberStepper label="Frequência cardíaca" icon={<HeartPulse className="size-3.5" />} value={draft.fc} onChange={(n) => patch({ fc: n })} step={2} min={20} max={300} unit="bpm" hint={ref(r.fc, 'bpm')} tone={tone(draft.fc, r.fc)} />
          <NumberStepper label="Frequência respiratória" icon={<Wind className="size-3.5" />} value={draft.fr} onChange={(n) => patch({ fr: n })} step={2} min={4} max={120} unit="mpm" hint={ref(r.fr, 'mpm')} tone={tone(draft.fr, r.fr)} />
        </div>
      </Block>

      <Block title="Mucosas, hidratação e perfusão">
        <ChipRow label="Mucosas" options={MUCOSAS} value={draft.mucosa} onChange={(v) => patch({ mucosa: v })} />
        <ChipRow label="Hidratação" options={HIDRATACAO} value={draft.hidratacao} onChange={(v) => patch({ hidratacao: v })} />
        <ChipRow label="Tempo de preenchimento capilar" options={TPC} value={draft.tpc} onChange={(v) => patch({ tpc: v })} />
      </Block>

      <Block title="Escore de condição corporal" hint={`Último registro: ${pet.bcs}/9`}>
        <BcsPicker value={draft.bcs} onChange={(n) => patch({ bcs: n })} />
      </Block>

      <Block title="Achados no corpo" hint={`Toque na silhueta para marcar · ${pet.species === 'gato' ? 'felino' : 'canino'}`} action={<Activity className="mt-1 size-[18px] text-ink-4" />}>
        <BodyMap species={pet.species} findings={draft.findings} onAdd={addFinding} onOpen={setEditing} />
        {draft.findings.length === 0 ? (
          <p className="mt-1 text-center text-[13.5px] text-ink-3">Nenhum achado marcado. Sem alterações, é só seguir.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {draft.findings.map((f) => (
                <motion.li key={f.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: EASE_OUT }}>
                  <Pressable onClick={() => setEditing(f)} scale={0.98} className="flex w-full items-start gap-3 rounded-[14px] bg-card-2 px-3 py-2.5 text-left">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-terra-600 text-[12px] font-bold text-white">{f.n}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold text-ink">{f.region}</span>
                      <span className="block text-[14px] text-ink-2">{[...f.tags, f.note].filter(Boolean).join(' · ') || 'Toque para descrever'}</span>
                    </span>
                  </Pressable>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Block>

      <FindingSheet cardio={!!pet.conditions?.some((c) => /mitral|card/i.test(c))} finding={editing} onClose={() => setEditing(null)} onSave={saveFinding} onRemove={removeFinding} />
    </div>
  )
}

function FindingSheet({ finding, onClose, onSave, onRemove, cardio }: { cardio: boolean; finding: Finding | null; onClose: () => void; onSave: (f: Finding) => void; onRemove: (id: string) => void }) {
  const [f, setF] = React.useState<Finding | null>(finding)
  React.useEffect(() => {
    if (finding) setF(finding)
  }, [finding])
  if (!f) return null
  const toggle = (t: string) => setF({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })
  return (
    <Sheet
      open={!!finding}
      onOpenChange={(o) => !o && onClose()}
      title={`Achado ${f.n} · ${f.region}`}
      description="Escolha o que encontrou e, se quiser, descreva."
      footer={
        <div className="flex gap-2.5">
          <Btn tone="subtle" className="w-[56px] shrink-0 px-0 text-late" onClick={() => onRemove(f.id)} aria-label="Remover achado">
            <Trash className="size-5" />
          </Btn>
          <Btn className="flex-1" onClick={() => onSave(f)}>
            Salvar achado
          </Btn>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        {FINDINGS[f.region].map((t) => (
          <Chip key={t} on={f.tags.includes(t)} onClick={() => toggle(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <textarea
        value={f.note}
        onChange={(e) => setF({ ...f, note: e.target.value })}
        rows={3}
        placeholder="Ex.: grau III/VI, foco mitral, sem frêmito"
        className="mt-4 w-full resize-none rounded-[12px] border border-line bg-card-2 px-3 py-2.5 text-[16px] text-ink outline-none placeholder:text-ink-4 focus:border-sage-500"
      />
      {cardio && f.region === 'Tórax' && !f.note && (
        <button onClick={() => setF({ ...f, tags: f.tags.includes('Sopro sistólico') ? f.tags : [...f.tags, 'Sopro sistólico'], note: 'Grau III/VI em foco mitral, sem alteração desde a última consulta' })} className="mt-2 text-[14px] font-medium text-sage-700">
          Usar descrição da última consulta
        </button>
      )}
    </Sheet>
  )
}
