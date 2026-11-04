import * as React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Compass, X } from 'lucide-react'
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
    try { return localStorage.getItem('vd-guide-closed') !== '1' } catch { return true }
  })
  const loc = useLocation()
  const nav = useNavigate()
  const current = STEPS.findIndex((s) => (s.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(s.to)))
  const close = () => {
    setOpen(false)
    try { localStorage.setItem('vd-guide-closed', '1') } catch {}
  }
  if (loc.pathname.startsWith('/campo')) return null

  return (
    <div className="fixed right-4 bottom-20 z-40 lg:right-6 lg:bottom-6">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-[300px] rounded-xl border border-sage-800 bg-sage-900 p-4 text-paper shadow-float"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] font-medium tracking-wide text-sage-200 uppercase">
                <Compass className="size-3.5" /> Roteiro da demonstração
              </div>
              <button onClick={close} className="rounded p-1 text-sage-300 hover:bg-white/10 hover:text-paper"><X className="size-3.5" /></button>
            </div>
            <ol className="flex flex-col gap-1">
              {STEPS.map((s, i) => (
                <li key={s.to}>
                  <button
                    onClick={() => nav(s.to)}
                    className={cn('flex w-full gap-2.5 rounded-md p-2 text-left transition-colors', i === current ? 'bg-white/10' : 'hover:bg-white/5')}
                  >
                    <span className={cn('mt-px flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', i < current ? 'bg-sage-500 text-white' : i === current ? 'bg-terra-500 text-white' : 'bg-white/10 text-sage-200')}>
                      {i < current ? <Check className="size-3" /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium">{s.title}</span>
                      {i === current && <span className="mt-0.5 block text-[12px] leading-snug text-sage-200">{s.text}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="flex h-10 items-center gap-2 rounded-full bg-sage-900 px-4 text-[13px] font-medium text-paper shadow-float hover:bg-sage-950"
          >
            <Compass className="size-4" /> Roteiro
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
