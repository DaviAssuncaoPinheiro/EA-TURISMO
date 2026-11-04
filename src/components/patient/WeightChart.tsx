import * as React from 'react'
import { motion } from 'motion/react'
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Card, Segmented } from '@/components/ui'
import type { Pet } from '@/data/mock'
import { cn, kg } from '@/lib/utils'
import type { WeightPoint } from './model'

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const tipFmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
const nf = (n: number, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })

interface Row extends WeightPoint {
  t: number
  prev?: number
}

function WeightTip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: Row }> }) {
  const p = payload?.[0]?.payload
  if (!active || !p) return null
  const delta = p.prev != null ? p.kg - p.prev : null
  return (
    <div className="min-w-[132px] rounded-[14px] bg-black px-3 py-2.5 text-white shadow-float">
      <div className="text-[11.5px] font-semibold text-white/60">{p.fresh ? 'Hoje, em campo' : tipFmt.format(new Date(p.date)).replace(/\./g, '').replace(/ de /g, ' ')}</div>
      <div className="mt-1 flex items-center justify-between gap-4">
        <span className="flex items-center gap-2 text-[12.5px] font-medium text-white/80">
          <span className="h-3 w-[3px] rounded-full bg-blue" />
          Peso
        </span>
        <span className="num text-[13px] font-bold">{nf(p.kg)} kg</span>
      </div>
      {delta != null && Math.abs(delta) >= 0.05 && (
        <div className="mt-0.5 flex items-center justify-between gap-4 text-[12px] font-medium text-white/60">
          <span>vs. anterior</span>
          <span className="num">
            {delta > 0 ? '+' : '−'}
            {nf(Math.abs(delta))}
          </span>
        </div>
      )}
    </div>
  )
}

/* ───────────── Escore corporal ───────────── */

const BCS_LABEL = (n: number) => (n <= 3 ? 'Abaixo do peso' : n <= 5 ? 'Ideal' : n <= 7 ? 'Sobrepeso' : 'Obesidade')
const BCS_COLOR = (n: number) => (n <= 3 ? 'bg-yellow' : n <= 5 ? 'bg-green' : n <= 7 ? 'bg-yellow' : 'bg-red')

function BcsRow({ bcs }: { bcs: number }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex shrink-0 items-baseline gap-2 text-[13px]">
        <span className="font-semibold text-ink-3">Escore corporal</span>
        <span className="num font-bold text-ink">{bcs}/9</span>
        <span className="font-semibold text-ink-2">{BCS_LABEL(bcs)}</span>
      </div>
      <div className="grid flex-1 grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
          <motion.span
            key={n}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + n * 0.03 }}
            className={cn('h-2 rounded-full', n === bcs ? BCS_COLOR(n) : 'bg-muted')}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────────── Card ───────────── */

type Period = '6m' | '1a'

