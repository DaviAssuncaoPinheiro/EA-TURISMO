// Sugestões automáticas de lembretes + gravação do atendimento no store global.
import { VACCINE, VET, type ClinicalEvent, type Pet, type Reminder, type ReminderKind, type VaccineDose, type Visit } from '@/data/mock'
import { daysFromToday, fmt, iso, TODAY } from '@/data/time'
import { kg } from '@/lib/utils'
import { useDemo } from '@/store'
import { queueIfOffline, useCampo, type Draft, type FinishedVisit } from './campoStore'
import { durationDays, MED, minutesSince, simNow, VACCINE_LAB } from './data'
import { vaccineRows } from './vaccines'

export interface Suggestion {
  key: string
  kind: ReminderKind
  title: string
  days: number
  why: string
  on: boolean
}

export function daysLabel(days: number) {
  if (days === 365) return '12 meses'
  if (days >= 60 && days % 30 === 0) return `${days / 30} meses`
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

const isPuppy = (pet: Pet) => daysFromToday(pet.birth) > -200

export function suggestReminders(visit: Visit, pet: Pet, d: Draft): Suggestion[] {
  const out: Suggestion[] = []
  const applied = Object.entries(d.vaccines).filter(([, p]) => p.apply)
  for (const [vid] of applied) {
    const v = VACCINE[vid]
    if (isPuppy(pet) && ['v10', 'v4', 'v5'].includes(vid)) out.push({ key: `vac-${vid}`, kind: 'vacina', title: `Próxima dose ${v.short}`, days: 21, why: 'Protocolo de filhote · intervalo de 21 dias', on: true })
    else out.push({ key: `vac-${vid}`, kind: 'vacina', title: `Reforço ${v.short === 'Gripe' ? 'Gripe canina' : v.short}`, days: v.boosterDays, why: 'Aplicada hoje · reforço anual', on: true })
  }
  const extra = useDemo.getState().extraDoses
  for (const r of vaccineRows(pet, extra).due) {
    if (d.vaccines[r.vaccineId]?.apply) continue
    out.push({ key: `pend-${r.vaccineId}`, kind: 'vacina', title: `${VACCINE[r.vaccineId].name} pendente`, days: Math.max(7, daysFromToday(r.last!.nextDate)), why: 'Não foi aplicada nesta visita', on: true })
  }
  const cardio = d.meds.some((m) => MED[m.medId]?.group === 'Cardiologia') || pet.conditions?.some((c) => /mitral|card/i.test(c))
  if (cardio) {
    out.push({ key: 'ret-cardio', kind: 'retorno', title: 'Retorno cardiológico', days: 30, why: 'Reavaliar ausculta e dose do pimobendan', on: true })
    out.push({ key: 'eco', kind: 'exame', title: 'Ecocardiograma de controle', days: 180, why: 'Estágio B1 (ACVIM) · reestadiar a cada 6 meses', on: true })
  }
  for (const m of d.meds) {
    if (m.keep) continue
    const n = durationDays(m.dur)
    if (n) out.push({ key: `med-${m.uid}`, kind: 'retorno', title: `Reavaliar após ${MED[m.medId].name}`, days: n + 1, why: `Fim do tratamento (${m.dur.toLowerCase()})`, on: true })
  }
  if (d.weight > pet.idealKg[1]) out.push({ key: 'peso', kind: 'retorno', title: 'Pesagem de controle', days: 60, why: `Acima do peso ideal (${pet.idealKg.join('–').replace(/\./g, ',')} kg)`, on: !cardio })
  if (d.findings.length && !cardio) out.push({ key: 'achados', kind: 'retorno', title: 'Retorno para reavaliar achados', days: 15, why: `${d.findings.length} ${d.findings.length === 1 ? 'achado marcado' : 'achados marcados'} no exame`, on: true })
  if (isPuppy(pet)) out.push({ key: 'verm', kind: 'vermífugo', title: 'Vermífugo do filhote', days: 30, why: 'Filhote · vermifugar a cada 30 dias até 6 meses', on: true })
  if (!out.length) out.push({ key: 'checkup', kind: 'retorno', title: 'Check-up anual', days: 365, why: 'Rotina preventiva', on: false })
  // aplica edições do veterinário
  return out.map((s) => ({ ...s, ...(d.reminderEdits[s.key] ?? {}) }))
}

function eventTitle(visit: Visit) {
  if (visit.type === 'Retorno') return visit.reason.split(' — ')[0]
  if (visit.type === 'Consulta') return 'Consulta domiciliar'
  return visit.type
}

export function buildSummary(visit: Visit, pet: Pet, d: Draft, sugg: Suggestion[]) {
  const parts: string[] = []
  const sym = d.symptoms.filter((s) => s !== 'Sem queixas')
  parts.push(sym.length ? `Relato: ${sym.join(', ').toLowerCase()}.` : 'Tutor sem novas queixas.')
  const delta = +(d.weight - d.prevWeight).toFixed(1)
  const dTxt = delta === 0 ? 'estável' : `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('pt-BR')} kg`
  parts.push(`Peso ${kg(d.weight)} (${dTxt}). T ${d.temp.toLocaleString('pt-BR')} °C · FC ${d.fc} bpm · FR ${d.fr} mpm. Mucosas ${d.mucosa.toLowerCase()}, TPC ${d.tpc}, hidratação ${d.hidratacao.toLowerCase()}, ECC ${d.bcs}/9.`)
  if (d.findings.length) parts.push(`Achados: ${d.findings.map((f) => `${f.region.toLowerCase()} — ${[...f.tags, f.note].filter(Boolean).join(', ').toLowerCase() || 'ver nota'}`).join('; ')}.`)
  const applied = Object.entries(d.vaccines).filter(([, p]) => p.apply)
  if (applied.length) parts.push(`Vacina: ${applied.map(([vid, p]) => `${VACCINE[vid].name}${p.lot ? ` (lote ${p.lot})` : ''}`).join(', ')}.`)
  if (d.meds.length) parts.push(`Prescrição: ${d.meds.map((m) => `${MED[m.medId].name} ${MED[m.medId].conc}, ${m.dose.toLowerCase()} ${m.freq.toLowerCase()}${m.keep ? ' (mantido)' : ''}, ${m.dur.toLowerCase()}`).join('; ')}.`)
  const ret = sugg.filter((s) => s.on && s.kind !== 'vacina').sort((a, b) => a.days - b.days)[0]
  if (ret) parts.push(`${ret.title} em ${daysLabel(ret.days)}.`)
  return parts.join(' ')
}

export function priceLines(visit: Visit, d: Draft) {
  const lines = [{ label: visit.type === 'Retorno' ? eventTitle(visit) : visit.type, value: visit.price }]
  for (const [vid, p] of Object.entries(d.vaccines)) if (p.apply) lines.push({ label: `Vacina ${VACCINE[vid].name}`, value: VACCINE_LAB[vid].price })
  return lines
}

export function commitVisit(visit: Visit, pet: Pet, d: Draft): FinishedVisit {
  const demo = useDemo.getState()
  const vetId = visit.vetId
  const stamp = Date.now()
  const now = simNow()
  const sugg = suggestReminders(visit, pet, d)
  const summary = buildSummary(visit, pet, d, sugg)
  const started = useCampo.getState().startedAt[visit.id] ?? visit.start

  const event: ClinicalEvent = {
    id: `campo-e-${visit.id}-${stamp}`,
    petId: pet.id,
    date: now.toISOString(),
    kind: 'consulta',
    title: eventTitle(visit),
    summary,
    vetId,
    tags: ['App de campo', ...(pet.conditions?.some((c) => /mitral|card/i.test(c)) ? ['Cardiologia'] : [])],
  }

  const applied = Object.entries(d.vaccines).filter(([, p]) => p.apply)
  const doses: VaccineDose[] = applied.map(([vid, p]) => {
    const s = sugg.find((x) => x.key === `vac-${vid}`)
    return {
      id: `campo-d-${vid}-${stamp}`,
      petId: pet.id,
      vaccineId: vid,
      date: now.toISOString(),
      nextDate: iso(s?.days ?? VACCINE[vid].boosterDays),
      lot: p.lot ?? 'não informado',
      lab: `${VACCINE_LAB[vid].lab} · ${VACCINE_LAB[vid].product}`,
      vetId,
      dose: s && s.days < 60 ? 'Dose do protocolo' : 'Reforço anual',
    }
  })

  const reminders: Reminder[] = sugg
    .filter((s) => s.on)
    .map((s) => ({
      id: `campo-r-${s.key}-${stamp}`,
      petId: pet.id,
      kind: s.kind,
      title: s.title,
      dueDate: iso(s.days),
      sendDate: iso(Math.max(1, s.days - (s.days >= 30 ? 7 : 2)), '09:00'),
      status: 'programado',
      createdBy: vetId,
      origin: `Orientação na visita de ${fmt.short(TODAY)} · ${VET[vetId].short}`,
    }))

  demo.setVisitStatus(visit.id, 'concluida')
  demo.addEvent(event)
  if (doses.length) demo.addDoses(doses)
  demo.setWeight(pet.id, d.weight)
  if (reminders.length) demo.addReminders(reminders)
  // lembretes antigos de vacina que foram resolvidos nesta visita
  for (const r of demo.reminders) {
    if (r.petId !== pet.id || r.kind !== 'vacina') continue
    if (applied.some(([vid]) => r.title.toLowerCase().includes(VACCINE[vid].short.toLowerCase()))) demo.setReminderStatus(r.id, 'confirmado')
  }

  const savedOffline = queueIfOffline()
  const f: FinishedVisit = {
    eventSummary: summary,
    weight: d.weight,
    prevWeight: d.prevWeight,
    doses: doses.map((x) => ({ vaccineId: x.vaccineId, lot: x.lot })),
    reminders: reminders.map((r) => ({ title: r.title, dueDate: r.dueDate })),
    meds: d.meds.map((m) => `${MED[m.medId].name} ${MED[m.medId].conc}`),
    lines: priceLines(visit, d),
    durationMin: Math.max(visit.durationMin - 10, minutesSince(started, now)),
    savedOffline,
  }
  useCampo.getState().setFinished(visit.id, f)
  return f
}
