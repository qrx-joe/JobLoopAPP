import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Textarea } from '@tarojs/components'
import { jdApi, storage } from '../../services/api'

interface GapItem { area: string; severity: string; suggestion: string }
interface OptimizedBullet { original: string; optimized: string; reason: string }

export default class JDPage extends Component {
  state = {
    jdText: '',
    resumeText: '',
    isAnalyzing: false,
    showResult: false,
    overallScore: 0,
    dimensionScores: { skills: 0, experience: 0, expression: 0 },
    gaps: [] as GapItem[],
    optimizedBullets: [] as OptimizedBullet[],
    keywords: [] as string[],
    error: '',
  }

  onJDChange = (e) => {
    this.setState({ jdText: e.detail.value })
  }

  analyzeJD = async () => {
    const { jdText } = this.state
    // 从 storage 恢复简历内容
    const generated = storage.getGeneratedResume()
    const draft = storage.getResumeDraft()
    const resumeContent = draft?.rawInput || generated?.content || ''

    if (!jdText.trim()) return
    this.setState({ isAnalyzing: true, error: '', showResult: false })

    try {
      storage.saveJDInput(jdText)

      const res = await jdApi.match({
        jdContent: jdText.trim(),
        resumeContent: resumeContent || '（未提供简历内容）',
      })

      if (res.success && res.data) {
        const d = res.data
        this.setState({
          isAnalyzing: false,
          showResult: true,
          overallScore: d.overallScore || 0,
          dimensionScores: d.dimensionScores || { skills: 0, experience: 0, expression: 0 },
          gaps: d.gaps || [],
          optimizedBullets: d.optimizedBullets || [],
          keywords: d.keywordTrends || [],
        })
      } else {
        throw new Error(res.error || '分析失败')
      }
    } catch (err: any) {
      this.setState({ error: err.message || '分析失败，请重试', isAnalyzing: false })
    }
  }

