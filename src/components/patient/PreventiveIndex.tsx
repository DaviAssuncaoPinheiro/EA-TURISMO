import { Info } from 'lucide-react'
import { Badge, Card, CountUp, Ring, SegmentBar, Tip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toneBg, toneText, toneVar, type PreventiveIndex as Model } from './model'

export function PreventiveIndex({ index, className }: { index: Model; className?: string }) {
  const parts = index.contributors.map((c) => ({ value: Math.max(0.5, c.value * c.weight), color: toneVar[c.tone] }))
  const lost = 100 - index.score
  if (lost > 0) parts.push({ value: lost, color: 'var(--color-muted-2)' })

  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Índice preventivo</h3>
        <Tip content="Vacinas 35, peso 20, vermífugo 15, antipulgas 15 e check-up 15 pontos.">
          <button className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-muted hover:text-ink" aria-label="Como o índice é calculado">
            <Info className="size-4" strokeWidth={1.9} />
          </button>
        </Tip>
      </div>

      <div className="flex items-center gap-4 px-5 pt-4">
        <Ring value={index.score / 100} size={92} stroke={9} color={toneVar[index.tone]} track="var(--color-muted)">
          <span className="flex flex-col items-center leading-none">
            <CountUp to={index.score} className="text-[28px] font-bold tracking-[-0.03em] text-ink" />
            <span className="mt-0.5 text-[11px] font-semibold text-ink-3">de 100</span>
          </span>
        </Ring>
        <div className="min-w-0">
          <Badge tone={index.tone} dot>
            {index.label}
          </Badge>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">
            {index.contributors.filter((c) => c.tone === 'ok').length} de {index.contributors.length} itens em dia
          </div>
        </div>
      </div>

      <SegmentBar parts={parts} className="mt-5 px-5" />

      <ul className="mt-3 px-5 pb-4">
        {index.contributors.map((c, i) => (
          <li key={c.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
            <span className={cn('size-2 shrink-0 rounded-full', toneBg[c.tone])} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">{c.label}</div>
              <div className={cn('truncate text-[12px] font-medium', c.tone === 'ok' ? 'text-ink-3' : toneText[c.tone])}>{c.detail}</div>
            </div>
            <span className="num shrink-0 text-[12.5px] font-bold text-ink">
              {Math.round(c.value * c.weight)}
              <span className="font-semibold text-ink-4">/{c.weight}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
