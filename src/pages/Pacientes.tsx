import * as React from 'react'
import { CalendarClock, PawPrint, Scale, Search, SearchX, Syringe, X } from 'lucide-react'
import { PatientCards, PatientTable, type Sort, type SortKey } from '@/components/patients/PatientViews'
import { buildRows, vacRank, type PatientRow } from '@/components/patients/model'
import { Chip, Empty, IconCircle, Segmented } from '@/components/ui'
import { ZONES, type ZoneId } from '@/data/geo'
import { VET } from '@/data/mock'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'

type Species = 'todos' | 'cão' | 'gato'
type Vac = 'todas' | 'ok' | 'soon' | 'late'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const cmp: Record<SortKey, (a: PatientRow, b: PatientRow) => number> = {
  pet: (a, b) => a.pet.name.localeCompare(b.pet.name, 'pt-BR'),
  tutor: (a, b) => a.tutorName.localeCompare(b.tutorName, 'pt-BR'),
  bairro: (a, b) => a.bairroName.localeCompare(b.bairroName, 'pt-BR'),
  idade: (a, b) => +new Date(b.pet.birth) - +new Date(a.pet.birth),
  peso: (a, b) => a.weight - b.weight,
  vacina: (a, b) => vacRank(a.vac.key) - vacRank(b.vac.key),
  proxima: (a, b) => +new Date(a.next?.date ?? '2100-01-01') - +new Date(b.next?.date ?? '2100-01-01'),
  ultimo: (a, b) => +new Date(b.last ?? 0) - +new Date(a.last ?? 0),
  vet: (a, b) => (VET[a.vetId ?? '']?.name ?? 'z').localeCompare(VET[b.vetId ?? '']?.name ?? 'z', 'pt-BR'),
}

export default function Pacientes() {
  const extraDoses = useDemo((s) => s.extraDoses)
  const extraEvents = useDemo((s) => s.extraEvents)
  const extraWeights = useDemo((s) => s.extraWeights)
  const rows = React.useMemo(() => buildRows(extraDoses, extraEvents, extraWeights), [extraDoses, extraEvents, extraWeights])

  const [q, setQ] = React.useState('')
  const [species, setSpecies] = React.useState<Species>('todos')
  const [vac, setVac] = React.useState<Vac>('todas')
  const [zone, setZone] = React.useState<ZoneId | 'todas'>('todas')
  const [sort, setSort] = React.useState<Sort>({ key: 'vacina', dir: 1 })

  const filtered = React.useMemo(() => {
    const t = norm(q.trim())
    const out = rows.filter(
      (r) =>
        (species === 'todos' || r.pet.species === species) &&
        (vac === 'todas' || r.vac.key === vac) &&
        (zone === 'todas' || r.zone === zone) &&
        (!t || norm(`${r.pet.name} ${r.pet.breed} ${r.tutorName} ${r.bairroName}`).includes(t)),
    )
    return out.sort((a, b) => cmp[sort.key](a, b) * sort.dir || a.pet.name.localeCompare(b.pet.name, 'pt-BR'))
  }, [rows, q, species, vac, zone, sort])

  const onSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))

  const late = rows.filter((r) => r.vac.key === 'late').length
  const soon = rows.filter((r) => r.vac.key === 'soon').length
  const dogs = rows.filter((r) => r.pet.species === 'cão').length
  const cats = rows.length - dogs
  const heavy = rows.filter((r) => r.weight > r.pet.idealKg[1]).length
  const filtering = q || species !== 'todos' || vac !== 'todas' || zone !== 'todas'
  const clear = () => {
    setQ('')
    setSpecies('todos')
    setVac('todas')
    setZone('todas')
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-2 pb-28 md:px-6 md:pb-8">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">Pacientes</h1>
        <span className="inline-flex h-8 items-center rounded-full bg-card px-3 text-[13px] font-bold text-ink-2 shadow-pill num">{rows.length}</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Stat icon={<Syringe size={18} strokeWidth={1.9} />} tone="coral" label="Vacina atrasada" value={late} onClick={() => setVac(vac === 'late' ? 'todas' : 'late')} active={vac === 'late'} />
        <Stat icon={<CalendarClock size={18} strokeWidth={1.9} />} tone="yellow" label="Vencem em 30 dias" value={soon} onClick={() => setVac(vac === 'soon' ? 'todas' : 'soon')} active={vac === 'soon'} />
        <Stat icon={<PawPrint size={18} strokeWidth={1.9} />} tone="blue" label="Cães e gatos" value={`${dogs} e ${cats}`} />
        <Stat icon={<Scale size={18} strokeWidth={1.9} />} tone="violet" label="Acima do peso" value={heavy} />
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={19} strokeWidth={2} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por pet, raça, tutor ou bairro"
            className="h-14 w-full rounded-full bg-card pr-12 pl-12 text-[15px] font-medium text-ink shadow-pill outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-black"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Limpar busca" className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-muted text-ink-2 hover:bg-muted-2">
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Species>
            value={species}
            onChange={setSpecies}
            size="md"
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'cão', label: 'Cães' },
              { value: 'gato', label: 'Gatos' },
            ]}
          />
          <div className="no-scrollbar -mx-4 flex min-w-0 items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
            {(
              [
                ['todas', 'Todas'],
                ['ok', 'Em dia'],
                ['soon', 'Vence em 30 dias'],
                ['late', 'Atrasada'],
              ] as [Vac, string][]
            ).map(([k, label]) => (
              <Chip key={k} active={vac === k} onClick={() => setVac(k)} className="shrink-0">
                {label}
              </Chip>
            ))}
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Chip active={zone === 'todas'} onClick={() => setZone('todas')} className="shrink-0">
            Todas as zonas
          </Chip>
          {ZONES.map((z) => (
            <Chip key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)} color={z.hex} className="shrink-0">
              {z.short}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between px-1 text-[12.5px] font-medium text-ink-3">
        <span className="num">
          {filtered.length} de {rows.length} pacientes
        </span>
        {filtering && (
          <button onClick={clear} className="font-semibold text-ink-2 underline-offset-2 hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[28px] bg-card shadow-card">
          <Empty icon={<SearchX size={24} strokeWidth={1.7} />} title="Nenhum paciente encontrado">
            Revise a busca ou limpe os filtros.
          </Empty>
        </div>
      ) : (
        <>
          <PatientTable rows={filtered} sort={sort} onSort={onSort} />
          <PatientCards rows={filtered} />
        </>
      )}
    </div>
  )
}

function Stat({ icon, tone, label, value, onClick, active }: { icon: React.ReactNode; tone: 'coral' | 'yellow' | 'blue' | 'violet'; label: string; value: number | string; onClick?: () => void; active?: boolean }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cn('rounded-[22px] bg-card p-4 text-left shadow-card transition-[box-shadow,transform]', onClick && 'hover:shadow-lift active:scale-[.98]', active && 'ring-2 ring-black')}>
      <IconCircle size={36} tone={tone}>
        {icon}
      </IconCircle>
      <div className="mt-3 text-[12.5px] font-medium text-ink-3">{label}</div>
      <div className="mt-0.5 text-[28px] leading-none font-bold tracking-[-0.02em] text-ink num">{value}</div>
    </Tag>
  )
}
