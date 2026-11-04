// Tela 1 · Minha rota
import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, CalendarDays, Check, ChevronRight, HeartPulse, LayoutGrid, Lock, MapPin, PawPrint, RotateCcw, Route as RouteIcon, User, Wifi, WifiOff } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { PetAvatar, VetAvatar } from '@/components/ui'
import { VET, VISITS, type Visit } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { daysFromToday, fmt } from '@/data/time'
import { useDemo } from '@/store'
import { notify, useCampo } from './campoStore'
import { bairroOf, legOf, minutesSince, petOf, routeKm, vetVisitsToday, zonesOfDay } from './data'
import { Btn, ConnectivityBanner, EASE_OUT, Pressable, RoundBtn, Sheet, Toggle } from './kit'
import { MiniMap } from './MiniMap'
import { useGo, useVetId } from './nav'

export function greeting() {
  return 'Bom dia'
}

export function OfflineToggle({ dark }: { dark?: boolean }) {
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  return (
    <RoundBtn label={offline ? 'Sem sinal, toque para reconectar' : 'Simular área sem sinal'} tone={offline ? (dark ? 'lime' : 'black') : dark ? 'glass' : 'card'} onClick={() => setOffline(!offline)}>
      {offline ? <WifiOff className="size-[18px]" strokeWidth={2} /> : <Wifi className="size-[18px]" strokeWidth={2} />}
    </RoundBtn>
  )
}

type Tab = 'rota' | 'feitas'

