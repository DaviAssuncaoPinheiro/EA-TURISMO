import * as React from 'react'
import { animate, motion } from 'motion/react'
import { AVENIDAS, BAIRROS, BASE, IGARAPES, RIVER_PATH, SOLIMOES_PATH, ZONES, type ZoneId } from '@/data/geo'
import { PET, type VisitStatus } from '@/data/mock'
import { cn } from '@/lib/utils'
import {
  addressPoint,
  BASE_PT,
  circleRect,
  coverBox,
  fitBox,
  KM_PER_UNIT,
  placeLabels,
  smoothPath,
  type Box,
  type LabelReq,
  type Pt,
  type Rect,
} from './geometry'

/* ───────────── tipos públicos ───────────── */

export interface MapVisit {
  id: string
  /** pet principal (foto do pin) */
  petId: string
  /** pets adicionais na mesma visita (mostra "+n") */
  extraPets?: number
  bairro: string
  /** semente do deslocamento dentro do bairro (ex.: tutorId) */
  seed?: string
  status: VisitStatus
  /** número da parada exibido no pin */
  order?: number
  /** texto curto no balão de seleção (ex.: "11:20 · Aleixo") */
  caption?: string
}

export interface VetMarker {
  at: Pt
  color: string
  initials: string
  title?: string
}

export interface MapCtx {
  /** unidades do mapa por pixel de tela (use para tamanhos constantes na tela) */
  u: number
  box: Box
}

export interface CityMapProps {
  visits?: MapVisit[]
  /** ordem das paradas (ids) a partir da BASE */
  routeOrder?: string[]
  /** rota de comparação, desenhada como fantasma tracejado */
  compareOrder?: string[]
  /** 'optimized' = sálvia contínua; 'naive' = terracota (rota ruim) */
  routeVariant?: 'optimized' | 'naive'
  showRoute?: boolean
  /** troque para redesenhar a rota do zero (ex.: ao trocar de veterinário) */
  routeKey?: string
  selectedVisitId?: string | null
  onSelectVisit?: (id: string | null) => void
  /** zonas em destaque; as demais ficam esmaecidas */
  highlightZones?: ZoneId[]
  selectedZone?: ZoneId | null
  onSelectZone?: (z: ZoneId | null) => void
  /** valores por zona para mapa de calor */
  heat?: Partial<Record<ZoneId, number>>
  heatMax?: number
  heatUnit?: string
  /** 'visits' enquadra as paradas (zoom); 'city' mostra Manaus inteira */
  focus?: 'city' | 'visits'
  /** proporção largura/altura. Sem ela, o mapa preenche a altura do pai */
  aspect?: number
  compact?: boolean
  showBairros?: boolean | 'auto'
  bairroHighlight?: string[]
  showAvenueNames?: boolean
  vetNow?: VetMarker | null
  /** camada extra em coordenadas do mapa */
  overlay?: (ctx: MapCtx) => React.ReactNode
  ariaLabel?: string
  className?: string
}

/* ───────────── constantes visuais ───────────── */

export const STATUS_RING: Record<VisitStatus, string> = {
  concluida: 'var(--color-ok)',
  'em-atendimento': 'var(--color-terra-500)',
  'a-caminho': 'var(--color-info)',
  agendada: 'var(--color-ink-3)',
  cancelada: 'var(--color-late)',
}

const LAND_OUT = '#e9e1cd'
const LAND_CITY = '#f6f1e6'
const EASE = [0.16, 1, 0.3, 1] as const

const HEAT_STOPS: [number, [number, number, number]][] = [
  [0, [0xee, 0xf3, 0xec]],
  [0.22, [0xcb, 0xdc, 0xcf]],
  [0.45, [0x93, 0xb4, 0x9d]],
  [0.68, [0x5e, 0x8a, 0x72]],
  [0.86, [0x2f, 0x54, 0x43]],
  [1, [0x1e, 0x3a, 0x2e]],
]
/** rampa sequencial sálvia (papel → tinta) */
export function heatColor(t: number) {
  const v = Math.min(1, Math.max(0, t))
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    const [p1, c1] = HEAT_STOPS[i]
    const [p0, c0] = HEAT_STOPS[i - 1]
    if (v <= p1) {
      const k = (v - p0) / (p1 - p0)
      const c = c0.map((x, j) => Math.round(x + (c1[j] - x) * k))
      return `rgb(${c[0]},${c[1]},${c[2]})`
    }
  }
  return 'rgb(30,58,46)'
}
export const heatIsDark = (t: number) => t > 0.56

const RIVER_EDGE_D = RIVER_PATH.split(' L')[0]
const SOLIMOES_EDGE_D = SOLIMOES_PATH.split(' L')[0]

