// Relatório da visita para o tutor: página pública (link enviado por WhatsApp), sem o painel.
import * as React from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, CalendarPlus, Camera, ChevronsLeftRight, Clock, FileSearch, HeartPulse, Link2, MessageCircle, Pill, Repeat, Scale, Stethoscope, Syringe, Thermometer, Wind } from 'lucide-react'
import { brl, cn, firstName, kg } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { VetAvatar } from '@/components/ui'
import { CLINIC, PET, TUTOR, VET, VISITS, weightHistory, type Pet } from '@/data/mock'
import { daysFromToday, fmt, relDays } from '@/data/time'
import { useDemo, type PetPhoto, type VisitReport } from '@/store'
import { medHint, previousWeight, reportPhotos, resolveReport, timesFor } from '../campo/report'

const EASE = [0.16, 1, 0.3, 1] as const
const longDate = (d: string | Date) => fmt.long(d).split(', ').pop() ?? fmt.date(d)
const ddmm = (d: string | Date) => fmt.date(d).slice(0, 5)
const clinicDigits = '55' + CLINIC.whatsapp.replace(/\D/g, '')

function openWa(text: string) {
  window.open(`https://wa.me/${clinicDigits}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.05 + i * 0.05 }} className={className}>
      {children}
    </motion.div>
  )
}

function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[26px] bg-card p-5 shadow-card sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Circle({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'lime' | 'black' | 'blue' | 'violet' }) {
  const t = { muted: 'bg-muted text-ink', lime: 'bg-lime text-ink', black: 'bg-black text-lime', blue: 'bg-blue-soft text-blue', violet: 'bg-violet-soft text-violet' }[tone]
  return <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', t)}>{children}</span>
}

function PetPhotoBig({ pet }: { pet: Pet }) {
  const [failed, setFailed] = React.useState(false)
  return (
    <span className="relative inline-flex size-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[30px] bg-lime text-ink ring-4 ring-white/10 sm:size-[120px]">
      {pet.photo && !failed ? <img src={pet.photo} alt={pet.name} onError={() => setFailed(true)} className="size-full object-cover" /> : <span className="text-[48px] font-bold">{pet.name[0]}</span>}
    </span>
  )
}

/* Comparação antes e depois com controle deslizante */

function CompareSlider({ before, after }: { before: PetPhoto; after: PetPhoto }) {
  const [pos, setPos] = React.useState(50)
  return (
    <div className="relative aspect-[4/3] select-none overflow-hidden rounded-[22px] bg-muted">
      <img src={after.src} alt={`${after.subject}, agora`} className="absolute inset-0 size-full object-cover" draggable={false} />
      <img src={before.src} alt={`${before.subject}, antes`} className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <span className="pointer-events-none absolute top-3 left-3 inline-flex h-8 items-center rounded-full bg-black px-3 text-[12.5px] font-bold text-white">Antes · {ddmm(before.date)}</span>
      <span className="pointer-events-none absolute top-3 right-3 inline-flex h-8 items-center rounded-full bg-lime px-3 text-[12.5px] font-bold text-ink">Agora</span>
      <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.35)]" style={{ left: `${pos}%` }}>
        <span className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-float">
          <ChevronsLeftRight className="size-5" strokeWidth={2.2} />
        </span>
      </span>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} aria-label="Comparar antes e agora" className="absolute inset-0 size-full cursor-ew-resize opacity-0" />
    </div>
  )
}

/* Agenda (.ics) */

function icsDate(d: string) {
  const x = new Date(d)
  return `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`
}
function downloadIcs(pet: Pet, dates: { label: string; date: string }[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vet Domicilio//Relatorio//PT-BR', 'CALSCALE:GREGORIAN']
  dates.forEach((d, i) => {
    const end = new Date(d.date)
    end.setDate(end.getDate() + 1)
    lines.push('BEGIN:VEVENT', `UID:${pet.id}-${icsDate(d.date)}-${i}@vetdomicilio`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${icsDate(d.date)}`, `DTEND;VALUE=DATE:${icsDate(end.toISOString())}`, `SUMMARY:${pet.name}: ${d.label}`, `DESCRIPTION:${CLINIC.name} · WhatsApp ${CLINIC.whatsapp}`, 'END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${pet.name.toLowerCase()}-proximas-datas.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* Página */

export default function Relatorio() {
  const { visitId = '' } = useParams()
  const reports = useDemo((s) => s.reports)
  const status = useDemo((s) => s.visitStatus)
  const stored = useDemo((s) => s.photos)
  const report = resolveReport(visitId, reports, status)

  React.useEffect(() => {
    const t = document.title
    const pet = report ? PET[report.petId] : null
    document.title = pet ? `Relatório de ${pet.name} · Vet Domicílio` : 'Relatório · Vet Domicílio'
    return () => {
      document.title = t
    }
  }, [report])
  React.useEffect(() => window.scrollTo({ top: 0 }), [visitId])

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <div className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-16 sm:px-6 sm:pt-8">
        <TopBar />
        {report ? <ReportBody report={report} stored={stored} /> : <NotFound />}
        <footer className="mt-10 flex flex-col items-center gap-2 text-center">
          <LogoMark size={28} />
          <div className="text-[12.5px] font-medium text-ink-3">
            {CLINIC.name} · Veterinários em casa · {CLINIC.city}
          </div>
        </footer>
      </div>
    </div>
  )
}

function TopBar() {
  const copy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {})
    toast('Link copiado')
  }
  return (
    <header className="flex items-center gap-3 pb-5">
      <LogoMark size={40} />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[16px] font-bold tracking-[-0.02em]">{CLINIC.name}</div>
        <div className="text-[12.5px] font-medium text-ink-3">{CLINIC.city}</div>
      </div>
      <button onClick={copy} className="inline-flex h-10 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold text-ink shadow-pill transition-colors hover:bg-surface active:scale-[.97]">
        <Link2 className="size-4" strokeWidth={2.2} /> Copiar link
      </button>
    </header>
  )
}

