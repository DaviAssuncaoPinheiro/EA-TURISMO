import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { ZoneChip } from '@/components/agenda/shared'
import { Badge, PetAvatar, VetAvatar } from '@/components/ui'

import { ageLabel, fmt, relDays } from '@/data/time'
import { cn, kg } from '@/lib/utils'
import { type PatientRow } from './model'

export type SortKey = 'pet' | 'tutor' | 'bairro' | 'idade' | 'peso' | 'vacina' | 'proxima' | 'ultimo' | 'vet'
export interface Sort {
  key: SortKey
  dir: 1 | -1
}

const COLS: { key: SortKey; label: string; cls?: string; align?: 'right' }[] = [
  { key: 'pet', label: 'Paciente' },
  { key: 'tutor', label: 'Tutor' },
  { key: 'bairro', label: 'Bairro' },
  { key: 'idade', label: 'Idade' },
  { key: 'peso', label: 'Peso', align: 'right' },
  { key: 'vacina', label: 'Vacinas' },
  { key: 'proxima', label: 'Próxima' },
  { key: 'ultimo', label: 'Último atend.' },
  { key: 'vet', label: 'Vet' },
]

function VacBadge({ r }: { r: PatientRow }) {
  return (
    <Badge tone={r.vac.tone} dot>
      {r.vac.label}
    </Badge>
  )
}

export function PatientTable({ rows, sort, onSort }: { rows: PatientRow[]; sort: Sort; onSort: (k: SortKey) => void }) {
  const nav = useNavigate()
  return (
    <div className="hidden overflow-hidden rounded-xl border border-line bg-card shadow-card xl:block">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-card-2">
            {COLS.map((c) => {
              const active = sort.key === c.key
              return (
                <th key={c.key} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={cn('h-10 px-3 first:pl-4 last:pr-4', c.align === 'right' && 'text-right')}>
                  <button onClick={() => onSort(c.key)} className={cn('eyebrow inline-flex items-center gap-1 transition-colors hover:!text-ink', active && '!text-ink')}>
                    {c.label}
                    {active ? sort.dir === 1 ? <ArrowUp size={11} strokeWidth={2} /> : <ArrowDown size={11} strokeWidth={2} /> : <ChevronsUpDown size={11} strokeWidth={1.8} className="opacity-50" />}
                  </button>
                </th>
              )
            })}
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
              className="group cursor-pointer border-b border-line/70 transition-colors last:border-0 hover:bg-sage-50/70 focus-visible:bg-sage-50/70"
            >
              <td className="py-2.5 pr-3 pl-4">
                <div className="flex items-center gap-3">
                  <PetAvatar pet={r.pet} size={36} />
                  <div className="min-w-0 leading-tight">
                    <div className="font-display text-[15.5px] font-medium text-ink">{r.pet.name}</div>
                    <div className="truncate text-[12px] text-ink-3">
                      {r.pet.species === 'cão' ? 'Cão' : 'Gato'} · {r.pet.breed}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-3 text-[13px] text-ink">{r.tutorName}</td>
              <td className="px-3">
                <div className="flex flex-col items-start gap-1">
                  <span className="text-[13px] text-ink">{r.bairroName}</span>
                  <ZoneChip id={r.zone} size="xs" />
                </div>
              </td>
              <td className="px-3 text-[13px] whitespace-nowrap text-ink-2 num">{ageLabel(r.pet.birth)}</td>
              <td className="px-3 text-right text-[13px] whitespace-nowrap text-ink-2 num">{kg(r.weight)}</td>
              <td className="px-3">
                <VacBadge r={r} />
              </td>
              <td className="px-3 text-[12.5px] whitespace-nowrap text-ink-2">
                {r.next ? (
                  <>
                    <span className="font-medium text-ink">{r.next.label}</span> <span className="num">{fmt.short(r.next.date)}</span>
                  </>
                ) : (
                  <span className="text-ink-4">—</span>
                )}
              </td>
              <td className="px-3 text-[12.5px] whitespace-nowrap text-ink-2">{r.last ? relDays(r.last) : <span className="text-ink-4">—</span>}</td>
              <td className="px-3 pr-4">{r.vetId ? <VetAvatar vetId={r.vetId} size={26} /> : <span className="text-ink-4">—</span>}</td>
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
          <button onClick={() => nav(`/pacientes/${r.pet.id}`)} className="flex min-h-[64px] w-full items-center gap-3 rounded-xl border border-line bg-card p-3 text-left shadow-card transition-colors hover:bg-card-2 active:bg-paper-2">
            <PetAvatar pet={r.pet} size={46} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-display text-[16.5px] leading-tight font-medium text-ink">{r.pet.name}</span>
                <span className="truncate text-[12px] text-ink-3">{r.pet.breed}</span>
              </div>
              <div className="mt-0.5 truncate text-[12.5px] text-ink-2">
                {r.tutorName} · {r.bairroName}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <VacBadge r={r} />
                <ZoneChip id={r.zone} size="xs" />
                <span className="text-[11.5px] text-ink-3 num">
                  {ageLabel(r.pet.birth)} · {kg(r.weight)}
                </span>
              </div>
            </div>
            {r.vetId && <VetAvatar vetId={r.vetId} size={24} className="self-start" />}
          </button>
        </motion.li>
      ))}
    </ul>
  )
}

