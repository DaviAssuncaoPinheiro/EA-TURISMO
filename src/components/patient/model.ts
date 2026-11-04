import * as React from 'react'
import {
  DOSES,
  PREVENTIVE_DOSES,
  PREVENTIVES,
  VACCINE,
  VACCINES,
  VET,
  VISITS,
  eventsOf,
  weightHistory,
  type ClinicalEvent,
  type EventKind,
  type Pet,
  type PreventiveDef,
  type PreventiveDose,
  type Reminder,
  type VaccineDose,
  type Visit,
  type VisitStatus,
} from '@/data/mock'
import { daysFromToday, iso } from '@/data/time'
import { dueState } from '@/lib/status'
import { useDemo } from '@/store'

/* ───────────── Tipos do modelo da ficha ───────────── */

export interface DoseView extends VaccineDose {
  isNew: boolean
}

export interface PreventiveView extends PreventiveDose {
  def: PreventiveDef
}

export interface WeightPoint {
  date: string
  kg: number
  fresh?: boolean
}

export interface TimelineItem {
  id: string
  date: string
  kind: EventKind
  title: string
  summary: string
  vetId: string
  tags?: string[]
  isNew: boolean
  source: 'event' | 'dose'
}

export type Health = 'ok' | 'warn' | 'late'

export interface Contributor {
  id: string
  label: string
  detail: string
  /** 0–1 */
  value: number
  weight: number
  tone: Health
}

export interface PreventiveIndex {
  score: number
  label: string
  tone: Health
  contributors: Contributor[]
  summary: string
}

export interface PatientModel {
  doses: DoseView[]
  current: DoseView[]
  preventives: PreventiveView[]
  weights: WeightPoint[]
  currentKg: number
  weightIsFresh: boolean
  timeline: TimelineItem[]
  reminders: Reminder[]
  visitNow?: { visit: Visit; status: VisitStatus }
  nextVisit?: Visit
  lastContactDays: number | null
  index: PreventiveIndex
}

/* ───────────── Helpers ───────────── */

