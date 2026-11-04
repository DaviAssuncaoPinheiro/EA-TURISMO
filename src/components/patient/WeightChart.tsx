import * as React from 'react'
import { motion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Badge, Card } from '@/components/ui'
import type { Pet } from '@/data/mock'
import { fmt } from '@/data/time'
import { cn, kg } from '@/lib/utils'
import type { WeightPoint } from './model'

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const monthLong = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const nf = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

interface Row extends WeightPoint {
  t: number
  prev?: number
}

function WeightTip({ active, payload, ideal }: { active?: boolean; payload?: ReadonlyArray<{ payload?: Row }>; ideal: [number, number] }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  const [lo, hi] = ideal
  const delta = p.prev != null ? p.kg - p.prev : null
  const state = p.kg > hi ? { t: `${nf(p.kg - hi)} kg acima da faixa`, tone: 'late' as const } : p.kg < lo ? { t: `${nf(lo - p.kg)} kg abaixo da faixa`, tone: 'warn' as const } : { t: 'Na faixa ideal', tone: 'ok' as const }
  return (
    <div className="min-w-[168px] rounded-lg border border-line bg-card px-3 py-2.5 shadow-lift">
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{p.fresh ? 'Hoje · em campo' : monthLong.format(new Date(p.date))}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="num font-display text-[22px] leading-none font-semibold text-ink">{nf(p.kg)}</span>
        <span className="text-[12px] text-ink-3">kg</span>
        {delta != null && Math.abs(delta) >= 0.05 && (
          <span className={cn('num ml-auto text-[11.5px] font-medium', delta > 0 ? 'text-terra-700' : 'text-sage-700')}>
            {delta > 0 ? '+' : '−'}
            {nf(Math.abs(delta))} kg
          </span>
        )}
      </div>
      <div className={cn('mt-1.5 text-[11.5px] font-medium', state.tone === 'ok' ? 'text-ok' : state.tone === 'warn' ? 'text-warn' : 'text-late')}>{state.t}</div>
    </div>
  )
}

/* ───────────── Escore de condição corporal ───────────── */

const BCS_LABEL = (n: number) => (n <= 3 ? 'Abaixo do peso' : n <= 5 ? 'Ideal' : n <= 7 ? 'Sobrepeso' : 'Obesidade')
const BCS_COLOR = (n: number) => (n <= 3 ? 'bg-warn/70' : n <= 5 ? 'bg-ok' : n <= 7 ? 'bg-warn' : 'bg-late')

