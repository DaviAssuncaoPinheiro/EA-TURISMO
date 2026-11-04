import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Bug, RotateCcw, Send, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button } from '@/components/ui'
import { LogoMark } from '@/components/AppShell'
import { VACCINE, type Pet, type Tutor } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { dueState } from '@/lib/status'
import { cn, firstName } from '@/lib/utils'
import { CrmvStamp } from './CrmvStamp'
import { hash, petFacts, vetOf, type DoseView, type PreventiveView } from './model'

const monthYear = (d: string) => {
  const x = new Date(d)
  return `${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`
}
const stampDate = (d: string) =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
    .format(new Date(d))
    .replace(/\./g, '')
    .replace(/ de /g, ' ')
    .toUpperCase()

/** validade fictícia do frasco: 18 meses após a aplicação */
const lotExpiry = (d: string) => {
  const x = new Date(d)
  x.setMonth(x.getMonth() + 18)
  return monthYear(x.toISOString())
}

function nextLabel(date: string) {
  const s = dueState(date)
  const n = daysFromToday(date)
  if (s.key === 'late') return { ...s, text: `Atrasada há ${-n} ${-n === 1 ? 'dia' : 'dias'}` }
  if (s.key === 'soon') return { ...s, text: n === 0 ? 'Vence hoje' : `Vence em ${n} ${n === 1 ? 'dia' : 'dias'}` }
  return { ...s, text: 'Em dia' }
}

/* ───────────── Código de barras do frasco ───────────── */

function Barcode({ value, className }: { value: string; className?: string }) {
  const bars: { x: number; w: number }[] = []
  let x = 0
  const src = (value + '*' + value.split('').reverse().join('')).split('')
  for (const ch of src) {
    const c = ch.charCodeAt(0)
    for (let k = 0; k < 3; k++) {
      const w = ((c >> k) & 1) + 1
      const gap = ((c >> (k + 3)) & 1) + 1
      bars.push({ x, w })
      x += w + gap
    }
  }
  return (
    <svg viewBox={`0 0 ${x} 20`} preserveAspectRatio="none" className={className} aria-hidden>
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={20} fill="currentColor" />
      ))}
    </svg>
  )
}

/* ───────────── Etiqueta colada (selo do frasco) ───────────── */

function Sticker({ dose }: { dose: DoseView }) {
  const h = hash(dose.id)
  const rot = ((h % 21) - 10) / 10 // −1° … +1°
  const [lab, product] = dose.lab.split(' · ')
  const vac = VACCINE[dose.vaccineId]
  return (
    <div
      className="relative w-[82%] max-w-[230px] rounded-[3px] bg-[#fffdf7] px-3 pt-2 pb-2 shadow-[0_1px_0_rgba(60,45,20,.08),0_2px_5px_-1px_rgba(60,45,20,.22)] ring-1 ring-[#e8dfcb]"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      {/* fita de cor do laboratório */}
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[3px]" style={{ background: lab?.startsWith('Zoetis') ? '#c66a2b' : '#3f6a8a', opacity: 0.85 }} />
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[9px] tracking-[0.12em] text-ink-3 uppercase">{lab}</span>
        <span className="font-mono text-[9px] text-ink-3">{vac?.short}</span>
      </div>
      <div className="mt-0.5 truncate text-[14px] leading-tight font-semibold tracking-[-0.01em] text-ink">{product ?? vac?.name}</div>
      <div className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 font-mono text-[10px] leading-[1.35] text-ink-2">
        <span className="text-ink-4">LOTE</span>
        <span className="num">{dose.lot}</span>
        <span className="text-ink-4">VAL.</span>
        <span className="num">{lotExpiry(dose.date)}</span>
      </div>
      <Barcode value={dose.lot} className="mt-1.5 h-[14px] w-[70%] text-ink/80" />
      {dose.isNew && (
        <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 rounded-full bg-terra-600 px-1.5 py-0.5 text-[9.5px] font-semibold text-white shadow-card">
          <Sparkles className="size-2.5" strokeWidth={2.2} /> Hoje
        </span>
      )}
    </div>
  )
}

/* ───────────── Espaço de uma vacina na carteira ───────────── */

