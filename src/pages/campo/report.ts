// Relatório do tutor: texto em linguagem simples e relatórios de exemplo para as visitas já concluídas.
import { dosesOf, PET, TUTOR, VISITS, weightHistory, type Pet, type Visit } from '@/data/mock'
import { iso } from '@/data/time'
import { kg } from '@/lib/utils'
import type { PetPhoto, VisitReport } from '@/store'
import type { Draft } from './campoStore'
import { MED, PRIOR_PHOTOS, REF, vName } from './data'

const art = (p: Pet) => (p.sex === 'F' ? 'a' : 'o')

/** Resumo para leigo, montado a partir do registro do veterinário */
export function tutorSummary(pet: Pet, d: Draft, vaccineNames: string[], firstNext?: { label: string; date: string }) {
  const a = art(pet)
  const A = a.toUpperCase()
  const out: string[] = []
  const sym = d.symptoms.filter((s) => s !== 'Sem queixas').map((s) => s.toLowerCase())
  if (sym.length) out.push(`Conversamos sobre ${sym.join(', ')}. ${A} ${pet.name} foi examinad${a} da cabeça à cauda.`)
  else out.push(`${A} ${pet.name} está bem e foi examinad${a} da cabeça à cauda.`)
  if (pet.conditions?.some((c) => /mitral|card/i.test(c))) out.push('O coração segue em acompanhamento e o remédio está fazendo efeito.')
  const delta = +(d.weight - d.prevWeight).toFixed(1)
  if (delta === 0) out.push(`O peso está estável, ${kg(d.weight)}.`)
  else if (delta < 0) out.push(`Perdeu ${kg(Math.abs(delta))} e agora pesa ${kg(d.weight)}.${d.prevWeight > pet.idealKg[1] ? ' Ótimo sinal.' : ''}`)
  else out.push(`Ganhou ${kg(delta)} e agora pesa ${kg(d.weight)}.`)
  const r = REF[pet.species]
  const vitalsOk = d.temp >= r.temp[0] && d.temp <= r.temp[1] && d.fr >= r.fr[0] && d.fr <= r.fr[1]
  out.push(vitalsOk ? 'Temperatura e respiração normais.' : 'Alguns sinais ficaram fora do normal e vamos acompanhar de perto.')
  if (d.findings.length) out.push(`Anotamos ${d.findings.length === 1 ? 'um ponto' : `${d.findings.length} pontos`} para acompanhar.`)
  if (vaccineNames.length) out.push(`Tomou ${vaccineNames.join(' e ')}.`)
  if (d.meds.length) out.push('A receita está abaixo, com os horários.')
  if (firstNext) out.push(`Próxima data: ${firstNext.label.toLowerCase()}.`)
  return out.join(' ')
}

export function vitalsOf(pet: Pet, d: Draft) {
  return [
    { label: 'Temperatura', value: `${d.temp.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} °C` },
    { label: 'Batimentos', value: `${d.fc} bpm` },
    { label: 'Respiração', value: `${d.fr} mpm` },
    { label: 'Mucosas', value: d.mucosa },
    { label: 'Hidratação', value: d.hidratacao },
    { label: 'Escore corporal', value: `${d.bcs} de 9` },
  ].filter((x) => x.value) as { label: string; value: string }[]
}

/** Horários sugeridos a partir da frequência: "a cada 12h" → 8h e 20h */
export function timesFor(text: string) {
  const m = text.match(/a cada (\d+)\s*h/i)
  const n = m ? Number(m[1]) : 0
  if (n === 8) return ['6h', '14h', '22h']
  if (n === 12) return ['8h', '20h']
  if (n === 24) return ['8h']
  if (n === 48) return ['8h, dia sim, dia não']
  return []
}

/** Dica de como dar o remédio (da tabela de medicamentos) */
export function medHint(name: string) {
  return Object.values(MED).find((m) => name.startsWith(m.name))?.hint
}

/* Relatórios de exemplo (visitas concluídas antes do protótipo abrir) */

const zoomed = (petId: string, fx: number, fy: number, z: number) => `${PET[petId].photo.replace('w=480&h=480', 'w=720&h=720')}&crop=focalpoint&fp-x=${fx}&fp-y=${fy}&fp-z=${z}`

