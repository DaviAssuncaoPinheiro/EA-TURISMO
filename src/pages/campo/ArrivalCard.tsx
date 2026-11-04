// Cartão de chegada: o essencial para entrar na casa (sheet no celular, modal no computador).
import * as React from 'react'
import { Drawer } from 'vaul'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { BellRing, Car, Check, Clock, Hand, HeartPulse, KeyRound, MapPin, MessageCircle, PawPrint, Phone, Stethoscope, Syringe, TriangleAlert, X } from 'lucide-react'
import { cn, firstName, kg } from '@/lib/utils'
import { PET, type Pet, type Visit } from '@/data/mock'
import { ageLabel, fmt } from '@/data/time'
import { dueState } from '@/lib/status'
import { useDemo } from '@/store'
import { notify } from './campoStore'
import { accessOf, bairroOf, tutorOf, visitTodo, vName } from './data'
import { latestDoses } from './vaccines'
import { Btn, EASE_OUT, Pressable, RoundBtn, usePhone } from './kit'

/** Foto grande ou inicial do pet */
function PetBig({ pet, size }: { pet: Pet; size: number }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime text-ink ring-4 ring-white/10" style={{ width: size, height: size }}>
      {pet.photo && !failed ? (
        <img src={pet.photo} alt={pet.name} onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span className="font-bold" style={{ fontSize: size * 0.42 }}>
          {pet.name[0]}
        </span>
      )}
    </span>
  )
}

function useArrival(visit: Visit) {
  const pets = visit.petIds.map((p) => PET[p])
  const pet = pets[0]
  const tutor = tutorOf(visit)
  const access = accessOf(visit.tutorId)
  const extraDoses = useDemo((s) => s.extraDoses)
  const weight = useDemo((s) => s.extraWeights[pet.id]) ?? pet.weightKg
  const due = latestDoses(pet.id, extraDoses)
    .map((d) => ({ d, st: dueState(d.nextDate) }))
    .filter((x) => x.st.key !== 'ok')
    .sort((a, b) => +new Date(a.d.nextDate) - +new Date(b.d.nextDate))
  const todo = visitTodo(
    visit,
    pet,
    due.filter((x) => x.st.key === 'late').map((x) => vName(x.d.vaccineId)),
  )
  return { pets, pet, tutor, access, weight, due, todo }
}

type Data = ReturnType<typeof useArrival>

