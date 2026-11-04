import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Bug, Pill, Send, ShieldCheck, Syringe } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, IconCircle, Panel, Segmented, VetAvatar } from '@/components/ui'
import { VACCINE, type Pet, type Tutor } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { cn, firstName } from '@/lib/utils'
import { petFacts, vetOf, type DoseView, type Health, type PreventiveView } from './model'

const dFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
const longDate = (d: string) => dFmt.format(new Date(d)).replace(/\./g, '').replace(/ de /g, ' ')

type IconTone = 'blue' | 'violet' | 'green' | 'yellow' | 'coral' | 'muted'
const V_TONE: Record<string, IconTone> = { v10: 'blue', raiva: 'coral', gripe: 'violet', giardia: 'yellow', v5: 'green', v4: 'blue' }

const BAR: Record<Health, string> = { ok: 'bg-green', warn: 'bg-yellow', late: 'bg-red' }

function status(next: string): { tone: Health; badge: string; foot: string } {
  const n = daysFromToday(next)
  if (n < 0) return { tone: 'late', badge: 'Atrasada', foot: `Atrasada há ${-n} ${-n === 1 ? 'dia' : 'dias'}` }
  if (n === 0) return { tone: 'warn', badge: 'Vence hoje', foot: 'Próxima dose hoje' }
  if (n <= 30) return { tone: 'warn', badge: `Vence em ${n} ${n === 1 ? 'dia' : 'dias'}`, foot: `Próxima dose em ${n} ${n === 1 ? 'dia' : 'dias'}` }
  return { tone: 'ok', badge: 'Em dia', foot: `Próxima dose em ${n} dias` }
}

function cycle(from: string, to: string) {
  const a = +new Date(from)
  const b = +new Date(to)
  if (b <= a) return 1
  return Math.min(1, Math.max(0.02, (Date.now() - a) / (b - a)))
}

/* ───────────── Cartão por vacina ───────────── */

function VaccineTile({ dose, index }: { dose: DoseView; index: number }) {
  const v = VACCINE[dose.vaccineId]
  const s = status(dose.nextDate)
  const p = s.tone === 'late' ? 1 : cycle(dose.date, dose.nextDate)
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className={cn('flex flex-col rounded-[20px] bg-card p-4 shadow-card', dose.isNew && 'ring-2 ring-lime')}
    >
      <div className="flex items-start gap-3">
        <IconCircle tone={V_TONE[dose.vaccineId] ?? 'muted'} size={40}>
          <Syringe className="size-[18px]" strokeWidth={1.9} />
        </IconCircle>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[15px] leading-tight font-bold tracking-[-0.01em] text-ink">{v?.name.split(' (')[0] ?? dose.vaccineId}</h4>
            {dose.isNew ? (
              <Badge tone="lime">Novo</Badge>
            ) : (
              <Badge tone={s.tone} dot className="shrink-0">
                {s.badge}
              </Badge>
            )}
          </div>
          <div className="mt-1 truncate text-[12.5px] font-medium text-ink-3">
            {dose.lab} · Lote {dose.lot}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[12px] font-medium text-ink-3">Aplicada</div>
          <div className="num text-[13.5px] font-semibold text-ink">{longDate(dose.date)}</div>
        </div>
        <div>
          <div className="text-[12px] font-medium text-ink-3">Próxima</div>
          <div className={cn('num text-[13.5px] font-semibold', s.tone === 'late' ? 'text-red' : 'text-ink')}>{longDate(dose.nextDate)}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            className={cn('h-full origin-left rounded-full', BAR[s.tone])}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: p }}
            transition={{ duration: 0.9, delay: 0.1 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[12px] font-medium">
          <span className={cn(s.tone === 'late' ? 'text-red' : 'text-ink-3')}>{s.foot}</span>
          <span className="inline-flex items-center gap-1.5 text-ink-3">
            <VetAvatar vetId={dose.vetId} size={18} />
            {vetOf(dose.vetId).short}
          </span>
        </div>
      </div>
    </motion.article>
  )
}

function PreventiveRow({ p }: { p: PreventiveView }) {
  const s = status(p.nextDate)
  const Icon = p.def.kind === 'vermífugo' ? Pill : Bug
  const name = p.def.name.match(/\((.*)\)/)?.[1] ?? p.def.name
  return (
    <div className="flex items-center gap-3 rounded-[20px] bg-card px-4 py-3 shadow-card">
      <IconCircle size={36}>
        <Icon className="size-4" strokeWidth={1.9} />
      </IconCircle>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-bold text-ink">{p.def.kind === 'vermífugo' ? 'Vermífugo' : 'Antipulgas'}</div>
        <div className="truncate text-[12px] font-medium text-ink-3">
          {name} · a cada {p.def.everyDays} dias
        </div>
      </div>
      <Badge tone={s.tone} dot className="shrink-0">
        {s.badge}
      </Badge>
    </div>
  )
}

