import { motion } from 'motion/react'
import { CalendarCheck, Syringe, Wallet } from 'lucide-react'
import { Card, CountUp, IconCircle } from '@/components/ui'
import { KPIS } from '@/data/mock'
import { brl } from '@/lib/utils'

export function ResultStrip({ lateVaccines, lateBooked, revenue, visits }: { lateVaccines: number; lateBooked: number; revenue: number; visits: number }) {
  const now = Math.round(KPIS.remindersConversion * 100)
  const prev = Math.round(KPIS.remindersConversionPrev * 100)
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative col-span-2 overflow-hidden rounded-[28px] bg-black lg:col-span-1 bg-[radial-gradient(120%_140%_at_100%_0%,#2b2f38_0%,#111214_60%)] p-5 text-white md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[13px] font-medium text-white/60">Viraram visita</div>
            <div className="mt-2 flex items-baseline gap-1 leading-none">
              <CountUp to={now} className="text-[56px] font-bold tracking-[-0.04em] md:text-[64px]" />
              <span className="text-[28px] font-bold text-white/70">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] font-medium text-white/60">Antes</div>
            <div className="num mt-2 text-[28px] leading-none font-bold tracking-[-0.03em] text-white/80 md:text-[32px]">{prev}%</div>
          </div>
        </div>
        <div className="relative mt-6 h-2 rounded-full bg-white/15">
          <motion.div className="absolute inset-y-0 left-0 rounded-full bg-lime" initial={{ width: 0 }} animate={{ width: `${now}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
          <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-white/70" style={{ left: `${prev}%` }} />
        </div>
        <div className="mt-2.5 flex justify-between text-[12px] font-medium text-white/55">
          <span>{visits} visitas confirmadas</span>
          <span>+{now - prev} pontos</span>
        </div>
      </div>

      <Card className="flex flex-col justify-between gap-4 p-4 md:p-5">
        <IconCircle tone="coral" size={40}><Syringe size={18} strokeWidth={1.9} /></IconCircle>
        <div>
          <div className="text-[13px] font-medium text-ink-3">Vacinas atrasadas</div>
          <div className="mt-1 text-[28px] leading-none font-bold tracking-[-0.03em] text-ink md:text-[32px]"><CountUp to={lateVaccines} /></div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3"><CalendarCheck size={14} strokeWidth={1.9} /> {lateBooked} com visita marcada</div>
        </div>
      </Card>

      <Card className="flex flex-col justify-between gap-4 p-4 md:p-5">
        <IconCircle tone="green" size={40}><Wallet size={18} strokeWidth={1.9} /></IconCircle>
        <div>
          <div className="text-[13px] font-medium text-ink-3">Receita recuperada</div>
          <div className="num mt-1 text-[28px] leading-none font-bold tracking-[-0.03em] whitespace-nowrap md:text-[32px] text-ink">{brl(revenue)}</div>
          <div className="mt-2 text-[12.5px] font-medium text-ink-3">Neste mês</div>
        </div>
      </Card>
    </section>
  )
}
