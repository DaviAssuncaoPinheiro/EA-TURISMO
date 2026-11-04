import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarClock, CheckCheck, FlaskConical, Pill, Repeat, Sparkles, Syringe } from 'lucide-react'
import { cn, fill, firstName } from '@/lib/utils'
import { CLINIC, TEMPLATES, TUTOR, VET, WEEK_PLAN, type ReminderKind } from '@/data/mock'
import { BAIRRO, ZONE } from '@/data/geo'
import { day, fmt } from '@/data/time'
import { Btn, Chip, EASE_OUT, Pressable, Sheet, Toggle } from './kit'
import { dateShort } from './data'
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
      <StepIntro eyebrow="Etapa 5 de 5" title="Retorno e lembretes">
        Montamos os lembretes a partir do que você fez nesta visita. Confira, ajuste as datas e confirme.
      </StepIntro>

      <Block
        title={
          <span className="flex items-center gap-1.5">
            <Sparkles className="size-4 text-terra-600" /> Sugeridos para {pet.name}
          </span>
        }
        hint={`${active.length} de ${sugg.length} ativos · enviados por WhatsApp`}
        bodyClassName="pb-0"
      >
        <div className="-mx-4 divide-y divide-line">
          {sugg.map((s, i) => {
            const Icon = KIND_ICON[s.kind]
            const selected = shown?.key === s.key
            return (
              <motion.div key={s.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.06 * i }} className={cn('flex items-start gap-3 px-4 py-3.5 transition-colors', selected && 'bg-sage-50/70', !s.on && 'opacity-60')}>
                <Pressable scale={0.98} onClick={() => setPreview(s.key)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full', s.on ? 'bg-sage-800 text-paper' : 'bg-paper-2 text-ink-3')}>
                    <Icon className="size-[18px]" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] leading-snug font-semibold text-ink">
                      {s.title} <span className="font-normal text-ink-2">em {daysLabel(s.days)}</span>
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink-3">{s.why}</span>
                  </span>
                </Pressable>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <Toggle checked={s.on} onChange={(v) => edit(s.key, { on: v })} label={s.title} />
                  <Pressable onClick={() => setEditing(s)} className="flex h-8 items-center gap-1 rounded-full bg-paper-2 px-2.5 text-[13px] font-medium text-ink-2">
                    <CalendarClock className="size-3.5" />
                    {dateShort(day(s.days))}
                  </Pressable>
                </div>
              </motion.div>
            )
          })}
        </div>
        <div className="h-1" />
      </Block>

      {shown && (
        <>
          <div className="flex items-end justify-between px-5 pt-6 pb-2">
            <div className="text-[13px] font-semibold tracking-[0.01em] text-ink-3 uppercase">Como {firstName(tutor.name)} vai receber</div>
            <div className="text-[12.5px] text-ink-3">{dateShort(day(Math.max(1, shown.days - (shown.days >= 30 ? 7 : 2))))}, 09:00</div>
          </div>
          <div className="mx-4 overflow-hidden rounded-[20px] border border-line bg-[#e9e3d4]">
            <div className="flex items-center gap-2.5 bg-sage-900 px-3.5 py-2.5 text-paper">
              <span className="flex size-8 items-center justify-center rounded-full bg-paper text-[13px] font-bold text-sage-900">VD</span>
              <div className="leading-tight">
                <div className="text-[14.5px] font-semibold">{CLINIC.name}</div>
                <div className="text-[11.5px] text-sage-200">conta comercial · {ZONE[BAIRRO[tutor.bairro].zone].short}</div>
              </div>
            </div>
            <div className="p-3.5">
              <AnimatePresence mode="wait">
                <motion.div key={shown.key + shown.days} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24, ease: EASE_OUT }} className="relative max-w-[92%] rounded-[14px] rounded-tl-[4px] bg-card px-3.5 pt-2.5 pb-5 text-[15px] leading-[1.45] whitespace-pre-line text-ink shadow-card">
                  {message.split(/(\*[^*]+\*)/).map((part, i) => (part.startsWith('*') ? <b key={i}>{part.slice(1, -1)}</b> : <React.Fragment key={i}>{part}</React.Fragment>))}
                  <span className="absolute right-2.5 bottom-1.5 flex items-center gap-1 text-[11px] text-ink-3">
                    09:00 <CheckCheck className="size-3.5 text-info" />
                  </span>
                </motion.div>
              </AnimatePresence>
              <div className="mt-2 flex gap-1.5">
                {['Sim, pode agendar', 'Prefiro outro dia'].map((b) => (
                  <span key={b} className="rounded-full bg-card/80 px-3 py-1.5 text-[13px] font-medium text-info">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="px-6 pt-3 text-center text-[13px] text-ink-3">Toque num lembrete para ver a mensagem dele. A resposta do tutor cai direto na agenda.</p>
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
      description={`Vence em ${fmt.date(day(days))} · ${fmt.weekday(day(days))}`}
      footer={
        <Btn className="w-full" onClick={() => onPick(days)}>
          Confirmar {daysLabel(days)}
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
