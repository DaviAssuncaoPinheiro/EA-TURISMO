import * as React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage, newId } from '@/lib/photos'
import { useDemo, type PetPhoto } from '@/store'
import { notify, queueIfOffline } from './campoStore'
import { ddmm, defaultSubject, petPhotos, PHOTO_SUBJECTS } from './data'
import { Chip, EASE_OUT, Pressable, usePhone } from './kit'
import { Block, StepFrame, StepIntro, type StepProps } from './stepKit'

export function StepFotos({ visit, pet, layout }: StepProps) {
  const { desktop } = usePhone()
  const stored = useDemo((s) => s.photos)
  const addPhoto = useDemo((s) => s.addPhoto)
  const removePhoto = useDemo((s) => s.removePhoto)
  const all = React.useMemo(() => petPhotos(pet.id, stored), [pet.id, stored])
  const [subject, setSubject] = React.useState(() => defaultSubject(visit, pet, all))
  const [label, setLabel] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const current = all.filter((p) => p.visitId === visit.id)
  const prior = all.filter((p) => p.visitId !== visit.id)
  const priorOf = (s: string) => prior.find((p) => p.subject === s)
  const before = priorOf(subject)
  const now = current.find((p) => p.subject === subject)
  const subjects = [...new Set([...prior.map((p) => p.subject), ...PHOTO_SUBJECTS])]

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const src = await compressImage(file)
      addPhoto({ id: newId('ph'), petId: pet.id, visitId: visit.id, date: new Date().toISOString(), src, label: label.trim() || subject, subject })
      setLabel('')
      queueIfOffline()
    } catch {
      notify({ kind: 'app', title: 'Não deu para ler a foto', body: 'Tente outra imagem.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <StepFrame
      layout={layout}
      intro={
        <StepIntro eyebrow="Etapa 3 de 6" title="Fotos">
          Antes e depois, por assunto
        </StepIntro>
      }
      left={
        <>
          <Block title="Assunto" hint="Agrupa as fotos para comparar">
            <div className="flex flex-wrap gap-2" data-noswipe>
              {subjects.map((s) => (
                <Chip key={s} size="sm" on={subject === s} onClick={() => setSubject(s)}>
                  {s}
                  {priorOf(s) && <span className={cn('size-1.5 rounded-full', subject === s ? 'bg-lime' : 'bg-blue')} />}
                </Chip>
              ))}
            </div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Legenda (opcional)"
              className="mt-4 h-12 w-full rounded-full bg-muted px-5 text-[15px] font-medium text-ink outline-none placeholder:text-ink-4 focus:bg-card focus:ring-2 focus:ring-black"
            />
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="sr-only" aria-label="Tirar foto" data-testid="photo-input" />
            <Pressable
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="mt-3 flex h-[64px] w-full items-center justify-center gap-3 rounded-full bg-black text-[17px] font-semibold text-white disabled:opacity-70"
            >
              {busy ? (
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-flex size-5 rounded-full border-2 border-white/30 border-t-lime" />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-lime text-ink">
                  <Camera className="size-5" strokeWidth={2.2} />
                </span>
              )}
              {busy ? 'Processando' : 'Tirar foto'}
            </Pressable>
            {desktop && <p className="mt-2 text-center text-[12.5px] font-medium text-ink-3">No computador abre a escolha de arquivo</p>}
          </Block>

          <Block title="Desta visita" hint={current.length ? `${current.length} ${current.length === 1 ? 'foto' : 'fotos'}` : 'Nenhuma ainda'}>
            {current.length === 0 ? (
              <button onClick={() => inputRef.current?.click()} className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-[20px] border-2 border-dashed border-line-2 text-[13.5px] font-semibold text-ink-3 hover:bg-surface">
                <ImagePlus className="size-5" strokeWidth={2} /> As fotos aparecem aqui
              </button>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                <AnimatePresence initial={false}>
                  {current.map((p) => (
                    <motion.li key={p.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.22, ease: EASE_OUT }} className="relative aspect-square overflow-hidden rounded-[18px] bg-muted">
                      <img src={p.src} alt={p.label} className="size-full object-cover" />
                      <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-ink backdrop-blur-md">{p.subject}</span>
                      <button onClick={() => removePhoto(p.id)} aria-label="Remover foto" className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-md hover:bg-black">
                        <X className="size-3.5" strokeWidth={2.6} />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </Block>
        </>
      }
      right={before ? <Compare before={before} now={now} onShoot={() => inputRef.current?.click()} /> : <NoPrior subject={subject} />}
    />
  )
}

function Shot({ photo, tag, dark }: { photo: PetPhoto; tag: string; dark?: boolean }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-muted">
      <img src={photo.src} alt={photo.label} className="size-full object-cover" />
      <span className={cn('absolute top-2 left-2 inline-flex h-7 items-center rounded-full px-2.5 text-[12px] font-bold', dark ? 'bg-black text-white' : 'bg-lime text-ink')}>{tag}</span>
      <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/80 px-2.5 py-1 text-[11.5px] font-semibold text-ink backdrop-blur-md">{photo.label}</span>
    </div>
  )
}

function Compare({ before, now, onShoot }: { before: PetPhoto; now?: PetPhoto; onShoot: () => void }) {
  return (
    <Block title={`Comparar com ${ddmm(before.date)}`} hint={before.subject}>
      <div className="grid grid-cols-2 gap-2">
        <Shot photo={before} tag={`Antes · ${ddmm(before.date)}`} dark />
        {now ? (
          <Shot photo={now} tag="Agora" />
        ) : (
          <button onClick={onShoot} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[20px] bg-lime-soft text-[13.5px] font-semibold text-ink hover:bg-lime/40">
            <span className="flex size-11 items-center justify-center rounded-full bg-lime">
              <Camera className="size-5" strokeWidth={2.2} />
            </span>
            Tirar a de agora
          </button>
        )}
      </div>
      <p className="mt-3 text-[13px] font-medium text-ink-3">{now ? 'O tutor vê as duas lado a lado no relatório.' : 'Use o mesmo ângulo da foto anterior.'}</p>
    </Block>
  )
}

function NoPrior({ subject }: { subject: string }) {
  return (
    <Block title="Comparar" hint={subject}>
      <div className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
          <Camera className="size-[18px]" strokeWidth={2} />
        </span>
        <span className="text-[13.5px] font-medium text-ink-2">Sem foto anterior deste assunto. A de hoje vira a referência da próxima visita.</span>
      </div>
    </Block>
  )
}
