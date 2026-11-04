// Tela 2 · Detalhe da visita
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Cake, Check, ChevronRight, Clock, FileText, Hand, HeartPulse, Lock, MapPin, MessageCircle, Navigation, PawPrint, Phone, Scale, Stethoscope, Syringe, TriangleAlert } from 'lucide-react'
import { cn, firstName, kg } from '@/lib/utils'
import { PetAvatar } from '@/components/ui'
import { PET, VET, type Pet, type Visit } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { ageLabel, fmt, relDays } from '@/data/time'
import { dueState, VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'
import { notify, queueIfOffline, useCampo } from './campoStore'
import { bairroOf, lastConsult, legOf, sexLabel, simNow, tutorOf, visitById, vName } from './data'
import { latestDoses } from './vaccines'
import { Btn, ConnectivityBanner, EASE_OUT, Pressable, RoundBtn, Screen } from './kit'
import { OfflineToggle } from './RouteScreen'
import { useGo } from './nav'

export default function VisitScreen() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const go = useGo()
  if (!visit)
    return (
      <Screen title="Visita" back={{ label: 'Voltar', onClick: () => go('', { dir: -1 }) }}>
        <p className="p-6 text-[15px] font-medium text-ink-3">Visita não encontrada.</p>
      </Screen>
    )
  return <VisitDetail visit={visit} />
}

/** Foto grande do pet, com inicial em círculo quando a imagem não carrega */
export function PetHero({ pet }: { pet: Pet }) {
  const [failed, setFailed] = React.useState(false)
  const cat = pet.species === 'gato'
  return (
    <div className={cn('absolute inset-0', cat ? 'bg-violet-soft' : 'bg-yellow-soft')}>
      {!failed && pet.photo ? (
        <img src={pet.photo} alt={pet.name} onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center pb-10">
          <span className="absolute -top-10 -right-10 size-48 rounded-full bg-white/35" />
          <span className="absolute -bottom-16 -left-12 size-56 rounded-full bg-white/25" />
          <span className={cn('relative flex size-[128px] items-center justify-center rounded-full bg-card text-[60px] font-bold shadow-card', cat ? 'text-violet' : 'text-yellow-ink')}>{pet.name[0]}</span>
        </div>
      )}
    </div>
  )
}

