interface LogoProps {
  size?: number
  className?: string
}

/**
 * 知食 · 品牌 Logo
 *
 * 设计理念：碗+光+环
 * - 圆环：代表"预测环"（核心亮点1），也代表"完整关怀"
 * - 碗形：代表"食物/餐饮场景"
 * - 渐变色：琥珀金（温暖）→ 深墨绿（专业）
 */
export default function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A574" />
          <stop offset="100%" stopColor="#1F3A2E" />
        </linearGradient>
      </defs>

      {/* 外环 - 预测环 */}
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="url(#logo-grad)"
        strokeWidth="2.5"
        strokeDasharray="100 30"
        strokeLinecap="round"
        fill="none"
      />

      {/* 内部碗形 - 食物场景 */}
      <path
        d="M14 22 L34 22 Q34 32 24 34 Q14 32 14 22 Z"
        fill="url(#logo-grad)"
        opacity="0.92"
      />

      {/* 上方热气 - AI 智能 */}
      <path
        d="M20 18 Q20 14 22 14 Q24 14 24 18"
        stroke="#D4A574"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 18 Q26 14 28 14 Q30 14 30 18"
        stroke="#D4A574"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* 中心点 - 预测焦点 */}
      <circle cx="24" cy="27" r="2" fill="#FAF6EE" />
    </svg>
  )
}
