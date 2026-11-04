import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, FileText, Pill, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { CLINIC, TUTOR, VET } from '@/data/mock'
import { ageLabel, fmt, TODAY } from '@/data/time'
import { MED, MEDS, type MedDef, type MedEntry } from './data'
import { Btn, Chip, EASE_OUT, Pressable, Sheet } from './kit'
import { Block, StepFrame, StepIntro, SubHead, useIsDesk, type StepProps } from './stepKit'

export function StepPrescricao({ visit, pet, draft, patch, layout }: StepProps) {
  const [picking, setPicking] = React.useState(false)
  const [editing, setEditing] = React.useState<MedEntry | null>(null)
  const [isNew, setIsNew] = React.useState(false)

  const save = (m: MedEntry) => {
    patch((d) => ({ meds: d.meds.some((x) => x.uid === m.uid) ? d.meds.map((x) => (x.uid === m.uid ? m : x)) : [...d.meds, m] }))
    setEditing(null)
  }
  const remove = (uid: string) => {
    patch((d) => ({ meds: d.meds.filter((x) => x.uid !== uid) }))
    setEditing(null)
  }
  const pick = (m: MedDef) => {
    setPicking(false)
    setIsNew(true)
    window.setTimeout(() => setEditing({ uid: `m${Date.now()}`, medId: m.id, dose: m.doses[Math.min(1, m.doses.length - 1)], freq: m.freqs[0], dur: m.durs[0] }), 280)
  }

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow="Etapa 4 de 5" title="Prescrição">
          Dose, frequência e duração em toques
        </StepIntro>
      }
      left={
      <Block title="Medicamentos" hint={draft.meds.length ? `${draft.meds.length} na receita` : 'Nenhum ainda'} bodyClassName="px-2 pb-2">
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {draft.meds.map((m) => {
              const def = MED[m.medId]
              return (
                <motion.div key={m.uid} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }} className="overflow-hidden">
                  <Pressable
                    scale={0.985}
                    onClick={() => {
                      setIsNew(false)
                      setEditing(m)
                    }}
                    className="flex w-full items-start gap-3 rounded-[22px] px-3 py-3 text-left active:bg-surface"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-ink">
                      <Pill className="size-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[16px] font-bold text-ink">
                          {def.name} <span className="font-semibold text-ink-3">{def.conc}</span>
                        </span>
                        {m.keep && <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11.5px] font-bold text-blue">Em uso</span>}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {[m.dose, m.freq, m.dur].map((t) => (
                          <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-[12.5px] font-semibold text-ink-2">
                            {t}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ChevronRight className="mt-3 size-[18px] shrink-0 text-ink-4" />
                  </Pressable>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <div className="px-1 pt-2 pb-1">
          <Btn tone="subtle" className="h-[52px] w-full" onClick={() => setPicking(true)}>
            <Plus className="size-5" /> Adicionar medicamento
          </Btn>
        </div>
      </Block>
      }
      right={
        draft.meds.length > 0 ? (
        <>
          <SubHead
            aside={
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 text-[12.5px] font-bold text-ink shadow-pill">
                <FileText className="size-3.5" strokeWidth={2.2} /> PDF para o tutor
              </span>
            }
          >
            Receita
          </SubHead>
          <RxCard>
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <div className="min-w-0 leading-tight">
                <div className="text-[16px] font-bold text-ink">{CLINIC.name}</div>
                <div className="num text-[12.5px] font-medium text-ink-3">WhatsApp {CLINIC.whatsapp}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { l: 'Paciente', v: `${pet.name}, ${pet.species === 'cão' ? 'canino' : 'felino'}` },
                { l: 'Peso', v: `${draft.weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg` },
                { l: 'Idade', v: ageLabel(pet.birth) },
                { l: 'Tutor', v: TUTOR[visit.tutorId].name },
              ].map((x) => (
                <div key={x.l} className="min-w-0 rounded-[16px] bg-surface px-3 py-2">
                  <div className="text-[11.5px] font-medium text-ink-3">{x.l}</div>
                  <div className="truncate text-[13.5px] font-bold text-ink">{x.v}</div>
                </div>
              ))}
            </div>
            <ol className="mt-4 flex flex-col gap-3">
              {draft.meds.map((m, i) => {
                const def = MED[m.medId]
                return (
                  <li key={m.uid} className="flex gap-3">
                    <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-black text-[12.5px] font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1 text-[14px] leading-snug">
                      <div className="font-bold text-ink">
                        {def.name} {def.conc} <span className="font-semibold text-ink-3">· {m.dur.toLowerCase()}</span>
                      </div>
                      <div className="font-medium text-ink-2">
                        Dar {m.dose.toLowerCase()}{m.dose.toLowerCase().includes(def.form.split(' ')[0]) ? '' : ` (${def.form})`} {m.freq.toLowerCase()}
                        {def.hint ? `. ${def.hint}.` : '.'}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="mt-5 flex items-end justify-between gap-4 border-t border-line pt-4">
              <div className="text-[12.5px] font-medium text-ink-3">Manaus, {fmt.short(TODAY)}</div>
              <div className="text-right">
                <div className="text-[13.5px] font-bold text-ink">{VET[visit.vetId].name}</div>
                <div className="text-[12px] font-medium text-ink-3">{VET[visit.vetId].crmv}</div>
              </div>
            </div>
          </RxCard>
        </>
        ) : undefined
      }
      extra={
        <>
          <MedPicker open={picking} onOpenChange={setPicking} species={pet.species} onPick={pick} />
          <MedEditor entry={editing} isNew={isNew} onClose={() => setEditing(null)} onSave={save} onRemove={remove} />
        </>
      }
    />
  )
}

function RxCard({ children }: { children: React.ReactNode }) {
  const desk = useIsDesk()
  return <div className={cn('bg-card p-5 shadow-card', desk ? 'rounded-[24px]' : 'mx-4 rounded-[28px]')}>{children}</div>
}

function MedPicker({ open, onOpenChange, species, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; species: 'cão' | 'gato'; onPick: (m: MedDef) => void }) {
  const [q, setQ] = React.useState('')
  const list = MEDS.filter((m) => m.species.includes(species) && (m.name + m.group).toLowerCase().includes(q.toLowerCase()))
  const groups = [...new Set(list.map((m) => m.group))]
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Adicionar medicamento" description="Lista da clínica">
      <label className="sticky top-0 z-10 mb-2 flex h-12 items-center gap-2 rounded-full bg-muted px-4 text-ink-3">
        <Search className="size-[18px]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="h-full flex-1 bg-transparent text-[16px] font-medium text-ink outline-none placeholder:text-ink-4" />
      </label>
      {groups.map((g) => (
        <div key={g} className="pt-3">
          <div className="pb-1 text-[13px] font-bold text-ink-3">{g}</div>
          {list
            .filter((m) => m.group === g)
            .map((m) => (
              <Pressable key={m.id} scale={0.985} onClick={() => onPick(m)} className="flex min-h-[52px] w-full items-center gap-3 border-b border-line py-2 text-left last:border-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15.5px] font-bold text-ink">
                    {m.name} <span className="font-semibold text-ink-3">{m.conc}</span>
                  </span>
                  <span className="block text-[13px] font-medium text-ink-3">{m.form}</span>
                </span>
                <span className="flex size-9 items-center justify-center rounded-full bg-black text-lime">
                  <Plus className="size-[18px]" strokeWidth={2.4} />
                </span>
              </Pressable>
            ))}
        </div>
      ))}
      {list.length === 0 && <p className="py-6 text-center text-[14px] font-medium text-ink-3">Nada encontrado</p>}
    </Sheet>
  )
}

function MedEditor({ entry, isNew, onClose, onSave, onRemove }: { entry: MedEntry | null; isNew: boolean; onClose: () => void; onSave: (m: MedEntry) => void; onRemove: (uid: string) => void }) {
  const [m, setM] = React.useState<MedEntry | null>(entry)
  React.useEffect(() => {
    if (entry) setM(entry)
  }, [entry])
  if (!m) return null
  const def = MED[m.medId]
  const group = (label: string, k: 'dose' | 'freq' | 'dur', options: string[]) => (
    <div key={k} className="pt-4 first:pt-0">
      <div className="mb-2 text-[13px] font-semibold text-ink-3">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} on={m[k] === o} onClick={() => setM({ ...m, [k]: o })}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  )
  return (
    <Sheet
      open={!!entry}
      onOpenChange={(o) => !o && onClose()}
      title={`${def.name} ${def.conc}`}
      description={def.hint ?? def.form}
      footer={
        <div className="flex gap-2.5">
          {!isNew && (
            <Btn tone="danger" className="shrink-0" onClick={() => onRemove(m.uid)}>
              {m.keep ? 'Suspender' : 'Remover'}
            </Btn>
          )}
          <Btn className="flex-1" onClick={() => onSave(m)}>
            {isNew ? 'Adicionar à receita' : 'Salvar'}
          </Btn>
        </div>
      }
    >
      {group('Dose', 'dose', def.doses)}
      {group('Frequência', 'freq', def.freqs)}
      {group('Duração', 'dur', def.durs)}
    </Sheet>
  )
}
