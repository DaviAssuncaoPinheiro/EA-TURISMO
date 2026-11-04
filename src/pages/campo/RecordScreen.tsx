// Tela 3 · Registro do atendimento (stepper Anamnese → Retorno)
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
import { Btn, ConnectivityBanner, EASE_IOS, EASE_OUT, Pressable, Screen } from './kit'
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
  if (!visit || !draft) return <div className="absolute inset-0 bg-paper" />
  return <Record visit={visit} draft={draft} />
}

function Elapsed({ visit }: { visit: Visit }) {
  const started = useCampo((s) => s.startedAt[visit.id])
  const [, tick] = React.useState(0)
  React.useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 20000)
    return () => window.clearInterval(t)
  }, [])
  return <span className="num">{minutesSince(started ?? visit.start)} min</span>
}

function Record({ visit, draft }: { visit: Visit; draft: Draft }) {
  const go = useGo()
  const pet = PET[visit.petIds[0]]
  const offline = useDemo((s) => s.offline)
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
          ? { kind: 'offline', title: 'Atendimento salvo no aparelho', body: `Sem sinal. O resumo para ${tutor} e a ficha do ${pet.name} sobem assim que reconectar.` }
          : { kind: 'whatsapp', title: `Resumo enviado para ${tutor}`, body: `Atendimento do ${pet.name}, receita e ${f.reminders.length} lembretes programados.` },
      )
      go(`/visita/${visit.id}/concluido`, { dir: 1, replace: true })
    }, 650)
  }

  const StepComp = [StepAnamnese, StepExame, StepVacinas, StepPrescricao, StepRetorno][step]
  const last = step === STEPS.length - 1

  return (
    <Screen
      title={
        <div className="leading-tight">
          <div className="truncate text-[16px] font-semibold">
            {pet.name} · {visit.type}
          </div>
          <div className="flex items-center justify-center gap-1 text-[12px] font-medium text-terra-700">
            <span className="size-1.5 animate-pulse rounded-full bg-terra-500" /> Em atendimento · <Elapsed visit={visit} />
          </div>
        </div>
      }
      back={{ label: 'Visita', onClick: () => go(`/visita/${visit.id}`, { dir: -1 }) }}
      right={
        <span className={cn('flex h-8 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-medium', offline ? 'bg-ink text-paper' : 'text-ok')}>
          {offline ? <CloudOff className="size-4" /> : <CloudCheck className="size-4" />}
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
        <div className="flex gap-2.5">
          {step > 0 && (
            <Btn tone="outline" className="w-[56px] shrink-0 px-0" onClick={() => setStep(step - 1)} aria-label="Etapa anterior">
              <ChevronLeft className="size-5" />
            </Btn>
          )}
          {last ? (
            <Btn tone="accent" className="flex-1" onClick={finish} disabled={saving}>
              {saving ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-5 rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Check className="size-5" strokeWidth={2.4} />
              )}
              {saving ? 'Salvando atendimento…' : 'Finalizar atendimento'}
            </Btn>
          ) : (
            <Btn tone="primary" className="flex-1" onClick={() => setStep(step + 1)}>
              Próximo: {STEPS[step + 1]} <ChevronRight className="size-5" />
            </Btn>
          )}
        </div>
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
    <div className="relative px-3 pb-2.5">
      <div className="grid grid-cols-5">
        {STEPS.map((s, i) => (
          <Pressable key={s} scale={0.94} onClick={() => onStep(i)} className="flex flex-col items-center gap-1 py-1">
            <span
              className={cn(
                'flex size-[26px] items-center justify-center rounded-full text-[12.5px] font-bold transition-colors duration-300',
                i < step ? 'bg-sage-700 text-white' : i === step ? 'bg-sage-900 text-paper ring-4 ring-sage-100' : 'bg-paper-2 text-ink-3',
              )}
            >
              {i < step ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('text-[12px] font-semibold transition-colors', i === step ? 'text-ink' : i < step ? 'text-sage-700' : 'text-ink-3')}>{s}</span>
          </Pressable>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-line/70">
        <motion.div className="h-full bg-sage-700" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.4, ease: EASE_OUT }} />
      </div>
    </div>
  )
}
