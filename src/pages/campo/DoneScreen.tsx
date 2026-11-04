// Tela final · resumo do atendimento
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Banknote, Bell, Check, ChevronRight, CloudOff, CreditCard, FileText, MessageCircle, Navigation, QrCode, Scale, Syringe, X } from 'lucide-react'
import { brl, cn, firstName, kg } from '@/lib/utils'
import { PetAvatar } from '@/components/ui'
import { PET, VACCINE } from '@/data/mock'
import { fmt } from '@/data/time'
import { useDemo } from '@/store'
import { notify, useCampo } from './campoStore'
import { bairroOf, legOf, nextStopAfter, tutorOf, visitById } from './data'
import { Btn, Chip, EASE_OUT, IconBtn, Pressable, Screen } from './kit'
import { useGo } from './nav'

function AnimatedCheck() {
  return (
    <div className="relative mx-auto size-[96px]">
      <motion.span className="absolute inset-0 rounded-full bg-ok/15" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.35, 1.2], opacity: [0, 0.8, 0] }} transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }} />
      <svg viewBox="0 0 96 96" className="relative size-full">
        <motion.circle cx="48" cy="48" r="44" fill="var(--color-ok)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }} style={{ transformOrigin: '48px 48px' }} />
        <motion.path d="M29 49 L 42 62 L 67 35" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.35 }} />
      </svg>
    </div>
  )
}

