// Tela 1 · "Minha rota hoje"
import * as React from 'react'
import { motion } from 'motion/react'
import { Check, ChevronRight, HeartPulse, Lock, MapPin, Navigation, Wifi, WifiOff } from 'lucide-react'
import { cn, firstName } from '@/lib/utils'
import { Badge, PetAvatar, VetAvatar } from '@/components/ui'
import { VET, type Visit } from '@/data/mock'
import { ZONE } from '@/data/geo'
import { fmt, TODAY } from '@/data/time'
import { VISIT_STATUS } from '@/lib/status'
import { useDemo } from '@/store'
import { useCampo } from './campoStore'
import { bairroOf, legOf, minutesSince, petOf, routeKm, tutorOf, vetVisitsToday, zonesOfDay } from './data'
import { ConnectivityBanner, EASE_OUT, IconBtn, Pressable, Screen, SectionLabel } from './kit'
import { MiniMap } from './MiniMap'
import { useGo, useVetId } from './nav'

export function greeting() {
  return 'Bom dia'
}

export function OfflineToggle() {
  const offline = useDemo((s) => s.offline)
  const setOffline = useDemo((s) => s.setOffline)
  return (
    <IconBtn label={offline ? 'Sem sinal (toque para reconectar)' : 'Simular área sem sinal'} active={offline} onClick={() => setOffline(!offline)}>
      {offline ? <WifiOff className="size-[19px]" strokeWidth={2} /> : <Wifi className="size-[19px]" strokeWidth={2} />}
    </IconBtn>
  )
}

