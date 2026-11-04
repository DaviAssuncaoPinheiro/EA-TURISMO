import type { Tone } from '@/components/ui'
import type { ReminderKind, ReminderStatus, VisitStatus, VisitType } from '@/data/mock'
import { daysFromToday } from '@/data/time'

export const VISIT_STATUS: Record<VisitStatus, { label: string; tone: Tone }> = {
  concluida: { label: 'Concluída', tone: 'ok' },
  'em-atendimento': { label: 'Em atendimento', tone: 'lime' },
  'a-caminho': { label: 'A caminho', tone: 'info' },
  agendada: { label: 'Agendada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'late' },
}

export const VISIT_TYPE_ICON: Record<VisitType, string> = {
  Vacinação: 'syringe',
  Consulta: 'stethoscope',
  Retorno: 'repeat',
  'Coleta de exames': 'test-tube',
  Curativo: 'bandage',
  'Check-up': 'clipboard-check',
  Fluidoterapia: 'droplets',
}

export const REMINDER_STATUS: Record<ReminderStatus, { label: string; tone: Tone }> = {
  programado: { label: 'Programado', tone: 'neutral' },
  enviado: { label: 'Enviado', tone: 'info' },
  lido: { label: 'Lido', tone: 'violet' },
  confirmado: { label: 'Confirmado', tone: 'ok' },
  agendado: { label: 'Visita agendada', tone: 'dark' },
  'sem-resposta': { label: 'Sem resposta', tone: 'late' },
}

export const REMINDER_KIND: Record<ReminderKind, { label: string }> = {
  vacina: { label: 'Vacina' },
  retorno: { label: 'Retorno' },
  'vermífugo': { label: 'Vermífugo' },
  antipulgas: { label: 'Antipulgas' },
  exame: { label: 'Exame' },
}

/** Situação de um vencimento: atrasada / vence em até 30 dias / em dia */
export function dueState(date: string | Date): { label: string; tone: Tone; key: 'late' | 'soon' | 'ok' } {
  const n = daysFromToday(date)
  if (n < 0) return { label: `Atrasada ${-n}d`, tone: 'late', key: 'late' }
  if (n === 0) return { label: 'Vence hoje', tone: 'warn', key: 'soon' }
  if (n <= 30) return { label: `Vence em ${n}d`, tone: 'warn', key: 'soon' }
  return { label: 'Em dia', tone: 'ok', key: 'ok' }
}
