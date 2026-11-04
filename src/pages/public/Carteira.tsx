import * as React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { BadgeCheck, Bug, Download, MessageCircle, PawPrint, Pill, Share2, Syringe } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Badge, Button, IconButton, IconCircle, PetAvatar, VetAvatar } from '@/components/ui'
import { CLINIC, PET, TUTOR, VACCINE, type Pet } from '@/data/mock'
import { ageLabel, daysFromToday, fmt } from '@/data/time'
import { cn, firstName } from '@/lib/utils'
import { hash, petFacts, usePatientModel, vetOf, type Health } from '@/components/patient/model'
import { carteiraUrl, copyText } from '@/components/patient/DigitalCard'

type IconTone = 'blue' | 'violet' | 'green' | 'yellow' | 'coral' | 'muted'
const V_TONE: Record<string, IconTone> = { v10: 'blue', raiva: 'coral', gripe: 'violet', giardia: 'yellow', v5: 'green', v4: 'blue' }

function status(next: string): { tone: Health; label: string } {
  const n = daysFromToday(next)
  if (n < 0) return { tone: 'late', label: `Atrasada há ${-n} ${-n === 1 ? 'dia' : 'dias'}` }
  if (n === 0) return { tone: 'warn', label: 'Vence hoje' }
  if (n <= 30) return { tone: 'warn', label: `Vence em ${n} ${n === 1 ? 'dia' : 'dias'}` }
  return { tone: 'ok', label: 'Válida' }
}

const maskPhone = (p: string) => {
  const m = p.match(/^(\(\d+\))\s*.*?(\d{4})$/)
  return m ? `${m[1]} •••••-${m[2]}` : p.replace(/\d(?=\d{4})/g, '•')
}

const rise = (i: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.05 + i * 0.06, duration: 0.35, ease: [0.25, 1, 0.5, 1] as const },
})

function Fact({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-[12px] font-medium text-white/50">{label}</div>
      <div className="mt-0.5 truncate text-[14px] font-semibold text-white">{value}</div>
    </div>
  )
}

function Section({ title, meta, children, i }: { title: string; meta?: React.ReactNode; children: React.ReactNode; i: number }) {
  return (
    <motion.section {...rise(i)} className="overflow-hidden rounded-[24px] bg-card shadow-card print:shadow-none print:ring-1 print:ring-line">
      <div className="flex items-baseline justify-between gap-3 px-5 pt-5 pb-2">
        <h2 className="text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {meta && <span className="text-[12.5px] font-medium text-ink-3">{meta}</span>}
      </div>
      {children}
    </motion.section>
  )
}

function NotFound() {
  const wa = `https://wa.me/55${CLINIC.whatsapp.replace(/\D/g, '')}`
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[420px] rounded-[28px] bg-card px-6 py-10 text-center shadow-card">
        <IconCircle size={56} className="mx-auto">
          <PawPrint className="size-6" strokeWidth={1.9} />
        </IconCircle>
        <h1 className="mt-4 text-[24px] leading-tight font-bold tracking-[-0.03em] text-ink">Carteira não encontrada</h1>
        <p className="mx-auto mt-2 max-w-[280px] text-[14px] font-medium text-ink-3">O link pode estar incompleto. Peça um novo à clínica.</p>
        <a href={wa} target="_blank" rel="noreferrer" className="mt-6 inline-block">
          <Button variant="primary" size="lg">
            <MessageCircle className="size-4" strokeWidth={2} /> Falar com a clínica
          </Button>
        </a>
        <div className="mt-8 text-[12.5px] font-medium text-ink-4">{CLINIC.name} · {CLINIC.city}</div>
      </div>
    </div>
  )
}

