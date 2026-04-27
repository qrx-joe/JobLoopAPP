import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components'
import { getGeneratedResume, getResumeDraft, saveJDInput, getJDInput } from '@/utils/storage'
import { analyzeJDMatch } from '@/services/request'
import { TYPE_LABELS, SEVERITY_LABELS, SEVERITY_COLORS } from '@/config/constants'

interface GapItem {
  area: string
  severity: string
  suggestion: string
  isShortTerm: boolean
}

interface OptimizedBullet {
  original: string
  optimized: string
  reason: string
}

interface JDMatchData {
  overallScore: number
  dimensionScores: { skills: number; experience: number; expression: number }
  gaps: GapItem[]
  optimizedBullets: OptimizedBullet[]
  keywordTrends: string[]
}

export default class JDPage extends Component {
  state = {
    jdInput: '',
    resumeInput: '',
    isAnalyzing: false,
    result: null as JDMatchData | null,
    error: null as string | null,
    mounted: false,
  }

  componentDidMount() {
    // 恢复简历内容
    const generated = getGeneratedResume()
    const draft = getResumeDraft()

    let resumeContent = ''
    if (draft?.rawInput) {
      resumeContent = draft.rawInput
    } else if (generated?.content) {
      resumeContent = generated.content
    }
    this.setState({ resumeInput: resumeContent })

    // 恢复 JD 输入
    const savedJD = getJDInput()
    if (savedJD) {
      this.setState({ jdInput: savedJD, mounted: true })
    } else {
      this.setState({ mounted: true })
    }
  }

  handleAnalyze = async () => {
    const { jdInput, resumeInput } = this.state
    if (!jdInput.trim() || !resumeInput.trim()) {
      Taro.showToast({ title: '请填写 JD 和简历内容', icon: 'none' })
      return
    }

    this.setState({ isAnalyzing: true, error: null })
    saveJDInput(jdInput)

    try {
      const res = await analyzeJDMatch({ jdContent: jdInput.trim(), resumeContent: resumeInput.trim() })
      if (res.success && res.data) {
        this.setState({ result: res.data })
      } else {
        this.setState({ error: res.error || `分析失败` })
      }
    } catch (e) {
      this.setState({ error: '网络错误，请检查连接' })
    } finally {
      this.setState({ isAnalyzing: false })
    }
  }

