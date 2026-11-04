// Atendimento concluído no computador: resumo em grade de cartões e próxima parada.
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Navigation } from 'lucide-react'
import { firstName } from '@/lib/utils'
import { Card, PetAvatar } from '@/components/ui'
import { PET } from '@/data/mock'
import { fmt } from '@/data/time'
import { useDemo } from '@/store'
import { useCampo } from './campoStore'
import { bairroOf, legOf, nextStopAfter, tutorOf, visitById } from './data'
import { EASE_OUT } from './kit'
import { useGo } from './nav'
import { AnimatedCheck, PaymentCard, ReminderChips, SendStatus, StatCards } from './DoneScreen'
import { DeskTitleRow } from './DeskVisit'

export function DeskDone() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const go = useGo()
  const f = useCampo((s) => s.finished[id])
  const status = useDemo((s) => s.visitStatus)
  const offline = useDemo((s) => s.offline)

  if (!visit || !f)
    return (
      <>
        <DeskTitleRow onBack={() => go('', { dir: -1 })} backLabel="Rota" title="Atendimento" />
        <Card className="p-8 text-[15px] font-medium text-ink-3">Este resumo não está mais disponível.</Card>
      </>
    )

  const pet = PET[visit.petIds[0]]
  const tutorFirst = firstName(tutorOf(visit).name)
  const next = nextStopAfter(visit, status)
  const pending = f.savedOffline && offline

  return (
    <>
      <DeskTitleRow onBack={() => go('', { dir: -1 })} backLabel="Rota" title="Resumo do atendimento" sub={`${pet.name} · ${visit.type}`} />

      <Card className="flex flex-wrap items-center gap-5 p-5">
        <AnimatedCheck className="mx-0 size-[72px] shrink-0" />
        <div className="min-w-0 flex-1">
          <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.35, ease: EASE_OUT }} className="text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink">
            Atendimento concluído
          </motion.h2>
          <p className="mt-0.5 text-[14px] font-medium text-ink-3">
            {pet.name} · {visit.type} · {f.durationMin} min
          </p>
        </div>
        <SendStatus pending={pending} tutorFirst={tutorFirst} className="w-full lg:w-[340px]" />
      </Card>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }} className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <StatCards f={f} className="gap-3 xl:grid-cols-4" delay={0.3} />
          <ReminderChips f={f} />
          {next ? <DeskNextStop visitId={next.id} /> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <PaymentCard f={f} tutorFirst={tutorFirst} />
          {!next && (
            <button onClick={() => go('', { dir: -1 })} className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-[14.5px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97]">
              Voltar à rota
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}

function DeskNextStop({ visitId }: { visitId: string }) {
  const go = useGo()
  const v = visitById(visitId)!
  const pet = PET[v.petIds[0]]
  const leg = legOf(v)
  return (
    <div>
      <div className="px-1 pb-3 text-[18px] font-bold tracking-[-0.02em] text-ink">Próxima parada</div>
      <button
        onClick={() => go(`/visita/${v.id}`, { dir: 1 })}
        className="group flex w-full items-center gap-4 rounded-[24px] bg-black p-3 pr-4 text-left text-white transition-[background,transform] hover:bg-black-2 active:scale-[.99]"
      >
        <PetAvatar pet={pet} size={60} className="rounded-[18px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold">{pet.name}</div>
          <div className="truncate text-[13.5px] font-medium text-white/60">
            <span className="num">{fmt.time(v.start)}</span> · {v.type} · {bairroOf(v).name} · {leg.min} min
          </div>
        </div>
        <span className="hidden h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-[13.5px] font-semibold xl:inline-flex">
          <Navigation className="size-4 text-lime" strokeWidth={2} /> Ir para {pet.name}
        </span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
          <ArrowUpRight className="size-5" strokeWidth={2.2} />
        </span>
      </button>
    </div>
  )
}