function NotFound() {
  return (
    <Reveal>
      <section className="flex flex-col items-center rounded-[30px] bg-card px-6 py-14 text-center shadow-card">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted text-ink">
          <FileSearch className="size-7" strokeWidth={1.9} />
        </span>
        <h1 className="mt-5 text-[26px] leading-tight font-bold tracking-[-0.03em]">Relatório não encontrado</h1>
        <p className="mt-2 max-w-sm text-[14.5px] font-medium text-ink-3">Confira o link que você recebeu no WhatsApp ou fale com a clínica.</p>
        <button
          onClick={() => openWa('Olá! Não consegui abrir o relatório da visita.')}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-black px-6 text-[15px] font-semibold text-white transition-colors hover:bg-black-2 active:scale-[.97]"
        >
          <MessageCircle className="size-[18px] text-lime" strokeWidth={2.2} /> Falar com a clínica
        </button>
      </section>
    </Reveal>
  )
}

function ReportBody({ report: r, stored }: { report: VisitReport; stored: PetPhoto[] }) {
  const pet = PET[r.petId]
  const vet = VET[r.vetId]
  const visit = VISITS.find((v) => v.id === r.visitId)
  const tutor = TUTOR[visit?.tutorId ?? pet.tutorId]
  const others = visit ? visit.petIds.slice(1).map((id) => PET[id].name) : []
  const prev = previousWeight(pet.id)
  const weight = r.weightKg ?? pet.weightKg
  const delta = prev ? +(weight - prev.kg).toFixed(1) : 0
  const [lo, hi] = pet.idealKg
  const goodTrend = (weight >= lo && weight <= hi) || (delta < 0 && weight > hi) || (delta > 0 && weight < lo)
  const { photos, pairs, rest } = reportPhotos(r, stored)
  const nextDates = [...(r.nextDates ?? [])].sort((a, b) => +new Date(a.date) - +new Date(b.date))
  const article = pet.sex === 'F' ? 'da' : 'do'

  const done = [
    { icon: Stethoscope, title: 'Exame completo', sub: 'Peso, temperatura, coração e respiração' },
    visit?.type === 'Fluidoterapia' && { icon: HeartPulse, title: 'Soro embaixo da pele', sub: 'Ajuda a manter os rins hidratados' },
    r.vaccines?.length && { icon: Syringe, title: r.vaccines.length === 1 ? 'Vacina aplicada' : 'Vacinas aplicadas', sub: r.vaccines.map((v) => v.name).join(', ') },
    r.prescription?.length && { icon: Pill, title: 'Receita', sub: `${r.prescription.length} ${r.prescription.length === 1 ? 'medicamento' : 'medicamentos'}, com horários abaixo` },
    photos.length && { icon: Camera, title: 'Fotos de acompanhamento', sub: `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'}` },
    nextDates.length && { icon: Repeat, title: 'Lembretes programados', sub: 'Avisamos você pelo WhatsApp' },
  ].filter(Boolean) as { icon: typeof Stethoscope; title: string; sub: string }[]

  const vitalIcon = (l: string) => (/temp/i.test(l) ? Thermometer : /bat|press/i.test(l) ? HeartPulse : /resp/i.test(l) ? Wind : Stethoscope)
  const vitals = (r.vitals ?? []).filter((v) => !/escore/i.test(v.label))
  const bcs = r.vitals?.find((v) => /escore/i.test(v.label))

  return (
    <div className="flex flex-col gap-3">
      {/* topo */}
      <Reveal>
        <section className="relative overflow-hidden rounded-[32px] bg-black p-5 text-white sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_90%_0%,rgba(216,243,90,.18),transparent_60%)]" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <PetPhotoBig pet={pet} />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-white/60">Relatório da visita de {longDate(r.finishedAt)}</div>
              <h1 className="mt-1 text-[38px] leading-none font-bold tracking-[-0.04em] sm:text-[44px]">
                {pet.name}
                {others.length > 0 && <span className="text-white/50"> e {others.join(' e ')}</span>}
              </h1>
              <div className="mt-2 text-[14px] font-medium text-white/60">
                {pet.breed} · {visit?.type ?? 'Atendimento'} em casa
              </div>
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-3 rounded-[22px] bg-white/[0.08] p-3">
            <VetAvatar vetId={vet.id} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{vet.name}</div>
              <div className="truncate text-[12.5px] font-medium text-white/55">
                {vet.crmv} · {vet.focus}
              </div>
            </div>
            <span className="hidden h-8 items-center gap-1.5 rounded-full bg-lime px-3 text-[12.5px] font-bold text-ink min-[420px]:inline-flex">
              <Clock className="size-3.5" strokeWidth={2.4} />
              <span className="num">{fmt.time(r.finishedAt)}</span>
            </span>
          </div>
        </section>
      </Reveal>

      {/* resumo */}
      <Reveal i={1}>
        <section className="rounded-[26px] bg-lime-soft p-5 sm:p-6">
          <div className="text-[13.5px] font-semibold text-lime-ink">Olá, {firstName(tutor.name)}</div>
          <p className="mt-1.5 text-[18px] leading-[1.5] font-semibold tracking-[-0.01em] text-ink sm:text-[19px]">{r.summary}</p>
        </section>
      </Reveal>

      {/* peso e sinais */}
      <Reveal i={2} className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-[26px] bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink-3">
            <Scale className="size-4 text-ink" strokeWidth={2} /> Peso
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="num text-[40px] leading-none font-bold tracking-[-0.04em]">{weight.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</span>
            <span className="text-[16px] font-semibold text-ink-3">kg</span>
            {prev && (
              <span className={cn('inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-bold', delta === 0 ? 'bg-muted text-ink-2' : goodTrend ? 'bg-green-soft text-[#1e8a50]' : 'bg-yellow-soft text-yellow-ink')}>
                {delta < 0 ? <ArrowDown className="size-3.5" strokeWidth={2.6} /> : delta > 0 ? <ArrowUp className="size-3.5" strokeWidth={2.6} /> : null}
                {delta === 0 ? 'Estável' : `${kg(Math.abs(delta))}`}
              </span>
            )}
          </div>
          <Sparkline pet={pet} weight={weight} />
          <div className="mt-2 flex justify-between text-[12.5px] font-medium text-ink-3">
            <span>{prev ? `Desde ${ddmm(prev.date)}` : 'Primeira pesagem'}</span>
            <span>
              Ideal {pet.idealKg[0].toLocaleString('pt-BR')} a {kg(pet.idealKg[1])}
            </span>
          </div>
          {bcs && <div className="mt-3 rounded-[16px] bg-surface px-3 py-2 text-[13px] font-semibold text-ink-2">Escore corporal {bcs.value}</div>}
        </section>

        <section className="rounded-[26px] bg-card p-5 shadow-card sm:p-6">
          <div className="text-[13.5px] font-semibold text-ink-3">Sinais vitais</div>
          <div className="mt-2 divide-y divide-line">
            {vitals.map((v) => {
              const Icon = vitalIcon(v.label)
              return (
                <div key={v.label} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-[14px] font-medium text-ink-2">{v.label}</span>
                  <span className="num text-[14.5px] font-bold text-ink">{v.value}</span>
                </div>
              )
            })}
          </div>
        </section>
      </Reveal>

      {/* o que foi feito */}
      <Reveal i={3}>
        <Section title="O que foi feito">
          <div className="flex flex-col gap-3">
            {done.map((d, i) => (
              <div key={d.title} className="flex items-center gap-3.5">
                <Circle tone={i === 0 ? 'black' : 'muted'}>
                  <d.icon className="size-[18px]" strokeWidth={2} />
                </Circle>
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-ink">{d.title}</div>
                  <div className="text-[13.5px] font-medium text-ink-3">{d.sub}</div>
                </div>
              </div>
            ))}
          </div>
          {r.total != null && (
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[14px] font-semibold text-ink-2">Valor da visita</span>
              <span className="num text-[22px] font-bold tracking-[-0.02em]">{brl(r.total)}</span>
            </div>
          )}
        </Section>
      </Reveal>

      {/* vacinas */}
      {r.vaccines && r.vaccines.length > 0 && (
        <Reveal i={4}>
          <Section title="Vacinas aplicadas" aside={<span className="text-[13px] font-semibold text-ink-3">Carteira atualizada</span>}>
            <div className="flex flex-col gap-2">
              {r.vaccines.map((v) => (
                <div key={v.name} className="flex flex-wrap items-center gap-3 rounded-[20px] bg-surface p-3">
                  <Circle tone="lime">
                    <Syringe className="size-[18px]" strokeWidth={2} />
                  </Circle>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-bold text-ink">{v.name}</div>
                    {v.lot && <div className="num text-[12.5px] font-medium text-ink-3">Lote {v.lot}</div>}
                  </div>
                  {v.next && (
                    <div className="text-right">
                      <div className="text-[12px] font-semibold text-ink-3">Próxima dose</div>
                      <div className="num text-[14px] font-bold text-ink">{fmt.date(v.next)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        </Reveal>
      )}

      {/* receita */}
      {r.prescription && r.prescription.length > 0 && (
        <Reveal i={5}>
          <Section title="Receita" aside={<span className="text-[13px] font-semibold text-ink-3">Como dar</span>}>
            <div className="flex flex-col gap-2.5">
              {r.prescription.map((m) => {
                const [amount, ...restParts] = m.dose.split(', ')
                const times = timesFor(m.dose)
                const freq = restParts.find((x) => /a cada/i.test(x))
                const dur = restParts.find((x) => !/a cada/i.test(x))
                const hint = medHint(m.name)
                return (
                  <div key={m.name} className="rounded-[22px] bg-surface p-4">
                    <div className="flex items-start gap-3">
                      <Circle tone="violet">
                        <Pill className="size-[18px]" strokeWidth={2} />
                      </Circle>
                      <div className="min-w-0 flex-1">
                        <div className="text-[15.5px] font-bold text-ink">{m.name}</div>
                        <div className="text-[14px] font-medium text-ink-2">
                          {amount}
                          {freq ? `, ${freq}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {times.map((t) => (
                        <span key={t} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black px-3 text-[12.5px] font-bold text-white">
                          <Clock className="size-3.5 text-lime" strokeWidth={2.4} />
                          {t}
                        </span>
                      ))}
                      {dur && <span className="inline-flex h-8 items-center rounded-full bg-card px-3 text-[12.5px] font-semibold text-ink shadow-pill">{dur.charAt(0).toUpperCase() + dur.slice(1)}</span>}
                    </div>
                    {hint && <div className="mt-3 rounded-[14px] bg-yellow-soft px-3 py-2 text-[13px] font-semibold text-yellow-ink">{hint}</div>}
                  </div>
                )
              })}
            </div>
          </Section>
        </Reveal>
      )}

      {/* fotos */}
      {photos.length > 0 && (
        <Reveal i={6}>
          <Section title="Fotos" aside={<span className="text-[13px] font-semibold text-ink-3">{photos.length} {photos.length === 1 ? 'foto' : 'fotos'}</span>}>
            {pairs.map((p) => (
              <div key={p.subject} className="mb-4">
                <CompareSlider before={p.before} after={p.after} />
                <div className="mt-2 flex items-center justify-between px-1 text-[13px] font-medium text-ink-3">
                  <span className="font-semibold text-ink">{p.subject}</span>
                  <span>Arraste para comparar</span>
                </div>
              </div>
            ))}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {rest.map((p) => (
                  <figure key={p.id} className="relative aspect-square overflow-hidden rounded-[20px] bg-muted">
                    <img src={p.src} alt={p.label} className="size-full object-cover" />
                    <figcaption className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/80 px-2.5 py-1 text-[12px] font-semibold text-ink backdrop-blur-md">{p.label}</figcaption>
                  </figure>
                ))}
              </div>
            )}
          </Section>
        </Reveal>
      )}

      {/* próximas datas */}
      {nextDates.length > 0 && (
        <Reveal i={7}>
          <Section title="Próximas datas">
            <div className="flex flex-col gap-2">
              {nextDates.map((d) => {
                const x = new Date(d.date)
                return (
                  <div key={d.label + d.date} className="flex items-center gap-3.5 rounded-[20px] bg-surface p-3">
                    <span className="flex size-[52px] shrink-0 flex-col items-center justify-center rounded-[16px] bg-card leading-none shadow-pill">
                      <span className="num text-[19px] font-bold">{x.getDate()}</span>
                      <span className="mt-0.5 text-[11px] font-semibold text-ink-3">{fmt.short(x).split(' ').pop()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-ink">{d.label}</div>
                      <div className="text-[13px] font-medium text-ink-3">
                        {fmt.weekday(x)}, {relDays(x)}
                      </div>
                    </div>
                    {daysFromToday(x) <= 7 && <span className="hidden h-7 items-center rounded-full bg-lime px-2.5 text-[12px] font-bold text-ink min-[400px]:inline-flex">Em breve</span>}
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => {
                downloadIcs(pet, nextDates)
                toast('Datas adicionadas à agenda', { description: `${nextDates.length} ${nextDates.length === 1 ? 'lembrete' : 'lembretes'} ${article} ${pet.name}` })
              }}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-black text-[15px] font-semibold text-white transition-colors hover:bg-black-2 active:scale-[.98]"
            >
              <CalendarPlus className="size-[18px] text-lime" strokeWidth={2.2} /> Adicionar à agenda
            </button>
          </Section>
        </Reveal>
      )}

      {/* contato */}
      <Reveal i={8}>
        <section className="relative overflow-hidden rounded-[30px] bg-black p-5 text-white sm:p-6">
          <div className="flex items-center gap-3">
            <LogoMark size={44} tone="lime" />
            <div className="min-w-0 flex-1">
              <div className="text-[17px] font-bold">Dúvidas sobre {pet.name}?</div>
              <div className="num text-[13.5px] font-medium text-white/60">WhatsApp {CLINIC.whatsapp}</div>
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => openWa(`Olá! Tenho uma dúvida sobre a visita ${article} ${pet.name}.`)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 text-[15px] font-semibold transition-colors hover:bg-white/15 active:scale-[.98]"
            >
              <MessageCircle className="size-[18px]" strokeWidth={2.2} /> Falar no WhatsApp
            </button>
            <button
              onClick={() => {
                toast('Pedido enviado', { description: 'A clínica responde com os horários livres.' })
                openWa(`Olá! Quero agendar a próxima visita ${article} ${pet.name}.`)
              }}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lime text-[15px] font-semibold text-ink transition-colors hover:bg-lime-2 active:scale-[.98]"
            >
              <CalendarPlus className="size-[18px]" strokeWidth={2.2} /> Agendar próxima visita
            </button>
          </div>
        </section>
      </Reveal>
    </div>
  )
}

/** Curva de peso dos últimos meses */
function Sparkline({ pet, weight }: { pet: Pet; weight: number }) {
  const pts = weightHistory(pet).map((p) => p.kg)
  pts[pts.length - 1] = weight
  const w = 300
  const h = 56
  const min = Math.min(...pts, pet.idealKg[0]) - 0.2
  const max = Math.max(...pts, pet.idealKg[1]) + 0.2
  const x = (i: number) => (i / Math.max(1, pts.length - 1)) * (w - 8) + 4
  const y = (v: number) => h - 4 - ((v - min) / (max - min)) * (h - 8)
  const d = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-auto w-full" aria-hidden>
      <rect x="0" y={y(pet.idealKg[1])} width={w} height={Math.max(2, y(pet.idealKg[0]) - y(pet.idealKg[1]))} rx="6" fill="var(--color-green-soft)" />
      <path d={d} fill="none" stroke="var(--color-black)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(pts.length - 1)} cy={y(weight)} r="4.5" fill="var(--color-lime)" stroke="var(--color-black)" strokeWidth="2" />
    </svg>
  )
}