/** Inverte um path "M x,y C ... C ..." para o texto das avenidas não ficar de cabeça para baixo */
function reversePath(d: string) {
  const n = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  const pts: Pt[] = []
  for (let i = 0; i < n.length; i += 2) pts.push({ x: n[i], y: n[i + 1] })
  if (pts.length < 4) return d
  const rev = [...pts].reverse()
  let out = `M${rev[0].x},${rev[0].y}`
  for (let i = 1; i < rev.length; i += 3) out += ` C${rev[i].x},${rev[i].y} ${rev[i + 1].x},${rev[i + 1].y} ${rev[i + 2].x},${rev[i + 2].y}`
  return out
}
const AVENUE_TEXT_PATHS = AVENIDAS.map((a) => {
  const n = (a.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  return n[n.length - 2] < n[0] ? reversePath(a.d) : a.d
})

const RESERVA_DUCKE = 'M812,34 C850,22 900,18 944,32 C972,44 988,72 984,108 C980,134 958,152 930,150 C908,146 896,128 880,122 C856,112 830,104 812,88 C800,72 800,48 812,34 Z'
const PONTE = 'M358,598 L318,680'
/** Mata ao redor da cidade (tudo acima do limite norte/leste das zonas) */
const FOREST =
  'M-50,-50 L1050,-50 L1050,612 L878,598 L908,540 L946,424 L956,300 L936,186 L884,132 L802,96 L736,62 L620,38 L470,46 L356,78 L330,200 L70,262 L-50,240 Z'

/* ───────────── hooks ───────────── */

/** Pré-carrega fotos: no SVG, uma <image> quebrada mostraria o ícone do navegador. */
const IMG_STATE = new Map<string, 'ok' | 'err' | 'loading'>()
function useLoadedImages(urls: string[]) {
  const [, tick] = React.useReducer((n: number) => n + 1, 0)
  const key = urls.join('|')
  React.useEffect(() => {
    let alive = true
    for (const url of urls) {
      if (IMG_STATE.has(url)) continue
      IMG_STATE.set(url, 'loading')
      const img = new Image()
      img.onload = () => {
        IMG_STATE.set(url, 'ok')
        if (alive) tick()
      }
      img.onerror = () => IMG_STATE.set(url, 'err')
      img.src = url
    }
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return (url: string) => IMG_STATE.get(url) === 'ok'
}

function useSize<T extends HTMLElement>() {
  const ref = React.useRef<T>(null)
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

const sameBox = (a: Box, b: Box) => Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5

function useAnimatedBox(target: Box, ready: boolean) {
  const [box, setBox] = React.useState(target)
  const cur = React.useRef(target)
  const settled = React.useRef(false)
  React.useEffect(() => {
    if (!ready) return
    if (!settled.current) {
      settled.current = true
      cur.current = target
      setBox(target)
      return
    }
    const from = cur.current
    if (sameBox(from, target)) return
    const c = animate(0, 1, {
      duration: 0.75,
      ease: EASE,
      onUpdate: (t) => {
        const b = { x: from.x + (target.x - from.x) * t, y: from.y + (target.y - from.y) * t, w: from.w + (target.w - from.w) * t, h: from.h + (target.h - from.h) * t }
        cur.current = b
        setBox(b)
      },
    })
    return () => c.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target.x, target.y, target.w, target.h, ready])
  return box
}

/* ───────────── componente ───────────── */

export function CityMap(props: CityMapProps) {
  const [probeRef, probe] = useSize<HTMLDivElement>()
  const narrow = probe.w > 0 && probe.w < 520
  return (
    <div ref={probeRef} className={cn('w-full', !props.aspect && 'h-full')}>
      <CityMapInner {...props} compact={props.compact ?? narrow} />
    </div>
  )
}

function CityMapInner({
  visits = [],
  routeOrder,
  compareOrder,
  routeVariant = 'optimized',
  showRoute = true,
  routeKey = 'route',
  selectedVisitId,
  onSelectVisit,
  highlightZones,
  selectedZone,
  onSelectZone,
  heat,
  heatMax,
  heatUnit = 'visitas',
  focus = 'city',
  aspect,
  compact,
  showBairros = 'auto',
  bairroHighlight,
  showAvenueNames,
  vetNow,
  overlay,
  ariaLabel = 'Mapa de Manaus',
  className,
}: CityMapProps) {
  const uid = React.useId().replace(/:/g, '')
  const [wrapRef, size] = useSize<HTMLDivElement>()
  const [hoverZone, setHoverZone] = React.useState<ZoneId | null>(null)
  const [hoverVisit, setHoverVisit] = React.useState<string | null>(null)

  const imgOk = useLoadedImages(visits.map((v) => PET[v.petId]?.photo).filter(Boolean) as string[])
  const ready = size.w > 0 && size.h > 0
  const ratio = ready ? size.w / size.h : aspect ?? 1000 / 680

  const points = React.useMemo(() => {
    const m: Record<string, Pt> = {}
    for (const v of visits) m[v.id] = addressPoint(v.bairro, v.seed ?? v.id)
    return m
  }, [visits])

  const target = React.useMemo(() => {
    if (focus === 'visits' && visits.length) {
      const pts = [BASE_PT, ...Object.values(points)]
      if (vetNow) pts.push(vetNow.at)
      return fitBox(pts, ratio, { pad: compact ? 52 : 64, minW: compact ? 340 : 400 })
    }
    return coverBox(ratio)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, points, ratio, compact])

  const box = useAnimatedBox(target, ready)
  const u = ready ? box.w / size.w : 1.4 // unidades por px
  const px = (n: number) => n * u

  const pinR = px(compact ? 12 : 15)
  const autoBairros = showBairros === 'auto' ? size.w >= 520 && !compact : showBairros
  const avenueNames = showAvenueNames ?? (!compact && size.w >= 640)
  const highlighted = highlightZones && highlightZones.length ? new Set(highlightZones) : null
  const max = heatMax ?? (heat ? Math.max(1, ...Object.values(heat).map((n) => n ?? 0)) : 1)

  /* rótulos: zonas → pins → bairros */
  const zoneFont = px(compact ? 9.5 : 10.5)
  const pinRects = visits.map((v) => circleRect(points[v.id], pinR + px(3)))
  const baseRect = circleRect(BASE_PT, px(11))
  const vetRect = vetNow ? circleRect(vetNow.at, px(13)) : null
  const hitsAny = (r: Rect, list: Rect[]) => list.some((t) => r.x0 < t.x1 && r.x1 > t.x0 && r.y0 < t.y1 && r.y1 > t.y0)
  // rótulo da zona desvia de pins (tenta o lugar original, depois acima/abaixo)
  const zoneLabelPos: Record<string, Pt> = {}
  const zoneLabelRects: Rect[] = ZONES.map((z) => {
    const w = Math.max(z.name.length * zoneFont * 0.68, heat ? px(78) : 0)
    const extra = heat ? px(overlay ? 54 : 30) : 0
    const at = (dy: number): Rect => ({ x0: z.label[0] - w / 2, y0: z.label[1] + dy - zoneFont, x1: z.label[0] + w / 2, y1: z.label[1] + dy + zoneFont * 0.4 + extra })
    const obst = [...pinRects, baseRect, ...(vetRect ? [vetRect] : [])]
    let dy = 0
    for (const c of [0, -px(26), px(26), -px(52), px(52)]) {
      if (!hitsAny(at(c), obst)) {
        dy = c
        break
      }
    }
    zoneLabelPos[z.id] = { x: z.label[0], y: z.label[1] + dy }
    return at(dy)
  })

  const petFont = px(compact ? 10.5 : 11.5)
  const pinLabels = React.useMemo(() => {
    const reqs: LabelReq[] = visits
      .filter((v) => v.id !== selectedVisitId)
      .map((v) => ({ id: v.id, x: points[v.id].x, y: points[v.id].y, text: PET[v.petId]?.name ?? '', size: petFont, gap: pinR + px(5), sides: ['r', 'l', 'b', 't'], charW: 0.6 }))
    return placeLabels(reqs, [...pinRects, baseRect, ...(vetRect ? [vetRect] : [])], box)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visits, points, selectedVisitId, u, box.x, box.y])

  const bairroFont = px(compact ? 9 : 10)
  const visitBairros = new Set(visits.map((v) => v.bairro))
  const bairroLabels = React.useMemo(() => {
    if (!autoBairros && !bairroHighlight?.length) return []
    const hl = new Set(bairroHighlight ?? [])
    const list = BAIRROS.filter((b) => !visitBairros.has(b.id)).filter((b) => autoBairros || hl.has(b.id))
    list.sort((a, b) => Number(hl.has(b.id)) - Number(hl.has(a.id)))
    const reqs: LabelReq[] = list.map((b) => ({ id: b.id, x: b.x, y: b.y, text: b.name, size: bairroFont, gap: px(5), sides: ['r', 'l', 'b', 't'] }))
    const obstacles = [...zoneLabelRects, ...pinRects, baseRect, ...pinLabels.map((p) => p.rect)]
    return placeLabels(reqs, obstacles, box)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBairros, bairroHighlight, visits, u, box.x, box.y, pinLabels, heat])

  /* rota */
  const routePts = (order?: string[]) => (order ? [BASE_PT, ...order.filter((id) => points[id]).map((id) => points[id])] : [])
  const routeD = routeOrder && routeOrder.length ? smoothPath(routePts(routeOrder)) : ''
  const compareD = compareOrder && compareOrder.length ? smoothPath(routePts(compareOrder)) : ''
  const routeColor = routeVariant === 'naive' ? 'var(--color-terra-600)' : 'var(--color-sage-800)'

  const selected = visits.find((v) => v.id === selectedVisitId)
  const fitsX = (cx: number, halfW: number) => cx - halfW >= box.x && cx + halfW <= box.x + box.w
  const scaleUnits = 2 / KM_PER_UNIT

  const zoneLabelsEl = (
        <g pointerEvents="none">
          {ZONES.map((z) => {
            const isSel = selectedZone === z.id
            const dim = (highlighted && !highlighted.has(z.id)) || (selectedZone && !isSel)
            const hv = heat?.[z.id]
            const t = hv != null ? hv / max : 0
            const dark = heat && heatIsDark(t) && !dim
            return (
              <g key={z.id} opacity={dim ? 0.4 : 1}>
                <text
                  x={zoneLabelPos[z.id].x}
                  y={zoneLabelPos[z.id].y}
                  textAnchor="middle"
                  fontSize={zoneFont}
                  fontWeight={500}
                  fill={heat ? (dark ? '#f4efe4' : 'var(--color-sage-900)') : z.hex}
                  stroke={heat ? 'none' : LAND_CITY}
                  strokeWidth={px(3)}
                  paintOrder="stroke"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.12em', filter: heat ? undefined : 'brightness(0.78)' }}
                >
                  {z.name.toUpperCase()}
                </text>
                {heat && hv != null && (
                  <text x={zoneLabelPos[z.id].x} y={zoneLabelPos[z.id].y + px(25)} textAnchor="middle" fill={dark ? '#f4efe4' : 'var(--color-sage-950)'}>
                    <tspan fontSize={px(compact ? 18 : 24)} fontWeight={600} style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                      {hv}
                    </tspan>
                    <tspan dx={px(4)} fontSize={px(9.5)} opacity={0.8}>
                      {heatUnit}
                    </tspan>
                  </text>
                )}
              </g>
            )
          })}
        </g>
  )

  return (
    <div
      ref={wrapRef}
      className={cn('relative w-full overflow-hidden', !aspect && 'h-full', className)}
      style={aspect ? { aspectRatio: String(aspect) } : undefined}
    >
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 block size-full select-none"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <defs>
          <style>{`
            @keyframes vd-flow-${uid} { to { stroke-dashoffset: -480; } }
            @keyframes vd-flow-r-${uid} { to { stroke-dashoffset: 480; } }
            @keyframes vd-route-${uid} { to { stroke-dashoffset: -60; } }
            .vd-cur-${uid} { animation: vd-flow-${uid} linear infinite; }
            .vd-cur-r-${uid} { animation: vd-flow-r-${uid} linear infinite; }
          `}</style>
          <pattern id={`forest-${uid}`} width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.9" fill="#7f9b84" opacity="0.32" />
            <circle cx="6.5" cy="6.5" r="0.7" fill="#7f9b84" opacity="0.22" />
          </pattern>
          <pattern id={`ducke-${uid}`} width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.3" fill="#5e8a72" opacity="0.4" />
            <circle cx="5.5" cy="5.5" r="1" fill="#5e8a72" opacity="0.3" />
          </pattern>
          <clipPath id={`river-${uid}`}>
            <path d={RIVER_PATH} />
          </clipPath>
          <clipPath id={`sol-${uid}`}>
            <path d={SOLIMOES_PATH} />
          </clipPath>
          <clipPath id={`pin-${uid}`} clipPathUnits="objectBoundingBox">
            <circle cx="0.5" cy="0.5" r="0.5" />
          </clipPath>
          {AVENUE_TEXT_PATHS.map((d, i) => (
            <path key={i} id={`av-${uid}-${i}`} d={d} />
          ))}
        </defs>

        {/* terra fora da cidade, com textura de floresta */}
        <rect x={-50} y={-50} width={1100} height={780} fill={LAND_CITY} onClick={() => { onSelectZone?.(null); onSelectVisit?.(null) }} />
        <path d={FOREST} fill={LAND_OUT} pointerEvents="none" />
        <path d={FOREST} fill={`url(#forest-${uid})`} pointerEvents="none" />

        {/* Reserva Ducke */}
        <path d={RESERVA_DUCKE} fill="#cfdccb" opacity={0.7} pointerEvents="none" />
        <path d={RESERVA_DUCKE} fill={`url(#ducke-${uid})`} pointerEvents="none" />
        {!compact && fitsX(898, px(36)) && (
          <text x={898} y={88} textAnchor="middle" fontSize={px(9.5)} fontStyle="italic" fill="var(--color-sage-700)" style={{ fontFamily: 'var(--font-display)' }} opacity={0.85} pointerEvents="none">
            Reserva Ducke
          </text>
        )}

        {/* base urbana */}
        <g pointerEvents="none">
          {ZONES.map((z) => (
            <polygon key={z.id} points={z.polygon.map((p) => p.join(',')).join(' ')} fill={LAND_CITY} stroke={LAND_CITY} strokeWidth={1.5} strokeLinejoin="round" />
          ))}
        </g>

        {/* zonas */}
        <g>
          {ZONES.map((z) => {
            const isSel = selectedZone === z.id
            const isHover = hoverZone === z.id
            const dim = (highlighted && !highlighted.has(z.id)) || (selectedZone && !isSel)
            const hv = heat?.[z.id]
            const t = hv != null ? hv / max : 0
            const fill = heat ? heatColor(t) : z.hex
            const fillOpacity = heat ? (dim ? 0.35 : isSel ? 0.95 : 0.82) : isSel ? 0.2 : dim ? 0.035 : highlighted ? 0.15 : isHover ? 0.16 : 0.1
            return (
              <motion.polygon
                key={z.id}
                points={z.polygon.map((p) => p.join(',')).join(' ')}
                initial={false}
                animate={{ fill, fillOpacity }}
                transition={{ duration: 0.45, ease: EASE }}
                strokeLinejoin="round"
                onMouseEnter={() => onSelectZone && setHoverZone(z.id)}
                onMouseLeave={() => setHoverZone(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectZone?.(selectedZone === z.id ? null : z.id)
                }}
                style={{ cursor: onSelectZone ? 'pointer' : 'default' }}
                stroke={heat ? LAND_CITY : 'none'}
                strokeWidth={heat ? px(1.5) : 0}
              />
            )
          })}
        </g>

        {/* igarapés */}
        <g fill="none" stroke="var(--color-river-2)" strokeLinecap="round" pointerEvents="none">
          {IGARAPES.map((d, i) => (
            <g key={i}>
              <path d={d} strokeWidth={px(3.2)} opacity={0.12} />
              <path d={d} strokeWidth={px(1.3)} opacity={0.55} />
            </g>
          ))}
        </g>

        {/* avenidas */}
        <g fill="none" strokeLinecap="round" pointerEvents="none">
          {AVENIDAS.map((a) => (
            <path key={a.name + 'c'} d={a.d} stroke="var(--color-line-2)" strokeWidth={px(3.6)} opacity={0.55} />
          ))}
          {AVENIDAS.map((a) => (
            <path key={a.name} d={a.d} stroke="#fffdf8" strokeWidth={px(2.2)} />
          ))}
        </g>

        {/* contornos pontilhados das zonas */}
        <g fill="none" pointerEvents="none">
          {ZONES.map((z) => {
            const isSel = selectedZone === z.id
            const dim = (highlighted && !highlighted.has(z.id)) || (selectedZone && !isSel)
            return (
              <polygon
                key={z.id}
                points={z.polygon.map((p) => p.join(',')).join(' ')}
                stroke={heat ? 'var(--color-sage-900)' : z.hex}
                strokeWidth={isSel ? px(1.6) : px(1)}
                strokeDasharray={isSel ? undefined : `${px(1.5)} ${px(3)}`}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={dim ? 0.3 : heat ? 0.35 : 0.75}
              />
            )
          })}
        </g>

        {/* Rio Negro */}
        <g pointerEvents="none">
          <path d={RIVER_PATH} fill="var(--color-river)" />
          <path d={RIVER_EDGE_D} fill="none" stroke="#4a3d33" strokeWidth={px(1)} opacity={0.9} />
          <g clipPath={`url(#river-${uid})`} fill="none" stroke="#f4efe4" strokeLinecap="round">
            {Array.from({ length: 12 }).map((_, k) => (
              <path
                key={k}
                d={RIVER_EDGE_D}
                transform={`translate(${-(k + 1) * 4.5}, ${(k + 1) * 6.5 + (k % 3) * 1.5})`}
                strokeWidth={0.8 + (k % 3) * 0.25}
                strokeDasharray={k % 2 ? '46 34 14 40' : '24 52 60 30'}
                opacity={0.05 + (k % 4) * 0.018}
                className={`vd-cur-${uid}`}
                style={{ animationDuration: `${52 + (k % 5) * 11}s`, animationDelay: `${-k * 7}s` }}
              />
            ))}
          </g>
          {/* Solimões barrento e o encontro das águas */}
          <path d={SOLIMOES_PATH} fill="var(--color-solimoes)" />
          <g clipPath={`url(#sol-${uid})`} fill="none" stroke="#dcc7a0" strokeLinecap="round">
            {[1, 2, 3, 4].map((k) => (
              <path key={k} d={SOLIMOES_EDGE_D} transform={`translate(0, ${k * 6})`} strokeWidth={0.9} strokeDasharray="38 26" opacity={0.5} className={`vd-cur-${uid}`} style={{ animationDuration: `${48 + k * 9}s` }} />
            ))}
          </g>
          <g fill="none" strokeLinecap="round">
            {[
              [-2.5, 0.5, '44 18', 1.6],
              [-5.5, 0.28, '22 30', 1.2],
              [-9, 0.14, '10 44', 1],
            ].map(([dy, op, dash, w], i) => (
              <path
                key={i}
                d={SOLIMOES_EDGE_D}
                transform={`translate(${i * 6}, ${dy})`}
                stroke="var(--color-solimoes)"
                strokeWidth={w as number}
                opacity={op as number}
                strokeDasharray={dash as string}
                className={`vd-cur-${uid}`}
                style={{ animationDuration: `${70 + i * 15}s` }}
              />
            ))}
          </g>
          {/* ponte */}
          <path d={PONTE} stroke="#d9cfbc" strokeWidth={px(2.4)} opacity={0.75} />
          <path d={PONTE} stroke="var(--color-river)" strokeWidth={px(0.6)} strokeDasharray={`${px(2)} ${px(2)}`} opacity={0.7} />
          {!compact && (
            <>
              <text x={205} y={634} transform="rotate(13 205 634)" fontSize={px(15)} fontStyle="italic" fill="#f4efe4" opacity={0.5} style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
                Rio Negro
              </text>
              <text x={372} y={668} fontSize={px(8)} fill="#f4efe4" opacity={0.45} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                PONTE RIO NEGRO
              </text>
            </>
          )}
          {fitsX(888, px(52)) && <text x={888} y={634} textAnchor="middle" fontSize={px(compact ? 7.5 : 8.5)} fill="#f4efe4" opacity={0.72} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
            ENCONTRO DAS ÁGUAS
          </text>}
          {!compact && (
            <text x={968} y={671} textAnchor="end" fontSize={px(8)} fontStyle="italic" fill="#5a452c" opacity={0.75} style={{ fontFamily: 'var(--font-display)' }}>
              Rio Solimões
            </text>
          )}
        </g>

        {/* nomes de avenidas */}
        {avenueNames && (
          <g pointerEvents="none" fontSize={px(7.5)} fill="var(--color-ink-4)" style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}>
            {AVENIDAS.map((a, i) => (
              <text key={a.name} dy={-px(3)} stroke={LAND_CITY} strokeWidth={px(2.5)} paintOrder="stroke" strokeLinejoin="round">
                <textPath href={`#av-${uid}-${i}`} startOffset="50%" textAnchor="middle">
                  {a.name.toLowerCase()}
                </textPath>
              </text>
            ))}
          </g>
        )}

        {/* bairros */}
        <g pointerEvents="none">
          {BAIRROS.filter((b) => !visitBairros.has(b.id)).map((b) => {
            const hl = bairroHighlight?.includes(b.id)
            const dim = (highlighted && !highlighted.has(b.zone)) || (selectedZone && selectedZone !== b.zone)
            return <circle key={b.id} cx={b.x} cy={b.y} r={px(hl ? 2.6 : 1.9)} fill={hl ? 'var(--color-ink)' : 'var(--color-ink-3)'} opacity={dim ? 0.3 : hl ? 0.9 : 0.6} />
          })}
          {bairroLabels.map((l) => {
            const b = BAIRROS.find((x) => x.id === l.id)!
            const hl = bairroHighlight?.includes(b.id)
            const dim = (highlighted && !highlighted.has(b.zone)) || (selectedZone && selectedZone !== b.zone)
            return (
              <text
                key={l.id}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                fontSize={bairroFont}
                fontWeight={hl ? 600 : 500}
                fill={hl ? 'var(--color-ink)' : 'var(--color-ink-3)'}
                opacity={dim ? 0.35 : 1}
                stroke={heat && !dim ? 'rgba(246,241,230,.85)' : LAND_CITY}
                strokeWidth={px(2.6)}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {b.name}
              </text>
            )
          })}
        </g>

        {focus !== 'visits' && zoneLabelsEl}
        {/* rota */}
        {showRoute && compareD && (
          <motion.path
            key={routeKey + '-ghost'}
            d={compareD}
            fill="none"
            stroke="var(--color-terra-600)"
            strokeWidth={px(1.6)}
            strokeDasharray={`${px(4)} ${px(4)}`}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            pointerEvents="none"
          />
        )}
        {showRoute && routeD && (
          <g pointerEvents="none" key={routeKey}>
            <motion.path
              d={routeD}
              fill="none"
              stroke="#fffcf6"
              strokeWidth={px(7)}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.9, d: routeD }}
              animate={{ pathLength: 1, d: routeD }}
              transition={{ pathLength: { duration: 1.3, ease: EASE }, d: { duration: 0.9, ease: EASE } }}
            />
            <motion.path
              d={routeD}
              fill="none"
              strokeWidth={px(2.8)}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, d: routeD, stroke: routeColor }}
              animate={{ pathLength: 1, d: routeD, stroke: routeColor }}
              transition={{ pathLength: { duration: 1.3, ease: EASE }, d: { duration: 0.9, ease: EASE }, stroke: { duration: 0.5 } }}
            />
            <motion.path
              d={routeD}
              fill="none"
              stroke="#fffcf6"
              strokeWidth={px(1.1)}
              strokeLinecap="round"
              strokeDasharray={`${px(1.5)} ${px(9)}`}
              initial={{ opacity: 0, d: routeD }}
              animate={{ opacity: 0.75, d: routeD }}
              transition={{ opacity: { delay: 1.1, duration: 0.5 }, d: { duration: 0.9, ease: EASE } }}
              style={{ animation: `vd-route-${uid} 3.5s linear infinite` }}
            />
          </g>
        )}

        {focus === 'visits' && zoneLabelsEl}

        {/* base */}
        {(visits.length > 0 || focus === 'visits') && (
          <g transform={`translate(${BASE.x} ${BASE.y})`} pointerEvents="none">
            <rect x={-px(9)} y={-px(9)} width={px(18)} height={px(18)} rx={px(5)} fill="var(--color-sage-900)" stroke="#fffcf6" strokeWidth={px(2)} />
            <path
              d={`M${-px(4.2)},${px(0.2)} L0,${-px(3.8)} L${px(4.2)},${px(0.2)} M${-px(3)},${-px(0.8)} L${-px(3)},${px(4)} L${px(3)},${px(4)} L${px(3)},${-px(0.8)}`}
              fill="none"
              stroke="#f4efe4"
              strokeWidth={px(1.4)}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              y={px(22)}
              textAnchor="middle"
              fontSize={px(8.5)}
              fill="var(--color-sage-900)"
              stroke={LAND_CITY}
              strokeWidth={px(2.5)}
              paintOrder="stroke"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}
            >
              BASE
            </text>
          </g>
        )}

        {/* rótulos dos pins */}
        <g pointerEvents="none">
          {pinLabels.map((l) => {
            const v = visits.find((x) => x.id === l.id)!
            const done = v.status === 'concluida'
            return (
              <text
                key={l.id}
                x={l.x}
                y={l.y}
                textAnchor={l.anchor}
                fontSize={petFont}
                fontWeight={600}
                fill={done ? 'var(--color-ink-3)' : hoverVisit === v.id ? 'var(--color-ink)' : 'var(--color-ink-2)'}
                stroke={LAND_CITY}
                strokeWidth={px(3)}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {PET[v.petId]?.name}
                {v.extraPets ? ` +${v.extraPets}` : ''}
              </text>
            )
          })}
        </g>

        {/* pins */}
        <g>
          {visits.map((v) => {
            const p = points[v.id]
            const pet = PET[v.petId]
            const isSel = v.id === selectedVisitId
            const isHover = v.id === hoverVisit
            const ring = STATUS_RING[v.status]
            const done = v.status === 'concluida'
            const live = v.status === 'em-atendimento'
            const r = pinR
            return (
              <g
                key={v.id}
                transform={`translate(${p.x} ${p.y})`}
                role={onSelectVisit ? 'button' : undefined}
                tabIndex={onSelectVisit ? 0 : undefined}
                aria-label={pet ? `${pet.name}${v.caption ? ', ' + v.caption : ''}` : v.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectVisit?.(isSel ? null : v.id)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectVisit?.(isSel ? null : v.id)
                  }
                }}
                onMouseEnter={() => setHoverVisit(v.id)}
                onMouseLeave={() => setHoverVisit(null)}
                style={{ cursor: onSelectVisit ? 'pointer' : 'default', outline: 'none' }}
              >
                {live && (
                  <motion.circle
                    r={r}
                    fill="none"
                    stroke="var(--color-terra-500)"
                    strokeWidth={px(2)}
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 2.1, opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                  />
                )}
                <motion.g
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: isSel ? 1.18 : isHover ? 1.08 : 1, opacity: 1 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  {isSel && <circle r={r + px(6.5)} fill="var(--color-sage-900)" opacity={0.12} />}
                  <circle r={r + px(2.2)} fill={ring} opacity={done ? 0.75 : 1} />
                  <circle r={r + px(0.4)} fill="#fffcf6" />
                  <circle r={r - px(1)} fill={pet?.species === 'gato' ? 'var(--color-sage-100)' : 'var(--color-terra-100)'} />
                  <text
                    y={px(4.5)}
                    textAnchor="middle"
                    fontSize={px(compact ? 11 : 13)}
                    fontWeight={600}
                    fill={pet?.species === 'gato' ? 'var(--color-sage-800)' : 'var(--color-terra-700)'}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {pet?.name[0]}
                  </text>
                  {pet && imgOk(pet.photo) && (
                    <image
                      href={pet.photo}
                      x={-(r - px(1))}
                      y={-(r - px(1))}
                      width={(r - px(1)) * 2}
                      height={(r - px(1)) * 2}
                      preserveAspectRatio="xMidYMid slice"
                      clipPath={`url(#pin-${uid})`}
                      opacity={done ? 0.7 : 1}
                    />
                  )}
                  {v.order != null && (
                    <g transform={`translate(${r * 0.78} ${-r * 0.78})`}>
                      <circle r={px(7.5)} fill={done ? 'var(--color-ok)' : live ? 'var(--color-terra-600)' : 'var(--color-sage-900)'} stroke="#fffcf6" strokeWidth={px(1.5)} />
                      <text y={px(3.2)} textAnchor="middle" fontSize={px(9)} fontWeight={600} fill="#fff" style={{ fontFamily: 'var(--font-mono)' }}>
                        {v.order}
                      </text>
                    </g>
                  )}
                </motion.g>
              </g>
            )
          })}
        </g>

        {/* veterinário agora */}
        {vetNow && (
          <motion.g initial={false} animate={{ x: vetNow.at.x, y: vetNow.at.y }} transition={{ duration: 0.8, ease: EASE }} pointerEvents="none">
            <motion.circle
              r={px(10)}
              fill={vetNow.color}
              initial={{ scale: 1, opacity: 0.45 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            />
            <circle r={px(10.5)} fill={vetNow.color} stroke="#fffcf6" strokeWidth={px(2.2)} />
            <text y={px(3.3)} textAnchor="middle" fontSize={px(8.5)} fontWeight={700} fill="#fff">
              {vetNow.initials}
            </text>
            <title>{vetNow.title ?? 'Veterinário agora'}</title>
          </motion.g>
        )}

        {overlay?.({ u, box })}

        {/* balão da parada selecionada */}
        {selected && (() => {
          const p = points[selected.id]
          const pet = PET[selected.petId]
          const title = (pet?.name ?? '') + (selected.extraPets ? ` +${selected.extraPets}` : '')
          const cap = selected.caption ?? ''
          const fs = px(12)
          const cs = px(10.5)
          const w = Math.max(title.length * fs * 0.6, cap.length * cs * 0.56) + px(22)
          const h = px(cap ? 40 : 26)
          const above = p.y - pinR * 1.2 - h - px(10) > box.y
          const y = above ? -pinR * 1.2 - px(10) - h : pinR * 1.2 + px(10)
          let x = -w / 2
          if (p.x + x < box.x + px(6)) x = box.x + px(6) - p.x
          if (p.x + x + w > box.x + box.w - px(6)) x = box.x + box.w - px(6) - w - p.x
          return (
            <motion.g
              key={selected.id}
              transform={`translate(${p.x} ${p.y})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              pointerEvents="none"
            >
              <rect x={x} y={y} width={w} height={h} rx={px(8)} fill="var(--color-sage-950)" />
              <text x={x + px(11)} y={y + px(17)} fontSize={fs} fontWeight={600} fill="#fffcf6">
                {title}
              </text>
              {cap && (
                <text x={x + px(11)} y={y + px(31)} fontSize={cs} fill="#cbdccf">
                  {cap}
                </text>
              )}
            </motion.g>
          )
        })()}

        {/* escala e norte */}
        {!compact && (
          <g transform={`translate(${box.x + px(18)} ${box.y + box.h - px(18)})`} pointerEvents="none">
            <line x1={0} x2={scaleUnits} y1={0} y2={0} stroke="#f4efe4" strokeWidth={px(1.4)} opacity={0.7} />
            <line x1={0} x2={0} y1={-px(4)} y2={px(0.5)} stroke="#f4efe4" strokeWidth={px(1.4)} opacity={0.7} />
            <line x1={scaleUnits} x2={scaleUnits} y1={-px(4)} y2={px(0.5)} stroke="#f4efe4" strokeWidth={px(1.4)} opacity={0.7} />
            <text x={scaleUnits + px(6)} y={px(3)} fontSize={px(9)} fill="#f4efe4" opacity={0.75} style={{ fontFamily: 'var(--font-mono)' }}>
              2 km
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

/** Legenda de status das paradas */
export function MapStatusLegend({ className }: { className?: string }) {
  const items: [VisitStatus, string][] = [
    ['concluida', 'Concluída'],
    ['em-atendimento', 'Em atendimento'],
    ['a-caminho', 'A caminho'],
    ['agendada', 'Agendada'],
  ]
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-2', className)}>
      {items.map(([s, l]) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 bg-card" style={{ borderColor: STATUS_RING[s] }} />
          {l}
        </span>
      ))}
    </div>
  )
}
