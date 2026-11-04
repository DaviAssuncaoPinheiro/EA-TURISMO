import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Pill, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { CLINIC, TUTOR, VET } from '@/data/mock'
import { ageLabel, fmt, TODAY } from '@/data/time'
import { MED, MEDS, type MedDef, type MedEntry } from './data'
import { Btn, Chip, EASE_OUT, Pressable, Sheet } from './kit'
import { Block, StepIntro, type StepProps } from './stepKit'

export function StepPrescricao({ visit, pet, draft, patch }: StepProps) {
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
    <div className="pb-2">
      <StepIntro eyebrow="Etapa 4 de 5" title="Prescrição">
        Escolha o medicamento e toque na dose, frequência e duração. A receita é montada sozinha.
      </StepIntro>

      <Block title="Medicamentos" hint={draft.meds.length ? `${draft.meds.length} na receita` : 'Nenhum medicamento ainda'} className="pb-0">
        <div className="-mx-4 divide-y divide-line">
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
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-800">
                      <Pill className="size-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[16px] font-semibold text-ink">
                          {def.name} <span className="font-normal text-ink-2">{def.conc}</span>
                        </span>
                        {m.keep && <span className="rounded-full bg-info-bg px-2 py-0.5 text-[11.5px] font-semibold text-info">Em uso · manter</span>}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        {[m.dose, m.freq, m.dur].map((t) => (
                          <span key={t} className="rounded-md bg-paper-2 px-1.5 py-0.5 text-[13px] text-ink-2">
                            {t}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ChevronRight className="mt-2.5 size-[18px] shrink-0 text-ink-4" />
                  </Pressable>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <div className="py-3">
          <Btn tone="outline" className="w-full" onClick={() => setPicking(true)}>
            <Plus className="size-5" /> Adicionar medicamento
          </Btn>
        </div>
      </Block>

      {draft.meds.length > 0 && (
        <>
          <div className="px-5 pt-6 pb-2 text-[13px] font-semibold tracking-[0.01em] text-ink-3 uppercase">Prévia da receita</div>
          <div className="paper-grain mx-4 rounded-[6px] border border-line-2 bg-[#fdfaf2] px-5 pt-4 pb-5 shadow-lift">
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <LogoMark size={30} />
              <div className="leading-tight">
                <div className="font-display text-[16px] font-semibold text-ink">{CLINIC.name}</div>
                <div className="text-[11.5px] text-ink-3">
                  Atendimento domiciliar · {CLINIC.city} · {CLINIC.whatsapp}
                </div>
              </div>
            </div>
            <div className="pt-3 text-center font-mono text-[10.5px] tracking-[0.14em] text-ink-3 uppercase">Receituário · uso veterinário</div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[12.5px] text-ink-2">
              <div>
                <b className="text-ink">Paciente:</b> {pet.name}
              </div>
              <div>
                <b className="text-ink">Espécie:</b> {pet.species === 'cão' ? 'Canina' : 'Felina'}
              </div>
              <div>
                <b className="text-ink">Idade:</b> {ageLabel(pet.birth)}
              </div>
              <div>
                <b className="text-ink">Peso:</b> {draft.weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
              </div>
              <div className="col-span-2 truncate">
                <b className="text-ink">Tutor:</b> {TUTOR[visit.tutorId].name}
              </div>
            </div>
            <div className="mt-3 text-[12px] font-semibold text-ink-3">Uso oral</div>
            <ol className="mt-1 flex flex-col gap-2.5">
              {draft.meds.map((m, i) => {
                const def = MED[m.medId]
                return (
                  <li key={m.uid} className="text-[14px] leading-snug text-ink">
                    <div className="flex items-baseline gap-1">
                      <span className="font-semibold">
                        {i + 1}. {def.name} {def.conc}
                      </span>
                      <span className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-ink-4" />
                      <span className="shrink-0 text-[12.5px] text-ink-2">{m.dur.toLowerCase()}</span>
                    </div>
                    <div className="text-ink-2">
                      Dar {m.dose.toLowerCase()} ({def.form}) {m.freq.toLowerCase()}
                      {def.hint ? `. ${def.hint}.` : '.'}
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="text-[12px] text-ink-3">Manaus, {fmt.long(TODAY).replace(/^[^,]+, /, '')}</div>
              <div className="text-center">
                <div className="font-display-tight text-[20px] leading-none text-sage-800 italic">{VET[visit.vetId].name.replace(/^Dra?\. /, '')}</div>
                <div className="mt-1 w-36 border-t border-ink-3 pt-1 text-[11px] text-ink-2">
                  {VET[visit.vetId].name}
                  <br />
                  <span className="font-mono">{VET[visit.vetId].crmv}</span>
                </div>
              </div>
            </div>
          </div>
          <p className="px-6 pt-3 text-center text-[13px] text-ink-3">O tutor recebe a receita em PDF junto com o resumo da visita.</p>
        </>
      )}

      <MedPicker open={picking} onOpenChange={setPicking} species={pet.species} onPick={pick} />
      <MedEditor entry={editing} isNew={isNew} onClose={() => setEditing(null)} onSave={save} onRemove={remove} />
    </div>
  )
}

function MedPicker({ open, onOpenChange, species, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; species: 'cão' | 'gato'; onPick: (m: MedDef) => void }) {
  const [q, setQ] = React.useState('')
  const list = MEDS.filter((m) => m.species.includes(species) && (m.name + m.group).toLowerCase().includes(q.toLowerCase()))
  const groups = [...new Set(list.map((m) => m.group))]
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Adicionar medicamento" description="Lista da clínica · doses padrão por espécie">
      <label className="sticky top-0 z-10 -mx-1 mb-2 flex h-11 items-center gap-2 rounded-[12px] bg-paper-2 px-3 text-ink-3">
        <Search className="size-[18px]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou grupo" className="h-full flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-4" />
      </label>
      {groups.map((g) => (
        <div key={g} className="pt-2">
          <div className="pb-1 text-[12.5px] font-semibold tracking-[0.04em] text-ink-3 uppercase">{g}</div>
          {list
            .filter((m) => m.group === g)
            .map((m) => (
              <Pressable key={m.id} scale={0.985} onClick={() => onPick(m)} className="flex min-h-[52px] w-full items-center gap-3 border-b border-line py-2 text-left last:border-0">
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-medium text-ink">
                    {m.name} <span className="text-ink-2">{m.conc}</span>
                  </span>
                  <span className="block text-[13px] text-ink-3">{m.form}</span>
                </span>
                <Plus className="size-5 text-sage-700" />
              </Pressable>
            ))}
        </div>
      ))}
      {list.length === 0 && <p className="py-6 text-center text-[14px] text-ink-3">Nada encontrado para “{q}”.</p>}
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
      <div className="mb-2 text-[13.5px] font-medium text-ink-3">{label}</div>
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
            <Btn tone="subtle" className={cn('shrink-0 text-late')} onClick={() => onRemove(m.uid)}>
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
