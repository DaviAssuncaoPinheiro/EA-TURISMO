import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarPlus, Check, MapPin, Search, Sparkles, X } from 'lucide-react'
import { Badge, Button, PetAvatar, Segmented, VetAvatar } from '@/components/ui'
import { BAIRRO, BAIRROS, ZONE, ZONES } from '@/data/geo'
import { PET, PETS, TUTOR, VET, type VisitType } from '@/data/mock'
import { cn } from '@/lib/utils'
import { dayLabel, hhmm, km1, suggest, type AVisit, type Suggestion } from './model'
import { ZoneChip } from './shared'

const TYPE_OPTIONS: { type: VisitType; dur: number }[] = [
  { type: 'Consulta', dur: 50 },
  { type: 'Vacinação', dur: 35 },
  { type: 'Retorno', dur: 35 },
  { type: 'Check-up', dur: 45 },
  { type: 'Coleta de exames', dur: 30 },
  { type: 'Curativo', dur: 30 },
]

type Urgency = 'rotina' | 'semana' | 'urgente'

export function ScheduleDialog({ open, onOpenChange, all, onConfirm }: { open: boolean; onOpenChange: (v: boolean) => void; all: AVisit[]; onConfirm: (v: AVisit, s: Suggestion) => void }) {
  const [q, setQ] = React.useState('')
  const [petId, setPetId] = React.useState<string | null>(null)
  const [bairro, setBairro] = React.useState('')
  const [type, setType] = React.useState<VisitType>('Consulta')
  const [reason, setReason] = React.useState('')
  const [urgency, setUrgency] = React.useState<Urgency>('semana')
  const [sel, setSel] = React.useState<string | null>(null)
  const [focus, setFocus] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setQ('')
      setPetId(null)
      setBairro('')
      setType('Consulta')
      setReason('')
      setUrgency('semana')
      setSel(null)
    }
  }, [open])

  const dur = TYPE_OPTIONS.find((t) => t.type === type)!.dur
  const results = React.useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return PETS.slice(0, 5)
    return PETS.filter((p) => `${p.name} ${p.breed} ${TUTOR[p.tutorId].name}`.toLowerCase().includes(t)).slice(0, 6)
  }, [q])
  const pet = petId ? PET[petId] : null
  const sugs = React.useMemo(() => (bairro ? suggest(all, bairro, urgency, dur) : []), [all, bairro, urgency, dur])

  React.useEffect(() => {
    setSel(sugs[0]?.key ?? null)
  }, [sugs])

  const chosen = sugs.find((s) => s.key === sel)
  const canConfirm = !!pet && !!chosen

  const pick = (id: string) => {
    setPetId(id)
    setBairro(TUTOR[PET[id].tutorId].bairro)
    setFocus(false)
    setQ('')
  }

  const confirm = () => {
    if (!pet || !chosen) return
    onConfirm(
      {
        id: `n-${Date.now()}`,
        vetId: chosen.vetId,
        off: chosen.off,
        startMin: chosen.startMin,
        dur,
        petIds: [pet.id],
        tutorId: pet.tutorId,
        bairro,
        type,
        reason: reason.trim() || `${type} · encaixe pela agenda`,
        status: 'agendada',
        fixed: false,
        origin: 'encaixe',
      },
      chosen,
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-sage-950/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-card shadow-float outline-none md:inset-0 md:m-auto md:h-fit md:max-h-[88dvh] md:max-w-[940px] md:rounded-2xl"
              >
                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 md:px-6">
                  <div>
                    <Dialog.Title className="font-display text-[22px] leading-tight font-medium text-ink">Encaixar novo pedido</Dialog.Title>
                    <p className="mt-1 text-[13px] text-ink-2">Escolha o bairro e veja quando a equipe já estará por perto.</p>
                  </div>
                  <Dialog.Close className="-mr-2 rounded-md p-2 text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Fechar">
                    <X size={18} strokeWidth={1.8} />
                  </Dialog.Close>
                </div>

                <div className="scroll-thin grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[360px_1fr]">
                  {/* formulário */}
                  <div className="space-y-5 border-line p-5 md:border-r md:p-6">
                    <Field label="Paciente">
                      {pet ? (
                        <div className="flex items-center gap-3 rounded-lg border border-line-2 bg-card-2 p-2.5">
                          <PetAvatar pet={pet} size={36} />
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="text-[13.5px] font-semibold text-ink">{pet.name}</div>
                            <div className="truncate text-[12px] text-ink-3">
                              {pet.breed} · {TUTOR[pet.tutorId].name}
                            </div>
                          </div>
                          <button onClick={() => setPetId(null)} className="rounded-md px-2 py-1 text-[12px] font-medium text-ink-2 hover:bg-paper-2">
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search size={15} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
                          <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onFocus={() => setFocus(true)}
                            placeholder="Buscar por pet ou tutor"
                            className="h-10 w-full rounded-lg border border-line-2 bg-card pr-3 pl-9 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-sage-600"
                          />
                          {(focus || q) && (
                            <div className="mt-1.5 overflow-hidden rounded-lg border border-line bg-card shadow-lift">
                              {results.length === 0 && <div className="px-3 py-3 text-[13px] text-ink-3">Nenhum paciente com esse nome.</div>}
                              {results.map((p) => (
                                <button key={p.id} onClick={() => pick(p.id)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-paper-2/70">
                                  <PetAvatar pet={p} size={28} />
                                  <span className="min-w-0 flex-1 leading-tight">
                                    <span className="block text-[13px] font-medium text-ink">{p.name}</span>
                                    <span className="block truncate text-[11.5px] text-ink-3">
                                      {TUTOR[p.tutorId].name} · {BAIRRO[TUTOR[p.tutorId].bairro].name}
                                    </span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </Field>

                    <Field label="Bairro do atendimento">
                      <div className="relative">
                        <MapPin size={15} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
                        <select
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="h-10 w-full appearance-none rounded-lg border border-line-2 bg-card pr-3 pl-9 text-[14px] text-ink outline-none focus:border-sage-600"
                        >
                          <option value="">Selecione o bairro</option>
                          {ZONES.map((z) => (
                            <optgroup key={z.id} label={z.name}>
                              {BAIRROS.filter((b) => b.zone === z.id).map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="Motivo">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {TYPE_OPTIONS.map((t) => (
                          <button
                            key={t.type}
                            onClick={() => setType(t.type)}
                            className={cn('h-8 rounded-full border px-3 text-[12.5px] font-medium transition-colors', type === t.type ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2 bg-card text-ink-2 hover:bg-paper-2')}
                          >
                            {t.type}
                          </button>
                        ))}
                      </div>
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Detalhe rápido (opcional)"
                        className="h-10 w-full rounded-lg border border-line-2 bg-card px-3 text-[14px] text-ink outline-none placeholder:text-ink-4 focus:border-sage-600"
                      />
                      <div className="mt-1.5 text-[11.5px] text-ink-3">Duração estimada: {dur} min</div>
                    </Field>

                    <Field label="Urgência">
                      <Segmented<Urgency>
                        value={urgency}
                        onChange={setUrgency}
                        size="md"
                        className="w-full [&>button]:flex-1"
                        options={[
                          { value: 'rotina', label: 'Rotina' },
                          { value: 'semana', label: 'Esta semana' },
                          { value: 'urgente', label: 'Urgente' },
                        ]}
                      />
                    </Field>
                  </div>

                  {/* sugestões */}
                  <div className="bg-card-2/60 p-5 md:p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles size={15} strokeWidth={1.8} className="text-terra-600" />
                      <h3 className="text-[14px] font-semibold text-ink">Melhores horários na rota</h3>
                    </div>
                    {!bairro ? (
                      <div className="rounded-lg border border-dashed border-line-2 px-5 py-10 text-center">
                        <MapPin size={22} strokeWidth={1.6} className="mx-auto mb-2 text-ink-4" />
                        <div className="text-[13.5px] font-medium text-ink">Escolha um paciente ou bairro</div>
                        <p className="mx-auto mt-1 max-w-[260px] text-[12.5px] text-ink-3">Ranqueamos pelos dias em que algum veterinário já estará na região, para não gastar quilômetro à toa.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {sugs.map((s, i) => (
                          <motion.li key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                            <SuggestionCard s={s} best={i === 0} selected={sel === s.key} onSelect={() => setSel(s.key)} />
                          </motion.li>
                        ))}
                        {sugs.length === 0 && <li className="text-[13px] text-ink-3">Nenhum horário livre nesse período. Tente mudar a urgência.</li>}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-line bg-card px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:px-6">
                  <div className="hidden min-w-0 truncate text-[12.5px] text-ink-3 sm:block">
                    {chosen ? (
                      <>
                        {pet?.name} · {dayLabel(chosen.off)} às <span className="font-mono num">{hhmm(chosen.startMin)}</span> com {VET[chosen.vetId].short}
                      </>
                    ) : (
                      'Selecione o paciente e um horário sugerido.'
                    )}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button variant="accent" disabled={!canConfirm} onClick={confirm}>
                      <CalendarPlus size={16} strokeWidth={1.8} />
                      Confirmar encaixe
                    </Button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function SuggestionCard({ s, best, selected, onSelect }: { s: Suggestion; best: boolean; selected: boolean; onSelect: () => void }) {
  const tone = s.kind === 'fora' ? 'late' : s.extraKm <= 2.5 ? 'ok' : 'warn'
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative w-full rounded-xl border bg-card p-3.5 text-left transition-[border-color,box-shadow] hover:border-line-2',
        selected ? 'border-sage-700 shadow-lift ring-1 ring-sage-700' : 'border-line shadow-card',
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border', selected ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2')}>{selected && <Check size={12} strokeWidth={3} />}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-[17px] leading-none font-medium text-ink">{dayLabel(s.off)}</span>
            <span className="font-mono text-[13px] font-medium text-ink num">{hhmm(s.startMin)}</span>
            {best && <Badge tone="sage">Melhor opção</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-medium text-ink">
            <VetAvatar vetId={s.vetId} size={20} />
            {s.title}
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{s.why}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={tone}>{s.kind === 'fora' ? `Fora da rota +${km1(s.extraKm)}` : `+${km1(s.extraKm)} na rota`}</Badge>
            <ZoneChip id={BAIRRO[s.bairro].zone} />
            <span className="text-[11.5px] text-ink-3">{ZONE[BAIRRO[s.bairro].zone].name}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