const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString()
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const listPt = (items: string[]) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`)
const kgPt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export const vaccineOrder = (id: string) => {
  const i = VACCINES.findIndex((v) => v.id === id)
  return i < 0 ? 99 : i
}

/** Gera eventos de vacina a partir das doses (agrupadas por dia), sem duplicar eventos já descritos no prontuário */
function dosesAsEvents(doses: DoseView[], events: ClinicalEvent[]): TimelineItem[] {
  const byDay = new Map<string, DoseView[]>()
  for (const d of doses) {
    const k = new Date(d.date).toDateString()
    byDay.set(k, [...(byDay.get(k) ?? []), d])
  }
  const out: TimelineItem[] = []
  for (const group of byDay.values()) {
    const first = group[0]
    if (events.some((e) => e.kind === 'vacina' && sameDay(e.date, first.date))) continue
    const names = group.map((d) => VACCINE[d.vaccineId]?.short ?? d.vaccineId)
    const lots = group.map((d) => `${VACCINE[d.vaccineId]?.short}: lote ${d.lot}`).join(' · ')
    out.push({
      id: `dose-${first.id}`,
      date: first.date,
      kind: 'vacina',
      title: names.length > 1 ? names.join(' + ') : (VACCINE[first.vaccineId]?.name ?? names[0]),
      summary: `${first.dose} aplicado em domicílio. ${lots}.`,
      vetId: first.vetId,
      tags: ['Carteira atualizada'],
      isNew: group.some((d) => d.isNew),
      source: 'dose',
    })
  }
  return out
}

function vaccinePhrase(id: string) {
  if (id === 'giardia') return 'vacina de giárdia'
  const n = (VACCINE[id]?.name ?? id).split(' (')[0]
  return n.charAt(0).toLowerCase() + n.slice(1)
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Ótimo'
  if (score >= 75) return 'Bom'
  if (score >= 55) return 'Pede atenção'
  return 'Crítico'
}

function buildIndex(pet: Pet, current: DoseView[], preventives: PreventiveView[], currentKg: number, lastContactDays: number | null): PreventiveIndex {
  const name = pet.name
  const issues: string[] = []

  /* Vacinas */
  const vStates = current.map((d) => ({ d, s: dueState(d.nextDate), n: daysFromToday(d.nextDate) }))
  const late = vStates.filter((x) => x.s.key === 'late')
  const soon = vStates.filter((x) => x.s.key === 'soon')
  const vValue = vStates.length ? vStates.reduce((a, x) => a + (x.s.key === 'ok' ? 1 : x.s.key === 'soon' ? 0.85 : 0), 0) / vStates.length : 0
  const okCount = vStates.filter((x) => x.s.key !== 'late').length
  const vac: Contributor = {
    id: 'vacinas',
    label: 'Vacinas',
    detail: vStates.length ? (late.length ? `${okCount} de ${vStates.length} em dia` : soon.length ? `Em dia · ${soon.length} vence${soon.length > 1 ? 'm' : ''} em breve` : 'Todas em dia') : 'Sem registro',
    value: vValue,
    weight: 35,
    tone: late.length || !vStates.length ? 'late' : soon.length ? 'warn' : 'ok',
  }
  for (const x of late) issues.push(`a ${vaccinePhrase(x.d.vaccineId)} está atrasada há ${-x.n} dias`)
  if (!vStates.length) issues.push('não há vacinas registradas na carteira')

  /* Antiparasitários */
  const prev = (kind: 'vermífugo' | 'antipulgas', label: string): Contributor => {
    const p = preventives.find((x) => x.def.kind === kind)
    if (!p) return { id: kind, label, detail: 'Sem registro', value: 0, weight: 15, tone: 'late' }
    const n = daysFromToday(p.nextDate)
    const value = n < 0 ? clamp01(0.5 + n / 60) : n <= 7 ? 0.85 : 1
    const product = p.def.name.match(/\((.*)\)/)?.[1] ?? p.def.name
    if (n < 0) issues.push(`o ${kind} venceu há ${-n} dias`)
    return {
      id: kind,
      label,
      detail: n < 0 ? `Vencido há ${-n} dias` : n === 0 ? `${product} · vence hoje` : n <= 7 ? `${product} · vence em ${n} dias` : `${product} · em dia`,
      value,
      weight: 15,
      tone: n < 0 ? 'late' : n <= 7 ? 'warn' : 'ok',
    }
  }
  const verm = prev('vermífugo', 'Vermífugo')
  const pulga = prev('antipulgas', 'Antipulgas')

  /* Peso */
  const [lo, hi] = pet.idealKg
  const diff = currentKg > hi ? currentKg - hi : currentKg < lo ? currentKg - lo : 0
  const dev = diff === 0 ? 0 : Math.abs(diff) / (diff > 0 ? hi : lo)
  const wTone: Health = dev === 0 ? 'ok' : dev <= 0.05 ? 'warn' : 'late'
  const peso: Contributor = {
    id: 'peso',
    label: 'Peso',
    detail: diff === 0 ? 'Dentro da faixa ideal' : `${kgPt(Math.abs(diff))} kg ${diff > 0 ? 'acima' : 'abaixo'} da faixa`,
    value: clamp01(1 - dev / 0.2),
    weight: 20,
    tone: wTone,
  }
  if (diff !== 0) issues.push(`o peso segue ${kgPt(Math.abs(diff))} kg ${diff > 0 ? 'acima' : 'abaixo'} da faixa ideal`)

  /* Check-up */
  const cd = lastContactDays
  const cValue = cd === null ? 0.15 : cd <= 120 ? 1 : cd <= 240 ? 0.7 : cd <= 365 ? 0.45 : 0.15
  const check: Contributor = {
    id: 'checkup',
    label: 'Check-up',
    detail: cd === null ? 'Sem visitas registradas' : cd === 0 ? 'Visita hoje' : cd === 1 ? 'Última visita ontem' : `Última visita há ${cd} dias`,
    value: cValue,
    weight: 15,
    tone: cValue >= 1 ? 'ok' : cValue >= 0.45 ? 'warn' : 'late',
  }
  if (cValue < 0.7) issues.push('já passou da hora de um check-up')

  const contributors = [vac, verm, pulga, peso, check]
  const score = Math.round(contributors.reduce((a, c) => a + c.value * c.weight, 0))
  const tone: Health = score >= 85 ? 'ok' : score >= 60 ? 'warn' : 'late'

  let summary: string
  if (!issues.length) {
    summary = soon.length
      ? `${name} está com a prevenção em dia. Só fique de olho: ${listPt(soon.map((x) => VACCINE[x.d.vaccineId]?.short))} vence${soon.length > 1 ? 'm' : ''} nas próximas semanas.`
      : `${name} está com a prevenção em dia. Nada pendente por aqui.`
  } else {
    const lead = score >= 75 ? 'Quase lá' : score >= 55 ? 'Precisa de atenção' : 'Prevenção em risco'
    const txt = listPt(issues.slice(0, 2))
    summary = `${lead}: ${txt}.`
  }

  return { score, label: scoreLabel(score), tone, contributors, summary }
}

/* ───────────── Hook principal ───────────── */

export function usePatientModel(pet: Pet | undefined): PatientModel | null {
  const extraDoses = useDemo((s) => s.extraDoses)
  const extraEvents = useDemo((s) => s.extraEvents)
  const extraWeights = useDemo((s) => s.extraWeights)
  const reminders = useDemo((s) => s.reminders)
  const visitStatus = useDemo((s) => s.visitStatus)

  return React.useMemo(() => {
    if (!pet) return null
    const newIds = new Set(extraDoses.map((d) => d.id))
    const doses: DoseView[] = [...DOSES, ...extraDoses]
      .filter((d) => d.petId === pet.id)
      .map((d) => ({ ...d, isNew: newIds.has(d.id) }))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))

    const latest = new Map<string, DoseView>()
    for (const d of doses) if (!latest.has(d.vaccineId)) latest.set(d.vaccineId, d)
    const current = [...latest.values()].sort((a, b) => vaccineOrder(a.vaccineId) - vaccineOrder(b.vaccineId))

    const preventives: PreventiveView[] = PREVENTIVE_DOSES.filter((p) => p.petId === pet.id)
      .map((p) => ({ ...p, def: PREVENTIVES.find((x) => x.id === p.preventiveId)! }))
      .sort((a, b) => (a.def.kind === 'vermífugo' ? -1 : 1) - (b.def.kind === 'vermífugo' ? -1 : 1))

    const extraKg = extraWeights[pet.id]
    const weights: WeightPoint[] = weightHistory(pet)
    if (extraKg != null) {
      const last = weights[weights.length - 1]
      if (last && sameDay(last.date, iso(0))) weights[weights.length - 1] = { date: iso(0, '10:40'), kg: extraKg, fresh: true }
      else weights.push({ date: iso(0, '10:40'), kg: extraKg, fresh: true })
    }
    const currentKg = extraKg ?? pet.weightKg

    const base = eventsOf(pet.id)
    const fresh = extraEvents.filter((e) => e.petId === pet.id)
    const items: TimelineItem[] = [
      ...fresh.map((e) => ({ ...e, isNew: true, source: 'event' as const })),
      ...base.map((e) => ({ ...e, isNew: false, source: 'event' as const })),
      ...dosesAsEvents(doses, [...base, ...fresh]),
    ]
    const timeline = items.sort((a, b) => (a.isNew === b.isNew ? +new Date(b.date) - +new Date(a.date) : a.isNew ? -1 : 1))

    const contactDates = [...items.map((i) => i.date)].filter((d) => daysFromToday(d) <= 0)
    const done = VISITS.filter((v) => v.petIds.includes(pet.id) && visitStatus[v.id] === 'concluida').map((v) => v.start)
    const all = [...contactDates, ...done]
    const lastContactDays = all.length ? Math.min(...all.map((d) => -daysFromToday(d))) : null

    const petVisits = VISITS.filter((v) => v.petIds.includes(pet.id)).sort((a, b) => +new Date(a.start) - +new Date(b.start))
    const todayVisit = petVisits.find((v) => daysFromToday(v.start) === 0 && visitStatus[v.id] !== 'cancelada')
    const nextVisit = petVisits.find((v) => daysFromToday(v.start) > 0 && visitStatus[v.id] !== 'cancelada')

    const rems = reminders.filter((r) => r.petId === pet.id).sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))

    return {
      doses,
      current,
      preventives,
      weights,
      currentKg,
      weightIsFresh: extraKg != null,
      timeline,
      reminders: rems,
      visitNow: todayVisit ? { visit: todayVisit, status: visitStatus[todayVisit.id] ?? todayVisit.status } : undefined,
      nextVisit,
      lastContactDays,
      index: buildIndex(pet, current, preventives, currentKg, lastContactDays),
    }
  }, [pet, extraDoses, extraEvents, extraWeights, reminders, visitStatus])
}

/* ───────────── Rótulos ───────────── */

export function petFacts(pet: Pet) {
  const f = pet.sex === 'F'
  return {
    species: pet.species === 'cão' ? 'Cão' : 'Gato',
    sex: f ? 'Fêmea' : 'Macho',
    neutered: pet.neutered ? (f ? 'Castrada' : 'Castrado') : f ? 'Não castrada' : 'Não castrado',
    article: f ? 'a' : 'o',
  }
}

export const vetOf = (id: string) => VET[id] ?? { id, name: 'Veterinário', short: 'Vet', initials: 'V', crmv: 'CRMV-AM', focus: '', color: '#7b847d' }

export const toneText: Record<Health, string> = { ok: 'text-ok', warn: 'text-warn', late: 'text-late' }
export const toneBg: Record<Health, string> = { ok: 'bg-ok', warn: 'bg-warn', late: 'bg-late' }
export const toneVar: Record<Health, string> = { ok: 'var(--color-ok)', warn: 'var(--color-warn)', late: 'var(--color-late)' }

/** hash determinístico pequeno (para rotações e variações visuais estáveis) */
export function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