function VaccineSlot({ dose, index }: { dose: DoseView; index: number }) {
  const vac = VACCINE[dose.vaccineId]
  const vet = vetOf(dose.vetId)
  const nx = nextLabel(dose.nextDate)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex flex-col rounded-[6px] border border-dashed border-[#d6c9ac] bg-[#fbf6ea]/70 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tracking-[0.1em] text-[#8c7a58] uppercase">{vac?.name.split(' (')[0]}</span>
        <span className="font-mono text-[10px] text-[#8c7a58]">{dose.dose}</span>
      </div>

      <div className="relative min-h-[104px] pt-1">
        <Sticker dose={dose} />
        <CrmvStamp vetId={dose.vetId} seed={dose.id} date={stampDate(dose.date)} size={74} className="absolute -right-1.5 bottom-[-12px]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 border-t border-[#e3d7bd] pt-2.5">
        <div>
          <div className="font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">Aplicada</div>
          <div className="num mt-0.5 font-display text-[15px] leading-tight text-ink italic">{fmt.date(dose.date)}</div>
          <div className="mt-0.5 truncate text-[11px] text-ink-3">{vet.short}</div>
        </div>
        <div>
          <div className="font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">Próxima dose</div>
          <div className={cn('num mt-0.5 font-display text-[15px] leading-tight italic', nx.key === 'late' ? 'text-late' : 'text-ink')}>{fmt.date(dose.nextDate)}</div>
        </div>
        <div className="col-span-2 mt-2">
          <Badge tone={nx.tone} dot className="h-[20px] text-[10.5px]">
            {nx.text}
          </Badge>
        </div>
      </div>
    </motion.div>
  )
}

/* ───────────── Faces ───────────── */

function FormLine({ label, value, mono, className }: { label: string; value: React.ReactNode; mono?: boolean; className?: string }) {
  return (
    <div className={cn('flex min-w-0 items-baseline gap-1.5', className)}>
      <span className="shrink-0 font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">{label}</span>
      <span className={cn('min-w-0 flex-1 truncate border-b border-dotted border-[#cdbd9a] pb-px text-[13px] text-ink', mono ? 'num font-mono text-[11.5px]' : 'font-display italic')}>{value}</span>
    </div>
  )
}

function CardFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('paper-grain relative h-full overflow-hidden rounded-[14px] bg-[#f6efdd] p-2 shadow-[0_1px_0_rgba(60,45,20,.06),0_18px_40px_-22px_rgba(60,45,20,.45)] ring-1 ring-[#e2d5b8]', className)}>
      <div className="@container h-full rounded-[9px] border border-[#d9caa8] p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-3.5 rounded-[7px] border border-[#e6dbc2]" aria-hidden />
        <div className="relative flex h-full flex-col">{children}</div>
      </div>
    </div>
  )
}

function CardHead({ pet, side }: { pet: Pet; side: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <LogoMark size={28} className="shrink-0" />
        <div className="min-w-0">
          <div className="font-mono text-[9.5px] tracking-[0.14em] text-[#8c7a58] uppercase">Carteira de vacinação · Vet Domicílio</div>
          <div className="font-display text-[20px] leading-tight font-semibold text-ink sm:text-[22px]">{side}</div>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">Registro</div>
        <div className="num font-mono text-[12px] text-ink-2">Nº {String(hash(pet.id) % 9000 + 1000)}-{pet.id.slice(0, 3).toUpperCase()}</div>
      </div>
    </div>
  )
}