export default function DoneScreen() {
  const { id = '' } = useParams()
  const visit = visitById(id)
  const go = useGo()
  const f = useCampo((s) => s.finished[id])
  const status = useDemo((s) => s.visitStatus)
  const offline = useDemo((s) => s.offline)
  const [pay, setPay] = React.useState('Pix')
  const [paid, setPaid] = React.useState(false)

  if (!visit || !f) {
    return (
      <Screen title="Atendimento" back={{ label: 'Rota', onClick: () => go('', { dir: -1 }) }}>
        <p className="p-6 text-[15px] text-ink-3">Este resumo não está mais neste aparelho.</p>
      </Screen>
    )
  }
  const pet = PET[visit.petIds[0]]
  const tutor = tutorOf(visit)
  const tutorFirst = firstName(tutor.name)
  const total = f.lines.reduce((a, l) => a + l.value, 0)
  const next = nextStopAfter(visit, status)
  const delta = +(f.weight - f.prevWeight).toFixed(1)
  const pending = f.savedOffline && offline

  const items = [
    { icon: Scale, label: 'Peso registrado', value: `${kg(f.weight)}${delta ? ` (${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('pt-BR')} kg)` : ''}` },
    ...f.doses.map((d) => ({ icon: Syringe, label: VACCINE[d.vaccineId].name, value: `lote ${d.lot}`, mono: true })),
    ...(f.meds.length ? [{ icon: FileText, label: 'Receita', value: `${f.meds.length} ${f.meds.length === 1 ? 'medicamento' : 'medicamentos'}` }] : []),
    { icon: Bell, label: 'Lembretes programados', value: `${f.reminders.length}` },
  ]

  return (
    <Screen
      title="Atendimento concluído"
      right={
        <IconBtn label="Voltar à rota" onClick={() => go('', { dir: -1 })}>
          <X className="size-5" />
        </IconBtn>
      }
      footer={
        next ? (
          <Btn className="w-full" onClick={() => go(`/visita/${next.id}`, { dir: 1 })}>
            <Navigation className="size-[18px]" /> Ir para {PET[next.petIds[0]].name}
          </Btn>
        ) : (
          <Btn className="w-full" onClick={() => go('', { dir: -1 })}>
            Voltar à rota
          </Btn>
        )
      }
    >
      <div className="px-5 pt-3 text-center">
        <AnimatedCheck />
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4, ease: EASE_OUT }} className="mt-4 font-display text-[30px] leading-tight font-semibold text-ink">
          Atendimento concluído
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-1 text-[15px] text-ink-2">
          {pet.name} · {visit.type} · {f.durationMin} min
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.45, ease: EASE_OUT }}>
        <div className={cn('mx-4 mt-5 flex items-start gap-3 rounded-[18px] px-4 py-3.5', pending ? 'bg-ink text-paper' : 'bg-ok-bg')}>
          <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full', pending ? 'bg-white/10' : 'bg-[#2f8f5b] text-white')}>
            {pending ? <CloudOff className="size-[18px]" /> : <MessageCircle className="size-[18px]" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className={cn('text-[15.5px] font-semibold', pending ? 'text-paper' : 'text-ink')}>{pending ? 'Resumo na fila de envio' : 'Resumo enviado ao tutor por WhatsApp'}</div>
            <div className={cn('mt-0.5 text-[13.5px] leading-snug', pending ? 'text-sage-200' : 'text-ink-2')}>
              {pending ? `Sai para ${tutorFirst} assim que o celular reconectar.` : `${tutorFirst} recebeu o resumo, a receita em PDF e os próximos lembretes.`}
            </div>
          </div>
          {!pending && <Check className="mt-1 size-5 text-ok" strokeWidth={2.4} />}
        </div>

        <div className="mx-4 mt-3 overflow-hidden rounded-[20px] border border-line bg-card shadow-card">
          <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
            <PetAvatar pet={pet} size={36} />
            <div className="text-[15px] font-semibold text-ink">Ficha do {pet.name} atualizada</div>
          </div>
          {items.map((it, i) => (
            <motion.div key={it.label + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75 + i * 0.07, duration: 0.3 }} className="flex items-center gap-3 border-t border-line px-4 py-2.5">
              <it.icon className="size-[17px] shrink-0 text-ink-3" strokeWidth={1.9} />
              <span className="flex-1 text-[14.5px] text-ink-2">{it.label}</span>
              <span className={cn('text-[14.5px] font-semibold text-ink', 'mono' in it && it.mono && 'num font-mono text-[13.5px] font-medium')}>{it.value}</span>
            </motion.div>
          ))}
          {f.reminders.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-4 py-3">
              {f.reminders.map((r) => (
                <span key={r.title} className="rounded-full bg-paper-2 px-2.5 py-1 text-[12.5px] text-ink-2">
                  {r.title} · {fmt.short(r.dueDate)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mx-4 mt-3 rounded-[20px] border border-line bg-card px-4 py-3.5 shadow-card">
          {f.lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between py-1 text-[14.5px]">
              <span className="text-ink-2">{l.label}</span>
              <span className="num text-ink">{brl(l.value)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-[15px] font-semibold text-ink">Total da visita</span>
            <span className="num font-display text-[30px] leading-none font-semibold text-ink">{brl(total)}</span>
          </div>
          <div className="mt-4 mb-2 text-[13.5px] font-medium text-ink-3">Forma de pagamento</div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {[
              { k: 'Pix', icon: QrCode },
              { k: 'Crédito', icon: CreditCard },
              { k: 'Débito', icon: CreditCard },
              { k: 'Dinheiro', icon: Banknote },
            ].map((p) => (
              <Chip key={p.k} on={pay === p.k} onClick={() => !paid && setPay(p.k)}>
                {pay !== p.k && <p.icon className="size-4" />}
                {p.k}
              </Chip>
            ))}
          </div>
          <Btn
            tone={paid ? 'subtle' : 'outline'}
            className={cn('mt-3 w-full', paid && 'text-ok')}
            onClick={() => {
              if (paid) return
              setPaid(true)
              notify({ kind: 'app', title: 'Pagamento registrado', body: `${brl(total)} via ${pay} · ${tutor.name}. Recibo enviado por WhatsApp.` })
            }}
          >
            {paid ? (
              <>
                <Check className="size-5" /> Pago via {pay}
              </>
            ) : pay === 'Pix' ? (
              'Enviar cobrança Pix'
            ) : (
              `Registrar pagamento no ${pay.toLowerCase()}`
            )}
          </Btn>
        </div>

        {next && <NextStop visitId={next.id} />}
      </motion.div>
    </Screen>
  )
}

function NextStop({ visitId }: { visitId: string }) {
  const go = useGo()
  const v = visitById(visitId)!
  const pet = PET[v.petIds[0]]
  const leg = legOf(v)
  return (
    <>
      <div className="px-5 pt-6 pb-2 text-[13px] font-semibold tracking-[0.01em] text-ink-3 uppercase">Próxima parada</div>
      <Pressable scale={0.985} onClick={() => go(`/visita/${v.id}`, { dir: 1 })} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[20px] border border-line bg-card px-4 py-3.5 text-left shadow-card">
        <PetAvatar pet={pet} size={48} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-ink">
            {pet.name} · {bairroOf(v).name} · <span className="num">{fmt.time(v.start)}</span>
          </div>
          <div className="text-[14px] text-ink-2">
            {leg.min} min de carro · {leg.km.toLocaleString('pt-BR')} km · {v.type}
          </div>
        </div>
        <ChevronRight className="size-5 text-ink-4" />
      </Pressable>
    </>
  )
}
