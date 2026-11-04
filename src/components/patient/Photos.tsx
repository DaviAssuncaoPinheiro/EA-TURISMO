import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, ChevronLeft, ChevronRight, ChevronsLeftRight, ImageOff, Images, Loader2, Maximize2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Chip, IconButton, IconCircle, Segmented } from '@/components/ui'
import type { Pet } from '@/data/mock'
import { daysFromToday, fmt } from '@/data/time'
import { compressImage, newId } from '@/lib/photos'
import { cn } from '@/lib/utils'
import { useDemo, type PetPhoto } from '@/store'
import { SEED_PHOTOS } from './photoArt'

const dm = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const ddmm = (d: string) => dm.format(new Date(d))
const SUGGESTED = ['Pele', 'Patas', 'Orelha', 'Olhos', 'Boca', 'Ferida cirúrgica']
const isSeed = (p: PetPhoto) => p.id.startsWith('seed-')
const byDate = (a: PetPhoto, b: PetPhoto) => +new Date(a.date) - +new Date(b.date)

/* ───────────── Imagem com fallback ───────────── */

function PhotoImg({ src, alt, className, fit = 'cover' }: { src: string; alt: string; className?: string; fit?: 'cover' | 'contain' }) {
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => setFailed(false), [src])
  if (failed)
    return (
      <div className={cn('flex items-center justify-center bg-muted text-ink-4', className)}>
        <ImageOff className="size-6" strokeWidth={1.9} />
      </div>
    )
  return <img src={src} alt={alt} draggable={false} onError={() => setFailed(true)} className={cn('select-none', fit === 'cover' ? 'object-cover' : 'object-contain', className)} />
}

/* ───────────── Comparador antes e depois ───────────── */

function Compare({ before, after, afterIsLatest, onOpen }: { before: PetPhoto; after: PetPhoto; afterIsLatest: boolean; onOpen: (p: PetPhoto) => void }) {
  const [pos, setPos] = React.useState(50)
  const box = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ x: number; moved: boolean } | null>(null)

  const fromX = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <div
      ref={box}
      data-testid="compare"
      className="relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y overflow-hidden rounded-[20px] bg-muted select-none"
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('[data-noclick]')) return
        box.current?.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, moved: false }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        if (!d.moved && Math.abs(e.clientX - d.x) < 4) return
        d.moved = true
        fromX(e.clientX)
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        if (d && !d.moved) {
          const r = box.current!.getBoundingClientRect()
          onOpen(((e.clientX - r.left) / r.width) * 100 < pos ? before : after)
        }
      }}
      onPointerCancel={() => (drag.current = null)}
    >
      <PhotoImg src={after.src} alt={after.label} className="absolute inset-0 size-full" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <PhotoImg src={before.src} alt={before.label} className="absolute inset-0 size-full" />
      </div>

      <span className={cn('pointer-events-none absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-black/60 px-3 text-[12px] font-semibold text-white backdrop-blur-md transition-opacity', pos < 18 && 'opacity-0')}>
        Antes <span className="num ml-1 text-white/70">{ddmm(before.date)}</span>
      </span>
      <span className={cn('pointer-events-none absolute top-3 right-3 inline-flex h-7 items-center rounded-full bg-lime px-3 text-[12px] font-semibold text-ink transition-opacity', pos > 82 && 'opacity-0')}>
        {afterIsLatest ? 'Agora' : <>Depois <span className="num ml-1 text-ink/60">{ddmm(after.date)}</span></>}
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.35)]" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label="Comparar antes e depois"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        data-testid="compare-handle"
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
          if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
        }}
        className="absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-float transition-transform outline-none focus-visible:ring-4 focus-visible:ring-lime active:scale-95"
        style={{ left: `${pos}%` }}
      >
        <ChevronsLeftRight className="size-[18px]" strokeWidth={2} />
      </div>

      <button
        data-noclick
        onClick={() => onOpen(after)}
        aria-label="Ver em tela cheia"
        className="absolute right-3 bottom-3 inline-flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition-[background,transform] hover:bg-black/75 active:scale-95"
      >
        <Maximize2 className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}

