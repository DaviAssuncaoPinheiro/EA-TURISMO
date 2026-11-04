import { motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { CountUp } from '@/components/ui'
import { KPIS } from '@/data/mock'
import { brl } from '@/lib/utils'

function Bar({ label, value, strong, delay }: { label: string; value: number; strong?: boolean; delay: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-[12px]">
        <span className={strong ? 'font-medium text-ink' : 'text-ink-3'}>{label}</span>
        <span className="num font-medium text-ink">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-paper-2">
        <motion.div className={strong ? 'h-full rounded-full bg-sage-700' : 'h-full rounded-full bg-line-2'} initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }} />
      </div>
    </div>
  )
}

export function ResultStrip({ lateVaccines, lateBooked, revenue, visits }: { lateVaccines: number; lateBooked: number; revenue: number; visits: number }) {
  const delta = Math.round((KPIS.remindersConversion - KPIS.remindersConversionPrev) * 100)
  return (
    <section className="grid gap-6 rounded-2xl border border-line bg-card px-5 py-5 shadow-card md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-0 md:px-7 md:py-6">
      <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr] sm:gap-8 md:border-r md:border-line md:pr-8">
        <div>
          <div className="eyebrow mb-2">Lembretes que viraram visita</div>
          <div className="flex items-baseline gap-1 leading-none">
            <CountUp to={KPIS.remindersConversion * 100} className="font-display-tight text-[68px] font-medium text-sage-800 md:text-[84px]" />
            <span className="font-display text-[30px] text-sage-700 md:text-[36px]">%</span>
          </div>
          <div className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-ok-bg px-2 py-1 text-[12px] font-medium text-ok">
            <ArrowUpRight size={13} strokeWidth={2.2} /> +{delta} pontos no mês
          </div>
        </div>
        <div className="space-y-3 sm:pt-5">
          <Bar label="Com lembretes automáticos" value={KPIS.remindersConversion} strong delay={0.15} />
          <Bar label="Antes, com ligações avulsas" value={KPIS.remindersConversionPrev} delay={0} />
          <p className="text-[12px] leading-snug text-ink-3">Quando a mensagem já traz o dia em que a equipe está no bairro, o tutor responde mais rápido.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 md:pl-8">
        <div className="flex flex-col justify-center">
          <div className="eyebrow mb-1.5">Vacinas atrasadas</div>
          <div className="font-display text-[40px] leading-none font-medium text-late md:text-[44px]">
            <CountUp to={lateVaccines} />
          </div>
          <div className="mt-1.5 text-[12px] leading-snug text-ink-3">{lateBooked} já com visita marcada</div>
        </div>
        <div className="flex flex-col justify-center border-l border-line pl-5">
          <div className="eyebrow mb-1.5">Receita recuperada</div>
          <div className="font-display text-[34px] leading-none font-medium whitespace-nowrap text-ink md:text-[40px]">{brl(revenue)}</div>
          <div className="mt-1.5 text-[12px] leading-snug text-ink-3">estimativa de {visits} visitas confirmadas</div>
        </div>
      </div>
    </section>
  )
}
