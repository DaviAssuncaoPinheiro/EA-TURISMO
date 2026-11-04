import { motion } from 'motion/react'
import { Check, ChevronRight, Stethoscope } from 'lucide-react'
import { Badge, PetAvatar, VetAvatar } from '@/components/ui'
import { VET } from '@/data/mock'
import { REMINDER_KIND, REMINDER_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { dm, zoneHex, zoneName, type Item } from './data'

const spring = { type: 'spring' as const, bounce: 0.1, duration: 0.5 }

function Zone({ it }: { it: Item }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-3">
      <span className="size-1.5 rounded-full" style={{ background: zoneHex(it.zone) }} />
      {zoneName(it.zone)}
    </span>
  )
}

/** Cartão compacto do quadro (kanban). */
export function BoardCard({ it, selected, flash, onOpen, index }: { it: Item; selected: boolean; flash: boolean; onOpen: () => void; index: number }) {
  const st = REMINDER_STATUS[it.r.status]
  return (
    <motion.button
      layout
      layoutId={`rem-${it.r.id}`}
      transition={spring}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ transitionDelay: `${index * 0}ms` }}
      onClick={onOpen}
      className={cn(
        'group relative w-full rounded-lg border bg-card p-3 text-left shadow-card transition-[border-color,box-shadow] hover:border-line-2 hover:shadow-lift',
        selected ? 'border-sage-600 ring-2 ring-sage-600/25' : 'border-line',
        flash && 'ring-2 ring-ok/40',
      )}
    >
      <div className="flex items-start gap-2.5">
        <PetAvatar pet={it.pet} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-[16px] leading-tight font-medium text-ink">{it.pet.name}</span>
            {it.isNew && <Badge tone="terra" className="h-[18px] px-1.5 text-[10.5px]">Novo</Badge>}
          </div>
          <div className="truncate text-[12px] text-ink-3">{it.tutor.name}</div>
        </div>
        <Badge tone={it.due.tone} className="shrink-0">{it.due.label}</Badge>
      </div>
      <div className="mt-2.5 text-[13px] leading-snug font-medium text-ink">{it.r.title}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
        <span className="font-mono text-[10.5px] tracking-wide uppercase">{REMINDER_KIND[it.r.kind].label}</span>
        <span aria-hidden>·</span>
        <Zone it={it} />
        {it.r.status === 'programado' && <span className="num ml-auto">envio {dm(it.r.sendDate)}</span>}
      </div>
      <div className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-snug text-ink-2">
        <Stethoscope size={12} strokeWidth={1.8} className="mt-0.5 shrink-0 text-sage-600" />
        <span className="line-clamp-2">{it.r.origin}</span>
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[11.5px] whitespace-nowrap text-ink-2">
          <VetAvatar vetId={it.r.createdBy} size={18} />
          <span className="truncate">{VET[it.r.createdBy].short}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={st.tone} dot>{st.label}</Badge>
        </span>
      </div>
      {flash && (
        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-ok text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </motion.button>
  )
}

/** Linha da lista (desktop em colunas, mobile empilhada). */
export function ListRow({ it, selected, flash, onOpen }: { it: Item; selected: boolean; flash: boolean; onOpen: () => void }) {
  const st = REMINDER_STATUS[it.r.status]
  return (
    <motion.button
      layout
      layoutId={`row-${it.r.id}`}
      transition={spring}
      onClick={onOpen}
      className={cn(
        'group relative grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left transition-colors hover:bg-card-2 md:grid-cols-[minmax(190px,1.1fr)_minmax(0,1.5fr)_110px_minmax(0,1.3fr)_minmax(0,0.9fr)_132px_16px] md:gap-x-4',
        selected && 'bg-sage-50 hover:bg-sage-50',
        flash && 'bg-ok-bg/60',
      )}
    >
      <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
        <PetAvatar pet={it.pet} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-display text-[16.5px] leading-tight font-medium text-ink">{it.pet.name}</span>
            {it.isNew && <Badge tone="terra" className="h-[18px] px-1.5 text-[10.5px]">Novo</Badge>}
          </div>
          <div className="truncate text-[12px] text-ink-3">{it.tutor.name}</div>
        </div>
      </div>
      <div className="order-last col-span-3 min-w-0 md:order-none md:col-span-1">
        <div className="truncate text-[13.5px] font-medium text-ink">{it.r.title}</div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3">
          <span className="font-mono text-[10.5px] tracking-wide uppercase">{REMINDER_KIND[it.r.kind].label}</span>
          <span aria-hidden>·</span>
          <Zone it={it} />
        </div>
      </div>
      <div className="justify-self-end md:justify-self-start">
        <Badge tone={it.due.tone}>{it.due.label}</Badge>
      </div>
      <div className="order-last col-span-3 flex min-w-0 items-start gap-1.5 text-[12px] leading-snug text-ink-2 md:order-none md:col-span-1">
        <Stethoscope size={13} strokeWidth={1.8} className="mt-0.5 shrink-0 text-sage-600" />
        <span className="line-clamp-2">{it.r.origin}</span>
      </div>
      <div className="hidden items-center gap-1.5 text-[12px] text-ink-2 md:flex">
        <VetAvatar vetId={it.r.createdBy} size={22} />
        <span className="truncate">{VET[it.r.createdBy].short}</span>
      </div>
      <div className="order-last col-span-3 flex items-center justify-between md:order-none md:col-span-1 md:justify-start">
        <span className="inline-flex items-center gap-1.5 md:hidden">
          <VetAvatar vetId={it.r.createdBy} size={20} />
          <span className="text-[12px] text-ink-2">{VET[it.r.createdBy].short}</span>
        </span>
        <Badge tone={st.tone} dot>{st.label}</Badge>
      </div>
      <ChevronRight size={15} strokeWidth={1.8} className="hidden text-ink-4 transition-transform group-hover:translate-x-0.5 md:block" />
    </motion.button>
  )
}
