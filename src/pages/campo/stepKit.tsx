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

/* Blocos reutilizados pelas etapas */

export function Block({ title, hint, children, className, bodyClassName, action }: { title?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; action?: React.ReactNode }) {
  return (
    <section className={cn('mx-4 mt-3 rounded-[28px] bg-card shadow-card transition-shadow', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="min-w-0">
            {title && <h3 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h3>}
            {hint && <div className="mt-0.5 text-[13px] font-medium text-ink-3">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      <div className={cn('px-5 pt-3 pb-5', bodyClassName)}>{children}</div>
    </section>
  )
}

export function StepIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="px-5 pt-3 pb-1">
      <div className="text-[13px] font-semibold text-ink-3">{eyebrow}</div>
      <h2 className="mt-0.5 text-[28px] leading-tight font-bold tracking-[-0.03em] text-ink">{title}</h2>
      {children && <p className="mt-1 text-[14px] leading-snug font-medium text-ink-3">{children}</p>}
    </div>
  )
}

/** Campo de texto grande em fundo cinza */
export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea
    ref={ref}
    className={cn('w-full resize-none rounded-[20px] bg-muted px-4 py-3.5 text-[16px] leading-[1.5] font-medium text-ink outline-none placeholder:text-ink-4 focus:bg-card focus:ring-2 focus:ring-black', className)}
    {...p}
  />
))
TextArea.displayName = 'TextArea'
