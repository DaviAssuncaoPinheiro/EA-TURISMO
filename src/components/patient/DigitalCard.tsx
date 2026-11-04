import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowUpRight, Copy, IdCard, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import type { Pet, Tutor } from '@/data/mock'
import { cn, firstName } from '@/lib/utils'
import { petFacts } from './model'

export const carteiraUrl = (petId: string) => `${window.location.origin}${window.location.pathname}#/carteira/${petId}`

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const t = document.createElement('textarea')
    t.value = text
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    const ok = document.execCommand('copy')
    t.remove()
    return ok
  }
}

export function DigitalCard({ pet, tutor, late, className }: { pet: Pet; tutor: Tutor; late: number; className?: string }) {
  const url = carteiraUrl(pet.id)
  const f = petFacts(pet)
  const copy = async () => {
    const ok = await copyText(url)
    if (ok) toast.success('Link copiado', { description: 'Cole no WhatsApp ou no e-mail.' })
    else toast('Copie o link', { description: url })
  }
  const send = () =>
    toast.success(`Carteira d${f.article} ${pet.name} enviada`, {
      description: `Link pelo WhatsApp para ${firstName(tutor.name)} · ${tutor.phone}`,
    })

  return (
    <section data-testid="digital-card" className={cn('relative overflow-hidden rounded-[24px] bg-black p-5 text-white shadow-card', className)}>
      <span aria-hidden className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-lime/15" />
      <span aria-hidden className="pointer-events-none absolute -top-6 -right-6 size-20 rounded-full bg-lime/25" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
            <IdCard className="size-[18px]" strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[17px] leading-tight font-bold tracking-[-0.02em]">Carteira digital</h3>
            <p className="mt-0.5 text-[12.5px] font-medium text-white/60">Mostre em hotel, creche, pet shop ou viagem</p>
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <div className="shrink-0 rounded-[18px] bg-white p-2.5">
          <QRCodeSVG value={url} size={104} level="M" fgColor="#111214" bgColor="#ffffff" />
        </div>
        <div className="min-w-0">
          <div className="text-[20px] leading-tight font-bold tracking-[-0.02em]">{pet.name}</div>
          <div className="mt-0.5 truncate text-[12.5px] font-medium text-white/60">
            {f.species} · {pet.breed}
          </div>
          <span className={cn('mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold', late ? 'bg-red text-white' : 'bg-lime text-ink')}>
            <span className="size-1.5 rounded-full bg-current" />
            {late ? `${late} ${late === 1 ? 'vacina atrasada' : 'vacinas atrasadas'}` : 'Vacinas em dia'}
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-[1fr_1fr_auto] gap-2">
        <Button variant="outline" onClick={copy} className="h-11 min-w-0 bg-white/10 px-3 text-white shadow-none hover:bg-white/15">
          <Copy className="size-4 shrink-0" strokeWidth={2} /> <span className="truncate">Copiar link</span>
        </Button>
        <Button variant="lime" onClick={send} className="h-11 min-w-0 px-3">
          <Send className="size-4 shrink-0" strokeWidth={2} /> <span className="truncate">Enviar ao tutor</span>
        </Button>
        <Link
          to={`/carteira/${pet.id}`}
          target="_blank"
          aria-label="Abrir carteira"
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13.5px] font-semibold text-ink transition-[background,transform] hover:bg-surface active:scale-[.97]"
        >
          <ArrowUpRight className="size-4" strokeWidth={2} />
          <span className="max-sm:hidden xl:hidden 2xl:inline">Abrir</span>
        </Link>
      </div>
    </section>
  )
}
