'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  saveResumeDraft,
  getResumeDraft,
  clearResumeDraft,
  saveGeneratedResume,
  getGeneratedResume,
} from '@/lib/storage';

// Unified guided steps — aligned with homepage
const GUIDED_STEPS = [
  {
    key: 'name',
    question: '你的名字是什么？（用于简历抬头）',
    placeholder: '张三',
  },
  {
    key: 'target_role',
    question: '你的目标岗位是什么？',
    placeholder: '前端开发工程师 / 产品经理 / 数据分析师...',
  },
  {
    key: 'experience',
    question: '描述你最近的一段工作/实习经历',
    placeholder: '2023.06-至今 在XX公司担任XX职位，负责XX工作。期间完成了XX项目，实现了XX成果...',
  },
  {
    key: 'education',
    question: '你的教育背景？',
    placeholder: '2020-2024 XX大学 XX专业 本科 · 主修课程/绩点/荣誉...',
  },
  {
    key: 'skills',
    question: '你的核心技能和工具？',
    placeholder: 'React, TypeScript, Node.js, Python, Figma, 数据分析...',
  },
  {
    key: 'projects',
    question: '有代表性的项目经历？（可选）',
    placeholder: '独立完成了XX项目，负责XX模块，使用XX技术栈，实现了XX功能...',
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
  const [isParsing, setIsParsing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const router = useRouter();

  // --- Parse uploaded files (auto-triggered when files change) ---
  const handleParseFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `文件解析失败 (${res.status})`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || '解析失败');

      // Fill rawInput with parsed text; if existing text exists, append
      const parsedText = data.parsedText || '';
      setRawInput((prev) => {
        if (prev.trim()) return `${prev}\n\n${parsedText}`;
        return parsedText;
      });

      // Auto-switch to text tab so user can edit the parsed result
      setActiveTab('text');
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败，请重试');
    } finally {
      setIsParsing(false);
    }
  }, []);

  // Auto-parse whenever uploadedFiles change and have new files
  useEffect(() => {
    if (uploadedFiles.length > 0 && !isParsing) {
      // Small delay to ensure all files are collected
      const timer = setTimeout(() => handleParseFiles(uploadedFiles), 300);
      return () => clearTimeout(timer);
    }
  }, [uploadedFiles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Generate resume (unified) ---
  const handleGenerate = async () => {
    if (!rawInput.trim()) return;
    setIsGenerating(true);
    setError(null);

    // Save draft before generating (auto-save)
    saveResumeDraft({
      rawInput,
      inputMode: activeTab,
      guidedAnswers,
    });

    try {
      // Always send as JSON with the current rawInput text
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
        const contentStr = JSON.stringify(data.data?.content || data.content || {}, null, 2);
        setGeneratedContent(contentStr);

        // Save generated content for JD/Interview pages
        saveGeneratedResume({ content: contentStr, generatedAt: Date.now() });
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

  // --- Guided mode ---
  const handleGuidedNext = () => {
    if (currentStep < GUIDED_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const combinedInput = Object.values(guidedAnswers).join('\n');
      setRawInput(combinedInput);
      setActiveTab('text');
    }
  };

  // --- Export DOCX ---
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

  // --- Restore / Init ---
  useEffect(() => {
    setMounted(true);

    // Priority 1: URL params (from homepage)
    const mode = searchParams.get('mode');
    const content = searchParams.get('content');
    const filenames = searchParams.get('filenames') || searchParams.get('filename');

    if (mode === 'text' && content) {
      setRawInput(decodeURIComponent(content));
      setActiveTab('text');
    } else if (mode === 'file' && filenames) {
      setActiveTab('file');
      setRawInput(
        `[待解析文件: ${decodeURIComponent(filenames)}]\n\n请上传文件后自动解析，或切换到自由输入模式手动粘贴...`
      );
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
    } else {
      // Priority 2: localStorage draft
      const draft = getResumeDraft();
      if (draft && draft.rawInput) {
        setRawInput(draft.rawInput);
        setActiveTab(draft.inputMode || 'text');
        if (Object.keys(draft.guidedAnswers || {}).length > 0) {
          setGuidedAnswers(draft.guidedAnswers);
        }
      }

      // Priority 3: restore generated resume if exists
      const generated = getGeneratedResume();
      if (generated?.content) {
        setGeneratedContent(generated.content);
      }
    }
  }, [searchParams]);

  // --- Auto-save draft on input change (debounced via state) ---
  useEffect(() => {
    if (!mounted || !rawInput.trim()) return;
    const timer = setTimeout(() => {
      saveResumeDraft({ rawInput, inputMode: activeTab, guidedAnswers });
    }, 1000); // debounce 1s
    return () => clearTimeout(timer);
  }, [rawInput, guidedAnswers, activeTab, mounted]);

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
          {/* ===== TEXT TAB ===== */}
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
              {/* Source indicator */}
              {uploadedFiles.length > 0 && (
                <p className="mt-1 text-xs text-blue-500">
                  💡 已从 {uploadedFiles.length} 个文件提取内容（可在上方编辑修改）
                </p>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !rawInput.trim()}
                className="mt-4 w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isGenerating ? '正在生成...' : '✨ 生成简历'}
              </button>
              {/* Also show quick file upload under text area */}
              {uploadedFiles.length === 0 && (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600">
                  <span>📎 补充上传文件</span>
                  <input
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
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              )}
              {/* Parse status indicator when files are added from text tab */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                  {isParsing ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                      <span className="text-sm text-blue-700">
                        正在解析 {uploadedFiles.length} 个文件...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-blue-700">
                        ✅ 已解析 {uploadedFiles.length} 个文件，内容已填充到上方编辑区
                      </span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles([])}
                        className="ml-auto cursor-pointer text-xs text-red-500 hover:text-red-700"
                      >
                        清除文件
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== GUIDED TAB ===== */}
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

          {/* ===== FILE UPLOAD TAB ===== */}
          {activeTab === 'file' && (
            <div className="py-8">
              {/* Drop zone */}
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

              {/* File list */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      已选择 {uploadedFiles.length} / 5 个文件
                    </span>
                    <button
                      type="button"
                      onClick={() => setUploadedFiles([])}
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

                  {/* Auto-parse status */}
                  <div className="mt-3 rounded-lg bg-blue-50 p-4 text-center">
                    {isParsing ? (
                      <>
                        <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent align-middle" />
                        <span className="text-sm font-medium text-blue-700">
                          正在解析 {uploadedFiles.length} 个文件...
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-blue-700">
                          ✅ 已选择 {uploadedFiles.length} 个文件，正在自动解析...
                        </span>
                        <p className="mt-1 text-xs text-gray-500">解析完成后会自动跳转到编辑区</p>
                      </>
                    )}
                  </div>
                </div>
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
                  onClick={() => {
                    // Carry generated resume content + raw input to JD page via localStorage
                    if (generatedContent) {
                      saveGeneratedResume({ content: generatedContent, generatedAt: Date.now() });
                    }
                    saveResumeDraft({ rawInput, inputMode: activeTab, guidedAnswers });
                    router.push('/jd');
                  }}
                  className="min-w-[120px] flex-1 cursor-pointer rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  JD优化 &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Carry generated resume content + raw input to Interview page
                    if (generatedContent) {
                      saveGeneratedResume({ content: generatedContent, generatedAt: Date.now() });
                    }
                    saveResumeDraft({ rawInput, inputMode: activeTab, guidedAnswers });
                    router.push('/interview');
                  }}
                  className="min-w-[120px] flex-1 cursor-pointer rounded-lg bg-purple-600 py-2.5 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  面试模拟 &rarr;
                </button>
              </div>

              {/* AI Content Disclaimer */}
              <p className="text-center text-xs text-gray-400">
                本内容由AI辅助生成，请核实后使用 · Powered by JobLoop AI
              </p>
            </div>
          ) : isGenerating || isParsing ? (
            <div className="py-20 text-center">
              <div
                className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
                role="status"
                aria-label="加载中"
              />
              <p className="mt-4 text-gray-600">
                {isParsing ? '正在解析文件内容...' : 'AI正在分析你的经历...'}
              </p>
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
