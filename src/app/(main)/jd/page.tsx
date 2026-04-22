'use client';

import { useState } from 'react';

interface GapItem {
  area: string;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  isShortTerm: boolean;
}

interface OptimizedBullet {
  original: string;
  optimized: string;
  reason: string;
}

interface JDMatchData {
  overallScore: number;
  dimensionScores: { skills: number; experience: number; expression: number };
  gaps: GapItem[];
  optimizedBullets: OptimizedBullet[];
  keywordTrends: string[];
}

const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
};

const SEVERITY_LABELS: Record<string, string> = {
  high: '🔴 高优先级',
  medium: '🟡 中等',
  low: '🟢 低（加分项）',
};

export default function JDOptimizePage() {
  const [jdInput, setJdInput] = useState('');
  const [resumeInput, setResumeInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<JDMatchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jdInput.trim() || !resumeInput.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/jd/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdContent: jdInput.trim(), resumeContent: resumeInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.data || null);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `分析失败 (${res.status})`);
      }
    } catch {
      setError('网络错误，请检查连接后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Score ring component
  const ScoreRing = ({
    score,
    label,
    size = 120,
  }: {
    score: number;
    label: string;
    size?: number;
  }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-2">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-gray-900"
            fontSize={size === 120 ? 28 : 18}
            fontWeight="bold"
          >
            {score}
          </text>
        </svg>
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">JD 匹配与简历优化</h1>
        <p className="mt-1 text-gray-600">粘贴岗位JD和你当前的简历，获取智能匹配分析和优化方案</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: Input Panel */}
        <div className="space-y-6">
          {/* JD Input */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label htmlFor="jd-input" className="mb-2 block text-sm font-medium text-gray-700">
              📋 岗位 JD（职位描述）
            </label>
            <textarea
              id="jd-input"
              value={jdInput}
              onChange={(e) => setJdInput(e.target.value)}
              placeholder="粘贴目标岗位的招聘要求...\n\n例如：\n岗位职责：\n1. 负责产品数据分析与报表输出\n2. 搭建数据监控体系\n3. 与业务团队协作推进数据驱动决策\n\n任职要求：\n- 本科及以上学历\n- 熟练使用SQL/Python\n- 有数据分析相关经验..."
              rows={10}
              className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Resume Input */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <label
              htmlFor="resume-input-jd"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              📝 你的简历内容
            </label>
            <textarea
              id="resume-input-jd"
              value={resumeInput}
              onChange={(e) => setResumeInput(e.target.value)}
              placeholder="粘贴你的简历内容或之前生成的简历JSON..."
              rows={8}
              className="w-full resize-none rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Analyze Button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !jdInput.trim() || !resumeInput.trim()}
            className="w-full cursor-pointer rounded-lg bg-blue-600 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isAnalyzing ? (
              <>
                <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                正在分析...
              </>
            ) : (
              '🔍 开始分析匹配度'
            )}
          </button>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <strong>警告：</strong> {error}
            </div>
          )}
        </div>

        {/* Right: Results Panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {!result && !isAnalyzing && (
            <div className="py-20 text-center text-gray-400">
              <span className="mb-4 block text-4xl">&#x1F50D;</span>
              <p>左侧输入JD和简历后，这里会显示匹配分析结果</p>
            </div>
          )}

          {isAnalyzing && !result && (
            <div className="py-20 text-center">
              <div
                className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
                role="status"
              />
              <p className="mt-4 text-gray-600">AI正在深度分析你的简历与JD的匹配度...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Overall Score Dashboard */}
              <div>
                <h3 className="mb-4 font-semibold text-gray-900">📊 匹配度评分</h3>
                <div className="flex items-start justify-around rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <ScoreRing score={result.overallScore} label="总分" size={130} />
                  <div className="flex flex-col justify-center gap-3 pt-6">
                    <div className="flex items-center gap-3">
                      <ScoreRing score={result.dimensionScores.skills} label="技能" size={72} />
                      <ScoreRing score={result.dimensionScores.experience} label="经验" size={72} />
                      <ScoreRing score={result.dimensionScores.expression} label="表达" size={72} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Keyword Trends */}
              {result.keywordTrends.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">🏷️ 岗位关键词</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keywordTrends.map((kw, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          i < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Gaps Analysis */}
              {result.gaps.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">🔍 差距分析</h3>
                  <div className="space-y-2">
                    {result.gaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 ${SEVERITY_COLORS[gap.severity]}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{gap.area}</span>
                          <span className="text-xs">{SEVERITY_LABELS[gap.severity]}</span>
                        </div>
                        <p className="mt-1 text-sm opacity-80">{gap.suggestion}</p>
                        {gap.isShortTerm && (
                          <span className="mt-1 inline-block rounded bg-green-200/60 px-2 py-0.5 text-[10px] text-green-800">
                            可短期弥补 ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optimized Bullets */}
              {result.optimizedBullets.length > 0 && (
                <div>
                  <h3 className="mb-3 font-semibold text-gray-900">✍️ 简历优化建议</h3>
                  <div className="space-y-4">
                    {result.optimizedBullets.map((bullet, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-orange-100 bg-orange-50/30 p-4"
                      >
                        <div className="mb-2 text-xs font-medium text-orange-600">
                          Bullet #{idx + 1} · {bullet.reason}
                        </div>
                        <div className="space-y-2">
                          <div className="rounded bg-red-50 p-2 text-sm text-red-700 line-through">
                            {bullet.original}
                          </div>
                          <div className="rounded bg-green-50 p-2 text-sm font-medium text-green-800">
                            → {bullet.optimized}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Disclaimer */}
              <p className="text-center text-xs text-gray-400">
                分析结果由AI生成，建议结合实际情况判断 · Powered by JobLoop AI
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
