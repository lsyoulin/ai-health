import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'

const navItems = [
  { path: '/', label: '首页' },
  { path: '/analyze', label: '拍照分析' },
  { path: '/persona', label: 'Persona' },
  { path: '/simulate', label: '决策推演' },
  { path: '/parent', label: '为父母' },
  { path: '/coach', label: 'AI教练' },
  { path: '/trends', label: '趋势' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-grain">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/85 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={32} />
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-moss-700 leading-none">
                知食
              </span>
              <span className="text-[10px] tracking-widest text-amber-700 mt-0.5">
                ZHISHI · AI
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 text-sm rounded-md transition-all ${
                  location.pathname === item.path
                    ? 'bg-moss-700 text-paper'
                    : 'text-moss-700 hover:bg-amber-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* 移动端简化导航 */}
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto max-w-[60%]">
            {navItems.slice(0, 3).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2 py-1.5 text-xs whitespace-nowrap rounded-md transition-all ${
                  location.pathname === item.path
                    ? 'bg-moss-700 text-paper'
                    : 'text-moss-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1">
        <div className="page-enter">{children}</div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-amber-200 bg-paper">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <span className="text-xs text-moss-700">
              知食 · 让每一口都被懂
            </span>
          </div>
          <div className="text-xs text-moss-500">
            TRAE AI 创造力大赛 · 社会服务赛道 · Demo 演示
          </div>
        </div>
      </footer>
    </div>
  )
}
