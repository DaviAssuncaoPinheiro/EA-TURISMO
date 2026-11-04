// Painel editorial ao lado do celular (só desktop): explica o passo atual da demonstração.
import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Check, RotateCcw, WifiOff } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { VetAvatar } from '@/components/ui'
import { PET, VET, VETS } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { useDemo } from '@/store'
import { useCampo } from './campoStore'
import { petOf, routeKm, vetVisitsToday, visitById, zonesOfDay } from './data'
import { EASE_OUT, Toggle } from './kit'
import { depthOf, useVetId } from './nav'
import { STEPS } from './RecordScreen'

interface Copy {
  eyebrow: string
  title: string
  body: React.ReactNode
  tip?: React.ReactNode
  links?: { to: string; label: string }[]
}

const STEP_COPY: { title: string; body: string; tip?: string }[] = [
  { title: 'Registrar sem largar o paciente', body: 'O veterinário fala e o celular transcreve. A queixa já vem do pedido de agendamento feito pelo WhatsApp.', tip: 'Toque em “Ditar por voz”: os sintomas citados na fala entram marcados sozinhos.' },
  { title: 'Exame físico com o polegar', body: 'Botões grandes, referência por espécie e comparação automática com o último peso. Valores fora da faixa ficam em vermelho.', tip: 'Toque no tórax da silhueta para marcar um achado com pino numerado.' },
  { title: 'Vacina com lote lido pela câmera', body: 'Só aparece o que pede atenção. O lote e a validade vão direto para a carteira digital, sem digitar nada.', tip: 'Ligue “Aplicar agora” numa vacina vencida e veja a leitura da etiqueta.' },
  { title: 'Receita pronta em segundos', body: 'Medicamentos da lista da clínica, dose e duração em toques. A receita é montada na hora e segue em PDF para o tutor.' },
  { title: 'O sistema sugere, o veterinário confirma', body: 'Com base no que foi feito na visita, o app propõe os lembretes e já mostra a mensagem que o tutor vai receber, sugerindo o dia em que a equipe estará no bairro.', tip: 'Toque em “Finalizar atendimento” para gravar tudo na ficha.' },
]

function useCopy(): { copy: Copy; stage: number } {
  const loc = useLocation()
  const vetId = useVetId()
  const vet = VET[vetId]
  const status = useDemo((s) => s.visitStatus)
  const depth = depthOf(loc.pathname)
  const id = loc.pathname.split('/')[3]
  const visit = id ? visitById(id) : undefined
  const step = useCampo((s) => (id ? s.drafts[id]?.step ?? 0 : 0))
  const art = vet.short.startsWith('Dra') ? 'da' : 'do'

  if (depth === 0) {
    const vs = vetVisitsToday(vetId)
    const done = vs.filter((v) => status[v.id] === 'concluida')
    const current = vs.find((v) => status[v.id] === 'em-atendimento') ?? vs.find((v) => status[v.id] === 'a-caminho')
    const zones = zonesOfDay(vs).map((z) => ZONE[z].short)
    return {
      stage: 0,
      copy: {
        eyebrow: 'A rota do dia',
        title: `Você está vendo o celular ${art} ${vet.short}`,
        body: (
          <>
            São 10h40 em Manaus. {firstName(vet.name)} atende hoje na {zones.join(' e na ')}: {vs.length} visitas em {Math.round(routeKm(vetId))} km, organizadas por bairro para não cruzar a cidade.
            {done.length > 0 && <> Já concluiu {done.map((v) => petOf(v).name).join(', ')}.</>}
          </>
        ),
        tip: current ? <>Toque no cartão {status[current.id] === 'em-atendimento' ? 'escuro' : 'em destaque'} para abrir {status[current.id] === 'em-atendimento' ? 'o atendimento em andamento' : 'a visita'} de {petOf(current).name}.</> : 'Toque numa parada para ver os detalhes da visita.',
      },
    }
  }
  if (depth === 1 && visit) {
    const pet = petOf(visit)
    return {
      stage: 1,
      copy: {
        eyebrow: 'Antes de tocar a campainha',
        title: `Tudo sobre ${pet.name} em uma tela`,
        body: 'Alertas clínicos em destaque, temperamento, endereço com complemento e o histórico recente. Ligar, chamar no WhatsApp ou abrir a rota no Maps fica a um toque.',
        tip: status[visit.id] === 'agendada' ? '“Estou a caminho” avisa o tutor no WhatsApp com a previsão de chegada.' : status[visit.id] === 'em-atendimento' ? 'Toque em “Continuar atendimento” para registrar a consulta.' : undefined,
      },
    }
  }
  if (depth === 2 && visit) {
    const c = STEP_COPY[step]
    return { stage: 2, copy: { eyebrow: `Atendimento · ${STEPS[step]} · ${step + 1} de 5`, title: c.title, body: c.body, tip: c.tip } }
  }
  const pet = visit ? petOf(visit) : PET.bob
  return {
    stage: 3,
    copy: {
      eyebrow: 'Atendimento concluído',
      title: 'Agora veja o outro lado',
      body: `O que foi registrado no celular já está no sistema da clínica: evento na linha do tempo de ${pet.name}, peso novo, vacina na carteira e lembretes programados para o tutor.`,
      links: [
        { to: `/pacientes/${pet.id}`, label: `Abrir a ficha de ${pet.name}` },
        { to: '/lembretes', label: 'Ver os lembretes criados' },
      ],
    },
  }
}

