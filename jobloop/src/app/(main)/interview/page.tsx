'use client';

import { useState, useEffect } from 'react';
import { getGeneratedResume, getResumeDraft, saveJDInput, getJDInput } from '@/lib/storage';

// ===== Types for Simulate Mode =====
interface Question {
  id: string;
  type: 'behavioral' | 'technical' | 'pressure' | 'scenario' | 'open';
  category: string;
  text: string;
  followUpStrategy: { depth: string; challenge: string; scenario: string };
  idealAnswerElements: string[];
}

interface InterviewData {
  questions: Question[];
  scoringCriteria: { dimensions: string[]; scoreRange: [number, number]; feedbackTemplate: string };
}

// ===== Types for Review Mode =====
interface ReviewData {
  summary: string;
  interviewAnalysis: {
    interviewerFocus: string[];
    questionCategories: Record<string, number>;
    difficulty: string;
    overallVibe: string;
  };
  strengths: Array<{ area: string; evidence: string; tip: string }>;
  gaps: Array<{ area: string; severity: string; description: string; suggestion: string }>;
  improvementPlan: { shortTerm: string[]; mediumTerm: string[]; longTerm: string[] };
  likelyNextSteps: Array<{ step: string; preparation: string }>;
  keyQuestionsToPrepare: string[];
  score: { overall: number; dimensions: Record<string, number> };
}

const TYPE_LABELS: Record<string, string> = {
  behavioral: '🎯 行为题（STAR）',
  technical: '💻 技术/业务',
  pressure: '🔥 压力测试',
  scenario: '🧪 情景模拟',
  open: '❓ 开放性',
};

const TYPE_COLORS: Record<string, string> = {
  behavioral: 'bg-blue-50 border-blue-200 text-blue-800',
  technical: 'bg-purple-50 border-purple-200 text-purple-800',
  pressure: 'bg-red-50 border-red-200 text-red-800',
  scenario: 'bg-orange-50 border-orange-200 text-orange-800',
  open: 'bg-green-50 border-green-200 text-green-800',
};

