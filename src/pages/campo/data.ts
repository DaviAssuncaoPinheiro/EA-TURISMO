// Dados e cálculos próprios do app de campo (celular do veterinário).
import { BAIRRO, ZONE } from '@/data/geo'
import { EVENTS, NOW, PET, TUTOR, VACCINE, VISITS, type Pet, type Species, type Visit } from '@/data/mock'
import { day, fmt, iso } from '@/data/time'
import type { PetPhoto } from '@/store'

/* Visitas do dia por veterinário */

export const isToday = (d: string) => new Date(d).toDateString() === day(0).toDateString()

export function vetVisitsToday(vetId: string) {
  return VISITS.filter((v) => v.vetId === vetId && isToday(v.start)).sort((a, b) => +new Date(a.start) - +new Date(b.start))
}

export const visitById = (id: string) => VISITS.find((v) => v.id === id)
export const petOf = (v: Visit) => PET[v.petIds[0]]
export const tutorOf = (v: Visit) => TUTOR[v.tutorId]
export const bairroOf = (v: Visit) => BAIRRO[TUTOR[v.tutorId].bairro]
export const zoneOf = (v: Visit) => ZONE[bairroOf(v).zone]

export const minutesSince = (iso: string, now?: Date) => Math.max(0, Math.round((+(now ?? simNow()) - +new Date(iso)) / 60000))

/* Pet */

export function sexLabel(p: Pet) {
  if (p.sex === 'M') return p.neutered ? 'Macho castrado' : 'Macho'
  return p.neutered ? 'Fêmea castrada' : 'Fêmea'
}

export function lastConsult(petId: string) {
  return EVENTS.filter((e) => e.petId === petId && (e.kind === 'consulta' || e.kind === 'vacina' || e.kind === 'procedimento')).sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]
}

/* Referências clínicas */

export const REF: Record<Species, { temp: [number, number]; fc: [number, number]; fr: [number, number]; defaults: { temp: number; fc: number; fr: number } }> = {
  cão: { temp: [37.5, 39.2], fc: [60, 140], fr: [10, 30], defaults: { temp: 38.5, fc: 112, fr: 24 } },
  gato: { temp: [37.8, 39.2], fc: [140, 220], fr: [20, 30], defaults: { temp: 38.6, fc: 180, fr: 26 } },
}

export const MUCOSAS = ['Normocoradas', 'Hipocoradas', 'Hipercoradas', 'Ictéricas', 'Cianóticas']
export const HIDRATACAO = ['Normal', 'Leve (5%)', 'Moderada (7%)', 'Grave (>10%)']
export const TPC = ['< 2 s', '2 a 3 s', '> 3 s']

export const BCS_LABEL = (s: number) => (s <= 3 ? 'Abaixo do ideal' : s <= 5 ? 'Ideal' : s <= 7 ? 'Sobrepeso' : 'Obesidade')

/* Anamnese */

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

/* Exame físico: achados por região */

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

/* Vacinas: laboratório, preço */

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

/* Prescrição */

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

/* Relógio simulado: começa às 10:40 de hoje e anda com o tempo real */

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

/* Acesso à casa (mock por tutor): o que o veterinário precisa saber antes de tocar a campainha */

export interface HomeAccess {
  gate?: string
  intercom?: string
  landmark: string
  parking?: string
  notes: string[]
}

