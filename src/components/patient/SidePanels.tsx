import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Bug, CalendarClock, ClipboardList, FlaskConical, MapPin, MessageCircle, Phone, Repeat, ShieldCheck, Syringe, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, PetAvatar } from '@/components/ui'
import { BAIRRO, ZONE } from '@/data/geo'
import { ageLabel, fmt, relDays } from '@/data/time'
import type { Pet, Reminder, ReminderKind, Tutor } from '@/data/mock'
import { REMINDER_KIND, REMINDER_STATUS, dueState } from '@/lib/status'
import { cn, firstName } from '@/lib/utils'

/* ───────────── Zona ───────────── */

export function ZoneChip({ bairroId, className }: { bairroId: string; className?: string }) {
  const b = BAIRRO[bairroId]
  if (!b) return null
  const z = ZONE[b.zone]
  return (
    <span
      className={cn('inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11.5px] font-medium whitespace-nowrap', className)}
      style={{ background: `${z.hex}1f`, color: z.hex }}
    >
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      <span style={{ filter: 'brightness(.78)' }}>{z.name}</span>
    </span>
  )
}

/* ───────────── Tutor ───────────── */

export function TutorCard({ tutor, pet, siblings }: { tutor: Tutor; pet: Pet; siblings: Pet[] }) {
  const b = BAIRRO[tutor.bairro]
  const fn = firstName(tutor.name)
  return (
    <Card>
      <div className="px-5 pt-4 pb-4">
        <div className="eyebrow mb-1">Responsável</div>
        <div className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{tutor.name}</div>
        <div className="num mt-0.5 font-mono text-[12.5px] text-ink-2">{tutor.phone}</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 sm:h-8"
            onClick={() => toast(`Abrindo conversa com ${fn} no WhatsApp`, { description: `${tutor.phone} · mensagem já com o nome d${pet.sex === 'F' ? 'a' : 'o'} ${pet.name}` })}
          >
            <MessageCircle className="size-3.5" strokeWidth={1.8} /> WhatsApp
          </Button>
          <Button variant="outline" size="sm" className="h-10 sm:h-8" onClick={() => toast(`Ligando para ${fn}…`, { description: tutor.phone })}>
            <Phone className="size-3.5" strokeWidth={1.8} /> Ligar
          </Button>
        </div>

        <div className="mt-4 flex gap-2.5">
          <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" strokeWidth={1.8} />
          <div className="min-w-0 text-[13px] leading-snug">
            <div className="text-ink">{tutor.address}</div>
            {tutor.complement && <div className="text-ink-3">{tutor.complement}</div>}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-ink-2">{b?.name}</span>
              <ZoneChip bairroId={tutor.bairro} />
            </div>
          </div>
        </div>
        {tutor.note && (
          <div className="mt-3 rounded-md bg-paper-2/70 px-3 py-2 text-[12.5px] text-ink-2">
            <span className="font-medium text-ink">Combinado:</span> {tutor.note}
          </div>
        )}
      </div>

      {siblings.length > 0 && (
        <div className="border-t border-line px-5 pt-3 pb-4">
          <div className="eyebrow mb-2.5">
            Outros pets de {fn} · {siblings.length}
          </div>
          <div className="flex flex-col gap-2">
            {siblings.map((s) => (
              <Link
                key={s.id}
                to={`/pacientes/${s.id}`}
                className="group flex items-center gap-3 rounded-lg border border-line bg-card-2 p-2 pr-3 transition-[border-color,background,transform] hover:-translate-y-px hover:border-line-2 hover:bg-card"
              >
                <PetAvatar pet={s} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-medium text-ink">{s.name}</span>
                  <span className="block truncate text-[12px] text-ink-3">
                    {s.breed} · {ageLabel(s.birth)}
                  </span>
                </span>
                <ArrowUpRight className="size-4 text-ink-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink-2" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

/* ───────────── Lembretes ───────────── */

const R_ICON: Record<ReminderKind, LucideIcon> = {
  vacina: Syringe,
  retorno: Repeat,
  'vermífugo': ShieldCheck,
  antipulgas: Bug,
  exame: FlaskConical,
}

export function RemindersPanel({ reminders, petName }: { reminders: Reminder[]; petName: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2">
        <div>
          <div className="eyebrow mb-1">WhatsApp automático</div>
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Lembretes</h3>
        </div>
        <Link to="/lembretes" className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12.5px] font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
          Ver todos <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
      {reminders.length === 0 ? (
        <div className="px-5 pb-5 text-[13px] text-ink-3">Nenhum lembrete programado para {petName}. Eles são criados automaticamente quando uma vacina ou retorno é registrado.</div>
      ) : (
        <ul className="px-2 pb-2">
          {reminders.map((r, i) => {
            const Icon = R_ICON[r.kind] ?? CalendarClock
            const st = REMINDER_STATUS[r.status]
            const due = dueState(r.dueDate)
            return (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-card-2"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-paper-2 text-ink-2">
                    <Icon className="size-3.5" strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] leading-snug font-medium text-ink">{r.title}</span>
                      <Badge tone={st.tone} className="shrink-0">
                        {st.label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[12px] text-ink-3">
                      {REMINDER_KIND[r.kind].label} ·{' '}
                      <span className={cn(due.key === 'late' && 'font-medium text-late')}>
                        {due.key === 'late' ? `venceu ${relDays(r.dueDate)}` : `vence ${relDays(r.dueDate)}`}
                      </span>{' '}
                      · {fmt.short(r.dueDate)}
                    </div>
                    {r.reply && (
                      <div className="mt-1.5 inline-block max-w-full rounded-[10px] rounded-tl-[3px] bg-[#e4f1df] px-2.5 py-1.5 text-[12px] leading-snug text-[#24452f]">
                        “{r.reply}”
                      </div>
                    )}
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

/* ───────────── Problemas ativos ───────────── */

export function ConditionsPanel({ conditions, alerts }: { conditions: string[]; alerts: string[] }) {
  return (
    <Card>
      <div className="px-5 pt-4 pb-2">
        <div className="eyebrow mb-1">Lista de problemas</div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Condições ativas</h3>
      </div>
      {conditions.length === 0 ? (
        <div className="flex items-center gap-2.5 px-5 pb-5 text-[13px] text-ink-3">
          <ClipboardList className="size-4 text-ink-4" strokeWidth={1.8} />
          Nenhum problema ativo registrado.
        </div>
      ) : (
        <ul className="px-5 pb-4">
          {conditions.map((c, i) => {
            const serious = alerts.length > 0 && i === 0
            return (
              <li key={c} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
                <span className={cn('size-2 shrink-0 rounded-full', serious ? 'bg-late' : 'bg-warn')} />
                <span className="min-w-0 flex-1 text-[13px] text-ink">{c}</span>
                <span className="shrink-0 text-[11.5px] text-ink-3">Em acompanhamento</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