/* ───────────── Linha do tempo de miniaturas ───────────── */

type Slot = 'before' | 'after'

function Thumbs({ photos, before, after, onPick }: { photos: PetPhoto[]; before?: string; after?: string; onPick: (p: PetPhoto) => void }) {
  return (
    <div className="no-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
      <div className="relative flex w-max gap-2.5 pt-1">
        <div className="absolute top-[37px] right-6 left-6 h-px bg-line-2" />
        {photos.map((p) => {
          const tag = p.id === before ? 'Antes' : p.id === after ? 'Depois' : null
          return (
            <button key={p.id} onClick={() => onPick(p)} className="group relative flex w-[72px] flex-col items-center gap-1.5" aria-label={`${p.label}, ${ddmm(p.date)}`}>
              <span
                className={cn(
                  'relative block size-[72px] overflow-hidden rounded-[16px] bg-muted ring-offset-2 ring-offset-card transition-[transform,box-shadow] group-hover:-translate-y-0.5',
                  p.id === before && 'ring-2 ring-black',
                  p.id === after && 'ring-2 ring-lime-2',
                )}
              >
                <PhotoImg src={p.src} alt={p.label} className="size-full" />
                {tag && <span className={cn('absolute inset-x-1 bottom-1 rounded-full py-0.5 text-center text-[10.5px] font-bold', tag === 'Antes' ? 'bg-black text-white' : 'bg-lime text-ink')}>{tag}</span>}
              </span>
              <span className="num text-[12px] font-semibold text-ink-3">{daysFromToday(p.date) === 0 ? 'Hoje' : ddmm(p.date)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ───────────── Lightbox ───────────── */

function Lightbox({ photos, index, onIndex, onClose, onDelete }: { photos: PetPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void; onDelete: (p: PetPhoto) => void }) {
  const p = photos[index]
  const go = React.useCallback((d: number) => onIndex((index + d + photos.length) % photos.length), [index, photos.length, onIndex])
  const swipe = React.useRef<number | null>(null)

  React.useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') go(-1)
      if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [go, onClose])

  if (!p) return null
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-black/92 text-white backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Foto"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4 md:px-6">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">{p.label}</div>
          <div className="text-[12.5px] font-medium text-white/60">
            {p.subject} · {fmt.date(p.date)} · {index + 1} de {photos.length}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!isSeed(p) && (
            <IconButton tone="ghost" className="text-white/80 hover:bg-white/10" aria-label="Excluir foto" onClick={() => onDelete(p)}>
              <Trash2 className="size-[18px]" strokeWidth={1.9} />
            </IconButton>
          )}
          <IconButton tone="lime" aria-label="Fechar" onClick={onClose}>
            <X className="size-[18px]" strokeWidth={2} />
          </IconButton>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4 py-4 md:px-20"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current == null) return
          const dx = e.clientX - swipe.current
          swipe.current = null
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={p.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="flex max-h-full max-w-full">
            <PhotoImg src={p.src} alt={p.label} fit="contain" className="max-h-[calc(100dvh-220px)] w-auto max-w-full rounded-[20px]" />
          </motion.div>
        </AnimatePresence>
        {photos.length > 1 && (
          <>
            <IconButton tone="card" size={44} className="absolute top-1/2 left-3 -translate-y-1/2 max-sm:hidden md:left-6" aria-label="Anterior" onClick={() => go(-1)}>
              <ChevronLeft className="size-5" strokeWidth={2} />
            </IconButton>
            <IconButton tone="card" size={44} className="absolute top-1/2 right-3 -translate-y-1/2 max-sm:hidden md:right-6" aria-label="Próxima" onClick={() => go(1)}>
              <ChevronRight className="size-5" strokeWidth={2} />
            </IconButton>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto px-4 pb-6">
          {photos.map((x, i) => (
            <button key={x.id} onClick={() => onIndex(i)} aria-label={x.label} className={cn('size-14 shrink-0 overflow-hidden rounded-[14px] transition-opacity', i === index ? 'ring-2 ring-lime' : 'opacity-50 hover:opacity-90')}>
              <PhotoImg src={x.src} alt={x.label} className="size-full" />
            </button>
          ))}
        </div>
      )}
    </motion.div>,
    document.body,
  )
}

/* ───────────── Adicionar foto ───────────── */

function AddPanel({
  subjects,
  subject,
  onSubject,
  note,
  onNote,
  busy,
  onPick,
  onCancel,
}: {
  subjects: string[]
  subject: string
  onSubject: (s: string) => void
  note: string
  onNote: (s: string) => void
  busy: boolean
  onPick: () => void
  onCancel: () => void
}) {
  const [custom, setCustom] = React.useState('')
  const [adding, setAdding] = React.useState(false)
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }} className="overflow-hidden">
      <div className="mx-5 mb-4 rounded-[20px] bg-surface p-4">
        <div className="text-[13px] font-bold text-ink">Assunto</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {subjects.map((s) => (
            <Chip key={s} active={s === subject} onClick={() => onSubject(s)}>
              {s}
            </Chip>
          ))}
          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const v = custom.trim()
                if (!v) return
                onSubject(v)
                setAdding(false)
                setCustom('')
              }}
              className="flex h-9 items-center gap-1 rounded-full bg-card pr-1 pl-3.5 shadow-pill"
            >
              <input autoFocus value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ex.: Cauda" className="w-28 bg-transparent text-[13px] font-semibold text-ink outline-none placeholder:text-ink-4" />
              <button type="submit" className="h-7 rounded-full bg-black px-3 text-[12px] font-semibold text-white">
                Ok
              </button>
            </form>
          ) : (
            <Chip onClick={() => setAdding(true)}>
              <Plus className="size-3.5" strokeWidth={2.2} /> Outro
            </Chip>
          )}
        </div>
        <label className="mt-4 block text-[13px] font-bold text-ink" htmlFor="photo-note">
          Descrição
        </label>
        <input
          id="photo-note"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Opcional. Ex.: Lesão na pata direita"
          className="mt-2 h-11 w-full rounded-full bg-card px-4 text-[13.5px] font-medium text-ink shadow-pill outline-none placeholder:text-ink-4 focus:ring-2 focus:ring-lime"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={onPick} disabled={busy} className="h-11 flex-1 sm:flex-none">
            {busy ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <Camera className="size-4" strokeWidth={2} />}
            {busy ? 'Salvando' : 'Câmera ou galeria'}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="h-11">
            Cancelar
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ───────────── Seção ───────────── */