export const ACCESS: Record<string, HomeAccess> = {
  t1: { intercom: 'Ap. 1203 no interfone', gate: 'Portaria 24h, deixar documento', landmark: 'Torre B, em frente ao Parque dos Bilhares', parking: 'Vaga de visitante no subsolo', notes: ['Elevador de serviço para pets'] },
  t2: { gate: 'Campainha no muro azul', landmark: 'Casa ao lado da farmácia Santo Remédio', parking: 'Na rua, em frente', notes: ['Seu Joaquim demora a abrir', 'Ligar para a filha Renata se não atender'] },
  t3: { gate: 'Código do portão 4521#', intercom: 'Casa 41 no interfone', landmark: 'Segunda rua à direita depois da guarita', parking: 'Na frente da garagem', notes: ['Filhote foge pela porta, entrar rápido'] },
  t4: { gate: 'Portão eletrônico, tocar e aguardar', landmark: 'Casa amarela com mangueira na calçada', parking: 'Na rua, lado da sombra', notes: ['Cachorro fica solto no quintal', 'Bob se agita com a campainha, avisar por mensagem'] },
  t5: { gate: 'Portão verde, sem campainha', landmark: 'Esquina com a Rua Rio Branco', parking: 'Rua lateral', notes: ['Mandar mensagem ao chegar', 'Dois gatos soltos em casa'] },
  t6: { intercom: 'Casa 2 no interfone', landmark: 'Vila de casas atrás da padaria Ramos', parking: 'Estacionar na praça', notes: ['Pipoca não usa coleira, só peitoral'] },
  t7: { gate: 'Código do portão 0098', landmark: 'Prédio baixo de tijolinho', parking: 'Vaga 3, liberada', notes: ['Simba se esconde embaixo da cama'] },
  t8: { gate: 'Portaria do condomínio, casa 7', intercom: 'Juliana libera pelo app', landmark: 'Entrada pela Av. do Turismo, segunda guarita', parking: 'Na garagem da casa', notes: ['Dois cães soltos no quintal'] },
  t9: { gate: 'Portão de madeira, cadeado aberto', landmark: 'Km 4, placa Sítio Recanto', parking: 'Dentro do sítio', notes: ['Zeus fica preso no canil até o tutor chegar', 'Estrada de terra, ir devagar'] },
  t10: { gate: 'Campainha à esquerda do portão', landmark: 'Casa com muro grafitado', parking: 'Na rua', notes: ['Kiara pula nas visitas, é dócil'] },
  t11: { intercom: 'Bloco C, ap. 202', landmark: 'Conjunto em frente à escola estadual', parking: 'Vaga de visitante', notes: [] },
  t12: { gate: 'Bater palma, campainha quebrada', landmark: 'Casa azul perto da UFAM', parking: 'Na rua', notes: ['Tom está fechado no quarto'] },
  t13: { gate: 'Portão de grade, sempre aberto', landmark: 'Ao lado da igreja Nova Esperança', parking: 'Na rua', notes: ['Frida não sobe escada, atender no térreo'] },
  t14: { gate: 'Código do portão 7310#', landmark: 'Depois do posto Autaz, primeira à direita', parking: 'Garagem coberta', notes: ['Seu Antônio prefere que toque a campainha duas vezes'] },
  t15: { gate: 'Portão branco, casa 3', landmark: 'Quadra 40, perto do campinho', parking: 'Na rua', notes: ['Belinha foge, fechar o portão ao entrar'] },
  t16: { intercom: 'Ap. 101 no interfone', landmark: 'Prédio ao lado do supermercado DB', parking: 'Estacionamento do mercado', notes: [] },
  t17: { gate: 'Código do portão 2604', landmark: 'Rua sem saída, última casa', parking: 'Na frente', notes: ['Luna fica no quarto dos fundos'] },
  t18: { intercom: 'Ap. 504, torre única', landmark: 'Em frente ao Hospital Dom Pedro', parking: 'Vaga rotativa na rua', notes: ['Bidu late muito, é manso'] },
}

export const accessOf = (tutorId: string): HomeAccess => ACCESS[tutorId] ?? { landmark: 'Sem referência cadastrada', notes: [] }

/* O que fazer nesta visita (checklist do cartão de chegada) */

