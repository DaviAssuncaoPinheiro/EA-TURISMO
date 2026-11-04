import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck, CalendarClock, MapPin, Pencil, RotateCcw, Send, Sparkles, Stethoscope, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PetAvatar, VetAvatar } from '@/components/ui'
import { BAIRRO } from '@/data/geo'
import { VET } from '@/data/mock'
import { fmt } from '@/data/time'
import { REMINDER_KIND, REMINDER_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { baseTemplate, buildMessage, nextServiceDay, VARIABLES, varsOf, zoneHex, zoneName, type Item } from './data'
import { WhatsAppPhone } from './WhatsAppPhone'

/** Editor de mensagem: variáveis {assim} destacadas como chips sobre o texto. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((p, i) =>
        /^\{\w+\}$/.test(p) ? (
          <span key={i} className="rounded-[5px] bg-terra-100 text-terra-700 shadow-[0_0_0_1.5px_var(--color-terra-100)]">
            {p}
          </span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  )
}

function MessageEditor({ value, onChange, onReset, item }: { value: string; onChange: (v: string) => void; onReset: () => void; item: Item }) {
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const vars = varsOf(item)
  const insert = (v: string) => {
    const el = ref.current
    const tag = `{${v}}`
    if (!el) return onChange(value + tag)
    const a = el.selectionStart ?? value.length
    const b = el.selectionEnd ?? value.length
    onChange(value.slice(0, a) + tag + value.slice(b))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + tag.length, a + tag.length)
    })
  }
  const font = 'px-3 py-2.5 text-[13px] leading-[1.55] whitespace-pre-wrap break-words font-sans'
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
      <div className="mt-4 rounded-xl border border-line bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">Editar mensagem</span>
          <button onClick={onReset} className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink">
            <RotateCcw size={12} strokeWidth={1.8} /> Restaurar modelo
          </button>
        </div>
        <div className="grid rounded-lg border border-line-2 bg-card-2 focus-within:border-sage-600">
          <div aria-hidden className={cn('pointer-events-none col-start-1 row-start-1 text-ink', font)}>
            <Highlighted text={value} />
            {'\n'}
          </div>
          <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-label="Texto da mensagem" className={cn('col-start-1 row-start-1 h-full w-full resize-none overflow-hidden bg-transparent text-transparent caret-ink outline-none selection:bg-sage-200/70', font)} />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button key={v} onClick={() => insert(v)} title={vars[v]} className="rounded-md bg-terra-50 px-2 py-1 font-mono text-[11px] text-terra-700 ring-1 ring-terra-200 transition-colors hover:bg-terra-100">
              {`{${v}}`}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-ink-3">Toque numa variável para inserir. O texto é preenchido automaticamente para cada tutor.</p>
      </div>
    </motion.div>
  )
}

export function ReminderDetail({ item, custom, onCustom, onClose }: { item: Item; custom?: string; onCustom: (id: string, v: string | undefined) => void; onClose: () => void }) {
  const setStatus = useDemo((s) => s.setReminderStatus)
  const { r, pet, tutor } = item
  const [editing, setEditing] = React.useState(false)
  React.useEffect(() => setEditing(false), [r.id])
  const svc = nextServiceDay(item.zone, r.createdBy)
  const base = baseTemplate(item)
  const tpl = custom ?? base
  const st = REMINDER_STATUS[r.status]
  const sent = r.status !== 'programado'
  const done = r.status === 'agendado'

  const send = () => {
    setStatus(r.id, 'enviado')
    toast.success(`Mensagem enviada para ${tutor.name}`, { description: 'Entregue pelo WhatsApp Business.' })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* cabeçalho */}
      <div className="flex items-start gap-3 border-b border-line px-5 pt-4 pb-3.5">
        <PetAvatar pet={pet} size={46} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-display text-[22px] leading-none font-medium text-ink">{pet.name}</h2>
            <Badge tone={st.tone} dot>{st.label}</Badge>
            {item.isNew && <Badge tone="terra">Novo</Badge>}
          </div>
          <div className="mt-1 truncate text-[12.5px] text-ink-2">
            {tutor.name} · {tutor.phone}
          </div>
        </div>
        <button onClick={onClose} aria-label="Fechar" className="-mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink">
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-5">
        {/* o quê e por quê */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow mb-1">{REMINDER_KIND[r.kind].label}</div>
            <div className="text-[15px] font-semibold text-ink">{r.title}</div>
          </div>
          <Badge tone={item.due.tone}>{item.due.label}</Badge>
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-lg bg-sage-50 px-3 py-2.5 ring-1 ring-sage-100">
          <Stethoscope size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-sage-700" />
          <div className="min-w-0 text-[12.5px] leading-snug text-sage-900">
            <span className="font-medium">Nasceu da orientação do veterinário.</span> {r.origin}.
            <span className="mt-1.5 flex items-center gap-1.5 text-sage-700">
              <VetAvatar vetId={r.createdBy} size={18} /> {VET[r.createdBy].name} · vence em {fmt.date(r.dueDate)}
            </span>
          </div>
        </div>
        {svc && (
          <div className="mt-2 flex items-start gap-2.5 rounded-lg bg-terra-50 px-3 py-2.5 ring-1 ring-terra-100">
            <Sparkles size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-terra-600" />
            <div className="text-[12.5px] leading-snug text-ink-2">
              <span className="font-medium text-ink">A equipe estará em {BAIRRO[tutor.bairro].name} na {svc.label}.</span> A mensagem já oferece esse dia ao tutor.
              <span className="mt-1 flex items-center gap-1.5 text-ink-3">
                <MapPin size={12} strokeWidth={1.8} style={{ color: zoneHex(item.zone) }} /> Zona {zoneName(item.zone)} · {svc.vet.short}
              </span>
            </div>
          </div>
        )}

        {/* celular */}
        <div className="mt-5 rounded-2xl bg-paper-2/70 px-3 py-6 ring-1 ring-line">
          <WhatsAppPhone item={item} message={buildMessage(item, tpl)} onQuick={(b) => toast(`Resposta rápida: “${b}”`, { description: 'É assim que o tutor responde com um toque.' })} />
        </div>

        <AnimatePresence initial={false}>{editing && <MessageEditor item={item} value={tpl} onChange={(v) => onCustom(r.id, v)} onReset={() => onCustom(r.id, undefined)} />}</AnimatePresence>
      </div>

      {/* ações */}
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-card px-5 py-3">
        <Button variant={editing ? 'subtle' : 'ghost'} size="md" onClick={() => setEditing((v) => !v)} className="mr-auto">
          <Pencil size={15} strokeWidth={1.8} /> {editing ? 'Concluir edição' : 'Editar mensagem'}
        </Button>
        {!done && (
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setStatus(r.id, 'agendado')
              toast.success(`Visita de ${pet.name} marcada`, { description: svc ? `Encaixada na ${svc.label}.` : undefined })
            }}
          >
            <CalendarCheck size={15} strokeWidth={1.8} /> Marcar como agendado
          </Button>
        )}
        {!done && (
          <Button variant="accent" size="md" onClick={send} disabled={r.status === 'enviado' || r.status === 'lido' || r.status === 'confirmado'}>
            <Send size={15} strokeWidth={1.8} /> {sent ? (r.status === 'sem-resposta' ? 'Reenviar agora' : 'Enviado') : 'Enviar agora'}
          </Button>
        )}
        {done && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ok">
            <CalendarClock size={15} strokeWidth={1.8} /> Visita na agenda
          </span>
        )}
      </div>
    </div>
  )
}
