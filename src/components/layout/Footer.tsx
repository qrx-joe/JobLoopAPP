import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600"
                aria-hidden="true"
              >
                <span className="select-none text-base font-bold leading-none text-white">JL</span>
              </div>
              <span className="text-xl font-bold text-gray-900">JobLoop</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-gray-500">
              让普通人变得可被录用。从零散经历到结构化简历，再到面试准备，一站式AI求职助手。
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">产品功能</h4>
            <ul className="m-0 list-none space-y-2 p-0 text-sm text-gray-500">
              <li>
                <Link
                  href="/resume/new"
                  className="no-underline transition-colors hover:text-blue-600"
                >
                  简历生成
                </Link>
              </li>
              <li>
                <Link
                  href="/jd/match"
                  className="no-underline transition-colors hover:text-blue-600"
                >
                  JD匹配优化
                </Link>
              </li>
              <li>
                <Link
                  href="/interview"
                  className="no-underline transition-colors hover:text-blue-600"
                >
                  AI面试模拟
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="no-underline transition-colors hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  PDF导出
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-gray-900">关于</h4>
            <ul className="m-0 list-none space-y-2 p-0 text-sm text-gray-500">
              <li>
                <Link
                  href="#"
                  className="no-underline transition-colors hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  隐私政策
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="no-underline transition-colors hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  使用条款
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="no-underline transition-colors hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  联系我们
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="no-underline transition-colors hover:text-blue-600"
                  onClick={(e) => e.preventDefault()}
                >
                  意见反馈
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-1 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          <p>本内容由AI辅助生成，请核实后使用。</p>
          <p>&copy; {currentYear} JobLoop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
