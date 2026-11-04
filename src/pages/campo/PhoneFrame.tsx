// Moldura de iPhone feita em CSS (só no desktop) + barra de status.
import * as React from 'react'
import { cn } from '@/lib/utils'

export const PHONE = { w: 390, h: 844, bezel: 12 }

function SignalBars({ off }: { off: boolean }) {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 4.8} y={8 - i * 2.6} width="3.2" height={4 + i * 2.6} rx="0.9" fill="currentColor" opacity={off ? 0.22 : 1} />
      ))}
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden>
      <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.1-1.2A10.2 10.2 0 0 0 8 .6C5.3.6 2.8 1.6.9 3.4L2 4.6a8.6 8.6 0 0 1 6-2.4Z" fill="currentColor" />
      <path d="M8 5.6c1.4 0 2.6.5 3.6 1.4l1.1-1.2A6.9 6.9 0 0 0 8 4c-1.8 0-3.4.7-4.7 1.8L4.4 7c1-.9 2.2-1.4 3.6-1.4Z" fill="currentColor" />
      <path d="M8 9.1c.5 0 1 .2 1.3.5L8 11 6.7 9.6c.3-.3.8-.5 1.3-.5Z" fill="currentColor" />
      <path d="M8 7.4c.9 0 1.7.3 2.3.9l-1 1.2A1.9 1.9 0 0 0 8 9c-.5 0-1 .2-1.3.5l-1-1.2c.6-.6 1.4-.9 2.3-.9Z" fill="currentColor" />
    </svg>
  )
}

function Battery() {
  return (
    <svg width="27" height="13" viewBox="0 0 27 13" aria-hidden>
      <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" opacity="0.38" />
      <rect x="2" y="2" width="15.6" height="9" rx="2.2" fill="currentColor" />
      <path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1S25.8 4.7 25 4.4Z" fill="currentColor" opacity="0.4" />
    </svg>
  )
}

export function StatusBar({ offline }: { offline: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[110] flex h-[54px] items-center justify-between pr-[30px] pl-[46px] text-ink">
      <span className="num pt-0.5 text-[16.5px] font-semibold tracking-[-0.01em]">10:40</span>
      <span className="flex items-center gap-[6px] pt-0.5">
        <SignalBars off={offline} />
        {offline ? <span className="text-[12px] font-semibold">Sem serviço</span> : <WifiGlyph />}
        <Battery />
      </span>
    </div>
  )
}

export const PhoneFrame = React.forwardRef<HTMLDivElement, { offline: boolean; children: React.ReactNode; className?: string }>(({ offline, children, className }, ref) => {
  const { w, h, bezel } = PHONE
  return (
    <div className={cn('relative', className)} style={{ width: w + bezel * 2, height: h + bezel * 2 }}>
      {/* botões laterais */}
      <span className="absolute top-[118px] -left-[3px] h-8 w-[4px] rounded-l-sm bg-[#2b2f2c]" />
      <span className="absolute top-[178px] -left-[3px] h-[60px] w-[4px] rounded-l-sm bg-[#2b2f2c]" />
      <span className="absolute top-[250px] -left-[3px] h-[60px] w-[4px] rounded-l-sm bg-[#2b2f2c]" />
      <span className="absolute top-[200px] -right-[3px] h-[96px] w-[4px] rounded-r-sm bg-[#2b2f2c]" />
      {/* corpo */}
      <div
        className="absolute inset-0 rounded-[66px] bg-[#1b1e1c] shadow-[0_50px_100px_-30px_rgba(20,42,33,.55),0_30px_60px_-30px_rgba(20,42,33,.4),inset_0_0_0_1.5px_#4a4f4b,inset_0_0_0_4px_#121413]"
        style={{ padding: bezel }}
      >
        <div
          ref={ref}
          className="relative h-full w-full overflow-hidden rounded-[54px] bg-paper"
          style={{ transform: 'translateZ(0)', ['--sat' as string]: '54px', ['--sab' as string]: '28px' }}
        >
          <StatusBar offline={offline} />
          <div className="absolute top-[11px] left-1/2 z-[130] h-[37px] w-[124px] -translate-x-1/2 rounded-full bg-black">
            <span className="absolute top-1/2 right-[14px] size-[10px] -translate-y-1/2 rounded-full bg-[#11151a] ring-1 ring-[#1d2430]" />
          </div>
          {children}
          <div className="pointer-events-none absolute bottom-[8px] left-1/2 z-[130] h-[5px] w-[136px] -translate-x-1/2 rounded-full bg-ink/85" />
        </div>
      </div>
    </div>
  )
})
PhoneFrame.displayName = 'PhoneFrame'
