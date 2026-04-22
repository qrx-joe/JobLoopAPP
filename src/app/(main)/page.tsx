'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveResumeDraft } from '@/lib/storage';

type InputMode = 'text' | 'file' | 'guided';

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
];

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.txt,.md,.json';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 5; // max number of files allowed

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<InputMode>('text');
  const [textContent, setTextContent] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedData, setGuidedData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // File handling (multi-file support)
  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newFiles = Array.from(files).filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name} 超过 10MB 限制，已跳过`);
          return false;
        }
        // Avoid duplicates
        return !uploadedFiles.some((f) => f.name === file.name && f.size === file.size);
      });

      if (newFiles.length === 0) return;

      setUploadedFiles((prev) => {
        const updated = [...prev, ...newFiles];
        // Limit to MAX_FILES
        if (updated.length > MAX_FILES) {
          alert(`最多上传 ${MAX_FILES} 个文件，已保留前 ${MAX_FILES} 个`);
          return updated.slice(0, MAX_FILES);
        }
        return updated;
      });
      setActiveTab('file');
    },
    [uploadedFiles]
  );

  const removeFile = useCallback((index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileSelect = useCallback(
    (file: File | null) => {
      if (!file) return;
      addFiles([file]);
    },
    [addFiles]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  // Navigate to resume generation — use localStorage to avoid URL length limits
  const handleGenerateResume = () => {
    if (activeTab === 'text') {
      // Save text content to localStorage, then navigate
      saveResumeDraft({
        rawInput: textContent,
        inputMode: 'text',
        guidedAnswers: {},
      });
      router.push('/resume/new?mode=text');
    } else if (activeTab === 'file' && uploadedFiles.length > 0) {
      router.push(`/resume/new?mode=file`);
    } else if (activeTab === 'guided') {
      // Save guided answers to localStorage, then navigate
      saveResumeDraft({
        rawInput: Object.values(guidedData).join('\n'),
        inputMode: 'guided',
        guidedAnswers: guidedData,
      });
      router.push('/resume/new?mode=guided');
    }
  };

  // Guided mode steps
  const GUIDED_STEPS = [
    { key: 'name', label: '你的名字', placeholder: '张三', type: 'text' as const },
    {
      key: 'target_role',
      label: '目标岗位',
      placeholder: '前端开发工程师 / 产品经理 / 市场运营...',
      type: 'text' as const,
    },
    {
      key: 'experience',
      label: '工作/实习经历',
      placeholder: '2023.06-至今 在XX公司担任XX职位，负责XX工作...',
      type: 'textarea' as const,
    },
    {
      key: 'education',
      label: '教育背景',
      placeholder: '2020-2024 XX大学 XX专业 本科',
      type: 'textarea' as const,
    },
    {
      key: 'skills',
      label: '核心技能',
      placeholder: 'React, TypeScript, Node.js, 数据分析...',
      type: 'text' as const,
    },
    {
      key: 'projects',
      label: '项目经历（可选）',
      placeholder: '独立完成了XX项目，实现了XX功能...',
      type: 'textarea' as const,
    },
  ];

  const currentStep = GUIDED_STEPS[guidedStep];
  const canProceedToGenerate =
    activeTab === 'text'
      ? textContent.trim().length > 10
      : activeTab === 'file'
        ? uploadedFiles.length > 0
        : guidedStep >= GUIDED_STEPS.length;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              把你的经历变成
              <br />
              <span className="text-blue-200">能拿offer的简历</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-blue-100 sm:text-xl">
              告别&quot;不会写简历&quot;的困扰。输入你的经历，AI帮你结构化表达、优化措辞、匹配岗位，还能模拟真实面试。
            </p>

            {/* CTA Cards */}
            <div className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-white/15 p-6 backdrop-blur-sm">
              {/* Tab Switcher */}
              <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white hover:text-gray-900'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={tab.icon}
                      />
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
                      '在这里粘贴你的经历...\n\n示例：我在一家互联网公司做了两年运营工作，负责公众号内容，写了100多篇文章，粉丝涨到了5万...'
                    }
                    rows={6}
                    className="mb-4 w-full resize-none rounded-xl border-0 bg-white p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-200">
                      {textContent.length > 0 ? `${textContent.length} 字符` : ''}
                    </span>
                    <button
                      onClick={() => setTextContent('')}
                      className="cursor-pointer text-xs text-blue-200 transition-colors hover:text-white"
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
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="选择文件"
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                      dragOver
                        ? 'scale-[1.02] border-white bg-white/20'
                        : uploadedFiles.length > 0
                          ? 'border-green-300 bg-green-50/20'
                          : 'border-white/30 bg-white/5 hover:border-white/50 hover:bg-white/10'
                    }`}
                  >
                    {uploadedFiles.length > 0 ? (
                      <div className="space-y-3">
                        <svg
                          className="mx-auto h-10 w-10 text-green-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p className="text-sm font-medium text-white">
                          已选择 {uploadedFiles.length}/{MAX_FILES} 个文件
                        </p>

                        {/* File list */}
                        <ul className="max-h-[200px] space-y-2 overflow-auto px-4 text-left">
                          {uploadedFiles.map((file, index) => (
                            <li
                              key={`${file.name}-${index}`}
                              className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs"
                            >
                              <span className="mr-2 flex-1 truncate text-white">{file.name}</span>
                              <span className="mr-2 whitespace-nowrap text-blue-200">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(index);
                                }}
                                className="font-bold text-red-300 transition-colors hover:text-red-200"
                                aria-label={`移除 ${file.name}`}
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>

                        {/* Add more button */}
                        {uploadedFiles.length < MAX_FILES && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="mt-2 text-sm text-blue-200 transition-colors hover:text-white"
                          >
                            + 继续添加文件
                          </button>
                        )}

                        {/* Clear all */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFiles([]);
                          }}
                          className="text-xs text-red-300/70 transition-colors hover:text-red-200"
                        >
                          清空全部
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <svg
                          className="mx-auto h-12 w-12 text-blue-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="font-medium text-white">点击或拖拽文件到此处</p>
                        <p className="text-sm text-blue-200">
                          支持 PDF, DOC, DOCX, TXT, MD, JSON · 单个最大 10MB · 最多 {MAX_FILES}{' '}
                          个文件
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
                  <div className="mb-4 flex gap-1">
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
                      <label className="mb-1 block text-left text-sm font-medium text-blue-100">
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
                          className="w-full resize-none rounded-xl border-0 bg-white p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
                        />
                      ) : (
                        <input
                          type="text"
                          value={guidedData[currentStep.key] || ''}
                          onChange={(e) =>
                            setGuidedData({ ...guidedData, [currentStep.key]: e.target.value })
                          }
                          placeholder={currentStep.placeholder}
                          className="w-full rounded-xl border-0 bg-white p-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
                        />
                      )}
                      <div className="flex justify-between pt-2">
                        <button
                          onClick={() => setGuidedStep(Math.max(0, guidedStep - 1))}
                          disabled={guidedStep === 0}
                          className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                            guidedStep === 0
                              ? 'cursor-not-allowed opacity-40'
                              : 'cursor-pointer text-white hover:bg-white/10'
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
                          className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                            !guidedData[currentStep.key]?.trim()
                              ? 'cursor-not-allowed opacity-40'
                              : 'cursor-pointer bg-white text-gray-900 hover:bg-blue-50'
                          }`}
                        >
                          下一步
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 py-4 text-center">
                      <svg
                        className="mx-auto h-10 w-10 text-green-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="font-medium text-white">所有信息已填写完成!</p>
                      <button
                        onClick={() => {
                          setGuidedStep(0);
                          setGuidedData({});
                        }}
                        className="cursor-pointer text-sm text-blue-200 transition-colors hover:text-white"
                      >
                        重新填写
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Generate Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleGenerateResume}
                  disabled={!canProceedToGenerate}
                  className={`inline-flex items-center rounded-lg px-8 py-3 font-semibold no-underline transition-all ${
                    canProceedToGenerate
                      ? 'cursor-pointer bg-blue-500 text-white shadow-lg hover:bg-blue-400 hover:shadow-xl'
                      : 'cursor-not-allowed bg-gray-500/50 text-gray-300'
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">三步完成求职闭环</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              从混乱的经历到能拿offer的表达，AI全程陪伴你
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:border-blue-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50">
                <svg
                  className="h-6 w-6 text-blue-600"
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
              <h3 className="mb-3 text-xl font-semibold text-gray-900">经历 → 简历</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>输入零散经历（文本 / 文件 / 引导式）</li>
                <li>AI自动STAR结构化重组</li>
                <li>量化成果、专业措辞</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:border-green-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50">
                <svg
                  className="h-6 w-6 text-green-600"
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
              <h3 className="mb-3 text-xl font-semibold text-gray-900">JD → 优化版</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>粘贴目标岗位JD</li>
                <li>智能匹配度分析（技能 / 经验 / 表达）</li>
                <li>一键生成针对性优化版本</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-gray-200 p-8 transition-all hover:border-purple-300 hover:shadow-xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50">
                <svg
                  className="h-6 w-6 text-purple-600"
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
              <h3 className="mb-3 text-xl font-semibold text-gray-900">简历 → 面试能力</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>AI生成个性化面试问题</li>
                <li>真实对话式模拟训练</li>
                <li>即时评分反馈 + 能力雷达图</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
