import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AudioLines, Mic, Square } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { SYMPTOMS, dictationFor, tutorOf } from './data'
import { Chip, EASE_OUT, Pressable } from './kit'
import { Block, StepFrame, StepIntro, TextArea, type StepProps } from './stepKit'

function Waveform() {
  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-lime"
          animate={{ height: [6, 8 + ((i * 7) % 15), 5, 10 + ((i * 5) % 12), 6] }}
          transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
        />
      ))}
    </span>
  )
}

export function StepAnamnese({ visit, pet, draft, patch, layout }: StepProps) {
  const [dictating, setDictating] = React.useState(false)
  const [detected, setDetected] = React.useState<string[]>([])
  const timer = React.useRef<number | null>(null)
  const script = React.useMemo(() => dictationFor(visit, pet), [visit, pet])
  const tutor = tutorOf(visit)
  const notesRef = React.useRef<HTMLTextAreaElement>(null)

  const stop = React.useCallback(
    (complete: boolean) => {
      if (timer.current) window.clearInterval(timer.current)
      timer.current = null
      setDictating(false)
      if (complete) {
        const add = script.detect.filter((s) => !draft.symptoms.includes(s))
        if (add.length) {
          patch((d) => ({ symptoms: [...d.symptoms.filter((x) => (add.includes('Sem queixas') ? true : x !== 'Sem queixas')), ...add] }))
          setDetected(add)
        }
      }
    },
    [script, draft.symptoms, patch],
  )

  React.useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current)
  }, [])

  const start = () => {
    if (dictating) return stop(true)
    const base = draft.notes.trim()
    const words = script.text.split(' ')
    let i = 0
    setDictating(true)
    setDetected([])
    timer.current = window.setInterval(() => {
      i++
      patch({ notes: (base ? base + ' ' : '') + words.slice(0, i).join(' ') })
      const el = notesRef.current
      if (el) el.scrollTop = el.scrollHeight
      if (i >= words.length) stop(true)
    }, 85)
  }

  const toggle = (s: string) =>
    patch((d) => {
      if (s === 'Sem queixas') return { symptoms: d.symptoms.includes(s) ? [] : ['Sem queixas'] }
      const has = d.symptoms.includes(s)
      return { symptoms: has ? d.symptoms.filter((x) => x !== s) : [...d.symptoms.filter((x) => x !== 'Sem queixas'), s] }
    })

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow="Etapa 1 de 5" title="Anamnese">
          Relato de {firstName(tutor.name)}
        </StepIntro>
      }
      left={
        <>
      <Block title="Queixa principal" hint="Do pedido de agendamento">
        <TextArea value={draft.complaint} onChange={(e) => patch({ complaint: e.target.value })} rows={2} />
      </Block>

      <Block title="Relato do tutor" className={cn(dictating && 'ring-2 ring-lime')}>
        <div className="relative">
          <TextArea ref={notesRef} value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} rows={5} placeholder="Toque no microfone e fale" />
          {dictating && <motion.span className="pointer-events-none absolute right-4 bottom-4 h-5 w-[2px] bg-black" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />}
        </div>
        <Pressable onClick={start} className={cn('mt-3 flex h-[68px] w-full items-center gap-3 rounded-full pr-5 pl-2 text-left transition-colors', dictating ? 'bg-black text-white' : 'bg-muted text-ink active:bg-muted-2')}>
          <span className={cn('relative flex size-[52px] shrink-0 items-center justify-center rounded-full', dictating ? 'bg-lime text-ink' : 'bg-black text-white')}>
            {dictating && <motion.span className="absolute inset-0 rounded-full bg-lime" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />}
            {dictating ? <Square className="relative size-4" fill="currentColor" /> : <Mic className="size-[22px]" strokeWidth={2} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-bold">{dictating ? 'Ouvindo' : draft.notes ? 'Continuar ditando' : 'Ditar por voz'}</span>
            <span className={cn('block text-[13px] font-medium', dictating ? 'text-white/55' : 'text-ink-3')}>{dictating ? 'Toque para parar' : 'Funciona sem internet'}</span>
          </span>
          {dictating && <Waveform />}
        </Pressable>
      </Block>
        </>
      }
      right={
      <Block title="Sintomas">
        <AnimatePresence>
          {detected.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="overflow-hidden">
              <div className="mb-3 rounded-[20px] bg-blue-soft px-4 py-3">
                <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-blue">
                  <AudioLines className="size-3.5" strokeWidth={2.4} /> Reconhecido no ditado
                </div>
                <div className="mt-0.5 text-[14.5px] font-bold text-ink">{detected.join(', ')}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS[pet.species].map((s) => (
            <Chip key={s} on={draft.symptoms.includes(s)} onClick={() => toggle(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </Block>
      }
    />
  )
}
