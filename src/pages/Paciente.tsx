import { Link, useParams } from 'react-router-dom'
import { PawPrint, Search } from 'lucide-react'
import { Button, Card, PetAvatar } from '@/components/ui'
import { PET, PETS, TUTOR, petsOfTutor } from '@/data/mock'
import { usePatientModel } from '@/components/patient/model'
import { PatientHeader } from '@/components/patient/PatientHeader'
import { PreventiveIndex } from '@/components/patient/PreventiveIndex'
import { VaccineCard } from '@/components/patient/VaccineCard'
import { WeightChart } from '@/components/patient/WeightChart'
import { Timeline } from '@/components/patient/Timeline'
import { ConditionsPanel, RemindersPanel, TutorCard } from '@/components/patient/SidePanels'

function NotFound({ id }: { id?: string }) {
  const suggestions = PETS.slice(0, 4)
  return (
    <div className="mx-auto max-w-[1320px] px-4 py-10 md:px-8 md:py-16">
      <Card className="paper-grain mx-auto max-w-lg overflow-hidden bg-card-2 px-6 py-10 text-center sm:px-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-paper-2 text-ink-3">
          <PawPrint className="size-6" strokeWidth={1.6} />
        </span>
        <h1 className="mt-4 font-display text-[28px] leading-tight font-medium text-ink">Não encontramos esse paciente</h1>
        <p className="mx-auto mt-2 max-w-sm text-[14px] text-ink-2">
          Nenhum pet cadastrado corresponde a <span className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[12.5px] text-ink">{id ?? '—'}</span>. O link pode estar incompleto ou o cadastro foi
          arquivado.
        </p>
        <Link to="/pacientes" className="mt-6 inline-block">
          <Button variant="primary" size="md" className="h-11 sm:h-9">
            <Search className="size-4" strokeWidth={1.8} /> Ver todos os pacientes
          </Button>
        </Link>
        <div className="mt-8 border-t border-line pt-5">
          <div className="eyebrow mb-3">Atendidos recentemente</div>
          <div className="flex justify-center gap-3">
            {suggestions.map((p) => (
              <Link key={p.id} to={`/pacientes/${p.id}`} className="group flex w-16 flex-col items-center gap-1.5 rounded-lg p-1.5 hover:bg-paper-2">
                <PetAvatar pet={p} size={44} className="transition-transform group-hover:-translate-y-0.5" />
                <span className="text-[12px] font-medium text-ink-2">{p.name}</span>
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
    <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
      <PatientHeader pet={pet} tutor={tutor} model={model} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <PreventiveIndex index={model.index} className="xl:hidden" />
          <VaccineCard pet={pet} tutor={tutor} doses={model.doses} current={model.current} preventives={model.preventives} />
          <WeightChart pet={pet} points={model.weights} currentKg={model.currentKg} fresh={model.weightIsFresh} />
          <Timeline items={model.timeline} petName={pet.name} />
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <PreventiveIndex index={model.index} className="hidden xl:block" />
          <TutorCard tutor={tutor} pet={pet} siblings={siblings} />
          <RemindersPanel reminders={model.reminders} petName={pet.name} />
          <ConditionsPanel conditions={pet.conditions ?? []} alerts={pet.alerts ?? []} />
        </aside>
      </div>
    </div>
  )
}
