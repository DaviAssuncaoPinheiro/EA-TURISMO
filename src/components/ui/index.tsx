import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { motion, useMotionValue, useSpring, useTransform, animate } from 'motion/react'
import { cn } from '@/lib/utils'
import { VET, type Pet } from '@/data/mock'

/* ───────────── Button ───────────── */

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'ghost' | 'subtle' | 'danger'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const btnBase =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium select-none transition-[background,color,box-shadow,transform] duration-150 ease-out active:translate-y-px disabled:opacity-45 disabled:pointer-events-none'
const btnVariants: Record<ButtonVariant, string> = {
  primary: 'bg-sage-800 text-paper hover:bg-sage-900 shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_1px_2px_rgba(20,42,33,.25)]',
  accent: 'bg-terra-600 text-white hover:bg-terra-700 shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_1px_2px_rgba(154,68,36,.3)]',
  outline: 'bg-card text-ink border border-line-2 hover:bg-card-2 hover:border-ink-4 shadow-card',
  ghost: 'text-ink-2 hover:bg-paper-2 hover:text-ink',
  subtle: 'bg-paper-2 text-ink hover:bg-line',
  danger: 'bg-late-bg text-late hover:bg-[#f0cdc5]',
}
const btnSizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-[12px] rounded-sm',
  sm: 'h-8 px-3 text-[13px] rounded-sm',
  md: 'h-9 px-3.5 text-[13.5px] rounded-md',
  lg: 'h-12 px-5 text-[15px] rounded-lg',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'outline', size = 'md', className, ...p }, ref) => (
  <button ref={ref} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...p} />
))
Button.displayName = 'Button'

/* ───────────── Badge ───────────── */

export type Tone = 'neutral' | 'sage' | 'terra' | 'ok' | 'warn' | 'late' | 'info' | 'dark'
const toneCls: Record<Tone, string> = {
  neutral: 'bg-paper-2 text-ink-2',
  sage: 'bg-sage-100 text-sage-800',
  terra: 'bg-terra-100 text-terra-700',
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  late: 'bg-late-bg text-late',
  info: 'bg-info-bg text-info',
  dark: 'bg-sage-900 text-paper',
}
export function Badge({ tone = 'neutral', dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex h-[22px] items-center gap-1.5 rounded-full px-2 text-[11.5px] font-medium leading-none whitespace-nowrap', toneCls[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

/* ───────────── Card ───────────── */

export function Card({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-line bg-card shadow-card', className)} {...p}>
      {children}
    </div>
  )
}

export function CardHeader({ title, eyebrow, action, className }: { title: React.ReactNode; eyebrow?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-4 pb-3', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      </div>
      {action}
    </div>
  )
}

/* ───────────── Avatares ───────────── */

const speciesTint: Record<string, string> = { cão: 'bg-terra-100 text-terra-700', gato: 'bg-sage-100 text-sage-800' }

export function PetAvatar({ pet, size = 40, ring, className }: { pet: Pet; size?: number; ring?: boolean; className?: string }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full', speciesTint[pet.species], ring && 'ring-2 ring-card', className)}
      style={{ width: size, height: size }}
    >
      {!failed ? (
        <img src={pet.photo} alt={pet.name} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
      ) : (
        <span className="font-display font-semibold" style={{ fontSize: size * 0.42 }}>
          {pet.name[0]}
        </span>
      )}
    </span>
  )
}

export function VetAvatar({ vetId, size = 28, className }: { vetId: string; size?: number; className?: string }) {
  const v = VET[vetId]
  return (
    <span
      title={v.name}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{ width: size, height: size, background: v.color, fontSize: size * 0.38 }}
    >
      {v.initials}
    </span>
  )
}

/* ───────────── Tooltip ───────────── */

export function Tip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-64 rounded-md bg-sage-950 px-2.5 py-1.5 text-[12px] leading-snug text-paper shadow-float data-[state=delayed-open]:animate-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
export const TooltipProvider = TooltipPrimitive.Provider

/* ───────────── Segmented control ───────────── */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'sm',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  const id = React.useId()
  return (
    <div className={cn('inline-flex rounded-md bg-paper-2 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-[7px] font-medium transition-colors',
            size === 'sm' ? 'h-7 px-2.5 text-[12.5px]' : 'h-8 px-3 text-[13px]',
            value === o.value ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {value === o.value && (
            <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-[7px] bg-card shadow-card" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />
          )}
          <span className="relative inline-flex items-center gap-1.5">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ───────────── Número animado ───────────── */

export function NumberTicker({ value, decimals = 0, className, prefix = '', suffix = '' }: { value: number; decimals?: number; className?: string; prefix?: string; suffix?: string }) {
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 90, damping: 22 })
  const text = useTransform(spring, (n) => prefix + n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix)
  React.useEffect(() => {
    mv.set(value)
  }, [value, mv])
  return <motion.span className={cn('num', className)}>{text}</motion.span>
}

/** anima de 0 → valor uma única vez (para KPIs) */
export function CountUp({ to, decimals = 0, duration = 1.1, className }: { to: number; decimals?: number; duration?: number; className?: string }) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    const c = animate(0, to, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setN })
    return () => c.stop()
  }, [to, duration])
  return <span className={cn('num', className)}>{n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
}

/* ───────────── Anel de progresso ───────────── */

export function Ring({ value, size = 44, stroke = 4, color = 'var(--color-sage-600)', track = 'var(--color-paper-2)', children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </span>
  )
}

/* ───────────── Diversos ───────────── */

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-2 bg-card px-1 font-mono text-[10.5px] text-ink-3', className)}>{children}</kbd>
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 pb-6 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="font-display text-[30px] leading-[1.05] font-medium text-ink md:text-[36px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <div className="mb-1 text-ink-4">{icon}</div>}
      <div className="text-[14px] font-medium text-ink">{title}</div>
      {children && <div className="max-w-xs text-[13px] text-ink-3">{children}</div>}
    </div>
  )
}
