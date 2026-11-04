import * as React from 'react'
import { LayoutGroup } from 'motion/react'
import { Inbox, LayoutGrid, List, Send, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, Chip, Empty, PageHeader, Segmented, VetAvatar } from '@/components/ui'
import { VETS } from '@/data/mock'
import { ZONES, type ZoneId } from '@/data/geo'
import { daysFromToday } from '@/data/time'
import { REMINDER_KIND } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store'
import { enrich, GROUPS, TICKET, type GroupKey, type Item, type ReminderKind } from '@/components/reminders/data'
import { Panel as Drawer, useIsDesktop } from '@/components/reminders/Panel'
import { BoardCard, ListRow } from '@/components/reminders/ReminderItem'
import { ReminderDetail } from '@/components/reminders/ReminderDetail'
import { ResultStrip } from '@/components/reminders/ResultStrip'
import { INITIAL_RULES, RulesPanel } from '@/components/reminders/RulesPanel'

const KINDS = Object.keys(REMINDER_KIND) as ReminderKind[]
const GROUP_DOT: Record<GroupKey, string> = { atrasados: 'bg-red', enviar: 'bg-ink-4', enviados: 'bg-blue', confirmados: 'bg-green' }

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
      if (!batch.length) toast('Nenhuma mensagem pendente', { description: 'Tudo já foi enviado.' })
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
          toast.success(`${ids.length} mensagens enviadas`, { description: 'Entregues pelo WhatsApp Business.' })
        }
      }, 260 * n)
    })
  }

  const open = (id: string) => setSelId(id)
  const filtersActive = kind !== 'todos' || vet !== 'todos' || zone !== 'todas'

  return (
    <div className="w-full px-4 pt-2 pb-28 md:px-6 md:pt-4 md:pb-8">
      <PageHeader
        title="Lembretes"
        description="Vacinas e retornos enviados por WhatsApp"
        actions={
          <>
            <Button variant="outline" size="lg" className="h-11 px-5 text-[14px]" onClick={() => setRulesOpen(true)}>
              <Settings2 size={16} strokeWidth={1.9} /> Regras
            </Button>
            <Button variant="primary" size="lg" className="h-11 px-5 text-[14px]" onClick={sendBatch} disabled={sending}>
              <Send size={16} strokeWidth={1.9} /> Enviar lote{batch.length > 0 && ` (${batch.length})`}
            </Button>
          </>
        }
      />

      <ResultStrip lateVaccines={lateVacc.length} lateBooked={lateBooked} revenue={revenue} visits={won.length} />

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="no-scrollbar -mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
            <Chip active={kind === 'todos'} onClick={() => setKind('todos')} className="shrink-0">Todos <span className="num opacity-60">{all.length}</span></Chip>
            {KINDS.map((k) => (
              <Chip key={k} active={kind === k} onClick={() => setKind(kind === k ? 'todos' : k)} className="shrink-0">
                {REMINDER_KIND[k].label}
                <span className="num opacity-60">{all.filter((i) => i.r.kind === k).length}</span>
              </Chip>
            ))}
          </div>
          <Segmented
            className="hidden shrink-0 lg:inline-flex"
            size="md"
            value={view}
            onChange={setView}
            options={[
              { value: 'quadro', label: <><LayoutGrid size={14} strokeWidth={1.9} /> Quadro</> },
              { value: 'lista', label: <><List size={14} strokeWidth={1.9} /> Lista</> },
            ]}
          />
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-1 md:mx-0 md:px-0">
          {VETS.map((v) => (
            <Chip key={v.id} active={vet === v.id} onClick={() => setVet(vet === v.id ? 'todos' : v.id)} className="shrink-0 pl-1.5">
              <VetAvatar vetId={v.id} size={24} /> {v.short}
            </Chip>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-line-2" />
          {ZONES.map((z) => (
            <Chip key={z.id} active={zone === z.id} onClick={() => setZone(zone === z.id ? 'todas' : z.id)} color={z.hex} className="shrink-0">
              {z.short}
            </Chip>
          ))}
          {filtersActive && (
            <button onClick={() => { setKind('todos'); setVet('todos'); setZone('todas') }} className="ml-1 h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold text-ink-2 hover:bg-muted hover:text-ink">
              Limpar
            </button>
          )}
        </div>
      </div>

      <LayoutGroup>
        {items.length === 0 ? (
          <Card className="mt-5">
            <Empty icon={<Inbox size={24} strokeWidth={1.8} />} title="Nenhum lembrete">Tente outro filtro.</Empty>
          </Card>
        ) : effective === 'quadro' ? (
          <div className="mt-4 grid grid-cols-4 items-start gap-3">
            {GROUPS.map((g) => (
              <div key={g.key} className="min-w-0 rounded-[28px] bg-muted p-2">
                <div className="flex items-center gap-2 px-3 pt-2.5 pb-3">
                  <span className={cn('size-2.5 shrink-0 rounded-full', GROUP_DOT[g.key])} />
                  <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">{g.title}</h3>
                  <span className="num inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-card px-2 text-[12px] font-bold text-ink shadow-pill">{byGroup[g.key].length}</span>
                </div>
                <div className="scroll-thin flex max-h-[680px] flex-col gap-2 overflow-y-auto pb-0.5">
                  {byGroup[g.key].map((it, n) => (
                    <BoardCard key={it.r.id} it={it} index={n} selected={selId === it.r.id} flash={flash.has(it.r.id)} onOpen={() => open(it.r.id)} />
                  ))}
                  {byGroup[g.key].length === 0 && <div className="rounded-[20px] px-3 py-8 text-center text-[12.5px] text-ink-3">Nada por aqui</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {GROUPS.filter((g) => byGroup[g.key].length > 0).map((g) => (
              <section key={g.key}>
                <div className="mb-2.5 flex items-center gap-2 px-1">
                  <span className={cn('size-2.5 rounded-full', GROUP_DOT[g.key])} />
                  <h3 className="text-[16px] font-bold text-ink">{g.title}</h3>
                  <span className="num text-[13px] font-semibold text-ink-3">{byGroup[g.key].length}</span>
                </div>
                <Card className="divide-y divide-line overflow-hidden">
                  {byGroup[g.key].map((it) => (
                    <ListRow key={it.r.id} it={it} selected={selId === it.r.id} flash={flash.has(it.r.id)} onOpen={() => open(it.r.id)} />
                  ))}
                </Card>
              </section>
            ))}
          </div>
        )}
      </LayoutGroup>

      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelId(null)} title={selected ? `Lembrete de ${selected.pet.name}` : 'Lembrete'}>
        {selected && <ReminderDetail item={selected} custom={custom[selected.r.id]} onCustom={(id, v) => setCustom((c) => { const n = { ...c }; if (v === undefined) delete n[id]; else n[id] = v; return n })} onClose={() => setSelId(null)} />}
      </Drawer>
      <Drawer open={rulesOpen} onOpenChange={setRulesOpen} title="Regras" width="w-[520px]">
        <RulesPanel rules={rules} setRules={setRules} hour={hour} setHour={setHour} suggestDay={suggestDay} setSuggestDay={setSuggestDay} onClose={() => setRulesOpen(false)} />
      </Drawer>
    </div>
  )
}
