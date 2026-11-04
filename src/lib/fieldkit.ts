import { PET, TUTOR, VACCINE, VET, vaccineStatus, type Visit } from '@/data/mock'
import { BAIRRO } from '@/data/geo'
import { daysFromToday } from '@/data/time'

/** Link para abrir o endereço da visita no Waze ou no Google Maps (sem calcular nada no sistema). */
export function navLinks(v: Visit) {
  const t = TUTOR[v.tutorId]
  const q = encodeURIComponent(`${t.address}, ${BAIRRO[t.bairro].name}, Manaus, AM`)
  return {
    waze: `https://waze.com/ul?q=${q}&navigate=yes`,
    maps: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
  }
}

/** Kit do dia: o que levar no carro a partir das visitas. */
export interface KitItem {
  id: string
  group: 'Vacinas' | 'Coleta' | 'Procedimentos' | 'Medicamentos'
  label: string
  qty: number
  unit?: string
  forPets: string[]
}

export function buildKit(visits: Visit[]): KitItem[] {
  const map = new Map<string, KitItem>()
  const add = (id: string, group: KitItem['group'], label: string, qty: number, pet: string, unit?: string) => {
    const cur = map.get(id)
    if (cur) {
      cur.qty += qty
      if (!cur.forPets.includes(pet)) cur.forPets.push(pet)
    } else map.set(id, { id, group, label, qty, unit, forPets: [pet] })
  }
  for (const v of visits) {
    const reason = v.reason.toLowerCase()
    for (const pid of v.petIds) {
      const p = PET[pid]
      // vacinas pelo motivo e pelas atrasadas
      const due = vaccineStatus(pid).filter((d) => daysFromToday(d.nextDate) <= 0)
      const wanted = new Set(due.map((d) => d.vaccineId))
      if (/v10/.test(reason)) wanted.add('v10')
      if (/antirr|raiva/.test(reason)) wanted.add('raiva')
      if (/gripe/.test(reason)) wanted.add('gripe')
      if (/gi[aá]rdia/.test(reason)) wanted.add('giardia')
      if (/v4/.test(reason)) wanted.add('v4')
      if (/v5/.test(reason)) wanted.add('v5')
      if (v.type === 'Vacinação' || wanted.size) {
        for (const vid of wanted) if (VACCINE[vid]?.species.includes(p.species)) add(`vac-${vid}`, 'Vacinas', VACCINE[vid].name, 1, p.name, 'dose')
      }
      if (wanted.size) add('seringa-3', 'Vacinas', 'Seringa 3 ml + agulha', wanted.size, p.name, 'un')
      if (/vermífugo|vermifugo/.test(reason)) add('verm', 'Medicamentos', 'Vermífugo (comprimido)', 1, p.name, 'un')
      if (v.type === 'Coleta de exames') {
        add('tubo-edta', 'Coleta', 'Tubo EDTA (hemograma)', 1, p.name, 'un')
        add('tubo-seco', 'Coleta', 'Tubo seco (bioquímico)', 1, p.name, 'un')
        add('scalp', 'Coleta', 'Scalp 23G', 1, p.name, 'un')
        add('caixa-termica', 'Coleta', 'Caixa térmica com gelo', 1, p.name)
      }
      if (v.type === 'Fluidoterapia') {
        add('ringer', 'Procedimentos', 'Ringer lactato 250 ml', 1, p.name, 'frasco')
        add('equipo', 'Procedimentos', 'Equipo + scalp 21G', 1, p.name, 'kit')
      }
      if (v.type === 'Curativo') {
        add('curativo', 'Procedimentos', 'Kit curativo (gaze, clorexidina, esparadrapo)', 1, p.name, 'kit')
        add('tesoura', 'Procedimentos', 'Tesoura e pinça para retirada de pontos', 1, p.name)
      }
      if (v.type === 'Retorno' && p.alerts?.some((a) => /card/i.test(a))) add('doppler', 'Procedimentos', 'Doppler / esfigmo veterinário', 1, p.name)
      if (/coceira|dermat|orelha|les[aã]o/.test(reason)) add('otoscopio', 'Procedimentos', 'Otoscópio e lâminas para citologia', 1, p.name)
      if (p.temperament && /arisc|toalha|protetor|segurar/i.test(p.temperament)) add('contencao', 'Procedimentos', 'Toalha e focinheira de contenção', 1, p.name)
    }
  }
  return [...map.values()]
}

export const vetName = (id: string) => VET[id]?.short ?? ''