export default function RouteScreen() {
  const vetId = useVetId()
  const vet = VET[vetId]
  const go = useGo()
  const status = useDemo((s) => s.visitStatus)
  const startedAt = useCampo((s) => s.startedAt)
  const visits = React.useMemo(() => vetVisitsToday(vetId), [vetId])
  const zones = React.useMemo(() => zonesOfDay(visits), [visits])
  const done = visits.filter((v) => status[v.id] === 'concluida').length
  const km = routeKm(vetId)

  const featured = visits.find((v) => status[v.id] === 'em-atendimento') ?? visits.find((v) => status[v.id] === 'a-caminho') ?? visits.find((v) => status[v.id] === 'agendada')
  const upcoming = visits.filter((v) => v.id !== featured?.id && status[v.id] !== 'concluida' && status[v.id] !== 'cancelada')
  const finished = visits.filter((v) => status[v.id] === 'concluida')

  const openRecord = (v: Visit) => {
    useCampo.getState().ensureDraft(v)
    go(`/visita/${v.id}/atendimento`, { dir: 1 })
  }

  return (
    <Screen
      title="Minha rota hoje"
      eyebrow={<span className="capitalize">{fmt.long(TODAY)}</span>}
      large={`${greeting()}, ${firstName(vet.name)}`}
      right={
        <>
          <OfflineToggle />
          <span className="ml-0.5">
            <VetAvatar vetId={vetId} size={32} />
          </span>
        </>
      }
      below={<ConnectivityBanner />}
    >
      {/* zona do dia */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pt-2">
        <span className="mr-1 text-[14px] text-ink-3">Zona do dia</span>
        {zones.map((z) => (
          <span key={z} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[13.5px] font-semibold" style={{ background: `${ZONE[z].hex}1f`, color: ZONE[z].hex }}>
            <span className="size-2 rounded-full" style={{ background: ZONE[z].hex }} />
            {ZONE[z].short}
          </span>
        ))}
      </div>

      {/* resumo */}
      <div className="mx-4 mt-4 overflow-hidden rounded-[20px] border border-line bg-card shadow-card">
        <div className="grid grid-cols-3 divide-x divide-line">
          {[
            { n: visits.length, l: 'visitas' },
            { n: Math.round(km), l: 'km de rota' },
            { n: done, l: done === 1 ? 'concluída' : 'concluídas' },
          ].map((s) => (
            <div key={s.l} className="px-3 py-3 text-center">
              <div className="num font-display text-[26px] leading-none font-semibold text-ink">{s.n}</div>
              <div className="mt-1 text-[13px] text-ink-3">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="relative">
          <MiniMap visits={visits} status={status} activeId={featured && status[featured.id] !== 'agendada' ? featured.id : undefined} height={148} />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-river/70 to-transparent px-3 pt-6 pb-2 text-[12px] font-medium text-paper">
            <span>Saída 07:40 · Base Adrianópolis</span>
            <span className="num">
              {done}/{visits.length}
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-paper-2">
          <motion.div className="h-full bg-sage-600" initial={{ width: 0 }} animate={{ width: `${(done / Math.max(1, visits.length)) * 100}%` }} transition={{ duration: 0.8, ease: EASE_OUT }} />
        </div>
      </div>

      {featured && <FeaturedCard visit={featured} onOpen={() => go(`/visita/${featured.id}`, { dir: 1 })} onContinue={() => openRecord(featured)} startedIso={startedAt[featured.id]} />}
      {!featured && (
        <div className="mx-4 mt-4 rounded-[20px] bg-ok-bg p-5 text-ok">
          <div className="flex items-center gap-2 text-[16px] font-semibold">
            <Check className="size-5" /> Rota de hoje concluída
          </div>
          <p className="mt-1 text-[14px] text-ink-2">Todas as visitas foram registradas. Bom descanso!</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionLabel>Próximas paradas</SectionLabel>
          <StopList visits={upcoming} onOpen={(v) => go(`/visita/${v.id}`, { dir: 1 })} />
        </>
      )}
      {finished.length > 0 && (
        <>
          <SectionLabel>Concluídas</SectionLabel>
          <StopList visits={finished} done onOpen={(v) => go(`/visita/${v.id}`, { dir: 1 })} />
        </>
      )}
      <p className="px-6 pt-5 text-center text-[12.5px] text-ink-4">
        <Lock className="mr-1 inline size-3 -translate-y-px" /> horário combinado com o tutor, não muda na otimização
      </p>
    </Screen>
  )
}

function FeaturedCard({ visit, onOpen, onContinue, startedIso }: { visit: Visit; onOpen: () => void; onContinue: () => void; startedIso?: string }) {
  const status = useDemo((s) => s.visitStatus[visit.id])
  const pet = petOf(visit)
  const b = bairroOf(visit)
  const t = tutorOf(visit)
  const leg = legOf(visit)
  const inService = status === 'em-atendimento'
  const eyebrow = inService
    ? `Em atendimento há ${minutesSince(startedIso ?? visit.start)} min`
    : status === 'a-caminho'
      ? `A caminho · chega em ~${leg.min} min`
      : `Próxima parada · ${fmt.time(visit.start)} · ${leg.min} min daqui`
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: 0.05 }} className="mx-4 mt-4 overflow-hidden rounded-[22px] bg-sage-900 text-paper shadow-lift">
      <Pressable scale={0.985} onClick={onOpen} className="block w-full p-4 pb-3 text-left">
        <div className="flex items-center gap-2 text-[12.5px] font-semibold tracking-[0.04em] text-sage-200 uppercase">
          <span className="relative flex size-2">
            <span className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', inService ? 'bg-terra-500' : 'bg-sage-300')} />
            <span className={cn('relative inline-flex size-2 rounded-full', inService ? 'bg-terra-500' : 'bg-sage-300')} />
          </span>
          {eyebrow}
        </div>
        <div className="mt-3 flex items-center gap-3.5">
          <PetAvatar pet={pet} size={64} className="ring-2 ring-white/15" />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[28px] leading-none font-semibold">{pet.name}</div>
            <div className="mt-1.5 truncate text-[15px] text-sage-200">
              {pet.breed} · {visit.type}
            </div>
          </div>
          <ChevronRight className="size-5 shrink-0 text-sage-300" />
        </div>
        {pet.alerts?.[0] && (
          <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-white/[0.07] px-3 py-2.5 text-[14px] leading-snug">
            <HeartPulse className="mt-px size-[17px] shrink-0 text-terra-200" strokeWidth={2} />
            <span>{pet.alerts[0]}</span>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 text-[14px] text-sage-200">
          <MapPin className="size-4 shrink-0" strokeWidth={1.9} />
          <span className="truncate">
            {t.address} · {b.name}
          </span>
        </div>
      </Pressable>
      <div className="px-4 pb-4">
        {inService ? (
          <Pressable onClick={onContinue} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-paper text-[16px] font-semibold text-sage-900">
            Continuar atendimento <ChevronRight className="size-[18px]" />
          </Pressable>
        ) : (
          <Pressable onClick={onOpen} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-paper text-[16px] font-semibold text-sage-900">
            <Navigation className="size-[18px]" /> {status === 'a-caminho' ? 'Abrir visita' : 'Ver detalhes e sair'}
          </Pressable>
        )}
      </div>
    </motion.div>
  )
}

function StopList({ visits, onOpen, done }: { visits: Visit[]; onOpen: (v: Visit) => void; done?: boolean }) {
  const status = useDemo((s) => s.visitStatus)
  return (
    <div className="mx-4 overflow-hidden rounded-[20px] border border-line bg-card shadow-card">
      {visits.map((v, i) => {
        const pet = petOf(v)
        const b = bairroOf(v)
        const st = VISIT_STATUS[status[v.id]]
        const leg = legOf(v)
        return (
          <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.04 * i + 0.1 }}>
            {i > 0 && <div className="ml-[76px] h-px bg-line" />}
            <Pressable scale={0.985} onClick={() => onOpen(v)} className={cn('flex w-full items-center gap-3 py-3 pr-3 pl-4 text-left active:bg-card-2', done && 'opacity-70')}>
              <div className="w-[46px] shrink-0">
                <div className={cn('num font-mono text-[14px] font-medium', done ? 'text-ink-3 line-through decoration-ink-4' : 'text-ink')}>{fmt.time(v.start)}</div>
                {v.fixedTime ? (
                  <div className="mt-0.5 flex items-center gap-0.5 text-[11.5px] font-medium text-terra-700">
                    <Lock className="size-[11px]" strokeWidth={2.2} /> fixo
                  </div>
                ) : (
                  <div className="mt-0.5 text-[11.5px] text-ink-4">{v.durationMin} min</div>
                )}
              </div>
              <span className="relative shrink-0">
                <PetAvatar pet={pet} size={46} />
                {done && (
                  <span className="absolute -right-0.5 -bottom-0.5 flex size-[18px] items-center justify-center rounded-full border-2 border-card bg-ok text-white">
                    <Check className="size-2.5" strokeWidth={3.4} />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[16px] font-semibold text-ink">{pet.name}</span>
                  {v.petIds.length > 1 && <span className="text-[13px] text-ink-3">+{v.petIds.length - 1}</span>}
                </div>
                <div className="truncate text-[14px] text-ink-2">{v.type}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: ZONE[b.zone].hex }} />
                  <span className="truncate">{b.name}</span>
                  {!done && <span className="shrink-0 text-ink-4">· {leg.min} min</span>}
                </div>
              </div>
              {!done && status[v.id] !== 'agendada' ? <Badge tone={st.tone}>{st.label}</Badge> : <ChevronRight className="size-[18px] shrink-0 text-ink-4" />}
            </Pressable>
          </motion.div>
        )
      })}
    </div>
  )
}

