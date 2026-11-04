// Tela final · resumo do atendimento
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Banknote, Bell, Check, CloudOff, CreditCard, FileText, MessageCircle, Navigation, QrCode, Scale, Syringe, X } from 'lucide-react'
import { brl, cn, firstName, kg } from '@/lib/utils'
import { PetAvatar } from '@/components/ui'
import { PET } from '@/data/mock'
import { fmt } from '@/data/time'
import { useDemo } from '@/store'
import { notify, useCampo } from './campoStore'
import { bairroOf, dateShort, legOf, nextStopAfter, tutorOf, visitById, vName } from './data'
import { Btn, EASE_OUT, Pressable, RoundBtn, Screen } from './kit'
import { useGo } from './nav'

function AnimatedCheck() {
  return (
    <div className="relative mx-auto size-[104px]">
      <motion.span className="absolute inset-0 rounded-full bg-lime" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: [0.4, 1.45, 1.3], opacity: [0, 0.7, 0] }} transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.35 }} />
      <svg viewBox="0 0 104 104" className="relative size-full">
        <motion.circle cx="52" cy="52" r="50" fill="var(--color-lime)" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }} style={{ transformOrigin: '52px 52px' }} />
        <motion.path d="M32 53 L 46 67 L 73 39" fill="none" stroke="var(--color-black)" strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.35 }} />
      </svg>
    </div>
  )
}

