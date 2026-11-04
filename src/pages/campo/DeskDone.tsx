// Atendimento concluído no computador: resumo em grade de cartões e relatório do tutor.
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { firstName } from '@/lib/utils'
import { Card } from '@/components/ui'
import { PET } from '@/data/mock'
import { useDemo } from '@/store'
import { useCampo } from './campoStore'
import { tutorOf, visitById } from './data'
import { EASE_OUT } from './kit'
import { ReportCard } from './ReportCard'
import { AnimatedCheck, PaymentCard, ReminderChips, SendStatus, StatCards } from './DoneScreen'
import { DeskTitleRow } from './DeskVisit'

export function DeskDone() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const nav = useNavigate()
  const f = useCampo((s) => s.finished[id])
  const offline = useDemo((s) => s.offline)

  if (!visit || !f)
    return (
      <>
        <DeskTitleRow onBack={() => nav('/')} backLabel="Voltar" title="Atendimento" />
        <Card className="p-8 text-[15px] font-medium text-ink-3">Este resumo não está mais disponível.</Card>
      </>
    )

  const pet = PET[visit.petIds[0]]
  const tutorFirst = firstName(tutorOf(visit).name)
  const pending = f.savedOffline && offline

  return (
    <>
      <DeskTitleRow onBack={() => nav('/')} backLabel="Hoje" title="Resumo do atendimento" sub={`${pet.name} · ${visit.type}`} />

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
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <ReportCard visitId={visit.id} tutorId={visit.tutorId} delay={0.35} />
          <PaymentCard f={f} tutorFirst={tutorFirst} />
        </div>
      </motion.div>
    </>
  )
}
