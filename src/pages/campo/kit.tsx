// Primitivos de interface do app de campo (tamanhos de toque de celular).
import * as React from 'react'
import { AnimatePresence, motion, useScroll, useTransform, type HTMLMotionProps } from 'motion/react'
import { Drawer } from 'vaul'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check, ChevronLeft, CloudOff, MessageCircle, Minus, Plus, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { useDemo } from '@/store'
import { useCampo, type Notice } from './campoStore'

/* ───────── Contexto do "aparelho" ───────── */

export const PhoneCtx = React.createContext<{ framed: boolean; root: HTMLElement | null }>({ framed: false, root: null })
export const usePhone = () => React.useContext(PhoneCtx)

export const EASE_IOS = [0.32, 0.72, 0, 1] as const
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/* ───────── Pressable: feedback tátil visual ───────── */

export const Pressable = React.forwardRef<HTMLButtonElement, HTMLMotionProps<'button'> & { scale?: number }>(({ className, scale = 0.97, ...p }, ref) => (
  <motion.button ref={ref} whileTap={{ scale }} transition={{ duration: 0.12 }} className={cn('select-none [-webkit-tap-highlight-color:transparent]', className)} {...p} />
))
Pressable.displayName = 'Pressable'

type BtnTone = 'primary' | 'accent' | 'outline' | 'subtle' | 'ghost' | 'dark'
const btnTone: Record<BtnTone, string> = {
  primary: 'bg-sage-800 text-paper shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_1px_2px_rgba(20,42,33,.25)] active:bg-sage-900',
  accent: 'bg-terra-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.14),0_1px_2px_rgba(154,68,36,.3)] active:bg-terra-700',
  outline: 'bg-card text-ink border border-line-2 shadow-card active:bg-card-2',
  subtle: 'bg-paper-2 text-ink active:bg-line',
  ghost: 'text-ink-2 active:bg-paper-2',
  dark: 'bg-sage-950 text-paper',
}

export function Btn({ tone = 'primary', className, children, ...p }: HTMLMotionProps<'button'> & { tone?: BtnTone }) {
  return (
    <Pressable className={cn('inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] px-5 text-[16px] font-semibold tracking-[-0.01em] transition-colors disabled:opacity-45', btnTone[tone], className)} {...p}>
      {children}
    </Pressable>
  )
}

/* ───────── Chip ───────── */

export function Chip({ on, onClick, children, className, size = 'md' }: { on?: boolean; onClick?: () => void; children: React.ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <Pressable
      scale={0.95}
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium transition-colors',
        size === 'md' ? 'h-11 px-4 text-[15px]' : 'h-9 px-3.5 text-[14px]',
        on ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2 bg-card text-ink-2 active:bg-card-2',
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {on && (
          <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.18 }} className="-ml-0.5 overflow-hidden">
            <Check className="size-4" strokeWidth={2.4} />
          </motion.span>
        )}
      </AnimatePresence>
      {children}
    </Pressable>
  )
}

/* ───────── Toggle estilo iOS ───────── */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-line-2 transition-colors duration-200 data-[state=checked]:bg-sage-700"
    >
      <SwitchPrimitive.Thumb className="block size-[27px] translate-x-[2px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,.18),0_0_0_.5px_rgba(0,0,0,.04)] transition-transform duration-200 ease-[cubic-bezier(.32,.72,0,1)] will-change-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  )
}

/* ───────── Rótulos ───────── */

export function SectionLabel({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-end justify-between px-5 pt-6 pb-2', className)}>
      <div className="text-[13px] font-semibold tracking-[0.01em] text-ink-3 uppercase">{children}</div>
      {action}
    </div>
  )
}

/* ───────── Tela com nav bar e título grande que encolhe ───────── */

