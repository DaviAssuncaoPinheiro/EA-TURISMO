import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MessageCircle, Mic, Sparkles, Square } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { SYMPTOMS, dictationFor, tutorOf } from './data'
import { Chip, EASE_OUT, Pressable } from './kit'
import { Block, StepIntro, type StepProps } from './stepKit'

function Waveform() {
  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-terra-500"
          animate={{ height: [6, 8 + ((i * 7) % 15), 5, 10 + ((i * 5) % 12), 6] }}
          transition={{ duration: 0.9 + (i % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
        />
      ))}
    </span>
  )
}

export function StepAnamnese({ visit, pet, draft, patch }: StepProps) {
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
    <div className="pb-2">
      <StepIntro eyebrow="Etapa 1 de 5" title="O que o tutor conta">
        Fale com {firstName(tutor.name)} e deixe o celular transcrever. Os sintomas reconhecidos já entram marcados.
      </StepIntro>

      <Block title="Queixa principal" hint={<span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> Do pedido de agendamento</span>}>
        <textarea
          value={draft.complaint}
          onChange={(e) => patch({ complaint: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-[12px] border border-line bg-card-2 px-3 py-2.5 text-[16px] leading-snug text-ink outline-none focus:border-sage-500"
        />
      </Block>

      <Block title="Relato do tutor" className={cn(dictating && 'border-terra-200 ring-4 ring-terra-50')}>
        <div className="relative">
          <textarea
            ref={notesRef}
            value={draft.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={5}
            placeholder="Toque no microfone e fale normalmente…"
            className="w-full resize-none rounded-[12px] border border-line bg-card-2 px-3 py-2.5 text-[16px] leading-[1.5] text-ink outline-none placeholder:text-ink-4 focus:border-sage-500"
          />
          {dictating && <motion.span className="pointer-events-none absolute right-3 bottom-3 h-5 w-[2px] bg-terra-500" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />}
        </div>
        <Pressable
          onClick={start}
          className={cn('mt-3 flex h-[56px] w-full items-center gap-3 rounded-[16px] px-3 text-left transition-colors', dictating ? 'bg-terra-50' : 'bg-sage-50 active:bg-sage-100')}
        >
          <span className={cn('relative flex size-10 shrink-0 items-center justify-center rounded-full text-white', dictating ? 'bg-terra-600' : 'bg-sage-800')}>
            {dictating && <motion.span className="absolute inset-0 rounded-full bg-terra-500" animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />}
            {dictating ? <Square className="relative size-4" fill="currentColor" /> : <Mic className="size-5" strokeWidth={2} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className={cn('block text-[16px] font-semibold', dictating ? 'text-terra-700' : 'text-sage-900')}>{dictating ? 'Ouvindo…' : draft.notes ? 'Continuar ditando' : 'Ditar por voz'}</span>
            <span className="block text-[13px] text-ink-3">{dictating ? 'Toque para parar' : 'Funciona sem internet'}</span>
          </span>
          {dictating && <Waveform />}
        </Pressable>
      </Block>

      <Block title="Sintomas" hint="Toque para marcar">
        <AnimatePresence>
          {detected.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="overflow-hidden">
              <div className="mb-3 flex items-center gap-2 rounded-[12px] bg-terra-50 px-3 py-2 text-[13.5px] text-terra-700">
                <Sparkles className="size-4 shrink-0" />
                <span>
                  Reconhecido no ditado: <b className="font-semibold">{detected.join(', ')}</b>
                </span>
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
    </div>
  )
}
