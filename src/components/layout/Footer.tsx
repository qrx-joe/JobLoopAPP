import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <span className="text-white font-bold text-base leading-none select-none">JL</span>
              </div>
              <span className="font-bold text-xl text-gray-900">JobLoop</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              让普通人变得可被录用。从零散经历到结构化简历，再到面试准备，一站式AI求职助手。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">产品功能</h4>
            <ul className="space-y-2 text-sm text-gray-500 list-none p-0 m-0">
              <li>
                <Link href="/resume/new" className="hover:text-blue-600 no-underline transition-colors">简历生成</Link>
              </li>
              <li>
                <Link href="/jd/match" className="hover:text-blue-600 no-underline transition-colors">JD匹配优化</Link>
              </li>
              <li>
                <Link href="/interview" className="hover:text-blue-600 no-underline transition-colors">AI面试模拟</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600 no-underline transition-colors" onClick={(e) => e.preventDefault()}>PDF导出</Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm">关于</h4>
            <ul className="space-y-2 text-sm text-gray-500 list-none p-0 m-0">
              <li>
                <Link href="#" className="hover:text-blue-600 no-underline transition-colors" onClick={(e) => e.preventDefault()}>隐私政策</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600 no-underline transition-colors" onClick={(e) => e.preventDefault()}>使用条款</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600 no-underline transition-colors" onClick={(e) => e.preventDefault()}>联系我们</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-blue-600 no-underline transition-colors" onClick={(e) => e.preventDefault()}>意见反馈</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-400 space-y-1">
          <p>本内容由AI辅助生成，请核实后使用。</p>
          <p>&copy; {currentYear} JobLoop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
