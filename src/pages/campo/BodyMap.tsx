// Silhueta lateral (cão ou gato) com regiões tocáveis e escore de condição corporal.
import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Species } from '@/data/mock'
import { cn } from '@/lib/utils'
import { BCS_LABEL, type Region } from './data'
import type { Finding } from './campoStore'

export const BODY_VB = { w: 360, h: 216 }

function DogShape() {
  return (
    <>
      {/* pernas do lado de lá (mais escuras, atrás) */}
      <g fill="var(--color-line-2)">
        <rect x="118" y="128" width="17" height="74" rx="8.5" />
        <rect x="256" y="126" width="17" height="76" rx="8.5" />
      </g>
      <g fill="var(--color-muted-2)" stroke="var(--color-muted-2)" strokeLinejoin="round">
        <path d="M88 92 C 70 86, 56 72, 50 50" fill="none" strokeWidth="13" strokeLinecap="round" stroke="var(--color-muted-2)" />
        <rect x="80" y="70" width="190" height="78" rx="39" />
        <ellipse cx="112" cy="120" rx="38" ry="37" />
        <rect x="90" y="128" width="20" height="76" rx="10" />
        <rect x="230" y="124" width="20" height="80" rx="10" />
        <ellipse cx="250" cy="106" rx="35" ry="44" />
        <path d="M236 96 L 262 46 L 300 54 L 282 112 Z" strokeWidth="12" />
        <ellipse cx="292" cy="56" rx="31" ry="28" />
        <rect x="296" y="52" width="48" height="27" rx="13.5" />
      </g>
      {/* orelha caída */}
      <ellipse cx="279" cy="64" rx="11" ry="22" transform="rotate(16 279 64)" fill="var(--color-line-2)" />
      <circle cx="306" cy="49" r="3.2" fill="var(--color-ink)" />
      <ellipse cx="342" cy="59" rx="5.5" ry="4.8" fill="var(--color-ink)" />
    </>
  )
}

function CatShape() {
  return (
    <>
      <g fill="var(--color-line-2)">
        <rect x="130" y="132" width="14" height="70" rx="7" />
        <rect x="240" y="130" width="14" height="72" rx="7" />
      </g>
      <g fill="var(--color-muted-2)" stroke="var(--color-muted-2)" strokeLinejoin="round">
        <path d="M100 108 C 62 116, 36 92, 44 54 C 47 40, 56 32, 64 30" fill="none" strokeWidth="11" strokeLinecap="round" />
        <rect x="92" y="88" width="170" height="62" rx="31" />
        <ellipse cx="120" cy="124" rx="31" ry="30" />
        <rect x="108" y="130" width="15" height="74" rx="7.5" />
        <rect x="222" y="128" width="15" height="76" rx="7.5" />
        <ellipse cx="238" cy="114" rx="27" ry="34" />
        <path d="M232 104 L 252 66 L 286 72 L 262 118 Z" strokeWidth="10" />
        <circle cx="278" cy="72" r="31" />
        <path d="M256 54 L 260 20 L 280 44 Z" strokeWidth="6" />
        <path d="M284 42 L 304 22 L 306 56 Z" strokeWidth="6" />
        <ellipse cx="300" cy="82" rx="12" ry="10" />
      </g>
      <path d="M259 46 L 262 30 L 272 42 Z" fill="var(--color-coral-soft)" />
      <path d="M290 42 L 300 31 L 301 48 Z" fill="var(--color-coral-soft)" />
      <path d="M282 64 q 6 -5 11 0 q -5 5 -11 0 Z" fill="var(--color-ink)" />
      <path d="M306 80 l 6 -2 l -1 5 Z" fill="var(--color-coral)" />
      <g stroke="var(--color-ink-3)" strokeWidth="1.1" strokeLinecap="round">
        <path d="M312 86 L 338 82" />
        <path d="M312 90 L 336 92" />
      </g>
    </>
  )
}

export function regionAt(species: Species, x: number, y: number): Region {
  if (species === 'gato') {
    if (x >= 252 && y <= 100) return 'Cabeça'
    if (x >= 232 && y < 110) return 'Pescoço'
    if (x >= 215 && y >= 146) return 'Membro torácico'
    if (x <= 150 && y >= 146) return 'Membro pélvico'
    if (x >= 200) return 'Tórax'
    if (x <= 92 && y <= 116) return 'Cauda'
    if (x >= 150) return y < 104 ? 'Dorso' : 'Abdome'
    return 'Quadril'
  }
  if (x >= 268 && y <= 90) return 'Cabeça'
  if (x >= 244 && y < 100) return 'Pescoço'
  if (x >= 222 && y >= 150) return 'Membro torácico'
  if (x <= 150 && y >= 150) return 'Membro pélvico'
  if (x >= 208) return 'Tórax'
  if (x <= 84 && y <= 96) return 'Cauda'
  if (x >= 148) return y < 96 ? 'Dorso' : 'Abdome'
  return 'Quadril'
}