export default function RouteScreen() {
  const vetId = useVetId()
  const vet = VET[vetId]
  const go = useGo()
  const nav = useNavigate()
  const status = useDemo((s) => s.visitStatus)
  const startedAt = useCampo((s) => s.startedAt)
  const visits = React.useMemo(() => vetVisitsToday(vetId), [vetId])
  const zones = React.useMemo(() => zonesOfDay(visits), [visits])
  const [tab, setTab] = React.useState<Tab>('rota')
  const [profile, setProfile] = React.useState(false)
  const done = visits.filter((v) => status[v.id] === 'concluida').length
  const km = routeKm(vetId)

  const featured = visits.find((v) => status[v.id] === 'em-atendimento') ?? visits.find((v) => status[v.id] === 'a-caminho') ?? visits.find((v) => status[v.id] === 'agendada')
  const upcoming = visits.filter((v) => v.id !== featured?.id && status[v.id] !== 'concluida' && status[v.id] !== 'cancelada')
  const finished = visits.filter((v) => status[v.id] === 'concluida')
  const remaining = visits.length - done

  const openRecord = (v: Visit) => {
    useCampo.getState().ensureDraft(v)
    go(`/visita/${v.id}/atendimento`, { dir: 1 })
  }

  return (
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-black)_50%,var(--color-surface)_50%)]">
      <div className="no-scrollbar absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain">
        {/* topo preto */}
        <div className="relative overflow-hidden bg-black px-5 pb-12 text-white" style={{ paddingTop: 'calc(var(--sat) + 10px)' }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_85%_0%,rgba(255,255,255,.10),transparent_60%)]" />
          <div className="relative flex items-center gap-3">
            <Pressable scale={0.94} onClick={() => setProfile(true)} aria-label="Perfil" className="rounded-full">
              <VetAvatar vetId={vetId} size={46} className="ring-2 ring-white/15" />
            </Pressable>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] font-bold tracking-[-0.02em]">
                {greeting()}, {firstName(vet.name)}
              </div>
              <div className="text-[13.5px] font-medium text-white/55">{visits.length} visitas hoje</div>
            </div>
            <OfflineToggle dark />
            <RoundBtn label="Painel da clínica" tone="glass" onClick={() => nav('/')}>
              <LayoutGrid className="size-[18px]" strokeWidth={2} />
            </RoundBtn>
          </div>

          <div className="relative mt-4">
            <ConnectivityBanner dark />
          </div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }} className="relative mt-2 rounded-[28px] bg-white/[0.06] p-5 ring-1 ring-white/10">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[13.5px] font-medium text-white/55">Rota de hoje</div>
                <div className="num mt-1 text-[44px] leading-none font-bold tracking-[-0.04em]">
                  {Math.round(km)} <span className="text-[26px] tracking-[-0.02em] text-white/70">km</span>
                </div>
              </div>
              <span className="mt-1 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-[12.5px] font-semibold text-white/80">
                <RouteIcon className="size-3.5" strokeWidth={2.2} /> Saída 07:40
              </span>
            </div>
            <div className="mt-3 text-[13.5px] font-semibold">
              <span className="text-lime">
                {done} de {visits.length} concluídas
              </span>
              <span className="text-white/45"> · {remaining} restantes</span>
            </div>
            <div className="mt-3 flex gap-1">
              {visits.map((v, i) => (
                <motion.span
                  key={v.id}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.04, ease: EASE_OUT }}
                  className={cn('h-1.5 flex-1 origin-left rounded-full', status[v.id] === 'concluida' ? 'bg-lime' : status[v.id] === 'em-atendimento' ? 'bg-white' : 'bg-white/15')}
                />
              ))}
            </div>
          </motion.div>

          <div className="no-scrollbar relative -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
            {zones.map((z) => (
              <span key={z} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-white/10 px-3.5 text-[13px] font-semibold text-white/85">
                <span className="size-2 rounded-full" style={{ background: ZONE[z].hex }} />
                {ZONE[z].name}
              </span>
            ))}
          </div>
        </div>

        {/* folha branca */}
        <div className="relative -mt-7 min-h-[60%] rounded-t-[32px] bg-surface px-4 pt-5" style={{ paddingBottom: 'calc(var(--sab) + 112px)' }}>
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { value: 'rota', label: 'Rota', count: remaining },
              { value: 'feitas', label: 'Concluídas', count: done },
            ]}
          />

          <AnimatePresence mode="wait" initial={false}>
            {tab === 'rota' ? (
              <motion.div key="rota" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
                {featured ? (
                  <FeaturedCard visit={featured} onOpen={() => go(`/visita/${featured.id}`, { dir: 1 })} onContinue={() => openRecord(featured)} startedIso={startedAt[featured.id]} />
                ) : (
                  <div className="mt-4 rounded-[28px] bg-lime-soft p-5">
                    <div className="flex items-center gap-2 text-[17px] font-bold text-ink">
                      <span className="flex size-8 items-center justify-center rounded-full bg-lime">
                        <Check className="size-4" strokeWidth={2.6} />
                      </span>
                      Rota concluída
                    </div>
                    <p className="mt-1 text-[14px] font-medium text-ink-2">Todas as visitas de hoje foram registradas.</p>
                  </div>
                )}

                <div className="mt-3 overflow-hidden rounded-[28px] bg-card p-1.5 shadow-card">
                  <div className="relative overflow-hidden rounded-[22px]">
                    <MiniMap visits={visits} status={status} activeId={featured && status[featured.id] !== 'agendada' ? featured.id : undefined} height={170} />
                    <span className="absolute top-2.5 left-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[12.5px] font-semibold text-ink shadow-pill backdrop-blur-md">
                      <MapPin className="size-3.5" strokeWidth={2.2} /> Base Adrianópolis
                    </span>
                    <span className="num absolute right-2.5 bottom-2.5 inline-flex h-8 items-center rounded-full bg-black px-3 text-[12.5px] font-semibold text-white">{visits.length} paradas</span>
                  </div>
                </div>

                {upcoming.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-1 pt-6 pb-3">
                      <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">Próximas paradas</h2>
                      <span className="num text-[13.5px] font-semibold text-ink-3">{upcoming.length}</span>
                    </div>
                    <StopList visits={upcoming} onOpen={(v) => go(`/visita/${v.id}`, { dir: 1 })} />
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="feitas" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="pt-4">
                {finished.length > 0 ? (
                  <StopList visits={finished} done onOpen={(v) => go(`/visita/${v.id}`, { dir: 1 })} />
                ) : (
                  <div className="rounded-[28px] bg-card px-6 py-10 text-center shadow-card">
                    <div className="text-[15px] font-bold text-ink">Nenhuma visita concluída</div>
                    <div className="mt-1 text-[13.5px] font-medium text-ink-3">As visitas finalizadas aparecem aqui.</div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dock vetId={vetId} onProfile={() => setProfile(true)} />
      <ProfileSheet open={profile} onOpenChange={setProfile} vetId={vetId} />
    </div>
  )
}

/* Abas em pílula preta */

function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count: number }[] }) {
  return (
    <div className="flex rounded-full bg-card p-1.5 shadow-card">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className={cn('relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold transition-colors', on ? 'text-lime' : 'text-ink-3')}>
            {on && <motion.span layoutId="route-tab" className="absolute inset-0 rounded-full bg-black" transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }} />}
            <span className="relative">{o.label}</span>
            <span className={cn('num relative inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11.5px] font-bold', on ? 'bg-lime text-ink' : 'bg-muted text-ink-3')}>{o.count}</span>
          </button>
        )
      })}
    </div>
  )
}

/* Cartão de destaque: em atendimento (lime) ou próxima parada (preto) */

