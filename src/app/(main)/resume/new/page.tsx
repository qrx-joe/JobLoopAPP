'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const GUIDED_STEPS = [
  {
    key: 'latest_experience',
    question: '最近一段经历是什么？（工作/实习/项目/校园）',
    placeholder: '例如：在XX公司做新媒体运营...',
  },
  {
    key: 'responsibility',
    question: '你在其中承担了什么职责？',
    placeholder: '例如：负责公众号的内容策划和运营...',
  },
  {
    key: 'actions',
    question: '你做了哪些具体的事情？',
    placeholder: '例如：每周产出3篇原创文章，建立了选题库...',
  },
  {
    key: 'results',
    question: '结果如何？有什么可量化的成果？',
    placeholder: '例如：粉丝从0增长到5万，阅读率提升了40%...',
  },
];

export default function NewResumePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'guided' | 'file'>('text');
  const [rawInput, setRawInput] = useState('');
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [guidedAnswers, setGuidedAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Parse URL params
    const mode = searchParams.get('mode');
    const content = searchParams.get('content');
    const filenames = searchParams.get('filenames') || searchParams.get('filename');

    if (mode === 'text' && content) {
      setRawInput(decodeURIComponent(content));
      setActiveTab('text');
    } else if (mode === 'file' && filenames) {
      setActiveTab('file');
      // Display file info in raw input area as hint
      const names = decodeURIComponent(filenames);
      setRawInput(`[待解析文件: ${names}]\n\n请等待文件上传功能完成，或直接在下方输入经历内容...`);
    } else if (mode === 'guided') {
      const dataStr = searchParams.get('data');
      if (dataStr) {
        try {
          setGuidedAnswers(JSON.parse(decodeURIComponent(dataStr)));
          setActiveTab('guided');
        } catch {
          /* ignore */
        }
      }
    }
  }, [searchParams]);

  if (!mounted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">创建简历</h1>
          <p className="mt-1 text-gray-600">加载中...</p>
        </div>
        <div className="py-20 text-center text-gray-400">
          <p>正在初始化页面...</p>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: rawInput,
          inputMode: activeTab,
          guidedAnswers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(JSON.stringify(data.data?.content || data.content || {}, null, 2));
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `生成失败 (${response.status})`);
      }
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGuidedNext = () => {
    if (currentStep < GUIDED_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const combinedInput = Object.values(guidedAnswers).join('\n');
      setRawInput(combinedInput);
      setActiveTab('text');
    }
  };

  // Export resume as DOCX file
  const handleExport = async () => {
    if (!generatedContent) return;
    setIsExporting(true);

    try {
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(generatedContent);
      } catch {
        setError('导出失败：内容格式异常，请重新生成');
        return;
      }

      const response = await fetch('/api/resume/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format: 'docx' }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `导出失败 (${response.status})`);
      }

      // Trigger download from blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">创建简历</h1>
        <p className="mt-1 text-gray-600">选择一种方式开始你的简历</p>
      </div>

      {/* Mode Selector */}
      <div className="mb-8 flex flex-wrap gap-2" role="tablist">
        {[
          { id: 'text' as const, label: '自由输入' },
          { id: 'guided' as const, label: '引导式' },
          { id: 'file' as const, label: '上传文件' },
        ].map((mode) => (
          <button
            key={mode.id}
            type="button"
            role="tab"
            aria-selected={activeTab === mode.id}
            onClick={() => setActiveTab(mode.id)}
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              activeTab === mode.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Input Panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-6" role="tabpanel">
          {activeTab === 'text' && (
            <div>
              <label
                htmlFor="resume-input"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                输入你的经历
              </label>
              <textarea
                id="resume-input"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={
                  '粘贴你的经历信息...\n\n示例：我在XX公司做了两年运营，主要负责公众号内容运营。期间写了100多篇文章，粉丝从0增长到了5万。还做过一个用户增长的项目...'
                }
                rows={14}
                className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !rawInput.trim()}
                className="mt-4 w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isGenerating ? '正在生成...' : '生成简历'}
              </button>
            </div>
          )}

          {activeTab === 'guided' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  步骤 {currentStep + 1} / {GUIDED_STEPS.length}
                </span>
                <div
                  className="flex gap-1.5"
                  role="progressbar"
                  aria-label={`步骤 ${currentStep + 1} of ${GUIDED_STEPS.length}`}
                >
                  {GUIDED_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 w-2.5 rounded-full transition-colors ${
                        i <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-current={i === currentStep ? 'step' : undefined}
                    />
                  ))}
                </div>
              </div>

              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {GUIDED_STEPS[currentStep].question}
              </h3>

              <textarea
                id={`guided-step-${currentStep}`}
                value={guidedAnswers[GUIDED_STEPS[currentStep].key] || ''}
                onChange={(e) =>
                  setGuidedAnswers({
                    ...guidedAnswers,
                    [GUIDED_STEPS[currentStep].key]: e.target.value,
                  })
                }
                placeholder={GUIDED_STEPS[currentStep].placeholder}
                rows={10}
                className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:ring-2 focus:ring-blue-500"
              />

              <div className="mt-4 flex justify-between">
                {currentStep > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="cursor-pointer rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    上一步
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleGuidedNext}
                  disabled={!guidedAnswers[GUIDED_STEPS[currentStep].key]?.trim() || isGenerating}
                  className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {currentStep === GUIDED_STEPS.length - 1 ? '完成并生成' : '下一步'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="py-8">
              <div
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
                onClick={() => document.getElementById('multi-file-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const files = Array.from(e.dataTransfer.files).filter(
                    (f) => /\.(pdf|doc|docx|txt|md)$/i.test(f.name) && f.size <= 10 * 1024 * 1024
                  );
                  if (files.length > 0) {
                    setUploadedFiles((prev) => [...prev, ...files].slice(0, 5));
                    setRawInput('');
                  }
                }}
              >
                <input
                  id="multi-file-input"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      const newFiles = Array.from(e.target.files).filter(
                        (f) => f.size <= 10 * 1024 * 1024
                      );
                      setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
                      setRawInput('');
                      e.target.value = '';
                    }
                  }}
                />
                <span className="mb-4 block text-4xl">&#x1F4C4;</span>
                <p className="mb-2 font-medium text-gray-900">点击或拖拽上传多个文件</p>
                <p className="mb-3 text-sm text-gray-500">
                  支持 PDF, DOC, DOCX, TXT, MD · 最多 5 个文件 · 单个最大 10MB
                </p>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      已选择 {uploadedFiles.length} / 5 个文件
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFiles([]);
                        setRawInput('');
                      }}
                      className="cursor-pointer text-xs text-red-500 hover:text-red-700"
                    >
                      清空全部
                    </button>
                  </div>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-lg">&#x1F4C4;</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="ml-3 shrink-0 cursor-pointer text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Hint */}
              {uploadedFiles.length > 0 && (
                <>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p>
                        提示：已选择 {uploadedFiles.length} 个文件，点击下方按钮开始解析并生成简历。
                      </p>
                      <button
                        onClick={() => setActiveTab('text')}
                        className="mt-1 font-medium text-blue-600 underline"
                      >
                        或切换到自由输入 →
                      </button>
                    </div>
                  </div>

                  {/* Generate button for file mode */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (uploadedFiles.length === 0) return;
                      setIsGenerating(true);
                      setError(null);

                      try {
                        const formData = new FormData();
                        uploadedFiles.forEach((f) => formData.append('files', f));

                        const res = await fetch('/api/resume/generate', {
                          method: 'POST',
                          body: formData,
                        });

                        if (res.ok) {
                          const data = await res.json();
                          setGeneratedContent(
                            JSON.stringify(data.data?.content || data.content || {}, null, 2)
                          );
                        } else {
                          const errData = await res.json().catch(() => ({}));
                          setError(errData.error || `生成失败 (${res.status})`);
                        }
                      } catch {
                        setError('网络错误，请检查连接后重试');
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating || uploadedFiles.length === 0}
                    className="mt-4 w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isGenerating
                      ? '正在解析文件...'
                      : `解析 ${uploadedFiles.length} 个文件并生成简历`}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <strong>警告：</strong> {error}
            </div>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">简历预览</h3>
            {generatedContent && (
              <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-600">
                已生成
              </span>
            )}
          </div>

          {generatedContent ? (
            <div className="space-y-4">
              <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700">
                {generatedContent}
              </pre>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="min-w-[120px] flex-1 cursor-pointer rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isExporting ? '正在导出...' : '📄 导出Word'}
                </button>
                <button
                  type="button"
                  className="min-w-[120px] flex-1 cursor-pointer rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  JD优化 &rarr;
                </button>
                <button
                  type="button"
                  className="min-w-[120px] flex-1 cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  面试模拟 &rarr;
                </button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="py-20 text-center">
              <div
                className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
                role="status"
                aria-label="加载中"
              />
              <p className="mt-4 text-gray-600">AI正在分析你的经历...</p>
            </div>
          ) : (
            <div className="py-20 text-center text-gray-400">
              <span className="mb-4 block text-4xl">&#x1F4CB;</span>
              <p>左侧输入经历后，这里会显示生成的简历</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