function Hero({ visit, data, onClose, title }: { visit: Visit; data: Data; onClose: () => void; title: React.ReactNode }) {
  const { pet, pets, weight } = data
  return (
    <div className="relative overflow-hidden rounded-[30px] bg-black px-5 pt-4 pb-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_85%_0%,rgba(216,243,90,.16),transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-[12.5px] font-bold text-ink">
          <MapPin className="size-3.5" strokeWidth={2.4} /> Cartão de chegada
        </span>
        <RoundBtn label="Fechar" tone="glass" size={40} onClick={onClose}>
          <X className="size-[18px]" strokeWidth={2.2} />
        </RoundBtn>
      </div>
      <div className="relative mt-4 flex items-center gap-4">
        <span className="relative">
          <PetBig pet={pet} size={96} />
          {pets[1] && (
            <span className="absolute -right-2 -bottom-1">
              <PetBig pet={pets[1]} size={40} />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          {title}
          <div className="mt-1 text-[14px] font-medium text-white/60">
            {pet.breed} · {ageLabel(pet.birth)} · <span className="num">{kg(weight)}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex h-7 items-center rounded-full bg-white/10 px-2.5 text-[12px] font-semibold">{visit.type}</span>
            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-[12px] font-semibold">
              <Clock className="size-3" strokeWidth={2.4} />
              <span className="num">{fmt.time(visit.start)}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="relative mt-4 flex items-start gap-3 rounded-[22px] bg-white/[0.08] p-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
          <Hand className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <div className="text-[12.5px] font-semibold text-white/55">Temperamento e manejo</div>
          <div className="mt-0.5 text-[15.5px] leading-snug font-bold">{pet.temperament ?? 'Sem observações. Tratar com calma e deixar cheirar a mão.'}</div>
        </div>
      </div>
    </div>
  )
}

function Alerts({ data }: { data: Data }) {
  const { pet, due } = data
  if (!pet.alerts?.length && !due.length) return null
  return (
    <section className="rounded-[26px] bg-red-soft p-4">
      <div className="flex items-center gap-2 text-[13.5px] font-bold text-red">
        <span className="flex size-7 items-center justify-center rounded-full bg-red text-white">
          <TriangleAlert className="size-3.5" strokeWidth={2.4} />
        </span>
        Atenção
      </div>
      {pet.alerts?.map((a) => (
        <div key={a} className="mt-2.5 flex items-start gap-2 text-[15px] leading-snug font-bold text-ink">
          {/card|sopro|mitral/i.test(a) && <HeartPulse className="mt-0.5 size-[17px] shrink-0 text-red" strokeWidth={2.2} />}
          {a}
        </div>
      ))}
      {due.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {due.map(({ d, st }) => (
            <span key={d.vaccineId} className="inline-flex h-9 items-center gap-2 rounded-full bg-card/80 pr-3 pl-1">
              <span className={cn('flex size-7 items-center justify-center rounded-full', st.key === 'late' ? 'bg-red text-white' : 'bg-yellow-soft text-yellow-ink')}>
                <Syringe className="size-3.5" strokeWidth={2} />
              </span>
              <span className="text-[13px] font-semibold text-ink">{vName(d.vaccineId)}</span>
              <span className={cn('text-[12px] font-bold', st.key === 'late' ? 'text-red' : 'text-yellow-ink')}>{st.label}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}

function Todo({ data }: { data: Data }) {
  const [done, setDone] = React.useState<Record<string, boolean>>({})
  const n = data.todo.filter((t) => done[t]).length
  return (
    <section className="rounded-[26px] bg-card p-2 shadow-card">
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-[16px] font-bold tracking-[-0.02em] text-ink">Nesta visita</h3>
        <span className="num text-[13px] font-semibold text-ink-3">
          {n} de {data.todo.length}
        </span>
      </div>
      {data.todo.map((t) => {
        const on = !!done[t]
        return (
          <Pressable key={t} scale={0.985} onClick={() => setDone((s) => ({ ...s, [t]: !s[t] }))} className="flex w-full items-center gap-3 rounded-[18px] px-3 py-2.5 text-left hover:bg-surface">
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'bg-lime text-ink' : 'bg-muted text-transparent')}>
              <Check className="size-4" strokeWidth={3} />
            </span>
            <span className={cn('min-w-0 flex-1 text-[14.5px] font-semibold transition-colors', on ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{t}</span>
          </Pressable>
        )
      })}
    </section>
  )
}

function Access({ visit, data }: { visit: Visit; data: Data }) {
  const { access, tutor } = data
  const rows = [
    access.gate && { icon: KeyRound, label: 'Portão', value: access.gate },
    access.intercom && { icon: BellRing, label: 'Interfone', value: access.intercom },
    { icon: MapPin, label: 'Referência', value: access.landmark },
    access.parking && { icon: Car, label: 'Estacionar', value: access.parking },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string }[]
  return (
    <section className="rounded-[26px] bg-card p-4 shadow-card">
      <h3 className="text-[16px] font-bold tracking-[-0.02em] text-ink">Acesso à casa</h3>
      <div className="mt-1 text-[13px] font-medium text-ink-3">
        {tutor.address}
        {tutor.complement ? `, ${tutor.complement}` : ''} · {bairroOf(visit).name}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink">
              <r.icon className="size-[17px]" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-ink-3">{r.label}</div>
              <div className="text-[14.5px] leading-snug font-bold text-ink">{r.value}</div>
            </div>
          </div>
        ))}
      </div>
      {access.notes.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-1.5">
          {access.notes.map((n) => (
            <div key={n} className="flex items-start gap-2 rounded-[16px] bg-yellow-soft px-3 py-2.5 text-[13.5px] leading-snug font-semibold text-yellow-ink">
              <PawPrint className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              {n}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function Contact({ data }: { data: Data }) {
  const { tutor } = data
  const first = firstName(tutor.name)
  return (
    <section className="flex items-center gap-3 rounded-[26px] bg-card p-4 shadow-card">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lime text-[18px] font-bold text-ink">{first[0]}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-bold text-ink">{tutor.name}</div>
        <div className="num text-[13px] font-medium text-ink-3">{tutor.phone}</div>
        {tutor.note && <div className="mt-1 truncate text-[12.5px] font-semibold text-yellow-ink">{tutor.note}</div>}
      </div>
      <RoundBtn label={`Ligar para ${first}`} tone="muted" size={46} onClick={() => notify({ kind: 'app', title: `Ligando para ${first}`, body: tutor.phone })}>
        <Phone className="size-[18px]" strokeWidth={2} />
      </RoundBtn>
      <RoundBtn label="WhatsApp" tone="black" size={46} onClick={() => notify({ kind: 'whatsapp', title: 'Abrindo conversa', body: `${tutor.name}, ${tutor.phone}` })}>
        <MessageCircle className="size-[18px] text-lime" strokeWidth={2} />
      </RoundBtn>
    </section>
  )
}

export function ArrivalCard({
  visit,
  open,
  onOpenChange,
  onStart,
  startLabel,
}: {
  visit: Visit
  open: boolean
  onOpenChange: (o: boolean) => void
  onStart: () => void
  startLabel: string
}) {
  const { desktop, root } = usePhone()
  const data = useArrival(visit)
  const close = () => onOpenChange(false)
  const name = data.pets.map((p) => p.name).join(' e ')
  const start = (
    <Btn tone="lime" className={cn('w-full', desktop ? 'h-12 text-[15px]' : 'h-[58px] text-[16.5px]')} onClick={onStart}>
      <Stethoscope className="size-[18px]" /> {startLabel}
    </Btn>
  )

  if (desktop)
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[3px]" />
              </Dialog.Overlay>
              <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-6">
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: EASE_OUT }}
                  className="pointer-events-auto flex max-h-full w-full max-w-[960px] flex-col overflow-hidden rounded-[34px] bg-surface shadow-float outline-none"
                >
                  <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
                    <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="flex min-w-0 flex-col gap-3">
                        <Hero visit={visit} data={data} onClose={close} title={<Dialog.Title className="truncate text-[30px] leading-none font-bold tracking-[-0.035em]">{name}</Dialog.Title>} />
                        <Alerts data={data} />
                        <Contact data={data} />
                      </div>
                      <div className="flex min-w-0 flex-col gap-3">
                        <Todo data={data} />
                        <Access visit={visit} data={data} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-line bg-card px-4 py-3">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink-3">Confira antes de tocar a campainha</span>
                    <button onClick={close} className="inline-flex h-12 items-center rounded-full bg-muted px-5 text-[14.5px] font-semibold text-ink transition-colors hover:bg-muted-2">
                      Fechar
                    </button>
                    <div className="w-[260px]">{start}</div>
                  </div>
                </motion.div>
              </Dialog.Content>
              </div>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    )

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} container={root} repositionInputs={false}>
      <Drawer.Portal container={root}>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50" />
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[94%] flex-col rounded-t-[32px] bg-surface outline-none">
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pt-2 pb-3">
            <div className="relative">
              <div className="absolute top-1.5 left-1/2 z-10 h-[5px] w-10 -translate-x-1/2 rounded-full bg-white/25" />
              <Hero visit={visit} data={data} onClose={close} title={<Drawer.Title className="truncate text-[28px] leading-none font-bold tracking-[-0.035em]">{name}</Drawer.Title>} />
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <Alerts data={data} />
              <Todo data={data} />
              <Access visit={visit} data={data} />
              <Contact data={data} />
            </div>
          </div>
          <div className="relative bg-surface px-4 pt-2" style={{ paddingBottom: 'calc(var(--sab) + 12px)' }}>
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-surface to-transparent" />
            {start}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
