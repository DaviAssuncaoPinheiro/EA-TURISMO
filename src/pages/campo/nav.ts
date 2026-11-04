import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { VET } from '@/data/mock'

export function useVetId() {
  const [sp] = useSearchParams()
  const v = sp.get('vet')
  return v && VET[v] ? v : 'larissa'
}

/** Navegação interna do app; dir força a direção da transição (1 = empurra, -1 = volta). */
export function useGo() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const vet = sp.get('vet')
  return React.useCallback(
    (to: string, opts?: { dir?: 1 | -1; replace?: boolean }) =>
      navigate(`/campo${to}${vet ? `?vet=${vet}` : ''}`, { state: { dir: opts?.dir }, replace: opts?.replace }),
    [navigate, vet],
  )
}

export function depthOf(pathname: string) {
  const parts = pathname.replace(/^\/campo\/?/, '').split('/').filter(Boolean)
  if (parts.length === 0) return 0
  if (parts.length <= 2) return 1
  return parts[2] === 'concluido' ? 3 : 2
}
