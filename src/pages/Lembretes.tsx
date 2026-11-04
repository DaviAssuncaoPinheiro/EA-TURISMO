import * as React from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { BellRing, Inbox, LayoutGrid, List, Send, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Empty, PageHeader, Segmented, VetAvatar } from '@/components/ui'
import { VETS } from '@/data/mock'
import { ZONES, type ZoneId } from '@/data/geo'
import { daysFromToday } from '@/data/time'
import { REMINDER_KIND } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { enrich, GROUPS, TICKET, type GroupKey, type Item, type ReminderKind } from '@/components/reminders/data'
import { Panel, useIsDesktop } from '@/components/reminders/Panel'
import { BoardCard, ListRow } from '@/components/reminders/ReminderItem'
import { ReminderDetail } from '@/components/reminders/ReminderDetail'
import { ResultStrip } from '@/components/reminders/ResultStrip'
import { INITIAL_RULES, RulesPanel } from '@/components/reminders/RulesPanel'

const KINDS = Object.keys(REMINDER_KIND) as ReminderKind[]
const GROUP_DOT: Record<GroupKey, string> = { atrasados: 'bg-late', enviar: 'bg-ink-3', enviados: 'bg-info', confirmados: 'bg-ok' }

function Pill({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium whitespace-nowrap transition-colors',
        active ? 'border-sage-800 bg-sage-800 text-paper' : 'border-line-2 bg-card text-ink-2 hover:border-ink-4 hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function Lembretes() {
  const reminders = useDemo((s) => s.reminders)
  const setStatus = useDemo((s) => s.setReminderStatus)
  const desktop = useIsDesktop()
  const [view, setView] = React.useState<'quadro' | 'lista'>('quadro')
  const effective = desktop ? view : 'lista'
  const [kind, setKind] = React.useState<ReminderKind | 'todos'>('todos')
  const [vet, setVet] = React.useState<string | 'todos'>('todos')
  const [zone, setZone] = React.useState<ZoneId | 'todas'>('todas')
  const [selId, setSelId] = React.useState<string | null>(null)
  const [rulesOpen, setRulesOpen] = React.useState(false)
  const [rules, setRules] = React.useState(INITIAL_RULES)
  const [hour, setHour] = React.useState('09:00')
  const [suggestDay, setSuggestDay] = React.useState(true)
  const [custom, setCustom] = React.useState<Record<string, string>>({})
  const [flash, setFlash] = React.useState<Set<string>>(new Set())
  const [sending, setSending] = React.useState(false)

  const all = React.useMemo(() => enrich(reminders), [reminders])
  const items = React.useMemo(
    () => all.filter((i) => (kind === 'todos' || i.r.kind === kind) && (vet === 'todos' || i.r.createdBy === vet) && (zone === 'todas' || i.zone === zone)),
    [all, kind, vet, zone],
  )
  const byGroup = React.useMemo(() => {
    const m: Record<GroupKey, Item[]> = { atrasados: [], enviar: [], enviados: [], confirmados: [] }
    items.forEach((i) => m[i.group].push(i))
    return m
  }, [items])
  const selected = all.find((i) => i.r.id === selId) ?? null

  // resultados (sobre todos os lembretes, sem filtro)
  const lateVacc = all.filter((i) => i.r.kind === 'vacina' && daysFromToday(i.r.dueDate) < 0)
  const lateBooked = lateVacc.filter((i) => i.r.status === 'agendado' || i.r.status === 'confirmado').length
  const won = all.filter((i) => i.r.status === 'agendado' || i.r.status === 'confirmado')
  const revenue = won.reduce((s, i) => s + TICKET[i.r.kind], 0) + 2860 // base do mês já recuperada antes de hoje

  const batch = all.filter((i) => (i.r.status === 'programado' && daysFromToday(i.r.sendDate) <= 10) || i.r.status === 'sem-resposta')

  const sendBatch = () => {
    if (sending || !batch.length) {
      if (!batch.length) toast('Nenhuma mensagem pendente', { description: 'Tudo o que estava programado já foi enviado.' })
      return
    }
    setSending(true)
    const ids = batch.map((i) => i.r.id)
    ids.forEach((id, n) => {
      window.setTimeout(() => {
        setStatus(id, 'enviado')
        setFlash((f) => new Set(f).add(id))
        window.setTimeout(() => setFlash((f) => { const x = new Set(f); x.delete(id); return x }), 1100)
        if (n === ids.length - 1) {
          setSending(false)
          toast.success(`${ids.length} mensagens enviadas`, { description: 'Entregues pelo WhatsApp Business. As respostas chegam aqui.' })
        }
      }, 260 * n)
    })
  }

  const open = (id: string) => setSelId(id)
  const filtersActive = kind !== 'todos' || vet !== 'todos' || zone !== 'todas'

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 pb-28 md:px-8 md:py-8 md:pb-10">
      <PageHeader
        eyebrow="Retornos e vacinas"
        title="Lembretes"
        description="Nascem da orientação do veterinário na consulta e saem por WhatsApp no momento certo, já oferecendo o dia em que a equipe estará no bairro."
        actions={
          <>
            <Button variant="outline" onClick={() => setRulesOpen(true)}>
              <Settings2 size={16} strokeWidth={1.8} /> Regras automáticas
            </Button>
            <Button variant="accent" onClick={sendBatch} disabled={sending}>
              <Send size={16} strokeWidth={1.8} /> Enviar lote de hoje
              {batch.length > 0 && <span className="num ml-0.5 rounded-full bg-white/20 px-1.5 text-[11.5px] leading-[18px]">{batch.length}</span>}
            </Button>
          </>
        }
      />

      <ResultStrip lateVaccines={lateVacc.length} lateBooked={lateBooked} revenue={revenue} visits={won.length} />

      {/* filtros */}
      <div className="mt-7 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
            <Pill active={kind === 'todos'} onClick={() => setKind('todos')}>Todos <span className="num opacity-60">{all.length}</span></Pill>
            {KINDS.map((k) => (
              <Pill key={k} active={kind === k} onClick={() => setKind(kind === k ? 'todos' : k)}>
                {REMINDER_KIND[k].label}
                <span className="num opacity-60">{all.filter((i) => i.r.kind === k).length}</span>
              </Pill>
            ))}
          </div>
          <Segmented
            className="hidden shrink-0 lg:inline-flex"
            size="md"
            value={view}
            onChange={setView}
            options={[
              { value: 'quadro', label: <><LayoutGrid size={14} strokeWidth={1.8} /> Quadro</> },
              { value: 'lista', label: <><List size={14} strokeWidth={1.8} /> Lista</> },
            ]}
          />
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          <span className="eyebrow mr-1 shrink-0">Veterinário</span>
          {VETS.map((v) => (
            <Pill key={v.id} active={vet === v.id} onClick={() => setVet(vet === v.id ? 'todos' : v.id)} className="pl-1.5">
              <VetAvatar vetId={v.id} size={20} /> {v.short}
            </Pill>
          ))}
          <span className="mx-2 h-5 w-px shrink-0 bg-line-2" />
          <span className="eyebrow mr-1 shrink-0">Zona</span>
          {ZONES.map((z) => (
            <Pill key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)}>
              <span className="size-2 rounded-full" style={{ background: z.hex }} /> {z.short}
            </Pill>
          ))}
          {filtersActive && (
            <button onClick={() => { setKind('todos'); setVet('todos'); setZone('todas') }} className="ml-1 shrink-0 text-[12.5px] font-medium text-terra-600 hover:text-terra-700">
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* pipeline */}
      <LayoutGroup>
        {items.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-line-2 bg-card/50">
            <Empty icon={<Inbox size={28} strokeWidth={1.5} />} title="Nenhum lembrete com esses filtros">Tente outro tipo, veterinário ou zona.</Empty>
          </div>
        ) : effective === 'quadro' ? (
          <div className="mt-5 grid grid-cols-4 items-start gap-3">
            {GROUPS.map((g) => (
              <div key={g.key} className="min-w-0 rounded-xl bg-paper-2/60 p-2 ring-1 ring-line/70">
                <div className="flex items-start gap-2 px-2 pt-1.5 pb-2.5">
                  <span className={cn('mt-[7px] size-2 shrink-0 rounded-full', GROUP_DOT[g.key])} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-[13.5px] font-semibold text-ink">{g.title}</h3>
                      <span className="num rounded-full bg-card px-1.5 text-[11.5px] leading-5 font-medium text-ink-2 ring-1 ring-line">{byGroup[g.key].length}</span>
                    </div>
                    <p className="truncate text-[11.5px] text-ink-3">{g.hint}</p>
                  </div>
                </div>
                <div className="scroll-thin flex max-h-[640px] flex-col gap-2 overflow-y-auto px-0.5 pb-0.5">
                  {byGroup[g.key].map((it, n) => (
                    <BoardCard key={it.r.id} it={it} index={n} selected={selId === it.r.id} flash={flash.has(it.r.id)} onOpen={() => open(it.r.id)} />
                  ))}
                  {byGroup[g.key].length === 0 && <div className="rounded-lg border border-dashed border-line-2 px-3 py-6 text-center text-[12px] text-ink-3">Nada por aqui</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            {GROUPS.filter((g) => byGroup[g.key].length > 0).map((g) => (
              <section key={g.key}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={cn('size-2 rounded-full', GROUP_DOT[g.key])} />
                  <h3 className="text-[14px] font-semibold text-ink">{g.title}</h3>
                  <span className="num text-[12px] text-ink-3">{byGroup[g.key].length}</span>
                  <span className="ml-1 hidden text-[12px] text-ink-3 sm:inline">· {g.hint}</span>
                </div>
                <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-card shadow-card">
                  {byGroup[g.key].map((it) => (
                    <ListRow key={it.r.id} it={it} selected={selId === it.r.id} flash={flash.has(it.r.id)} onOpen={() => open(it.r.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </LayoutGroup>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 flex items-center gap-2 text-[12px] text-ink-3">
        <BellRing size={14} strokeWidth={1.8} /> Lembretes criados no app de campo, ao finalizar um atendimento, entram aqui com o selo Novo.
      </motion.p>

      <Panel open={!!selected} onOpenChange={(o) => !o && setSelId(null)} title={selected ? `Lembrete de ${selected.pet.name}` : 'Lembrete'}>
        {selected && <ReminderDetail item={selected} custom={custom[selected.r.id]} onCustom={(id, v) => setCustom((c) => { const n = { ...c }; if (v === undefined) delete n[id]; else n[id] = v; return n })} onClose={() => setSelId(null)} />}
      </Panel>
      <Panel open={rulesOpen} onOpenChange={setRulesOpen} title="Regras automáticas" width="w-[520px]">
        <RulesPanel rules={rules} setRules={setRules} hour={hour} setHour={setHour} suggestDay={suggestDay} setSuggestDay={setSuggestDay} onClose={() => setRulesOpen(false)} />
      </Panel>
    </div>
  )
}
