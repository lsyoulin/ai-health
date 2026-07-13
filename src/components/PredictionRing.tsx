interface PredictionRingProps {
  /** 预测血糖值 (mmol/L) */
  value: number
  /** 风险等级 */
  level: 'safe' | 'warning' | 'danger'
  /** 尺寸 px */
  size?: number
  /** 是否显示动画 */
  animate?: boolean
  /** 是否显示数字 */
  showValue?: boolean
  /** 副标题 */
  subtitle?: string
}

/**
 * 知食 · 核心亮点1
 * 餐后血糖预测环
 *
 * 3秒惊艳的核心组件：圆环 + 三色信号 + 数字滚动
 */
export default function PredictionRing({
  value,
  level,
  size = 200,
  animate = true,
  showValue = true,
  subtitle = '餐后2h血糖预测',
}: PredictionRingProps) {
  const radius = 90
  const circumference = 2 * Math.PI * radius // ≈ 565
  // 血糖值映射：4-15 mmol/L 映射到 0-100% 填充
  const fillPercent = Math.min(1, Math.max(0, (value - 4) / 11))
  const fillOffset = circumference * (1 - fillPercent)

  const colorMap = {
    safe: '#5C8A5C',
    warning: '#E6B655',
    danger: '#C8553D',
  }

  const color = colorMap[level]

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="-rotate-90"
      >
        <defs>
          <linearGradient id={`ring-grad-${level}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>

        {/* 背景环 */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#E8DCC4"
          strokeWidth="10"
        />

        {/* 预测环 */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={`url(#ring-grad-${level})`}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : fillOffset}
          style={
            animate
              ? {
                  animation: 'ring-fill 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  // @ts-ignore - CSS custom property
                  '--target-offset': fillOffset,
                }
              : undefined
          }
        />

        {/* 信号灯装饰点 */}
        <circle cx="100" cy="10" r="4" fill={color} />
        <circle cx="190" cy="100" r="4" fill="#E8DCC4" />
        <circle cx="100" cy="190" r="4" fill="#E8DCC4" />
        <circle cx="10" cy="100" r="4" fill="#E8DCC4" />
      </svg>

      {/* 中心数值 */}
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-num font-bold text-moss-700 leading-none"
               style={{ fontSize: size * 0.18 }}>
            {animate ? (
              <CountUpNumber target={value} />
            ) : (
              value.toFixed(1)
            )}
          </div>
          <div className="text-[10px] text-moss-500 mt-1 tracking-wide">
            mmol/L
          </div>
          <div className="text-[10px] text-moss-600 mt-2 px-3 text-center">
            {subtitle}
          </div>
        </div>
      )}
    </div>
  )
}

// 数字滚动效果
function CountUpNumber({ target }: { target: number }) {
  return (
    <span className="animate-count-up inline-block">
      {target.toFixed(1)}
    </span>
  )
}
