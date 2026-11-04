// Tela 2 · Detalhe da visita
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, Clock, Hand, HeartPulse, Lock, MapPin, MessageCircle, Navigation, Phone, Stethoscope, Syringe, TriangleExclamationPoint } from 'lucide-react'
import { cn, firstName, kg } from '@/lib/utils'
import { Badge, PetAvatar } from '@/components/ui'
import { PET, VACCINE, VET, type Visit } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { ageLabel, fmt, relDays } from '@/data/time'
import { dueState, VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'
import { notify, queueIfOffline, useCampo } from './campoStore'
import { bairroOf, lastConsult, legOf, sexLabel, simNow, tutorOf, visitById } from './data'
import { latestDoses } from './vaccines'
import { Btn, ConnectivityBanner, EASE_OUT, Pressable, Screen, SectionLabel } from './kit'
import { OfflineToggle } from './RouteScreen'
import { useGo } from './nav'

export default function VisitScreen() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const go = useGo()
  if (!visit) return <Screen title="Visita" back={{ label: 'Rota', onClick: () => go('', { dir: -1 }) }}>{<p className="p-6 text-ink-3">Visita não encontrada.</p>}</Screen>
  return <VisitDetail visit={visit} />
}

function VisitDetail({ visit }: { visit: Visit }) {
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
          ? { kind: 'offline', title: 'Mensagem na fila', body: `Sem sinal agora. O aviso para ${tutorFirst} sai assim que o celular reconectar.` }
          : { kind: 'whatsapp', title: `Mensagem enviada para ${tutorFirst}`, body: `“${vet.short.startsWith('Dra') ? 'A' : 'O'} ${vet.short} está a caminho, chega em ~${leg.min} min.”` },
      )
    } else if (status === 'a-caminho' && !arrived) {
      useCampo.getState().setArrived(visit.id)
      notify({ kind: 'app', title: 'Chegada registrada', body: `${b.name} · ${tutor.complement ?? tutor.address}. Bom atendimento!` })
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
            ? 'Ver resumo do atendimento'
            : 'Atendimento concluído'

  return (
    <Screen
      title={pet.name}
      back={{ label: 'Rota', onClick: () => go('', { dir: -1 }) }}
      right={<OfflineToggle />}
      below={<ConnectivityBanner />}
      footer={
        <div>
          <Tracker stage={stage} />
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={primaryLabel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
              <Btn tone={status === 'a-caminho' && arrived ? 'accent' : 'primary'} className="w-full" onClick={onPrimary} disabled={status === 'concluida' && !finished}>
                {status === 'concluida' ? <Check className="size-5" /> : status === 'agendada' ? <Navigation className="size-[18px]" /> : status === 'a-caminho' && !arrived ? <MapPin className="size-[18px]" /> : <Stethoscope className="size-[18px]" />}
                {primaryLabel}
              </Btn>
            </motion.div>
          </AnimatePresence>
        </div>
      }
    >
      {/* herói */}
      <div className="px-5 pt-2">
        <div className="flex items-start gap-4">
          <div className="relative">
            <PetAvatar pet={pet} size={92} className="rounded-[28px]" />
            {pets.length > 1 && (
              <span className="absolute -right-2 -bottom-2">
                <PetAvatar pet={pets[1]} size={40} className="rounded-[14px] ring-[3px] ring-paper" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={st.tone} dot>
                {st.label}
              </Badge>
              <Badge tone="neutral">{visit.type}</Badge>
            </div>
            <h1 className="mt-2 font-display text-[34px] leading-none font-semibold text-ink">
              {pets.map((p) => p.name).join(' e ')}
            </h1>
            <div className="mt-1.5 text-[15px] text-ink-2">{pet.breed}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { l: 'Idade', v: ageLabel(pet.birth) },
            { l: 'Peso', v: kg(extraWeight ?? pet.weightKg) },
            { l: 'Sexo', v: sexLabel(pet) },
          ].map((x) => (
            <div key={x.l} className="rounded-[14px] border border-line bg-card px-3 py-2.5">
              <div className="text-[12.5px] text-ink-3">{x.l}</div>
              <div className="mt-0.5 truncate text-[15px] font-semibold text-ink">{x.v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[14.5px] text-ink-2">
          <Clock className="size-4 text-ink-3" strokeWidth={1.9} />
          <span className="num font-medium text-ink">{fmt.time(visit.start)}</span>
          <span className="text-ink-4">·</span>
          {visit.durationMin} min
          {visit.fixedTime && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-terra-50 px-2 py-0.5 text-[12.5px] font-medium text-terra-700">
              <Lock className="size-3" strokeWidth={2.2} /> horário fixo
            </span>
          )}
        </div>
      </div>

      {/* alertas clínicos */}
      {(pet.alerts?.length || pendingVaccines.length > 0) && (
        <div className="mx-4 mt-5 overflow-hidden rounded-[20px] border border-late/20 bg-late-bg">
          {pet.alerts?.map((a) => (
            <div key={a} className="flex items-start gap-3 px-4 py-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-late text-white">
                {/card|sopro|mitral/i.test(a) ? <HeartPulse className="size-[18px]" strokeWidth={2} /> : <TriangleExclamationPoint className="size-[18px]" strokeWidth={2} />}
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="text-[12px] font-semibold tracking-[0.05em] text-late uppercase">Alerta clínico</div>
                <div className="mt-0.5 text-[15.5px] leading-snug font-semibold text-ink">{a}</div>
                {pet.conditions && <div className="mt-1 text-[14px] text-ink-2">{pet.conditions.join(' · ')}</div>}
              </div>
            </div>
          ))}
          {pendingVaccines.length > 0 && (
            <div className={cn('flex items-center gap-3 px-4 py-3', pet.alerts?.length && 'border-t border-late/15')}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-late">
                <Syringe className="size-[17px]" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1 text-[14.5px] text-ink">
                {pendingVaccines.map((d) => (
                  <div key={d.vaccineId}>
                    <span className="font-semibold">{VACCINE[d.vaccineId].name}</span> <span className="text-late">· {dueState(d.nextDate).label.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {pet.temperament && (
        <div className="mx-4 mt-3 flex items-start gap-3 rounded-[16px] bg-paper-2 px-4 py-3 text-[14.5px] text-ink-2">
          <Hand className="mt-0.5 size-[18px] shrink-0 text-ink-3" strokeWidth={1.8} />
          <span>{pet.temperament}</span>
        </div>
      )}

      <SectionLabel>Motivo da visita</SectionLabel>
      <div className="mx-4 rounded-[20px] border border-line bg-card px-4 py-3.5 shadow-card">
        <div className="text-[16px] leading-snug font-medium text-ink">{visit.reason}</div>
        {last && (
          <div className="mt-3 border-t border-line pt-3">
            <div className="text-[12.5px] text-ink-3">
              Último registro · {relDays(last.date)} · {VET[last.vetId].short}
            </div>
            <div className="mt-0.5 text-[14.5px] font-semibold text-ink">{last.title}</div>
            <div className="mt-0.5 line-clamp-3 text-[14px] leading-snug text-ink-2">{last.summary}</div>
          </div>
        )}
      </div>

      <SectionLabel>Tutor e endereço</SectionLabel>
      <div className="mx-4 overflow-hidden rounded-[20px] border border-line bg-card shadow-card">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sage-100 font-display text-[17px] font-semibold text-sage-800">{tutorFirst[0]}</span>
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-ink">{tutor.name}</div>
            <div className="num text-[14px] text-ink-3">{tutor.phone}</div>
          </div>
        </div>
        <div className="mx-4 h-px bg-line" />
        <div className="flex items-start gap-3 px-4 py-3.5">
          <MapPin className="mt-0.5 size-[18px] shrink-0 text-ink-3" strokeWidth={1.9} />
          <div className="min-w-0 text-[15px] leading-snug">
            <div className="font-medium text-ink">{tutor.address}</div>
            {tutor.complement && <div className="text-ink-2">{tutor.complement}</div>}
            <div className="mt-1 flex items-center gap-1.5 text-[13.5px] text-ink-3">
              <span className="size-1.5 rounded-full" style={{ background: zone.hex }} />
              {b.name} · {zone.name}
              <span className="text-ink-4">·</span> {leg.km.toLocaleString('pt-BR')} km
            </div>
            {tutor.note && <div className="mt-2 rounded-lg bg-warn-bg px-2.5 py-1.5 text-[13.5px] text-warn">{tutor.note}</div>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-3 pb-3">
          {[
            { icon: Phone, label: 'Ligar', onClick: () => action(`Ligando para ${tutorFirst}…`, tutor.phone) },
            { icon: MessageCircle, label: 'WhatsApp', onClick: () => action('Abrindo conversa', `${tutor.name} · ${tutor.phone}`) },
            { icon: Navigation, label: 'Rota no Maps', onClick: () => action('Abrindo Google Maps', `${tutor.address}, ${b.name} · ${leg.km.toLocaleString('pt-BR')} km · ~${leg.min} min`) },
          ].map((a) => (
            <Pressable key={a.label} onClick={a.onClick} className="flex h-[64px] flex-col items-center justify-center gap-1 rounded-[14px] bg-sage-50 text-[13.5px] font-semibold text-sage-800 active:bg-sage-100">
              <a.icon className="size-5" strokeWidth={1.9} />
              {a.label}
            </Pressable>
          ))}
        </div>
      </div>

      {status === 'concluida' && finished && (
        <Pressable onClick={onPrimary} className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[18px] bg-ok-bg px-4 py-3 text-left">
          <Check className="size-5 text-ok" />
          <span className="flex-1 text-[14.5px] font-medium text-ink">Atendimento registrado e enviado ao tutor</span>
          <ChevronRight className="size-4 text-ink-3" />
        </Pressable>
      )}
    </Screen>
  )
}

function Tracker({ stage }: { stage: number }) {
  const steps = ['A caminho', 'Chegada', 'Atendimento']
  if (stage >= 3) return null
  return (
    <div className="mb-3 flex items-center gap-1.5 px-1">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={cn('flex items-center gap-1.5 text-[12.5px] font-medium', i <= stage ? 'text-sage-800' : 'text-ink-4')}>
            <span className={cn('flex size-[18px] items-center justify-center rounded-full text-[10px] font-bold transition-colors', i < stage ? 'bg-sage-700 text-white' : i === stage ? 'bg-terra-600 text-white' : 'bg-paper-2 text-ink-3')}>
              {i < stage ? <Check className="size-2.5" strokeWidth={3.4} /> : i + 1}
            </span>
            {s}
          </div>
          {i < steps.length - 1 && <div className={cn('h-px flex-1', i < stage ? 'bg-sage-600' : 'bg-line-2')} />}
        </React.Fragment>
      ))}
    </div>
  )
}
