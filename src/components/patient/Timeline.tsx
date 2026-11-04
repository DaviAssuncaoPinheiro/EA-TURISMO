import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, FlaskConical, Paperclip, Repeat, Scissors, Sparkles, Stethoscope, StickyNote, Syringe, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, VetAvatar } from '@/components/ui'
import type { EventKind } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { cn } from '@/lib/utils'
import { vetOf, type TimelineItem } from './model'

const KIND: Record<EventKind, { label: string; icon: LucideIcon; cls: string }> = {
  consulta: { label: 'Consulta', icon: Stethoscope, cls: 'bg-sage-100 text-sage-800' },
  retorno: { label: 'Retorno', icon: Repeat, cls: 'bg-sage-50 text-sage-700 ring-1 ring-sage-200' },
  vacina: { label: 'Vacina', icon: Syringe, cls: 'bg-info-bg text-info' },
  exame: { label: 'Exame', icon: FlaskConical, cls: 'bg-warn-bg text-warn' },
  procedimento: { label: 'Procedimento', icon: Scissors, cls: 'bg-paper-2 text-ink-2' },
  nota: { label: 'Nota', icon: StickyNote, cls: 'bg-paper-2 text-ink-2' },
  foto: { label: 'Foto', icon: Camera, cls: 'bg-paper-2 text-ink-2' },
}

type Filter = 'todos' | 'consulta' | 'vacina' | 'exame' | 'procedimento'
const FILTERS: { value: Filter; label: string; match: (k: EventKind) => boolean }[] = [
  { value: 'todos', label: 'Tudo', match: () => true },
  { value: 'consulta', label: 'Consultas e retornos', match: (k) => k === 'consulta' || k === 'retorno' },
  { value: 'vacina', label: 'Vacinas', match: (k) => k === 'vacina' },
  { value: 'exame', label: 'Exames', match: (k) => k === 'exame' },
  { value: 'procedimento', label: 'Procedimentos', match: (k) => k === 'procedimento' || k === 'nota' || k === 'foto' },
]

const monthKey = (d: string) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${x.getMonth()}`
}
const monthLabel = (d: string) => {
  const s = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(d))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Tag({ tag }: { tag: string }) {
  const attach = /pdf|laudo|anexo|foto/i.test(tag)
  if (attach)
    return (
      <button
        onClick={() => toast(`Abrindo ${tag.toLowerCase()}`, { description: 'Visualização do anexo no protótipo.' })}
        className="inline-flex h-6 items-center gap-1 rounded-md border border-line-2 bg-card px-2 text-[11.5px] font-medium text-ink-2 transition-colors hover:border-ink-4 hover:text-ink"
      >
        <Paperclip className="size-3" strokeWidth={2} />
        {tag}
      </button>
    )
  return <span className="inline-flex h-6 items-center rounded-md bg-paper-2 px-2 text-[11.5px] text-ink-2">{tag}</span>
}

function Entry({ item, last }: { item: TimelineItem; last: boolean }) {
  const k = KIND[item.kind] ?? KIND.nota
  const vet = vetOf(item.vetId)
  const Icon = k.icon
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-x-3.5"
    >
      {/* trilho */}
      <div className="relative flex justify-center">
        {!last && <span className="absolute top-9 bottom-[-6px] w-px bg-line" aria-hidden />}
        <span className={cn('relative z-[1] mt-0.5 flex size-8 items-center justify-center rounded-full', item.isNew ? 'bg-terra-600 text-white' : k.cls)}>
          <Icon className="size-[15px]" strokeWidth={1.9} />
        </span>
      </div>

      <div
        className={cn(
          'relative mb-5 min-w-0 rounded-lg',
          item.isNew && 'border border-terra-200 bg-terra-50 px-3.5 py-3 shadow-card',
        )}
      >
        {item.isNew && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-terra-500"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 2.2, ease: 'easeOut', delay: 0.3 }}
          />
        )}
        {item.isNew && (
          <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-terra-600 px-2 py-0.5 text-[10.5px] font-semibold text-white">
            <Sparkles className="size-3" strokeWidth={2.2} /> Novo · registrado em campo hoje
          </span>
        )}
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h4 className="text-[14px] font-semibold tracking-[-0.005em] text-ink">{item.title}</h4>
          <span className="num font-mono text-[11px] text-ink-3">
            {fmt.short(item.date)} · {fmt.time(item.date)}
            <span className="ml-1.5 font-sans text-ink-4">({relDays(item.date)})</span>
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px] font-medium text-ink-3">{k.label}</div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{item.summary}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
            <VetAvatar vetId={item.vetId} size={20} />
            {vet.short}
          </span>
          {item.tags?.map((t) => (
            <Tag key={t} tag={t} />
          ))}
        </div>
      </div>
    </motion.li>
  )
}

export function Timeline({ items, petName }: { items: TimelineItem[]; petName: string }) {
  const [filter, setFilter] = React.useState<Filter>('todos')
  const f = FILTERS.find((x) => x.value === filter)!
  const shown = items.filter((i) => f.match(i.kind))
  const fresh = shown.filter((i) => i.isNew)
  const rest = shown.filter((i) => !i.isNew)

  const groups: { key: string; label: string; items: TimelineItem[] }[] = []
  if (fresh.length) groups.push({ key: 'hoje', label: 'Hoje', items: fresh })
  for (const it of rest) {
    const k = monthKey(it.date)
    const g = groups.find((x) => x.key === k)
    if (g) g.items.push(it)
    else groups.push({ key: k, label: monthLabel(it.date), items: [it] })
  }

  const oldest = items.length ? new Date(items[items.length - 1].date).getFullYear() : null
  const counts = Object.fromEntries(FILTERS.map((x) => [x.value, items.filter((i) => x.match(i.kind)).length])) as Record<Filter, number>

  return (
    <Card>
      <div className="px-5 pt-4 pb-3">
        <div className="eyebrow mb-1">{items.length ? `${items.length} registros${oldest ? ` desde ${oldest}` : ''}` : 'Prontuário'}</div>
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Linha da vida clínica</h3>
      </div>
      <div className="no-scrollbar -mt-0.5 flex gap-1.5 overflow-x-auto px-5 pb-4">
        {FILTERS.map((x) => (
          <button
            key={x.value}
            onClick={() => setFilter(x.value)}
            disabled={x.value !== 'todos' && counts[x.value] === 0}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-40 sm:h-8',
              filter === x.value ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2 bg-card text-ink-2 hover:border-ink-4 hover:text-ink',
            )}
          >
            {x.label}
            <span className={cn('num text-[11px]', filter === x.value ? 'text-sage-200' : 'text-ink-4')}>{counts[x.value]}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-line px-5 pt-4 pb-1">
        {groups.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-ink-3">Nenhum registro deste tipo no prontuário de {petName}.</div>
        ) : (
          groups.map((g) => (
            <div key={g.key}>
              <div className="mb-3 flex items-center gap-3">
                <span className={cn('eyebrow', g.key === 'hoje' && 'text-terra-700')}>{g.label}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul>
                <AnimatePresence initial={false} mode="popLayout">
                  {g.items.map((it, i) => (
                    <Entry key={it.id} item={it} last={i === g.items.length - 1} />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