  // Score ring component (simplified for mini program)
  renderScoreRing(score: number, label: string, size: number = 120) {
    const radius = (size - 12) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const halfSize = size / 2
    const strokeWidth = 6

    return (
      <View className="flex-col flex-center">
        <svg width={size} height={height} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={halfSize} cy={halfSize} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
          <circle
            cx={halfSize} cy={halfSize} r={radius} fill="none"
            stroke={score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${offset}`}
          />
          <text x={halfSize} y={halfSize} textAnchor="middle" dominantBaseline="central" fill="#111827" fontSize={size === 120 ? 36 : 22} fontWeight="bold">
            {score}
          </text>
        </svg>
        <Text style={{ fontSize: '20rpx', color: '#6b7280', marginTop: '8rpx' }}>{label}</Text>
      </View>
    )
  }

  render() {
    const { jdInput, resumeInput, isAnalyzing, result, error, mounted } = this.state
    if (!mounted) return null

    return (
      <View className="container">
        <Text className="section-title">JD 匹配与简历优化</Text>
        <Text className="section-desc">粘贴岗位 JD 和你的简历，获取智能匹配分析</Text>

        {/* Input Area */}
        <View className="card">
          <Text style={{ fontWeight: '600', marginBottom: '16rpx', fontSize: '26rpx' }}>📋 岗位 JD</Text>
          <Textarea
            className="input-area"
            value={jdInput}
            onInput={(e) => this.setState({ jdInput: e.detail.value })}
            placeholder="粘贴目标岗位的招聘要求...\n\n岗位职责：\n1.\n2.\n\n任职要求：\n-\n-"
            autoHeight
            maxLength={3000}
            style={{ minHeight: '240rpx' }}
          />

          <Text style={{ fontWeight: '600', margin: '24rpx 0 16rpx', fontSize: '26rpx' }}>📝 你的简历内容</Text>
          <Textarea
            className="input-area"
            value={resumeInput}
            onInput={(e) => this.setState({ resumeInput: e.detail.value })}
            placeholder="粘贴你的简历内容..."
            autoHeight
            maxLength={5000}
            style={{ minHeight: '200rpx' }}
          />

          <Button className="btn-primary mt-4" disabled={isAnalyzing || !jdInput.trim() || !resumeInput.trim()} onClick={this.handleAnalyze}>
            {isAnalyzing ? '🔍 分析中...' : '🔍 开始分析匹配度'}
          </Button>
        </View>

        {/* Error */}
        {error && (
          <View style={{ padding: '20rpx', borderRadius: '12rpx', background: '#fef2f2', border: '2rpx solid #fecaca', color: '#dc2626', fontSize: '24rpx', marginTop: '24rpx' }}>
            ⚠️ {error}
          </View>
        )}

        {/* Results */}
        {result && (
          <View className="card mt-2">
            <Text style={{ fontWeight: '700', fontSize: '30rpx', marginBottom: '24rpx' }}>📊 匹配度评分</Text>

            {/* Score Rings */}
            <View style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', background: '#eff6ff', borderRadius: '16rpx', padding: '40rpx 24rpx', marginBottom: '40rpx' }}>
              {this.renderScoreRing(result.overallScore, '总分', 140)}
              <View style={{ display: 'flex', flexDirection: 'column', gap: '20rpx', paddingTop: '48rpx' }}>
                {this.renderScoreRing(result.dimensionScores.skills, '技能', 76)}
                {this.renderScoreRing(result.dimensionScores.experience, '经验', 76)}
                {this.renderScoreRing(result.dimensionScores.expression, '表达', 76)}
              </View>
            </View>

            {/* Keywords */}
            {result.keywordTrends?.length > 0 && (
              <View style={{ marginBottom: '40rpx' }}>
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '16rpx' }}>🏷️ 关键词</Text>
                <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12rpx' }}>
                  {result.keywordTrends.map((kw, i) => (
                    <View key={i} style={{
                      padding: '8rpx 20rpx',
                      borderRadius: '999rpx',
                      background: i < 3 ? '#dbeafe' : '#f3f4f6',
                      color: i < 3 ? '#1d4ed8' : '#4b5563',
                      fontSize: '22rpx',
                    }}>{kw}</View>
                  ))}
                </View>
              </View>
            )}

            {/* Gaps */}
            {result.gaps?.length > 0 && (
              <View style={{ marginBottom: '40rpx' }}>
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '16rpx' }}>🔍 差距分析</Text>
                {result.gaps.map((gap, idx) => (
                  <View key={idx} style={{
                    border: '2rpx solid #fecaca',
                    background: '#fef2f2',
                    borderRadius: '12rpx',
                    padding: '20rpx',
                    marginBottom: '16rpx',
                  }}>
                    <View className="flex-between">
                      <Text style={{ fontWeight: '600', fontSize: '26rpx' }}>{gap.area}</Text>
                      <Text style={{ fontSize: '20rpx', color: '#dc2626' }}>{SEVERITY_LABELS[gap.severity] || gap.severity}</Text>
                    </View>
                    <Text style={{ fontSize: '24rpx', color: '#991b1b', marginTop: '8rpx', opacity: 0.85 }}>{gap.suggestion}</Text>
                    {gap.isShortTerm && (
                      <Text style={{
                        display: 'inline-block',
                        padding: '4rpx 16rpx',
                        borderRadius: '8rpx',
                        background: '#bbf7d0',
                        color: '#15803d',
                        fontSize: '18rpx',
                        marginTop: '12rpx',
                      }}>可短期弥补 ✓</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Optimized Bullets */}
            {result.optimizedBullets?.length > 0 && (
              <View>
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '16rpx' }}>✍️ 简历优化建议</Text>
                {result.optimizedBullets.map((bullet, idx) => (
                  <View key={idx} style={{
                    border: '2rpx solid #fed7aa',
                    background: '#fff7ed',
                    borderRadius: '12rpx',
                    padding: '24rpx',
                    marginBottom: '20rpx',
                  }}>
                    <Text style={{ fontSize: '20rpx', color: '#c2410c', marginBottom: '12rpx' }}>
                      #{idx + 1} · {bullet.reason}
                    </Text>
                    <View style={{ background: '#fef2f2', padding: '16rpx', borderRadius: '8rpx', marginBottom: '12rpx' }}>
                      <Text style={{ fontSize: '24rpx', textDecoration: 'line-through', color: '#991b1b' }}>{bullet.original}</Text>
                    </View>
                    <View style={{ background: '#f0fdf4', padding: '16rpx', borderRadius: '8rpx' }}>
                      <Text style={{ fontSize: '24rpx', color: '#166534', fontWeight: '500' }}>→ {bullet.optimized}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={{ textAlign: 'center', fontSize: '20rpx', color: '#9ca3af', marginTop: '32rpx' }}>
              AI 生成结果仅供参考 · JobLoop AI
            </Text>
          </View>
        )}

        {/* Empty State */}
        {!result && !isAnalyzing && (
          <View className="card flex-center" style={{ paddingVertical: '100rpx' }}>
            <Text style={{ fontSize: '72rpx', marginBottom: '24rpx' }}>🔍</Text>
            <Text style={{ color: '#9ca3af' }}>左侧输入 JD 和简历后显示结果</Text>
          </View>
        )}

        {/* Loading */}
        {isAnalyzing && !result && (
          <View className="card flex-center" style={{ paddingVertical: '80rpx' }}>
            <View className="loading-spinner" />
            <Text style={{ color: '#6b7280', marginTop: '24rpx' }}>AI 正在深度分析匹配度...</Text>
          </View>
        )}
      </View>
    )
  }
}

definePageConfig({ navigationBarTitleText: 'JD 优化' })
