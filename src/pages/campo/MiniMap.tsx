// Mini-mapa compacto da rota do dia (o mapa grande fica no painel).
import { motion } from 'motion/react'
import { BASE, IGARAPES, RIVER_PATH, ZONES } from '@/data/geo'
import type { Visit, VisitStatus } from '@/data/mock'
import { bairroOf } from './data'

export function MiniMap({ visits, status, activeId, height = 150 }: { visits: Visit[]; status: Record<string, VisitStatus>; activeId?: string; height?: number }) {
  const pts = visits.map((v) => ({ v, b: bairroOf(v) }))
  const xs = [BASE.x, ...pts.map((p) => p.b.x)]
  const ys = [BASE.y, ...pts.map((p) => p.b.y)]
  const pad = 34
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  // mantém proporção ~ 2.3:1
  const ratio = 350 / height
  const w = x1 - x0
  const h = y1 - y0
  if (w / h < ratio) {
    const nw = h * ratio
    x0 -= (nw - w) / 2
    x1 = x0 + nw
  } else {
    const nh = w / ratio
    y0 -= (nh - h) / 2
    y1 = y0 + nh
  }
  const vw = x1 - x0
  const unit = vw / 350 // 1px de tela em unidades do mapa

  const path = ['M', BASE.x, BASE.y, ...pts.flatMap((p) => ['L', p.b.x, p.b.y])].join(' ')
  const doneIdx = pts.reduce((acc, p, i) => (status[p.v.id] === 'concluida' ? i + 1 : acc), 0)
  const donePath = ['M', BASE.x, BASE.y, ...pts.slice(0, doneIdx + (activeId ? 1 : 0)).flatMap((p) => ['L', p.b.x, p.b.y])].join(' ')

  return (
    <svg viewBox={`${x0} ${y0} ${vw} ${y1 - y0}`} className="block w-full" style={{ height }} aria-label="Mapa da rota do dia">
      <rect x={x0} y={y0} width={vw} height={y1 - y0} fill="var(--color-paper-2)" />
      {ZONES.map((z) => (
        <polygon key={z.id} points={z.polygon.map((p) => p.join(',')).join(' ')} fill={z.hex} fillOpacity={0.09} stroke={z.hex} strokeOpacity={0.35} strokeWidth={unit} strokeDasharray={`${unit * 3} ${unit * 3}`} />
      ))}
      {IGARAPES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--color-river)" strokeOpacity={0.22} strokeWidth={unit * 2.2} strokeLinecap="round" />
      ))}
      <path d={RIVER_PATH} fill="var(--color-river)" fillOpacity={0.88} />
      {/* rota planejada */}
      <path d={path} fill="none" stroke="var(--color-ink-3)" strokeWidth={unit * 1.6} strokeDasharray={`${unit * 4} ${unit * 4}`} strokeLinejoin="round" strokeLinecap="round" />
      {/* trecho percorrido */}
      <motion.path d={donePath} fill="none" stroke="var(--color-sage-700)" strokeWidth={unit * 3} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
      {/* base */}
      <rect x={BASE.x - unit * 6} y={BASE.y - unit * 6} width={unit * 12} height={unit * 12} rx={unit * 3} fill="var(--color-ink)" />
      {pts.map((p, i) => {
        const st = status[p.v.id]
        const active = p.v.id === activeId
        const done = st === 'concluida'
        const r = unit * (active ? 11 : 9)
        return (
          <g key={p.v.id}>
            {active && (
              <motion.circle cx={p.b.x} cy={p.b.y} fill="var(--color-terra-500)" initial={{ opacity: 0.5, r }} animate={{ opacity: 0, r: r * 2.3 }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} />
            )}
            <circle cx={p.b.x} cy={p.b.y} r={r} fill={active ? 'var(--color-terra-600)' : done ? 'var(--color-sage-700)' : 'var(--color-card)'} stroke={active || done ? 'var(--color-card)' : 'var(--color-ink-2)'} strokeWidth={unit * 1.6} />
            <text x={p.b.x} y={p.b.y} dy="0.36em" textAnchor="middle" fontSize={unit * (active ? 11 : 10)} fontWeight={700} fontFamily="var(--font-sans)" fill={active || done ? 'var(--color-paper)' : 'var(--color-ink)'}>
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
