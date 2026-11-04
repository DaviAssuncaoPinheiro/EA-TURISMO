// Dados e cálculos próprios do app de campo (celular do veterinário).
import { BAIRRO, BASE, ZONE, type ZoneId } from '@/data/geo'
import { EVENTS, NOW, PET, ROUTE_LARISSA, TUTOR, VACCINE, VISITS, type Pet, type Species, type Visit } from '@/data/mock'
import { day, fmt } from '@/data/time'

/* ───────── Visitas do dia por veterinário ───────── */

export const isToday = (d: string) => new Date(d).toDateString() === day(0).toDateString()

export function vetVisitsToday(vetId: string) {
  return VISITS.filter((v) => v.vetId === vetId && isToday(v.start)).sort((a, b) => +new Date(a.start) - +new Date(b.start))
}

export const visitById = (id: string) => VISITS.find((v) => v.id === id)
export const petOf = (v: Visit) => PET[v.petIds[0]]
export const tutorOf = (v: Visit) => TUTOR[v.tutorId]
export const bairroOf = (v: Visit) => BAIRRO[TUTOR[v.tutorId].bairro]
export const zoneOf = (v: Visit) => ZONE[bairroOf(v).zone]

/** Zonas do dia, na ordem em que aparecem na rota (mais visitas primeiro) */
export function zonesOfDay(visits: Visit[]): ZoneId[] {
  const count = new Map<ZoneId, number>()
  for (const v of visits) {
    const z = bairroOf(v).zone
    count.set(z, (count.get(z) ?? 0) + 1)
  }
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([z]) => z)
}

/* ───────── Distâncias (calibradas pela rota real da Dra. Larissa) ───────── */

type P = { x: number; y: number }
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y)

function routeUnits(visits: Visit[]) {
  let u = 0
  let prev: P = BASE
  for (const v of visits) {
    const b = bairroOf(v)
    u += dist(prev, b)
    prev = b
  }
  return u + dist(prev, BASE)
}

const KM_PER_UNIT = ROUTE_LARISSA.kmOptimized / routeUnits(vetVisitsToday('larissa'))

export function routeKm(vetId: string) {
  if (vetId === 'larissa') return ROUTE_LARISSA.kmOptimized
  return +(routeUnits(vetVisitsToday(vetId)) * KM_PER_UNIT).toFixed(1)
}

/** minutos de carro entre a parada anterior e esta (trânsito de Manaus ≈ 3,9 min/km) */
export function legOf(visit: Visit) {
  const list = vetVisitsToday(visit.vetId)
  const i = list.findIndex((v) => v.id === visit.id)
  const from: P = i > 0 ? bairroOf(list[i - 1]) : BASE
  const km = dist(from, bairroOf(visit)) * KM_PER_UNIT
  return { km: +km.toFixed(1), min: Math.max(4, Math.round(km * 3.9)) }
}

export function nextStopAfter(visit: Visit, status: Record<string, string>) {
  const list = vetVisitsToday(visit.vetId)
  const i = list.findIndex((v) => v.id === visit.id)
  return list.slice(i + 1).find((v) => status[v.id] === 'agendada' || status[v.id] === 'a-caminho')
}

export const minutesSince = (iso: string, now?: Date) => Math.max(0, Math.round((+(now ?? simNow()) - +new Date(iso)) / 60000))

/* ───────── Pet ───────── */

export function sexLabel(p: Pet) {
  if (p.sex === 'M') return p.neutered ? 'Macho castrado' : 'Macho'
  return p.neutered ? 'Fêmea castrada' : 'Fêmea'
}

export function lastConsult(petId: string) {
  return EVENTS.filter((e) => e.petId === petId && (e.kind === 'consulta' || e.kind === 'vacina' || e.kind === 'procedimento')).sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]
}

/* ───────── Referências clínicas ───────── */