  getScoreColor(score) {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  getSeverityTag(severity) {
    switch (severity) {
      case 'high': return 'tag-red'
      case 'medium': return 'tag-orange'
      default: return 'tag-gray'
    }
  }

  getSeverityLabel(severity) {
    switch (severity) {
      case 'high': return '需重点加强'
      case 'medium': return '建议弥补'
      default: return '可选优化'
    }
  }

  render () {
    const { jdText, isAnalyzing, showResult, overallScore, dimensionScores, gaps, optimizedBullets, keywords, error } = this.state

    if (isAnalyzing) {
      return (
        <View className="page" style={{ minHeight: '100vh' }}>
          <View className="loading-wrap">
            {[0, 1, 2].map(i => (
              <View key={i} style={{ width: '20rpx', height: '20rpx', borderRadius: '50%', background: '#2563eb' }} />
            ))}
            <Text className="loading-msg">AI 正在分析 JD 与简历匹配度...</Text>
            <Text className="loading-hint-text">正在识别关键词、计算匹配分数</Text>
          </View>
        </View>
      )
    }

    if (showResult) {
      const scoreColor = this.getScoreColor(overallScore)
      return (
        <View className="page">
          {/* 分数卡片 */}
          <View className="card" style={{ marginTop: '24rpx', textAlign: 'center', paddingTop: '40rpx', paddingBottom: '36rpx' }}>
            <Text className="text-sm text-secondary" style={{ display: 'block', marginBottom: '12rpx' }}>综合匹配度</Text>
            <Text style={{ fontSize: '80rpx', fontWeight: 700, color: scoreColor }}>{overallScore}</Text>
            <Text className="score-label">/ 100 分</Text>
            <View className="flex-row" style={{ justifyContent: 'center', gap: '48rpx', marginTop: '32rpx' }}>
              {[{ label: '技能', value: dimensionScores.skills }, { label: '经验', value: dimensionScores.experience }, { label: '表达', value: dimensionScores.expression }].map((dim, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: '34rpx', fontWeight: 700, color: this.getScoreColor(dim.value) }}>{dim.value}</Text>
                  <Text className="text-xs text-muted" style={{ marginTop: '6rpx', display: 'block' }}>{dim.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 关键词 */}
          <View style={{ padding: '0 28rpx', marginTop: '28rpx' }}>
            <Text className="text-sm text-secondary" style={{ display: 'block', marginBottom: '14rpx' }}>岗位高频词</Text>
            <View className="flex-row" style={{ flexWrap: 'wrap', gap: '10rpx', justifyContent: 'center' }}>
              {keywords.map((kw, i) => (
                <View key={i} className={i % 3 === 0 ? 'tag-blue tag' : i % 3 === 1 ? 'tag-green tag' : 'tag-purple tag'}>
                  <Text>{kw}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 缺口分析 */}
          <View style={{ padding: '0 28rpx' }}>
            <Text className="section-title" style={{ display: 'block', marginTop: '16rpx' }}>缺口分析</Text>
            <View className="card">
              {gaps.map((gap, i) => (
                <View key={i}>
                  <View className="flex-between" style={{ alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text className="text-bold" style={{ fontSize: '27rpx', color: '#334155', display: 'block' }}>{gap.area}</Text>
                      <Text className="text-xs text-secondary" style={{ marginTop: '8rpx', display: 'block' }}>{gap.suggestion}</Text>
                    </View>
                    <View className={this.getSeverityTag(gap.severity) + ' tag'} style={{ marginLeft: '16rpx', flexShrink: 0 }}>
                      <Text>{this.getSeverityLabel(gap.severity)}</Text>
                    </View>
                  </View>
                  {i < gaps.length - 1 && <View className="divider" />}
                </View>
              ))}
            </View>
          </View>

          {/* 优化建议 */}
          <View style={{ padding: '0 28rpx' }}>
            <Text className="section-title" style={{ display: 'block', marginTop: '16rpx' }}>优化建议</Text>
            {optimizedBullets.map((item, i) => (
              <View key={i} className="card">
                <Text className="text-xs text-muted" style={{ display: 'block', marginBottom: '8rpx' }}>原文</Text>
                <View style={{ backgroundColor: '#fef2f2', border: '1rpx solid #fecaca', borderRadius: '12rpx', padding: '18rpx 20rpx', marginBottom: '16rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#991b1b', lineHeight: '1.7' }}>{item.original}</Text>
                </View>
                <View style={{ textAlign: 'center', margin: '12rpx 0' }}>
                  <Text className="text-sm" style={{ color: '#2563eb', fontWeight: 600 }}>↓ AI 优化 ↓</Text>
                </View>
                <Text className="text-xs text-muted" style={{ display: 'block', marginBottom: '8rpx' }}>优化后</Text>
                <View style={{ backgroundColor: '#ecfdf5', border: '1rpx solid #a7f3d0', borderRadius: '12rpx', padding: '18rpx 20rpx', marginBottom: '12rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: '#065f46', lineHeight: '1.7' }}>{item.optimized}</Text>
                </View>
                <Text className="text-xs text-muted" style={{ display: 'block', fontStyle: 'italic' }}>{item.reason}</Text>
              </View>
            ))}
          </View>
          <View style={{ height: '120rpx' }} />
        </View>
      )
    }

    // 输入模式
    return (
      <View className="page">
        <View className="page-header-bar">
          <View>
            <Text className="header-title-lg">JD 匹配优化</Text>
            <Text className="header-desc-sm">粘贴 JD，AI 分析匹配度并优化简历</Text>
          </View>
        </View>

        <View style={{ padding: '28rpx' }}>
          {/* 错误提示 */}
          {error ? (
            <View style={{ backgroundColor: '#fef2f2', border: '1rpx solid #fecaca', borderRadius: '12rpx', padding: '16rpx 20rpx', marginBottom: '20rpx' }}>
              <Text style={{ color: '#991b1b', fontSize: '25rpx' }}>{error}</Text>
            </View>
          ) : null}

          <View className="form-section">
            <Text className="form-label">粘贴岗位 JD *</Text>
            <Textarea
              className="form-textarea"
              value={jdText}
              onInput={this.onJDChange}
              placeholder={"将招聘网站的岗位描述（JD）复制粘贴到这里...\nAI 将自动提取关键要求并分析匹配度"}
              maxlength={10000}
              style={{ minHeight: '400rpx' }}
            />
          </View>

          <View className="tip-box">
            <Text className="tip-text">提示：完整的 JD 包含岗位职责、任职要求、加分项等信息</Text>
          </View>

          <View style={{ marginTop: '32rpx' }}>
            <View
              className="btn-primary"
              onClick={this.analyzeJD}
              style={{ opacity: jdText.trim() && !isAnalyzing ? 1 : 0.5 }}
            >
              <Text>{isAnalyzing ? '分析中...' : '开始分析'}</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
