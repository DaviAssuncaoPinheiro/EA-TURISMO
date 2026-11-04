import { BAIRRO, BAIRROS, ZONE, type ZoneId } from '@/data/geo'
import { NOW, PET, PETS, TUTOR, VET, VETS, VISITS, WEEK_PLAN, type VisitStatus, type VisitType } from '@/data/mock'
import { TODAY, daysFromToday, day, fmt } from '@/data/time'

/** Visita normalizada para a agenda: reais (mock), geradas (para a grade parecer viva) e encaixes. */
export interface AVisit {
  id: string
  vetId: string
  off: number // dias a partir de hoje
  startMin: number // minutos desde 00:00
  dur: number
  petIds: string[]
  tutorId: string
  bairro: string
  type: VisitType
  reason: string
  status: VisitStatus
  fixed: boolean
  origin: 'real' | 'gerada' | 'encaixe'
}

export const DAY_START = 7 * 60
export const DAY_END = 19 * 60
export const WORK_START = 8 * 60
export const WORK_END = 18 * 60
export const NOW_MIN = NOW.getHours() * 60 + NOW.getMinutes()

export const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const hm = (min: number) => {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** offset do dia (a partir de hoje) -> segunda da semana + n */
export function mondayOffset(weekShift: number) {
  const dow = TODAY.getDay() || 7
  return -(dow - 1) + weekShift * 7
}
/** 1 = seg ... 7 = dom */
export function dowOf(off: number) {
  return day(off).getDay() || 7
}
export const dayLabel = (off: number) => `${cap(fmt.weekday(day(off)))} ${day(off).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`

/* ───────────── geografia e deslocamento ───────────── */

const KM_PER_PX = 0.04
const BASE_XY = { x: 572, y: 420 }

export function kmBetween(a: string | null, b: string) {
  const pa = a ? BAIRRO[a] : null
  const pb = BAIRRO[b]
  if (a === b) return 0.9
  const ax = pa ? pa.x : BASE_XY.x
  const ay = pa ? pa.y : BASE_XY.y
  return Math.max(0.9, Math.hypot(pb.x - ax, pb.y - ay) * KM_PER_PX * 1.3)
}
export const minForKm = (km: number) => Math.round(3 + (km / 24) * 60)

/* ───────────── dados determinísticos ───────────── */

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed: string) {
  let s = hash(seed) || 1
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

const TYPES: { type: VisitType; dur: number; reasons: string[] }[] = [
  { type: 'Vacinação', dur: 35, reasons: ['Reforço anual V10', 'Antirrábica + vermífugo', 'Reforço de gripe canina', 'Dose V4 felina'] },
  { type: 'Consulta', dur: 50, reasons: ['Coceira e queda de pelo', 'Apatia há 2 dias', 'Vômitos esporádicos', 'Claudicação leve'] },
  { type: 'Retorno', dur: 35, reasons: ['Reavaliação de tratamento', 'Retorno pós-cirúrgico', 'Revisão de dieta'] },
  { type: 'Check-up', dur: 45, reasons: ['Check-up semestral', 'Pesagem e escore corporal'] },
  { type: 'Coleta de exames', dur: 30, reasons: ['Hemograma + bioquímico', 'Coleta de urina'] },
  { type: 'Curativo', dur: 30, reasons: ['Troca de curativo', 'Retirada de pontos'] },
  { type: 'Fluidoterapia', dur: 40, reasons: ['Fluido subcutâneo'] },
]

const petZone = (petId: string) => BAIRRO[TUTOR[PET[petId].tutorId].bairro].zone

function buildBase(): AVisit[] {
  const out: AVisit[] = []
  const real = VISITS.map<AVisit>((v) => {
    const d = new Date(v.start)
    return {
      id: v.id,
      vetId: v.vetId,
      off: daysFromToday(d),
      startMin: d.getHours() * 60 + d.getMinutes(),
      dur: v.durationMin,
      petIds: v.petIds,
      tutorId: v.tutorId,
      bairro: TUTOR[v.tutorId].bairro,
      type: v.type,
      reason: v.reason,
      status: v.status,
      fixed: v.fixedTime,
      origin: 'real',
    }
  })
  out.push(...real)
  const first = mondayOffset(-1)
  for (let off = first; off < first + 21; off++) {
    const dow = dowOf(off)
    if (dow === 7) continue
    for (const vet of VETS) {
      const plan = WEEK_PLAN[vet.id][dow] ?? []
      const have = out.filter((v) => v.vetId === vet.id && v.off === off)
      if (!plan.length && !have.length) continue
      const r = rng(`${vet.id}:${off}`)
      const target = 3 + Math.floor(r() * 4)
      let need = target - have.length
      let guard = 0
      while (need > 0 && guard++ < 40) {
        const zone = plan[Math.floor(r() * plan.length)] ?? petZone(have[0].petIds[0])
        const weekStart = off - ((dowOf(off) + 6) % 7)
        const usedThisWeek = new Set(out.filter((v) => v.off >= weekStart && v.off < weekStart + 7).flatMap((v) => v.petIds))
        const zonePool = PETS.filter((p) => petZone(p.id) === zone)
        const fresh = zonePool.filter((p) => !usedThisWeek.has(p.id))
        const pool = fresh.length ? fresh : zonePool
        const pet = pool.length ? pool[Math.floor(r() * pool.length)] : PETS[Math.floor(r() * PETS.length)]
        const t = TYPES[Math.floor(r() * TYPES.length)]
        const zb = BAIRROS.filter((b) => b.zone === zone)
        const own = TUTOR[pet.tutorId].bairro
        const bairro = r() < 0.55 || !zb.length ? own : zb[Math.floor(r() * zb.length)].id
        const start = WORK_START + Math.floor(r() * 36) * 15 // 08:00 a 16:45
        if (start + t.dur > WORK_END) continue
        if (start < 12 * 60 + 30 && start + t.dur > 12 * 60) continue
        const clash = out.some((v) => v.vetId === vet.id && v.off === off && start < v.startMin + v.dur + 15 && v.startMin < start + t.dur + 15)
        if (clash) continue
        out.push({
          id: `g-${vet.id}-${off}-${out.length}`,
          vetId: vet.id,
          off,
          startMin: start,
          dur: t.dur,
          petIds: [pet.id],
          tutorId: pet.tutorId,
          bairro,
          type: t.type,
          reason: t.reasons[Math.floor(r() * t.reasons.length)],
          status: off < 0 ? 'concluida' : 'agendada',
          fixed: r() < 0.28,
          origin: 'gerada',
        })
        need--
      }
    }
  }
  return out
}
export const BASE_VISITS = buildBase()

/* ───────────── derivados por vet × dia ───────────── */

export interface Leg {
  fromId: string | null // visita anterior (null = base)
  toId: string
  km: number
  min: number
  startMin: number // quando o deslocamento começa
  endMin: number
}

export function visitsOf(all: AVisit[], vetId: string, off: number) {
  return all.filter((v) => v.vetId === vetId && v.off === off && v.status !== 'cancelada').sort((a, b) => a.startMin - b.startMin)
}

export function legsOf(list: AVisit[]): Leg[] {
  return list.map((v, i) => {
    const prev = i ? list[i - 1] : null
    const km = kmBetween(prev ? prev.bairro : null, v.bairro)
    const min = minForKm(km)
    const prevEnd = prev ? prev.startMin + prev.dur : v.startMin - min
    const startMin = Math.max(prevEnd, v.startMin - min)
    return { fromId: prev?.id ?? null, toId: v.id, km, min: Math.min(min, v.startMin - startMin) || min, startMin, endMin: v.startMin }
  })
}

export function zonesOfDay(list: AVisit[], vetId: string, off: number): ZoneId[] {
  const plan = WEEK_PLAN[vetId][dowOf(off)] ?? []
  const counts = new Map<ZoneId, number>()
  for (const v of list) counts.set(BAIRRO[v.bairro].zone, (counts.get(BAIRRO[v.bairro].zone) ?? 0) + 1)
  if (list.length >= 3 && off <= 3 && off >= -1) {
    // dias com visitas reais: a faixa mostra onde a equipe de fato está
    const real = list.filter((v) => v.origin === 'real')
    if (real.length >= 3) {
      const c = new Map<ZoneId, number>()
      real.forEach((v) => c.set(BAIRRO[v.bairro].zone, (c.get(BAIRRO[v.bairro].zone) ?? 0) + 1))
      return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([z]) => z)
    }
  }
  const zs = [...plan]
  for (const z of counts.keys()) if (!zs.includes(z)) zs.push(z)
  return zs
}