export function SidePanel() {
  const { copy, stage } = useCopy()
  const vetId = useVetId()
  const nav = useNavigate()
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  const reset = useDemo((s) => s.reset)

  const stages = ['Rota do dia', 'Visita', 'Atendimento', 'Concluído']

  return (
    <aside className="flex w-[400px] shrink-0 flex-col gap-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="group inline-flex h-9 items-center gap-1.5 rounded-md pr-3 pl-2 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Voltar ao painel
        </Link>
        <div className="flex items-center gap-2">
          <LogoMark size={26} />
          <span className="text-[13px] font-medium text-ink-3">App do veterinário</span>
        </div>
      </div>

      <div>
        <ol className="mb-5 flex items-center gap-2">
          {stages.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={cn('flex h-6 items-center gap-1 rounded-full px-2 text-[11.5px] font-semibold transition-colors', i < stage ? 'bg-sage-100 text-sage-800' : i === stage ? 'bg-sage-900 text-paper' : 'bg-paper-2 text-ink-4')}>
                {i < stage && <Check className="size-3" strokeWidth={3} />}
                {s}
              </span>
              {i < stages.length - 1 && <span className="h-px w-3 bg-line-2" />}
            </li>
          ))}
        </ol>
        <AnimatePresence mode="wait">
          <motion.div key={copy.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE_OUT }}>
            <div className="eyebrow mb-2">{copy.eyebrow}</div>
            <h1 className="font-display text-[38px] leading-[1.04] font-medium text-ink">{copy.title}</h1>
            <p className="mt-4 text-[15.5px] leading-[1.6] text-ink-2">{copy.body}</p>
            {copy.tip && (
              <div className="mt-5 flex items-start gap-3 rounded-lg border border-terra-200 bg-terra-50 px-4 py-3 text-[14px] leading-snug text-terra-700">
                <ArrowRight className="mt-0.5 size-4 shrink-0" />
                <span>{copy.tip}</span>
              </div>
            )}
            {copy.links && (
              <div className="mt-5 flex flex-col gap-2">
                {copy.links.map((l, i) => (
                  <Link key={l.to} to={l.to} className={cn('group flex h-11 items-center justify-between rounded-lg px-4 text-[14px] font-semibold transition-colors', i === 0 ? 'bg-sage-800 text-paper hover:bg-sage-900' : 'border border-line-2 bg-card text-ink hover:bg-card-2')}>
                    {l.label}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div>
        <div className="eyebrow mb-2">Ver o celular de</div>
        <div className="flex flex-col gap-1.5">
          {VETS.map((v) => {
            const vs = vetVisitsToday(v.id)
            const zones = zonesOfDay(vs)
            const on = v.id === vetId
            return (
              <button
                key={v.id}
                onClick={() => nav(`/campo?vet=${v.id}`, { state: { dir: -1 } })}
                className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors', on ? 'border-sage-700 bg-card shadow-card' : 'border-line bg-card/50 hover:border-line-2 hover:bg-card')}
              >
                <VetAvatar vetId={v.id} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{v.name}</span>
                  <span className="flex items-center gap-1.5 text-[12.5px] text-ink-3">
                    {vs.length} visitas ·
                    {zones.map((z) => (
                      <span key={z} className="inline-flex items-center gap-1">
                        <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
                        {ZONE[z].short}
                      </span>
                    ))}
                  </span>
                </span>
                {on && <Check className="size-4 text-sage-700" strokeWidth={2.4} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3">
        <WifiOff className="size-[18px] shrink-0 text-ink-3" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink">Simular área sem sinal</div>
          <div className="text-[12.5px] leading-snug text-ink-3">Condomínios e casas sem 4G: o app continua funcionando e sincroniza depois.</div>
        </div>
        <Toggle checked={offline} onChange={setOffline} label="Simular área sem sinal" />
      </div>

      <div className="flex items-center justify-between text-[12.5px] text-ink-4">
        <span>Tudo aqui é simulado. Nenhuma mensagem sai de verdade.</span>
        <button
          onClick={() => {
            reset()
            useCampo.setState({ drafts: {}, arrived: {}, startedAt: {}, finished: {}, pending: 0, syncing: false })
            nav(`/campo?vet=${vetId}`, { state: { dir: -1 } })
          }}
          className="inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-paper-2 hover:text-ink-2"
        >
          <RotateCcw className="size-3" /> Reiniciar
        </button>
      </div>
    </aside>
  )
}
