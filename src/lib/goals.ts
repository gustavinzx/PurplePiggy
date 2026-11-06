import { formatCurrency } from './format'

export type GoalIconKey = 'trip' | 'laptop' | 'gym' | 'home' | 'car' | 'study' | 'star' | 'bau'

export interface GoalIconDefinition {
  key: GoalIconKey
  label: string
  src: string
  bg: string
}

export const GOAL_ICONS: Record<GoalIconKey, GoalIconDefinition> = {
  trip: {
    key: 'trip',
    label: 'Viagem',
    src: '/assets/icons/icon-goal-trip.webp',
    bg: 'bg-[#DEEEFC]',
  },
  laptop: {
    key: 'laptop',
    label: 'Notebook',
    src: '/assets/icons/icon-goal-laptop.webp',
    bg: 'bg-[#EEDEFB]',
  },
  gym: {
    key: 'gym',
    label: 'Academia',
    src: '/assets/icons/icon-goal-gym.webp',
    bg: 'bg-[#FCE7F3]',
  },
  home: {
    key: 'home',
    label: 'Casa',
    src: '/assets/icons/icon-goal-home.webp',
    bg: 'bg-[#E0F2FE]',
  },
  car: {
    key: 'car',
    label: 'Carro',
    src: '/assets/icons/icon-goal-car.webp',
    bg: 'bg-[#F3E8FF]',
  },
  study: {
    key: 'study',
    label: 'Estudo',
    src: '/assets/icons/icon-goal-study.webp',
    bg: 'bg-[#EDE9FE]',
  },
  star: {
    key: 'star',
    label: 'Conquista',
    src: '/assets/icons/icon-goal-star.webp',
    bg: 'bg-[#FEF3C7]',
  },
  bau: {
    key: 'bau',
    label: 'Reserva',
    src: '/assets/icons/icon-bau.png',
    bg: 'bg-[#EEDEFB]',
  },
}

export const GOAL_ICON_LIST: GoalIconDefinition[] = [
  GOAL_ICONS.trip,
  GOAL_ICONS.laptop,
  GOAL_ICONS.gym,
  GOAL_ICONS.home,
  GOAL_ICONS.car,
  GOAL_ICONS.study,
  GOAL_ICONS.star,
  GOAL_ICONS.bau,
]

/**
 * Mapeia qualquer valor salvo anteriormente (emoji, slug, nome antigo de ícone)
 * para uma das 8 chaves oficiais V2.
 */
export function resolveGoalIconKey(
  iconOrCategory?: string | null,
  fallbackName?: string
): GoalIconKey {
  const raw = (iconOrCategory || '').trim().toLowerCase()
  const name = (fallbackName || '').trim().toLowerCase()

  // 1. Mapeamento direto de emojis e chaves exatas
  if (raw === '✈️' || raw === 'trip' || raw === 'travel') return 'trip'
  if (raw === '💻' || raw === 'laptop' || raw === 'notebook') return 'laptop'
  if (raw === '💪' || raw === '🏋️' || raw === 'gym' || raw === 'academia') return 'gym'
  if (raw === '🏠' || raw === 'home' || raw === 'casa') return 'home'
  if (raw === '🚗' || raw === 'car' || raw === 'carro') return 'car'
  if (raw === '🎓' || raw === 'study' || raw === 'curso' || raw === 'course') return 'study'
  if (raw === '⭐' || raw === 'star' || raw === 'estrela') return 'star'
  if (raw === 'reserva' || raw === 'bau' || raw === 'icon-bau' || raw === 'emergency') return 'bau'

  // 2. Detecção por substring na chave do ícone ou na categoria
  if (raw.includes('viagem') || raw.includes('voo') || raw.includes('trip')) return 'trip'
  if (raw.includes('note') || raw.includes('laptop') || raw.includes('computador')) return 'laptop'
  if (raw.includes('acad') || raw.includes('trein') || raw.includes('saude') || raw.includes('saúde')) return 'gym'
  if (raw.includes('casa') || raw.includes('mora') || raw.includes('apto') || raw.includes('home')) return 'home'
  if (raw.includes('car') || raw.includes('veic') || raw.includes('veíc') || raw.includes('moto')) return 'car'
  if (raw.includes('estud') || raw.includes('curs') || raw.includes('faculd') || raw.includes('educ')) return 'study'
  if (raw.includes('reserv') || raw.includes('emerg')) return 'bau'

  // 3. Detecção secundária pelo nome da meta
  if (name.includes('viagem') || name.includes('voo') || name.includes('férias') || name.includes('ferias')) return 'trip'
  if (name.includes('note') || name.includes('laptop') || name.includes('computador') || name.includes('celular')) return 'laptop'
  if (name.includes('academia') || name.includes('treino') || name.includes('saúde') || name.includes('saude')) return 'gym'
  if (name.includes('casa') || name.includes('moradia') || name.includes('reforma') || name.includes('apartamento')) return 'home'
  if (name.includes('carro') || name.includes('veículo') || name.includes('veiculo') || name.includes('moto')) return 'car'
  if (name.includes('estudo') || name.includes('curso') || name.includes('faculdade') || name.includes('livro')) return 'study'
  if (name.includes('reserva') || name.includes('emergência') || name.includes('emergencia')) return 'bau'

  // 4. Fallback padrão canônico
  return 'star'
}

export function getGoalIconMeta(
  iconOrCategory?: string | null,
  fallbackName?: string
): GoalIconDefinition {
  const key = resolveGoalIconKey(iconOrCategory, fallbackName)
  return GOAL_ICONS[key] || GOAL_ICONS.star
}

export interface GoalCardMetrics {
  saved: number
  target: number
  remaining: number
  progressPct: number
  isCompleted: boolean
  formattedSaved: string
  formattedTarget: string
  formattedRemaining: string
}

export function calculateGoalCardMetrics(goal: {
  saved_amount: number | string | null
  target_amount: number | string | null
}): GoalCardMetrics {
  const saved = Number(goal.saved_amount || 0)
  const target = Number(goal.target_amount || 0)
  const remaining = Math.max(0, target - saved)
  const progressRatio = target > 0 ? Math.min(saved / target, 1) : 0
  const progressPct = Math.min(100, Math.round(progressRatio * 100))
  const isCompleted = target > 0 && saved >= target

  return {
    saved,
    target,
    remaining,
    progressPct,
    isCompleted,
    formattedSaved: formatCurrency(saved),
    formattedTarget: formatCurrency(target),
    formattedRemaining: formatCurrency(remaining),
  }
}
