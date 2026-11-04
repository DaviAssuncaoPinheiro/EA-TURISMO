import * as React from 'react'
import { cn } from '@/lib/utils'
import { hash, vetOf } from './model'

/** Tinta de carimbo por veterinário: azul e verde de almofada, já desbotados */
const INK: Record<string, string> = {
  larissa: '#2c6450',
  rafael: '#2b4f86',
  bianca: '#3a4790',
}

/**
 * Carimbo circular do CRMV, desenhado em SVG com texto em círculo
 * e um filtro de "tinta irregular" para não parecer vetor limpo.
 */
export function CrmvStamp({ vetId, seed, size = 76, date, className }: { vetId: string; seed: string; size?: number; date?: string; className?: string }) {
  const vet = vetOf(vetId)
  const raw = React.useId()
  const id = raw.replace(/[^a-zA-Z0-9]/g, '')
  const h = hash(seed)
  const rot = -18 + (h % 30)
  const ink = INK[vetId] ?? '#2b4f86'
  const crmvNum = vet.crmv.replace(/\D/g, '')
  const ring = `${vet.name.toUpperCase()} · MÉDICO VETERINÁRIO · `
    .replace('DRA. ', 'DRA ')
    .replace('DR. ', 'DR ')
    .replace('MÉDICO', vet.name.startsWith('Dra') ? 'MÉDICA' : 'MÉDICO')

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label={`Carimbo ${vet.crmv}, ${vet.name}`}
      role="img"
      className={cn('pointer-events-none select-none mix-blend-multiply', className)}
      style={{ transform: `rotate(${rot}deg)`, opacity: 0.82 }}
    >
      <defs>
        <filter id={`ink${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={h % 97} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="disp" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.95" result="mask" />
          <feComposite in="disp" in2="mask" operator="in" />
        </filter>
        <path id={`arc${id}`} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
      </defs>
      <g filter={`url(#ink${id})`} fill={ink} stroke={ink}>
        <circle cx="50" cy="50" r="47" fill="none" strokeWidth="2.6" />
        <circle cx="50" cy="50" r="31" fill="none" strokeWidth="1.1" />
        <text fontFamily="IBM Plex Mono, monospace" fontSize="7.6" fontWeight="500" letterSpacing="0.6" stroke="none">
          <textPath href={`#arc${id}`} startOffset="0" textLength={236} lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
        <text x="50" y="40" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="7" letterSpacing="1.4" stroke="none">
          CRMV-AM
        </text>
        <text x="50" y="56" textAnchor="middle" fontFamily="Fraunces Variable, Georgia, serif" fontSize="17" fontWeight="700" stroke="none">
          {crmvNum}
        </text>
        <line x1="34" y1="61" x2="66" y2="61" strokeWidth="0.9" />
        <text x="50" y="69.5" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="6" letterSpacing="0.8" stroke="none">
          {date ?? 'MANAUS · AM'}
        </text>
      </g>
    </svg>
  )
}