export function Screen({
  title,
  large,
  eyebrow,
  back,
  right,
  children,
  footer,
  below,
  className,
}: {
  title: string
  large?: React.ReactNode
  eyebrow?: React.ReactNode
  back?: { label: string; onClick: () => void }
  right?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  below?: React.ReactNode
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ container: ref })
  const titleOpacity = useTransform(scrollY, large ? [34, 58] : [0, 1], [large ? 0 : 1, 1])
  const barBg = useTransform(scrollY, [0, 24], [0, 1])
  const largeScale = useTransform(scrollY, [-80, 0, 60], [1.06, 1, 0.94])
  const largeOpacity = useTransform(scrollY, [0, 46], [1, 0])

  return (
    <div className={cn('absolute inset-0 flex flex-col bg-paper', className)}>
      <header className="absolute inset-x-0 top-0 z-30 pt-[var(--sat)]">
        <motion.div style={{ opacity: barBg }} className="pointer-events-none absolute inset-0 border-b border-line/80 bg-paper/85 backdrop-blur-xl backdrop-saturate-150" />
        <div className="relative flex h-12 items-center px-2">
          <div className="flex min-w-[88px] items-center">
            {back && (
              <Pressable onClick={back.onClick} className="flex h-11 items-center gap-0.5 rounded-lg pr-2 pl-1 text-[16px] font-medium text-sage-700">
                <ChevronLeft className="size-[26px]" strokeWidth={2.1} />
                <span className="max-w-[90px] truncate">{back.label}</span>
              </Pressable>
            )}
          </div>
          <motion.div style={{ opacity: titleOpacity }} className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </motion.div>
          <div className="flex min-w-[88px] items-center justify-end gap-1 pr-1">{right}</div>
        </div>
        {below}
      </header>
      <div ref={ref} className="no-scrollbar relative flex-1 overflow-x-hidden overflow-y-auto overscroll-contain" style={{ paddingTop: 'calc(var(--sat) + 48px)' }}>
        {large && (
          <motion.div style={{ scale: largeScale, opacity: largeOpacity }} className="origin-left px-5 pt-1 pb-1">
            {eyebrow && <div className="mb-1 text-[13px] font-medium text-ink-3">{eyebrow}</div>}
            <h1 className="font-display text-[32px] leading-[1.08] font-semibold text-ink">{large}</h1>
          </motion.div>
        )}
        {children}
        <div style={{ height: footer ? 24 : 'calc(var(--sab) + 24px)' }} />
      </div>
      {footer && <div className="relative z-20 border-t border-line bg-card/92 px-4 pt-3 backdrop-blur-xl" style={{ paddingBottom: 'calc(var(--sab) + 10px)' }}>{footer}</div>}
    </div>
  )
}

export function IconBtn({ children, onClick, label, className, active }: { children: React.ReactNode; onClick?: () => void; label: string; className?: string; active?: boolean }) {
  return (
    <Pressable aria-label={label} title={label} onClick={onClick} scale={0.9} className={cn('flex size-11 items-center justify-center rounded-full text-ink-2 transition-colors', active && 'bg-late-bg text-late', className)}>
      {children}
    </Pressable>
  )
}

/* ───────── Bottom sheet (vaul) dentro do aparelho ───────── */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dark,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  dark?: boolean
}) {
  const { root } = usePhone()
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} container={root} repositionInputs={false}>
      <Drawer.Portal container={root}>
        <Drawer.Overlay className="fixed inset-0 z-[80] bg-sage-950/35" />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn('fixed inset-x-0 bottom-0 z-[90] flex max-h-[90%] flex-col rounded-t-[26px] outline-none', dark ? 'bg-sage-950 text-paper' : 'bg-card')}
        >
          <div className={cn('mx-auto mt-2 mb-1 h-[5px] w-9 shrink-0 rounded-full', dark ? 'bg-white/20' : 'bg-line-2')} />
          <div className="px-5 pt-2 pb-3">
            <Drawer.Title className={cn('text-[19px] font-semibold tracking-[-0.015em]', dark ? 'text-paper' : 'text-ink')}>{title}</Drawer.Title>
            {description && <Drawer.Description className={cn('mt-0.5 text-[14px]', dark ? 'text-sage-200' : 'text-ink-3')}>{description}</Drawer.Description>}
          </div>
          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>
          {footer && (
            <div className={cn('border-t px-4 pt-3', dark ? 'border-white/10' : 'border-line')} style={{ paddingBottom: 'calc(var(--sab) + 10px)' }}>
              {footer}
            </div>
          )}
          {!footer && <div style={{ height: 'var(--sab)' }} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

/* ───────── Stepper numérico grande ───────── */

function useHoldRepeat(fn: () => void) {
  const t = React.useRef<number | null>(null)
  const fnRef = React.useRef(fn)
  fnRef.current = fn
  const stop = React.useCallback(() => {
    if (t.current) window.clearTimeout(t.current)
    t.current = null
  }, [])
  const start = React.useCallback(() => {
    fnRef.current()
    let delay = 380
    const loop = () => {
      fnRef.current()
      delay = Math.max(60, delay * 0.78)
      t.current = window.setTimeout(loop, delay)
    }
    t.current = window.setTimeout(loop, delay)
  }, [])
  React.useEffect(() => stop, [stop])
  return { onPointerDown: start, onPointerUp: stop, onPointerLeave: stop, onPointerCancel: stop }
}

export function NumberStepper({
  label,
  icon,
  value,
  onChange,
  step,
  min,
  max,
  decimals = 0,
  unit,
  hint,
  tone,
  extra,
}: {
  label: string
  icon?: React.ReactNode
  value: number
  onChange: (n: number) => void
  step: number
  min: number
  max: number
  decimals?: number
  unit: string
  hint?: React.ReactNode
  tone?: 'ok' | 'warn' | 'late'
  extra?: React.ReactNode
}) {
  const clamp = (n: number) => +Math.min(max, Math.max(min, n)).toFixed(decimals)
  const valRef = React.useRef(value)
  valRef.current = value
  const dec = useHoldRepeat(() => onChange(clamp(valRef.current - step)))
  const inc = useHoldRepeat(() => onChange(clamp(valRef.current + step)))
  const toneCls = tone === 'late' ? 'text-late' : tone === 'warn' ? 'text-warn' : 'text-ink'
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Pressable scale={0.88} aria-label={`Diminuir ${label}`} {...dec} className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-line-2 bg-card text-ink-2 shadow-card active:bg-paper-2">
        <Minus className="size-5" strokeWidth={2.2} />
      </Pressable>
      <div className="min-w-0 flex-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[13px] font-medium text-ink-3">
          {icon}
          {label}
        </div>
        <div className={cn('mt-0.5 flex items-baseline justify-center gap-1 leading-none', toneCls)}>
          <span className="num font-display text-[34px] font-semibold tracking-[-0.02em]">{value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>
          <span className="text-[15px] font-medium text-ink-3">{unit}</span>
        </div>
        {hint && <div className="mt-1 text-[12.5px] text-ink-3">{hint}</div>}
        {extra}
      </div>
      <Pressable scale={0.88} aria-label={`Aumentar ${label}`} {...inc} className="flex size-[52px] shrink-0 items-center justify-center rounded-full border border-line-2 bg-card text-ink-2 shadow-card active:bg-paper-2">
        <Plus className="size-5" strokeWidth={2.2} />
      </Pressable>
    </div>
  )
}

/* ───────── Notificações do aparelho (banner iOS) ───────── */

function NoticeIcon({ kind }: { kind: Notice['kind'] }) {
  if (kind === 'whatsapp')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#2f8f5b] text-white">
        <MessageCircle className="size-5" strokeWidth={2} fill="currentColor" fillOpacity={0.15} />
      </span>
    )
  if (kind === 'sync')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-ok text-white">
        <RefreshCw className="size-5" strokeWidth={2} />
      </span>
    )
  if (kind === 'offline')
    return (
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[10px] bg-ink-2 text-white">
        <CloudOff className="size-5" strokeWidth={2} />
      </span>
    )
  return <LogoMark size={38} className="shrink-0 rounded-[10px]" />
}

