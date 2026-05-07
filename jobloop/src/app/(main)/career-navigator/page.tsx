'use client';

import { useState, useEffect } from 'react';
import {
  saveCareerNavInput,
  getCareerNavInput,
  saveCareerNavResult,
  getCareerNavResult,
  clearCareerNav,
} from '@/lib/storage';

type Step = 1 | 2 | 3;

interface Diagnosis {
  archetype: string;
  archetypeDescription: string;
  strengths: string[];
  weaknesses: string[];
}

interface RecommendedRole {
  title: string;
  matchScore: number;
  gapFriendlyScore: number;
  salaryRange: string;
  entryBarrier: string;
  reasons: string[];
  concerns: string[];
}

interface RecommendedCity {
  name: string;
  matchReasons: string[];
  targetIndustries: string[];
  competitionLevel: string;
  livingCost: string;
}

interface GapStrategy {
  summary: string;
  resumePhrase: string;
  doSay: string[];
  dontSay: string[];
}

interface ExperienceReframe {
  original: string;
  translated: string;
  targetSkills: string[];
}

interface SkillGap {
  skill: string;
  severity: string;
  suggestion: string;
}

interface NavResult {
  diagnosis: Diagnosis;
  recommendedRoles: RecommendedRole[];
  recommendedCities: RecommendedCity[];
  gapStrategy: GapStrategy;
  experienceReframes: ExperienceReframe[];
  skillGaps: SkillGap[];
}

