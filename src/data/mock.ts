import { BAIRRO, type ZoneId } from './geo'
import { day, iso } from './time'

/* ───────────────────────── Clínica e equipe ───────────────────────── */

export const CLINIC = {
  name: 'Vet Domicílio',
  city: 'Manaus · AM',
  plan: 'Protótipo',
  whatsapp: '(92) 98100-2040',
}

export interface Vet {
  id: string
  name: string
  short: string
  initials: string
  crmv: string
  focus: string
  color: string
  languages?: string[]
}

export const VETS: Vet[] = [
  { id: 'larissa', name: 'Dra. Larissa Menezes', short: 'Dra. Larissa', initials: 'LM', crmv: 'CRMV-AM 1284', focus: 'Clínica geral · Felinos', color: '#2f5443' },
  { id: 'rafael', name: 'Dr. Rafael Cavalcante', short: 'Dr. Rafael', initials: 'RC', crmv: 'CRMV-AM 1517', focus: 'Clínica geral · Vacinação', color: '#b9542e' },
  { id: 'bianca', name: 'Dra. Bianca Oliveira', short: 'Dra. Bianca', initials: 'BO', crmv: 'CRMV-AM 1932', focus: 'Geriatria · Dermatologia', color: '#3e6487' },
]
export const VET = Object.fromEntries(VETS.map((v) => [v.id, v])) as Record<string, Vet>

/** Quem está "logado" no protótipo */
export const CURRENT_USER = { name: 'Camila Rocha', role: 'Recepção e agenda', initials: 'CR' }

/* ───────────────────────── Vacinas e protocolos ───────────────────────── */

export type Species = 'cão' | 'gato'

export interface VaccineDef {
  id: string
  name: string
  short: string
  species: Species[]
  boosterDays: number // reforço do adulto
  note: string
}

export const VACCINES: VaccineDef[] = [
  { id: 'v10', name: 'Polivalente V10', short: 'V10', species: ['cão'], boosterDays: 365, note: 'Cinomose, parvovirose, hepatite, leptospirose (4 cepas)…' },
  { id: 'raiva', name: 'Antirrábica', short: 'Raiva', species: ['cão', 'gato'], boosterDays: 365, note: 'Obrigatória. Dose anual.' },
  { id: 'gripe', name: 'Gripe canina (tosse dos canis)', short: 'Gripe', species: ['cão'], boosterDays: 365, note: 'Bordetella + parainfluenza. Semestral para creche/hotel.' },
  { id: 'giardia', name: 'Giárdia', short: 'Giárdia', species: ['cão'], boosterDays: 365, note: 'Opcional. 2 doses iniciais.' },
  { id: 'v5', name: 'Quíntupla felina V5', short: 'V5', species: ['gato'], boosterDays: 365, note: 'Inclui FeLV. Exige teste FIV/FeLV negativo.' },
  { id: 'v4', name: 'Quádrupla felina V4', short: 'V4', species: ['gato'], boosterDays: 365, note: 'Rinotraqueíte, calicivirose, panleucopenia, clamidiose.' },
]
export const VACCINE = Object.fromEntries(VACCINES.map((v) => [v.id, v])) as Record<string, VaccineDef>

export interface PreventiveDef {
  id: string
  name: string
  kind: 'vermífugo' | 'antipulgas'
  everyDays: number
}
export const PREVENTIVES: PreventiveDef[] = [
  { id: 'vermifugo', name: 'Vermífugo (Drontal Plus)', kind: 'vermífugo', everyDays: 90 },
  { id: 'nexgard', name: 'NexGard', kind: 'antipulgas', everyDays: 30 },
  { id: 'simparic', name: 'Simparic', kind: 'antipulgas', everyDays: 35 },
  { id: 'bravecto', name: 'Bravecto', kind: 'antipulgas', everyDays: 84 },
]

/* ───────────────────────── Tutores e pacientes ───────────────────────── */

export interface Tutor {
  id: string
  name: string
  phone: string
  address: string
  bairro: string // id
  complement?: string
  note?: string
}