export const REF: Record<Species, { temp: [number, number]; fc: [number, number]; fr: [number, number]; defaults: { temp: number; fc: number; fr: number } }> = {
  cão: { temp: [37.5, 39.2], fc: [60, 140], fr: [10, 30], defaults: { temp: 38.5, fc: 112, fr: 24 } },
  gato: { temp: [37.8, 39.2], fc: [140, 220], fr: [20, 30], defaults: { temp: 38.6, fc: 180, fr: 26 } },
}

export const MUCOSAS = ['Normocoradas', 'Hipocoradas', 'Hipercoradas', 'Ictéricas', 'Cianóticas']
export const HIDRATACAO = ['Normal', 'Leve (5%)', 'Moderada (7%)', 'Grave (>10%)']
export const TPC = ['< 2 s', '2–3 s', '> 3 s']

export const BCS_LABEL = (s: number) => (s <= 3 ? 'Abaixo do ideal' : s <= 5 ? 'Ideal' : s <= 7 ? 'Sobrepeso' : 'Obesidade')

/* ───────── Anamnese ───────── */

export const SYMPTOMS: Record<Species, string[]> = {
  cão: ['Sem queixas', 'Tosse ao esforço', 'Tosse noturna', 'Cansaço fácil', 'Respiração ofegante', 'Síncope', 'Vômito', 'Diarreia', 'Apetite reduzido', 'Bebendo mais água', 'Coceira', 'Claudicação', 'Apatia'],
  gato: ['Sem queixas', 'Vômito', 'Bola de pelo', 'Apetite reduzido', 'Bebendo mais água', 'Urinando fora da caixa', 'Perda de peso', 'Diarreia', 'Espirros', 'Coceira', 'Apatia', 'Esconde-se mais'],
}

/** O que o "ditado por voz" transcreve em cada caso + sintomas que ele reconhece */
export function dictationFor(visit: Visit, pet: Pet): { text: string; detect: string[] } {
  const scripts: Record<string, { text: string; detect: string[] }> = {
    bob: {
      text: 'Tutor conta que o Bob está bem mais disposto desde que começou o pimobendan. A tosse diminuiu bastante, agora só aparece quando ele se agita ou late muito. Come bem, dorme tranquilo e não teve nenhum desmaio. Está dando o remédio de 12 em 12 horas, certinho.',
      detect: ['Tosse ao esforço'],
    },
    pacoca: {
      text: 'Tutora relata que a Paçoca está ótima, brincando muito e comendo a ração de filhote três vezes ao dia. Sem vômito nem diarreia depois da primeira dose. Fez cocô normal hoje cedo.',
      detect: ['Sem queixas'],
    },
    luna: {
      text: 'Tutora conta que a Luna vomitou quatro vezes na última semana, sempre de manhã, logo depois de comer. Às vezes sai bola de pelo. Continua comendo e brincando, mas está bebendo mais água que o normal.',
      detect: ['Vômito', 'Bola de pelo', 'Bebendo mais água'],
    },
    simba: {
      text: 'Tutor relata que o Simba come muito rápido e pede comida o tempo todo. Está mais preguiçoso, dorme quase o dia inteiro. Não teve vômito. As vacinas atrasaram porque ele estava viajando.',
      detect: ['Apatia'],
    },
  }
  if (scripts[pet.id]) return scripts[pet.id]
  const name = pet.name
  return {
    text: `Tutor relata que ${pet.sex === 'F' ? 'a' : 'o'} ${name} está bem, comendo e bebendo água normalmente. Sem vômito ou diarreia nos últimos dias. ${visit.reason}.`,
    detect: ['Sem queixas'],
  }
}

/* ───────── Exame físico: achados por região ───────── */

export type Region = 'Cabeça' | 'Pescoço' | 'Tórax' | 'Abdome' | 'Dorso' | 'Membro torácico' | 'Membro pélvico' | 'Quadril' | 'Cauda'