export default function CareerNavigatorPage() {
  const [step, setStep] = useState<Step>(1);
  const [rawInput, setRawInput] = useState('');
  const [targetCities, setTargetCities] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<NavResult | null>(null);

  useEffect(() => {
    const savedInput = getCareerNavInput();
    if (savedInput) {
      setRawInput(savedInput.rawInput);
      setTargetCities(savedInput.targetCities);
      setInterests(savedInput.interests);
    }
    const savedResult = getCareerNavResult();
    if (savedResult) {
      setResult(savedResult as unknown as NavResult);
      setStep(2);
    }
  }, []);

  const handleSubmit = async () => {
    if (rawInput.trim().length < 50) {
      setError('请输入至少50字的个人经历描述');
      return;
    }
    setError('');
    setLoading(true);
    saveCareerNavInput({ rawInput, targetCities, interests });

    try {
      const res = await fetch('/api/career/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: rawInput,
          target_cities: targetCities || '不限',
          interests: interests || '不限',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || '分析失败，请重试');
        return;
      }
      const navResult = data.data as NavResult;
      setResult(navResult);
      saveCareerNavResult(navResult as unknown as Record<string, unknown>);
      setStep(2);
    } catch {
      setError('网络错误，请检查网络连接后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearCareerNav();
    setRawInput('');
    setTargetCities('');
    setInterests('');
    setResult(null);
    setStep(1);
    setError('');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">职业方向诊断</h1>
      <p className="mb-6 text-gray-500">把你的全部经历告诉我，AI帮你找到最适合的岗位方向</p>

      {/* Progress */}
      <div className="mb-8 flex gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={`h-2 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">你的全部经历 *</label>
            <textarea
              className="h-64 w-full rounded-lg border p-3 text-sm"
              placeholder={
                '把你的全部经历都写在这里，越详细越好。\n\n包括：\n- 教育背景（学校、专业、什么时候毕业）\n- 工作或实习经历\n- 学生工作、社团活动\n- GAP期做了什么（自学、考证、项目等）\n- 任何你觉得可能相关的经历\n\n不用管格式，随便写就行。'
              }
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">{rawInput.length} 字（至少50字）</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">目标城市（可选）</label>
            <input
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="如：杭州、成都、上海"
              value={targetCities}
              onChange={(e) => setTargetCities(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">感兴趣的方向（可选）</label>
            <input
              className="w-full rounded-lg border p-3 text-sm"
              placeholder="如：AI、产品、运营、金融"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'AI 正在分析你的经历...' : '开始诊断'}
          </button>
        </div>
      )}

      {/* Step 2: Diagnosis Result */}
      {step === 2 && result && (
        <div className="space-y-6">
          <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700">
            重新输入
          </button>

          {/* Archetype */}
          <section className="rounded-lg border p-4">
            <h2 className="mb-2 text-lg font-bold">你的能力原型：{result.diagnosis.archetype}</h2>
            <p className="text-sm text-gray-600">{result.diagnosis.archetypeDescription}</p>
          </section>

          {/* Strengths & Weaknesses */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-2 font-bold">核心优势</h3>
            <ul className="space-y-1">
              {result.diagnosis.strengths.map((s, i) => (
                <li key={i} className="text-sm text-gray-700">
                  - {s}
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-4 font-bold">需要提升</h3>
            <ul className="space-y-1">
              {result.diagnosis.weaknesses.map((w, i) => (
                <li key={i} className="text-sm text-gray-500">
                  - {w}
                </li>
              ))}
            </ul>
          </section>

          {/* Recommended Roles */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-lg font-bold">推荐岗位</h3>
            <div className="space-y-4">
              {result.recommendedRoles.map((role, i) => (
                <div key={i} className="border-l-4 border-blue-500 pl-4">
                  <div className="mb-1 flex items-center justify-between">
                    <h4 className="font-bold">{role.title}</h4>
                    <span className="text-sm text-gray-500">{role.salaryRange}</span>
                  </div>
                  <div className="mb-2 flex gap-4 text-xs text-gray-500">
                    <span>匹配度 {role.matchScore}%</span>
                    <span>GAP友好度 {role.gapFriendlyScore}%</span>
                    <span>入门门槛：{role.entryBarrier}</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {role.reasons.map((r, j) => (
                      <p key={j} className="text-green-700">
                        + {r}
                      </p>
                    ))}
                    {role.concerns.map((c, j) => (
                      <p key={j} className="text-amber-600">
                        ! {c}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cities */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-lg font-bold">推荐城市</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {result.recommendedCities.map((city, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <h4 className="font-bold">{city.name}</h4>
                  <div className="mt-1 flex gap-3 text-xs text-gray-500">
                    <span>竞争：{city.competitionLevel}</span>
                    <span>成本：{city.livingCost}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{city.matchReasons.join('；')}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    适合行业：{city.targetIndustries.join('、')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* GAP Strategy */}
          <section className="rounded-lg border bg-blue-50 p-4">
            <h3 className="mb-2 text-lg font-bold">GAP 期包装策略</h3>
            <p className="mb-2 text-sm font-medium">简历上写：{result.gapStrategy.resumePhrase}</p>
            <p className="mb-3 text-sm text-gray-600">{result.gapStrategy.summary}</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-green-600">应该说：</span>
                <ul className="ml-4 mt-1">
                  {result.gapStrategy.doSay.map((s, i) => (
                    <li key={i}>- {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="font-medium text-red-500">避免提及：</span>
                <ul className="ml-4 mt-1">
                  {result.gapStrategy.dontSay.map((s, i) => (
                    <li key={i}>- {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Experience Reframes */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-lg font-bold">经历翻译</h3>
            <div className="space-y-3">
              {result.experienceReframes.map((ref, i) => (
                <div key={i} className="text-sm">
                  <p className="text-gray-400 line-through">{ref.original}</p>
                  <p className="font-medium text-gray-800">{ref.translated}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    可迁移技能：{ref.targetSkills.join('、')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Skill Gaps */}
          <section className="rounded-lg border p-4">
            <h3 className="mb-3 text-lg font-bold">能力缺口与建议</h3>
            <div className="space-y-3">
              {result.skillGaps.map((gap, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        gap.severity === '高'
                          ? 'bg-red-100 text-red-700'
                          : gap.severity === '中'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {gap.severity}优先级
                    </span>
                    <span className="font-medium">{gap.skill}</span>
                  </div>
                  <p className="mt-1 text-gray-600">{gap.suggestion}</p>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={() => setStep(3)}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
          >
            下一步：生成定向简历
          </button>
        </div>
      )}

      {/* Step 3: Resume (placeholder) */}
      {step === 3 && (
        <div className="py-16 text-center">
          <h2 className="mb-2 text-xl font-bold">定向简历生成</h2>
          <p className="text-gray-500">此功能开发中，将基于诊断结果和选定岗位生成针对性简历。</p>
          <div className="mt-4 space-y-2">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              返回诊断报告
            </button>
            <br />
            <button onClick={handleReset} className="text-sm text-gray-500 hover:text-gray-700">
              重新开始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