function Front({ pet, current, preventives }: { pet: Pet; current: DoseView[]; preventives: PreventiveView[] }) {
  const f = petFacts(pet)
  return (
    <CardFrame>
      <CardHead pet={pet} side={pet.name} />

      <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-2.5 @md:grid-cols-2 @xl:grid-cols-3">
        <FormLine label="Espécie" value={`${f.species === 'Cão' ? 'Canina' : 'Felina'} · ${pet.breed}`} />
        <FormLine label="Nasc." value={fmt.date(pet.birth)} />
        <FormLine label="Sexo" value={`${f.sex} · ${f.neutered.toLowerCase()}`} />
        <FormLine label="Pelagem" value={pet.coat} />
        <FormLine label="Microchip" value={pet.microchip ?? 'não implantado'} mono={!!pet.microchip} className="@md:col-span-2" />
      </div>

      <div className="mt-5 mb-3 flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#7a6a4b] uppercase">Vacinas vigentes</span>
        <span className="h-px flex-1 bg-[#dccfb2]" />
      </div>
      {current.length ? (
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @xl:grid-cols-3">
          {current.map((d, i) => (
            <VaccineSlot key={d.id} dose={d} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#d6c9ac] px-4 py-6 text-center text-[13px] text-ink-3">Nenhuma vacina registrada nesta carteira ainda.</div>
      )}

      <div className="mt-6 mb-2 flex items-center gap-3">
        <span className="font-mono text-[10px] tracking-[0.14em] text-[#7a6a4b] uppercase">Antiparasitários</span>
        <span className="h-px flex-1 bg-[#dccfb2]" />
      </div>
      <div className="divide-y divide-dashed divide-[#dccfb2]">
        {preventives.map((p) => {
          const nx = nextLabel(p.nextDate)
          const [name, extra] = p.def.name.split(' (')
          return (
            <div key={p.preventiveId} className="grid grid-cols-[28px_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1.5 py-2.5 @lg:grid-cols-[28px_minmax(0,1fr)_auto]">
              <span className="flex size-7 items-center justify-center rounded-full border border-[#d6c9ac] text-[#7a6a4b]">
                {p.def.kind === 'vermífugo' ? <ShieldCheck className="size-3.5" strokeWidth={1.8} /> : <Bug className="size-3.5" strokeWidth={1.8} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
                <span className="block truncate text-[11.5px] text-ink-3">
                  {extra ? extra.replace(')', '') : 'Antipulgas e carrapatos'} · a cada {p.def.everyDays} dias
                </span>
              </span>
              <span className="col-start-2 flex flex-wrap items-center gap-x-2 gap-y-1 @lg:col-start-3 @lg:justify-end">
                <span className="num font-display text-[13.5px] text-ink-2 italic">{fmt.date(p.date)}</span>
                <span className="text-[11.5px] text-ink-4">→</span>
                <span className="num font-display text-[13.5px] text-ink italic">{fmt.date(p.nextDate)}</span>
                <Badge tone={nx.tone} dot className="h-[20px] text-[10.5px]">
                  {nx.text}
                </Badge>
              </span>
            </div>
          )
        })}
      </div>
    </CardFrame>
  )
}

function Back({ pet, doses, preventives }: { pet: Pet; doses: DoseView[]; preventives: PreventiveView[] }) {
  const signer = doses[0] ? vetOf(doses[0].vetId) : null
  const notes = [...(pet.alerts ?? []).map((a) => `${a}.`), pet.temperament, 'Sem reações vacinais registradas até o momento.'].filter(Boolean).join(' ')
  return (
    <CardFrame>
      <CardHead pet={pet} side="Histórico de aplicações" />
      <p className="mt-2 max-w-lg text-[12.5px] text-ink-3">
        Todas as doses aplicadas em {pet.name}, da mais recente à mais antiga. Cada linha leva lote, laboratório e o CRMV de quem aplicou.
      </p>

      {/* desktop: tabela */}
      <div className="mt-4 hidden md:block">
        <table className="w-full border-collapse text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-[#cdbd9a] font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">
              <th className="py-2 pr-3 font-normal">Data</th>
              <th className="py-2 pr-3 font-normal">Vacina</th>
              <th className="py-2 pr-3 font-normal">Laboratório</th>
              <th className="py-2 pr-3 font-normal">Lote</th>
              <th className="py-2 pr-3 font-normal">Aplicada por</th>
              <th className="py-2 font-normal">Próxima</th>
            </tr>
          </thead>
          <tbody>
            {doses.map((d) => {
              const v = vetOf(d.vetId)
              return (
                <tr key={d.id} className={cn('border-b border-dashed border-[#dccfb2] align-top', d.isNew && 'bg-terra-50/70')}>
                  <td className="num py-2 pr-3 font-display text-[13px] whitespace-nowrap text-ink italic">{fmt.date(d.date)}</td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-ink">{VACCINE[d.vaccineId]?.short}</div>
                    <div className="text-[11px] text-ink-3">{d.dose}</div>
                  </td>
                  <td className="py-2 pr-3 text-ink-2">{d.lab}</td>
                  <td className="num py-2 pr-3 font-mono text-[11.5px] text-ink-2">{d.lot}</td>
                  <td className="py-2 pr-3">
                    <div className="text-ink-2">{v.short}</div>
                    <div className="font-mono text-[10.5px] text-ink-3">{v.crmv}</div>
                  </td>
                  <td className="num py-2 font-display text-[13px] whitespace-nowrap text-ink-2 italic">{fmt.date(d.nextDate)}</td>
                </tr>
              )
            })}
            {preventives.map((p) => (
              <tr key={p.preventiveId} className="border-b border-dashed border-[#dccfb2] align-top">
                <td className="num py-2 pr-3 font-display text-[13px] whitespace-nowrap text-ink italic">{fmt.date(p.date)}</td>
                <td className="py-2 pr-3">
                  <div className="font-medium text-ink">{p.def.name.split(' (')[0]}</div>
                  <div className="text-[11px] text-ink-3">{p.def.kind === 'vermífugo' ? 'Vermífugo' : 'Antipulgas'}</div>
                </td>
                <td className="py-2 pr-3 text-ink-3" colSpan={3}>
                  Administrado pelo tutor, conforme orientação
                </td>
                <td className="num py-2 font-display text-[13px] whitespace-nowrap text-ink-2 italic">{fmt.date(p.nextDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile: lista */}
      <ul className="mt-4 divide-y divide-dashed divide-[#dccfb2] md:hidden">
        {doses.map((d) => {
          const v = vetOf(d.vetId)
          return (
            <li key={d.id} className={cn('py-2.5', d.isNew && 'bg-terra-50/70')}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">
                  {VACCINE[d.vaccineId]?.short} <span className="text-[12px] font-normal text-ink-3">· {d.dose}</span>
                </span>
                <span className="num font-display text-[13px] text-ink italic">{fmt.date(d.date)}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11.5px] text-ink-3">
                <span className="font-mono">Lote {d.lot}</span>
                <span>{d.lab}</span>
                <span>
                  {v.short} · <span className="font-mono">{v.crmv}</span>
                </span>
              </div>
            </li>
          )
        })}
        {preventives.map((p) => (
          <li key={p.preventiveId} className="py-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">{p.def.name.split(' (')[0]}</span>
              <span className="num font-display text-[13px] text-ink italic">{fmt.date(p.date)}</span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-ink-3">Próxima em {fmt.date(p.nextDate)} · administrado pelo tutor</div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex min-h-[120px] flex-1 flex-col">
        <div className="mb-1 flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.14em] text-[#7a6a4b] uppercase">Observações</span>
          <span className="h-px flex-1 bg-[#dccfb2]" />
        </div>
        <div className="flex-1 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_27px,#e0d3b6_27px,#e0d3b6_28px)]">
          <p className="font-display text-[14.5px] leading-[28px] text-[#34487a] italic">{notes}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">
          <div>Documento emitido por Vet Domicílio · Manaus/AM</div>
          <div className="num mt-0.5">{doses.length + preventives.length} registros</div>
        </div>
        {signer && (
          <div className="relative flex items-end gap-2">
            <div className="text-right">
              <div className="w-40 border-b border-[#bfae88] pb-0.5 font-display text-[15px] text-[#34487a] italic">{signer.short}</div>
              <div className="mt-1 font-mono text-[9.5px] tracking-[0.1em] text-[#8c7a58] uppercase">Assinatura e carimbo</div>
            </div>
            <CrmvStamp vetId={signer.id} seed={`sign-${pet.id}`} size={64} className="-mb-1" />
          </div>
        )}
      </div>
    </CardFrame>
  )
}

/* ───────────── Cartão com flip ───────────── */

export function VaccineCard({ pet, tutor, doses, current, preventives }: { pet: Pet; tutor: Tutor; doses: DoseView[]; current: DoseView[]; preventives: PreventiveView[] }) {
  const [flipped, setFlipped] = React.useState(false)
  const reduce = useReducedMotion()
  const send = () =>
    toast.success(`Carteira d${petFacts(pet).article} ${pet.name} enviada para ${firstName(tutor.name)}`, {
      description: `PDF pelo WhatsApp · ${tutor.phone} · ${current.length} vacinas e ${preventives.length} antiparasitários`,
    })

  const face = 'col-start-1 row-start-1 [backface-visibility:hidden] [-webkit-backface-visibility:hidden]'

  return (
    <section aria-label="Carteira de vacinação">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1">Documento digitalizado</div>
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Carteira de vacinação</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={send} className="h-10 sm:h-8">
            <Send className="size-3.5" strokeWidth={1.8} /> Enviar ao tutor
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped} className="h-10 sm:h-8" data-flip>
            <motion.span animate={{ rotate: flipped ? -180 : 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="inline-flex">
              <RotateCcw className="size-3.5" strokeWidth={1.8} />
            </motion.span>
            {flipped ? 'Ver frente' : 'Virar cartão'}
          </Button>
        </div>
      </div>

      <div style={{ perspective: 1800 }}>
        <motion.div
          className="grid"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={cn(face, flipped && 'pointer-events-none')} aria-hidden={flipped}>
            <Front pet={pet} current={current} preventives={preventives} />
          </div>
          <div className={cn(face, !flipped && 'pointer-events-none')} style={{ transform: 'rotateY(180deg)' }} aria-hidden={!flipped}>
            <Back pet={pet} doses={doses} preventives={preventives} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
