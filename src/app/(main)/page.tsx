'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type InputMode = 'text' | 'file' | 'guided'

const TABS = [
  {
    id: 'text' as InputMode,
    label: '直接输入',
    icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  },
  {
    id: 'file' as InputMode,
    label: '上传文件',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    id: 'guided' as InputMode,
    label: '引导式',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
]

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.txt,.md,.json'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<InputMode>('text')
  const [textContent, setTextContent] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [guidedStep, setGuidedStep] = useState(0)
  const [guidedData, setGuidedData] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // File handling
  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      alert('文件大小不能超过 10MB')
      return
    }
    setUploadedFile(file)
    setActiveTab('file')
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      handleFileSelect(e.dataTransfer.files[0])
    },
    [handleFileSelect]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => setDragOver(false)

  // Navigate to resume generation
  const handleGenerateResume = () => {
    if (activeTab === 'text') {
      router.push(`/resume/new?mode=text&content=${encodeURIComponent(textContent)}`)
    } else if (activeTab === 'file' && uploadedFile) {
      router.push(`/resume/new?mode=file&filename=${encodeURIComponent(uploadedFile.name)}`)
    } else if (activeTab === 'guided') {
      router.push(`/resume/new?mode=guided&data=${encodeURIComponent(JSON.stringify(guidedData))}`)
    }
  }

  // Guided mode steps
  const GUIDED_STEPS = [
    { key: 'name', label: '你的名字', placeholder: '张三', type: 'text' as const },
    { key: 'targetRole', label: '目标岗位', placeholder: '前端开发工程师 / 产品经理 / 市场运营...', type: 'text' as const },
    { key: 'experience', label: '工作/实习经历', placeholder: '2023.06-至今 在XX公司担任XX职位，负责XX工作...', type: 'textarea' as const },
    { key: 'education', label: '教育背景', placeholder: '2020-2024 XX大学 XX专业 本科', type: 'textarea' as const },
    { key: 'skills', label: '核心技能', placeholder: 'React, TypeScript, Node.js, 数据分析...', type: 'text' as const },
    { key: 'projects', label: '项目经历（可选）', placeholder: '独立完成了XX项目，实现了XX功能...', type: 'textarea' as const },
  ]

  const currentStep = GUIDED_STEPS[guidedStep]
  const canProceedToGenerate = activeTab === 'text'
    ? textContent.trim().length > 10
    : activeTab === 'file'
      ? !!uploadedFile
      : guidedStep >= GUIDED_STEPS.length

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
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/10 hover:bg-white text-white hover:text-gray-900'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content: Text Mode */}
              {activeTab === 'text' && (
                <div role="tabpanel">
                  <textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder={
                      "在这里粘贴你的经历...\n\n示例：我在一家互联网公司做了两年运营工作，负责公众号内容，写了100多篇文章，粉丝涨到了5万..."
                    }
                    rows={6}
                    className="w-full p-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-400 bg-white mb-4"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-200">
                      {textContent.length > 0 ? `${textContent.length} 字符` : ''}
                    </span>
                    <button
                      onClick={() => setTextContent('')}
                      className="text-xs text-blue-200 hover:text-white transition-colors cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content: File Upload Mode */}
              {activeTab === 'file' && (
                <div role="tabpanel">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="选择文件"
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-white bg-white/20 scale-[1.02]'
                        : uploadedFile
                          ? 'border-green-300 bg-green-50/20'
                          : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                    }`}
                  >
                    {uploadedFile ? (
                      <div className="space-y-3">
                        <svg className="w-12 h-12 mx-auto text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-medium text-white">{uploadedFile.name}</p>
                        <p className="text-sm text-blue-200">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedFile(null)
                          }}
                          className="text-sm text-red-300 hover:text-red-200 transition-colors"
                        >
                          移除文件
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg className="w-12 h-12 mx-auto text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="font-medium text-white">点击或拖拽文件到此处</p>
                        <p className="text-sm text-blue-200">
                          支持 PDF, DOC, DOCX, TXT, MD, JSON · 最大 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Guided Mode */}
              {activeTab === 'guided' && (
                <div role="tabpanel" className="space-y-4">
                  {/* Progress indicator */}
                  <div className="flex gap-1 mb-4">
                    {GUIDED_STEPS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          idx < guidedStep
                            ? 'bg-white'
                            : idx === guidedStep
                              ? 'bg-white/80'
                              : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>

                  {guidedStep < GUIDED_STEPS.length ? (
                    <>
                      <label className="block text-left text-sm font-medium text-blue-100 mb-1">
                        步骤 {guidedStep + 1}/{GUIDED_STEPS.length}: {currentStep.label}
                      </label>
                      {currentStep.type === 'textarea' ? (
                        <textarea
                          value={guidedData[currentStep.key] || ''}
                          onChange={(e) =>
                            setGuidedData({ ...guidedData, [currentStep.key]: e.target.value })
                          }
                          placeholder={currentStep.placeholder}
                          rows={4}
                          className="w-full p-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                      ) : (
                        <input
                          type="text"
                          value={guidedData[currentStep.key] || ''}
                          onChange={(e) =>
                            setGuidedData({ ...guidedData, [currentStep.key]: e.target.value })
                          }
                          placeholder={currentStep.placeholder}
                          className="w-full p-4 rounded-xl border-0 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                      )}
                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))}
                          disabled={guidedStep === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            guidedStep === 0
                              ? 'opacity-40 cursor-not-allowed'
                              : 'text-white hover:bg-white/10 cursor-pointer'
                          }`}
                        >
                          上一步
                        </button>
                        <button
                          onClick={() =>
                            guidedData[currentStep.key]?.trim() &&
                            setGuidedStep(GUIDED_STEPS.length - 1)
                              ? setGuidedStep(guidedStep + 1)
                              : null
                          }
                          disabled={!guidedData[currentStep.key]?.trim()}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            !guidedData[currentStep.key]?.trim()
                              ? 'opacity-40 cursor-not-allowed'
                              : 'bg-white text-gray-900 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          下一步
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 space-y-2">
                      <svg className="w-10 h-10 mx-auto text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="font-medium text-white">所有信息已填写完成!</p>
                      <button
                        onClick={() => {
                          setGuidedStep(0)
                          setGuidedData({})
                        }}
                        className="text-sm text-blue-200 hover:text-white transition-colors cursor-pointer"
                      >
                        重新填写
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={handleGenerateResume}
                  disabled={!canProceedToGenerate}
                  className={`inline-flex items-center px-8 py-3 font-semibold rounded-lg transition-all no-underline ${
                    canProceedToGenerate
                      ? 'bg-blue-500 hover:bg-blue-400 text-white cursor-pointer shadow-lg hover:shadow-xl'
                      : 'bg-gray-500/50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  生成简历 &rarr;
                </button>
              </div>
            </div>

            <p className="mt-8 text-sm text-blue-200/70">
              已帮助 1,000+ 用户优化简历 &middot; 平均提升面试通过率 35%
            </p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">三步完成求职闭环</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              从混乱的经历到能拿offer的表达，AI全程陪伴你
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
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
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
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
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
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
