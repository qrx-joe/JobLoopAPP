export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">JL</span>
              </div>
              <span className="font-bold text-xl">JobLoop</span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs">
              让普通人变得可被录用。从零散经历到结构化简历，再到面试准备，一站式AI求职助手。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">产品功能</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600">简历生成</a></li>
              <li><a href="#" className="hover:text-blue-600">JD匹配优化</a></li>
              <li><a href="#" className="hover:text-blue-600">AI面试模拟</a></li>
              <li><a href="#" className="hover:text-blue-600">PDF导出</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">关于</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-blue-600">隐私政策</a></li>
              <li><a href="#" className="hover:text-blue-600">使用条款</a></li>
              <li><a href="#" className="hover:text-blue-600">联系我们</a></li>
              <li><a href="#" className="hover:text-blue-600">意见反馈</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-400">
          <p>本内容由AI辅助生成，请核实后使用。</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} JobLoop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
