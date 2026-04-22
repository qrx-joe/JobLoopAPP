'use client'

import { useState, useEffect } from 'react'
import { useResume } from '@/hooks/useResume'
import type { ResumeContent } from '@/types/resume'

const GUIDED_STEPS = [
  { key: 'latest_experience', question: '最近一段经历是什么？（工作/实习/项目/校园）', placeholder: '例如：在XX公司做新媒体运营...' },
  { key: 'responsibility', question: '你在其中承担了什么职责？', placeholder: '例如：负责公众号的内容策划和运营...' },
  { key: 'actions', question: '你做了哪些具体的事情？', placeholder: '例如：每周产出3篇原创文章，建立了选题库...' },
  { key: 'results', question: '结果如何？有什么可量化的成果？', placeholder: '例如：粉丝从0增长到5万，阅读率提升了40%...' },
]

export default function NewResumePage() {
  const {
    content,
    isGenerating,
    error,
    inputMode,
    rawInput,
    setRawInput,
    setInputMode,
    generateResume,
    setContent,
  } = useResume()

  const [currentStep, setCurrentStep] = useState(0)
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({})

  // Load draft on mount
  useEffect(() => {
    if (!content && !isGenerating) {
      // Check for existing draft
      try {
        const savedDraft = localStorage.getItem('jobloop_resume_draft')
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft)
          if (parsed?.content) setContent(parsed.content)
        }
      } catch {}
    }
  }, [])

  const handleGenerate = async () => {
    try {
      await generateResume({
        userInput: rawInput,
        inputMode,
        guidedAnswers,
      })
    } catch {
      // Error handled in hook
    }
  }

  const handleGuidedNext = () => {
    if (currentStep < GUIDED_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // All steps done, generate resume
      const combinedInput = Object.values(guidedAnswers).join('\n')
      setRawInput(combinedInput)
      handleGenerate()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">创建简历</h1>
        <p className="text-gray-600 mt-1">选择一种方式开始你的简历</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'text' as const, label: '自由输入' },
          { id: 'guided' as const, label: '引导式' },
          { id: 'file' as const, label: '上传文件' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setInputMode(mode.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputMode === mode.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input Panel */}
        <div className="bg-white rounded-xl border p-6">
          {inputMode === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入你的经历
              </label>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`粘贴你的经历信息...\n\n示例：我在XX公司做了两年运营，主要负责公众号内容运营。期间写了100多篇文章，粉丝从0增长到了5万。还做过一个用户增长的项目，通过活动策划拉新了2000多个用户。`}
                className="w-full h-96 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !rawInput.trim()}
                className="mt-4 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? '⏳ 正在生成...' : '🚀 生成简历'}
              </button>
            </div>
          )}

          {inputMode === 'guided' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">
                  步骤 {currentStep + 1} / {GUIDED_STEPS.length}
                </span>
                <div className="flex gap-1">
                  {GUIDED_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {GUIDED_STEPS[currentStep].question}
              </h3>
              
              <textarea
                value={guidedAnswers[GUIDED_STEPS[currentStep].key] || ''}
                onChange={(e) =>
                  setGuidedAnswers({
                    ...guidedAnswers,
                    [GUIDED_STEPS[currentStep].key]: e.target.value,
                  })
                }
                placeholder={GUIDED_STEPS[currentStep].placeholder}
                className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex justify-between mt-4">
                {currentStep > 0 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-6 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                  >
                    上一步
                  </button>
                ) : (
                  <div />
                )}
                
                <button
                  onClick={handleGuidedNext}
                  disabled={!guidedAnswers[GUIDED_STEPS[currentStep].key]?.trim() || isGenerating}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  {currentStep === GUIDED_STEPS.length - 1 ? '完成并生成' : '下一步'}
                </button>
              </div>
            </div>
          )}

          {inputMode === 'file' && (
            <div className="py-16 text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-blue-400 transition-colors">
                <p className="text-4xl mb-4">📄</p>
                <p className="font-medium text-gray-900 mb-2">
                  点击上传或拖拽文件到此处
                </p>
                <p className="text-sm text-gray-500">
                  支持 PDF (.pdf)、Word (.docx) 格式
                </p>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // TODO: Implement file parsing API call
                      console.log('File selected:', file.name)
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">简历预览</h3>
            {content && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                已生成
              </span>
            )}
          </div>

          {content ? (
            <div className="space-y-6">
              {/* Experience Items */}
              {content.experienceItems.map((item, index) => (
                <div key={item.id} className="border-b pb-4 last:border-0">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  {item.role && (
                    <p className="text-sm text-gray-600 mb-2">{item.role}</p>
                  )}
                  
                  <ul className="space-y-1">
                    {item.achievements.map((achievement, i) => (
                      <li key={i} className="text-sm text-gray-700 pl-4 relative before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-blue-500 before:rounded-full">
                        {achievement}
                      </li>
                    ))}
                  </ul>

                  {/* Skill Tags */}
                  {content.skillTags.length > 0 && index === 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">技能标签</p>
                      <div className="flex flex-wrap gap-2">
                        {content.skillTags.map((tag) => (
                          <span
                            key={tag.name}
                            className={`px-2 py-1 text-xs rounded-full ${
                              tag.confidence === 'high'
                                ? 'bg-blue-100 text-blue-700'
                                : tag.confidence === 'medium'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {tag.name} ({tag.confidence})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Suggestions */}
              {content.rawSuggestions && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  💡 {content.rawSuggestions}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  📥 导出PDF
                </button>
                <button className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                  🎯 JD优化 →
                </button>
                <button className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                  🎤 面试模拟 →
                </button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" />
              <p className="mt-4 text-gray-600">AI正在分析你的经历...</p>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <p className="text-4xl mb-4">📋</p>
              <p>左侧输入经历后，这里会显示生成的简历</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
