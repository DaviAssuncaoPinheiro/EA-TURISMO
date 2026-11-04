// Registro do atendimento no computador: etapas em pílulas no topo, conteúdo em duas colunas e ações no rodapé.
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CloudCheck, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PetAvatar } from '@/components/ui'
import { type Visit } from '@/data/mock'
import { useDemo } from '@/store'
import { useCampo, type Draft } from './campoStore'
import { visitById } from './data'
import { EASE_OUT } from './kit'
import { useGo } from './nav'
import { Elapsed, STEPS, useRecordFlow } from './RecordScreen'

export function DeskRecord() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const draft = useCampo((s) => s.drafts[id])
  const go = useGo()
  React.useLayoutEffect(() => {
    if (visit && !draft) useCampo.getState().ensureDraft(visit)
  }, [visit, draft])
  if (!visit)
    return (
      <div className="rounded-[24px] bg-card p-8 text-[15px] font-medium text-ink-3 shadow-card">
        Visita não encontrada.{' '}
        <button className="font-semibold text-ink underline" onClick={() => go('', { dir: -1 })}>
          Voltar à rota
        </button>
      </div>
    )
  if (!draft) return null
  return <DeskRecordBody visit={visit} draft={draft} />
}

function DeskRecordBody({ visit, draft }: { visit: Visit; draft: Draft }) {
  const offline = useDemo((s) => s.offline)
  const { go, pet, patch, step, dir, saving, setStep, finish, StepComp, last } = useRecordFlow(visit, draft)

  const changeStep = (n: number) => {
    setStep(n)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="rounded-[28px] bg-muted p-2 ring-1 ring-white/80">
      {/* paciente e etapas */}
      <div className="rounded-[22px] bg-card p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-3 px-1 pb-3">
          <button
            onClick={() => go(`/visita/${visit.id}`, { dir: -1 })}
            aria-label="Voltar à visita"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink transition-colors hover:bg-muted-2 active:scale-95"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={2} />
          </button>
          <PetAvatar pet={pet} size={40} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[16px] font-bold text-ink">
              {pet.name} <span className="font-semibold text-ink-3">· {visit.type}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
              <span className="size-1.5 animate-pulse rounded-full bg-green" /> Em atendimento há <Elapsed visit={visit} />
            </div>
          </div>
          <span className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold', offline ? 'bg-black text-white' : 'bg-surface text-ink')}>
            {offline ? <CloudOff className="size-4 text-lime" strokeWidth={2.2} /> : <CloudCheck className="size-4 text-green" strokeWidth={2.2} />}
            {offline ? 'Salvo no computador' : 'Salvo'}
          </span>
        </div>
        <nav className="grid grid-cols-5 gap-1.5" aria-label="Etapas">
          {STEPS.map((s, i) => {
            const on = i === step
            const done = i < step
            return (
              <button
                key={s}
                onClick={() => changeStep(i)}
                aria-current={on ? 'step' : undefined}
                className={cn(
                  'flex h-11 min-w-0 items-center gap-2 rounded-full pr-3 pl-1.5 text-[13.5px] font-semibold transition-[background,color,transform] duration-200 active:scale-[.98]',
                  on ? 'bg-black text-white' : done ? 'bg-lime-soft text-ink hover:bg-lime/50' : 'bg-surface text-ink-3 hover:text-ink',
                )}
              >
                <span
                  className={cn(
                    'num flex size-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold',
                    on ? 'bg-lime text-ink' : done ? 'bg-lime text-ink' : 'bg-card text-ink-3 shadow-pill',
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="truncate">{s}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* conteúdo da etapa */}
      <div className="px-3 pt-6 pb-4">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? -16 : 16, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            <StepComp visit={visit} pet={pet} draft={draft} patch={patch} layout="desktop" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ações */}
      <div className="sticky bottom-3 z-10 flex items-center gap-3 rounded-[22px] bg-card px-4 py-3 shadow-float">
        <div className="min-w-0 flex-1 text-[13.5px] font-semibold text-ink-3">
          Etapa <span className="num text-ink">{step + 1}</span> de {STEPS.length} · <span className="text-ink">{STEPS[step]}</span>
        </div>
        {step > 0 && (
          <button onClick={() => changeStep(step - 1)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-muted pr-4 pl-3 text-[14px] font-semibold text-ink transition-[background,transform] hover:bg-muted-2 active:scale-[.97]">
            <ChevronLeft className="size-[18px]" strokeWidth={2.2} /> Voltar
          </button>
        )}
        {last ? (
          <button
            onClick={finish}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-[14px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97] disabled:opacity-70"
          >
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-[18px] rounded-full border-2 border-white/30 border-t-lime" />
            ) : (
              <Check className="size-[18px] text-lime" strokeWidth={2.6} />
            )}
            {saving ? 'Salvando' : 'Finalizar atendimento'}
          </button>
        ) : (
          <button onClick={() => changeStep(step + 1)} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-black pr-3 pl-5 text-[14px] font-semibold text-white transition-[background,transform] hover:bg-black-2 active:scale-[.97]">
            Próximo: {STEPS[step + 1]} <ChevronRight className="size-[18px]" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  )
}