export function PhotosSection({ pet }: { pet: Pet }) {
  const stored = useDemo((s) => s.photos)
  const addPhoto = useDemo((s) => s.addPhoto)
  const removePhoto = useDemo((s) => s.removePhoto)

  const photos = React.useMemo(() => [...SEED_PHOTOS.filter((p) => p.petId === pet.id), ...stored.filter((p) => p.petId === pet.id)].sort(byDate), [pet.id, stored])

  const groups = React.useMemo(() => {
    const m = new Map<string, PetPhoto[]>()
    for (const p of photos) m.set(p.subject, [...(m.get(p.subject) ?? []), p])
    return [...m.entries()].map(([subject, list]) => ({ subject, list })).sort((a, b) => +new Date(b.list[b.list.length - 1].date) - +new Date(a.list[a.list.length - 1].date))
  }, [photos])

  const [active, setActive] = React.useState<string | null>(null)
  const group = groups.find((g) => g.subject === active) ?? groups[0]
  const [pick, setPick] = React.useState<{ before?: string; after?: string }>({})
  const [slot, setSlot] = React.useState<Slot>('before')
  const [box, setBox] = React.useState<{ list: PetPhoto[]; index: number } | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [subject, setSubject] = React.useState('')
  const [note, setNote] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const input = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setActive(null)
    setPick({})
    setAdding(false)
  }, [pet.id])

  const list = group?.list ?? []
  const before = list.find((p) => p.id === pick.before) ?? list[0]
  const after = list.find((p) => p.id === pick.after) ?? list[list.length - 1]
  const subjects = React.useMemo(() => {
    const own = groups.map((g) => g.subject)
    return [...own, ...SUGGESTED.filter((s) => !own.some((o) => o.toLowerCase() === s.toLowerCase()))]
  }, [groups])
  const chosen = subject || group?.subject || subjects[0]

  const choose = (p: PetPhoto) => {
    if (!before || !after) return
    let b = slot === 'before' ? p : before
    let a = slot === 'after' ? p : after
    if (b.id === a.id) {
      if (slot === 'before') a = before
      else b = after
    }
    if (+new Date(b.date) > +new Date(a.date)) [b, a] = [a, b]
    setPick({ before: b.id, after: a.id })
  }

  const open = (p: PetPhoto, from = list) => setBox({ list: from, index: Math.max(0, from.findIndex((x) => x.id === p.id)) })

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const src = await compressImage(file)
      const subj = chosen
      const photo: PetPhoto = { id: newId('foto'), petId: pet.id, date: new Date().toISOString(), src, label: note.trim() || subj, subject: subj }
      addPhoto(photo)
      setActive(subj)
      setPick({ before: undefined, after: photo.id })
      setAdding(false)
      setNote('')
      setSubject('')
      toast.success('Foto adicionada', { description: `${subj} · ${pet.name}` })
    } catch {
      toast.error('Não deu para ler a foto', { description: 'Tente outra imagem.' })
    } finally {
      setBusy(false)
    }
  }

  const del = (p: PetPhoto) => {
    removePhoto(p.id)
    setBox(null)
    setPick({})
    toast('Foto excluída')
  }

  const startAdd = () => {
    setSubject(group?.subject ?? '')
    setAdding((v) => !v)
  }

  const spanDays = list.length > 1 ? Math.round((+new Date(after.date) - +new Date(before.date)) / 86400000) : 0

  return (
    <Card data-testid="photos" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <IconCircle size={40}>
            <Images className="size-[18px]" strokeWidth={1.9} />
          </IconCircle>
          <div className="min-w-0">
            <h3 className="text-[17px] leading-tight font-bold tracking-[-0.02em] text-ink">Fotos</h3>
            <div className="truncate text-[12.5px] font-medium text-ink-3">{photos.length ? `${photos.length} ${photos.length === 1 ? 'foto' : 'fotos'} · antes e depois` : 'Antes e depois'}</div>
          </div>
        </div>
        {photos.length > 0 && (
          <Button variant={adding ? 'subtle' : 'primary'} size="sm" onClick={startAdd} className="h-10 shrink-0">
            {adding ? <X className="size-4" strokeWidth={2} /> : <Camera className="size-4" strokeWidth={2} />}
            <span className="max-[380px]:hidden">{adding ? 'Fechar' : 'Adicionar foto'}</span>
          </Button>
        )}
      </div>

      <input ref={input} data-testid="photo-input" type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />

      <AnimatePresence initial={false}>
        {adding && <AddPanel subjects={subjects} subject={chosen} onSubject={setSubject} note={note} onNote={setNote} busy={busy} onPick={() => input.current?.click()} onCancel={() => setAdding(false)} />}
      </AnimatePresence>

      {!group ? (
        !adding && (
          <div className="mx-5 mb-5 flex flex-col items-center rounded-[20px] bg-surface px-6 pt-8 pb-7 text-center">
            <div className="relative h-[92px] w-[150px]">
              <span className="absolute top-3 left-2 h-[72px] w-[64px] -rotate-[8deg] rounded-[16px] bg-card shadow-card" />
              <span className="absolute top-3 right-2 h-[72px] w-[64px] rotate-[8deg] rounded-[16px] bg-card shadow-card" />
              <span className="hatch absolute top-0 left-1/2 h-[80px] w-[70px] -translate-x-1/2 overflow-hidden rounded-[18px] bg-card shadow-pill" />
              <span className="absolute top-[22px] left-1/2 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-lime text-ink">
                <Camera className="size-[18px]" strokeWidth={2} />
              </span>
            </div>
            <div className="mt-4 text-[15px] font-bold text-ink">Nenhuma foto ainda</div>
            <p className="mt-1 max-w-[280px] text-[13px] font-medium text-ink-3">Fotografe lesões e feridas para comparar a evolução a cada visita.</p>
            <Button variant="lime" onClick={startAdd} className="mt-4 h-11">
              <Plus className="size-4" strokeWidth={2.2} /> Adicionar foto
            </Button>
          </div>
        )
      ) : (
        <>
          {groups.length > 1 && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-4">
              {groups.map((g) => (
                <Chip
                  key={g.subject}
                  active={g.subject === group.subject}
                  onClick={() => {
                    setActive(g.subject)
                    setPick({})
                  }}
                  className="shrink-0"
                >
                  {g.subject}
                  <span className={cn('num text-[12px]', g.subject === group.subject ? 'text-white/60' : 'text-ink-4')}>{g.list.length}</span>
                </Chip>
              ))}
            </div>
          )}

          <div className="grid gap-4 px-5 pb-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={group.subject} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="min-w-0">
                {list.length > 1 ? (
                  <Compare key={`${before.id}-${after.id}`} before={before} after={after} afterIsLatest={after.id === list[list.length - 1].id} onOpen={(p) => open(p)} />
                ) : (
                  <button onClick={() => open(list[0])} className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[20px] bg-muted">
                    <PhotoImg src={list[0].src} alt={list[0].label} className="size-full transition-transform duration-300 group-hover:scale-[1.02]" />
                    <span className="absolute top-3 left-3 inline-flex h-7 items-center rounded-full bg-black/60 px-3 text-[12px] font-semibold text-white backdrop-blur-md">
                      <span className="num">{ddmm(list[0].date)}</span>
                    </span>
                  </button>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-[16px] font-bold tracking-[-0.01em] text-ink">{group.subject}</h4>
                {list.length > 1 ? <Badge tone="lime">{spanDays} dias de evolução</Badge> : <Badge>1 foto</Badge>}
              </div>

              {list.length > 1 ? (
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { k: 'Antes', p: before, dot: 'bg-black' },
                    { k: after.id === list[list.length - 1].id ? 'Agora' : 'Depois', p: after, dot: 'bg-lime-2' },
                  ].map(({ k, p, dot }) => (
                    <div key={k} className="min-w-0 rounded-[16px] bg-surface px-3 py-2.5">
                      <dt className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-3">
                        <span className={cn('size-1.5 rounded-full', dot)} />
                        {k} · <span className="num">{fmt.date(p.date)}</span>
                      </dt>
                      <dd className="mt-0.5 line-clamp-2 text-[13px] leading-snug font-semibold text-ink">{p.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-[13px] font-medium text-ink-3">
                  {list[0].label}. Adicione outra foto de {group.subject.toLowerCase()} para comparar.
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-ink">Linha do tempo</span>
                {list.length > 2 && (
                  <Segmented<Slot>
                    value={slot}
                    onChange={setSlot}
                    options={[
                      { value: 'before', label: 'Trocar antes' },
                      { value: 'after', label: 'Trocar depois' },
                    ]}
                  />
                )}
              </div>
              <div className="mt-2.5">
                <Thumbs photos={list} before={list.length > 1 ? before.id : undefined} after={list.length > 1 ? after.id : undefined} onPick={(p) => (list.length > 2 ? choose(p) : open(p))} />
              </div>
              {list.length === 1 && (
                <Button variant="subtle" onClick={startAdd} className="mt-3 h-10 self-start">
                  <Plus className="size-4" strokeWidth={2.2} /> Nova foto de {group.subject.toLowerCase()}
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {box && <Lightbox photos={box.list} index={box.index} onIndex={(i) => setBox((b) => (b ? { ...b, index: i } : b))} onClose={() => setBox(null)} onDelete={del} />}
      </AnimatePresence>
    </Card>
  )
}
