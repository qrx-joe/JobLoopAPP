import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 min-h-[64px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline group" aria-label="JobLoop 首页">
            <div
              className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"
              aria-hidden="true"
            >
              <span className="text-white font-bold text-base leading-none select-none">JL</span>
            </div>
            <span className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">JobLoop</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="主导航">
            <Link
              href="/resume/new"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              创建简历
            </Link>
            <Link
              href="/jd/match"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              JD匹配
            </Link>
            <Link
              href="/interview"
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium no-underline"
            >
              面试模拟
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3" role="navigation" aria-label="用户操作">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors no-underline"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors no-underline"
            >
              注册
            </Link>
          </div>

          {/* Mobile menu button - placeholder */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 cursor-pointer"
            aria-label="打开菜单"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
