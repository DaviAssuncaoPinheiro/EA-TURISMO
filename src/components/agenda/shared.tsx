import { ZONE, ZONES, type ZoneId } from '@/data/geo'
import { cn } from '@/lib/utils'

export const zoneTint = (id: ZoneId, pct = 16) => `color-mix(in srgb, ${ZONE[id].hex} ${pct}%, var(--color-card))`

/** Cor sólida da zona e cor do texto que lê bem em cima dela */
export const zoneInk = (id: ZoneId) => (id === 'sul' ? 'var(--color-ink)' : '#ffffff')

export function ZoneChip({ id, size = 'sm', className }: { id: ZoneId; size?: 'xs' | 'sm'; className?: string }) {
  const z = ZONE[id]
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap text-ink', size === 'xs' ? 'h-5 px-2 text-[10.5px]' : 'h-6 px-2.5 text-[11.5px]', className)}
      style={{ background: zoneTint(id, 20) }}
    >
      <span className="size-1.5 rounded-full" style={{ background: z.hex }} />
      {z.short}
    </span>
  )
}

export function ZoneLegend({ className }: { className?: string }) {
  return (
    <div className={cn('no-scrollbar flex items-center gap-1.5 overflow-x-auto', className)}>
      {ZONES.map((z) => (
        <span key={z.id} className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-card px-3 text-[12px] font-semibold text-ink-2 shadow-pill">
          <span className="size-2 rounded-full" style={{ background: z.hex }} />
          {z.short}
        </span>
      ))}
    </div>
  )
}

export function CapacityBar({ ratio, className }: { ratio: number; className?: string }) {
  const color = ratio > 1 ? 'var(--color-red)' : ratio > 0.85 ? 'var(--color-yellow)' : 'var(--color-blue)'
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${Math.min(100, ratio * 100)}%`, background: color }} />
    </div>
  )
}

/** Selo branco dentro da barra, igual ao "• Aprovado" da referência */
export function InnerBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-[18px] shrink-0 items-center rounded-full bg-white px-2 text-[10px] leading-none font-bold whitespace-nowrap text-ink shadow-[0_1px_2px_rgba(17,18,20,.12)]">• {children}</span>
}