function FeaturedCard({ visit, onOpen, onContinue, startedIso }: { visit: Visit; onOpen: () => void; onContinue: () => void; startedIso?: string }) {
  const status = useDemo((s) => s.visitStatus[visit.id])
  const pet = petOf(visit)
  const b = bairroOf(visit)
  const leg = legOf(visit)
  const inService = status === 'em-atendimento'
  const label = inService ? `Em atendimento · ${minutesSince(startedIso ?? visit.start)} min` : status === 'a-caminho' ? `A caminho · ${leg.min} min` : `Próxima parada · ${fmt.time(visit.start)}`
  const alert = pet.alerts?.[0]?.split(':')[0]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.05 }}
      className={cn('mt-4 rounded-[28px] p-4', inService ? 'bg-lime text-ink' : 'bg-black text-white')}
    >
      <Pressable scale={0.985} onClick={onOpen} className="flex w-full items-center gap-3.5 text-left">
        <PetAvatar pet={pet} size={60} className={cn('rounded-[20px]', inService ? 'ring-2 ring-black/5' : 'ring-2 ring-white/10')} />
        <div className="min-w-0 flex-1">
          <div className={cn('flex items-center gap-1.5 text-[12.5px] font-semibold', inService ? 'text-ink/60' : 'text-white/55')}>
            <span className="relative flex size-2">
              <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', inService ? 'bg-black' : 'bg-lime')} />
              <span className={cn('relative inline-flex size-2 rounded-full', inService ? 'bg-black' : 'bg-lime')} />
            </span>
            {label}
          </div>
          <div className="mt-0.5 text-[26px] leading-tight font-bold tracking-[-0.03em]">{pet.name}</div>
          <div className={cn('truncate text-[13.5px] font-medium', inService ? 'text-ink/65' : 'text-white/60')}>
            {visit.type} · {b.name}
          </div>
        </div>
        <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-full', inService ? 'bg-black text-lime' : 'bg-lime text-ink')}>
          <ArrowUpRight className="size-5" strokeWidth={2.2} />
        </span>
      </Pressable>
      {alert && (
        <div className={cn('mt-3.5 flex h-10 items-center gap-2 rounded-full px-3.5 text-[13.5px] font-semibold', inService ? 'bg-black/[0.07]' : 'bg-white/[0.08]')}>
          <HeartPulse className={cn('size-4 shrink-0', inService ? 'text-red' : 'text-coral')} strokeWidth={2.2} />
          <span className="truncate">{alert}</span>
        </div>
      )}
      <Btn tone={inService ? 'primary' : 'lime'} className="mt-3 h-[52px] w-full" onClick={inService ? onContinue : onOpen}>
        {inService ? 'Continuar' : status === 'a-caminho' ? 'Abrir visita' : 'Ver visita'}
        <ChevronRight className="size-[18px]" strokeWidth={2.4} />
      </Btn>
    </motion.div>
  )
}

/* Lista de paradas */

