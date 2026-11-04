import { Info } from 'lucide-react'
import { Badge, Card, CountUp, Ring, Tip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toneBg, toneText, toneVar, type PreventiveIndex as Model } from './model'

export function PreventiveIndex({ index, className }: { index: Model; className?: string }) {
  const ok = index.contributors.filter((c) => c.tone === 'ok').length
  return (
    <Card className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Prevenção</h3>
        <Tip content="Vacinas, peso, vermífugo, antipulgas e check-up.">
          <button className="inline-flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-muted hover:text-ink" aria-label="O que entra na conta">
            <Info className="size-4" strokeWidth={1.9} />
          </button>
        </Tip>
      </div>

      <div className="flex items-center gap-4 px-5 pt-3">
        <Ring value={index.score / 100} size={76} stroke={8} color={toneVar[index.tone]} track="var(--color-muted)">
          <CountUp to={index.score} className="text-[22px] font-bold tracking-[-0.03em] text-ink" />
        </Ring>
        <div className="min-w-0">
          <Badge tone={index.tone} dot>
            {index.label}
          </Badge>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">
            {ok} de {index.contributors.length} itens em dia
          </div>
        </div>
      </div>

      <ul className="mt-3 px-5 pb-4">
        {index.contributors.map((c, i) => (
          <li key={c.id} className={cn('flex items-center gap-3 py-2.5', i > 0 && 'border-t border-line')}>
            <span className={cn('size-2 shrink-0 rounded-full', toneBg[c.tone])} />
            <span className="w-[86px] shrink-0 text-[13px] font-semibold text-ink">{c.label}</span>
            <span className={cn('min-w-0 flex-1 truncate text-right text-[12.5px] font-medium', c.tone === 'ok' ? 'text-ink-3' : toneText[c.tone])}>{c.detail}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
