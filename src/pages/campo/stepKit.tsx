import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Pet, Visit } from '@/data/mock'
import type { Draft } from './campoStore'

export interface StepProps {
  visit: Visit
  pet: Pet
  draft: Draft
  patch: (p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void
}

/* ───────── Blocos reutilizados pelas etapas ───────── */

export function Block({ title, hint, children, className, action }: { title?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn('mx-4 mt-4 rounded-[20px] border border-line bg-card shadow-card', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-3.5">
          <div>
            {title && <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>}
            {hint && <div className="mt-0.5 text-[13.5px] text-ink-3">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      <div className="px-4 pt-2 pb-4">{children}</div>
    </section>
  )
}

export function StepIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 pt-4">
      <div className="text-[12.5px] font-semibold tracking-[0.05em] text-ink-3 uppercase">{eyebrow}</div>
      <h2 className="mt-1 font-display text-[26px] leading-tight font-semibold text-ink">{title}</h2>
      {children && <p className="mt-1 text-[14.5px] leading-snug text-ink-2">{children}</p>}
    </div>
  )
}
