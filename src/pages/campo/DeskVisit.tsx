// Visita no computador: paciente à esquerda; andamento, tutor e histórico à direita.
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Cake, Check, ChevronRight, FileText, FlaskConical, Hand, HeartPulse, Lock, MapPin, PawPrint, Repeat, Scale, Stethoscope, Syringe, TriangleAlert } from 'lucide-react'
import { cn, kg } from '@/lib/utils'
import { Badge, Card, IconCircle, PetAvatar } from '@/components/ui'
import { EVENTS, VET, type EventKind, type Visit } from '@/data/mock'
import { ageLabel, fmt, relDays } from '@/data/time'
import { dueState } from '@/lib/status'
import { sexLabel, visitById, vName } from './data'
import { Btn, EASE_OUT } from './kit'
import { useGo } from './nav'
import { PetHero, Tracker, useVisitFlow } from './VisitScreen'

/** Linha de título das subpáginas: voltar, título e ações */
export function DeskTitleRow({ onBack, backLabel, title, sub, right }: { onBack: () => void; backLabel: string; title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pb-4">
      <button onClick={onBack} className="group inline-flex h-10 items-center gap-2 rounded-full bg-card pr-4 pl-3 text-[13.5px] font-semibold text-ink shadow-pill transition-colors hover:bg-surface active:scale-[.97]">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} /> {backLabel}
      </button>
      <div className="min-w-0 flex-1 pl-1">
        <div className="truncate text-[20px] leading-tight font-bold tracking-[-0.02em] text-ink">{title}</div>
        {sub && <div className="truncate text-[13px] font-medium text-ink-3">{sub}</div>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}

export function DeskVisit() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const go = useGo()
  if (!visit)
    return (
      <>
        <DeskTitleRow onBack={() => go('', { dir: -1 })} backLabel="Rota" title="Visita" />
        <Card className="p-8 text-[15px] font-medium text-ink-3">Visita não encontrada.</Card>
      </>
    )
  return <DeskVisitDetail visit={visit} />
}

const EVENT_ICON: Partial<Record<EventKind, typeof Stethoscope>> = { consulta: Stethoscope, vacina: Syringe, exame: FlaskConical, retorno: Repeat }

