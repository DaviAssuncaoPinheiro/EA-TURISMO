// Mini mapa da rota do dia: terra clara, rio azul acinzentado, rota preta e pins numerados.
import * as React from 'react'
import { motion } from 'motion/react'
import { AVENIDAS, BASE, IGARAPES, RIVER_PATH, ZONES } from '@/data/geo'
import type { Visit, VisitStatus } from '@/data/mock'
import { bairroOf } from './data'

export function MiniMap({ visits, status, activeId, height = 170 }: { visits: Visit[]; status: Record<string, VisitStatus>; activeId?: string; height?: number }) {
  const fid = React.useId().replace(/:/g, '')
  const pts = visits.map((v) => ({ v, b: bairroOf(v) }))
  const xs = [BASE.x, ...pts.map((p) => p.b.x)]
  const ys = [BASE.y, ...pts.map((p) => p.b.y)]
  const pad = 36
  let x0 = Math.min(...xs) - pad
  let x1 = Math.max(...xs) + pad
  let y0 = Math.min(...ys) - pad
  let y1 = Math.max(...ys) + pad
  // mantém a proporção do cartão
  const ratio = 346 / height
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
  const u = vw / 346 // 1px de tela em unidades do mapa

  const path = ['M', BASE.x, BASE.y, ...pts.flatMap((p) => ['L', p.b.x, p.b.y])].join(' ')
  const doneIdx = pts.reduce((acc, p, i) => (status[p.v.id] === 'concluida' ? i + 1 : acc), 0)
  const donePath = ['M', BASE.x, BASE.y, ...pts.slice(0, doneIdx + (activeId ? 1 : 0)).flatMap((p) => ['L', p.b.x, p.b.y])].join(' ')

  return (
    <svg viewBox={`${x0} ${y0} ${vw} ${y1 - y0}`} className="block w-full" style={{ height }} aria-label="Mapa da rota do dia">
      <defs>
        <filter id={`pin-${fid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy={u * 1.2} stdDeviation={u * 1.6} floodColor="#111214" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect x={x0} y={y0} width={vw} height={y1 - y0} fill="var(--color-muted)" />
      {ZONES.map((z) => (
        <polygon key={z.id} points={z.polygon.map((p) => p.join(',')).join(' ')} fill="var(--color-card)" fillOpacity={0.5} stroke="var(--color-line-2)" strokeWidth={u * 0.8} />
      ))}
      {AVENIDAS.map((a) => (
        <path key={a.name} d={a.d} fill="none" stroke="var(--color-card)" strokeWidth={u * 3.2} strokeLinecap="round" />
      ))}
      {IGARAPES.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--color-river)" strokeWidth={u * 2.4} strokeLinecap="round" />
      ))}
      <path d={RIVER_PATH} fill="var(--color-river)" />
      {/* rota planejada */}
      <path d={path} fill="none" stroke="var(--color-ink-3)" strokeWidth={u * 1.6} strokeDasharray={`${u * 4} ${u * 4}`} strokeLinejoin="round" strokeLinecap="round" />
      {/* trecho percorrido */}
      <motion.path d={donePath} fill="none" stroke="var(--color-black)" strokeWidth={u * 3.2} strokeLinejoin="round" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }} />
      {/* base */}
      <g filter={`url(#pin-${fid})`}>
        <rect x={BASE.x - u * 8} y={BASE.y - u * 8} width={u * 16} height={u * 16} rx={u * 5} fill="var(--color-black)" />
        <circle cx={BASE.x} cy={BASE.y} r={u * 3} fill="var(--color-lime)" />
      </g>
      {pts.map((p, i) => {
        const st = status[p.v.id]
        const active = p.v.id === activeId
        const done = st === 'concluida'
        return (
          <g key={p.v.id}>
            {active && (
              <motion.circle cx={p.b.x} cy={p.b.y} fill="var(--color-lime)" initial={{ opacity: 0.7, r: u * 12 }} animate={{ opacity: 0, r: u * 26 }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} />
            )}
            <g filter={`url(#pin-${fid})`}>
              <circle cx={p.b.x} cy={p.b.y} r={u * (active ? 13 : 11)} fill={active ? 'var(--color-lime)' : 'var(--color-card)'} />
              {!active && <circle cx={p.b.x} cy={p.b.y} r={u * 8} fill={done ? 'var(--color-muted-2)' : 'var(--color-black)'} />}
            </g>
            <text x={p.b.x} y={p.b.y} dy="0.36em" textAnchor="middle" fontSize={u * (active ? 11 : 9)} fontWeight={800} fontFamily="var(--font-sans)" fill={active ? 'var(--color-ink)' : done ? 'var(--color-ink-3)' : '#fff'}>
              {i + 1}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