/** Fotos dos relatórios de exemplo (tiradas hoje) */
export const SAMPLE_PHOTOS: PetPhoto[] = [
  { id: 'ph-sample-thor', petId: 'thor', visitId: 'v1', date: iso(0, '08:20'), src: zoomed('thor', 0.36, 0.34, 2.1), label: 'Sem secreção', subject: 'Orelha esquerda' },
  { id: 'ph-sample-fred', petId: 'fred', visitId: 'v9', date: iso(0, '08:55'), src: zoomed('fred', 0.48, 0.8, 2), label: 'Menos vermelho', subject: 'Patas' },
  { id: 'ph-sample-frida', petId: 'frida', visitId: 'v15', date: iso(0, '09:50'), src: zoomed('frida', 0.5, 0.45, 1.6), label: 'Postura da coluna', subject: 'Pele / dorso' },
]

const todayDose = (petId: string) => dosesOf(petId).filter((d) => new Date(d.date).toDateString() === new Date(iso(0)).toDateString())

const SAMPLES: Record<string, Omit<VisitReport, 'visitId' | 'petId' | 'vetId' | 'finishedAt' | 'total'>> = {
  v1: {
    summary: 'O Thor está saudável e com as vacinas em dia. Aplicamos o reforço anual da V10 e da antirrábica, e ele aceitou bem, sem reação. A orelha esquerda está limpa, sem sinal da otite. Pode dar banho normalmente daqui a 2 dias.',
    weightKg: 34.2,
    vitals: [
      { label: 'Temperatura', value: '38,4 °C' },
      { label: 'Batimentos', value: '96 bpm' },
      { label: 'Respiração', value: '22 mpm' },
      { label: 'Escore corporal', value: '6 de 9' },
    ],
    vaccines: todayDose('thor').map((d) => ({ name: vName(d.vaccineId), lot: d.lot, next: d.nextDate })),
    nextDates: [
      { label: 'Reavaliar a otite', date: iso(2) },
      { label: 'Gripe canina', date: iso(25) },
      { label: 'Reforço V10 e antirrábica', date: iso(365) },
    ],
    photoIds: ['ph-sample-thor'],
  },
  v2: {
    summary: 'A Nina recebeu o soro embaixo da pele e ficou tranquila no colo. A pressão está um pouco alta, igual à última medida, e os rins seguem estáveis. Continue com a ração renal e deixe água fresca sempre por perto.',
    weightKg: 3.6,
    vitals: [
      { label: 'Temperatura', value: '38,3 °C' },
      { label: 'Pressão', value: '150 mmHg' },
      { label: 'Batimentos', value: '176 bpm' },
      { label: 'Hidratação', value: 'Normal' },
    ],
    prescription: [{ name: 'Mirtazapina 1,88 mg', dose: '½ comprimido, a cada 48h, 14 dias' }],
    nextDates: [
      { label: 'Soro em casa', date: iso(1) },
      { label: 'V4 e antirrábica', date: iso(15) },
      { label: 'Exame dos rins', date: iso(45) },
    ],
  },
  v9: {
    summary: 'O Fred está com alergia de pele nas patas. Passamos um remédio para a coceira por 14 dias e vamos rever em 3 dias. A Amora está ótima no check-up, sem nada a corrigir.',
    weightKg: 12.4,
    vitals: [
      { label: 'Temperatura', value: '38,7 °C' },
      { label: 'Batimentos', value: '104 bpm' },
      { label: 'Respiração', value: '26 mpm' },
    ],
    prescription: [{ name: 'Oclacitinib (Apoquel) 5,4 mg', dose: '1 comprimido, a cada 12h, 14 dias' }],
    nextDates: [
      { label: 'Retorno da dermatite', date: iso(3) },
      { label: 'V10 e antirrábica do Fred', date: iso(10) },
    ],
    photoIds: ['ph-sample-fred'],
  },
  v14: {
    summary: 'O Café fez o check-up de idoso e está bem para a idade. O coração e a barriga estão normais. A catarata segue no início, sem atrapalhar a visão. Vamos fazer a consulta dos olhos nesta semana.',
    weightKg: 6.4,
    vitals: [
      { label: 'Temperatura', value: '38,2 °C' },
      { label: 'Batimentos', value: '92 bpm' },
      { label: 'Respiração', value: '20 mpm' },
      { label: 'Escore corporal', value: '5 de 9' },
    ],
    prescription: [{ name: 'Colírio lubrificante', dose: '1 gota em cada olho, a cada 8h, uso contínuo' }],
    nextDates: [
      { label: 'Consulta dos olhos', date: iso(2) },
      { label: 'Check-up semestral', date: iso(180) },
    ],
  },
  v15: {
    summary: 'A Frida está andando melhor e sem dor ao toque na coluna. Fizemos os exercícios da fisioterapia e mostramos como repetir em casa. Evite escadas e sofá alto por mais um mês.',
    weightKg: 8.9,
    vitals: [
      { label: 'Temperatura', value: '38,5 °C' },
      { label: 'Batimentos', value: '100 bpm' },
      { label: 'Dor na coluna', value: 'Nenhuma' },
    ],
    prescription: [{ name: 'Meloxicam 0,5 mg/mL', dose: '0,1 mg/kg, a cada 24h, 5 dias' }],
    nextDates: [
      { label: 'Fisioterapia', date: iso(7) },
      { label: 'V10 e antirrábica', date: iso(17) },
    ],
    photoIds: ['ph-sample-frida'],
  },
}

