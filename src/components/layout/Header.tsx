import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 min-h-[64px] items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2 no-underline"
            aria-label="JobLoop 首页"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600"
              aria-hidden="true"
            >
              <span className="select-none text-base font-bold leading-none text-white">JL</span>
            </div>
            <span className="text-xl font-bold text-gray-900 transition-colors group-hover:text-blue-600">
              JobLoop
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="主导航">
            <Link
              href="/resume/new"
              className="text-sm font-medium text-gray-600 no-underline transition-colors hover:text-blue-600"
            >
              创建简历
            </Link>
            <Link
              href="/jd/match"
              className="text-sm font-medium text-gray-600 no-underline transition-colors hover:text-blue-600"
            >
              JD匹配
            </Link>
            <Link
              href="/interview"
              className="text-sm font-medium text-gray-600 no-underline transition-colors hover:text-blue-600"
            >
              面试模拟
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3" role="navigation" aria-label="用户操作">
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 no-underline transition-colors hover:bg-gray-50"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-blue-700"
            >
              注册
            </Link>
          </div>

          {/* Mobile menu button - placeholder */}
          <button
            type="button"
            className="cursor-pointer rounded-md p-2 text-gray-600 hover:text-gray-900 md:hidden"
            aria-label="打开菜单"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
