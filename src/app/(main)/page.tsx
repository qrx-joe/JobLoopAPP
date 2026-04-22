export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
              把你的经历变成<br />
              <span className="text-blue-200">能拿offer的简历</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              告别&quot;不会写简历&quot;的困扰。输入你的经历，AI帮你结构化表达、优化措辞、匹配岗位，还能模拟真实面试。
            </p>

            {/* CTA Cards */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto border border-white/20">
              {/* Tab Switcher */}
              <div className="flex justify-center gap-2 mb-6 flex-wrap" role="tablist">
                {[
                  { id: 'text', label: '直接输入', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
                  { id: 'file', label: '上传文件', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { id: 'guided', label: '引导式', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all bg-white/10 hover:bg-white text-white hover:text-gray-900 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} /></svg>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="text-left">
                <textarea
                  placeholder={"在这里粘贴你的经历...\n\n示例：我在一家互联网公司做了两年运营工作，负责公众号内容，写了100多篇文章，粉丝涨到了5万..."}
                  rows={6}
                  className="w-full p-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-400 bg-white mb-4"
                />
                <div className="flex justify-center">
                  <a href="/resume/new?mode=text" className="inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors no-underline">
                    生成简历 &rarr;
                  </a>
                </div>
              </div>
            </div>

            <p className="mt-8 text-sm text-blue-200/70">
              已帮助 1,000+ 用户优化简历 · 平均提升面试通过率 35%
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">三步完成求职闭环</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">从混乱的经历到能拿offer的表达，AI全程陪伴你</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">经历 → 简历</h3>
              <ul className="space-y-2 text-gray-600 text-sm list-disc pl-5">
                <li>输入零散经历（文本 / 文件 / 引导式）</li>
                <li>AI自动STAR结构化重组</li>
                <li>量化成果、专业措辞</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">JD → 优化版</h3>
              <ul className="space-y-2 text-gray-600 text-sm list-disc pl-5">
                <li>粘贴目标岗位JD</li>
                <li>智能匹配度分析（技能 / 经验 / 表达）</li>
                <li>一键生成针对性优化版本</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">简历 → 面试能力</h3>
              <ul className="space-y-2 text-gray-600 text-sm list-disc pl-5">
                <li>AI生成个性化面试问题</li>
                <li>真实对话式模拟训练</li>
                <li>即时评分反馈 + 能力雷达图</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
