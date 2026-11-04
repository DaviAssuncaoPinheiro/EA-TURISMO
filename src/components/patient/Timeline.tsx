import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, Download, FileText, FlaskConical, Repeat, Scissors, Stethoscope, StickyNote, Syringe, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Chip, VetAvatar } from '@/components/ui'
import type { EventKind } from '@/data/mock'
import { fmt, relDays } from '@/data/time'
import { cn } from '@/lib/utils'
import { clean, vetOf, type TimelineItem } from './model'

const KIND: Record<EventKind, { label: string; icon: LucideIcon; cls: string }> = {
  consulta: { label: 'Consulta', icon: Stethoscope, cls: 'bg-blue text-white' },
  retorno: { label: 'Retorno', icon: Repeat, cls: 'bg-violet text-white' },
  vacina: { label: 'Vacina', icon: Syringe, cls: 'bg-green text-white' },
  exame: { label: 'Exame', icon: FlaskConical, cls: 'bg-yellow text-ink' },
  procedimento: { label: 'Procedimento', icon: Scissors, cls: 'bg-coral text-white' },
  nota: { label: 'Nota', icon: StickyNote, cls: 'bg-ink-3 text-white' },
  foto: { label: 'Foto', icon: Camera, cls: 'bg-ink-3 text-white' },
}

type Filter = 'todos' | 'consulta' | 'vacina' | 'exame' | 'procedimento'
const FILTERS: { value: Filter; label: string; match: (k: EventKind) => boolean }[] = [
  { value: 'todos', label: 'Tudo', match: () => true },
  { value: 'consulta', label: 'Consultas', match: (k) => k === 'consulta' || k === 'retorno' },
  { value: 'vacina', label: 'Vacinas', match: (k) => k === 'vacina' },
  { value: 'exame', label: 'Exames', match: (k) => k === 'exame' },
  { value: 'procedimento', label: 'Procedimentos', match: (k) => k === 'procedimento' || k === 'nota' || k === 'foto' },
]

const isAttachment = (t: string) => /pdf|laudo|anexo/i.test(t)

function Attachment({ tag }: { tag: string }) {
  const name = /pdf|laudo/i.test(tag) ? 'Laudo.pdf' : tag
  return (
    <button
      onClick={() => toast(`Abrindo ${name}`)}
      className="flex w-full max-w-[280px] items-center gap-3 rounded-[16px] bg-blue-soft py-2.5 pr-3 pl-2.5 text-left transition-colors hover:bg-[#dde7ff]"
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <FileText className="size-3.5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-ink">{name}</span>
        <span className="block text-[11.5px] font-medium text-ink-3">PDF · 248 KB</span>
      </span>
      <Download className="size-4 text-blue" strokeWidth={2} />
    </button>
  )
}

function Entry({ item, index }: { item: TimelineItem; index: number }) {
  const k = KIND[item.kind] ?? KIND.nota
  const vet = vetOf(item.vetId)
  const Icon = k.icon
  const attachments = item.tags?.filter(isAttachment) ?? []
  const labels = item.tags?.filter((t) => !isAttachment(t)) ?? []
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.28, delay: Math.min(index, 6) * 0.03, ease: [0.25, 1, 0.5, 1] }}
      className={cn('relative flex gap-3 rounded-[20px] py-3.5', item.isNew && '-mx-3 bg-lime-soft px-3')}
    >
      <span className="relative mt-0.5 block size-[38px] shrink-0">
        <VetAvatar vetId={item.vetId} size={38} />
        <span className={cn('absolute -right-1 -bottom-1 inline-flex size-[18px] items-center justify-center rounded-full ring-2', item.isNew ? 'ring-lime-soft' : 'ring-card', k.cls)}>
          <Icon className="size-2.5" strokeWidth={2.4} />
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-[14px] leading-snug font-bold text-ink">{clean(item.title)}</h4>
              {item.isNew && <Badge tone="lime">Novo</Badge>}
            </div>
            <div className="text-[12.5px] font-medium text-ink-3">
              {k.label} por <span className="text-blue">{vet.short}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="num text-[12.5px] font-semibold text-ink-2">{fmt.short(item.date)}</div>
            <div className="text-[11.5px] font-medium text-ink-4">{relDays(item.date)}</div>
          </div>
        </div>

        <div className="mt-2.5 max-w-[560px] rounded-[16px] rounded-tl-[6px] bg-blue-soft px-3.5 py-2.5 text-[13px] leading-relaxed font-medium text-ink-2">{clean(item.summary)}</div>

        {(attachments.length > 0 || labels.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {attachments.map((t) => (
              <Attachment key={t} tag={t} />
            ))}
            {labels.map((t) => (
              <Badge key={t} tone={/carteira/i.test(t) ? 'ok' : 'neutral'}>
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </motion.li>
  )
}

const PAGE = 6

export function Timeline({ items, petName }: { items: TimelineItem[]; petName: string }) {
  const [filter, setFilter] = React.useState<Filter>('todos')
  const [all, setAll] = React.useState(false)
  const f = FILTERS.find((x) => x.value === filter)!
  const shown = items.filter((i) => f.match(i.kind))
  const visible = all ? shown : shown.slice(0, PAGE)
  const counts = Object.fromEntries(FILTERS.map((x) => [x.value, items.filter((i) => x.match(i.kind)).length])) as Record<Filter, number>
  const fresh = items.filter((i) => i.isNew).length

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Histórico clínico</h3>
          <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">
            {items.length} registros{fresh ? ` · ${fresh} novo${fresh > 1 ? 's' : ''} hoje` : ''}
          </div>
        </div>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pt-4 pb-1">
        {FILTERS.filter((x) => x.value === 'todos' || counts[x.value] > 0).map((x) => (
          <Chip key={x.value} active={filter === x.value} onClick={() => setFilter(x.value)} className="shrink-0">
            {x.label}
            <span className={cn('num text-[11.5px]', filter === x.value ? 'text-white/60' : 'text-ink-4')}>{counts[x.value]}</span>
          </Chip>
        ))}
      </div>

      <div className="px-5 pt-2 pb-3">
        {shown.length === 0 ? (
          <div className="py-10 text-center text-[13px] font-medium text-ink-3">Nenhum registro deste tipo para {petName}.</div>
        ) : (
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {visible.map((it, i) => (
                <Entry key={it.id} item={it} index={i} />
              ))}
            </AnimatePresence>
          </ul>
        )}
        {shown.length > PAGE && (
          <div className="flex justify-center pt-2 pb-2">
            <Button variant="subtle" size="sm" onClick={() => setAll((v) => !v)}>
              {all ? 'Mostrar menos' : `Ver mais ${shown.length - PAGE}`}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
