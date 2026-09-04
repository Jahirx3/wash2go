import { getEstadoBadge } from '@/lib/theme'

export default function Badge({ estado, status, label }) {
  const currentEstado = estado || status
  const badgeInfo = getEstadoBadge(currentEstado)

  return (
    <span
      className="badge"
      style={{
        backgroundColor: badgeInfo.bg,
        color: badgeInfo.color,
        borderColor: badgeInfo.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: badgeInfo.color }}
      />
      {label || badgeInfo.label}
    </span>
  )
}