export function WeightChart({ pet, points, currentKg, fresh }: { pet: Pet; points: WeightPoint[]; currentKg: number; fresh: boolean }) {
  const gid = React.useId().replace(/[^a-zA-Z0-9]/g, '')
  const [period, setPeriod] = React.useState<Period>('1a')
  const [lo, hi] = pet.idealKg
  const all: Row[] = points.map((p, i) => ({ ...p, t: new Date(p.date).getTime(), prev: i > 0 ? points[i - 1].kg : undefined }))
  const rows = all.slice(-(period === '6m' ? 7 : 13))

  const kgs = rows.map((r) => r.kg)
  const min = Math.min(lo, ...kgs)
  const max = Math.max(hi, ...kgs)
  const pad = Math.max(0.3, (max - min) * 0.2)
  const span = max - min + 2 * pad
  const step = [0.2, 0.5, 1, 2, 5, 10].find((s) => span / s <= 5) ?? 10
  const domain: [number, number] = [Math.floor((min - pad) / step) * step, Math.ceil((max + pad) / step) * step]
  const yTicks: number[] = []
  for (let v = domain[0]; v <= domain[1] + 1e-9; v += step) yTicks.push(+v.toFixed(2))

  const delta = currentKg - rows[0].kg
  const inRange = currentKg >= lo && currentKg <= hi
  const outBy = currentKg > hi ? currentKg - hi : currentKg < lo ? lo - currentKg : 0
  const away = (currentKg > hi && delta > 0) || (currentKg < lo && delta < 0)

  const renderDot = (props: { cx?: number; cy?: number; index?: number; payload?: Row }) => {
    const { cx, cy, index, payload } = props
    if (cx == null || cy == null) return <g key={`d${index}`} />
    const last = index === rows.length - 1
    if (!last && !payload?.fresh) return <g key={`d${index}`} />
    return (
      <g key={`d${index}`}>
        {payload?.fresh && (
          <circle cx={cx} cy={cy} r={6} fill="var(--color-blue)" opacity={0.25}>
            <animate attributeName="r" values="6;13;6" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={cx} cy={cy} r={5} fill="var(--color-card)" stroke="var(--color-blue)" strokeWidth={2.5} />
      </g>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Peso</h3>
        <Segmented<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: '6m', label: '6M' },
            { value: '1a', label: '1A' },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="num text-[32px] leading-none font-bold tracking-[-0.03em] text-ink">{nf(currentKg)}</span>
            <span className="text-[14px] font-semibold text-ink-3">kg</span>
            {Math.abs(delta) >= 0.05 && (
              <span className={cn('num ml-1 text-[12.5px] font-semibold', away ? 'text-red' : 'text-green')}>
                {delta > 0 ? '▲ +' : '▼ −'}
                {nf(Math.abs(delta))} kg
              </span>
            )}
          </div>
          <div className="mt-1.5 text-[12.5px] font-medium text-ink-3">
            Faixa ideal {nf(lo)} a {nf(hi)} kg{fresh && ' · pesado hoje em campo'}
          </div>
        </div>
        <Badge tone={inRange ? 'ok' : outBy / hi > 0.05 ? 'late' : 'warn'} dot>
          {inRange ? 'Na faixa ideal' : `${kg(outBy)} ${currentKg > hi ? 'acima' : 'abaixo'}`}
        </Badge>
      </div>

      <div className="mt-2 h-[220px] px-1 sm:h-[240px] sm:px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 16, right: 16, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id={`w${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-blue)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--color-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <ReferenceArea
              y1={lo}
              y2={hi}
              fill="var(--color-green-soft)"
              fillOpacity={0.9}
              ifOverflow="extendDomain"
              label={{ value: 'Faixa ideal', position: 'insideTopLeft', fill: 'var(--color-green)', fontSize: 11, fontWeight: 600, dx: 6, dy: 4 }}
            />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={rows.filter((_, i) => period === '6m' || (rows.length - 1 - i) % 2 === 0).map((r) => r.t)}
              tickFormatter={(t: number) => monthFmt.format(new Date(t)).replace('.', '')}
              tick={{ fontSize: 11.5, fill: 'var(--color-ink-3)', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={domain}
              ticks={yTicks}
              tickFormatter={(v: number) => nf(v, step < 1 ? 1 : 0)}
              tick={{ fontSize: 11.5, fill: 'var(--color-ink-3)', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip content={<WeightTip />} cursor={{ stroke: 'var(--color-ink-4)', strokeDasharray: '3 4', strokeWidth: 1.2 }} />
            <Area
              key={period}
              type="monotone"
              dataKey="kg"
              stroke="var(--color-blue)"
              strokeWidth={2.4}
              fill={`url(#w${gid})`}
              dot={renderDot}
              activeDot={{ r: 5, fill: 'var(--color-card)', stroke: 'var(--color-blue)', strokeWidth: 2.5 }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto border-t border-line px-5 py-4">
        <BcsRow bcs={pet.bcs} />
      </div>
    </Card>
  )
}
