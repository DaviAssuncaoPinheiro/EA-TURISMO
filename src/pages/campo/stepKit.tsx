import * as React from 'react'
import { cn } from '@/lib/utils'
import type { Pet, Visit } from '@/data/mock'
import type { Draft } from './campoStore'

/** mobile: uma coluna em tela de celular; desktop: largura de computador, em duas colunas */
export type StepLayout = 'mobile' | 'desktop'

export interface StepProps {
  visit: Visit
  pet: Pet
  draft: Draft
  patch: (p: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void
  layout?: StepLayout
}

const StepLayoutCtx = React.createContext<StepLayout>('mobile')
export const useStepLayout = () => React.useContext(StepLayoutCtx)
export const useIsDesk = () => React.useContext(StepLayoutCtx) === 'desktop'

/**
 * Estrutura de cada etapa. No celular empilha intro, esquerda e direita (mesma ordem de sempre).
 * No computador põe esquerda e direita lado a lado. `extra` recebe sheets e afins.
 */
export function StepFrame({ layout = 'mobile', intro, left, right, extra }: { layout?: StepLayout; intro: React.ReactNode; left: React.ReactNode; right?: React.ReactNode; extra?: React.ReactNode }) {
  if (layout === 'desktop') {
    return (
      <StepLayoutCtx.Provider value="desktop">
        {intro}
        <div className={cn('grid items-start gap-4', right ? 'grid-cols-2' : 'grid-cols-1')}>
          <div className="flex min-w-0 flex-col gap-4">{left}</div>
          {right && <div className="flex min-w-0 flex-col gap-4">{right}</div>}
        </div>
        {extra}
      </StepLayoutCtx.Provider>
    )
  }
  return (
    <div className="pb-2">
      {intro}
      {left}
      {right}
      {extra}
    </div>
  )
}

/* Blocos reutilizados pelas etapas */

export function Block({ title, hint, children, className, bodyClassName, action }: { title?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string; action?: React.ReactNode }) {
  const desk = useIsDesk()
  return (
    <section className={cn(desk ? 'rounded-[24px]' : 'mx-4 mt-3 rounded-[28px]', 'bg-card shadow-card transition-shadow', className)}>
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

/** Título de seção fora de cartão (ex.: "Receita", "Mensagem") */
export function SubHead({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  const desk = useIsDesk()
  return (
    <div className={cn('flex items-center justify-between', desk ? '-mb-1 px-1' : 'px-6 pt-6 pb-3')}>
      <h3 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{children}</h3>
      {aside}
    </div>
  )
}

export function StepIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  const desk = useIsDesk()
  if (desk)
    return (
      <div className="flex items-baseline gap-3 px-1 pb-4">
        <h2 className="text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">{title}</h2>
        {children && <p className="truncate text-[14px] font-medium text-ink-3">{children}</p>}
      </div>
    )
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
