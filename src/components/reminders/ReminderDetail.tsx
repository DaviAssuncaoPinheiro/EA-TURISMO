import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck, CalendarClock, Pencil, RotateCcw, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, IconButton, PetAvatar, VetAvatar } from '@/components/ui'
import { BAIRRO } from '@/data/geo'
import { VET } from '@/data/mock'
import { fmt } from '@/data/time'
import { REMINDER_KIND, REMINDER_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { baseTemplate, buildMessage, dm, nextServiceDay, VARIABLES, varsOf, zoneName, type Item } from './data'
import { WhatsAppPhone } from './WhatsAppPhone'

/** Editor de mensagem: variáveis {assim} destacadas sobre o texto. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\{\w+\})/g).map((p, i) =>
        /^\{\w+\}$/.test(p) ? (
          <span key={i} className="rounded-[6px] bg-blue-soft text-blue shadow-[0_0_0_1.5px_var(--color-blue-soft)]">
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
  const font = 'px-3.5 py-3 text-[13px] leading-[1.55] whitespace-pre-wrap break-words font-sans'
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
      <Card className="mt-3 p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[14px] font-bold text-ink">Mensagem</span>
          <button onClick={onReset} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12px] font-semibold text-ink-2 hover:bg-muted-2">
            <RotateCcw size={12} strokeWidth={2} /> Restaurar
          </button>
        </div>
        <div className="grid rounded-[16px] bg-surface focus-within:ring-2 focus-within:ring-black">
          <div aria-hidden className={cn('pointer-events-none col-start-1 row-start-1 text-ink', font)}>
            <Highlighted text={value} />
            {'\n'}
          </div>
          <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} aria-label="Texto da mensagem" className={cn('col-start-1 row-start-1 h-full w-full resize-none overflow-hidden bg-transparent text-transparent caret-ink outline-none selection:bg-blue/20', font)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {VARIABLES.map((v) => (
            <button key={v} onClick={() => insert(v)} title={vars[v]} className="h-7 rounded-full bg-blue-soft px-2.5 text-[12px] font-semibold text-blue transition-colors hover:bg-[#d8e4ff]">
              {`{${v}}`}
            </button>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
      <span className="text-ink-3">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-right font-semibold text-ink">{children}</span>
    </div>
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
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <PetAvatar pet={pet} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-[22px] leading-none font-bold tracking-[-0.02em] text-ink">{pet.name}</h2>
            {item.isNew && <Badge tone="lime">Novo</Badge>}
          </div>
          <div className="mt-1.5 truncate text-[12.5px] text-ink-3">
            {tutor.name} · {tutor.phone}
          </div>
        </div>
        <IconButton tone="card" size={40} onClick={onClose} aria-label="Fechar">
          <X size={18} strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <Card className="divide-y divide-line px-4 py-1.5">
          <Row label={REMINDER_KIND[r.kind].label}>{r.title}</Row>
          <Row label="Vencimento">
            <span>{fmt.date(r.dueDate)}</span>
            <Badge tone={item.due.tone}>{item.due.label}</Badge>
          </Row>
          <Row label="Origem">{r.origin}</Row>
          <Row label="Veterinário">
            <VetAvatar vetId={r.createdBy} size={22} /> {VET[r.createdBy].short}
          </Row>
          <Row label="Status">
            <Badge tone={st.tone} dot>{st.label}</Badge>
          </Row>
          {svc && (
            <Row label="Dia sugerido">
              {BAIRRO[tutor.bairro].name}, {svc.label} <span className="font-medium text-ink-3">({zoneName(item.zone)})</span>
            </Row>
          )}
          {r.status === 'programado' && <Row label="Envio">{dm(r.sendDate)}</Row>}
        </Card>

        <div className="mt-3 rounded-[24px] bg-muted px-3 py-6">
          <WhatsAppPhone item={item} message={buildMessage(item, tpl)} onQuick={(b) => toast(`Resposta rápida: “${b}”`, { description: 'O tutor responde com um toque.' })} />
        </div>

        <AnimatePresence initial={false}>{editing && <MessageEditor item={item} value={tpl} onChange={(v) => onCustom(r.id, v)} onReset={() => onCustom(r.id, undefined)} />}</AnimatePresence>
      </div>

      <div className="flex flex-wrap items-center gap-2 bg-card px-5 py-3.5">
        <Button variant={editing ? 'lime' : 'subtle'} size="md" onClick={() => setEditing((v) => !v)} className="mr-auto">
          <Pencil size={15} strokeWidth={1.9} /> {editing ? 'Concluir' : 'Editar'}
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
            <CalendarCheck size={15} strokeWidth={1.9} /> Agendar
          </Button>
        )}
        {!done && (
          <Button variant="primary" size="md" onClick={send} disabled={r.status === 'enviado' || r.status === 'lido' || r.status === 'confirmado'}>
            <Send size={15} strokeWidth={1.9} /> {sent ? (r.status === 'sem-resposta' ? 'Reenviar' : 'Enviado') : 'Enviar agora'}
          </Button>
        )}
        {done && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green">
            <CalendarClock size={15} strokeWidth={1.9} /> Visita na agenda
          </span>
        )}
      </div>
    </div>
  )
}
