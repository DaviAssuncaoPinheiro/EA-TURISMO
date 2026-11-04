import { motion } from 'motion/react'
import { Info } from 'lucide-react'
import { Card, CountUp, Ring, Tip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { toneBg, toneText, toneVar, type PreventiveIndex as Model } from './model'

export function PreventiveIndex({ index, className }: { index: Model; className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <div className="eyebrow">Índice preventivo</div>
        <Tip content="Calculado a partir de vacinas em dia (35%), vermífugo (15%), antipulgas (15%), peso na faixa ideal (20%) e check-up recente (15%).">
          <button className="-m-1.5 rounded-md p-1.5 text-ink-4 hover:bg-paper-2 hover:text-ink-2" aria-label="Como o índice é calculado">
            <Info className="size-3.5" strokeWidth={1.8} />
          </button>
        </Tip>
      </div>

      <div className="flex items-center gap-5 px-5 pt-3 pb-4">
        <Ring value={index.score / 100} size={124} stroke={11} color={toneVar[index.tone]} track="var(--color-paper-2)">
          <span className="flex flex-col items-center leading-none">
            <CountUp to={index.score} className="font-display text-[40px] font-medium tracking-[-0.03em] text-ink" />
            <span className="mt-1 text-[11px] text-ink-3">de 100</span>
          </span>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className={cn('font-display text-[22px] leading-tight font-medium', toneText[index.tone])}>{index.label}</div>
          <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{index.summary}</p>
        </div>
      </div>

      <div className="border-t border-line px-5 pt-3 pb-4">
        <div className="eyebrow mb-2.5">Contribuidores</div>
        <ul className="flex flex-col gap-3">
          {index.contributors.map((c, i) => (
            <li key={c.id}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-medium text-ink">{c.label}</span>
                <span className={cn('truncate text-right text-[12px]', c.tone === 'ok' ? 'text-ink-3' : toneText[c.tone])}>{c.detail}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-paper-2">
                <motion.div
                  className={cn('h-full origin-left rounded-full', c.tone === 'ok' ? 'bg-sage-600' : toneBg[c.tone])}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.max(0.03, c.value) }}
                  transition={{ duration: 0.9, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}
