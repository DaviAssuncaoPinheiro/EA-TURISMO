// Painel ao lado do celular (só desktop): etapa atual, seletor de veterinário e modo sem sinal.
import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Lightbulb, RotateCcw, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { Segmented, VetAvatar } from '@/components/ui'
import { PET, VET, VETS } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { useDemo } from '@/store'
import { useCampo } from './campoStore'
import { petOf, routeKm, vetVisitsToday, visitById, zonesOfDay } from './data'
import { EASE_OUT, Toggle } from './kit'
import { depthOf, useVetId } from './nav'

interface Copy {
  title: string
  line: string
  tip?: string
  links?: { to: string; label: string }[]
}

const STEP_COPY: Copy[] = [
  { title: 'Anamnese', line: 'Relato por voz, sintomas marcados sozinhos.', tip: 'Toque em Ditar por voz.' },
  { title: 'Exame físico', line: 'Sinais vitais com referência por espécie.', tip: 'Toque no tórax da silhueta.' },
  { title: 'Vacinas', line: 'Lote e validade lidos pela câmera.', tip: 'Ligue a vacina atrasada.' },
  { title: 'Prescrição', line: 'Dose, frequência e duração em toques.', tip: 'Toque em Adicionar medicamento.' },
  { title: 'Retorno', line: 'Lembretes sugeridos a partir desta visita.', tip: 'Toque em Finalizar atendimento.' },
]

type Stage = '0' | '1' | '2' | '3'

function useStage() {
  const loc = useLocation()
  const vetId = useVetId()
  const status = useDemo((s) => s.visitStatus)
  const depth = depthOf(loc.pathname)
  const id = loc.pathname.split('/')[3]
  const visit = id ? visitById(id) : undefined
  const step = useCampo((s) => (id ? (s.drafts[id]?.step ?? 0) : 0))
  const vs = vetVisitsToday(vetId)
  const focus = visit ?? vs.find((v) => status[v.id] === 'em-atendimento') ?? vs.find((v) => status[v.id] === 'a-caminho') ?? vs.find((v) => status[v.id] === 'agendada')

  let copy: Copy
  if (depth === 0) {
    copy = { title: 'Rota de hoje', line: `${vs.length} visitas em ${Math.round(routeKm(vetId))} km, agrupadas por zona.`, tip: focus ? `Toque em ${status[focus.id] === 'em-atendimento' ? 'Continuar' : 'Ver visita'} no cartão de ${petOf(focus).name}.` : undefined }
  } else if (depth === 1 && visit) {
    const st = status[visit.id]
    copy = {
      title: `Visita de ${petOf(visit).name}`,
      line: 'Alertas, tutor e endereço em uma tela.',
      tip: st === 'agendada' ? 'Toque em Estou a caminho.' : st === 'em-atendimento' ? 'Toque em Continuar atendimento.' : st === 'a-caminho' ? 'Toque em Cheguei e depois em Iniciar.' : undefined,
    }
  } else if (depth === 2 && visit) {
    copy = STEP_COPY[step]
  } else {
    const pet = visit ? petOf(visit) : PET.bob
    copy = {
      title: 'Tudo salvo na ficha',
      line: 'Peso, vacinas e lembretes já aparecem no painel.',
      links: [
        { to: `/pacientes/${pet.id}`, label: `Ficha de ${pet.name}` },
        { to: '/lembretes', label: 'Lembretes criados' },
      ],
    }
  }
  return { copy, stage: String(Math.min(depth, 3)) as Stage, focus, step, depth }
}

