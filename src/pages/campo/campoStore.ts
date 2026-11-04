// Estado local do app de campo (rascunho do atendimento, notificações do celular, fila offline).
// Não persiste: o que precisa refletir no restante do sistema vai para o store global (src/store.ts).
import { create } from 'zustand'
import type { Visit } from '@/data/mock'
import { useDemo } from '@/store'
import { REF, medsInUse, petOf, type MedEntry, type Region } from './data'

export interface Finding {
  id: string
  n: number
  x: number
  y: number
  region: Region
  tags: string[]
  note: string
}

export interface VaccinePlan {
  apply: boolean
  lot?: string
  lab?: string
  expiry?: string
}

export interface Draft {
  step: number
  complaint: string
  symptoms: string[]
  notes: string
  weight: number
  prevWeight: number
  temp: number
  fc: number
  fr: number
  mucosa: string
  hidratacao: string
  tpc: string
  bcs: number
  findings: Finding[]
  vaccines: Record<string, VaccinePlan>
  meds: MedEntry[]
  reminderEdits: Record<string, { on?: boolean; days?: number }>
}

export interface FinishedVisit {
  eventSummary: string
  weight: number
  prevWeight: number
  doses: { vaccineId: string; lot: string }[]
  reminders: { title: string; dueDate: string }[]
  meds: string[]
  lines: { label: string; value: number }[]
  durationMin: number
  savedOffline: boolean
}

export type NoticeKind = 'whatsapp' | 'app' | 'sync' | 'offline'
export interface Notice {
  id: number
  kind: NoticeKind
  title: string
  body: string
}

function makeDraft(visit: Visit): Draft {
  const pet = petOf(visit)
  const w = useDemo.getState().extraWeights[pet.id] ?? pet.weightKg
  const ref = REF[pet.species].defaults
  return {
    step: 0,
    complaint: visit.reason,
    symptoms: [],
    notes: '',
    weight: w,
    prevWeight: w,
    temp: ref.temp,
    fc: pet.id === 'bob' ? 128 : ref.fc,
    fr: pet.id === 'bob' ? 28 : ref.fr,
    mucosa: 'Normocoradas',
    hidratacao: 'Normal',
    tpc: '< 2 s',
    bcs: pet.bcs,
    findings: [],
    vaccines: {},
    meds: medsInUse(pet.id),
    reminderEdits: {},
  }
}

let noticeSeq = 0

interface CampoState {
  drafts: Record<string, Draft>
  arrived: Record<string, boolean>
  startedAt: Record<string, string>
  finished: Record<string, FinishedVisit>
  notices: Notice[]
  pending: number
  syncing: boolean
  ensureDraft: (v: Visit) => void
  patch: (visitId: string, p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void
  setArrived: (visitId: string) => void
  setStarted: (visitId: string, iso: string) => void
  setFinished: (visitId: string, f: FinishedVisit) => void
  notify: (n: Omit<Notice, 'id'>) => void
  dismiss: (id: number) => void
  setPending: (n: number | ((p: number) => number)) => void
  setSyncing: (v: boolean) => void
}

export const useCampo = create<CampoState>()((set) => ({
  drafts: {},
  arrived: {},
  startedAt: {},
  finished: {},
  notices: [],
  pending: 0,
  syncing: false,
  ensureDraft: (v) => set((s) => (s.drafts[v.id] ? s : { drafts: { ...s.drafts, [v.id]: makeDraft(v) } })),
  patch: (id, p) =>
    set((s) => {
      const cur = s.drafts[id]
      if (!cur) return s
      const next = typeof p === 'function' ? p(cur) : p
      return { drafts: { ...s.drafts, [id]: { ...cur, ...next } } }
    }),
  setArrived: (id) => set((s) => ({ arrived: { ...s.arrived, [id]: true } })),
  setStarted: (id, iso) => set((s) => ({ startedAt: { ...s.startedAt, [id]: iso } })),
  setFinished: (id, f) => set((s) => ({ finished: { ...s.finished, [id]: f } })),
  notify: (n) => set((s) => ({ notices: [...s.notices.slice(-2), { ...n, id: ++noticeSeq }] })),
  dismiss: (id) => set((s) => ({ notices: s.notices.filter((x) => x.id !== id) })),
  setPending: (n) => set((s) => ({ pending: typeof n === 'function' ? n(s.pending) : n })),
  setSyncing: (v) => set({ syncing: v }),
}))

export const notify = (n: Omit<Notice, 'id'>) => useCampo.getState().notify(n)

/** Registra uma ação; sem sinal, ela entra na fila de envio. */
export function queueIfOffline() {
  if (useDemo.getState().offline) {
    useCampo.getState().setPending((p) => p + 1)
    return true
  }
  return false
}
