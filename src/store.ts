import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { REMINDERS, VISITS, type ClinicalEvent, type Reminder, type ReminderStatus, type VaccineDose, type VisitStatus } from './data/mock'

interface DemoState {
  visitStatus: Record<string, VisitStatus>
  routeOptimized: boolean
  reminders: Reminder[]
  extraEvents: ClinicalEvent[]
  extraDoses: VaccineDose[]
  /** pesos registrados em campo: petId -> kg */
  extraWeights: Record<string, number>
  offline: boolean
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
      reset: () => set(initial()),
    }),
    { name: 'vet-domicilio-demo-v1' },
  ),
)
