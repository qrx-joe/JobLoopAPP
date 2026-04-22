import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm select-none">JL</span>
            </div>
            <span className="font-bold text-xl text-gray-900">JobLoop</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/resume/new" 
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              创建简历
            </Link>
            <Link 
              href="/jd/match" 
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              JD匹配
            </Link>
            <Link 
              href="/interview" 
              className="text-gray-600 hover:text-blue-600 transition-colors text-sm no-underline"
            >
              面试模拟
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  )
}