export interface Pet {
  id: string
  name: string
  species: Species
  breed: string
  sex: 'M' | 'F'
  neutered: boolean
  birth: string
  coat: string
  weightKg: number
  idealKg: [number, number]
  bcs: number // escore corporal 1–9
  tutorId: string
  photo: string
  microchip?: string
  alerts?: string[]
  conditions?: string[]
  temperament?: string
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=480&h=480&q=70`

export const TUTORS: Tutor[] = [
  { id: 't1', name: 'Mariana Albuquerque', phone: '(92) 99183-4410', address: 'Rua Recife, 1840', bairro: 'adrianopolis', complement: 'Cond. Mirante do Parque, ap. 1203', note: 'Prefere contato após 18h.' },
  { id: 't2', name: 'Seu Joaquim Barros', phone: '(92) 98455-0921', address: 'Rua Pará, 512', bairro: 'vieiralves', note: 'Idoso; filha Renata acompanha consultas.' },
  { id: 't3', name: 'Ana Beatriz Lins', phone: '(92) 99260-7735', address: 'Av. Efigênio Salles, 2210', bairro: 'aleixo', complement: 'Cond. Jardim Amazônia, casa 41' },
  { id: 't4', name: 'Paulo Henrique Dantas', phone: '(92) 98812-3306', address: 'Rua Belo Horizonte, 77', bairro: 'parque-10' },
  { id: 't5', name: 'Fernanda e Lucas Prado', phone: '(92) 99377-1158', address: 'Rua Salvador, 433', bairro: 'chapada', complement: 'Portão verde' },
  { id: 't6', name: 'Dona Socorro Viana', phone: '(92) 98123-9047', address: 'Rua Ramos Ferreira, 1190', bairro: 'praca-14' },
  { id: 't7', name: 'Igor Tavares', phone: '(92) 99654-2280', address: 'Rua Tapajós, 98', bairro: 'petropolis' },
  { id: 't8', name: 'Juliana Monteiro', phone: '(92) 99148-6612', address: 'Av. do Turismo, 3500', bairro: 'ponta-negra', complement: 'Cond. Residencial Ponta Negra II, casa 7' },
  { id: 't9', name: 'Ricardo Sampaio', phone: '(92) 98244-5129', address: 'Estrada do Tarumã, km 4', bairro: 'taruma', complement: 'Sítio Recanto, portão de madeira' },
  { id: 't10', name: 'Larissa e Pedro Cunha', phone: '(92) 99521-8830', address: 'Rua São Pedro, 210', bairro: 'santo-agostinho' },
  { id: 't11', name: 'Cláudia Ferraz', phone: '(92) 98877-4401', address: 'Rua Lírio do Vale, 59', bairro: 'compensa' },
  { id: 't12', name: 'Thiago Nogueira', phone: '(92) 99712-6654', address: 'Rua Francisco Queiroz, 344', bairro: 'coroado' },
  { id: 't13', name: 'Beatriz Saraiva', phone: '(92) 98366-1207', address: 'Rua Nova Esperança, 88', bairro: 'zumbi' },
  { id: 't14', name: 'Sr. Antônio Mendes', phone: '(92) 99430-5582', address: 'Av. Autaz Mirim, 6120', bairro: 'sao-jose' },
  { id: 't15', name: 'Gabriela Reis', phone: '(92) 98190-3374', address: 'Rua 12, Qd. 40, casa 3', bairro: 'tancredo-neves' },
  { id: 't16', name: 'Renan Batista', phone: '(92) 99815-2048', address: 'Av. Noel Nutels, 1520', bairro: 'cidade-nova' },
  { id: 't17', name: 'Patrícia Gomes', phone: '(92) 98642-7715', address: 'Rua Pico das Águas, 260', bairro: 'flores' },
  { id: 't18', name: 'Eduardo Pinto', phone: '(92) 99088-3361', address: 'Av. Jacira Reis, 401', bairro: 'dom-pedro' },
]
export const TUTOR = Object.fromEntries(TUTORS.map((t) => [t.id, t])) as Record<string, Tutor>

export const PETS: Pet[] = [
  { id: 'thor', name: 'Thor', species: 'cão', breed: 'Golden Retriever', sex: 'M', neutered: true, birth: iso(-6 * 365 - 40), coat: 'Dourada', weightKg: 34.2, idealKg: [29, 34], bcs: 6, tutorId: 't1', photo: u('photo-1552053831-71594a27632d'), microchip: '963 0060 0012 4471', temperament: 'Dócil. Adora petisco de frango.', conditions: ['Otite recorrente (orelha esq.)'] },
  { id: 'nina', name: 'Nina', species: 'gato', breed: 'Persa', sex: 'F', neutered: true, birth: iso(-11 * 365 - 120), coat: 'Branca', weightKg: 3.6, idealKg: [3.4, 4.2], bcs: 4, tutorId: 't2', photo: u('photo-1573865526739-10659fec78a5'), alerts: ['Doença renal crônica — estágio IRIS 2'], conditions: ['DRC estágio 2', 'Dieta renal'], temperament: 'Arisca no manejo. Usar toalha.' },
  { id: 'bob', name: 'Bob', species: 'cão', breed: 'Shih Tzu', sex: 'M', neutered: true, birth: iso(-9 * 365 - 200), coat: 'Branca e caramelo', weightKg: 7.9, idealKg: [5.5, 7.2], bcs: 7, tutorId: 't4', photo: u('photo-1583337130417-3346a1be7dee'), alerts: ['Sopro cardíaco grau III/VI — em acompanhamento'], conditions: ['Degeneração mixomatosa de mitral (B1)', 'Sobrepeso'], temperament: 'Tranquilo. Tosse ao se agitar.' },
  { id: 'pacoca', name: 'Paçoca', species: 'cão', breed: 'SRD', sex: 'F', neutered: false, birth: iso(-88), coat: 'Caramelo', weightKg: 4.1, idealKg: [3.5, 5], bcs: 5, tutorId: 't3', photo: u('photo-1561037404-61cd46aa615b'), temperament: 'Filhote, muito agitada.' },
  { id: 'mia', name: 'Mia', species: 'gato', breed: 'Siamês', sex: 'F', neutered: true, birth: iso(-420), coat: 'Seal point', weightKg: 3.3, idealKg: [3, 4], bcs: 5, tutorId: 't5', photo: u('photo-1513360371669-4adf3dd7dff8'), temperament: 'Vocal, mas cooperativa.' },
  { id: 'pipoca', name: 'Pipoca', species: 'cão', breed: 'Yorkshire', sex: 'F', neutered: true, birth: iso(-12 * 365 - 30), coat: 'Azul e castanho', weightKg: 2.6, idealKg: [2.3, 3.2], bcs: 4, tutorId: 't6', photo: u('photo-1587300003388-59208cc962cb'), alerts: ['Colapso de traqueia — evitar coleira'], conditions: ['Colapso de traqueia', 'Doença periodontal'] },
  { id: 'simba', name: 'Simba', species: 'gato', breed: 'SRD', sex: 'M', neutered: true, birth: iso(-6 * 365), coat: 'Laranja tigrado', weightKg: 6.1, idealKg: [4.5, 5.5], bcs: 7, tutorId: 't7', photo: u('photo-1574158622682-e40e69881006'), conditions: ['Sobrepeso'] },
  { id: 'fred', name: 'Fred', species: 'cão', breed: 'Buldogue Francês', sex: 'M', neutered: false, birth: iso(-2 * 365 - 60), coat: 'Tigrado', weightKg: 12.4, idealKg: [10, 13], bcs: 5, tutorId: 't8', photo: u('photo-1583512603805-3cc6b41f3edb'), alerts: ['Braquicefálico — atenção ao calor'], conditions: ['Dermatite alérgica'] },
  { id: 'amora', name: 'Amora', species: 'cão', breed: 'Spitz Alemão', sex: 'F', neutered: true, birth: iso(-5 * 365 - 100), coat: 'Laranja', weightKg: 3.4, idealKg: [2.5, 3.5], bcs: 5, tutorId: 't8', photo: u('photo-1591160690555-5debfba289f0') },
  { id: 'zeus', name: 'Zeus', species: 'cão', breed: 'Pastor Alemão', sex: 'M', neutered: false, birth: iso(-7 * 365 - 10), coat: 'Preta e castanha', weightKg: 38.5, idealKg: [30, 40], bcs: 5, tutorId: 't9', photo: u('photo-1589941013453-ec89f33b5e95'), alerts: ['Displasia coxofemoral'], temperament: 'Protetor. Tutor deve segurar.' },
  { id: 'kiara', name: 'Kiara', species: 'cão', breed: 'Labrador', sex: 'F', neutered: false, birth: iso(-380), coat: 'Chocolate', weightKg: 24.8, idealKg: [25, 32], bcs: 5, tutorId: 't10', photo: u('photo-1518717758536-85ae29035b6d') },
  { id: 'mel', name: 'Mel', species: 'cão', breed: 'SRD', sex: 'F', neutered: true, birth: iso(-4 * 365 - 200), coat: 'Caramelo', weightKg: 14.2, idealKg: [12, 15], bcs: 5, tutorId: 't11', photo: u('photo-1583511655857-d19b40a7a54e') },
  { id: 'tom', name: 'Tom', species: 'gato', breed: 'SRD', sex: 'M', neutered: true, birth: iso(-4 * 365 - 30), coat: 'Preta', weightKg: 4.8, idealKg: [4, 5.5], bcs: 5, tutorId: 't12', photo: u('photo-1533743983669-94fa5c4338ec') },
  { id: 'frida', name: 'Frida', species: 'cão', breed: 'Dachshund', sex: 'F', neutered: true, birth: iso(-8 * 365 - 90), coat: 'Vermelha', weightKg: 8.9, idealKg: [7, 9], bcs: 6, tutorId: 't13', photo: u('photo-1612195583950-b8fd34c87093'), alerts: ['Hérnia de disco (2023) — evitar escadas'] },
  { id: 'cafe', name: 'Café', species: 'cão', breed: 'Poodle', sex: 'M', neutered: true, birth: iso(-10 * 365 - 15), coat: 'Marrom', weightKg: 6.4, idealKg: [5.5, 7], bcs: 5, tutorId: 't14', photo: u('photo-1594149929911-78975a43d4f5'), conditions: ['Catarata bilateral inicial'] },
  { id: 'belinha', name: 'Belinha', species: 'gato', breed: 'SRD tricolor', sex: 'F', neutered: false, birth: iso(-245), coat: 'Tricolor', weightKg: 2.9, idealKg: [2.8, 3.8], bcs: 5, tutorId: 't15', photo: u('photo-1592194996308-7b43878e84a6') },
  { id: 'bento', name: 'Bento', species: 'cão', breed: 'Beagle', sex: 'M', neutered: true, birth: iso(-3 * 365 - 70), coat: 'Tricolor', weightKg: 13.8, idealKg: [10, 14], bcs: 6, tutorId: 't16', photo: u('photo-1505628346881-b72b27e84530') },
  { id: 'luna', name: 'Luna', species: 'gato', breed: 'SRD', sex: 'F', neutered: true, birth: iso(-3 * 365 - 150), coat: 'Cinza rajada', weightKg: 4.0, idealKg: [3.5, 4.5], bcs: 5, tutorId: 't17', photo: u('photo-1514888286974-6c03e2ca1dba') },
  { id: 'bidu', name: 'Bidu', species: 'cão', breed: 'Lhasa Apso', sex: 'M', neutered: true, birth: iso(-7 * 365 - 300), coat: 'Dourada', weightKg: 7.1, idealKg: [6, 8], bcs: 5, tutorId: 't18', photo: u('photo-1537151625747-768eb6cf92b2'), conditions: ['Ceratoconjuntivite seca'] },
]
export const PET = Object.fromEntries(PETS.map((p) => [p.id, p])) as Record<string, Pet>

export const petsOfTutor = (tutorId: string) => PETS.filter((p) => p.tutorId === tutorId)
export const zoneOfPet = (p: Pet): ZoneId => BAIRRO[TUTOR[p.tutorId].bairro].zone

/* ───────────────────────── Vacinação aplicada ───────────────────────── */

export interface VaccineDose {
  id: string
  petId: string
  vaccineId: string
  date: string
  nextDate: string
  lot: string
  lab: string
  vetId: string
  dose: string // "Reforço anual", "2ª dose"
}

const LABS: Record<string, string> = { v10: 'Zoetis · Vanguard Plus', raiva: 'Boehringer · Rabisin', gripe: 'Zoetis · Bronchi-Shield', giardia: 'Zoetis · GiardiaVax', v5: 'Boehringer · Purevax', v4: 'Zoetis · Felocell' }

let doseSeq = 0
function dose(petId: string, vaccineId: string, appliedOffset: number, vetId: string, label = 'Reforço anual', nextOffset?: number): VaccineDose {
  doseSeq++
  const next = nextOffset ?? appliedOffset + VACCINE[vaccineId].boosterDays
  return {
    id: `d${doseSeq}`,
    petId,
    vaccineId,
    date: iso(appliedOffset),
    nextDate: iso(next),
    lot: `${vaccineId.toUpperCase().slice(0, 3)}${(21470 + doseSeq * 37).toString(36).toUpperCase()}`,
    lab: LABS[vaccineId],
    vetId,
    dose: label,
  }
}

export const DOSES: VaccineDose[] = [
  // Thor: em dia, aplicou hoje cedo
  dose('thor', 'v10', -730, 'rafael'), dose('thor', 'v10', -365, 'rafael'), dose('thor', 'v10', 0, 'larissa'),
  dose('thor', 'raiva', -360, 'rafael'), dose('thor', 'raiva', 0, 'larissa'),
  dose('thor', 'gripe', -340, 'rafael', 'Reforço anual', 25),
  dose('thor', 'giardia', -300, 'rafael', 'Reforço anual', 65),
  // Nina
  dose('nina', 'v4', -350, 'larissa', 'Reforço anual', 15), dose('nina', 'raiva', -350, 'larissa', 'Reforço anual', 15),
  // Bob — gripe atrasada
  dose('bob', 'v10', -320, 'bianca', 'Reforço anual', 45), dose('bob', 'raiva', -320, 'bianca', 'Reforço anual', 45), dose('bob', 'gripe', -380, 'bianca', 'Reforço anual', -15),
  // Paçoca — filhote em protocolo
  dose('pacoca', 'v10', -24, 'rafael', '1ª dose', 0),
  // Mia
  dose('mia', 'v5', -200, 'larissa', 'Reforço anual', 165), dose('mia', 'raiva', -200, 'larissa', 'Reforço anual', 165),
  // Pipoca — raiva vence em 6 dias
  dose('pipoca', 'v10', -300, 'bianca', 'Reforço anual', 65), dose('pipoca', 'raiva', -359, 'bianca', 'Reforço anual', 6),
  // Simba — atrasado
  dose('simba', 'v4', -392, 'larissa', 'Reforço anual', -27), dose('simba', 'raiva', -392, 'larissa', 'Reforço anual', -27),
  // Fred
  dose('fred', 'v10', -355, 'rafael', 'Reforço anual', 10), dose('fred', 'raiva', -355, 'rafael', 'Reforço anual', 10), dose('fred', 'gripe', -170, 'rafael', 'Semestral (creche)', 12),
  // Amora
  dose('amora', 'v10', -100, 'rafael'), dose('amora', 'raiva', -100, 'rafael'),
  // Zeus — raiva atrasada
  dose('zeus', 'v10', -330, 'rafael', 'Reforço anual', 35), dose('zeus', 'raiva', -372, 'rafael', 'Reforço anual', -7),
  // Kiara — 2 doses giárdia
  dose('kiara', 'v10', -20, 'rafael'), dose('kiara', 'raiva', -20, 'rafael'), dose('kiara', 'giardia', -40, 'rafael', '1ª dose', -12),
  // Mel
  dose('mel', 'v10', -362, 'rafael', 'Reforço anual', 3), dose('mel', 'raiva', -290, 'rafael'),
  // Tom
  dose('tom', 'v4', -150, 'bianca'), dose('tom', 'raiva', -150, 'bianca'),
  // Frida
  dose('frida', 'v10', -348, 'bianca', 'Reforço anual', 17), dose('frida', 'raiva', -348, 'bianca', 'Reforço anual', 17),
  // Café
  dose('cafe', 'v10', -200, 'bianca'), dose('cafe', 'raiva', -200, 'bianca'),
  // Belinha — protocolo de filhote incompleto
  dose('belinha', 'v4', -60, 'bianca', '2ª dose', -35),
  // Bento
  dose('bento', 'v10', -250, 'bianca'), dose('bento', 'raiva', -365, 'bianca', 'Reforço anual', 0), dose('bento', 'gripe', -180, 'bianca', 'Semestral (creche)', 2),
  // Luna
  dose('luna', 'v4', -90, 'larissa'), dose('luna', 'raiva', -90, 'larissa'),
  // Bidu
  dose('bidu', 'v10', -340, 'larissa', 'Reforço anual', 25), dose('bidu', 'raiva', -340, 'larissa', 'Reforço anual', 25),
]

export const dosesOf = (petId: string) => DOSES.filter((d) => d.petId === petId)

/** Situação vacinal: última dose de cada vacina */
export function vaccineStatus(petId: string) {
  const byVaccine = new Map<string, VaccineDose>()
  for (const d of dosesOf(petId)) {
    const cur = byVaccine.get(d.vaccineId)
    if (!cur || new Date(d.date) > new Date(cur.date)) byVaccine.set(d.vaccineId, d)
  }
  return [...byVaccine.values()]
}

/* ───────────────────────── Antiparasitários ───────────────────────── */

export interface PreventiveDose {
  petId: string
  preventiveId: string
  date: string
  nextDate: string
}
export const PREVENTIVE_DOSES: PreventiveDose[] = PETS.flatMap((p, i) => {
  const verm = -((i * 17) % 100)
  const pulga = -((i * 11) % 40)
  const pulgaId = i % 3 === 0 ? 'bravecto' : i % 3 === 1 ? 'nexgard' : 'simparic'
  const pulgaEvery = PREVENTIVES.find((x) => x.id === pulgaId)!.everyDays
  return [
    { petId: p.id, preventiveId: 'vermifugo', date: iso(verm), nextDate: iso(verm + 90) },
    { petId: p.id, preventiveId: pulgaId, date: iso(pulga), nextDate: iso(pulga + pulgaEvery) },
  ]
})

/* ───────────────────────── Peso ───────────────────────── */

export function weightHistory(p: Pet) {
  // Série mensal dos últimos 14 meses, determinística por pet
  const seed = p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const points: { date: string; kg: number }[] = []
  const n = 14
  const youngMonths = Math.max(0, Math.round((Date.now() - new Date(p.birth).getTime()) / (30 * 86400000)))
  for (let i = n - 1; i >= 0; i--) {
    if (i > youngMonths) continue
    const wave = Math.sin((seed + i) * 0.9) * 0.025
    const trend = p.id === 'bob' ? 1 - i * 0.012 : p.id === 'simba' ? 1 - i * 0.008 : p.id === 'nina' ? 1 + i * 0.006 : 1 - i * 0.002
    const growth = youngMonths < 12 ? Math.max(0.25, 1 - (i / Math.max(youngMonths, 1)) * 0.75) : 1
    points.push({ date: iso(-i * 30), kg: +(p.weightKg * trend * growth * (1 + wave)).toFixed(1) })
  }
  points[points.length - 1].kg = p.weightKg
  return points
}

/* ───────────────────────── Histórico clínico ───────────────────────── */

export type EventKind = 'consulta' | 'vacina' | 'exame' | 'procedimento' | 'retorno' | 'nota' | 'foto'

export interface ClinicalEvent {
  id: string
  petId: string
  date: string
  kind: EventKind
  title: string
  summary: string
  vetId: string
  tags?: string[]
}

export const EVENTS: ClinicalEvent[] = [
  { id: 'e1', petId: 'bob', date: iso(-21, '15:30'), kind: 'consulta', title: 'Consulta cardiológica', summary: 'Sopro sistólico III/VI em foco mitral. Ecocardiograma solicitado. Iniciado pimobendan 0,25 mg/kg BID.', vetId: 'bianca', tags: ['Cardiologia'] },
  { id: 'e2', petId: 'bob', date: iso(-18, '10:00'), kind: 'exame', title: 'Ecocardiograma', summary: 'Degeneração mixomatosa de mitral, estágio B1 (ACVIM). Sem remodelamento significativo.', vetId: 'bianca', tags: ['Laudo PDF'] },
  { id: 'e3', petId: 'bob', date: iso(-90, '09:20'), kind: 'consulta', title: 'Check-up geriátrico', summary: 'Ganho de 0,6 kg em 3 meses. Orientada dieta light e caminhadas leves. Hemograma e bioquímico normais.', vetId: 'bianca', tags: ['Geriatria'] },
  { id: 'e4', petId: 'bob', date: iso(-160, '14:10'), kind: 'procedimento', title: 'Limpeza auricular', summary: 'Otite ceruminosa bilateral leve. Limpeza e prescrição de otológico por 10 dias.', vetId: 'bianca' },
  { id: 'e5', petId: 'bob', date: iso(-320, '11:00'), kind: 'vacina', title: 'V10 + Antirrábica', summary: 'Reforço anual aplicado. Sem reações.', vetId: 'bianca' },
  { id: 'e6', petId: 'nina', date: iso(-45, '16:00'), kind: 'exame', title: 'Painel renal + SDMA', summary: 'Creatinina 2,1 mg/dL, SDMA 19 µg/dL. Mantido estágio IRIS 2. PA 150 mmHg.', vetId: 'larissa', tags: ['Laudo PDF'] },
  { id: 'e7', petId: 'nina', date: iso(-46, '15:00'), kind: 'consulta', title: 'Acompanhamento renal', summary: 'Hidratada, apetite seletivo. Fluidoterapia subcutânea 2×/semana pelo tutor (treinado).', vetId: 'larissa' },
  { id: 'e8', petId: 'thor', date: iso(-60, '18:00'), kind: 'consulta', title: 'Otite externa', summary: 'Orelha esquerda com secreção. Citologia: Malassezia. Tratamento tópico 14 dias.', vetId: 'rafael' },
  { id: 'e9', petId: 'simba', date: iso(-120, '10:30'), kind: 'consulta', title: 'Plano de emagrecimento', summary: 'Meta: −0,5 kg/mês. Ração light dividida em 4 porções e enriquecimento ambiental.', vetId: 'larissa' },
  { id: 'e10', petId: 'pipoca', date: iso(-30, '09:00'), kind: 'procedimento', title: 'Avaliação odontológica', summary: 'Tártaro grau 2. Indicada profilaxia em clínica parceira (necessita anestesia).', vetId: 'bianca' },
  { id: 'e11', petId: 'pacoca', date: iso(-24, '17:00'), kind: 'vacina', title: '1ª dose V10', summary: 'Filhote saudável, 3,2 kg. Vermifugada. Próxima dose em 21–28 dias.', vetId: 'rafael' },
]

export const eventsOf = (petId: string) =>
  EVENTS.filter((e) => e.petId === petId).sort((a, b) => +new Date(b.date) - +new Date(a.date))

/* ───────────────────────── Visitas (agenda) ───────────────────────── */

export type VisitType = 'Vacinação' | 'Consulta' | 'Retorno' | 'Coleta de exames' | 'Curativo' | 'Check-up' | 'Fluidoterapia'
export type VisitStatus = 'concluida' | 'em-atendimento' | 'a-caminho' | 'agendada' | 'cancelada'

export interface Visit {
  id: string
  petIds: string[]
  tutorId: string
  vetId: string
  start: string
  durationMin: number
  type: VisitType
  reason: string
  status: VisitStatus
  fixedTime: boolean // horário marcado pelo tutor (não move na otimização)
  price: number
  paid?: boolean
}

let vSeq = 0
function v(dayOffset: number, hhmm: string, vetId: string, tutorId: string, petIds: string[], type: VisitType, reason: string, status: VisitStatus, durationMin = 45, fixedTime = false, price = 220): Visit {
  vSeq++
  return { id: `v${vSeq}`, petIds, tutorId, vetId, start: iso(dayOffset, hhmm), durationMin, type, reason, status, fixedTime, price }
}

/** Hora "agora" simulada no protótipo: 10h40 de hoje */
export const NOW = day(0, '10:40')

export const VISITS: Visit[] = [
  // ── HOJE · Dra. Larissa · Centro-Sul + Sul
  v(0, '08:00', 'larissa', 't1', ['thor'], 'Vacinação', 'Reforço anual V10 + antirrábica', 'concluida', 35, true, 260),
  v(0, '09:00', 'larissa', 't2', ['nina'], 'Fluidoterapia', 'Fluido SC + aferição de PA', 'concluida', 40, false, 180),
  v(0, '10:05', 'larissa', 't4', ['bob'], 'Retorno', 'Retorno cardiológico — 21 dias de pimobendan', 'em-atendimento', 50, true, 240),
  v(0, '11:20', 'larissa', 't3', ['pacoca'], 'Vacinação', '2ª dose V10 + vermífugo', 'agendada', 35, false, 190),
  v(0, '13:30', 'larissa', 't5', ['mia'], 'Curativo', 'Retirada de pontos — castração', 'agendada', 30, false, 150),
  v(0, '14:30', 'larissa', 't17', ['luna'], 'Consulta', 'Vômitos esporádicos há 1 semana', 'agendada', 50, true, 240),
  v(0, '15:40', 'larissa', 't6', ['pipoca'], 'Coleta de exames', 'Hemograma + bioquímico pré-anestésico', 'agendada', 35, false, 210),
  v(0, '16:40', 'larissa', 't7', ['simba'], 'Check-up', 'Pesagem + vacinas atrasadas', 'agendada', 45, false, 280),
  // ── HOJE · Dr. Rafael · Oeste
  v(0, '08:30', 'rafael', 't8', ['fred', 'amora'], 'Consulta', 'Fred: coceira nas patas · Amora: check-up', 'concluida', 60, true, 380),
  v(0, '10:00', 'rafael', 't10', ['kiara'], 'Vacinação', '2ª dose giárdia', 'a-caminho', 30, false, 170),
  v(0, '11:15', 'rafael', 't9', ['zeus'], 'Consulta', 'Claudicação posterior + raiva atrasada', 'agendada', 60, false, 290),
  v(0, '14:00', 'rafael', 't11', ['mel'], 'Vacinação', 'Reforço V10', 'agendada', 30, true, 170),
  v(0, '15:00', 'rafael', 't18', ['bidu'], 'Retorno', 'Colírio — reavaliação do teste de Schirmer', 'agendada', 35, false, 200),
  // ── HOJE · Dra. Bianca · Leste + Norte
  v(0, '08:00', 'bianca', 't14', ['cafe'], 'Check-up', 'Check-up geriátrico semestral', 'concluida', 60, true, 320),
  v(0, '09:30', 'bianca', 't13', ['frida'], 'Retorno', 'Fisioterapia — evolução de coluna', 'concluida', 45, false, 230),
  v(0, '10:30', 'bianca', 't12', ['tom'], 'Consulta', 'Lesão na orelha (briga)', 'em-atendimento', 40, false, 230),
  v(0, '13:00', 'bianca', 't15', ['belinha'], 'Vacinação', '3ª dose V4 (atrasada)', 'agendada', 30, false, 180),
  v(0, '14:20', 'bianca', 't16', ['bento'], 'Vacinação', 'Antirrábica + gripe (creche)', 'agendada', 35, true, 230),
  // ── Próximos dias (amostra)
  v(1, '09:00', 'larissa', 't2', ['nina'], 'Fluidoterapia', 'Fluido SC', 'agendada', 40),
  v(1, '10:30', 'rafael', 't9', ['zeus'], 'Retorno', 'Reavaliação ortopédica', 'agendada', 45),
  v(1, '14:00', 'bianca', 't4', ['bob'], 'Consulta', 'Holter — instalação', 'agendada', 60),
  v(2, '08:30', 'larissa', 't1', ['thor'], 'Retorno', 'Otite — reavaliação', 'agendada', 30),
  v(2, '11:00', 'bianca', 't14', ['cafe'], 'Consulta', 'Oftalmológica', 'agendada', 45),
  v(3, '15:00', 'rafael', 't8', ['fred'], 'Retorno', 'Dermatite — 14 dias', 'agendada', 30),
  v(-1, '10:00', 'larissa', 't17', ['luna'], 'Consulta', 'Triagem', 'concluida', 40),
]

export const visitsToday = () => VISITS.filter((x) => new Date(x.start).toDateString() === day(0).toDateString())

/** Ordem "como foi marcada" vs "otimizada por região" (Dra. Larissa) */
export const ROUTE_LARISSA = {
  vetId: 'larissa',
  manualOrder: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'],
  // Sem otimização: visitas marcadas por ordem de chegada no WhatsApp
  naive: ['v1', 'v7', 'v3', 'v2', 'v8', 'v4', 'v6', 'v5'],
  kmNaive: 46.8,
  kmOptimized: 29.4,
  minNaive: 212,
  minOptimized: 131,
}

/* ───────────────────────── Escala semanal por região ───────────────────────── */

/** Dia da semana (1 = seg) → zonas por veterinário. É o coração do "organizar por região". */
export const WEEK_PLAN: Record<string, Record<number, ZoneId[]>> = {
  larissa: { 1: ['centro-sul'], 2: ['sul', 'centro-sul'], 3: ['centro-oeste'], 4: ['centro-sul', 'sul'], 5: ['centro-sul'], 6: ['sul'] },
  rafael: { 1: ['oeste'], 2: ['oeste'], 3: ['norte'], 4: ['oeste'], 5: ['centro-oeste', 'oeste'], 6: ['oeste'] },
  bianca: { 1: ['leste'], 2: ['norte'], 3: ['leste'], 4: ['leste', 'norte'], 5: ['norte'], 6: [] },
}

/* ───────────────────────── Lembretes ───────────────────────── */

export type ReminderKind = 'vacina' | 'retorno' | 'vermífugo' | 'antipulgas' | 'exame'
export type ReminderStatus = 'programado' | 'enviado' | 'lido' | 'confirmado' | 'agendado' | 'sem-resposta'

export interface Reminder {
  id: string
  petId: string
  kind: ReminderKind
  title: string
  dueDate: string
  sendDate: string
  status: ReminderStatus
  createdBy: string // vetId
  origin: string // "Protocolo V10 anual" / "Orientação na consulta de 12/10"
  reply?: string
}

let rSeq = 0
function r(petId: string, kind: ReminderKind, title: string, dueOffset: number, status: ReminderStatus, createdBy: string, origin: string, reply?: string, sendBefore = 7): Reminder {
  rSeq++
  return { id: `r${rSeq}`, petId, kind, title, dueDate: iso(dueOffset), sendDate: iso(dueOffset - sendBefore, '09:00'), status, createdBy, origin, reply }
}

export const REMINDERS: Reminder[] = [
  r('simba', 'vacina', 'V4 + Antirrábica atrasadas', -27, 'sem-resposta', 'larissa', 'Protocolo felino anual'),
  r('zeus', 'vacina', 'Antirrábica', -7, 'agendado', 'rafael', 'Protocolo anual · obrigatória', 'Pode ser na mesma visita da consulta do Zeus 👍'),
  r('bob', 'vacina', 'Gripe canina', -15, 'lido', 'bianca', 'Protocolo anual'),
  r('mel', 'vacina', 'Reforço V10', 3, 'agendado', 'rafael', 'Protocolo V10 anual', 'Confirmado! Quinta às 14h está ótimo.'),
  r('bento', 'vacina', 'Gripe canina (creche)', 2, 'confirmado', 'bianca', 'Semestral · frequenta creche', 'Sim, pode marcar'),
  r('pipoca', 'vacina', 'Antirrábica', 6, 'enviado', 'bianca', 'Protocolo anual · obrigatória'),
  r('fred', 'vacina', 'V10 + Antirrábica', 10, 'programado', 'rafael', 'Protocolo anual', undefined, 7),
  r('nina', 'vacina', 'V4 + Antirrábica', 15, 'programado', 'larissa', 'Protocolo felino anual', undefined, 10),
  r('frida', 'vacina', 'V10 + Antirrábica', 17, 'programado', 'bianca', 'Protocolo anual'),
  r('thor', 'vacina', 'Gripe canina', 25, 'programado', 'larissa', 'Protocolo anual'),
  r('bidu', 'vacina', 'V10 + Antirrábica', 25, 'programado', 'larissa', 'Protocolo anual'),
  r('bob', 'retorno', 'Retorno cardiológico', 0, 'agendado', 'bianca', 'Orientação: reavaliar em 21 dias após pimobendan', 'Combinado, estaremos em casa.'),
  r('nina', 'exame', 'Painel renal + SDMA', 45, 'programado', 'larissa', 'Orientação: repetir a cada 90 dias (IRIS 2)', undefined, 10),
  r('thor', 'retorno', 'Reavaliar otite', 2, 'confirmado', 'larissa', 'Orientação: retorno em 14 dias'),
  r('belinha', 'vacina', '3ª dose V4', -35, 'agendado', 'bianca', 'Protocolo de filhote (3 doses)', 'Desculpa a demora! Pode vir hoje.'),
  r('kiara', 'vacina', '2ª dose Giárdia', -12, 'agendado', 'rafael', 'Protocolo inicial (2 doses)'),
  r('simba', 'vermífugo', 'Vermífugo trimestral', 4, 'programado', 'larissa', 'A cada 90 dias'),
  r('amora', 'antipulgas', 'NexGard mensal', 1, 'enviado', 'rafael', 'A cada 30 dias'),
  r('luna', 'retorno', 'Retorno — vômitos', 14, 'programado', 'larissa', 'Orientação: retorno se persistir'),
  r('pacoca', 'vacina', '3ª dose V10', 25, 'programado', 'rafael', 'Protocolo de filhote (21–28 dias)'),
]

/* ───────────────────────── Modelos de mensagem ───────────────────────── */

export const TEMPLATES = {
  vacina:
    'Olá, {tutor}! 🐾 Aqui é a {clinica}.\nA vacina *{item}* do(a) *{pet}* vence em *{data}*.\nA {vet} estará no seu bairro ({bairro}) na *{diaSugerido}*. Quer garantir um horário?',
  retorno:
    'Olá, {tutor}! Tudo bem com o(a) {pet}? 💚\nConforme orientação da {vet}, está na hora do *{item}* ({data}).\nPodemos agendar a visita?',
  'vermífugo':
    'Oi, {tutor}! Lembrete da {clinica}: o vermífugo do(a) *{pet}* vence em *{data}*. Se precisar, levamos até você. 😉',
  antipulgas:
    'Oi, {tutor}! O antipulgas do(a) *{pet}* ({item}) deve ser dado em *{data}*. Qualquer dúvida, é só chamar.',
  exame:
    'Olá, {tutor}! A {vet} pediu para repetirmos o *{item}* do(a) *{pet}* por volta de *{data}*. Coletamos em casa — quer agendar?',
} as const

/* ───────────────────────── Indicadores ───────────────────────── */

export const KPIS = {
  visitsMonth: 186,
  visitsMonthPrev: 163,
  remindersConversion: 0.64, // lembretes que viraram visita
  remindersConversionPrev: 0.41,
  avgKmPerVisit: 3.7,
  avgKmPerVisitPrev: 6.1,
  revenueMonth: 41820,
  noShowRate: 0.031,
}

/** Visitas por zona × dia da semana (últimas 8 semanas) — para o mapa de calor */
export const HEATMAP: Record<ZoneId, number[]> = {
  oeste: [14, 16, 3, 15, 9, 11],
  'centro-oeste': [2, 3, 12, 1, 7, 2],
  sul: [4, 11, 2, 10, 3, 8],
  'centro-sul': [18, 12, 4, 17, 16, 5],
  norte: [1, 9, 10, 6, 11, 1],
  leste: [12, 2, 13, 9, 3, 0],
}