/** Estado e ações da visita (mesmo fluxo no celular e no computador). */
export function useVisitFlow(visit: Visit) {
  const go = useGo()
  const pets = visit.petIds.map((p) => PET[p])
  const pet = pets[0]
  const tutor = tutorOf(visit)
  const b = bairroOf(visit)
  const zone = ZONE[b.zone]
  const vet = VET[visit.vetId]
  const status = useDemo((s) => s.visitStatus[visit.id])
  const setVisitStatus = useDemo((s) => s.setVisitStatus)
  const extraWeight = useDemo((s) => s.extraWeights[pet.id])
  const extraEvents = useDemo((s) => s.extraEvents)
  const extraDoses = useDemo((s) => s.extraDoses)
  const arrived = useCampo((s) => !!s.arrived[visit.id])
  const finished = useCampo((s) => s.finished[visit.id])
  const leg = legOf(visit)
  const st = VISIT_STATUS[status]

  const last = extraEvents.find((e) => e.petId === pet.id) ?? lastConsult(pet.id)
  const pendingVaccines = latestDoses(pet.id, extraDoses).filter((d) => dueState(d.nextDate).key !== 'ok')

  const tutorFirst = firstName(tutor.name)
  const action = (label: string, body: string) => notify({ kind: 'app', title: label, body })

  const onPrimary = () => {
    if (status === 'agendada' || status === 'cancelada') {
      setVisitStatus(visit.id, 'a-caminho')
      const offline = queueIfOffline()
      notify(
        offline
          ? { kind: 'offline', title: 'Mensagem na fila', body: `Sem sinal. O aviso para ${tutorFirst} sai quando reconectar.` }
          : { kind: 'whatsapp', title: `Aviso enviado para ${tutorFirst}`, body: `${vet.short} está a caminho. Chega em ${leg.min} min.` },
      )
    } else if (status === 'a-caminho' && !arrived) {
      useCampo.getState().setArrived(visit.id)
      notify({ kind: 'app', title: 'Chegada registrada', body: `${b.name}, ${tutor.complement ?? tutor.address}.` })
    } else if (status === 'a-caminho' && arrived) {
      setVisitStatus(visit.id, 'em-atendimento')
      useCampo.getState().setStarted(visit.id, simNow().toISOString())
      useCampo.getState().ensureDraft(visit)
      go(`/visita/${visit.id}/atendimento`, { dir: 1 })
    } else if (status === 'em-atendimento') {
      useCampo.getState().ensureDraft(visit)
      go(`/visita/${visit.id}/atendimento`, { dir: 1 })
    } else if (status === 'concluida' && finished) {
      go(`/visita/${visit.id}/concluido`, { dir: 1 })
    }
  }

  const stage = status === 'concluida' ? 3 : status === 'em-atendimento' ? 2 : status === 'a-caminho' ? (arrived ? 1 : 0) : -1
  const primaryLabel =
    status === 'agendada' || status === 'cancelada'
      ? 'Estou a caminho'
      : status === 'a-caminho'
        ? arrived
          ? 'Iniciar atendimento'
          : 'Cheguei'
        : status === 'em-atendimento'
          ? 'Continuar atendimento'
          : finished
            ? 'Ver resumo'
            : 'Atendimento concluído'
  const limeCta = (status === 'a-caminho' && arrived) || status === 'em-atendimento'
  const PrimaryIcon = status === 'concluida' ? Check : status === 'agendada' ? Navigation : status === 'a-caminho' && !arrived ? MapPin : Stethoscope
  const contacts = [
    { icon: Phone, label: 'Ligar', onClick: () => action(`Ligando para ${tutorFirst}`, tutor.phone) },
    { icon: MessageCircle, label: 'WhatsApp', onClick: () => action('Abrindo conversa', `${tutor.name}, ${tutor.phone}`) },
    { icon: Navigation, label: 'Rota', onClick: () => action('Abrindo o mapa', `${tutor.address}, ${b.name}. ${leg.km.toLocaleString('pt-BR')} km, ${leg.min} min.`) },
  ]

  return { go, pets, pet, tutor, tutorFirst, b, zone, vet, status, st, extraWeight, extraEvents, arrived, finished, leg, last, pendingVaccines, onPrimary, stage, primaryLabel, limeCta, PrimaryIcon, contacts }
}

