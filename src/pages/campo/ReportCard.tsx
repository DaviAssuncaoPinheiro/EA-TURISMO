// Cartão "Relatório do tutor" da tela de concluído: prévia em miniatura, abrir e enviar no WhatsApp.
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Calendar, MessageCircle, Pill, Scale, Syringe } from 'lucide-react'
import { cn, firstName, kg } from '@/lib/utils'
import { LogoMark } from '@/components/AppShell'
import { PetAvatar } from '@/components/ui'
import { PET, TUTOR } from '@/data/mock'
import { useDemo } from '@/store'
import { notify } from './campoStore'
import { dateShort } from './data'
import { EASE_OUT, Pressable } from './kit'
import { reportLink, reportPhotos, resolveReport, tutorPhoneDigits } from './report'

export function ReportCard({ visitId, tutorId, className, delay = 0.75 }: { visitId: string; tutorId: string; className?: string; delay?: number }) {
  const nav = useNavigate()
  const reports = useDemo((s) => s.reports)
  const status = useDemo((s) => s.visitStatus)
  const stored = useDemo((s) => s.photos)
  const r = resolveReport(visitId, reports, status)
  if (!r) return null
  const pet = PET[r.petId]
  const tutorFirst = firstName(TUTOR[tutorId].name)
  const { photos } = reportPhotos(r, stored)
  const next = r.nextDates?.[0]

  const send = () => {
    const link = reportLink(visitId)
    const text = `Olá, ${tutorFirst}! Aqui está o relatório da visita ${pet.sex === 'F' ? 'da' : 'do'} ${pet.name}: ${link}`
    notify({ kind: 'whatsapp', title: `Enviado para ${tutorFirst}`, body: `Relatório ${pet.sex === 'F' ? 'da' : 'do'} ${pet.name} com fotos e próximas datas.` })
    window.open(`https://wa.me/${tutorPhoneDigits(tutorId)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  const rows = [
    r.weightKg != null && { icon: Scale, text: kg(r.weightKg) },
    r.vaccines?.length && { icon: Syringe, text: r.vaccines.map((v) => v.name).join(', ') },
    r.prescription?.length && { icon: Pill, text: `${r.prescription.length} na receita` },
    next && { icon: Calendar, text: `${next.label}, ${dateShort(next.date)}` },
  ].filter(Boolean) as { icon: typeof Scale; text: string }[]

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: EASE_OUT }}
      className={cn('overflow-hidden rounded-[28px] bg-black p-2 text-white', className)}
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-3">
        <div>
          <h3 className="text-[17px] font-bold tracking-[-0.02em]">Relatório do tutor</h3>
          <div className="text-[13px] font-medium text-white/55">Link para {tutorFirst} acompanhar</div>
        </div>
        <span className="inline-flex h-7 items-center rounded-full bg-lime px-2.5 text-[12px] font-bold text-ink">Pronto</span>
      </div>

      {/* prévia em miniatura */}
      <Pressable scale={0.985} onClick={() => nav(`/relatorio/${visitId}`)} aria-label="Abrir relatório" className="block w-full rounded-[22px] bg-surface p-3 text-left text-ink">
        <div className="flex items-center gap-2">
          <LogoMark size={22} />
          <span className="text-[12px] font-bold">Vet Domicílio</span>
          <span className="ml-auto text-[11px] font-semibold text-ink-3">{dateShort(r.finishedAt)}</span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-card p-2.5 shadow-card">
          <PetAvatar pet={pet} size={42} />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-bold">{pet.name}</div>
            <div className="line-clamp-2 text-[11.5px] leading-snug font-medium text-ink-3">{r.summary}</div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {rows.slice(0, 4).map((x) => (
            <span key={x.text} className="flex h-8 min-w-0 items-center gap-1.5 rounded-full bg-card px-2.5 text-[11.5px] font-semibold text-ink-2 shadow-card">
              <x.icon className="size-3.5 shrink-0 text-ink" strokeWidth={2} />
              <span className="truncate">{x.text}</span>
            </span>
          ))}
        </div>
        {photos.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {photos.slice(0, 4).map((p) => (
              <img key={p.id} src={p.src} alt={p.subject} className="size-11 rounded-[12px] object-cover" />
            ))}
            {photos.length > 4 && <span className="flex size-11 items-center justify-center rounded-[12px] bg-card text-[12px] font-bold">+{photos.length - 4}</span>}
          </div>
        )}
      </Pressable>

      <div className="mt-2 flex flex-col gap-2 min-[440px]:grid min-[440px]:grid-cols-2">
        <Pressable onClick={() => nav(`/relatorio/${visitId}`)} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-white/10 px-3 text-[14px] font-semibold text-white hover:bg-white/15">
          Abrir relatório <ArrowUpRight className="size-4 text-white/60" strokeWidth={2.2} />
        </Pressable>
        <Pressable onClick={send} className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-lime px-3 text-[14px] font-semibold text-ink hover:bg-lime-2">
          <MessageCircle className="size-4" strokeWidth={2.2} /> Enviar no WhatsApp
        </Pressable>
      </div>
    </motion.section>
  )
}
