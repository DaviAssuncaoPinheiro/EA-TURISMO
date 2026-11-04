import { dosesOf, VACCINES, type Pet, type VaccineDose } from '@/data/mock'
import { dueState } from '@/lib/status'

/** Última dose de cada vacina, considerando também as aplicadas no app (store). */
export function latestDoses(petId: string, extra: VaccineDose[]) {
  const by = new Map<string, VaccineDose>()
  for (const d of [...dosesOf(petId), ...extra.filter((x) => x.petId === petId)]) {
    const cur = by.get(d.vaccineId)
    if (!cur || new Date(d.date) >= new Date(cur.date)) by.set(d.vaccineId, d)
  }
  return [...by.values()]
}

export interface VaccineRow {
  vaccineId: string
  last?: VaccineDose
  state: ReturnType<typeof dueState> | null
}

/** Vacinas da espécie, separadas em "vencendo/atrasadas", "em dia" e "nunca aplicadas". */
export function vaccineRows(pet: Pet, extra: VaccineDose[]) {
  const latest = latestDoses(pet.id, extra)
  const rows: VaccineRow[] = VACCINES.filter((v) => v.species.includes(pet.species)).map((v) => {
    const last = latest.find((d) => d.vaccineId === v.id)
    return { vaccineId: v.id, last, state: last ? dueState(last.nextDate) : null }
  })
  const order = { late: 0, soon: 1, ok: 2 }
  return {
    due: rows.filter((r) => r.state && r.state.key !== 'ok').sort((a, b) => order[a.state!.key] - order[b.state!.key]),
    ok: rows.filter((r) => r.state?.key === 'ok'),
    never: rows.filter((r) => !r.state),
  }
}
