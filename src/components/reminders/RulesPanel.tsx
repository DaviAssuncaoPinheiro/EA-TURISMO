import * as React from 'react'
import * as Switch from '@radix-ui/react-switch'
import { motion } from 'motion/react'
import { Bug, Clock3, Lock, MessageCircle, Pill, ShieldCheck, Stethoscope, Syringe, TestTube2, X, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Card, IconButton, IconCircle } from '@/components/ui'
import { cn } from '@/lib/utils'

type RuleTone = 'blue' | 'coral' | 'violet' | 'green' | 'yellow'

export interface Rule {
  id: string
  title: string
  desc: string
  icon: LucideIcon
  tone: RuleTone
  on: boolean
  before: number | 'vet'
  repeat: number // 0 = não repetir
  fixed?: boolean
  stat: string
}

export const INITIAL_RULES: Rule[] = [
  { id: 'v10', title: 'V10 anual', desc: 'Aviso antes do vencimento.', icon: Syringe, tone: 'blue', on: true, before: 15, repeat: 3, stat: '34 enviados no mês' },
  { id: 'raiva', title: 'Antirrábica anual', desc: 'Obrigatória, com aviso mais cedo.', icon: ShieldCheck, tone: 'coral', on: true, before: 30, repeat: 5, stat: '21 enviados no mês' },
  { id: 'gripe', title: 'Gripe canina', desc: 'Reforço semestral para cães de creche.', icon: Syringe, tone: 'violet', on: true, before: 15, repeat: 3, stat: '8 enviados no mês' },
  { id: 'retorno', title: 'Retorno pós-consulta', desc: 'Data registrada pelo veterinário.', icon: Stethoscope, tone: 'green', on: true, before: 'vet', repeat: 0, fixed: true, stat: '17 enviados no mês' },
  { id: 'vermifugo', title: 'Vermífugo', desc: 'A cada 90 dias da última dose.', icon: Pill, tone: 'yellow', on: true, before: 7, repeat: 3, stat: '12 enviados no mês' },
  { id: 'antipulgas', title: 'Antipulgas', desc: 'Mensal, conforme o produto.', icon: Bug, tone: 'coral', on: false, before: 3, repeat: 0, stat: 'Desligada' },
  { id: 'exame', title: 'Exames de rotina', desc: 'Para pacientes crônicos.', icon: TestTube2, tone: 'blue', on: true, before: 15, repeat: 0, stat: '5 enviados no mês' },
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
            'h-8 rounded-full px-3 text-[12.5px] font-semibold transition-colors disabled:pointer-events-none',
            value === o.v ? 'bg-black text-white' : 'bg-muted text-ink-2 hover:bg-muted-2',
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
    <Switch.Root checked={checked} onCheckedChange={onChange} aria-label={label} className="relative h-[26px] w-[44px] shrink-0 rounded-full bg-line-2 transition-colors data-[state=checked]:bg-black">
      <Switch.Thumb className="block size-[22px] translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-out data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-lime" />
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
      <div className="flex items-center gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[22px] leading-tight font-bold tracking-[-0.02em] text-ink">Regras</h2>
          <p className="mt-0.5 text-[12.5px] text-ink-3">{active} de {rules.length} ativas</p>
        </div>
        <IconButton tone="card" size={40} onClick={onClose} aria-label="Fechar">
          <X size={18} strokeWidth={1.9} />
        </IconButton>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
        <Card className="divide-y divide-line">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <IconCircle tone="muted" size={40}><MessageCircle size={18} strokeWidth={1.9} /></IconCircle>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-bold text-ink">Sugerir dia no bairro</div>
              <div className="text-[12.5px] text-ink-3">Oferece o próximo dia da equipe</div>
            </div>
            <Sw checked={suggestDay} onChange={setSuggestDay} label="Sugerir dia no bairro" />
          </div>
          <div className="flex flex-wrap items-center gap-3 px-4 py-3.5">
            <IconCircle tone="muted" size={40}><Clock3 size={18} strokeWidth={1.9} /></IconCircle>
            <div className="min-w-0 flex-1 basis-32">
              <div className="text-[14px] font-bold text-ink">Horário de envio</div>
              <div className="text-[12.5px] text-ink-3">Sem envio aos domingos</div>
            </div>
            <Chips value={hour} onChange={setHour} options={[{ v: '08:00', label: '08:00' }, { v: '09:00', label: '09:00' }, { v: '12:00', label: '12:00' }, { v: '18:00', label: '18:00' }]} />
          </div>
        </Card>

        <h3 className="px-2 pt-3 pb-1 text-[16px] font-bold text-ink">Por tipo</h3>
        {rules.map((rule, i) => {
          const Icon = rule.icon
          return (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <IconCircle tone={rule.on ? rule.tone : 'muted'} size={40}><Icon size={18} strokeWidth={1.9} /></IconCircle>
                  <div className="min-w-0 flex-1">
                    <div className={cn('text-[14.5px] font-bold', rule.on ? 'text-ink' : 'text-ink-3')}>{rule.title}</div>
                    <p className="text-[12.5px] leading-snug text-ink-3">{rule.on ? rule.desc : 'Desligada'}</p>
                  </div>
                  <Sw checked={rule.on} onChange={(v) => patch(rule.id, { on: v })} label={rule.title} />
                </div>
                <div className={cn('mt-3.5 grid gap-2.5 transition-opacity', !rule.on && 'opacity-40')}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[76px] shrink-0 text-[12px] text-ink-3">Antecedência</span>
                    {rule.fixed ? (
                      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-[12.5px] font-semibold text-ink-2">
                        <Lock size={12} strokeWidth={2} /> Definida na consulta
                      </span>
                    ) : (
                      <Chips disabled={!rule.on} value={rule.before as number} onChange={(v) => patch(rule.id, { before: v })} options={[3, 7, 15, 30].map((n) => ({ v: n, label: `${n} dias` }))} />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="w-[76px] shrink-0 text-[12px] text-ink-3">Se não ler</span>
                    <Chips disabled={!rule.on} value={rule.repeat} onChange={(v) => patch(rule.id, { repeat: v })} options={[{ v: 0, label: 'Não repetir' }, { v: 3, label: 'Em 3 dias' }, { v: 5, label: 'Em 5 dias' }]} />
                  </div>
                </div>
                {rule.on && <div className="mt-3 text-[12px] text-ink-3">{rule.stat}</div>}
              </Card>
            </motion.div>
          )
        })}
      </div>

      <div className="flex items-center justify-end gap-2 bg-card px-5 py-3.5">
        <Button variant="subtle" onClick={onClose}>Fechar</Button>
        <Button
          variant="primary"
          onClick={() => {
            toast.success('Regras salvas', { description: `${active} regras ativas, envio às ${hour}.` })
            onClose()
          }}
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}
