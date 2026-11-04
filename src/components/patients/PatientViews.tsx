import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { ZONE } from '@/data/geo'
import { PetAvatar, VetAvatar } from '@/components/ui'
import { ageLabel, fmt, relDays } from '@/data/time'
import { cn, kg } from '@/lib/utils'
import { type PatientRow } from './model'

export type SortKey = 'pet' | 'tutor' | 'bairro' | 'idade' | 'peso' | 'vacina' | 'proxima' | 'ultimo' | 'vet'
export interface Sort {
  key: SortKey
  dir: 1 | -1
}

const COLS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'pet', label: 'Paciente' },
  { key: 'tutor', label: 'Tutor' },
  { key: 'bairro', label: 'Bairro' },
  { key: 'idade', label: 'Idade' },
  { key: 'peso', label: 'Peso', align: 'right' },
  { key: 'vacina', label: 'Vacinas' },
  { key: 'proxima', label: 'Próxima' },
  { key: 'ultimo', label: 'Último' },
  { key: 'vet', label: 'Vet' },
]

const DOT: Record<PatientRow['vac']['key'], string> = {
  late: 'var(--color-red)',
  soon: 'var(--color-yellow)',
  ok: 'var(--color-green)',
  none: 'var(--color-ink-4)',
}

/** Status com ponto colorido e texto, como no "Current Tasks" da referência */
function Status({ r }: { r: PatientRow }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap text-ink">
      <span className="size-2 rounded-full" style={{ background: DOT[r.vac.key] }} />
      {r.vac.label}
    </span>
  )
}

export function PatientTable({ rows, sort, onSort }: { rows: PatientRow[]; sort: Sort; onSort: (k: SortKey) => void }) {
  const nav = useNavigate()
  return (
    <div className="hidden rounded-[28px] bg-card p-3 shadow-card xl:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {COLS.map((c) => {
              const active = sort.key === c.key
              return (
                <th key={c.key} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('h-10 px-3 first:pl-4', c.align === 'right' && 'text-right')}>
                  <button onClick={() => onSort(c.key)} className={cn('inline-flex items-center gap-1 text-[12.5px] font-semibold text-ink-3 transition-colors hover:text-ink', active && 'text-ink')}>
                    {c.label}
                    {active ? sort.dir === 1 ? <ArrowUp size={12} strokeWidth={2.2} /> : <ArrowDown size={12} strokeWidth={2.2} /> : <ChevronsUpDown size={12} strokeWidth={1.8} className="opacity-40" />}
                  </button>
                </th>
              )
            })}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr
              key={r.pet.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 12) * 0.02, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              tabIndex={0}
              onClick={() => nav(`/pacientes/${r.pet.id}`)}
              onKeyDown={(e) => e.key === 'Enter' && nav(`/pacientes/${r.pet.id}`)}
              className="group cursor-pointer border-t border-line/60 transition-colors hover:bg-surface focus-visible:bg-surface"
            >
              <td className="h-[68px] py-2 pr-3 pl-4">
                <div className="flex items-center gap-3">
                  <PetAvatar pet={r.pet} size={42} />
                  <div className="min-w-0 leading-tight">
                    <div className="text-[14.5px] font-bold text-ink">{r.pet.name}</div>
                    <div className="truncate text-[12px] text-ink-3">
                      {r.pet.species === 'cão' ? 'Cão' : 'Gato'} · {r.pet.breed}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 text-[13px] font-medium text-ink">{r.tutorName}</td>
              <td className="px-3">
                <span className="inline-flex items-center gap-2 text-[13px] font-medium whitespace-nowrap text-ink">
                  <span className="size-2 rounded-full" style={{ background: ZONE[r.zone].hex }} />
                  {r.bairroName}
                </span>
              </td>
              <td className="px-3 text-[13px] font-medium whitespace-nowrap text-ink-2 num">{ageLabel(r.pet.birth)}</td>
              <td className="px-3 text-right text-[13px] font-medium whitespace-nowrap text-ink-2 num">{kg(r.weight)}</td>
              <td className="px-3">
                <Status r={r} />
              </td>
              <td className="px-3 text-[13px] whitespace-nowrap text-ink-2">
                {r.next ? (
                  <>
                    <span className="font-semibold text-ink">{r.next.label}</span> <span className="num">{fmt.short(r.next.date)}</span>
                  </>
                ) : (
                  <span className="text-ink-4">Sem data</span>
                )}
              </td>
              <td className="px-3 text-[13px] font-medium whitespace-nowrap text-ink-2">{r.last ? relDays(r.last) : <span className="text-ink-4">Nunca</span>}</td>
              <td className="px-3">{r.vetId ? <VetAvatar vetId={r.vetId} size={28} /> : <span className="text-ink-4">Sem vet</span>}</td>
              <td className="pr-2">
                <span className="flex size-8 items-center justify-center rounded-full text-ink-3 transition-colors group-hover:bg-card group-hover:text-ink group-hover:shadow-pill">
                  <ChevronRight size={16} strokeWidth={2} />
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PatientCards({ rows }: { rows: PatientRow[] }) {
  const nav = useNavigate()
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 xl:hidden">
      {rows.map((r, i) => (
        <motion.li key={r.pet.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.025, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
          <button onClick={() => nav(`/pacientes/${r.pet.id}`)} className="flex min-h-[76px] w-full items-center gap-3 rounded-[22px] bg-card p-3 text-left shadow-card transition-colors hover:bg-surface active:scale-[.99]">
            <PetAvatar pet={r.pet} size={50} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-[15.5px] leading-tight font-bold text-ink">{r.pet.name}</span>
                <span className="truncate text-[12px] text-ink-3">{r.pet.breed}</span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink-3">
                {r.tutorName} · {r.bairroName}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Status r={r} />
                <span className="text-[11.5px] font-medium text-ink-3 num">
                  {ageLabel(r.pet.birth)} · {kg(r.weight)}
                </span>
              </div>
            </div>
            <ChevronRight size={18} strokeWidth={2} className="shrink-0 text-ink-4" />
          </button>
        </motion.li>
      ))}
    </ul>
  )
}