const PAY = [
  { k: 'Pix', icon: QrCode },
  { k: 'Crédito', icon: CreditCard },
  { k: 'Débito', icon: CreditCard },
  { k: 'Dinheiro', icon: Banknote },
]

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
      <Screen title="Atendimento" back={{ label: 'Voltar à rota', onClick: () => go('', { dir: -1 }) }}>
        <p className="p-6 text-[15px] font-medium text-ink-3">Este resumo não está mais neste aparelho.</p>
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

  const stats = [
    { icon: Scale, label: 'Peso', value: kg(f.weight), sub: delta ? `${delta > 0 ? '+' : '−'}${Math.abs(delta).toLocaleString('pt-BR')} kg` : 'Estável' },
    { icon: Syringe, label: 'Vacinas', value: String(f.doses.length), sub: f.doses.length ? f.doses.map((d) => vName(d.vaccineId)).join(', ') : 'Nenhuma hoje' },
    { icon: FileText, label: 'Receita', value: String(f.meds.length), sub: f.meds.length === 1 ? 'medicamento' : 'medicamentos' },
    { icon: Bell, label: 'Lembretes', value: String(f.reminders.length), sub: 'programados' },
  ]

  return (
    <Screen
      title=""
      right={
        <RoundBtn label="Voltar à rota" onClick={() => go('', { dir: -1 })}>
          <X className="size-[18px]" strokeWidth={2.2} />
        </RoundBtn>
      }
      footer={
        next ? (
          <Btn className="h-[58px] w-full text-[16.5px]" onClick={() => go(`/visita/${next.id}`, { dir: 1 })}>
            <Navigation className="size-[18px] text-lime" /> Ir para {PET[next.petIds[0]].name}
          </Btn>
        ) : (
          <Btn className="h-[58px] w-full text-[16.5px]" onClick={() => go('', { dir: -1 })}>
            Voltar à rota
          </Btn>
        )
      }
    >
      <div className="px-5 text-center">
        <AnimatedCheck />
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4, ease: EASE_OUT }} className="mt-5 text-[30px] leading-tight font-bold tracking-[-0.035em] text-ink">
          Atendimento concluído
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-1 text-[14.5px] font-medium text-ink-3">
          {pet.name} · {visit.type} · {f.durationMin} min
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.45, ease: EASE_OUT }}>
        {/* envio ao tutor */}
        <div className={cn('mx-4 mt-6 flex items-center gap-3 rounded-[24px] px-4 py-3.5', pending ? 'bg-black text-white' : 'bg-green-soft')}>
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', pending ? 'bg-white/10 text-lime' : 'bg-green text-white')}>
            {pending ? <CloudOff className="size-[18px]" /> : <MessageCircle className="size-[18px]" />}
          </span>
          <div className="min-w-0 flex-1">
            <div className={cn('text-[15px] font-bold', pending ? 'text-white' : 'text-ink')}>{pending ? 'Resumo na fila' : `Enviado para ${tutorFirst}`}</div>
            <div className={cn('text-[13px] font-medium', pending ? 'text-white/55' : 'text-ink-2')}>{pending ? 'Sai quando o sinal voltar' : 'Resumo, receita e lembretes'}</div>
          </div>
          {!pending && <Check className="size-5 text-green" strokeWidth={2.6} />}
        </div>

        {/* resumo em cartões */}
        <div className="mx-4 mt-3 grid grid-cols-2 gap-2.5">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.06, duration: 0.3, ease: EASE_OUT }} className="rounded-[24px] bg-card p-4 shadow-card">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-ink">
                  <s.icon className="size-4" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-semibold text-ink-3">{s.label}</span>
              </div>
              <div className="num mt-3 text-[26px] leading-none font-bold tracking-[-0.03em] text-ink">{s.value}</div>
              <div className="mt-1 truncate text-[12.5px] font-medium text-ink-3">{s.sub}</div>
            </motion.div>
          ))}
        </div>

        {f.reminders.length > 0 && (
          <div className="mx-4 mt-2.5 rounded-[24px] bg-card p-4 shadow-card">
            <div className="text-[13px] font-semibold text-ink-3">Próximos lembretes</div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {f.reminders.map((r) => (
                <span key={r.title} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12.5px] font-semibold text-ink">
                  {r.title} <span className="font-medium text-ink-3">{dateShort(r.dueDate)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* pagamento */}
        <div className="mx-4 mt-2.5 rounded-[28px] bg-card p-5 shadow-card">
          {f.lines.map((l) => (
            <div key={l.label} className="flex items-baseline justify-between py-1 text-[14px] font-medium">
              <span className="text-ink-2">{l.label}</span>
              <span className="num text-ink">{brl(l.value)}</span>
            </div>
          ))}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
            <span className="text-[15px] font-bold text-ink">Total</span>
            <span className="num text-[32px] leading-none font-bold tracking-[-0.03em] text-ink">{brl(total)}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PAY.map((p) => {
              const on = pay === p.k
              return (
                <Pressable
                  key={p.k}
                  scale={0.95}
                  onClick={() => !paid && setPay(p.k)}
                  className={cn('inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors', on ? 'bg-black text-white' : 'bg-muted text-ink-2')}
                >
                  <p.icon className={cn('size-4', on && 'text-lime')} strokeWidth={2} />
                  {p.k}
                </Pressable>
              )
            })}
          </div>
          <Btn
            tone={paid ? 'subtle' : 'lime'}
            className="mt-3 h-[52px] w-full"
            onClick={() => {
              if (paid) return
              setPaid(true)
              notify({ kind: 'app', title: 'Pagamento registrado', body: `${brl(total)} via ${pay}. Recibo enviado para ${tutorFirst}.` })
            }}
          >
            {paid ? (
              <>
                <Check className="size-5 text-green" strokeWidth={2.6} /> Pago via {pay}
              </>
            ) : pay === 'Pix' ? (
              'Enviar cobrança Pix'
            ) : (
              `Registrar ${pay.toLowerCase()}`
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
      <div className="px-6 pt-6 pb-3 text-[18px] font-bold tracking-[-0.02em] text-ink">Próxima parada</div>
      <Pressable scale={0.985} onClick={() => go(`/visita/${v.id}`, { dir: 1 })} className="mx-4 flex w-[calc(100%-2rem)] items-center gap-3 rounded-[28px] bg-black p-3 pr-4 text-left text-white">
        <PetAvatar pet={pet} size={56} className="rounded-[20px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[16.5px] font-bold">{pet.name}</div>
          <div className="truncate text-[13px] font-medium text-white/60">
            <span className="num">{fmt.time(v.start)}</span> · {bairroOf(v).name} · {leg.min} min
          </div>
        </div>
        <span className="flex size-11 items-center justify-center rounded-full bg-lime text-ink">
          <ArrowUpRight className="size-5" strokeWidth={2.2} />
        </span>
      </Pressable>
    </>
  )
}