export default function InterviewPage() {
  const [mounted, setMounted] = useState(false);
  // Mode switcher
  const [mode, setMode] = useState<'simulate' | 'review'>('simulate');

  // === Simulate mode state ===
  const [jdInput, setJdInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<InterviewData | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [scoreResult, setScoreResult] = useState<{ score: number; feedback: string } | null>(null);

  // === Review mode state ===
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [reviewQuestions, setReviewQuestions] = useState<string[]>(['']);
  const [userAnswers, setUserAnswers] = useState<string[]>(['']);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore data from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const generated = getGeneratedResume();
    if (generated?.content) {
      const draft = getResumeDraft();
      if (draft?.rawInput) {
        setResumeInput(draft.rawInput);
      } else {
        setResumeInput(generated.content);
      }
    } else {
      const draft = getResumeDraft();
      if (draft?.rawInput) {
        setResumeInput(draft.rawInput);
      }
    }

    const savedJD = getJDInput();
    if (savedJD) {
      setJdInput(savedJD);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !jdInput.trim()) return;
    saveJDInput(jdInput);
  }, [jdInput, mounted]);

  // ========== SIMULATE MODE FUNCTIONS ==========
  const handleGenerate = async () => {
    if (!jdInput.trim()) return;
    setIsGenerating(true);
    setError(null);
    setActiveQuestionIdx(0);
    setUserAnswer('');
    setScoreResult(null);

    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdContent: jdInput.trim(), resumeContent: resumeInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data || null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `生成失败 (${res.status})`);
      }
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !result) return;

    try {
      const res = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdContent: jdInput,
          resumeContent: resumeInput,
          questionId: result.questions[activeQuestionIdx]?.id,
          userAnswer,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScoreResult(data.data);
      }
    } catch {
      setScoreResult({ score: 0, feedback: '评分服务暂不可用' });
    }
  };

  const handleNext = () => {
    if (result && activeQuestionIdx < result.questions.length - 1) {
      setActiveQuestionIdx((prev) => prev + 1);
      setUserAnswer('');
      setScoreResult(null);
    }
  };

  // ========== REVIEW MODE FUNCTIONS ==========
  const handleAddQuestion = () => {
    setReviewQuestions((prev) => [...prev, '']);
    setUserAnswers((prev) => [...prev, '']);
  };

  const handleRemoveQuestion = (idx: number) => {
    setReviewQuestions((prev) => prev.filter((_, i) => i !== idx));
    setUserAnswers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, value: string) => {
    setReviewQuestions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleAnswerChange = (idx: number, value: string) => {
    setUserAnswers((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleReview = async () => {
    const validQuestions = reviewQuestions
      .map((q, i) => ({
        question: q.trim(),
        answer: (userAnswers[i] || '').trim(),
      }))
      .filter((item) => item.question);

    if (validQuestions.length === 0 || !company.trim() || !position.trim()) {
      setError('请至少填写公司名、岗位和一个面试问题');
      return;
    }

    setIsReviewing(true);
    setError(null);

    try {
      const res = await fetch('/api/interview/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          position: position.trim(),
          jdContent: jdInput.trim(),
          resumeContent: resumeInput.trim(),
          questions: validQuestions.map((q) => q.question),
          userAnswers: validQuestions.map((q) => q.answer),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviewResult(data.data || null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `复盘失败 (${res.status})`);
      }
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsReviewing(false);
    }
  };

  // ========== RENDER HELPERS ==========
  const currentQuestion = result?.questions[activeQuestionIdx];
  const totalQuestions = result?.questions.length || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI 面试中心</h1>
          <p className="mt-1 text-gray-600">模拟训练 + 面试复盘，全方位提升面试能力</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setMode('simulate')}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'simulate'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎤 模拟练习
          </button>
          <button
            type="button"
            onClick={() => setMode('review')}
            className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'review'
                ? 'bg-white text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 面试复盘
          </button>
        </div>
      </div>

      {/* ==================== SIMULATE MODE ==================== */}
      {mode === 'simulate' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left */}
          <div className="space-y-6">
            {!result && (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <label
                    htmlFor="jd-interview"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    📋 目标岗位 JD
                  </label>
                  <textarea
                    id="jd-interview"
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    placeholder="粘贴目标岗位的招聘要求..."
                    rows={8}
                    className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <label
                    htmlFor="resume-interview"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    📝 你的简历（可选）
                  </label>
                  <textarea
                    id="resume-interview"
                    value={resumeInput}
                    onChange={(e) => setResumeInput(e.target.value)}
                    placeholder="提供你的简历可获得更定制化的面试问题..."
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating || !jdInput.trim()}
                  className="w-full cursor-pointer rounded-lg bg-purple-600 py-3 font-semibold text-white transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {isGenerating ? (
                    <>
                      <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                      正在生成面试题...
                    </>
                  ) : (
                    '🎤 生成面试题目'
                  )}
                </button>
              </>
            )}

            {error && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                <strong>警告：</strong> {error}
              </div>
            )}

            {/* Active Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">
                    问题 {activeQuestionIdx + 1} / {totalQuestions}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${((activeQuestionIdx + 1) / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-5 ${TYPE_COLORS[currentQuestion.type] || 'border-gray-200 bg-gray-50 text-gray-800'}`}
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                    {TYPE_LABELS[currentQuestion.type] || currentQuestion.type} ·{' '}
                    {currentQuestion.category}
                  </div>
                  <p className="mt-2 text-base font-semibold leading-relaxed">
                    {currentQuestion.text}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentQuestion.idealAnswerElements.map((el, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/60 px-2 py-0.5 text-xs opacity-80"
                      >
                        ✓ {el}
                      </span>
                    ))}
                  </div>
                </div>

                <details className="rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600">
                    💡 查看追问策略
                  </summary>
                  <div className="mt-2 space-y-2 pl-4 text-sm text-gray-500">
                    <p>
                      <strong>深度追问：</strong>
                      {currentQuestion.followUpStrategy.depth}
                    </p>
                    <p>
                      <strong>质疑挑战：</strong>
                      {currentQuestion.followUpStrategy.challenge}
                    </p>
                    <p>
                      <strong>场景变更：</strong>
                      {currentQuestion.followUpStrategy.scenario}
                    </p>
                  </div>
                </details>

                <div>
                  <label
                    htmlFor="user-answer"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ✍️ 你的回答
                  </label>
                  <textarea
                    id="user-answer"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder={`请用STAR法则组织回答（情境→任务→行动→结果）...`}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={!userAnswer.trim() || !!scoreResult}
                      className="cursor-pointer rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-300"
                    >
                      提交回答并获取评分
                    </button>
                    {activeQuestionIdx < totalQuestions - 1 && (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        跳过 → 下一题
                      </button>
                    )}
                  </div>
                </div>

                {scoreResult && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-700">
                        {scoreResult.score}/10
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          scoreResult.score >= 8
                            ? 'bg-green-200 text-green-800'
                            : scoreResult.score >= 6
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {scoreResult.score >= 8
                          ? '优秀'
                          : scoreResult.score >= 6
                            ? '良好'
                            : '需改进'}
                      </span>
                    </div>
                    <p className="text-sm text-green-700">{scoreResult.feedback}</p>
                    {activeQuestionIdx < totalQuestions - 1 && (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="mt-3 cursor-pointer rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        下一题 →
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {result && !currentQuestion && (
              <div className="py-8 text-center">
                <p className="mb-2 font-semibold text-green-600">🎉 所有题目已完成！</p>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setActiveQuestionIdx(0);
                  }}
                  className="cursor-pointer rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
                >
                  重新开始
                </button>
              </div>
            )}
          </div>

          {/* Right: Question List */}
          <div className="space-y-6">
            {result && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-3 font-semibold text-gray-900">
                  📋 题目列表 ({totalQuestions} 题)
                </h3>
                <div className="space-y-2">
                  {result.questions.map((q, idx) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setActiveQuestionIdx(idx);
                        setUserAnswer('');
                        setScoreResult(null);
                      }}
                      className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                        idx === activeQuestionIdx
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium opacity-60">Q{idx + 1}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            q.type === 'behavioral'
                              ? 'bg-blue-100 text-blue-700'
                              : q.type === 'technical'
                                ? 'bg-purple-100 text-purple-700'
                                : q.type === 'pressure'
                                  ? 'bg-red-100 text-red-700'
                                  : q.type === 'scenario'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {TYPE_LABELS[q.type]?.split(' ')[1] || q.type}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800">
                        {q.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-3 font-semibold text-gray-900">📏 评分维度</h3>
                <div className="space-y-3">
                  {result.scoringCriteria.dimensions.map((dim) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{dim}</span>
                      <div className="h-2 flex-1 rounded-full bg-gray-100">
                        <div
                          className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"
                          style={{ width: `${Math.random() * 40 + 55}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!result && !isGenerating && (
              <div className="py-20 text-center text-gray-400">
                <span className="mb-4 block text-4xl">&#x1F3AC;</span>
                <p>左侧输入JD后，这里会显示生成的面试题目</p>
              </div>
            )}

            {isGenerating && !result && (
              <div className="py-20 text-center">
                <div
                  className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"
                  role="status"
                />
                <p className="mt-4 text-gray-600">AI正在根据岗位要求设计面试题目...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== REVIEW MODE ==================== */}
      {mode === 'review' && (
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Input Section — before review */}
          {!reviewResult && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">📋 记录你的真实面试</h2>
              <p className="mb-4 text-sm text-gray-500">
                回忆面试中遇到的问题和你的回答（越详细越好），AI
                会帮你分析面试官意图、评估表现、给出改进建议。
              </p>

              {/* Company & Position */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="review-company"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    面试公司 *
                  </label>
                  <input
                    id="review-company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="例如：字节跳动、腾讯、阿里..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="review-position"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    目标岗位 *
                  </label>
                  <input
                    id="review-position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="例如：前端工程师、产品经理..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Optional context */}
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="review-jd"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    岗位 JD（选填）
                  </label>
                  <textarea
                    id="review-jd"
                    value={jdInput}
                    onChange={(e) => setJdInput(e.target.value)}
                    placeholder="如有岗位JD可贴入，帮助更精准分析..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="review-resume"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    你的简历（选填）
                  </label>
                  <textarea
                    id="review-resume"
                    value={resumeInput}
                    onChange={(e) => setResumeInput(e.target.value)}
                    placeholder="提供简历可获得更精准的复盘分析..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Questions & Answers */}
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    面试问题与回答 *（至少一个）
                  </label>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-700"
                  >
                    + 添加问题
                  </button>
                </div>

                <div className="space-y-4">
                  {reviewQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-lg border border-gray-200 bg-gray-50/30 p-4"
                    >
                      {reviewQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="absolute right-3 top-3 cursor-pointer text-xs text-red-400 hover:text-red-600"
                        >
                          ✕ 删除
                        </button>
                      )}
                      <div className="pr-12">
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => handleQuestionChange(idx, e.target.value)}
                          placeholder={`Q${idx + 1}: 面试官问了什么？（例如：请做一下自我介绍）`}
                          className="mb-2 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                        <textarea
                          value={userAnswers[idx] || ''}
                          onChange={(e) => handleAnswerChange(idx, e.target.value)}
                          placeholder={`A${idx + 1}: 你当时是怎么回答的？（可留空，只记录问题也可以）`}
                          rows={3}
                          className="w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleReview}
                disabled={isReviewing || !company.trim() || !position.trim()}
                className="mt-4 w-full cursor-pointer rounded-lg bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isReviewing ? (
                  <>
                    <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                    AI 正在深度复盘...
                  </>
                ) : (
                  '🔍 开始复盘分析'
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <strong>警告：</strong> {error}
            </div>
          )}

          {/* Review Results */}
          {reviewResult && (
            <div className="space-y-6">
              {/* Header with re-review button */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  🎯 复盘结果：{company} - {position}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setReviewResult(null);
                    setError(null);
                  }}
                  className="cursor-pointer rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  重新复盘
                </button>
              </div>

              {/* Overall Score Card */}
              <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600">
                      {reviewResult.score.overall}
                    </div>
                    <div className="mt-1 text-sm text-green-700">综合评分 / 10</div>
                  </div>
                  <div className="hidden h-16 w-px bg-green-200 sm:block" />
                  <div className="grid w-full grid-cols-2 gap-x-6 gap-y-2 sm:w-auto sm:grid-cols-3">
                    {Object.entries(reviewResult.score.dimensions).map(([dim, score]) => (
                      <div key={dim} className="text-left">
                        <div className="text-xs text-gray-500">{dim}</div>
                        <div className="text-base font-semibold text-gray-900">{score}/10</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-2 font-semibold text-gray-900">📊 整体概述</h3>
                <p className="text-gray-700">{reviewResult.summary}</p>
              </div>

              {/* Interview Analysis */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="mb-3 font-semibold text-gray-900">🔍 面试官意图分析</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <div className="text-2xl">🎯</div>
                    <div className="mt-1 text-xs text-gray-500">关注重点</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {(reviewResult.interviewAnalysis.interviewerFocus || [])
                        .slice(0, 2)
                        .join('、') || '-'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <div className="text-2xl">📈</div>
                    <div className="mt-1 text-xs text-gray-500">难度</div>
                    <div className="mt-1 text-sm font-medium capitalize text-gray-900">
                      {{ easy: '简单', medium: '中等', hard: '困难' }[
                        reviewResult.interviewAnalysis.difficulty
                      ] || reviewResult.interviewAnalysis.difficulty}
                    </div>
                  </div>
                  <div className="rounded-lg bg-orange-50 p-3 text-center">
                    <div className="text-2xl">😊</div>
                    <div className="mt-1 text-xs text-gray-500">氛围</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {reviewResult.interviewAnalysis.overallVibe || '-'}
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <div className="text-2xl">❓</div>
                    <div className="mt-1 text-xs text-gray-500">题型分布</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {Object.entries(reviewResult.interviewAnalysis.questionCategories)
                        .filter(([_, v]) => v > 0)
                        .map(
                          ([k]) =>
                            ({
                              tech: '技术',
                              behavioral: '行为',
                              pressure: '压力',
                              scenario: '情景',
                              open: '开放',
                            })[k] || k
                        )
                        .join('/') || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Gaps side by side */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Strengths */}
                <div className="rounded-xl border border-green-200 bg-white p-6">
                  <h3 className="mb-3 font-semibold text-green-800">✅ 表现亮点</h3>
                  <div className="space-y-3">
                    {reviewResult.strengths.length > 0 ? (
                      reviewResult.strengths.map((s, i) => (
                        <div key={i} className="rounded-lg bg-green-50 p-3">
                          <div className="font-medium text-green-900">{s.area}</div>
                          <p className="mt-1 text-sm text-green-700">{s.evidence}</p>
                          {s.tip && (
                            <p className="mt-1 text-xs text-green-600">💡 强化建议：{s.tip}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">暂无数据</p>
                    )}
                  </div>
                </div>

                {/* Gaps */}
                <div className="rounded-xl border border-red-200 bg-white p-6">
                  <h3 className="mb-3 font-semibold text-red-800">⚠️ 改进空间</h3>
                  <div className="space-y-3">
                    {reviewResult.gaps.length > 0 ? (
                      reviewResult.gaps.map((g, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 ${
                            g.severity === 'high'
                              ? 'bg-red-50'
                              : g.severity === 'medium'
                                ? 'bg-yellow-50'
                                : 'bg-orange-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-medium ${
                                g.severity === 'high'
                                  ? 'text-red-900'
                                  : g.severity === 'medium'
                                    ? 'text-yellow-900'
                                    : 'text-orange-900'
                              }`}
                            >
                              {g.area}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                g.severity === 'high'
                                  ? 'bg-red-200 text-red-800'
                                  : g.severity === 'medium'
                                    ? 'bg-yellow-200 text-yellow-800'
                                    : 'bg-orange-200 text-orange-800'
                              }`}
                            >
                              {g.severity === 'high' ? '高' : g.severity === 'medium' ? '中' : '低'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm opacity-80">{g.description}</p>
                          <p className="mt-1 text-sm font-medium opacity-90">→ {g.suggestion}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">暂无数据</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Improvement Plan */}
              <div className="rounded-xl border border-blue-200 bg-white p-6">
                <h3 className="mb-3 font-semibold text-blue-900">🚀 改进行动计划</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="text-sm font-bold text-blue-800">短期（1-2周）</div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
                      {(reviewResult.improvementPlan.shortTerm || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-indigo-50 p-4">
                    <div className="text-sm font-bold text-indigo-800">中期（1个月）</div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-indigo-700">
                      {(reviewResult.improvementPlan.mediumTerm || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <div className="text-sm font-bold text-purple-800">长期</div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-purple-700">
                      {(reviewResult.improvementPlan.longTerm || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Next Steps Prediction */}
              {(reviewResult.likelyNextSteps?.length > 0 ||
                reviewResult.keyQuestionsToPrepare?.length > 0) && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {reviewResult.likelyNextSteps?.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-white p-6">
                      <h3 className="mb-3 font-semibold text-gray-900">🔮 可能的下一步</h3>
                      <div className="space-y-2">
                        {reviewResult.likelyNextSteps.map((ns, i) => (
                          <div key={i} className="rounded-lg bg-gray-50 p-3">
                            <div className="text-sm font-medium text-gray-900">{ns.step}</div>
                            <p className="mt-1 text-xs text-gray-500">准备：{ns.preparation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reviewResult.keyQuestionsToPrepare?.length > 0 && (
                    <div className="rounded-xl border border-yellow-200 bg-white p-6">
                      <h3 className="mb-3 font-semibold text-yellow-800">⭐ 重点准备的问题</h3>
                      <ul className="list-inside list-disc space-y-1 text-sm text-yellow-900">
                        {reviewResult.keyQuestionsToPrepare.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <p className="text-center text-xs text-gray-400">
                复盘结果由 AI 生成供参考，请结合实际情况判断 · Powered by JobLoop AI
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
