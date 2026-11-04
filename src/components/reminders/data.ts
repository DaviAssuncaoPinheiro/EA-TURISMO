import { BAIRRO, ZONE, type ZoneId } from '@/data/geo'
import { CLINIC, PETS, REMINDERS, TEMPLATES, TUTOR, VET, WEEK_PLAN, zoneOfPet, type Pet, type Reminder, type ReminderKind, type Tutor, type Vet } from '@/data/mock'
import { day, daysFromToday, fmt } from '@/data/time'
import { dueState } from '@/lib/status'
import { firstName, fill } from '@/lib/utils'

export const PET_BY_ID = Object.fromEntries(PETS.map((p) => [p.id, p])) as Record<string, Pet>
const SEED_IDS = new Set(REMINDERS.map((r) => r.id))

export type GroupKey = 'atrasados' | 'enviar' | 'enviados' | 'confirmados'

export const GROUPS: { key: GroupKey; title: string; hint: string }[] = [
  { key: 'atrasados', title: 'Atrasados sem resposta', hint: 'Já venceu e o tutor ainda não marcou' },
  { key: 'enviar', title: 'Para enviar', hint: 'Programados pelas regras' },
  { key: 'enviados', title: 'Enviados e lidos', hint: 'Aguardando resposta do tutor' },
  { key: 'confirmados', title: 'Confirmados e agendados', hint: 'Já viraram visita' },
]

export interface Item {
  r: Reminder
  pet: Pet
  tutor: Tutor
  zone: ZoneId
  due: ReturnType<typeof dueState>
  group: GroupKey
  isNew: boolean
}

export function groupOf(r: Reminder): GroupKey {
  if (r.status === 'confirmado' || r.status === 'agendado') return 'confirmados'
  if (daysFromToday(r.dueDate) < 0) return 'atrasados'
  if (r.status === 'programado') return 'enviar'
  return 'enviados'
}

export function enrich(list: Reminder[]): Item[] {
  return list
    .filter((r) => PET_BY_ID[r.petId])
    .map((r) => {
      const pet = PET_BY_ID[r.petId]
      return { r, pet, tutor: TUTOR[pet.tutorId], zone: zoneOfPet(pet), due: dueState(r.dueDate), group: groupOf(r), isNew: !SEED_IDS.has(r.id) }
    })
    .sort((a, b) => Number(b.isNew) - Number(a.isNew) || +new Date(a.r.dueDate) - +new Date(b.r.dueDate))
}

/** Ticket médio estimado por tipo de lembrete, usado só para a receita recuperada. */
export const TICKET: Record<ReminderKind, number> = { vacina: 140, retorno: 190, 'vermífugo': 70, antipulgas: 95, exame: 260 }

export const dm = (d: Date | string) => {
  const x = new Date(d)
  return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`
}

/** Próximo dia em que algum veterinário da escala atende a zona (prefere quem criou o lembrete). */
export function nextServiceDay(zone: ZoneId, preferVet?: string): { date: Date; vet: Vet; label: string } | null {
  for (let off = 1; off <= 21; off++) {
    const d = day(off)
    const wd = d.getDay()
    const vets = Object.keys(WEEK_PLAN).filter((v) => WEEK_PLAN[v][wd]?.includes(zone))
    if (vets.length) {
      const vid = preferVet && vets.includes(preferVet) ? preferVet : vets[0]
      return { date: d, vet: VET[vid], label: `${fmt.weekday(d)}, ${dm(d)}` }
    }
  }
  return null
}

export const VARIABLES = ['tutor', 'pet', 'item', 'data', 'vet', 'bairro', 'clinica', 'diaSugerido'] as const

export function baseTemplate(it: Item): string {
  const male = /^Dr\./.test(VET[it.r.createdBy].name)
  const svc = it.r.kind === 'vacina' ? nextServiceDay(it.zone, it.r.createdBy) : null
  const isMale = svc ? /^Dr\./.test(svc.vet.name) : male
  const t: string = TEMPLATES[it.r.kind]
  return isMale ? t.replace(/\bA \{vet\}/g, 'O {vet}').replace(/\bda \{vet\}/g, 'do {vet}') : t
}

export function varsOf(it: Item): Record<string, string> {
  const svc = nextServiceDay(it.zone, it.r.createdBy)
  const vet = it.r.kind === 'vacina' && svc ? svc.vet : VET[it.r.createdBy]
  return {
    tutor: firstName(it.tutor.name),
    pet: it.pet.name,
    item: it.r.title,
    data: dm(it.r.dueDate),
    vet: vet.short,
    bairro: BAIRRO[it.tutor.bairro].name,
    clinica: CLINIC.name,
    diaSugerido: svc ? svc.label : 'próxima semana',
  }
}

export const buildMessage = (it: Item, tpl?: string) => fill(tpl ?? baseTemplate(it), varsOf(it))

export const zoneName = (z: ZoneId) => ZONE[z].short
export const zoneHex = (z: ZoneId) => ZONE[z].hex
export type { ReminderKind }
