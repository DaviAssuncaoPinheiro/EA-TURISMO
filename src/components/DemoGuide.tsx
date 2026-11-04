import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Compass, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { to: '/', title: 'O dia de hoje', text: 'Veja as visitas da equipe e clique em "Otimizar rota" para reorganizar o trajeto por bairro.' },
  { to: '/agenda', title: 'Agenda por região', text: 'Cada veterinário atende uma zona de Manaus por dia. Novos pedidos entram no dia em que a equipe já estará no bairro.' },
  { to: '/campo', title: 'Atendimento no celular', text: 'Abra a visita do Bob e registre o atendimento como o veterinário faria na casa do tutor.' },
  { to: '/pacientes/bob', title: 'Ficha do paciente', text: 'Tudo que foi registrado na visita aparece aqui: carteira de vacinação, peso e linha do tempo.' },
  { to: '/lembretes', title: 'Lembretes automáticos', text: 'As vacinas e os retornos geram mensagens de WhatsApp para o tutor no momento certo.' },
]

export function DemoGuide() {
  const [open, setOpen] = React.useState(() => {
    try { return localStorage.getItem('vd-guide-closed') !== '1' && window.innerWidth >= 1024 } catch { return window.innerWidth >= 1024 }
  })
  const loc = useLocation()
  const nav = useNavigate()
  const current = STEPS.findIndex((s) => (s.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(s.to)))
  const close = () => {
    setOpen(false)
    try { localStorage.setItem('vd-guide-closed', '1') } catch {}
  }
  if (loc.pathname.startsWith('/campo')) return null

  const step = STEPS[Math.max(0, current)]
  const idx = Math.max(0, current)
  const next = STEPS[idx + 1]

  return (
    <div className="fixed right-4 bottom-24 z-40 lg:right-6 lg:bottom-6">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-[min(300px,calc(100vw-2rem))] rounded-[22px] bg-black p-4 text-white shadow-float"
          >
            <div className="mb-2 flex items-center gap-2">
              <Compass className="size-3.5 text-white/50" />
              <span className="text-[12px] font-semibold text-white/50">Roteiro da demo · {idx + 1} de {STEPS.length}</span>
              <div className="ml-auto flex items-center gap-1">
                {STEPS.map((s, i) => (
                  <button key={s.to} aria-label={s.title} onClick={() => nav(s.to)} className={cn('h-1.5 rounded-full transition-all', i === idx ? 'w-4 bg-lime' : i < idx ? 'w-1.5 bg-white/60' : 'w-1.5 bg-white/20')} />
                ))}
                <button onClick={close} aria-label="Fechar roteiro" className="ml-1.5 rounded p-1 text-white/50 hover:bg-white/10 hover:text-paper"><X className="size-3.5" /></button>
              </div>
            </div>
            <div className="text-[14px] font-semibold">{step.title}</div>
            <p className="mt-1 text-[12.5px] leading-snug text-white/65">{step.text}</p>
            <div className="mt-3 flex items-center justify-end gap-2">
              {next ? (
                <button onClick={() => nav(next.to)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[12.5px] font-bold text-ink hover:bg-lime-2">
                  Próximo: {next.title} <ArrowRight className="size-3.5" />
                </button>
              ) : (
                <button onClick={close} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-lime px-3.5 text-[12.5px] font-bold text-ink hover:bg-lime-2">
                  <Check className="size-3.5" /> Concluir
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-black px-4 text-[13px] font-semibold text-white shadow-float hover:bg-black-2"
          >
            <Compass className="size-4" /> Roteiro
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