export function SidePanel({ height }: { height: number }) {
  const { copy, stage, focus, step, depth } = useStage()
  const vetId = useVetId()
  const nav = useNavigate()
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  const reset = useDemo((s) => s.reset)
  const finished = useCampo((s) => s.finished)
  const q = `?vet=${vetId}`

  const goStage = (s: Stage) => {
    const n = Number(s)
    if (n === 0) return nav(`/campo${q}`, { state: { dir: -1 } })
    if (!focus) return
    if (n === 1) return nav(`/campo/visita/${focus.id}${q}`, { state: { dir: n > Number(stage) ? 1 : -1 } })
    if (n === 2) {
      useCampo.getState().ensureDraft(focus)
      return nav(`/campo/visita/${focus.id}/atendimento${q}`, { state: { dir: n > Number(stage) ? 1 : -1 } })
    }
    if (finished[focus.id]) nav(`/campo/visita/${focus.id}/concluido${q}`, { state: { dir: 1 } })
  }

  return (
    <aside className="flex w-[420px] shrink-0 flex-col gap-3" style={{ height }}>
      <div className="flex items-center justify-between">
        <Link to="/" className="group inline-flex h-10 items-center gap-2 rounded-full bg-card pr-4 pl-3 text-[13.5px] font-semibold text-ink shadow-pill transition-colors hover:bg-surface">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.2} /> Painel
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-[13.5px] font-semibold text-ink-2">App do veterinário</span>
          <LogoMark size={34} />
        </div>
      </div>

      {/* etapa atual */}
      <div className="rounded-[28px] bg-card p-6 shadow-card">
        <Segmented<Stage>
          value={stage}
          onChange={goStage}
          className="w-full [&>button]:flex-1"
          options={[
            { value: '0', label: 'Rota' },
            { value: '1', label: 'Visita' },
            { value: '2', label: 'Registro' },
            { value: '3', label: 'Fim' },
          ]}
        />
        <AnimatePresence mode="wait">
          <motion.div key={copy.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE_OUT }} className="mt-7 min-h-[180px]">
            {depth === 2 && <div className="mb-1 text-[13px] font-semibold text-ink-3">Etapa {step + 1} de 5</div>}
            <h1 className="text-[32px] leading-[1.08] font-bold tracking-[-0.035em] text-ink">{copy.title}</h1>
            <p className="mt-2 text-[15px] leading-snug font-medium text-ink-3">{copy.line}</p>
            {copy.tip && (
              <div className="mt-6 flex items-center gap-3 rounded-[20px] bg-blue-soft px-4 py-3.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-black text-lime">
                  <Lightbulb className="size-4" strokeWidth={2.2} />
                </span>
                <span className="text-[14px] font-semibold text-ink">{copy.tip}</span>
              </div>
            )}
            {copy.links && (
              <div className="mt-6 flex flex-col gap-2">
                {copy.links.map((l, i) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn('group flex h-12 items-center justify-between rounded-full pr-2 pl-5 text-[14.5px] font-semibold transition-colors', i === 0 ? 'bg-black text-white hover:bg-black-2' : 'bg-muted text-ink hover:bg-muted-2')}
                  >
                    {l.label}
                    <span className={cn('flex size-8 items-center justify-center rounded-full', i === 0 ? 'bg-lime text-ink' : 'bg-card text-ink')}>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.2} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* seletor de veterinário */}
      <div className="mt-auto rounded-[28px] bg-card p-4 shadow-card">
        <div className="px-1 pb-3 text-[15px] font-bold tracking-[-0.01em] text-ink">Celular de</div>
        <div className="grid grid-cols-3 gap-2">
          {VETS.map((v) => {
            const vs = vetVisitsToday(v.id)
            const on = v.id === vetId
            return (
              <button
                key={v.id}
                onClick={() => nav(`/campo?vet=${v.id}`, { state: { dir: -1 } })}
                className={cn('flex flex-col items-center gap-1.5 rounded-[20px] px-2 pt-3.5 pb-3 text-center transition-colors', on ? 'bg-black text-white' : 'bg-surface text-ink hover:bg-muted')}
              >
                <VetAvatar vetId={v.id} size={44} className={cn(on && 'ring-2 ring-lime')} />
                <span className="w-full truncate text-[13.5px] font-bold">{VET[v.id].short}</span>
                <span className={cn('num inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold', on ? 'bg-white/12 text-white/80' : 'bg-card text-ink-3')}>
                  {vs.length} visitas
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 px-1">
          {zonesOfDay(vetVisitsToday(vetId)).map((z) => (
            <span key={z} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 text-[12px] font-semibold text-ink-2">
              <span className="size-1.5 rounded-full" style={{ background: ZONE[z].hex }} />
              {ZONE[z].name}
            </span>
          ))}
        </div>
      </div>

      {/* sem sinal */}
      <div className="flex items-center gap-3 rounded-[28px] bg-card px-4 py-3.5 shadow-card">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink">
          <WifiOff className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-bold text-ink">Sem sinal</div>
          <div className="text-[12.5px] font-medium text-ink-3">Simula área sem 4G</div>
        </div>
        <Toggle checked={offline} onChange={setOffline} label="Simular área sem sinal" />
      </div>

      <div className="flex items-center justify-between px-2 text-[12.5px] font-medium text-ink-3">
        <span>Dados simulados</span>
        <button
          onClick={() => {
            reset()
            useCampo.setState({ drafts: {}, arrived: {}, startedAt: {}, finished: {}, pending: 0, syncing: false })
            nav(`/campo?vet=${vetId}`, { state: { dir: -1 } })
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-card px-3 font-semibold text-ink-2 shadow-pill hover:text-ink"
        >
          <RotateCcw className="size-3.5" strokeWidth={2.2} /> Reiniciar
        </button>
      </div>
    </aside>
  )
}
