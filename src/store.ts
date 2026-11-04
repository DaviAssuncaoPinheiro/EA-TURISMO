import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { REMINDERS, VISITS, type ClinicalEvent, type Reminder, type ReminderStatus, type VaccineDose, type VisitStatus } from './data/mock'

export interface PetPhoto {
  id: string
  petId: string
  visitId?: string
  date: string
  /** data URL (comprimida) ou URL remota */
  src: string
  label: string
  /** região do corpo ou assunto: agrupa antes e depois */
  subject: string
}

/** Detalhes de um atendimento finalizado, usados no relatório do tutor */
export interface VisitReport {
  visitId: string
  petId: string
  vetId: string
  finishedAt: string
  summary: string
  weightKg?: number
  vitals?: { label: string; value: string }[]
  vaccines?: { name: string; lot?: string; next?: string }[]
  prescription?: { name: string; dose: string }[]
  nextDates?: { label: string; date: string }[]
  photoIds?: string[]
  total?: number
}

interface DemoState {
  visitStatus: Record<string, VisitStatus>
  routeOptimized: boolean
  reminders: Reminder[]
  extraEvents: ClinicalEvent[]
  extraDoses: VaccineDose[]
  /** pesos registrados em campo: petId -> kg */
  extraWeights: Record<string, number>
  offline: boolean
  photos: PetPhoto[]
  reports: Record<string, VisitReport>
  kitChecked: Record<string, boolean>
  addPhoto: (p: PetPhoto) => void
  removePhoto: (id: string) => void
  saveReport: (r: VisitReport) => void
  toggleKit: (id: string) => void
  setVisitStatus: (id: string, s: VisitStatus) => void
  setRouteOptimized: (v: boolean) => void
  setReminderStatus: (id: string, s: ReminderStatus) => void
  addReminders: (r: Reminder[]) => void
  addEvent: (e: ClinicalEvent) => void
  addDoses: (d: VaccineDose[]) => void
  setWeight: (petId: string, kg: number) => void
  setOffline: (v: boolean) => void
  reset: () => void
}

const initial = () => ({
  visitStatus: Object.fromEntries(VISITS.map((v) => [v.id, v.status])) as Record<string, VisitStatus>,
  routeOptimized: false,
  reminders: REMINDERS,
  extraEvents: [] as ClinicalEvent[],
  extraDoses: [] as VaccineDose[],
  extraWeights: {} as Record<string, number>,
  offline: false,
  photos: [] as PetPhoto[],
  reports: {} as Record<string, VisitReport>,
  kitChecked: {} as Record<string, boolean>,
})

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...initial(),
      setVisitStatus: (id, s) => set((st) => ({ visitStatus: { ...st.visitStatus, [id]: s } })),
      setRouteOptimized: (v) => set({ routeOptimized: v }),
      setReminderStatus: (id, s) => set((st) => ({ reminders: st.reminders.map((r) => (r.id === id ? { ...r, status: s } : r)) })),
      addReminders: (r) => set((st) => ({ reminders: [...r, ...st.reminders] })),
      addEvent: (e) => set((st) => ({ extraEvents: [e, ...st.extraEvents] })),
      addDoses: (d) => set((st) => ({ extraDoses: [...st.extraDoses, ...d] })),
      setWeight: (petId, kg) => set((st) => ({ extraWeights: { ...st.extraWeights, [petId]: kg } })),
      setOffline: (v) => set({ offline: v }),
      addPhoto: (p) => set((st) => ({ photos: [p, ...st.photos] })),
      removePhoto: (id) => set((st) => ({ photos: st.photos.filter((x) => x.id !== id) })),
      saveReport: (r) => set((st) => ({ reports: { ...st.reports, [r.visitId]: r } })),
      toggleKit: (id) => set((st) => ({ kitChecked: { ...st.kitChecked, [id]: !st.kitChecked[id] } })),
      reset: () => set(initial()),
    }),
    { name: 'vet-domicilio-demo-v2' },
  ),
)