export const FINDINGS: Record<Region, string[]> = {
  Cabeça: ['Otite', 'Secreção ocular', 'Tártaro', 'Gengivite', 'Lesão de pele'],
  Pescoço: ['Linfonodo aumentado', 'Dor à palpação', 'Nódulo', 'Tosse à palpação de traqueia'],
  Tórax: ['Sopro sistólico', 'Crepitação pulmonar', 'Arritmia', 'Abafamento de bulhas'],
  Abdome: ['Dor à palpação', 'Distensão', 'Organomegalia', 'Nódulo'],
  Dorso: ['Dor à palpação', 'Nódulo', 'Lesão de pele', 'Alopecia'],
  'Membro torácico': ['Claudicação', 'Dor articular', 'Edema', 'Lesão de pele'],
  'Membro pélvico': ['Claudicação', 'Dor articular', 'Luxação de patela', 'Edema'],
  Quadril: ['Dor à manipulação', 'Crepitação articular', 'Atrofia muscular'],
  Cauda: ['Lesão de pele', 'Glândulas adanais cheias', 'Dor'],
}

/* ───────── Vacinas: laboratório, preço ───────── */

export const VACCINE_LAB: Record<string, { lab: string; product: string; price: number }> = {
  v10: { lab: 'Zoetis', product: 'Vanguard Plus', price: 120 },
  raiva: { lab: 'Boehringer', product: 'Rabisin', price: 80 },
  gripe: { lab: 'Zoetis', product: 'Bronchi-Shield', price: 95 },
  giardia: { lab: 'Zoetis', product: 'GiardiaVax', price: 110 },
  v5: { lab: 'Boehringer', product: 'Purevax', price: 150 },
  v4: { lab: 'Zoetis', product: 'Felocell', price: 115 },
}

