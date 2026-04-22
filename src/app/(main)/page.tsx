'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useResumeStore } from '@/stores/resumeStore'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'guided'>('text')
  const { rawInput, setRawInput, inputMode, setInputMode } = useResumeStore()

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              把你的经历变成
              <span className="block text-blue-200">能拿offer的简历</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              告别&quot;不会写简历&quot;的困扰。输入你的经历，AI帮你结构化表达、优化措辞、匹配岗位，还能模拟真实面试。
            </p>
            
            {/* CTA Tabs */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-3xl mx-auto">
              {/* Tab Switcher */}
              <div className="flex justify-center gap-2 mb-6">
                {[
                  { id: 'text' as const, label: '直接输入经历', icon: '📝' },
                  { id: 'file' as const, label: '上传简历文件', icon: '📄' },
                  { id: 'guided' as const, label: '引导式创建', icon: '✨' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-700 shadow-lg'
                        : 'text-blue-100 hover:bg-white/10'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Area */}
              {activeTab === 'text' && (
                <div>
                  <textarea
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    placeholder="在这里粘贴你的经历... 例如：&#10;我在一家互联网公司做了两年运营工作，负责公众号内容，写了100多篇文章，粉丝涨到了5万..."
                    className="w-full h-40 p-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  />
                  <Link
                    href="/resume/new"
                    onClick={() => setInputMode('text')}
                    className="mt-4 inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    生成简历 →
                  </Link>
                </div>
              )}

              {activeTab === 'file' && (
                <div className="py-12 text-center">
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-12 cursor-pointer hover:border-white/60 transition-colors">
                    <p className="text-2xl mb-2">📄</p>
                    <p className="font-medium mb-1">点击或拖拽上传</p>
                    <p className="text-sm text-blue-200">支持 PDF、Word (.docx) 格式</p>
                  </div>
                  <Link 
                    href="/resume/new" 
                    onClick={() => setInputMode('file')}
                    className="mt-4 inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    上传并解析 →
                  </Link>
                </div>
              )}

              {activeTab === 'guided' && (
                <div className="py-12 text-center">
                  <p className="text-2xl mb-2">✨</p>
                  <p className="font-medium mb-1">不知道怎么写？</p>
                  <p className="text-sm text-blue-200">跟着引导一步步填写，AI帮你组织语言</p>
                  <Link 
                    href="/resume/new" 
                    onClick={() => setInputMode('guided')}
                    className="mt-4 inline-flex items-center px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                  >
                    开始引导 →
                  </Link>
                </div>
              )}
            </div>

            {/* Social Proof */}
            <p className="mt-8 text-sm text-blue-200/80">
              已帮助 1,000+ 用户优化简历 · 平均提升面试通过率 35%
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              三步完成求职闭环
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              从混乱的经历到能拿offer的表达，AI全程陪伴你
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">经历 → 简历</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 输入零散经历（文本/文件/引导式）</li>
                <li>• AI自动STAR结构化重组</li>
                <li>• 量化成果、专业措辞</li>
                <li>• 实时预览 + 可编辑修改</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">JD → 优化版</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• 粘贴目标岗位JD</li>
                <li>• 智能匹配度分析（技能/经验/表达）</li>
                <li>• 一键生成针对性优化版本</li>
                <li>• 展示每处修改的原因</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="group p-8 rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">简历 → 面试能力</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• AI生成个性化面试问题</li>
                <li>• 真实对话式模拟训练</li>
                <li>• 三维追问机制（深度/质疑/场景）</li>
                <li>• 即时评分反馈 + 能力雷达图</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
