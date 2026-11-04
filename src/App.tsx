import { HashRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppShell } from './components/AppShell'
import { TooltipProvider } from './components/ui'
import Hoje from './pages/Hoje'
import Agenda from './pages/Agenda'
import Regioes from './pages/Regioes'
import Pacientes from './pages/Pacientes'
import Paciente from './pages/Paciente'
import Lembretes from './pages/Lembretes'
import Campo from './pages/campo/Campo'

export default function App() {
  return (
    <TooltipProvider>
      <HashRouter>
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
      </HashRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: 'var(--color-sage-950)', color: 'var(--color-paper)', border: 'none', borderRadius: 12, fontFamily: 'var(--font-sans)' },
        }}
      />
    </TooltipProvider>
  )
}
