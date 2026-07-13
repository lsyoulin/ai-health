import { ChronicType } from '../store/useStore'

interface PersonaBadgeProps {
  type: ChronicType
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const personaConfig: Record<ChronicType, { label: string; color: string; bg: string; emoji: string }> = {
  diabetes: {
    label: '2型糖尿病',
    color: 'text-amber-700',
    bg: 'bg-amber-100 border-amber-300',
    emoji: '🩺',
  },
  hypertension: {
    label: '高血压',
    color: 'text-moss-700',
    bg: 'bg-moss-100 border-moss-300',
    emoji: '❤️',
  },
  diabetes_hypertension: {
    label: '糖尿病+高血压',
    color: 'text-signal-danger',
    bg: 'bg-red-50 border-red-200',
    emoji: '⚠️',
  },
  healthy: {
    label: '健康人',
    color: 'text-signal-safe',
    bg: 'bg-green-50 border-green-200',
    emoji: '✨',
  },
}

export default function PersonaBadge({
  type,
  size = 'md',
  showLabel = true,
}: PersonaBadgeProps) {
  const config = personaConfig[type]

  const sizeClass = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size]

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.color} ${sizeClass}`}
    >
      <span>{config.emoji}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  )
}