function StopList({ visits, onOpen, done }: { visits: Visit[]; onOpen: (v: Visit) => void; done?: boolean }) {
  const status = useDemo((s) => s.visitStatus)
  return (
    <div className="overflow-hidden rounded-[28px] bg-card p-1.5 shadow-card">
      {visits.map((v, i) => {
        const pet = petOf(v)
        const b = bairroOf(v)
        const leg = legOf(v)
        const onWay = status[v.id] === 'a-caminho'
        return (
          <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.04 * i + 0.08 }}>
            {i > 0 && <div className="mr-3 ml-[74px] h-px bg-line" />}
            <Pressable scale={0.985} onClick={() => onOpen(v)} className="flex w-full items-center gap-3 rounded-[22px] px-2.5 py-2.5 text-left active:bg-surface">
              <span className="relative shrink-0">
                <PetAvatar pet={pet} size={52} className="rounded-[18px]" />
                {done && (
                  <span className="absolute -right-1 -bottom-1 flex size-[22px] items-center justify-center rounded-full bg-lime ring-[3px] ring-card">
                    <Check className="size-3 text-ink" strokeWidth={3.2} />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-bold tracking-[-0.01em] text-ink">{pet.name}</span>
                  {v.petIds.length > 1 && <span className="text-[13px] font-semibold text-ink-3">+{v.petIds.length - 1}</span>}
                  {onWay && <span className="rounded-full bg-blue-soft px-2 py-0.5 text-[11px] font-bold text-blue">A caminho</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-3">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: ZONE[b.zone].hex }} />
                  <span className="truncate">
                    {v.type} · {b.name}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className={cn('num text-[15px] font-bold', done ? 'text-ink-3' : 'text-ink')}>{fmt.time(v.start)}</div>
                <div className="mt-0.5 flex items-center justify-end gap-1 text-[12px] font-medium text-ink-3">
                  {done ? (
                    'feita'
                  ) : v.fixedTime ? (
                    <>
                      <Lock className="size-3" strokeWidth={2.4} /> fixo
                    </>
                  ) : (
                    `${leg.min} min`
                  )}
                </div>
              </div>
              <ChevronRight className="size-[18px] shrink-0 text-ink-4" strokeWidth={2.2} />
            </Pressable>
          </motion.div>
        )
      })}
    </div>
  )
}

/* Dock preta flutuante */

function Dock({ vetId, onProfile }: { vetId: string; onProfile: () => void }) {
  const tomorrow = VISITS.filter((v) => v.vetId === vetId && daysFromToday(v.start) === 1).length
  const items = [
    { key: 'rota', label: 'Rota', icon: RouteIcon, onClick: () => {} },
    { key: 'agenda', label: 'Agenda', icon: CalendarDays, onClick: () => notify({ kind: 'app', title: 'Agenda', body: `Amanhã: ${tomorrow} ${tomorrow === 1 ? 'visita' : 'visitas'}. A semana completa fica no painel.` }) },
    { key: 'pacientes', label: 'Pacientes', icon: PawPrint, onClick: () => notify({ kind: 'app', title: 'Pacientes', body: 'Busca de fichas disponível no painel da clínica.' }) },
    { key: 'perfil', label: 'Perfil', icon: User, onClick: onProfile },
  ]
  return (
    <nav className="absolute inset-x-0 z-40 flex justify-center" style={{ bottom: 'calc(var(--sab) + 12px)' }}>
      <div className="flex items-center gap-1 rounded-full bg-black p-1.5 shadow-float ring-1 ring-white/10">
        {items.map((it) => {
          const on = it.key === 'rota'
          return (
            <Pressable
              key={it.key}
              scale={0.92}
              onClick={it.onClick}
              aria-label={it.label}
              className={cn('flex h-12 items-center gap-2 rounded-full transition-colors', on ? 'bg-lime px-4 text-ink' : 'w-12 justify-center text-white/60 active:text-white')}
            >
              <it.icon className="size-[19px]" strokeWidth={2} />
              {on && <span className="text-[13.5px] font-bold">{it.label}</span>}
            </Pressable>
          )
        })}
      </div>
    </nav>
  )
}

/* Perfil do veterinário */

function ProfileSheet({ open, onOpenChange, vetId }: { open: boolean; onOpenChange: (o: boolean) => void; vetId: string }) {
  const vet = VET[vetId]
  const nav = useNavigate()
  const go = useGo()
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  const reset = useDemo((s) => s.reset)
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Perfil">
      <div className="flex items-center gap-3.5 rounded-[24px] bg-surface p-4">
        <VetAvatar vetId={vetId} size={56} />
        <div className="min-w-0">
          <div className="truncate text-[17px] font-bold text-ink">{vet.name}</div>
          <div className="text-[13.5px] font-medium text-ink-3">{vet.crmv}</div>
          <div className="text-[13.5px] font-medium text-ink-3">{vet.focus}</div>
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-[24px] bg-surface">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex size-10 items-center justify-center rounded-full bg-card text-ink shadow-pill">
            <WifiOff className="size-[18px]" strokeWidth={2} />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-ink">Simular sem sinal</span>
          <Toggle checked={offline} onChange={setOffline} label="Simular sem sinal" />
        </div>
        <div className="mx-4 h-px bg-line" />
        <Pressable
          scale={0.99}
          onClick={() => {
            onOpenChange(false)
            nav('/')
          }}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-card text-ink shadow-pill">
            <LayoutGrid className="size-[18px]" strokeWidth={2} />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-ink">Painel da clínica</span>
          <ChevronRight className="size-[18px] text-ink-4" />
        </Pressable>
        <div className="mx-4 h-px bg-line" />
        <Pressable
          scale={0.99}
          onClick={() => {
            reset()
            useCampo.setState({ drafts: {}, arrived: {}, startedAt: {}, finished: {}, pending: 0, syncing: false })
            onOpenChange(false)
            go('', { dir: -1, replace: true })
          }}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-card text-ink shadow-pill">
            <RotateCcw className="size-[18px]" strokeWidth={2} />
          </span>
          <span className="flex-1 text-[15px] font-semibold text-ink">Reiniciar demonstração</span>
        </Pressable>
      </div>
    </Sheet>
  )
}