function BcsRuler({ bcs }: { bcs: number }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="eyebrow">Escore de condição corporal</span>
        <span className="text-[12.5px] text-ink-2">
          <span className="num font-semibold text-ink">{bcs}</span>
          <span className="text-ink-3">/9</span> · {BCS_LABEL(bcs)}
        </span>
      </div>
      <div className="relative pt-3">
        <motion.div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          initial={{ left: '5.5%', opacity: 0 }}
          animate={{ left: `${((bcs - 0.5) / 9) * 100}%`, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <svg width="10" height="7" viewBox="0 0 10 7" aria-hidden>
            <path d="M0 0h10L5 7z" fill="var(--color-ink)" />
          </svg>
        </motion.div>
        <div className="grid grid-cols-9 gap-[3px]">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div className={cn('h-2 w-full rounded-[3px] transition-opacity', BCS_COLOR(n), n === bcs ? 'opacity-100' : 'opacity-30')} />
              <span className={cn('num font-mono text-[10px]', n === bcs ? 'font-medium text-ink' : 'text-ink-4')}>{n}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-9 text-[10.5px] text-ink-3">
          <span className="col-span-3">Magro</span>
          <span className="col-span-2 text-center">Ideal</span>
          <span className="col-span-2 text-center">Sobrepeso</span>
          <span className="col-span-2 text-right">Obeso</span>
        </div>
      </div>
    </div>
  )
}

/* ───────────── Card ───────────── */

export function WeightChart({ pet, points, currentKg, fresh }: { pet: Pet; points: WeightPoint[]; currentKg: number; fresh: boolean }) {
  const gid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const [lo, hi] = pet.idealKg
  const rows: Row[] = points.map((p, i) => ({ ...p, t: new Date(p.date).getTime(), prev: i > 0 ? points[i - 1].kg : undefined }))
  const kgs = rows.map((r) => r.kg)
  const min = Math.min(lo, ...kgs)
  const max = Math.max(hi, ...kgs)
  const pad = Math.max(0.3, (max - min) * 0.18)
  const span = max - min + 2 * pad
  const step = [0.2, 0.5, 1, 2, 5, 10].find((s) => span / s <= 5) ?? 10
  const domain: [number, number] = [Math.floor((min - pad) / step) * step, Math.ceil((max + pad) / step) * step]
  const yTicks: number[] = []
  for (let v = domain[0]; v <= domain[1] + 1e-9; v += step) yTicks.push(+v.toFixed(2))

  const first = rows.find((r) => new Date(r.date) >= new Date(Date.now() - 365 * 86400000)) ?? rows[0]
  const yearDelta = currentKg - first.kg
  const Trend = Math.abs(yearDelta) < 0.1 ? Minus : yearDelta > 0 ? TrendingUp : TrendingDown
  const inRange = currentKg >= lo && currentKg <= hi
  const outBy = currentKg > hi ? currentKg - hi : currentKg < lo ? lo - currentKg : 0

  const renderDot = (props: { cx?: number; cy?: number; index?: number; payload?: Row }) => {
    const { cx, cy, index, payload } = props
    if (cx == null || cy == null) return <g key={`d${index}`} />
    const last = index === rows.length - 1
    if (payload?.fresh)
      return (
        <g key={`d${index}`}>
          <circle cx={cx} cy={cy} r={6} fill="var(--color-terra-500)" opacity={0.25}>
            <animate attributeName="r" values="6;13;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r={5.5} fill="var(--color-terra-600)" stroke="var(--color-card)" strokeWidth={2.5} />
        </g>
      )
    return <circle key={`d${index}`} cx={cx} cy={cy} r={last ? 4.5 : 2.6} fill={last ? 'var(--color-sage-800)' : 'var(--color-card)'} stroke="var(--color-sage-700)" strokeWidth={last ? 2.5 : 1.5} />
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-4">
        <div>
          <div className="eyebrow mb-1">Peso · últimos {rows.length} meses</div>
          <div className="flex items-baseline gap-2">
            <span className="num font-display text-[34px] leading-none font-medium text-ink">{nf(currentKg)}</span>
            <span className="text-[14px] text-ink-3">kg</span>
            {fresh && (
              <Badge tone="terra" className="ml-1 self-center">
                Pesado hoje em campo
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-2">
            <span className={cn('inline-flex items-center gap-1 font-medium', Math.abs(yearDelta) < 0.1 ? 'text-ink-3' : inRange ? 'text-sage-700' : 'text-terra-700')}>
              <Trend className="size-3.5" strokeWidth={2} />
              {yearDelta >= 0 ? '+' : '−'}
              {nf(Math.abs(yearDelta))} kg em 12 meses
            </span>
            <span className="text-ink-4">·</span>
            <span>
              Faixa ideal{' '}
              <span className="num font-medium text-ink">
                {nf(lo)}–{nf(hi)} kg
              </span>
            </span>
          </div>
        </div>
        <Badge tone={inRange ? 'ok' : outBy / hi > 0.05 ? 'late' : 'warn'} dot>
          {inRange ? 'Dentro da faixa' : `${kg(outBy)} ${currentKg > hi ? 'acima' : 'abaixo'}`}
        </Badge>
      </div>

      <div className="mt-3 h-[210px] px-1 sm:h-[240px] sm:px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 12, right: 18, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id={`w${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-sage-600)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--color-sage-600)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="2 4" />
            <ReferenceArea
              y1={lo}
              y2={hi}
              fill="var(--color-sage-200)"
              fillOpacity={0.45}
              stroke="var(--color-sage-300)"
              strokeOpacity={0.7}
              strokeDasharray="3 3"
              ifOverflow="extendDomain"
              label={{ value: 'Faixa ideal', position: 'insideBottomLeft', fill: 'var(--color-sage-700)', fontSize: 10.5, fontFamily: 'var(--font-mono)', dx: 4, dy: -4 }}
            />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={rows.filter((_, i) => (rows.length - 1 - i) % 2 === 0).map((r) => r.t)}
              tickFormatter={(t: number) => monthFmt.format(new Date(t)).replace('.', '')}
              tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              domain={domain}
              ticks={yTicks}
              tickFormatter={(v: number) => nf(v, step < 1 ? 1 : 0)}
              tick={{ fontSize: 11, fill: 'var(--color-ink-3)' }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip content={<WeightTip ideal={pet.idealKg} />} cursor={{ stroke: 'var(--color-ink-4)', strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="kg"
              stroke="var(--color-sage-700)"
              strokeWidth={2.2}
              fill={`url(#w${gid})`}
              dot={renderDot}
              activeDot={{ r: 5, fill: 'var(--color-sage-800)', stroke: 'var(--color-card)', strokeWidth: 2 }}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 border-t border-line px-5 py-4">
        <BcsRuler bcs={pet.bcs} />
        <p className="mt-3 text-[12.5px] text-ink-3">
          Última pesagem {fresh ? 'hoje, registrada no app de campo' : `em ${fmt.date(rows[rows.length - 1].date)}`}.{' '}
          {!inRange && currentKg > hi && 'Plano em curso: dieta controlada, exercício leve e pesagem a cada visita.'}
          {!inRange && currentKg < lo && 'Acompanhar apetite e reavaliar a dieta na próxima visita.'}
        </p>
      </div>
    </Card>
  )
}
