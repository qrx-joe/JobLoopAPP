'use client'

import Link from 'next/link'
import { useUserStore } from '@/stores/userStore'

export function Header() {
  const { isAuthenticated, user } = useUserStore()

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JL</span>
            </div>
            <span className="font-bold text-xl text-gray-900">JobLoop</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/resume/new" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              创建简历
            </Link>
            <Link 
              href="/jd/match" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              JD匹配
            </Link>
            <Link 
              href="/interview" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              面试模拟
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.nickname || user?.email}</span>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors">
                  设置
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
