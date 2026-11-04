import { BAIRRO, type ZoneId } from '@/data/geo'
import { DOSES, EVENTS, PETS, TUTOR, VACCINE, VISITS, zoneOfPet, type Pet, type VaccineDose } from '@/data/mock'
import { daysFromToday } from '@/data/time'
import { dueState } from '@/lib/status'

export type VacKey = 'late' | 'soon' | 'ok' | 'none'

export interface PatientRow {
  pet: Pet
  tutorName: string
  bairroId: string
  bairroName: string
  zone: ZoneId
  weight: number
  vac: { key: VacKey; label: string; tone: 'late' | 'warn' | 'ok' | 'neutral' }
  next: { date: string; label: string } | null
  last: string | null
  vetId: string | null
}

const rank: Record<VacKey, number> = { late: 0, soon: 1, ok: 2, none: 3 }
export const vacRank = (k: VacKey) => rank[k]

export function buildRows(extraDoses: VaccineDose[], extraEvents: { petId: string; date: string; vetId: string }[], extraWeights: Record<string, number>): PatientRow[] {
  const doses = [...DOSES, ...extraDoses]
  return PETS.map((pet) => {
    const t = TUTOR[pet.tutorId]
    const latest = new Map<string, VaccineDose>()
    for (const d of doses.filter((x) => x.petId === pet.id)) {
      const cur = latest.get(d.vaccineId)
      if (!cur || new Date(d.date) > new Date(cur.date)) latest.set(d.vaccineId, d)
    }
    const status = [...latest.values()].sort((a, b) => +new Date(a.nextDate) - +new Date(b.nextDate))
    let vac: PatientRow['vac'] = { key: 'none', label: 'Sem registro', tone: 'neutral' }
    let next: PatientRow['next'] = null
    if (status.length) {
      const worst = dueState(status[0].nextDate)
      vac = { key: worst.key, label: worst.label, tone: worst.tone as 'late' | 'warn' | 'ok' }
      next = { date: status[0].nextDate, label: VACCINE[status[0].vaccineId].short }
    }
    const events = [...EVENTS, ...extraEvents].filter((e) => e.petId === pet.id)
    const visits = VISITS.filter((v) => v.petIds.includes(pet.id) && v.status === 'concluida')
    const dates = [...events.map((e) => e.date), ...visits.map((v) => v.start)].filter((d) => daysFromToday(d) <= 0)
    const last = dates.length ? dates.sort((a, b) => +new Date(b) - +new Date(a))[0] : (status[0]?.date ?? null)
    const count = new Map<string, number>()
    for (const id of [...events.map((e) => e.vetId), ...visits.map((v) => v.vetId), ...doses.filter((d) => d.petId === pet.id).map((d) => d.vetId)]) count.set(id, (count.get(id) ?? 0) + 1)
    const vetId = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    return {
      pet,
      tutorName: t.name,
      bairroId: t.bairro,
      bairroName: BAIRRO[t.bairro].name,
      zone: zoneOfPet(pet),
      weight: extraWeights[pet.id] ?? pet.weightKg,
      vac,
      next,
      last,
      vetId,
    }
  })
}
