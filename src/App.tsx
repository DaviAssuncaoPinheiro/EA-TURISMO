import { HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/AppShell'
import { TooltipProvider } from './components/ui'
import { lazy, Suspense } from 'react'
import Hoje from './pages/Hoje'

const Agenda = lazy(() => import('./pages/Agenda'))
const Regioes = lazy(() => import('./pages/Regioes'))
const Pacientes = lazy(() => import('./pages/Pacientes'))
const Paciente = lazy(() => import('./pages/Paciente'))
const Lembretes = lazy(() => import('./pages/Lembretes'))
const Campo = lazy(() => import('./pages/campo/Campo'))

export default function App() {
  return (
    <TooltipProvider>
      <HashRouter>
        <Suspense fallback={<div className="h-dvh bg-surface" />}>
        <Routes>
          <Route path="/campo/*" element={<Campo />} />
          <Route element={<AppShell />}>
            <Route index element={<Hoje />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="regioes" element={<Regioes />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<Paciente />} />
            <Route path="lembretes" element={<Lembretes />} />
          </Route>
        </Routes>
        </Suspense>
      </HashRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: { description: '!text-white/65' },
          style: { background: 'var(--color-black)', color: '#fff', border: 'none', borderRadius: 18, fontFamily: 'var(--font-sans)' },
        }}
      />
    </TooltipProvider>
  )
}
