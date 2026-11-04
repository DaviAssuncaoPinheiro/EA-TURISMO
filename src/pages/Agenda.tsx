import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button, IconButton, Segmented, VetAvatar } from '@/components/ui'
import { DayTimeline } from '@/components/agenda/DayTimeline'
import { ScheduleDialog } from '@/components/agenda/ScheduleDialog'
import { WeekGrid } from '@/components/agenda/WeekGrid'
import { ZoneLegend } from '@/components/agenda/shared'
import { BASE_VISITS, cap, dayLabel, dowOf, hhmm, mondayOffset, type AVisit, type Suggestion } from '@/components/agenda/model'
import { VETS } from '@/data/mock'
import { day, fmt } from '@/data/time'
import { useDemo } from '@/store'
import { cn } from '@/lib/utils'

type View = 'semana' | 'dia'

export default function Agenda() {
  const [view, setView] = React.useState<View>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'dia' : 'semana'))
  const [weekShift, setWeekShift] = React.useState(0)
  const [dayOff, setDayOff] = React.useState(0)
  const [vetId, setVetId] = React.useState<string>('todos')
  const [open, setOpen] = React.useState(false)
  const [extras, setExtras] = React.useState<AVisit[]>([])
  const [freshId, setFreshId] = React.useState<string | null>(null)
  const visitStatus = useDemo((s) => s.visitStatus)
  const [params, setParams] = useSearchParams()

  // o botão "Nova visita" do topo chega aqui com ?novo=1
  React.useEffect(() => {
    if (params.get('novo')) {
      setOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const all = React.useMemo(() => [...BASE_VISITS.map((v) => (visitStatus[v.id] ? { ...v, status: visitStatus[v.id] } : v)), ...extras], [extras, visitStatus])
  const vets = vetId === 'todos' ? VETS : VETS.filter((v) => v.id === vetId)

  const monday = mondayOffset(weekShift)
  const days = [0, 1, 2, 3, 4, 5].map((i) => monday + i)
  const first = day(days[0])
  const last = day(days[5])
  const weekLabel =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()} a ${last.getDate()} de ${last.toLocaleDateString('pt-BR', { month: 'long' })}`
      : `${fmt.short(first)} a ${fmt.short(last)}`

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
    toast.success(`Encaixe confirmado: ${dayLabel(s.off)} às ${hhmm(s.startMin)}`)
  }

  const title = view === 'semana' ? weekLabel : cap(fmt.long(day(dayOff)))

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Agenda</h1>
        <Button variant="primary" size="lg" onClick={() => setOpen(true)} className="hidden sm:inline-flex">
          <Plus size={17} strokeWidth={2.2} />
          Encaixar visita
        </Button>
        <Button variant="primary" size="md" onClick={() => setOpen(true)} className="sm:hidden">
          <Plus size={16} strokeWidth={2.2} />
          Encaixar
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex h-10 min-w-0 items-center gap-2 rounded-full bg-card px-4 text-[13.5px] font-semibold text-ink shadow-pill">
          <CalendarDays size={16} strokeWidth={2} className="shrink-0 text-ink-2" />
          <span className="truncate num">{title}</span>
        </div>
        <IconButton size={40} onClick={() => step(-1)} aria-label="Anterior">
          <ArrowLeft size={16} strokeWidth={2} />
        </IconButton>
        <IconButton size={40} onClick={() => step(1)} aria-label="Próximo">
          <ArrowRight size={16} strokeWidth={2} />
        </IconButton>
        <Button variant="outline" onClick={goToday}>
          Hoje
        </Button>
        <Segmented<View>
          value={view}
          onChange={setView}
          size="md"
          options={[
            { value: 'semana', label: 'Semana' },
            { value: 'dia', label: 'Dia' },
          ]}
        />
        <div className="no-scrollbar flex max-w-full items-center gap-1.5 overflow-x-auto md:ml-auto">
          <VetChip active={vetId === 'todos'} onClick={() => setVetId('todos')}>
            Equipe
          </VetChip>
          {VETS.map((v) => (
            <VetChip key={v.id} active={vetId === v.id} onClick={() => setVetId(v.id)} avatar={<VetAvatar vetId={v.id} size={28} />}>
              {v.short.replace(/^Dra?\. /, '')}
            </VetChip>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <ZoneLegend />
        <span className="text-[12px] font-medium text-ink-3">Fixo: horário marcado pelo tutor</span>
      </div>

      {view === 'semana' ? <WeekGrid days={days} vets={vets} all={all} freshId={freshId} onOpenDay={openDay} /> : <DayTimeline off={dayOff} vets={vets} all={all} freshId={freshId} />}

      <ScheduleDialog open={open} onOpenChange={setOpen} all={all} onConfirm={confirm} />
    </div>
  )
}

function VetChip({ active, onClick, avatar, children }: { active: boolean; onClick: () => void; avatar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('inline-flex h-10 shrink-0 items-center gap-2 rounded-full pr-4 text-[13px] font-semibold transition-colors', avatar ? 'pl-1.5' : 'pl-4', active ? 'bg-black text-white' : 'bg-card text-ink-2 shadow-pill hover:text-ink')}
    >
      {avatar}
      {children}
    </button>
  )
}