export function visitTodo(visit: Visit, pet: Pet, lateVaccines: string[]): string[] {
  const r = visit.reason.toLowerCase()
  const out: string[] = []
  const cardio = pet.conditions?.some((c) => /mitral|card/i.test(c))
  if (visit.type === 'Vacinação') {
    if (/v10/.test(r)) out.push('Aplicar V10')
    if (/antirr|raiva/.test(r)) out.push('Aplicar antirrábica')
    if (/gi[aá]rdia/.test(r)) out.push('Aplicar giárdia')
    if (/gripe/.test(r)) out.push('Aplicar gripe canina')
    if (/v4/.test(r)) out.push('Aplicar V4')
    out.push('Conferir lote e validade')
  }
  if (cardio) out.push('Auscultar e comparar o sopro', 'Revisar dose do pimobendan', 'Perguntar sobre tosse e cansaço')
  else if (visit.type === 'Retorno') out.push('Comparar com a última visita')
  if (visit.type === 'Fluidoterapia') out.push('Fluido subcutâneo', 'Aferir pressão arterial')
  if (visit.type === 'Curativo') out.push('Avaliar a ferida cirúrgica', 'Retirar os pontos', 'Foto da ferida')
  if (visit.type === 'Coleta de exames') out.push('Coletar hemograma e bioquímico', 'Amostras na caixa térmica')
  if (visit.type === 'Consulta' || visit.type === 'Check-up') out.push('Exame físico completo')
  if (/vermífugo|vermifugo/.test(r)) out.push('Dar vermífugo')
  if (/orelha|les[aã]o|coceira|pele/.test(r)) out.push('Foto da região afetada')
  for (const v of lateVaccines) if (!out.some((x) => x.toLowerCase().includes(v.toLowerCase()))) out.push(`Oferecer ${v.toLowerCase()}, atrasada`)
  out.unshift('Pesar e aferir sinais vitais')
  return [...new Set(out)].slice(0, 6)
}

/* Fotos: assuntos e fotos anteriores (mock) para comparar antes e depois */

export const PHOTO_SUBJECTS = ['Orelha esquerda', 'Orelha direita', 'Pele / dorso', 'Ferida cirúrgica', 'Olhos', 'Boca', 'Patas']

const zoomed = (petId: string, fx: number, fy: number, z: number) => `${PET[petId].photo.replace('w=480&h=480', 'w=720&h=720')}&crop=focalpoint&fp-x=${fx}&fp-y=${fy}&fp-z=${z}`

/** Fotos de visitas anteriores (fazem parte da ficha) */
export const PRIOR_PHOTOS: PetPhoto[] = [
  { id: 'ph-seed-bob-1', petId: 'bob', date: iso(-23, '10:20'), src: zoomed('bob', 0.38, 0.32, 2.2), label: 'Antes da limpeza', subject: 'Orelha esquerda' },
  { id: 'ph-seed-thor-1', petId: 'thor', date: iso(-60, '18:10'), src: zoomed('thor', 0.32, 0.3, 2.4), label: 'Otite, secreção', subject: 'Orelha esquerda' },
  { id: 'ph-seed-fred-1', petId: 'fred', date: iso(-17, '15:00'), src: zoomed('fred', 0.5, 0.82, 2.2), label: 'Vermelhidão entre os dedos', subject: 'Patas' },
  { id: 'ph-seed-mia-1', petId: 'mia', date: iso(-10, '13:40'), src: zoomed('mia', 0.5, 0.7, 2), label: 'Pós-cirúrgico', subject: 'Ferida cirúrgica' },
]

/** Assunto inicial da foto: o que já tem foto anterior, senão o que o motivo sugere */
export function defaultSubject(visit: Visit, pet: Pet, photos: PetPhoto[]) {
  const prior = photos.find((p) => p.petId === pet.id && p.visitId !== visit.id)
  if (prior) return prior.subject
  const r = visit.reason.toLowerCase()
  if (/orelha|otite/.test(r)) return 'Orelha esquerda'
  if (/pontos|castra|curativo/.test(r)) return 'Ferida cirúrgica'
  if (/olho|col[ií]rio|catarata|schirmer/.test(r)) return 'Olhos'
  if (/pata|coceira/.test(r)) return 'Patas'
  return 'Pele / dorso'
}

/** Fotos do pet: do aparelho (store) e da ficha (anteriores), mais recentes primeiro */
export function petPhotos(petId: string, stored: PetPhoto[]) {
  return [...stored, ...PRIOR_PHOTOS].filter((p) => p.petId === petId).sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

/** "12/10" */
export const ddmm = (d: Date | string) => fmt.date(d).slice(0, 5)
