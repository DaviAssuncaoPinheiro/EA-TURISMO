import { Link, useParams } from 'react-router-dom'
import { PawPrint, Search } from 'lucide-react'
import { Button, Card, IconCircle, PetAvatar } from '@/components/ui'
import { PET, PETS, TUTOR, petsOfTutor } from '@/data/mock'
import { usePatientModel } from '@/components/patient/model'
import { PatientHeader } from '@/components/patient/PatientHeader'
import { PreventiveIndex } from '@/components/patient/PreventiveIndex'
import { VaccineCard } from '@/components/patient/VaccineCard'
import { WeightChart } from '@/components/patient/WeightChart'
import { Timeline } from '@/components/patient/Timeline'
import { ConditionsPanel, RemindersPanel, SiblingsPanel, SideColumn, TutorCard } from '@/components/patient/SidePanels'

function NotFound({ id }: { id?: string }) {
  const suggestions = PETS.slice(0, 4)
  return (
    <div className="px-4 pt-6 pb-6 md:px-6 md:pt-10">
      <Card className="mx-auto max-w-lg px-6 py-10 text-center sm:px-10">
        <IconCircle size={56} className="mx-auto">
          <PawPrint className="size-6" strokeWidth={1.9} />
        </IconCircle>
        <h1 className="mt-4 text-[26px] leading-tight font-bold tracking-[-0.03em] text-ink">Paciente não encontrado</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] font-medium text-ink-3">
          Nenhum pet com o código <span className="rounded-full bg-muted px-2 py-0.5 text-ink">{id ?? 'vazio'}</span>.
        </p>
        <Link to="/pacientes" className="mt-6 inline-block">
          <Button variant="primary" size="md">
            <Search className="size-4" strokeWidth={2} /> Ver pacientes
          </Button>
        </Link>
        <div className="mt-8 border-t border-line pt-5">
          <div className="mb-3 text-[13px] font-semibold text-ink-3">Atendidos recentemente</div>
          <div className="flex justify-center gap-3">
            {suggestions.map((p) => (
              <Link key={p.id} to={`/pacientes/${p.id}`} className="group flex w-16 flex-col items-center gap-1.5 rounded-[16px] p-1.5 hover:bg-surface">
                <PetAvatar pet={p} size={44} className="transition-transform group-hover:-translate-y-0.5" />
                <span className="text-[12px] font-semibold text-ink-2">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default function Paciente() {
  const { id } = useParams()
  const pet = id ? PET[id] : undefined
  const model = usePatientModel(pet)
  const tutor = pet ? TUTOR[pet.tutorId] : undefined

  if (!pet || !model || !tutor) return <NotFound id={id} />

  const siblings = petsOfTutor(pet.tutorId).filter((p) => p.id !== pet.id)

  return (
    <div className="px-4 pb-6 md:px-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <PatientHeader pet={pet} tutor={tutor} model={model} />
          <VaccineCard pet={pet} tutor={tutor} doses={model.doses} current={model.current} preventives={model.preventives} />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
            <WeightChart pet={pet} points={model.weights} currentKg={model.currentKg} fresh={model.weightIsFresh} />
            <PreventiveIndex index={model.index} />
          </div>
          <Timeline items={model.timeline} petName={pet.name} />
        </div>

        <aside className="min-w-0 xl:sticky xl:top-0 xl:self-start">
          <SideColumn>
            <TutorCard tutor={tutor} pet={pet} />
            <SiblingsPanel siblings={siblings} tutorName={tutor.name} />
            <RemindersPanel reminders={model.reminders} petName={pet.name} />
            <ConditionsPanel conditions={pet.conditions ?? []} alerts={pet.alerts ?? []} />
          </SideColumn>
        </aside>
      </div>
    </div>
  )
}