function VisitDetail({ visit }: { visit: Visit }) {
  const { go, pets, pet, tutor, tutorFirst, b, zone, status, st, extraWeight, arrived, finished, leg, last, pendingVaccines, onPrimary, stage, primaryLabel, limeCta, contacts } = useVisitFlow(visit)

  return (
    <Screen
      title="Visita"
      back={{ label: 'Voltar à rota', onClick: () => go('', { dir: -1 }) }}
      right={<OfflineToggle />}
      below={<ConnectivityBanner />}
      footer={
        <div>
          <Tracker stage={stage} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={primaryLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
              <Btn tone={limeCta ? 'lime' : 'primary'} className="h-[58px] w-full text-[16.5px]" onClick={onPrimary} disabled={status === 'concluida' && !finished}>
                {status === 'concluida' ? <Check className="size-5" /> : status === 'agendada' ? <Navigation className="size-[18px]" /> : status === 'a-caminho' && !arrived ? <MapPin className="size-[18px]" /> : <Stethoscope className="size-[18px]" />}
                {primaryLabel}
              </Btn>
            </motion.div>
          </AnimatePresence>
        </div>
      }
    >
      {/* foto do pet com rótulo translúcido */}
      <div className="relative mx-4 h-[264px] overflow-hidden rounded-[32px]">
        <PetHero pet={pet} />
        <span className="absolute top-3 left-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/75 px-3 text-[12.5px] font-bold text-ink backdrop-blur-md">
          <span className={cn('size-2 rounded-full', status === 'em-atendimento' ? 'bg-lime ring-2 ring-black/80' : status === 'concluida' ? 'bg-green' : status === 'a-caminho' ? 'bg-blue' : 'bg-ink-4')} />
          {st.label}
        </span>
        {pets.length > 1 && (
          <span className="absolute top-3 right-3">
            <PetAvatar pet={pets[1]} size={44} className="ring-[3px] ring-white/80" />
          </span>
        )}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-[22px] bg-white/72 px-4 py-3 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-ink">{visit.type}</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
              <Clock className="size-3.5" strokeWidth={2.2} />
              <span className="num">{fmt.time(visit.start)}</span> · {visit.durationMin} min
            </div>
          </div>
          {visit.fixedTime && (
            <span className="inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[12px] font-semibold text-white">
              <Lock className="size-3" strokeWidth={2.4} /> Horário fixo
            </span>
          )}
        </div>
      </div>

      {/* nome e chips */}
      <div className="px-5 pt-5">
        <h1 className="text-[34px] leading-none font-bold tracking-[-0.035em] text-ink">{pets.map((p) => p.name).join(' e ')}</h1>
        <div className="mt-1.5 text-[14.5px] font-medium text-ink-3">{sexLabel(pet)}</div>
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
          {[
            { icon: PawPrint, v: pet.breed },
            { icon: Cake, v: ageLabel(pet.birth) },
            { icon: Scale, v: kg(extraWeight ?? pet.weightKg) },
          ].map((x) => (
            <span key={x.v} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-card pr-4 pl-1.5 text-[14px] font-semibold text-ink shadow-pill">
              <span className="flex size-8 items-center justify-center rounded-full bg-muted">
                <x.icon className="size-4" strokeWidth={2} />
              </span>
              {x.v}
            </span>
          ))}
        </div>
      </div>

      {/* alerta clínico */}
      {(pet.alerts?.length || pendingVaccines.length > 0) && (
        <div className="mx-4 mt-5 rounded-[28px] bg-red-soft p-5">
          <div className="flex items-center gap-2 text-[13.5px] font-bold text-red">
            <span className="flex size-6 items-center justify-center rounded-full bg-red text-white">
              <TriangleAlert className="size-3.5" strokeWidth={2.4} />
            </span>
            Alerta
          </div>
          {pet.alerts?.map((a) => (
            <div key={a} className="mt-2.5">
              <div className="flex items-start gap-2 text-[16px] leading-snug font-bold text-ink">
                {/card|sopro|mitral/i.test(a) && <HeartPulse className="mt-0.5 size-[18px] shrink-0 text-red" strokeWidth={2.2} />}
                {a}
              </div>
              {pet.conditions && <div className="mt-1 text-[13.5px] font-medium text-ink-2">{pet.conditions.join(', ')}</div>}
            </div>
          ))}
          {pendingVaccines.length > 0 && (
            <div className={cn('flex flex-col gap-2', pet.alerts?.length ? 'mt-4' : 'mt-3')}>
              {pendingVaccines.map((d) => (
                <div key={d.vaccineId} className="flex h-11 items-center gap-2.5 rounded-full bg-card/70 pr-4 pl-1.5">
                  <span className="flex size-8 items-center justify-center rounded-full bg-card text-red">
                    <Syringe className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex-1 truncate text-[14px] font-semibold text-ink">{vName(d.vaccineId)}</span>
                  <span className="text-[13px] font-bold text-red">{dueState(d.nextDate).label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* motivo */}
      <div className="mx-4 mt-3 rounded-[28px] bg-card p-5 shadow-card">
        <div className="text-[13px] font-semibold text-ink-3">Motivo</div>
        <div className="mt-1 text-[16.5px] leading-snug font-bold tracking-[-0.01em] text-ink">{visit.reason}</div>
        {pet.temperament && (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-[18px] bg-muted px-3.5 py-3 text-[14px] font-medium text-ink-2">
            <Hand className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2} />
            <span>{pet.temperament}</span>
          </div>
        )}
      </div>

      {/* último registro (cartão Insight) */}
      {last && (
        <div className="mx-4 mt-3 rounded-[28px] bg-blue-soft p-5">
          <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
            <span className="flex size-6 items-center justify-center rounded-full bg-black text-white">
              <FileText className="size-3.5" strokeWidth={2.2} />
            </span>
            Último registro
          </div>
          <div className="mt-2.5 text-[16px] font-bold text-ink">{last.title}</div>
          <div className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug font-medium text-ink-2">{last.summary}</div>
          <div className="mt-3 text-[13px] font-bold text-blue">
            {relDays(last.date)} · {VET[last.vetId].short}
          </div>
        </div>
      )}

      {/* tutor */}
      <div className="mx-4 mt-3 rounded-[28px] bg-card p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lime text-[18px] font-bold text-ink">{tutorFirst[0]}</span>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-bold text-ink">{tutor.name}</div>
            <div className="num text-[13.5px] font-medium text-ink-3">{tutor.phone}</div>
          </div>
        </div>
        <div className="mt-4 rounded-[20px] bg-surface p-3.5">
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-[17px] shrink-0 text-ink" strokeWidth={2} />
            <div className="min-w-0 text-[14.5px] leading-snug">
              <div className="font-bold text-ink">{tutor.address}</div>
              {tutor.complement && <div className="font-medium text-ink-2">{tutor.complement}</div>}
              <div className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
                <span className="size-1.5 rounded-full" style={{ background: zone.hex }} />
                {b.name} · {leg.km.toLocaleString('pt-BR')} km
              </div>
            </div>
          </div>
          {tutor.note && <div className="mt-3 rounded-[14px] bg-yellow-soft px-3 py-2 text-[13px] font-semibold text-yellow-ink">{tutor.note}</div>}
        </div>
        <div className="mt-4 grid grid-cols-3">
          {contacts.map((c, i) => ({ ...c, tone: i === 2 ? ('black' as const) : ('muted' as const) })).map((a) => (
            <div key={a.label} className="flex flex-col items-center gap-1.5">
              <RoundBtn label={a.label} tone={a.tone} size={56} onClick={a.onClick}>
                <a.icon className={cn('size-5', a.tone === 'black' && 'text-lime')} strokeWidth={2} />
              </RoundBtn>
              <span className="text-[12.5px] font-semibold text-ink-2">{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {status === 'concluida' && finished && (
        <Pressable onClick={onPrimary} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[24px] bg-lime-soft px-4 py-3.5 text-left">
          <span className="flex size-8 items-center justify-center rounded-full bg-lime">
            <Check className="size-4" strokeWidth={2.6} />
          </span>
          <span className="flex-1 text-[14.5px] font-semibold text-ink">Registrado e enviado ao tutor</span>
          <ChevronRight className="size-4 text-ink-3" />
        </Pressable>
      )}
    </Screen>
  )
}

export function Tracker({ stage, className }: { stage: number; className?: string }) {
  const steps = ['A caminho', 'Chegada', 'Atendimento']
  if (stage >= 3) return null
  return (
    <div className={cn('mb-3 flex gap-1.5', className)}>
      {steps.map((s, i) => (
        <span
          key={s}
          className={cn(
            'flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-[12.5px] font-semibold transition-colors duration-300',
            i < stage ? 'bg-black text-white' : i === stage ? 'bg-lime text-ink' : 'bg-muted text-ink-3',
          )}
        >
          {i < stage && <Check className="size-3.5 text-lime" strokeWidth={3} />}
          {s}
        </span>
      ))}
    </div>
  )
}
