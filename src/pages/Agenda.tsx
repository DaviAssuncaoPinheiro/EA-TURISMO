import * as React from 'react'
import { ChevronLeft, ChevronRight, CalendarPlus, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button, PageHeader, Segmented, VetAvatar } from '@/components/ui'
import { DayTimeline } from '@/components/agenda/DayTimeline'
import { ScheduleDialog } from '@/components/agenda/ScheduleDialog'
import { WeekGrid } from '@/components/agenda/WeekGrid'
import { ZoneLegend } from '@/components/agenda/shared'
import { BASE_VISITS, cap, dayLabel, dowOf, hhmm, km1, loadOf, mondayOffset, visitsOf, type AVisit, type Suggestion } from '@/components/agenda/model'
import { BAIRRO } from '@/data/geo'
import { VET, VETS } from '@/data/mock'
import { day, fmt } from '@/data/time'
import { useDemo } from '@/store'
import { cn } from '@/lib/utils'

type View = 'semana' | 'dia'

export default function Agenda() {
  const [view, setView] = React.useState<View>('semana')
  const [weekShift, setWeekShift] = React.useState(0)
  const [dayOff, setDayOff] = React.useState(0)
  const [vetId, setVetId] = React.useState<string>('todos')
  const [open, setOpen] = React.useState(false)
  const [extras, setExtras] = React.useState<AVisit[]>([])
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const visitStatus = useDemo((s) => s.visitStatus)

  const all = React.useMemo(() => [...BASE_VISITS.map((v) => (visitStatus[v.id] ? { ...v, status: visitStatus[v.id] } : v)), ...extras], [extras, visitStatus])
  const vets = vetId === 'todos' ? VETS : VETS.filter((v) => v.id === vetId)

  const monday = mondayOffset(weekShift)
  const days = [0, 1, 2, 3, 4, 5].map((i) => monday + i)
  const first = day(days[0])
  const last = day(days[5])
  const weekLabel =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()} – ${last.getDate()} de ${last.toLocaleDateString('pt-BR', { month: 'long' })} de ${last.getFullYear()}`
      : `${fmt.short(first)} – ${fmt.short(last)} de ${last.getFullYear()}`

  const weekVisits = days.flatMap((o) => vets.flatMap((v) => visitsOf(all, v.id, o)))
  const weekKm = vets.reduce((s, v) => s + days.reduce((t, o) => t + loadOf(visitsOf(all, v.id, o)).km, 0), 0)

  const step = (dir: 1 | -1) => {
    if (view === 'semana') return setWeekShift((w) => w + dir)
    let o = dayOff + dir
    if (dowOf(o) === 7) o += dir
    setDayOff(o)
    setWeekShift(Math.floor((o - mondayOffset(0)) / 7))
  }
  const goToday = () => {
    setWeekShift(0)
    setDayOff(0)
  }
  const openDay = (o: number) => {
    setDayOff(o)
    setView('dia')
  }

  const confirm = (v: AVisit, s: Suggestion) => {
    setExtras((e) => [...e, v])
    setOpen(false)
    setWeekShift(Math.floor((s.off - mondayOffset(0)) / 7))
    setDayOff(s.off)
    setFreshId(v.id)
    window.setTimeout(() => setFreshId(null), 5000)
    toast.success(`Encaixe confirmado: ${dayLabel(s.off)} às ${hhmm(s.startMin)}`, {  })
  }

  const title = view === 'semana' ? weekLabel : cap(fmt.long(day(dayOff)))

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader
        eyebrow="Agenda por região"
        title="Quem vai a cada zona, e quando"
        description={`${weekVisits.length} visitas na semana, ${Math.round(weekKm)} km rodados. Os pedidos entram no dia em que a equipe já estará no bairro.`}
        actions={
          <Button variant="accent" onClick={() => setOpen(true)}>
            <CalendarPlus size={16} strokeWidth={1.8} />
            Encaixar novo pedido
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="flex size-9 items-center justify-center rounded-md border border-line-2 bg-card text-ink-2 shadow-card hover:bg-card-2" aria-label="Anterior">
            <ChevronLeft size={16} strokeWidth={1.8} />
          </button>
          <button onClick={() => step(1)} className="flex size-9 items-center justify-center rounded-md border border-line-2 bg-card text-ink-2 shadow-card hover:bg-card-2" aria-label="Próximo">
            <ChevronRight size={16} strokeWidth={1.8} />
          </button>
        </div>
        <h2 className="min-w-0 font-display text-[19px] font-medium text-ink num md:min-w-[190px]">{title}</h2>
        <Button variant="outline" size="sm" onClick={goToday}>
          Hoje
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-md bg-paper-2 p-0.5">
            <VetPill active={vetId === 'todos'} onClick={() => setVetId('todos')}>
              Equipe
            </VetPill>
            {VETS.map((v) => (
              <VetPill key={v.id} active={vetId === v.id} onClick={() => setVetId(v.id)}>
                <VetAvatar vetId={v.id} size={18} />
                {v.short.replace(/^Dra?\. /, '')}
              </VetPill>
            ))}
          </div>
          <Segmented<View>
            value={view}
            onChange={setView}
            size="md"
            options={[
              { value: 'semana', label: 'Semana' },
              { value: 'dia', label: 'Dia' },
            ]}
          />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <ZoneLegend />
        <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
          <Lock size={11} strokeWidth={2} /> Horário marcado pelo tutor, não muda na otimização
        </span>
      </div>

      {view === 'semana' ? <WeekGrid days={days} vets={vets} all={all} freshId={freshId} onOpenDay={openDay} /> : <DayTimeline off={dayOff} vets={vets} all={all} freshId={freshId} />}

      <ScheduleDialog open={open} onOpenChange={setOpen} all={all} onConfirm={confirm} />
    </div>
  )
}

function VetPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[12.5px] font-medium transition-colors', active ? 'bg-card text-ink shadow-card' : 'text-ink-3 hover:text-ink-2')}>
      {children}
    </button>
  )
}
