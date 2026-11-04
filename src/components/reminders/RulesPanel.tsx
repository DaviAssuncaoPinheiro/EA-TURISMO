import * as React from 'react'
import * as Switch from '@radix-ui/react-switch'
import { motion } from 'motion/react'
import { Bell, Bug, Clock3, Lock, MessageCircle, Pill, ShieldCheck, Stethoscope, Syringe, TestTube2, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface Rule {
  id: string
  title: string
  desc: string
  icon: LucideIcon
  on: boolean
  before: number | 'vet'
  repeat: number // 0 = não repetir
  fixed?: boolean
  stat: string
}

export const INITIAL_RULES: Rule[] = [
  { id: 'v10', title: 'V10 anual', desc: 'Avisar 15 dias antes e repetir em 3 dias se o tutor não ler.', icon: Syringe, on: true, before: 15, repeat: 3, stat: '34 enviados no mês' },
  { id: 'raiva', title: 'Antirrábica anual', desc: 'Obrigatória: aviso mais cedo e uma segunda chance.', icon: ShieldCheck, on: true, before: 30, repeat: 5, stat: '21 enviados no mês' },
  { id: 'gripe', title: 'Gripe canina (creche e hotel)', desc: 'Reforço semestral para cães que frequentam creche.', icon: Syringe, on: true, before: 15, repeat: 3, stat: '8 enviados no mês' },
  { id: 'retorno', title: 'Retorno pós-consulta', desc: 'A data vem da orientação que o veterinário registra na consulta.', icon: Stethoscope, on: true, before: 'vet', repeat: 0, fixed: true, stat: '17 enviados no mês' },
  { id: 'vermifugo', title: 'Vermífugo a cada 90 dias', desc: 'Calculado a partir da última dose registrada na ficha.', icon: Pill, on: true, before: 7, repeat: 3, stat: '12 enviados no mês' },
  { id: 'antipulgas', title: 'Antipulgas mensal', desc: 'Lembrete leve, no ritmo de cada produto (30, 35 ou 84 dias).', icon: Bug, on: false, before: 3, repeat: 0, stat: 'Desligada' },
  { id: 'exame', title: 'Exames de acompanhamento', desc: 'Pacientes crônicos: renal, cardíaco e hemograma de rotina.', icon: TestTube2, on: true, before: 15, repeat: 0, stat: '5 enviados no mês' },
]

function Chips<T extends string | number>({ value, options, onChange, disabled }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.v)}
          disabled={disabled}
          onClick={() => onChange(o.v)}
          className={cn(
            'h-7 rounded-full px-2.5 text-[12px] font-medium transition-colors disabled:pointer-events-none',
            value === o.v ? 'bg-sage-800 text-paper' : 'bg-paper-2 text-ink-2 hover:bg-line',
            disabled && value !== o.v && 'opacity-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Sw({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch.Root checked={checked} onCheckedChange={onChange} aria-label={label} className="relative h-[22px] w-[38px] shrink-0 rounded-full bg-line-2 transition-colors data-[state=checked]:bg-sage-700">
      <Switch.Thumb className="block size-[18px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[18px]" />
    </Switch.Root>
  )
}

export function RulesPanel({ rules, setRules, hour, setHour, suggestDay, setSuggestDay, onClose }: {
  rules: Rule[]
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
  hour: string
  setHour: (h: string) => void
  suggestDay: boolean
  setSuggestDay: (v: boolean) => void
  onClose: () => void
}) {
  const patch = (id: string, p: Partial<Rule>) => setRules((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const active = rules.filter((r) => r.on).length
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 border-b border-line px-5 pt-4 pb-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-sage-800">
          <Bell size={19} strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[22px] leading-tight font-medium text-ink">Regras automáticas</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-2">O sistema monta e envia o lembrete sozinho. {active} de {rules.length} regras ativas.</p>
        </div>
        <button onClick={onClose} aria-label="Fechar" className="-mr-1.5 flex size-9 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-2 hover:text-ink">
          <X size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {/* ajustes gerais */}
        <div className="rounded-xl border border-line bg-card">
          <div className="flex items-center gap-3 px-4 py-3">
            <MessageCircle size={17} strokeWidth={1.8} className="shrink-0 text-sage-700" />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-ink">Sugerir o dia da equipe no bairro</div>
              <div className="text-[12px] text-ink-3">A mensagem oferece o próximo dia em que um veterinário atende a região do tutor.</div>
            </div>
            <Sw checked={suggestDay} onChange={setSuggestDay} label="Sugerir o dia da equipe no bairro" />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
            <Clock3 size={17} strokeWidth={1.8} className="shrink-0 text-sage-700" />
            <div className="min-w-0 flex-1 basis-40">
              <div className="text-[13.5px] font-medium text-ink">Horário de envio</div>
              <div className="text-[12px] text-ink-3">Nunca aos domingos, nem antes das 8h.</div>
            </div>
            <Chips value={hour} onChange={setHour} options={[{ v: '08:00', label: '08:00' }, { v: '09:00', label: '09:00' }, { v: '12:00', label: '12:00' }, { v: '18:00', label: '18:00' }]} />
          </div>
        </div>

        <div className="eyebrow mt-6 mb-2 px-1">Regras por tipo</div>
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {rules.map((rule, i) => {
            const Icon = rule.icon
            return (
              <motion.li key={rule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md transition-colors', rule.on ? 'bg-sage-100 text-sage-800' : 'bg-paper-2 text-ink-4')}>
                    <Icon size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[14px] font-semibold transition-colors', rule.on ? 'text-ink' : 'text-ink-3')}>{rule.title}</div>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{rule.desc}</p>
                  </div>
                  <Sw checked={rule.on} onChange={(v) => patch(rule.id, { on: v })} label={rule.title} />
                </div>
                <div className={cn('mt-3 grid gap-2.5 pl-11 transition-opacity', !rule.on && 'opacity-40')}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[82px] shrink-0 text-[11.5px] text-ink-3">Avisar antes</span>
                    {rule.fixed ? (
                      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-sage-50 px-2.5 text-[12px] font-medium text-sage-800 ring-1 ring-sage-100">
                        <Lock size={11} strokeWidth={2} /> Conforme orientação do veterinário
                      </span>
                    ) : (
                      <Chips disabled={!rule.on} value={rule.before as number} onChange={(v) => patch(rule.id, { before: v })} options={[3, 7, 15, 30].map((n) => ({ v: n, label: `${n} dias` }))} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[82px] shrink-0 text-[11.5px] text-ink-3">Se não ler</span>
                    <Chips disabled={!rule.on} value={rule.repeat} onChange={(v) => patch(rule.id, { repeat: v })} options={[{ v: 0, label: 'Não repetir' }, { v: 3, label: 'Em 3 dias' }, { v: 5, label: 'Em 5 dias' }]} />
                  </div>
                </div>
                <div className="mt-2.5 pl-11 font-mono text-[10.5px] tracking-wide text-ink-4 uppercase">{rule.on ? rule.stat : 'Desligada'}</div>
              </motion.li>
            )
          })}
        </ul>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line bg-card px-5 py-3">
        <Button variant="ghost" onClick={onClose}>Fechar</Button>
        <Button
          variant="primary"
          onClick={() => {
            toast.success('Regras salvas', { description: `${active} regras ativas, envio às ${hour}.` })
            onClose()
          }}
        >
          Salvar regras
        </Button>
      </div>
    </div>
  )
}
