import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Check, MapPin, Search, X } from 'lucide-react'
import { Badge, Button, IconButton, IconCircle, PetAvatar, Segmented, VetAvatar } from '@/components/ui'
import { BAIRRO, BAIRROS, ZONES } from '@/data/geo'
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
        reason: reason.trim() || `${type}, encaixe pela agenda`,
        status: 'agendada',
        fixed: false,
        origin: 'encaixe',
      },
      chosen,
    )
  }

  const input = 'h-11 w-full rounded-full bg-muted pr-4 pl-11 text-[14px] font-medium text-ink outline-none placeholder:text-ink-3 focus:bg-card focus:ring-2 focus:ring-black'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-card shadow-float outline-none md:inset-0 md:m-auto md:h-fit md:max-h-[88dvh] md:max-w-[940px] md:rounded-[28px]"
              >
                <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3 md:px-7 md:pt-6">
                  <Dialog.Title className="text-[24px] leading-tight font-bold tracking-[-0.025em] text-ink">Encaixar visita</Dialog.Title>
                  <Dialog.Close asChild>
                    <IconButton tone="muted" size={40} aria-label="Fechar">
                      <X size={17} strokeWidth={2} />
                    </IconButton>
                  </Dialog.Close>
                </div>

                <div className="scroll-thin grid min-h-0 flex-1 gap-3 overflow-y-auto px-3 pb-3 md:grid-cols-[360px_1fr] md:px-4">
                  {/* formulário */}
                  <div className="space-y-5 p-2 md:p-3">
                    <Field label="Paciente">
                      {pet ? (
                        <div className="flex items-center gap-3 rounded-full bg-muted p-1.5 pr-3">
                          <PetAvatar pet={pet} size={38} />
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="text-[13.5px] font-bold text-ink">{pet.name}</div>
                            <div className="truncate text-[12px] text-ink-3">
                              {pet.breed} · {TUTOR[pet.tutorId].name}
                            </div>
                          </div>
                          <button onClick={() => setPetId(null)} className="rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold text-ink shadow-pill hover:bg-surface">
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search size={16} strokeWidth={2} className="pointer-events-none absolute top-[14px] left-4 text-ink-3" />
                          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} placeholder="Buscar por pet ou tutor" className={input} />
                          {(focus || q) && (
                            <div className="mt-2 overflow-hidden rounded-[20px] bg-card p-1.5 shadow-float">
                              {results.length === 0 && <div className="px-3 py-3 text-[13px] text-ink-3">Nenhum paciente com esse nome.</div>}
                              {results.map((p) => (
                                <button key={p.id} onClick={() => pick(p.id)} className="flex w-full items-center gap-2.5 rounded-full px-2 py-1.5 text-left hover:bg-surface">
                                  <PetAvatar pet={p} size={32} />
                                  <span className="min-w-0 flex-1 leading-tight">
                                    <span className="block text-[13px] font-bold text-ink">{p.name}</span>
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

                    <Field label="Bairro">
                      <div className="relative">
                        <MapPin size={16} strokeWidth={2} className="pointer-events-none absolute top-[14px] left-4 text-ink-3" />
                        <select value={bairro} onChange={(e) => setBairro(e.target.value)} className={cn(input, 'appearance-none')}>
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
                            className={cn('h-9 rounded-full px-3.5 text-[12.5px] font-semibold transition-colors', type === t.type ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2')}
                          >
                            {t.type}
                          </button>
                        ))}
                      </div>
                      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Detalhe rápido (opcional)" className={cn(input, 'pl-4')} />
                      <div className="mt-1.5 pl-1 text-[12px] text-ink-3">Duração estimada: {dur} min</div>
                    </Field>

                    <Field label="Urgência">
                      <Segmented<Urgency>
                        value={urgency}
                        onChange={setUrgency}
                        size="md"
                        className="w-full [&>button]:flex-1 [&>button]:whitespace-nowrap [&>button]:px-2"
                        options={[
                          { value: 'rotina', label: 'Rotina' },
                          { value: 'semana', label: 'Esta semana' },
                          { value: 'urgente', label: 'Urgente' },
                        ]}
                      />
                    </Field>
                  </div>

                  {/* sugestões */}
                  <div className="rounded-[24px] bg-surface p-4 md:p-5">
                    <h3 className="mb-3 text-[16px] font-bold tracking-[-0.01em] text-ink">Horários sugeridos</h3>
                    {!bairro ? (
                      <div className="flex flex-col items-center rounded-[20px] bg-card px-5 py-10 text-center shadow-card">
                        <IconCircle size={48} className="mb-3">
                          <MapPin size={20} strokeWidth={1.9} />
                        </IconCircle>
                        <div className="text-[14px] font-bold text-ink">Escolha um paciente</div>
                        <p className="mt-1 max-w-[240px] text-[12.5px] text-ink-3">Os horários aparecem aqui, ordenados pela rota.</p>
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

                <div className="flex items-center justify-between gap-3 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-7 md:pb-5">
                  <div className="hidden min-w-0 truncate text-[12.5px] font-medium text-ink-3 sm:block">
                    {chosen ? (
                      <>
                        {pet?.name} · {dayLabel(chosen.off)} às <span className="num">{hhmm(chosen.startMin)}</span> com {VET[chosen.vetId].short}
                      </>
                    ) : (
                      'Selecione o paciente e um horário.'
                    )}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button variant="primary" size="lg" disabled={!canConfirm} onClick={confirm}>
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
      <div className="mb-2 pl-1 text-[12.5px] font-semibold text-ink-3">{label}</div>
      {children}
    </div>
  )
}

function SuggestionCard({ s, best, selected, onSelect }: { s: Suggestion; best: boolean; selected: boolean; onSelect: () => void }) {
  const tone = s.kind === 'fora' ? 'late' : s.extraKm <= 2.5 ? 'ok' : 'warn'
  return (
    <button
      onClick={onSelect}
      className={cn('w-full rounded-[20px] bg-card p-3.5 text-left shadow-card transition-[box-shadow] hover:shadow-lift', selected && 'ring-2 ring-black')}
    >
      <div className="flex items-start gap-3">
        <IconCircle size={40} tone={selected ? 'black' : 'muted'}>
          {selected ? <Check size={17} strokeWidth={2.6} /> : <CalendarDays size={17} strokeWidth={1.9} />}
        </IconCircle>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] leading-none font-bold text-ink">{dayLabel(s.off)}</span>
            <span className="text-[13px] font-bold text-ink-2 num">{hhmm(s.startMin)}</span>
            {best && <Badge tone="lime">Melhor opção</Badge>}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <VetAvatar vetId={s.vetId} size={20} />
            {s.title}
          </div>
          <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{s.why}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={tone}>{s.kind === 'fora' ? `Fora da rota +${km1(s.extraKm)}` : `+${km1(s.extraKm)} na rota`}</Badge>
            <ZoneChip id={BAIRRO[s.bairro].zone} />
          </div>
        </div>
      </div>
    </button>
  )
}