export function loadOf(list: AVisit[]) {
  const legs = legsOf(list)
  const service = list.reduce((s, v) => s + v.dur, 0)
  const travel = legs.reduce((s, l) => s + l.min, 0)
  const cap = WORK_END - WORK_START - 60 // 9h menos 1h de almoço
  return { count: list.length, service, travel, ratio: (service + travel) / cap }
}

/* ───────────── sugestões de encaixe ───────────── */

export interface Suggestion {
  key: string
  vetId: string
  off: number
  startMin: number
  bairro: string
  extraKm: number
  kind: 'bairro' | 'zona' | 'vizinha' | 'fora'
  title: string
  why: string
  zones: ZoneId[]
}

const NEIGHBORS: Record<ZoneId, ZoneId[]> = {
  oeste: ['centro-oeste', 'sul'],
  'centro-oeste': ['oeste', 'centro-sul', 'norte'],
  sul: ['oeste', 'centro-sul'],
  'centro-sul': ['sul', 'centro-oeste', 'leste', 'norte'],
  norte: ['centro-oeste', 'centro-sul', 'leste'],
  leste: ['norte', 'centro-sul'],
}

export function suggest(all: AVisit[], bairro: string, urgency: 'rotina' | 'semana' | 'urgente', dur: number): Suggestion[] {
  const target = BAIRRO[bairro]
  const list: (Suggestion & { score: number })[] = []
  const horizon = urgency === 'urgente' ? 3 : urgency === 'semana' ? 7 : 12
  for (let off = 0; off <= horizon; off++) {
    if (dowOf(off) === 7) continue
    for (const vet of VETS) {
      const vs = visitsOf(all, vet.id, off)
      const zones = zonesOfDay(vs, vet.id, off)
      if (!zones.length && !vs.length) continue
      // visita mais próxima do bairro de destino
      let near: AVisit | null = null
      let nearKm = Infinity
      for (const v of vs) {
        const k = kmBetween(v.bairro, bairro)
        if (k < nearKm) {
          nearKm = k
          near = v
        }
      }
      const inSame = vs.some((v) => v.bairro === bairro)
      const inZone = zones.includes(target.zone) || vs.some((v) => BAIRRO[v.bairro].zone === target.zone)
      const inNeighbor = zones.some((z) => NEIGHBORS[z].includes(target.zone))
      const kind: Suggestion['kind'] = inSame ? 'bairro' : inZone ? 'zona' : inNeighbor ? 'vizinha' : 'fora'
      // acha um horário livre perto da visita mais próxima
      const earliest = off === 0 ? Math.ceil((NOW_MIN + 50) / 5) * 5 : WORK_START
      let slot: number | null = null
      const tryAt = (s: number) => {
        if (s < earliest || s + dur > WORK_END) return false
        if (s < 12 * 60 + 30 && s + dur > 12 * 60) return false
        return !vs.some((v) => s < v.startMin + v.dur + 12 && v.startMin < s + dur + 12)
      }
      const anchor = near ? near.startMin + near.dur + minForKm(nearKm) : 14 * 60
      const cands: number[] = []
      if (inSame) {
        // encaixa colado numa visita do mesmo bairro (depois ou antes dela)
        for (const sv of vs.filter((x) => x.bairro === bairro)) cands.push(Math.ceil((sv.startMin + sv.dur + 8) / 5) * 5, Math.floor((sv.startMin - dur - 8) / 5) * 5)
      }
      const rest: number[] = []
      for (let s = WORK_START; s <= WORK_END - dur; s += 5) rest.push(s)
      rest.sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))
      cands.push(...rest)
      for (const s of cands) if (tryAt(s)) { slot = s; break }
      if (slot == null) continue
      // custo extra de deslocamento (interno, só para ranquear): desvio entre vizinhos na sequência
      const before = [...vs].reverse().find((v) => v.startMin + v.dur <= slot!) ?? null
      const after = vs.find((v) => v.startMin >= slot! + dur) ?? null
      const direct = before && after ? kmBetween(before.bairro, after.bairro) : 0
      const extra = Math.max(0.4, kmBetween(before?.bairro ?? null, bairro) + (after ? kmBetween(bairro, after.bairro) : kmBetween(bairro, 'adrianopolis') * 0.4) - direct)
      const extraKm = Math.round(extra * 10) / 10
      const penalty = { bairro: -3, zona: 1.5, vizinha: 5, fora: 11 }[kind]
      const dayW = urgency === 'urgente' ? 7 : urgency === 'semana' ? 1.4 : 0.35
      const score = extraKm + penalty + off * dayW + (off === 0 && urgency !== 'urgente' ? 3 : 0)
      const bname = BAIRRO[bairro].name
      const zname = ZONE[target.zone].name
      let why = ''
      let title = ''
      if (kind === 'bairro') {
        title = `${vet.short} já estará em ${bname}`
        why = `Já tem atendimento marcado em ${bname} neste dia. Entra no mesmo bairro, sem desvio.`
      } else if (kind === 'zona') {
        title = `${vet.short} cobre a ${zname}`
        why = `Dia de ${zname} na escala. Mesma zona das visitas do dia.`
      } else if (kind === 'vizinha') {
        title = `${vet.short} passa perto de ${bname}`
        why = `Zona vizinha à ${zname}. Encaixe com pouco desvio.`
      } else {
        title = `${vet.short} · fora da zona`
        why = `Não é dia de ${zname}. Pode atrasar as visitas seguintes.`
      }
      list.push({ key: `${vet.id}-${off}-${slot}`, vetId: vet.id, off, startMin: slot, bairro, extraKm, kind, title, why, zones, score })
    }
  }
  list.sort((a, b) => a.score - b.score)
  const top = list.slice(0, 3)
  // mostra também a melhor opção "fora da zona" de outro veterinário, para o contraste ficar claro
  const contrast = list.slice(3).find((x) => (x.kind === 'fora' || x.kind === 'vizinha') && !top.some((t) => t.vetId === x.vetId))
  if (contrast) top.push(contrast)
  else if (list[3]) top.push(list[3])
  return top
}

