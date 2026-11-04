// Tela 3 · Registro do atendimento em 5 etapas
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, CloudCheck, CloudOff } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { PET, type Visit } from '@/data/mock'
import { useDemo } from '@/store'
import { notify, useCampo, type Draft } from './campoStore'
import { minutesSince, tutorOf, visitById } from './data'
import { commitVisit } from './finalize'
import { Btn, ConnectivityBanner, EASE_IOS, Pressable, Screen } from './kit'
import { useGo } from './nav'
import { StepAnamnese } from './StepAnamnese'
import { StepExame } from './StepExame'
import { StepVacinas } from './StepVacinas'
import { StepPrescricao } from './StepPrescricao'
import { StepRetorno } from './StepRetorno'

export const STEPS = ['Anamnese', 'Exame', 'Vacinas', 'Prescrição', 'Retorno'] as const

export default function RecordScreen() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const draft = useCampo((s) => s.drafts[id])
  React.useLayoutEffect(() => {
    if (visit && !draft) useCampo.getState().ensureDraft(visit)
  }, [visit, draft])
  if (!visit || !draft) return <div className="absolute inset-0 bg-surface" />
  return <Record visit={visit} draft={draft} />
}

export function Elapsed({ visit }: { visit: Visit }) {
  const started = useCampo((s) => s.startedAt[visit.id])
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 20000)
    return () => window.clearInterval(t)
  }, [])
  return <span className="num">{minutesSince(started ?? visit.start)} min</span>
}

export const STEP_COMPONENTS = [StepAnamnese, StepExame, StepVacinas, StepPrescricao, StepRetorno]

/** Etapa atual, navegação entre etapas e finalização (mesmo fluxo no celular e no computador). */
export function useRecordFlow(visit: Visit, draft: Draft) {
  const go = useGo()
  const pet = PET[visit.petIds[0]]
  const patchStore = useCampo((s) => s.patch)
  const patch = React.useCallback((p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => patchStore(visit.id, p), [patchStore, visit.id])
  const step = draft.step
  const [dir, setDir] = React.useState(1)
  const [saving, setSaving] = React.useState(false)

  const setStep = (n: number) => {
    if (n < 0 || n >= STEPS.length || n === step) return
    setDir(n > step ? 1 : -1)
    patch({ step: n })
  }

  const finish = () => {
    if (saving) return
    setSaving(true)
    const f = commitVisit(visit, pet, draft)
    const tutor = firstName(tutorOf(visit).name)
    window.setTimeout(() => {
      notify(
        f.savedOffline
          ? { kind: 'offline', title: 'Salvo no aparelho', body: `O resumo para ${tutor} sai quando o sinal voltar.` }
          : { kind: 'whatsapp', title: `Resumo enviado para ${tutor}`, body: `Atendimento do ${pet.name}, receita e ${f.reminders.length} lembretes.` },
      )
      go(`/visita/${visit.id}/concluido`, { dir: 1, replace: true })
    }, 650)
  }

  const StepComp = STEP_COMPONENTS[step]
  const last = step === STEPS.length - 1
  return { go, pet, patch, step, dir, saving, setStep, finish, StepComp, last }
}

function Record({ visit, draft }: { visit: Visit; draft: Draft }) {
  const offline = useDemo((s) => s.offline)
  const { go, pet, patch, step, dir, saving, setStep, finish, StepComp, last } = useRecordFlow(visit, draft)

  return (
    <Screen
      title={
        <div className="leading-tight">
          <div className="truncate text-[16px] font-bold">{pet.name}</div>
          <div className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-ink-3">
            <span className="size-1.5 animate-pulse rounded-full bg-green" /> <Elapsed visit={visit} />
          </div>
        </div>
      }
      back={{ label: 'Voltar à visita', onClick: () => go(`/visita/${visit.id}`, { dir: -1 }) }}
      right={
        <span className={cn('flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold', offline ? 'bg-black text-white' : 'bg-card text-ink shadow-pill')}>
          {offline ? <CloudOff className="size-4 text-lime" strokeWidth={2.2} /> : <CloudCheck className="size-4 text-green" strokeWidth={2.2} />}
          {offline ? 'No aparelho' : 'Salvo'}
        </span>
      }
      below={
        <>
          <ConnectivityBanner />
          <Stepper step={step} onStep={setStep} />
        </>
      }
      scrollKey={step}
      contentProps={{ style: { touchAction: 'pan-y' } }}
      footer={
        last ? (
          <Btn tone="primary" className="h-[58px] w-full text-[16.5px]" onClick={finish} disabled={saving}>
            {saving ? (
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-5 rounded-full border-2 border-white/30 border-t-lime" />
            ) : (
              <Check className="size-5 text-lime" strokeWidth={2.6} />
            )}
            {saving ? 'Salvando' : 'Finalizar atendimento'}
          </Btn>
        ) : (
          <div className="flex gap-2.5">
            {step > 0 && (
              <Pressable scale={0.92} onClick={() => setStep(step - 1)} aria-label="Etapa anterior" className="flex size-[58px] shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
                <ChevronLeft className="size-5" strokeWidth={2.2} />
              </Pressable>
            )}
            <Btn tone="primary" className="h-[58px] flex-1 text-[16.5px]" onClick={() => setStep(step + 1)}>
              Próximo: {STEPS[step + 1]} <ChevronRight className="size-5" />
            </Btn>
          </div>
        )
      }
    >
      <motion.div
        onPanEnd={(e, info) => {
          const target = e.target as HTMLElement | null
          if (target?.closest?.('[data-noswipe], input, textarea')) return
          if (Math.abs(info.offset.x) < 70 || Math.abs(info.offset.x) < Math.abs(info.offset.y) * 1.6) return
          setStep(info.offset.x < 0 ? step + 1 : step - 1)
        }}
        className="relative min-h-full"
      >
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d > 0 ? '-40%' : '40%', opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.34, ease: EASE_IOS }}
          >
            <StepComp visit={visit} pet={pet} draft={draft} patch={patch} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Screen>
  )
}

function Stepper({ step, onStep }: { step: number; onStep: (n: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-1.5 px-4 pt-1 pb-3">
      {STEPS.map((s, i) => {
        const on = i === step
        const done = i < step
        return (
          <motion.button
            key={s}
            layout
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            onClick={() => onStep(i)}
            aria-label={s}
            className={cn(
              'flex h-10 shrink-0 items-center justify-center rounded-full text-[13.5px] font-bold [-webkit-tap-highlight-color:transparent]',
              on ? 'gap-2 bg-black pr-4 pl-1.5 text-white' : done ? 'w-10 bg-lime text-ink' : 'w-10 bg-card text-ink-3 shadow-pill',
            )}
          >
            {on ? (
              <>
                <span className="num flex size-7 items-center justify-center rounded-full bg-lime text-[12.5px] text-ink">{i + 1}</span>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                  {s}
                </motion.span>
              </>
            ) : done ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              <span className="num">{i + 1}</span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
