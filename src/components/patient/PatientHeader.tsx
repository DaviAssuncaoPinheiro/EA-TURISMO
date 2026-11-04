import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, CalendarPlus, ChevronLeft, ClipboardPen, Cpu, Hand, MessageCircle, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button, PetAvatar, VetAvatar } from '@/components/ui'
import { VET, VETS, WEEK_PLAN, zoneOfPet, type Pet, type Tutor } from '@/data/mock'
import { BAIRRO, ZONE } from '@/data/geo'
import { ageLabel, day, fmt, relDays } from '@/data/time'
import { firstName } from '@/lib/utils'
import { ZoneChip } from './SidePanels'
import { petFacts, type PatientModel } from './model'

/** Próximo dia em que algum veterinário está escalado na zona do paciente */
function suggestSlot(pet: Pet) {
  const zone = zoneOfPet(pet)
  for (let i = 1; i <= 14; i++) {
    const d = day(i)
    const wd = d.getDay()
    const vet = VETS.find((v) => WEEK_PLAN[v.id]?.[wd]?.includes(zone))
    if (vet) return { date: d, vet, zone: ZONE[zone] }
  }
  return null
}

export function PatientHeader({ pet, tutor, model }: { pet: Pet; tutor: Tutor; model: PatientModel }) {
  const nav = useNavigate()
  const f = petFacts(pet)
  const b = BAIRRO[tutor.bairro]

  const schedule = () => {
    const s = suggestSlot(pet)
    if (!s) return toast('Abrindo a agenda por região…')
    toast.success(`Sugestão: ${fmt.weekday(s.date)}, ${fmt.short(s.date)}`, {
      description: `${s.vet.short} estará na ${s.zone.name} (${b?.name}). Encaixe sem desvio de rota.`,
      action: { label: 'Abrir agenda', onClick: () => nav('/agenda') },
    })
  }
  const sendCard = () =>
    toast.success(`Carteira d${f.article} ${pet.name} enviada para ${firstName(tutor.name)}`, {
      description: `PDF pelo WhatsApp · ${tutor.phone}`,
    })

  const vn = model.visitNow
  const alerts = pet.alerts ?? []

  return (
    <header>
      <Link to="/pacientes" className="-ml-1.5 mb-4 inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-[13px] text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink">
        <ChevronLeft className="size-4" /> Pacientes
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4 sm:gap-5">
          <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="relative shrink-0 self-start">
            <PetAvatar pet={pet} size={100} className="ring-4 ring-card shadow-lift max-sm:size-[88px]!" />
            {vn?.status === 'em-atendimento' && (
              <span className="absolute right-0.5 bottom-1 flex size-5 items-center justify-center rounded-full border-[3px] border-paper bg-terra-500">
                <span className="absolute inset-0 animate-ping rounded-full bg-terra-500 opacity-50" />
              </span>
            )}
          </motion.div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="font-display text-[38px] leading-[1] font-medium tracking-[-0.025em] text-ink sm:text-[46px]">{pet.name}</h1>
              {vn && vn.status === 'em-atendimento' && (
                <span className="inline-flex h-7 items-center gap-2 rounded-full bg-terra-100 pr-2.5 pl-1 text-[12px] font-medium text-terra-700">
                  <VetAvatar vetId={vn.visit.vetId} size={20} />
                  Em atendimento agora · {VET[vn.visit.vetId]?.short}
                </span>
              )}
              {vn && vn.status === 'concluida' && (
                <span className="inline-flex h-7 items-center gap-2 rounded-full bg-ok-bg pr-2.5 pl-1 text-[12px] font-medium text-ok">
                  <VetAvatar vetId={vn.visit.vetId} size={20} />
                  Atendido hoje · {VET[vn.visit.vetId]?.short}
                </span>
              )}
              {vn && (vn.status === 'agendada' || vn.status === 'a-caminho') && (
                <span className="inline-flex h-7 items-center gap-2 rounded-full bg-info-bg px-2.5 text-[12px] font-medium text-info">
                  Visita hoje às {fmt.time(vn.visit.start)} · {VET[vn.visit.vetId]?.short}
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[14px] text-ink-2">
              {[f.species, pet.breed, f.sex, f.neutered, ageLabel(pet.birth), `pelagem ${pet.coat.toLowerCase()}`].map((x, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  {i > 0 && <span className="text-ink-4">·</span>}
                  {x}
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="size-3.5" strokeWidth={1.8} />
                {pet.microchip ? <span className="num font-mono text-ink-2">{pet.microchip}</span> : 'Sem microchip'}
              </span>
              {model.nextVisit && (
                <span>
                  Próxima visita <span className="font-medium text-ink-2">{relDays(model.nextVisit.start)}</span> · {model.nextVisit.reason}
                </span>
              )}
            </div>

            {/* tutor compacto */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
              <span className="text-ink-3">
                Tutor: <span className="font-medium text-ink">{tutor.name}</span>
              </span>
              <button
                onClick={() => toast(`Abrindo conversa com ${firstName(tutor.name)} no WhatsApp`, { description: tutor.phone })}
                className="num inline-flex h-7 items-center gap-1.5 rounded-md px-1.5 font-mono text-[12px] text-sage-700 transition-colors hover:bg-sage-50"
              >
                <MessageCircle className="size-3.5" strokeWidth={1.8} />
                {tutor.phone}
              </button>
              <span className="inline-flex flex-wrap items-center gap-2 text-ink-2">
                {tutor.address} · {b?.name}
                <ZoneChip bairroId={tutor.bairro} />
              </span>
            </div>

            {pet.temperament && (
              <div className="mt-3 inline-flex max-w-full items-start gap-2 rounded-md border border-[#ead9a8] bg-[#fbf3dc] px-3 py-1.5 text-[13px] text-[#6b5520] shadow-[0_1px_0_rgba(107,85,32,.06)]">
                <Hand className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
                <span>
                  <span className="font-semibold">Manejo:</span> {pet.temperament}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:max-w-[340px] lg:justify-end">
          <Button variant="primary" onClick={() => nav('/campo')} className="col-span-2 h-11 sm:h-9">
            <ClipboardPen className="size-4" strokeWidth={1.8} /> Registrar atendimento
          </Button>
          <Button variant="outline" onClick={schedule} className="h-11 sm:h-9">
            <CalendarPlus className="size-4" strokeWidth={1.8} /> Agendar visita
          </Button>
          <Button variant="outline" onClick={sendCard} className="h-11 sm:h-9">
            <Send className="size-4" strokeWidth={1.8} /> <span className="sm:hidden">Enviar carteira</span>
            <span className="hidden sm:inline">Enviar carteira ao tutor</span>
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
          role="alert"
          className="mt-5 flex items-start gap-3 overflow-hidden rounded-lg border border-[#e9c3b9] bg-late-bg/70 py-2.5 pr-4 pl-3 shadow-[inset_3px_0_0_var(--color-late)]"
        >
          <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-late text-white">
            <AlertTriangle className="size-3.5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-mono text-[10px] tracking-[0.1em] text-late/80 uppercase">Alerta clínico</div>
            <ul className="text-[13.5px] leading-snug font-medium text-[#7d2a1f]">
              {alerts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </header>
  )
}
