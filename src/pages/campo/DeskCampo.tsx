// Atendimento no computador: visita, registro e resumo dentro do AppShell. Aberto a partir de uma visita.
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConnectivityBanner } from './kit'
import { DeskVisit } from './DeskVisit'
import { DeskRecord } from './DeskRecord'
import { DeskDone } from './DeskDone'

export function DeskCampo() {
  return (
    <div className="px-4 pt-1 pb-8 md:px-6">
      <ConnectivityBanner flush />
      <Routes>
        <Route index element={<Navigate to="/" replace />} />
        <Route path="visita/:id" element={<DeskVisit />} />
        <Route path="visita/:id/atendimento" element={<DeskRecord />} />
        <Route path="visita/:id/concluido" element={<DeskDone />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