function CarteiraView({ pet }: { pet: Pet }) {
  const model = usePatientModel(pet)!
  const tutor = TUTOR[pet.tutorId]
  const f = petFacts(pet)
  const url = carteiraUrl(pet.id)
  const late = model.current.filter((d) => daysFromToday(d.nextDate) < 0).length
  const number = `VD ${String(hash(pet.id) % 1000000).padStart(6, '0')}`

  const updated = React.useMemo(() => {
    const dates = [...model.doses.map((d) => d.date), ...model.preventives.map((p) => p.date)].map((d) => +new Date(d)).filter((t) => t <= Date.now())
    return dates.length ? new Date(Math.max(...dates)) : new Date()
  }, [model])

  React.useEffect(() => {
    const prev = document.title
    document.title = `Carteira d${f.article} ${pet.name} · ${CLINIC.name}`
    return () => {
      document.title = prev
    }
  }, [pet.name, f.article])

  const share = async () => {
    const data = { title: `Carteira d${f.article} ${pet.name}`, text: `Carteira de vacinação d${f.article} ${pet.name}`, url }
    if (navigator.share) {
      try {
        await navigator.share(data)
      } catch {
        /* cancelado */
      }
      return
    }
    const ok = await copyText(url)
    toast.success(ok ? 'Link copiado' : 'Copie o link', { description: ok ? 'Cole onde quiser compartilhar.' : url })
  }

  return (
    <div className="min-h-dvh bg-canvas print:bg-white">
      <div className="mx-auto w-full max-w-[520px] px-4 pt-4 pb-10 sm:pt-10">
        {/* topo */}
        <motion.header {...rise(0)} className="flex items-center justify-between gap-3 pb-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-black text-lime">
              <PawPrint className="size-[18px]" strokeWidth={2} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-[15px] font-bold tracking-[-0.01em] text-ink">{CLINIC.name}</div>
              <div className="text-[12.5px] font-medium text-ink-3">Carteira digital</div>
            </div>
          </div>
          <IconButton tone="card" aria-label="Compartilhar" onClick={share} className="print:hidden">
            <Share2 className="size-[18px]" strokeWidth={1.9} />
          </IconButton>
        </motion.header>

        {/* cartão de identidade */}
        <motion.article {...rise(1)} className="relative overflow-hidden rounded-[28px] bg-black p-5 text-white shadow-float sm:p-6 print:shadow-none">
          <span aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-lime/[.08]" />
          <span aria-hidden className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-lime/[.14]" />

          <div className="relative flex items-center gap-4">
            <span className="shrink-0 rounded-full bg-lime p-[3px]">
              <PetAvatar pet={pet} size={84} className="ring-[3px] ring-black" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[30px] leading-[1.05] font-bold tracking-[-0.03em]">{pet.name}</h1>
              <div className="mt-1 truncate text-[13.5px] font-medium text-white/60">
                {f.species} · {pet.breed}
              </div>
              <span data-testid="seal" className={cn('mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold', late ? 'bg-red text-white' : 'bg-lime text-ink')}>
                {late ? <span className="size-1.5 rounded-full bg-current" /> : <BadgeCheck className="size-4" strokeWidth={2} />}
                {late ? `${late} ${late === 1 ? 'vacina atrasada' : 'vacinas atrasadas'}` : 'Vacinas em dia'}
              </span>
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-white/10 pt-5">
            <Fact label="Sexo" value={`${f.sex}, ${f.neutered.toLowerCase()}`} />
            <Fact label="Nascimento" value={<span className="num">{fmt.date(pet.birth)} · {ageLabel(pet.birth)}</span>} />
            <Fact label="Pelagem" value={pet.coat} />
            <Fact label="Peso" value={<span className="num">{model.currentKg.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg</span>} />
            <Fact label="Microchip" value={<span className="num">{pet.microchip ?? 'Não informado'}</span>} className="col-span-2" />
            <Fact
              label="Tutor"
              value={
                <>
                  {firstName(tutor.name)} <span className="num text-white/60">· {maskPhone(tutor.phone)}</span>
                </>
              }
              className="col-span-2"
            />
          </div>

          <div className="relative mt-5 flex items-center justify-between gap-3 rounded-[18px] bg-white/[.06] px-4 py-3">
            <span className="num text-[12.5px] font-semibold text-white/70">{number}</span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-lime">
              <span className="size-1.5 rounded-full bg-lime" /> Verificada pela clínica
            </span>
          </div>
        </motion.article>

        <div className="mt-3 flex flex-col gap-3">
          {/* vacinas */}
          <Section title="Vacinas" meta={`${model.current.length} ${model.current.length === 1 ? 'vacina' : 'vacinas'}`} i={2}>
            {model.current.length ? (
              <ul>
                {model.current.map((d, i) => {
                  const v = VACCINE[d.vaccineId]
                  const s = status(d.nextDate)
                  const vet = vetOf(d.vetId)
                  return (
                    <li key={d.id} data-testid="vaccine" className={cn('px-5 py-4', i > 0 && 'border-t border-line')}>
                      <div className="flex items-start gap-3">
                        <IconCircle tone={V_TONE[d.vaccineId] ?? 'muted'} size={38}>
                          <Syringe className="size-[17px]" strokeWidth={1.9} />
                        </IconCircle>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                            <h3 className="text-[15px] leading-tight font-bold text-ink">{v?.name.split(' (')[0] ?? d.vaccineId}</h3>
                            <Badge tone={s.tone} dot>
                              {s.label}
                            </Badge>
                          </div>
                          <div className="mt-0.5 text-[12.5px] font-medium text-ink-3">{d.dose}</div>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          { k: 'Aplicação', v: fmt.date(d.date) },
                          { k: 'Validade', v: fmt.date(d.nextDate), late: s.tone === 'late' },
                          { k: 'Lote', v: d.lot },
                          { k: 'Laboratório', v: d.lab.split(' · ')[0], title: d.lab },
                        ].map((x) => (
                          <div key={x.k} className="min-w-0 rounded-[14px] bg-surface px-3 py-2" title={x.title}>
                            <dt className="text-[11.5px] font-medium text-ink-3">{x.k}</dt>
                            <dd className={cn('num truncate text-[13px] font-semibold', x.late ? 'text-red' : 'text-ink')}>{x.v}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-2.5 flex min-w-0 items-center gap-2 text-[12.5px] font-medium text-ink-3">
                        <VetAvatar vetId={d.vetId} size={22} />
                        <span className="min-w-0 truncate">
                          <span className="font-semibold text-ink-2">{vet.name}</span> · <span className="num">{vet.crmv}</span>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-5 pt-2 pb-6 text-[13.5px] font-medium text-ink-3">Nenhuma vacina registrada.</div>
            )}
          </Section>

          {/* antiparasitários */}
          {model.preventives.length > 0 && (
            <Section title="Antiparasitários" i={3}>
              <ul className="pb-1">
                {model.preventives.map((p, i) => {
                  const s = status(p.nextDate)
                  const Icon = p.def.kind === 'vermífugo' ? Pill : Bug
                  const product = p.def.name.match(/\((.*)\)/)?.[1] ?? p.def.name
                  return (
                    <li key={p.preventiveId} className={cn('flex items-start gap-3 px-5 py-3.5', i > 0 && 'border-t border-line')}>
                      <IconCircle size={38}>
                        <Icon className="size-[17px]" strokeWidth={1.9} />
                      </IconCircle>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                          <span className="text-[14px] font-bold text-ink">
                            {p.def.kind === 'vermífugo' ? 'Vermífugo' : 'Antipulgas'} <span className="font-semibold text-ink-3">· {product}</span>
                          </span>
                          <Badge tone={s.tone} dot className="shrink-0">
                            {s.tone === 'ok' ? 'Em dia' : s.label.replace('Atrasada', 'Vencido')}
                          </Badge>
                        </div>
                        <div className="num mt-0.5 text-[12.5px] font-medium text-ink-3">
                          Aplicado {fmt.date(p.date)} · próxima {fmt.date(p.nextDate)}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          {/* QR */}
          <motion.section {...rise(4)} className="flex items-center gap-4 rounded-[24px] bg-card p-4 shadow-card sm:p-5 print:shadow-none print:ring-1 print:ring-line">
            <div className="shrink-0 rounded-[18px] bg-surface p-2.5">
              <QRCodeSVG value={url} size={96} level="M" fgColor="#111214" bgColor="transparent" />
            </div>
            <div className="min-w-0">
              <div className="text-[15px] font-bold text-ink">Versão sempre atualizada</div>
              <p className="mt-0.5 text-[13px] font-medium text-ink-3">Aponte a câmera para o código e confira os dados.</p>
              <div className="mt-2 text-[12px] font-medium text-ink-4">
                Emitido por {CLINIC.name} · atualizado em <span className="num">{fmt.date(updated)}</span>
              </div>
            </div>
          </motion.section>

          <motion.div {...rise(5)} className="grid grid-cols-2 gap-2 pt-1 print:hidden">
            <Button variant="outline" size="lg" onClick={() => window.print()} className="h-12">
              <Download className="size-4" strokeWidth={2} /> Salvar
            </Button>
            <Button variant="primary" size="lg" onClick={share} className="h-12">
              <Share2 className="size-4" strokeWidth={2} /> Compartilhar
            </Button>
          </motion.div>

          <p className="pt-2 text-center text-[12px] font-medium text-ink-4">
            {CLINIC.name} · {CLINIC.city} · {CLINIC.whatsapp}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Carteira() {
  const { petId } = useParams()
  const pet = petId ? PET[petId] : undefined
  if (!pet) return <NotFound />
  return <CarteiraView pet={pet} />
}
