import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, CheckCheck, FlaskConical, Pill, Repeat, Syringe } from 'lucide-react'
import { cn, fill, firstName } from '@/lib/utils'
import { CLINIC, TEMPLATES, TUTOR, VET, WEEK_PLAN, type ReminderKind } from '@/data/mock'
import { BAIRRO } from '@/data/geo'
import { LogoMark } from '@/components/AppShell'
import { day, fmt } from '@/data/time'
import { Btn, Chip, EASE_OUT, Pressable, Sheet, Toggle } from './kit'
import { capFirst, dateShort } from './data'
import { daysLabel, suggestReminders, type Suggestion } from './finalize'
import { Block, StepIntro, type StepProps } from './stepKit'

const KIND_ICON: Record<ReminderKind, typeof Syringe> = { vacina: Syringe, retorno: Repeat, exame: FlaskConical, 'vermífugo': Pill, antipulgas: Pill }
const DAY_OPTIONS = [7, 15, 21, 30, 45, 60, 90, 120, 180, 365]

/** Dia em que o veterinário estará de novo na zona do tutor, perto da data */
function suggestedDay(vetId: string, bairroId: string, days: number) {
  const zone = BAIRRO[bairroId].zone
  for (let k = 0; k < 14; k++) {
    for (const off of [days + k, days - k]) {
      if (off < 1) continue
      const d = day(off)
      if (WEEK_PLAN[vetId]?.[d.getDay()]?.includes(zone)) return d
    }
  }
  return day(days)
}

export function StepRetorno({ visit, pet, draft, patch }: StepProps) {
  const sugg = React.useMemo(() => suggestReminders(visit, pet, draft), [visit, pet, draft])
  const [preview, setPreview] = React.useState<string | null>(null)
  const [editing, setEditing] = React.useState<Suggestion | null>(null)
  const tutor = TUTOR[visit.tutorId]
  const vet = VET[visit.vetId]
  const active = sugg.filter((s) => s.on)
  const shown = sugg.find((s) => s.key === preview && s.on) ?? active[0]

  const edit = (key: string, e: { on?: boolean; days?: number }) => patch((d) => ({ reminderEdits: { ...d.reminderEdits, [key]: { ...d.reminderEdits[key], ...e } } }))

  const message = React.useMemo(() => {
    if (!shown) return ''
    const sd = suggestedDay(visit.vetId, tutor.bairro, shown.days)
    return fill(TEMPLATES[shown.kind], {
      tutor: firstName(tutor.name),
      clinica: CLINIC.name,
      item: shown.item ?? shown.title,
      pet: pet.name,
      data: dateShort(day(shown.days)),
      vet: vet.short,
      bairro: BAIRRO[tutor.bairro].name,
      diaSugerido: `${fmt.weekday(sd)}, ${dateShort(sd)}`,
    })
  }, [shown, visit.vetId, tutor, pet.name, vet.short])

  return (
    <div className="pb-2">
      <StepIntro eyebrow="Etapa 5 de 5" title="Lembretes">
        Sugeridos a partir desta visita
      </StepIntro>

      <Block title={`Para ${pet.name}`} hint={`${active.length} de ${sugg.length} ativos, por WhatsApp`} bodyClassName="px-2 pb-2">
        <div className="flex flex-col gap-1">
          {sugg.map((s, i) => {
            const Icon = KIND_ICON[s.kind]
            const selected = shown?.key === s.key
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.05 * i }}
                className={cn('rounded-[22px] px-3 py-3 transition-colors', selected && 'bg-surface', !s.on && 'opacity-55')}
              >
                <div className="flex items-start gap-3">
                  <Pressable scale={0.98} onClick={() => setPreview(s.key)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                    <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', s.on ? 'bg-black text-lime' : 'bg-muted text-ink-3')}>
                      <Icon className="size-[18px]" strokeWidth={2} />
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="block text-[15.5px] leading-snug font-bold text-ink">{s.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-snug font-medium text-ink-3">{s.why}</span>
                    </span>
                  </Pressable>
                  <div className="pt-1.5">
                    <Toggle checked={s.on} onChange={(v) => edit(s.key, { on: v })} label={s.title} />
                  </div>
                </div>
                <Pressable onClick={() => setEditing(s)} className="mt-2 ml-14 inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12.5px] font-bold text-ink">
                  <CalendarClock className="size-3.5" strokeWidth={2.2} />
                  Em {daysLabel(s.days)} · {dateShort(day(s.days))}
                </Pressable>
              </motion.div>
            )
          })}
        </div>
      </Block>

      {shown && (
        <>
          <div className="flex items-center justify-between px-6 pt-6 pb-3">
            <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">Mensagem</h3>
            <span className="text-[12.5px] font-semibold text-ink-3">
              Envio {dateShort(day(Math.max(1, shown.days - (shown.days >= 30 ? 7 : 2))))}, 09:00
            </span>
          </div>
          <div className="mx-4 overflow-hidden rounded-[28px] bg-muted-2">
            <div className="flex items-center gap-2.5 bg-black px-4 py-3 text-white">
              <LogoMark size={34} tone="lime" />
              <div className="leading-tight">
                <div className="text-[14.5px] font-bold">{CLINIC.name}</div>
                <div className="text-[12px] font-medium text-white/55">Para {firstName(tutor.name)}</div>
              </div>
            </div>
            <div className="p-3.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={shown.key + shown.days}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.24, ease: EASE_OUT }}
                  className="relative max-w-[92%] rounded-[20px] rounded-tl-[6px] bg-card px-4 pt-3 pb-6 text-[14.5px] leading-[1.45] font-medium whitespace-pre-line text-ink shadow-card"
                >
                  {message.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith('*') ? <b key={i}>{part.slice(1, -1)}</b> : <React.Fragment key={i}>{part}</React.Fragment>))}
                  <span className="absolute right-3 bottom-2 flex items-center gap-1 text-[11px] font-medium text-ink-3">
                    09:00 <CheckCheck className="size-3.5 text-blue" />
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="mt-2 flex gap-1.5">
                {['Sim, pode agendar', 'Outro dia'].map((b) => (
                  <span key={b} className="rounded-full bg-card px-3.5 py-2 text-[13px] font-bold text-blue">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <DaysSheet
        s={editing}
        onClose={() => setEditing(null)}
        onPick={(days) => {
          if (editing) edit(editing.key, { days, on: true })
          setPreview(editing?.key ?? null)
          setEditing(null)
        }}
      />
    </div>
  )
}

function DaysSheet({ s, onClose, onPick }: { s: Suggestion | null; onClose: () => void; onPick: (d: number) => void }) {
  const [cur, setCur] = React.useState<Suggestion | null>(s)
  const [days, setDays] = React.useState(s?.days ?? 30)
  React.useEffect(() => {
    if (s) {
      setCur(s)
      setDays(s.days)
    }
  }, [s])
  if (!cur) return null
  const opts = [...new Set([...DAY_OPTIONS, cur.days])].sort((a, b) => a - b)
  return (
    <Sheet
      open={!!s}
      onOpenChange={(o) => !o && onClose()}
      title={cur.title}
      description={`${capFirst(fmt.weekday(day(days)))}, ${fmt.date(day(days))}`}
      footer={
        <Btn className="w-full" onClick={() => onPick(days)}>
          Confirmar em {daysLabel(days)}
        </Btn>
      }
    >
      <div className="flex flex-wrap gap-2">
        {opts.map((d) => (
          <Chip key={d} on={d === days} onClick={() => setDays(d)}>
            {daysLabel(d)}
          </Chip>
        ))}
      </div>
    </Sheet>
  )
}
