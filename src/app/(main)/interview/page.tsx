'use client';

import { useState } from 'react';

interface Question {
  id: string;
  type: 'behavioral' | 'technical' | 'pressure' | 'scenario' | 'open';
  category: string;
  text: string;
  followUpStrategy: {
    depth: string;
    challenge: string;
    scenario: string;
  };
  idealAnswerElements: string[];
}

interface InterviewData {
  questions: Question[];
  scoringCriteria: {
    dimensions: string[];
    scoreRange: [number, number];
    feedbackTemplate: string;
  };
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
  const [jdInput, setJdInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<InterviewData | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [scoreResult, setScoreResult] = useState<{ score: number; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        body: JSON.stringify({
          jdContent: jdInput.trim(),
          resumeContent: resumeInput.trim(),
        }),
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
          userAnswer: userAnswer,
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

  const currentQuestion = result?.questions[activeQuestionIdx];
  const totalQuestions = result?.questions.length || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI 面试模拟</h1>
        <p className="mt-1 text-gray-600">基于岗位JD和你的简历，智能生成面试题目并进行训练</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Input / Question */}
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
                  className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                  className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <strong>警告：</strong> {error}
            </div>
          )}

          {/* Active Question + Answer Area */}
          {currentQuestion && (
            <div className="space-y-4">
              {/* Progress */}
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

              {/* Question Card */}
              <div className={`rounded-xl border p-5 ${TYPE_COLORS[currentQuestion.type]}`}>
                <div className="mb-1 text-xs font-medium uppercase tracking-wide opacity-70">
                  {TYPE_LABELS[currentQuestion.type]} · {currentQuestion.category}
                </div>
                <p className="mt-2 text-base font-semibold leading-relaxed">
                  {currentQuestion.text}
                </p>

                {/* Ideal elements hint */}
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

              {/* Follow-up strategy preview */}
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

              {/* Answer input */}
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

              {/* Score Result */}
              {scoreResult && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-700">
                      {scoreResult.score}/10
                    </span>
                    <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800">
                      {scoreResult.score >= 8 ? '优秀' : scoreResult.score >= 6 ? '良好' : '需改进'}
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

          {/* All questions list when done */}
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

        {/* Right: Question List + Radar */}
        <div className="space-y-6">
          {/* Question Navigator */}
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
                        {TYPE_LABELS[q.type].split(' ')[1]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-800">{q.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scoring Criteria */}
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
              <p className="mt-3 text-xs text-gray-400">
                评分范围：{result.scoringCriteria.scoreRange[0]}-
                {result.scoringCriteria.scoreRange[1]} 分
              </p>
            </div>
          )}

          {/* Placeholder when no results yet */}
          {!result && !isGenerating && (
            <div className="py-20 text-center text-gray-400">
              <span className="mb-4 block text-4xl">&#x1F3AC;</span>
              <p>左侧输入JD后，这里会显示生成的面试题目</p>
              <p className="mt-2 text-sm">支持行为题、技术题、压力题、情景题、开放题</p>
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

          {/* Disclaimer */}
          {result && (
            <p className="text-center text-xs text-gray-400">
              面试建议由AI生成，实际面试请结合个人经历调整 · Powered by JobLoop AI
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
