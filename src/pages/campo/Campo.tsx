// App do veterinário (rota /campo). Desktop: celular em moldura + painel editorial. Mobile: tela cheia.
import * as React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useDemo } from '@/store'
import { notify, useCampo } from './campoStore'
import { EASE_IOS, PhoneCtx, PhoneToaster } from './kit'
import { depthOf } from './nav'
import { PHONE, PhoneFrame } from './PhoneFrame'
import { SidePanel } from './SidePanel'
import RouteScreen from './RouteScreen'
import VisitScreen from './VisitScreen'
import RecordScreen from './RecordScreen'
import DoneScreen from './DoneScreen'

function useMedia(q: string) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(q).matches : false)
  const [m, setM] = React.useState(get)
  React.useEffect(() => {
    const mq = window.matchMedia(q)
    const f = () => setM(mq.matches)
    mq.addEventListener('change', f)
    f()
    return () => mq.removeEventListener('change', f)
  }, [q])
  return m
}

function usePhoneScale() {
  const [s, setS] = React.useState(1)
  React.useEffect(() => {
    const f = () => setS(Math.min(1, (window.innerHeight - 36) / (PHONE.h + PHONE.bezel * 2)))
    f()
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])
  return s
}

/** Fila offline: ao perder o sinal acumula registros; ao voltar, sincroniza com animação. */
function useSyncEngine() {
  const offline = useDemo((s) => s.offline)
  const prev = React.useRef(offline)
  React.useEffect(() => {
    const c = useCampo.getState()
    if (offline && !prev.current) {
      c.setPending((p) => Math.max(p, 2))
      notify({ kind: 'offline', title: 'Sem sinal', body: 'Pode seguir atendendo. Tudo fica salvo no aparelho e sobe quando o sinal voltar.' })
    } else if (offline && prev.current && c.pending === 0) {
      c.setPending(2)
    } else if (!offline && prev.current) {
      const n = c.pending
      if (n > 0) {
        c.setSyncing(true)
        const t = window.setTimeout(() => {
          c.setSyncing(false)
          c.setPending(0)
          notify({ kind: 'sync', title: 'Tudo sincronizado', body: `${n} ${n === 1 ? 'registro enviado' : 'registros enviados'}. Ficha, agenda e lembretes atualizados na clínica.` })
        }, 1900)
        prev.current = offline
        return () => window.clearTimeout(t)
      }
    }
    prev.current = offline
  }, [offline])
}

const T = { duration: 0.46, ease: EASE_IOS }
const screenVariants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-28%', zIndex: d > 0 ? 2 : 1 }),
  center: (d: number) => ({ x: '0%', zIndex: d > 0 ? 2 : 1, transition: { x: T, zIndex: { duration: 0 } } }),
  exit: (d: number) => ({ x: d > 0 ? '-28%' : '100%', zIndex: d > 0 ? 1 : 2, transition: { x: T, zIndex: { duration: 0 } } }),
}

function AppRoutes() {
  const location = useLocation()
  const depth = depthOf(location.pathname)
  const prev = React.useRef(depth)
  const forced = (location.state as { dir?: number } | null)?.dir
  const dir = forced ?? (depth >= prev.current ? 1 : -1)
  React.useEffect(() => {
    prev.current = depth
  }, [depth])

  return (
    <AnimatePresence initial={false} custom={dir}>
      <motion.div
        key={location.pathname}
        custom={dir}
        variants={screenVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="absolute inset-0 overflow-hidden bg-paper shadow-[-10px_0_30px_-12px_rgba(20,42,33,.25)]"
      >
        <Routes location={location}>
          <Route index element={<RouteScreen />} />
          <Route path="visita/:id" element={<VisitScreen />} />
          <Route path="visita/:id/atendimento" element={<RecordScreen />} />
          <Route path="visita/:id/concluido" element={<DoneScreen />} />
          <Route path="*" element={<RouteScreen />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Campo() {
  const desktop = useMedia('(min-width: 1024px)')
  const offline = useDemo((s) => s.offline)
  const scale = usePhoneScale()
  const [root, setRoot] = React.useState<HTMLDivElement | null>(null)
  useSyncEngine()

  React.useEffect(() => {
    const t = document.title
    document.title = 'App do veterinário · Vet Domicílio'
    return () => {
      document.title = t
    }
  }, [])

  const app = (
    <PhoneCtx.Provider value={{ framed: desktop, root }}>
      <AppRoutes />
      <PhoneToaster />
    </PhoneCtx.Provider>
  )

  if (!desktop) {
    return (
      <div
        ref={setRoot}
        className="fixed inset-0 overflow-hidden bg-paper"
        style={{ transform: 'translateZ(0)', ['--sat' as string]: 'max(env(safe-area-inset-top), 4px)', ['--sab' as string]: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {app}
      </div>
    )
  }

  const fw = PHONE.w + PHONE.bezel * 2
  const fh = PHONE.h + PHONE.bezel * 2
  return (
    <div className="relative flex min-h-dvh items-center justify-center gap-[clamp(40px,7vw,120px)] overflow-hidden bg-paper px-10 py-[18px]">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -right-40 -bottom-56 size-[720px] rounded-full bg-sage-100/50 blur-3xl" />
      <div className="relative">
        <SidePanel />
      </div>
      <div className="relative shrink-0" style={{ width: fw * scale, height: fh * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <PhoneFrame ref={setRoot} offline={offline}>
            {app}
          </PhoneFrame>
        </div>
      </div>
    </div>
  )
}
