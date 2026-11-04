import { ZONE, ZONES, type ZoneId } from '@/data/geo'
import { cn } from '@/lib/utils'

export const zoneTint = (id: ZoneId, pct = 16) => `color-mix(in srgb, ${ZONE[id].hex} ${pct}%, var(--color-card))`

export function ZoneChip({ id, size = 'sm', className }: { id: ZoneId; size?: 'xs' | 'sm'; className?: string }) {
  const z = ZONE[id]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap text-ink', size === 'xs' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2 text-[11.5px]', className)}
      style={{ background: zoneTint(id, 18) }}
    >
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      {z.short}
    </span>
  )
}

export function ZoneLegend({ className }: { className?: string }) {
  return (
    <div className={cn('no-scrollbar -mx-4 flex items-center gap-x-4 gap-y-1 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0', className)}>
      <span className="eyebrow shrink-0">Zonas</span>
      {ZONES.map((z) => (
        <span key={z.id} className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-ink-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: z.hex }} />
          {z.name.replace('Zona ', '')}
        </span>
      ))}
    </div>
  )
}

export function CapacityBar({ ratio, className }: { ratio: number; className?: string }) {
  const color = ratio > 1 ? 'var(--color-late)' : ratio > 0.85 ? 'var(--color-warn)' : 'var(--color-sage-600)'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-paper-2', className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
    </div>
  )
}

export const HATCH = 'repeating-linear-gradient(135deg, transparent 0 5px, rgba(27,38,32,.07) 5px 6px)'