/* ───────────── Histórico ───────────── */

function History({ doses }: { doses: DoseView[] }) {
  if (!doses.length) return <div className="rounded-[20px] bg-card px-5 py-10 text-center text-[13px] font-medium text-ink-3">Nenhuma dose registrada.</div>
  return (
    <div className="overflow-hidden rounded-[20px] bg-card shadow-card">
      {/* desktop: tabela */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="text-[12px] font-semibold text-ink-3">
            {['Vacina', 'Dose', 'Aplicada', 'Lote', 'Veterinário', 'Próxima'].map((h) => (
              <th key={h} className="px-4 pt-4 pb-3 font-semibold first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13px] font-medium">
          {doses.map((d) => {
            const v = VACCINE[d.vaccineId]
            return (
              <tr key={d.id} className="border-t border-line transition-colors hover:bg-surface">
                <td className="py-3 pr-4 pl-5">
                  <div className="flex items-center gap-2.5">
                    <IconCircle tone={V_TONE[d.vaccineId] ?? 'muted'} size={30}>
                      <Syringe className="size-3.5" strokeWidth={2} />
                    </IconCircle>
                    <div className="min-w-0">
                      <div className="font-bold text-ink">{v?.short ?? d.vaccineId}</div>
                      <div className="text-[12px] text-ink-3">{d.lab.split(' · ')[0]}</div>
                    </div>
                    {d.isNew && <Badge tone="lime">Novo</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-2">{d.dose}</td>
                <td className="num px-4 py-3 text-ink">{fmt.date(d.date)}</td>
                <td className="num px-4 py-3 text-ink-2">{d.lot}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    <VetAvatar vetId={d.vetId} size={20} />
                    {vetOf(d.vetId).short}
                  </span>
                </td>
                <td className="num py-3 pr-5 pl-4 text-ink-2">{fmt.date(d.nextDate)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* celular: lista */}
      <ul className="md:hidden">
        {doses.map((d, i) => {
          const v = VACCINE[d.vaccineId]
          return (
            <li key={d.id} className={cn('flex items-center gap-3 px-4 py-3', i > 0 && 'border-t border-line')}>
              <IconCircle tone={V_TONE[d.vaccineId] ?? 'muted'} size={34}>
                <Syringe className="size-3.5" strokeWidth={2} />
              </IconCircle>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                  {v?.short ?? d.vaccineId} {d.isNew && <Badge tone="lime">Novo</Badge>}
                </div>
                <div className="truncate text-[12px] font-medium text-ink-3">
                  {d.dose} · Lote {d.lot}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="num text-[13px] font-semibold text-ink">{fmt.date(d.date)}</div>
                <div className="text-[12px] font-medium text-ink-3">{vetOf(d.vetId).short}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ───────────── Seção ───────────── */

type View = 'atual' | 'historico'

export function VaccineCard({ pet, tutor, doses, current, preventives }: { pet: Pet; tutor: Tutor; doses: DoseView[]; current: DoseView[]; preventives: PreventiveView[] }) {
  const [view, setView] = React.useState<View>('atual')
  const f = petFacts(pet)
  const late = current.filter((d) => daysFromToday(d.nextDate) < 0).length

  const send = () =>
    toast.success(`Carteira d${f.article} ${pet.name} enviada`, {
      description: `PDF pelo WhatsApp para ${firstName(tutor.name)} · ${tutor.phone}`,
    })

  return (
    <Panel className="p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2.5 pt-2 pb-3.5">
        <div className="flex items-center gap-3">
          <IconCircle tone="white" size={40}>
            <ShieldCheck className="size-[18px]" strokeWidth={1.9} />
          </IconCircle>
          <div>
            <h3 className="text-[17px] leading-tight font-bold tracking-[-0.02em] text-ink">Carteira de vacinação</h3>
            <div className="text-[12.5px] font-medium text-ink-3">
              {current.length} vacinas · {late ? `${late} atrasada${late > 1 ? 's' : ''}` : 'nenhuma atrasada'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'atual', label: 'Atual' },
              { value: 'historico', label: `Histórico ${doses.length}` },
            ]}
            className="bg-muted-2"
          />
          <Button variant="outline" size="sm" onClick={send} className="hidden h-10 sm:inline-flex">
            <Send className="size-3.5" strokeWidth={2} /> Enviar
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {view === 'atual' ? (
          <motion.div key="atual" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            {current.length ? (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {current.map((d, i) => (
                  <VaccineTile key={d.id} dose={d} index={i} />
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] bg-card px-5 py-10 text-center text-[13px] font-medium text-ink-3">Nenhuma vacina registrada.</div>
            )}
            {preventives.length > 0 && (
              <>
                <div className="px-2.5 pt-4 pb-2.5 text-[13px] font-bold text-ink">Antiparasitários</div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {preventives.map((p) => (
                    <PreventiveRow key={p.preventiveId} p={p} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="hist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
            <History doses={doses} />
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  )
}