export function BodyMap({ species, findings, onAdd, onOpen }: { species: Species; findings: Finding[]; onAdd: (x: number, y: number, region: Region) => void; onOpen: (f: Finding) => void }) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [hover, setHover] = React.useState<Region | null>(null)
  const toLocal = (e: React.MouseEvent | React.PointerEvent) => {
    const svg = svgRef.current!
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse())
    return { x: Math.round(p.x), y: Math.round(p.y) }
  }
  return (
    <div className="relative" data-noswipe>
      <svg ref={svgRef} viewBox={`0 0 ${BODY_VB.w} ${BODY_VB.h}`} className="block w-full touch-manipulation" aria-label="Silhueta para marcar achados">
        {/* chão */}
        <ellipse cx="180" cy="206" rx="150" ry="5" fill="var(--color-muted)" />
        <g
          className="cursor-crosshair"
          onClick={(e) => {
            const { x, y } = toLocal(e)
            onAdd(x, y, regionAt(species, x, y))
          }}
          onPointerMove={(e) => {
            if (e.pointerType !== 'mouse') return
            const { x, y } = toLocal(e)
            setHover(regionAt(species, x, y))
          }}
          onPointerLeave={() => setHover(null)}
        >
          {species === 'gato' ? <CatShape /> : <DogShape />}
        </g>
        <AnimatePresence>
          {findings.map((f) => (
            <motion.g
              key={f.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 26 }}
              style={{ transformOrigin: `${f.x}px ${f.y}px`, transformBox: 'view-box' }}
              className="cursor-pointer"
              onClick={() => onOpen(f)}
            >
              <motion.circle cx={f.x} cy={f.y} fill="var(--color-lime)" initial={{ opacity: 0.8, r: 12 }} animate={{ opacity: 0, r: 28 }} transition={{ duration: 1.3, repeat: 2, ease: 'easeOut' }} />
              <circle cx={f.x} cy={f.y} r={12.5} fill="var(--color-black)" stroke="var(--color-lime)" strokeWidth={2.5} />
              <text x={f.x} y={f.y} dy="0.36em" textAnchor="middle" fontSize="12.5" fontWeight={700} fill="#fff" fontFamily="var(--font-sans)">
                {f.n}
              </text>
            </motion.g>
          ))}
        </AnimatePresence>
      </svg>
      <div className={cn('pointer-events-none absolute top-1 left-1 rounded-full bg-black px-3 py-1 text-[12.5px] font-semibold text-white transition-opacity', hover ? 'opacity-100' : 'opacity-0')}>{hover}</div>
    </div>
  )
}

/* Escore de condição corporal (vista de cima) */

function BcsFigure({ s, active }: { s: number; active: boolean }) {
  const ws = 7 + s * 0.55
  const ww = 2.8 + s * 1.15
  const wh = 6.2 + s * 0.62
  const c = 20
  const d = `M ${c - ws} 21 C ${c - ws} 28, ${c - ww} 31, ${c - ww} 37 C ${c - ww} 43, ${c - wh} 45, ${c - wh} 50 Q ${c} 60, ${c + wh} 50 C ${c + wh} 45, ${c + ww} 43, ${c + ww} 37 C ${c + ww} 31, ${c + ws} 28, ${c + ws} 21 Q ${c} 13, ${c - ws} 21 Z`
  const fill = active ? 'var(--color-black)' : 'var(--color-ink-4)'
  return (
    <svg viewBox="0 0 40 66" className="h-[50px] w-full" aria-hidden>
      <ellipse cx={c} cy={11} rx={5.6 + s * 0.12} ry={6.6} fill={fill} />
      <path d={d} fill={fill} />
      <path d={`M ${c} 56 L ${c} 64`} stroke={fill} strokeWidth={2.4} strokeLinecap="round" />
      {s <= 3 && (
        <g stroke="var(--color-card)" strokeWidth={0.9} strokeLinecap="round" opacity={0.85}>
          {[26, 30, 34].map((y) => (
            <path key={y} d={`M ${c - ws + 2.5} ${y} L ${c - 2} ${y + 1} M ${c + 2} ${y + 1} L ${c + ws - 2.5} ${y}`} />
          ))}
        </g>
      )}
    </svg>
  )
}

export function BcsPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div data-noswipe>
      <div className="grid grid-cols-9 gap-1">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((s) => (
          <button key={s} onClick={() => onChange(s)} aria-label={`Escore ${s}`} className={cn('flex flex-col items-center rounded-[14px] py-1.5 transition-colors', s === value ? 'bg-lime' : 'active:bg-muted')}>
            <motion.div animate={{ scale: s === value ? 1.08 : 0.92, opacity: s === value ? 1 : 0.55 }} transition={{ duration: 0.2 }} className="w-full px-0.5">
              <BcsFigure s={s} active={s === value} />
            </motion.div>
            <span className={cn('num mt-0.5 text-[12.5px] font-bold', s === value ? 'text-ink' : 'text-ink-4')}>{s}</span>
          </button>
        ))}
      </div>
      <input
        type="range"
        min={1}
        max={9}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Escore de condição corporal"
        className="mt-2 h-11 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-card [&::-moz-range-thumb]:shadow-pill [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[linear-gradient(90deg,var(--color-yellow)_0%,var(--color-green)_40%,var(--color-green)_55%,var(--color-yellow)_75%,var(--color-red)_100%)] [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(90deg,var(--color-yellow)_0%,var(--color-green)_40%,var(--color-green)_55%,var(--color-yellow)_75%,var(--color-red)_100%)] [&::-webkit-slider-thumb]:-mt-[11px] [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-black [&::-webkit-slider-thumb]:bg-card [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(17,18,20,.25)]"
      />
      <div className="flex items-center justify-between text-[12.5px] font-medium text-ink-3">
        <span>Magro</span>
        <span className={cn('rounded-full px-2.5 py-1 font-bold', value >= 4 && value <= 5 ? 'bg-green-soft text-green' : value >= 8 ? 'bg-red-soft text-red' : 'bg-yellow-soft text-yellow-ink')}>
          {value}/9 · {BCS_LABEL(value)}
        </span>
        <span>Obeso</span>
      </div>
    </div>
  )
}