function sampleReport(visit: Visit): VisitReport {
  const pet = PET[visit.petIds[0]]
  const s = SAMPLES[visit.id]
  const end = new Date(+new Date(visit.start) + visit.durationMin * 60000).toISOString()
  if (s) return { ...s, visitId: visit.id, petId: pet.id, vetId: visit.vetId, finishedAt: end, total: visit.price }
  return {
    visitId: visit.id,
    petId: pet.id,
    vetId: visit.vetId,
    finishedAt: end,
    summary: `${art(pet).toUpperCase()} ${pet.name} foi examinad${art(pet)} em casa. ${visit.reason}. Está tudo registrado na ficha e avisamos pelo WhatsApp se precisar de retorno.`,
    weightKg: pet.weightKg,
    vitals: [
      { label: 'Temperatura', value: `${REF[pet.species].defaults.temp.toLocaleString('pt-BR')} °C` },
      { label: 'Batimentos', value: `${REF[pet.species].defaults.fc} bpm` },
    ],
    nextDates: [{ label: 'Check-up anual', date: iso(365) }],
    total: visit.price,
  }
}

/** Relatório da visita: o salvo no atendimento ou, para visitas já concluídas, um de exemplo */
export function resolveReport(visitId: string, reports: Record<string, VisitReport>, status: Record<string, string>) {
  if (reports[visitId]) return reports[visitId]
  const visit = VISITS.find((v) => v.id === visitId)
  if (!visit || (status[visitId] ?? visit.status) !== 'concluida') return null
  return sampleReport(visit)
}

/** Fotos do relatório e, para cada assunto, a foto anterior do mesmo pet (antes e depois) */
export function reportPhotos(r: VisitReport, stored: PetPhoto[]) {
  const all = [...stored, ...SAMPLE_PHOTOS, ...PRIOR_PHOTOS]
  const ids = new Set(r.photoIds ?? [])
  const mine = all.filter((p) => ids.has(p.id)).sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const pairs: { subject: string; before: PetPhoto; after: PetPhoto }[] = []
  const used = new Set<string>()
  for (const p of mine) {
    if (pairs.some((x) => x.subject === p.subject)) continue
    const before = all
      .filter((x) => x.petId === r.petId && x.subject === p.subject && !ids.has(x.id) && +new Date(x.date) < +new Date(p.date))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]
    const after = [...mine].reverse().find((x) => x.subject === p.subject)!
    if (before) {
      pairs.push({ subject: p.subject, before, after })
      used.add(after.id)
    }
  }
  return { photos: mine, pairs, rest: mine.filter((p) => !used.has(p.id)) }
}

/** Peso anterior (mês passado) para mostrar a variação */
export function previousWeight(petId: string) {
  const h = weightHistory(PET[petId])
  return h.length > 1 ? h[h.length - 2] : undefined
}

export const tutorPhoneDigits = (tutorId: string) => '55' + TUTOR[tutorId].phone.replace(/\D/g, '')

export const reportLink = (visitId: string) => `${window.location.origin}${window.location.pathname}#/relatorio/${visitId}`
