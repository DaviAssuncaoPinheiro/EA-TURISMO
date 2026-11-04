import * as React from 'react'
import { Search, SearchX, X } from 'lucide-react'
import { PatientCards, PatientTable, type Sort, type SortKey } from '@/components/patients/PatientViews'
import { buildRows, vacRank, type PatientRow } from '@/components/patients/model'
import { Empty, PageHeader, Segmented } from '@/components/ui'
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
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-8 md:py-8">
      <PageHeader eyebrow="Cadastro" title="Pacientes" description={`${rows.length} pets de ${new Set(rows.map((r) => r.pet.tutorId)).size} famílias atendidas em domicílio.`} />

      <div className="mb-4 grid grid-cols-2 divide-x divide-line overflow-hidden rounded-xl border border-line bg-card shadow-card md:grid-cols-4 [&>*:nth-child(n+3)]:max-md:border-t [&>*:nth-child(n+3)]:max-md:border-line">
        <Stat label="Vacina atrasada" value={late} sub={late === 1 ? 'paciente' : 'pacientes'} tone="late" onClick={() => setVac(vac === 'late' ? 'todas' : 'late')} active={vac === 'late'} />
        <Stat label="Vencem em 30 dias" value={soon} sub="pacientes" tone="warn" onClick={() => setVac(vac === 'soon' ? 'todas' : 'soon')} active={vac === 'soon'} />
        <Stat label="Espécies" value={`${dogs} · ${cats}`} sub="cães · gatos" />
        <Stat label="Acima do peso ideal" value={heavy} sub={heavy === 1 ? 'paciente' : 'pacientes'} />
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-0 flex-1 basis-64 md:max-w-[420px]">
            <Search size={16} strokeWidth={1.8} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por pet, raça, tutor ou bairro"
              className="h-10 w-full rounded-lg border border-line-2 bg-card pr-9 pl-9 text-[14px] text-ink shadow-card outline-none placeholder:text-ink-4 focus:border-sage-600"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Limpar busca" className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1.5 text-ink-3 hover:bg-paper-2">
                <X size={14} strokeWidth={1.8} />
              </button>
            )}
          </div>
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
          <div className="no-scrollbar max-w-full overflow-x-auto">
            <Segmented<Vac>
              value={vac}
              onChange={setVac}
              size="md"
              options={[
                { value: 'todas', label: 'Todas' },
                { value: 'ok', label: 'Em dia' },
                { value: 'soon', label: 'Vence em 30d' },
                { value: 'late', label: 'Atrasada' },
              ]}
            />
          </div>
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <span className="eyebrow mr-1 shrink-0">Zona</span>
          <ZoneToggle active={zone === 'todas'} onClick={() => setZone('todas')}>
            Todas
          </ZoneToggle>
          {ZONES.map((z) => (
            <ZoneToggle key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)}>
              <span className="size-2 rounded-full" style={{ background: z.hex }} />
              {z.short}
            </ZoneToggle>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between text-[12.5px] text-ink-3">
        <span className="num">
          {filtered.length} de {rows.length} pacientes
        </span>
        {filtering && (
          <button onClick={clear} className="font-medium text-ink-2 underline-offset-2 hover:underline">
            Limpar filtros
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-2 bg-card">
          <Empty icon={<SearchX size={26} strokeWidth={1.5} />} title="Nenhum paciente encontrado">
            Revise a busca ou limpe os filtros para ver todos os pets cadastrados.
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

function Stat({ label, value, sub, tone, onClick, active }: { label: string; value: number | string; sub: string; tone?: 'late' | 'warn'; onClick?: () => void; active?: boolean }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} className={cn('px-4 py-3 text-left transition-colors', onClick && 'hover:bg-card-2', active && 'bg-card-2')}>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={cn('font-display text-[28px] leading-none font-medium num', tone === 'late' ? 'text-late' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</span>
        <span className="text-[12px] text-ink-3">{sub}</span>
      </div>
    </Tag>
  )
}

function ZoneToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors', active ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2 bg-card text-ink-2 hover:bg-paper-2')}>
      {children}
    </button>
  )
}