/** "Lote lido da etiqueta" determinístico por vacina+pet */
export function lotFor(vaccineId: string, petId: string) {
  const seed = (vaccineId + petId).split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0
  const s = seed.toString(36).toUpperCase().padStart(6, '0')
  const prefix = VACCINE_LAB[vaccineId].product.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase()
  return `${prefix}${s.slice(0, 2)}${(seed % 90) + 10}-${s.slice(2, 4)}`
}
export function expiryFor(vaccineId: string) {
  const d = day(240 + VACCINE[vaccineId].name.length * 9)
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/* ───────── Prescrição ───────── */

export interface MedDef {
  id: string
  name: string
  conc: string
  form: string
  species: Species[]
  group: string
  doses: string[]
  freqs: string[]
  durs: string[]
  hint?: string
}

export const MEDS: MedDef[] = [
  { id: 'pimo125', name: 'Pimobendan', conc: '1,25 mg', form: 'comprimido', species: ['cão'], group: 'Cardiologia', doses: ['½ comprimido', '1 comprimido', '1 ½ comprimido'], freqs: ['A cada 12h', 'A cada 8h'], durs: ['Uso contínuo', '30 dias', '60 dias'], hint: 'Dar 1 hora antes da refeição' },
  { id: 'furo', name: 'Furosemida', conc: '10 mg', form: 'comprimido', species: ['cão', 'gato'], group: 'Cardiologia', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 24h', 'A cada 12h', 'A cada 8h'], durs: ['5 dias', '7 dias', '14 dias', 'Uso contínuo'], hint: 'Deixar água fresca sempre disponível' },
  { id: 'enal', name: 'Enalapril', conc: '2,5 mg', form: 'comprimido', species: ['cão', 'gato'], group: 'Cardiologia', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 24h', 'A cada 12h'], durs: ['30 dias', 'Uso contínuo'] },
  { id: 'omep', name: 'Omeprazol', conc: '10 mg', form: 'cápsula', species: ['cão', 'gato'], group: 'Gastro', doses: ['½ cápsula', '1 cápsula'], freqs: ['A cada 24h', 'A cada 12h'], durs: ['7 dias', '10 dias', '14 dias'], hint: 'Em jejum, 30 min antes da primeira refeição' },
  { id: 'melox', name: 'Meloxicam', conc: '0,5 mg/mL', form: 'suspensão oral', species: ['cão', 'gato'], group: 'Anti-inflamatório', doses: ['0,1 mg/kg', '0,05 mg/kg'], freqs: ['A cada 24h'], durs: ['3 dias', '5 dias', '7 dias'], hint: 'Sempre após a refeição' },
  { id: 'maro', name: 'Maropitant (Cerenia)', conc: '16 mg', form: 'comprimido', species: ['cão', 'gato'], group: 'Gastro', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 24h'], durs: ['3 dias', '5 dias'] },
  { id: 'amox', name: 'Amoxicilina + clavulanato', conc: '250 mg', form: 'comprimido', species: ['cão', 'gato'], group: 'Antibiótico', doses: ['¼ comprimido', '½ comprimido', '1 comprimido'], freqs: ['A cada 12h'], durs: ['7 dias', '10 dias', '14 dias'] },
  { id: 'pred', name: 'Prednisolona', conc: '5 mg', form: 'comprimido', species: ['cão', 'gato'], group: 'Anti-inflamatório', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 24h', 'A cada 12h'], durs: ['5 dias', '7 dias', 'Desmame em 14 dias'] },
  { id: 'apoq', name: 'Oclacitinib (Apoquel)', conc: '5,4 mg', form: 'comprimido', species: ['cão'], group: 'Dermatologia', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 12h', 'A cada 24h'], durs: ['14 dias', '30 dias'] },
  { id: 'dipi', name: 'Dipirona', conc: '500 mg/mL', form: 'gotas', species: ['cão', 'gato'], group: 'Analgésico', doses: ['1 gota/kg', '½ gota/kg'], freqs: ['A cada 8h', 'A cada 12h'], durs: ['3 dias', '5 dias'] },
  { id: 'mirt', name: 'Mirtazapina', conc: '1,88 mg', form: 'comprimido', species: ['gato'], group: 'Estimulante de apetite', doses: ['½ comprimido', '1 comprimido'], freqs: ['A cada 48h', 'A cada 24h'], durs: ['7 dias', '14 dias'] },
  { id: 'otom', name: 'Otológico (Otomax)', conc: 'tópico', form: 'pomada', species: ['cão', 'gato'], group: 'Dermatologia', doses: ['4 gotas', '8 gotas'], freqs: ['A cada 12h', 'A cada 24h'], durs: ['7 dias', '14 dias'] },
]
export const MED = Object.fromEntries(MEDS.map((m) => [m.id, m])) as Record<string, MedDef>

export interface MedEntry {
  uid: string
  medId: string
  dose: string
  freq: string
  dur: string
  /** já estava em uso: manter */
  keep?: boolean
}

/** Medicações já em uso (vêm da ficha) */
export function medsInUse(petId: string): MedEntry[] {
  if (petId === 'bob') return [{ uid: 'inuse-pimo', medId: 'pimo125', dose: '1 comprimido', freq: 'A cada 12h', dur: 'Uso contínuo', keep: true }]
  return []
}

export function durationDays(dur: string) {
  const m = dur.match(/(\d+)\s*dias/)
  return m ? Number(m[1]) : null
}

/* ───────── Relógio simulado: começa às 10:40 de hoje e anda com o tempo real ───────── */

const LOADED_AT = Date.now()
export const simNow = () => new Date(+NOW + (Date.now() - LOADED_AT))

/** Nome da vacina sem o parêntese explicativo: "Gripe canina (tosse dos canis)" → "Gripe canina" */
export const vName = (vaccineId: string) => VACCINE[vaccineId].name.replace(/\s*\(.*\)\s*/, '')

/** "04 de dez" ou, se for em outro ano, "04 de nov de 2027" */
export function dateShort(d: Date | string) {
  const x = new Date(d)
  const base = fmt.short(x)
  return x.getFullYear() !== day(0).getFullYear() ? `${base} de ${x.getFullYear()}` : base
}

/** "quarta-feira, 4 de novembro" → "Quarta-feira, 4 de novembro" */
export const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
