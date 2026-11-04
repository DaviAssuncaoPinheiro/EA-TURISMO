import { NOW, ROUTE_LARISSA, TUTOR, visitsToday, type Visit, type VisitStatus } from '@/data/mock'
import { addressPoint, BASE_PT, legLengths, lerp, type Pt } from './geometry'

/** Modelo do dia de um veterinário: ordem das paradas, horários, km e deslocamentos. */

export interface DayStop {
  visit: Visit
  status: VisitStatus
  /** minutos desde 00:00 (horário atribuído nesta ordem) */
  startMin: number
  originalMin: number
  pt: Pt
  /** trecho até esta parada (da anterior ou da base) */
  leg: { km: number; min: number }
}

export interface DayRoute {
  vetId: string
  stops: DayStop[]
  order: string[]
  km: number
  travelMin: number
  /** só a rota da Dra. Larissa tem versão "como foi marcada" no protótipo */
  optimizable: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')
export const minOf = (d: string | Date) => {
  const x = new Date(d)
  return x.getHours() * 60 + x.getMinutes()
}
export const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(Math.round(m % 60))}`
export const NOW_MIN = minOf(NOW)

const routeLen = (ids: string[], byId: Record<string, Visit>) =>
  legLengths([BASE_PT, ...ids.map((id) => pointOfVisit(byId[id]))]).reduce((a, b) => a + b, 0)

export const pointOfVisit = (v: Visit) => addressPoint(TUTOR[v.tutorId].bairro, v.tutorId)

const TODAY_VISITS = visitsToday()
const ALL_BY_ID = Object.fromEntries(TODAY_VISITS.map((v) => [v.id, v])) as Record<string, Visit>

/** km por unidade do mapa calibrado pela rota otimizada oficial da Dra. Larissa */
const KM_FACTOR = ROUTE_LARISSA.kmOptimized / routeLen(ROUTE_LARISSA.manualOrder, ALL_BY_ID)
const MIN_PER_KM = ROUTE_LARISSA.minOptimized / ROUTE_LARISSA.kmOptimized

export function buildDayRoute(vetId: string, optimized: boolean, statusOf: (v: Visit) => VisitStatus): DayRoute {
  const vs = TODAY_VISITS.filter((v) => v.vetId === vetId && statusOf(v) !== 'cancelada').sort((a, b) => +new Date(a.start) - +new Date(b.start))
  const byId = Object.fromEntries(vs.map((v) => [v.id, v])) as Record<string, Visit>
  const optimizable = vetId === ROUTE_LARISSA.vetId

  const times: Record<string, number> = Object.fromEntries(vs.map((v) => [v.id, minOf(v.start)]))
  let order = vs.map((v) => v.id)

  if (optimizable && !optimized) {
    // "Como foi marcada": as visitas que ainda podem mudar seguem a ordem de chegada no WhatsApp,
    // ocupando os mesmos horários livres. Horário do tutor e o que já aconteceu ficam onde estão.
    const locked = (v: Visit) => v.fixedTime || statusOf(v) !== 'agendada'
    const movable = ROUTE_LARISSA.naive.filter((id) => byId[id] && !locked(byId[id]))
    const slots = movable.map((id) => minOf(byId[id].start)).sort((a, b) => a - b)
    movable.forEach((id, i) => (times[id] = slots[i]))
    const naiveIdx = (id: string) => ROUTE_LARISSA.naive.indexOf(id)
    order = [...order].sort((a, b) => times[a] - times[b] || naiveIdx(a) - naiveIdx(b))
  }

  const pts = [BASE_PT, ...order.map((id) => pointOfVisit(byId[id]))]
  const lens = legLengths(pts)
  const geo = lens.reduce((a, b) => a + b, 0) || 1

  let km: number
  let travelMin: number
  if (optimizable) {
    km = optimized ? ROUTE_LARISSA.kmOptimized : ROUTE_LARISSA.kmNaive
    travelMin = optimized ? ROUTE_LARISSA.minOptimized : ROUTE_LARISSA.minNaive
  } else {
    km = +(geo * KM_FACTOR).toFixed(1)
    travelMin = Math.round(km * MIN_PER_KM)
  }

  const stops: DayStop[] = order.map((id, i) => ({
    visit: byId[id],
    status: statusOf(byId[id]),
    startMin: times[id],
    originalMin: minOf(byId[id].start),
    pt: pts[i + 1],
    leg: { km: +((lens[i] / geo) * km).toFixed(1), min: Math.max(4, Math.round((lens[i] / geo) * travelMin)) },
  }))

  return { vetId, stops, order, km, travelMin, optimizable }
}

export interface NextInfo {
  current?: DayStop
  next?: DayStop
  etaMin?: number
  delayMin?: number
  /** posição estimada do veterinário agora */
  at: Pt
  mode: 'atendimento' | 'deslocamento' | 'livre' | 'encerrado'
}

export function nextInfo(r: DayRoute): NextInfo {
  const s = r.stops
  const ci = s.findIndex((x) => x.status === 'em-atendimento')
  const pending = (x: DayStop) => x.status === 'agendada' || x.status === 'a-caminho'
  if (ci >= 0) {
    const cur = s[ci]
    const next = s.slice(ci + 1).find(pending)
    const freeAt = Math.max(NOW_MIN + 5, cur.startMin + cur.visit.durationMin)
    const eta = next ? freeAt + next.leg.min : undefined
    return { current: cur, next, etaMin: eta, delayMin: next && eta != null ? eta - next.startMin : undefined, at: next ? lerp(cur.pt, next.pt, 0.42) : cur.pt, mode: 'atendimento' }
  }
  const wi = s.findIndex((x) => x.status === 'a-caminho')
  if (wi >= 0) {
    const next = s[wi]
    const prev = wi > 0 ? s[wi - 1].pt : BASE_PT
    const eta = NOW_MIN + Math.round(next.leg.min * 0.4)
    return { next, etaMin: eta, delayMin: eta - next.startMin, at: lerp(prev, next.pt, 0.62), mode: 'deslocamento' }
  }
  const ni = s.findIndex(pending)
  if (ni >= 0) {
    const next = s[ni]
    const prevStop = ni > 0 ? s[ni - 1] : undefined
    const freeAt = Math.max(NOW_MIN, prevStop ? prevStop.startMin + prevStop.visit.durationMin : 0)
    const eta = freeAt + next.leg.min
    return { next, etaMin: eta, delayMin: eta - next.startMin, at: prevStop ? prevStop.pt : BASE_PT, mode: 'livre' }
  }
  return { at: s.length ? s[s.length - 1].pt : BASE_PT, mode: 'encerrado' }
}
