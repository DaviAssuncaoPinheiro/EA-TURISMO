import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Bug, CalendarClock, ChevronRight, Ellipsis, FlaskConical, MapPin, MessageCircle, Phone, Pill, Repeat, Syringe, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, IconButton, IconCircle, PetAvatar, ViewAll, type Tone } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { ageLabel, daysFromToday, fmt } from '@/data/time'
import type { Pet, Reminder, ReminderKind, Tutor } from '@/data/mock'
import { REMINDER_STATUS } from '@/lib/status'
import { cn, firstName } from '@/lib/utils'

/* ───────────── Zona ───────────── */

export function ZoneChip({ bairroId, className }: { bairroId: string; className?: string }) {
  const b = BAIRRO[bairroId]
  if (!b) return null
  const z = ZONE[b.zone]
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold whitespace-nowrap text-ink-2 shadow-pill', className)}>
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      {z.name}
    </span>
  )
}

function Section({ title, action, children, className }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-line px-5 pt-4 pb-4', className)}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

const initials = (name: string) =>
  name
    .replace(/^(Seu|Dona|Sr\.|Sra\.)\s+/, '')
    .split(' ')
    .filter((w) => w.length > 2 || w === w.toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

/* ───────────── Tutor (ref. cartão de perfil do logip) ───────────── */

export function TutorCard({ tutor, pet }: { tutor: Tutor; pet: Pet }) {
  const b = BAIRRO[tutor.bairro]
  const fn = firstName(tutor.name)
  return (
    <div className="m-2 rounded-[22px] bg-surface px-5 pt-6 pb-5 text-center">
      <span className="relative mx-auto inline-flex size-[72px] items-center justify-center rounded-full bg-lime text-[24px] font-bold tracking-[-0.02em] text-ink">
        {initials(tutor.name)}
        <span className="absolute right-0.5 bottom-0.5 size-3.5 rounded-full bg-green ring-[3px] ring-surface" />
      </span>
      <div className="mt-3 text-[16px] font-bold tracking-[-0.01em] text-ink">{tutor.name}</div>
      <div className="num mt-0.5 text-[13px] font-medium text-ink-3">{tutor.phone}</div>

      <div className="mt-4 flex justify-center gap-3">
        <IconButton size={44} aria-label="Ligar" onClick={() => toast(`Ligando para ${fn}`, { description: tutor.phone })}>
          <Phone className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
        <IconButton
          size={44}
          aria-label="WhatsApp"
          onClick={() => toast(`Conversa com ${fn} no WhatsApp`, { description: `Mensagem sobre ${pet.name}` })}
        >
          <MessageCircle className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
        <IconButton size={44} aria-label="Mais opções" onClick={() => toast('Editar tutor, copiar endereço ou abrir no mapa')}>
          <Ellipsis className="size-[17px]" strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-[16px] bg-card px-3.5 py-3 text-left">
        <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.9} />
        <div className="min-w-0 text-[13px] leading-snug font-medium">
          <div className="text-ink">{tutor.address}</div>
          {tutor.complement && <div className="text-ink-3">{tutor.complement}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-ink-2">{b?.name}</span>
            <ZoneChip bairroId={tutor.bairro} />
          </div>
        </div>
      </div>
      {tutor.note && <div className="mt-3 text-left text-[12.5px] font-medium text-ink-3">{tutor.note}</div>}
    </div>
  )
}

export function SiblingsPanel({ siblings, tutorName }: { siblings: Pet[]; tutorName: string }) {
  if (!siblings.length) return null
  return (
    <Section title={`Outros pets de ${firstName(tutorName)}`}>
      <div className="-mx-2 flex flex-col">
        {siblings.map((s) => (
          <Link key={s.id} to={`/pacientes/${s.id}`} className="group flex items-center gap-3 rounded-[16px] px-2 py-2 transition-colors hover:bg-surface">
            <PetAvatar pet={s} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-ink">{s.name}</span>
              <span className="block truncate text-[12px] font-medium text-ink-3">
                {s.breed} · {ageLabel(s.birth)}
              </span>
            </span>
            <ChevronRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-2" />
          </Link>
        ))}
      </div>
    </Section>
  )
}

/* ───────────── Lembretes ───────────── */

const R_ICON: Record<ReminderKind, LucideIcon> = {
  vacina: Syringe,
  retorno: Repeat,
  'vermífugo': Pill,
  antipulgas: Bug,
  exame: FlaskConical,
}

const DOT: Partial<Record<Tone, string>> = {
  neutral: 'bg-ink-4',
  info: 'bg-blue',
  violet: 'bg-violet',
  ok: 'bg-green',
  dark: 'bg-black',
  late: 'bg-red',
  warn: 'bg-yellow',
  lime: 'bg-lime-2',
}

function dueText(date: string) {
  const n = daysFromToday(date)
  if (n < 0) return { t: `Venceu há ${-n} ${-n === 1 ? 'dia' : 'dias'}`, late: true }
  if (n === 0) return { t: 'Vence hoje', late: false }
  if (n === 1) return { t: 'Vence amanhã', late: false }
  return { t: `Vence em ${n} dias`, late: false }
}

export function RemindersPanel({ reminders, petName }: { reminders: Reminder[]; petName: string }) {
  const nav = useNavigate()
  return (
    <Section title="Lembretes" action={<ViewAll onClick={() => nav('/lembretes')} />}>
      {reminders.length === 0 ? (
        <div className="py-3 text-[13px] font-medium text-ink-3">Nenhum lembrete para {petName}.</div>
      ) : (
        <ul className="flex flex-col">
          {reminders.map((r, i) => {
            const Icon = R_ICON[r.kind] ?? CalendarClock
            const st = REMINDER_STATUS[r.status]
            const due = dueText(r.dueDate)
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={cn('flex items-start gap-3 py-2.5', i > 0 && 'border-t border-line')}
              >
                <IconCircle size={36}>
                  <Icon className="size-4" strokeWidth={1.9} />
                </IconCircle>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13.5px] leading-snug font-bold text-ink">{r.title}</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 pt-0.5 text-[12px] font-semibold text-ink-2">
                      <span className={cn('size-1.5 rounded-full', DOT[st.tone] ?? 'bg-ink-4')} />
                      {st.label}
                    </span>
                  </div>
                  <div className="num mt-0.5 text-[12px] font-medium text-ink-3">
                    <span className={cn(due.late && 'text-red')}>{due.t}</span> · {fmt.short(r.dueDate)}
                  </div>
                  {r.reply && <div className="mt-2 rounded-[14px] rounded-tl-[5px] bg-blue-soft px-3 py-2 text-[12.5px] leading-snug font-medium text-ink-2">{r.reply}</div>}
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/* ───────────── Condições ativas ───────────── */

export function ConditionsPanel({ conditions, alerts }: { conditions: string[]; alerts: string[] }) {
  return (
    <Section title="Condições ativas">
      {conditions.length === 0 ? (
        <div className="py-3 text-[13px] font-medium text-ink-3">Nenhuma condição registrada.</div>
      ) : (
        <ul>
          {conditions.map((c, i) => {
            const serious = alerts.length > 0 && i === 0
            return (
              <li key={c} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
                <span className={cn('size-2 shrink-0 rounded-full', serious ? 'bg-red' : 'bg-yellow')} />
                <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">{c}</span>
                <span className="shrink-0 text-[12px] font-medium text-ink-3">Em acompanhamento</span>
              </li>
            )
          })}
        </ul>
      )}
    </Section>
  )
}

/** Coluna direita inteira num cartão branco, como no logip */
export function SideColumn({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Card className={cn('overflow-hidden pb-1', className)}>{children}</Card>
}