function DeskVisitDetail({ visit }: { visit: Visit }) {
  const { go, pets, pet, tutor, tutorFirst, b, zone, status, st, extraWeight, extraEvents, finished, leg, last, pendingVaccines, onPrimary, stage, primaryLabel, limeCta, PrimaryIcon, contacts } = useVisitFlow(visit)
  const history = React.useMemo(
    () => [...extraEvents.filter((e) => e.petId === pet.id), ...EVENTS.filter((e) => e.petId === pet.id)].filter((e) => e.id !== last?.id).sort((a, z) => +new Date(z.date) - +new Date(a.date)).slice(0, 4),
    [extraEvents, pet.id, last?.id],
  )

  return (
    <>
      <DeskTitleRow
        onBack={() => go('', { dir: -1 })}
        backLabel="Rota"
        title={`Visita de ${pets.map((p) => p.name).join(' e ')}`}
        sub={
          <>
            {visit.type} · <span className="num">{fmt.time(visit.start)}</span> · {visit.durationMin} min · {b.name}
          </>
        }
        right={
          <Badge tone={st.tone} dot className="h-8 px-3 text-[12.5px]">
            {st.label}
          </Badge>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
        {/* paciente */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="overflow-hidden p-2">
            <div className="relative h-[clamp(240px,34vh,340px)] overflow-hidden rounded-[18px]">
              <PetHero pet={pet} />
              {visit.fixedTime && (
                <span className="absolute top-3 left-3 inline-flex h-8 items-center gap-1 rounded-full bg-black px-3 text-[12px] font-semibold text-white">
                  <Lock className="size-3" strokeWidth={2.4} /> Horário fixo
                </span>
              )}
              {pets.length > 1 && (
                <span className="absolute top-3 right-3">
                  <PetAvatar pet={pets[1]} size={48} className="ring-[3px] ring-white/80" />
                </span>
              )}
            </div>
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-[32px] leading-none font-bold tracking-[-0.035em] text-ink">{pets.map((p) => p.name).join(' e ')}</h2>
              <div className="mt-1.5 text-[14px] font-medium text-ink-3">{sexLabel(pet)}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { icon: PawPrint, v: pet.breed },
                  { icon: Cake, v: ageLabel(pet.birth) },
                  { icon: Scale, v: kg(extraWeight ?? pet.weightKg) },
                ].map((x) => (
                  <span key={x.v} className="inline-flex h-10 items-center gap-2 rounded-full bg-surface pr-4 pl-1.5 text-[13.5px] font-semibold text-ink">
                    <span className="flex size-7 items-center justify-center rounded-full bg-card shadow-pill">
                      <x.icon className="size-3.5" strokeWidth={2} />
                    </span>
                    {x.v}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {(pet.alerts?.length || pendingVaccines.length > 0) && (
            <div className="rounded-[24px] bg-red-soft p-5">
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
                <div className={cn('flex flex-wrap gap-2', pet.alerts?.length ? 'mt-4' : 'mt-3')}>
                  {pendingVaccines.map((d) => (
                    <span key={d.vaccineId} className="inline-flex h-10 items-center gap-2 rounded-full bg-card/70 pr-4 pl-1.5">
                      <span className="flex size-7 items-center justify-center rounded-full bg-card text-red">
                        <Syringe className="size-3.5" strokeWidth={2} />
                      </span>
                      <span className="text-[13.5px] font-semibold text-ink">{vName(d.vaccineId)}</span>
                      <span className="text-[12.5px] font-bold text-red">{dueState(d.nextDate).label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <Card className="p-5">
            <div className="text-[13px] font-semibold text-ink-3">Motivo</div>
            <div className="mt-1 text-[16.5px] leading-snug font-bold tracking-[-0.01em] text-ink">{visit.reason}</div>
            {pet.temperament && (
              <div className="mt-3.5 flex items-start gap-2.5 rounded-[18px] bg-muted px-3.5 py-3 text-[14px] font-medium text-ink-2">
                <Hand className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={2} />
                <span>{pet.temperament}</span>
              </div>
            )}
          </Card>
        </div>

        {/* andamento, tutor e histórico */}
        <div className="flex min-w-0 flex-col gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">Andamento</h3>
              <span className="text-[13px] font-semibold text-ink-3">
                {status === 'concluida' ? 'Concluída' : `${leg.km.toLocaleString('pt-BR')} km · ${leg.min} min`}
              </span>
            </div>
            <Tracker stage={stage} />
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={primaryLabel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2, ease: EASE_OUT }}>
                <Btn tone={limeCta ? 'lime' : 'primary'} className="h-12 w-full text-[15px]" onClick={onPrimary} disabled={status === 'concluida' && !finished}>
                  <PrimaryIcon className="size-[18px]" />
                  {primaryLabel}
                </Btn>
              </motion.div>
            </AnimatePresence>
            {status === 'concluida' && finished && (
              <button onClick={onPrimary} className="mt-3 flex w-full items-center gap-3 rounded-[18px] bg-lime-soft px-4 py-3 text-left transition-colors hover:bg-lime/40">
                <span className="flex size-8 items-center justify-center rounded-full bg-lime">
                  <Check className="size-4" strokeWidth={2.6} />
                </span>
                <span className="flex-1 text-[14px] font-semibold text-ink">Registrado e enviado ao tutor</span>
                <ChevronRight className="size-4 text-ink-3" />
              </button>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-lime text-[18px] font-bold text-ink">{tutorFirst[0]}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-bold text-ink">{tutor.name}</div>
                <div className="num text-[13.5px] font-medium text-ink-3">{tutor.phone}</div>
              </div>
            </div>
            <div className="mt-4 rounded-[18px] bg-surface p-3.5">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-[17px] shrink-0 text-ink" strokeWidth={2} />
                <div className="min-w-0 text-[14px] leading-snug">
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
            <div className="mt-4 grid grid-cols-3 gap-2">
              {contacts.map((c, i) => (
                <button
                  key={c.label}
                  onClick={c.onClick}
                  className={cn(
                    'inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 text-[13.5px] font-semibold transition-[background,transform] active:scale-[.97]',
                    i === 2 ? 'bg-black text-white hover:bg-black-2' : 'bg-muted text-ink hover:bg-muted-2',
                  )}
                >
                  <c.icon className={cn('size-4 shrink-0', i === 2 && 'text-lime')} strokeWidth={2} />
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {last && (
            <div className="rounded-[24px] bg-blue-soft p-5">
              <div className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                <span className="flex size-6 items-center justify-center rounded-full bg-black text-white">
                  <FileText className="size-3.5" strokeWidth={2.2} />
                </span>
                Último registro
              </div>
              <div className="mt-2.5 text-[16px] font-bold text-ink">{last.title}</div>
              <div className="mt-0.5 text-[13.5px] leading-snug font-medium text-ink-2">{last.summary}</div>
              <div className="mt-3 text-[13px] font-bold text-blue">
                {relDays(last.date)} · {VET[last.vetId].short}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <Card className="p-2">
              <div className="px-3 pt-3 pb-2 text-[17px] font-bold tracking-[-0.02em] text-ink">Histórico</div>
              {history.map((e, i) => {
                const Icon = EVENT_ICON[e.kind] ?? FileText
                return (
                  <div key={e.id}>
                    {i > 0 && <div className="mr-3 ml-[62px] h-px bg-line" />}
                    <div className="flex items-start gap-3 px-3 py-3">
                      <IconCircle size={38}>
                        <Icon className="size-4" strokeWidth={2} />
                      </IconCircle>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-[14.5px] font-bold text-ink">{e.title}</span>
                          <span className="shrink-0 text-[12.5px] font-medium text-ink-3">{relDays(e.date)}</span>
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-medium text-ink-3">{e.summary}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