function NoticeItem({ n }: { n: Notice }) {
  const dismiss = useCampo((s) => s.dismiss)
  React.useEffect(() => {
    const t = window.setTimeout(() => dismiss(n.id), 4200)
    return () => window.clearTimeout(t)
  }, [n.id, dismiss])
  return (
    <motion.div
      layout
      initial={{ y: -90, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -70, opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.1 }}
      onDragEnd={(_, i) => i.offset.y < -24 && dismiss(n.id)}
      onClick={() => dismiss(n.id)}
      className="pointer-events-auto flex cursor-grab items-start gap-3 rounded-[22px] border border-white/60 bg-card/88 p-3 shadow-[0_12px_40px_-12px_rgba(20,42,33,.45),0_1px_3px_rgba(20,42,33,.12)] backdrop-blur-2xl backdrop-saturate-150"
    >
      <NoticeIcon kind={n.kind} />
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[14.5px] font-semibold text-ink">{n.title}</div>
          <div className="shrink-0 text-[12px] text-ink-3">agora</div>
        </div>
        <div className="mt-0.5 line-clamp-3 text-[14px] leading-snug text-ink-2">{n.body}</div>
      </div>
    </motion.div>
  )
}

export function PhoneToaster() {
  const notices = useCampo((s) => s.notices)
  return (
    <div className="pointer-events-none absolute inset-x-0 z-[120] flex flex-col gap-2 px-2.5" style={{ top: 'calc(var(--sat) - 4px)' }}>
      <AnimatePresence initial={false}>
        {notices.map((n) => (
          <NoticeItem key={n.id} n={n} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ───────── Barra de status offline / sincronização ───────── */

export function ConnectivityBanner() {
  const offline = useDemo((s) => s.offline)
  const pending = useCampo((s) => s.pending)
  const syncing = useCampo((s) => s.syncing)
  const show = offline || syncing
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE_OUT }} className="overflow-hidden">
          <div className="px-4 pb-2">
            <div className={cn('relative flex h-9 items-center gap-2 overflow-hidden rounded-full px-3.5 text-[13.5px] font-medium', syncing ? 'bg-ok-bg text-ok' : 'bg-ink text-paper')}>
              {syncing ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} className="inline-flex">
                    <RefreshCw className="size-4" strokeWidth={2.2} />
                  </motion.span>
                  Sincronizando {pending} {pending === 1 ? 'registro' : 'registros'}…
                  <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.8, ease: 'easeInOut' }} className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-ok/60" />
                </>
              ) : (
                <>
                  <CloudOff className="size-4 opacity-80" strokeWidth={2} />
                  <span>Offline</span>
                  <span className="opacity-50">·</span>
                  <span className="truncate opacity-85">
                    {pending > 0 ? `${pending} ${pending === 1 ? 'registro aguardando' : 'registros aguardando'} envio` : 'tudo salvo no aparelho'}
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
