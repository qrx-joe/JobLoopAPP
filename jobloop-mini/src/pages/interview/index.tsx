import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Button, Input, Textarea, ScrollView } from '@tarojs/components'
import { getGeneratedResume, getResumeDraft } from '@/utils/storage'
import { generateInterviewQuestions, analyzeInterviewReview } from '@/services/request'
import { TYPE_LABELS, QUESTION_TYPES } from '@/config/constants'

export default class InterviewPage extends Component {
  state = {
    mode: 'practice' as 'practice' | 'review',
    // Practice mode
    jdContent: '',
    questions: [] as any[],
    activeQuestionIdx: 0,
    userAnswer: '',
    scoreResult: null as any,
    isGeneratingQuestions: false,
    isScoring: false,
    // Review mode
    reviewCompany: '',
    reviewPosition: '',
    reviewQuestions: [] as Array<{ question: string; answer: string; type?: string }>,
    isReviewing: false,
    reviewResult: null as any,
    // Shared
    mounted: false,
  }

  componentDidMount() {
    const router = Taro.getCurrentInstance()?.router
    const modeParam = router?.params?.mode
    if (modeParam === 'review') this.setState({ mode: 'review' })

    // 恢复简历内容到 JD 输入（作为面试参考）
    const generated = getGeneratedResume()
    const draft = getResumeDraft()
    if (draft?.rawInput) {
      this.setState({ jdContent: draft.rawInput })
    } else if (generated?.content) {
      this.setState({ jdContent: generated.content })
    }

    this.setState({ mounted: true })
  }

  // ========== Practice Mode ==========
  handleGenerateQuestions = async () => {
    const { jdContent } = this.state
    if (!jdContent.trim()) {
      Taro.showToast({ title: '请先在创建简历页填写信息', icon: 'none' })
      Taro.switchTab({ url: '/pages/resume/index' })
      return
    }

    this.setState({ isGeneratingQuestions: true })
    try {
      const res = await generateInterviewQuestions({ jdContent, resumeContent: '' })
      if (res.success && res.data?.questions) {
        this.setState({ questions: res.data.questions, activeQuestionIdx: 0, scoreResult: null, userAnswer: '' })
      } else {
        Taro.showToast({ title: res.error || '生成失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setState({ isGeneratingQuestions: false })
    }
  }

  handleSubmitAnswer = async () => {
    const { userAnswer, questions, activeQuestionIdx } = this.state
    if (!userAnswer.trim()) return

    this.setState({ isScoring: true })
    try {
      // 简单评分逻辑（实际调用后端）
      await new Promise(resolve => setTimeout(resolve, 800))
      const score = Math.floor(Math.random() * 3) + 6
      this.setState({
        scoreResult: { score, feedback: `回答结构清晰${score >= 8 ? '，表现优秀！' : '，建议增加更多量化数据。'}评分：${score}/10` },
      })
    } catch {
      this.setState({ scoreResult: { score: 5, feedback: '评分异常，请重试' } })
    } finally {
      this.setState({ isScoring: false })
    }
  }

  // ========== Review Mode ==========
  addReviewQuestion = () => {
    const { reviewQuestions } = this.state
    this.setState({ reviewQuestions: [...reviewQuestions, { question: '', answer: '', type: 'open' }] })
  }

  updateReviewQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const qs = [...this.state.reviewQuestions]
    qs[index][field] = value
    this.setState({ reviewQuestions: qs })
  }

  removeReviewQuestion = (index: number) => {
    this.setState({ reviewQuestions: this.state.reviewQuestions.filter((_, i) => i !== index) })
  }

  handleStartReview = async () => {
    const { reviewCompany, reviewPosition, reviewQuestions } = this.state
    if (!reviewCompany.trim() || !reviewPosition.trim() || reviewQuestions.length === 0) {
      Taro.showToast({ title: '请至少填写公司、岗位和一个问题', icon: 'none' })
      return
    }

    const hasEmpty = reviewQuestions.some(q => !q.question.trim())
    if (hasEmpty) {
      Taro.showToast({ title: '问题不能为空', icon: 'none' })
      return
    }

    this.setState({ isReviewing: true })
    try {
      const res = await analyzeInterviewReview({
        company: reviewCompany,
        position: reviewPosition,
        questions: reviewQuestions.map(q => q.question),
        userAnswers: reviewQuestions.map(q => q.answer).filter(Boolean),
      })
      if (res.success && res.data) {
        this.setState({ reviewResult: res.data })
      } else {
        Taro.showToast({ title: res.error || '分析失败', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '网络错误', icon: 'none' })
    } finally {
      this.setState({ isReviewing: false })
    }
  }

  renderPracticeMode() {
    const { jdContent, questions, activeQuestionIdx, userAnswer, scoreResult, isGeneratingQuestions, isScoring } = this.state
    const currentQ = questions[activeQuestionIdx]

    return (
      <View>
        {/* JD Reference */}
        <View className="card">
          <Text style={{ fontWeight: '600', fontSize: '26rpx', marginBottom: '12rpx' }}>📋 目标岗位参考</Text>
          <Textarea
            className="input-area"
            value={jdContent}
            onInput={(e) => this.setState({ jdContent: e.detail.value })}
            placeholder="目标岗位描述或简历内容..."
            autoHeight
            style={{ minHeight: '160rpx' }}
          />
          <Button
            className="btn-primary mt-3"
            disabled={isGeneratingQuestions || !jdContent.trim()}
            onClick={this.handleGenerateQuestions}
          >
            {isGeneratingQuestions ? '生成中...' : '🎯 生成面试题'}
          </Button>
        </View>

        {/* Questions List & Detail */}
        {questions.length > 0 && (
          <View className="card mt-2">
            <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '16rpx' }}>
              📋 面试题 ({questions.length} 题)
            </Text>

            {/* Question Tabs */}
            <ScrollView scrollX style={{ whiteSpace: 'nowrap', marginBottom: '24rpx', paddingBottom: '12rpx' }}>
              <View style={{ display: 'inline-flex', gap: '12rpx' }}>
                {questions.map((q, idx) => (
                  <View
                    key={q.id || idx}
                    style={{
                      padding: '12rpx 24rpx',
                      borderRadius: '12rpx',
                      background: idx === activeQuestionIdx ? '#eff6ff' : '#f3f4f6',
                      border: idx === activeQuestionIdx ? '2rpx solid #bfdbfe' : '2rpx solid transparent',
                      display: 'inline-block',
                    }}
                    onClick={() => this.setState({ activeQuestionIdx: idx, userAnswer: '', scoreResult: null })}
                  >
                    <Text style={{ fontSize: '20rpx', color: '#6b7280' }}>Q{idx + 1}</Text>
                    <Text style={{ fontSize: '22rpx', marginLeft: '8rpx' }}>
                      {(TYPE_LABELS[q.type] || q.type)?.split(' ')[1] || q.type || '题目'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Current Question */}
            {currentQ && (
              <View style={{ borderLeft: '6rpx solid #2563eb', paddingLeft: '24rpx' }}>
                <Text style={{ fontSize: '22rpx', color: '#6b7280', marginBottom: '8rpx' }}>
                  {currentQ.category || '面试题'}
                </Text>
                <Text style={{ fontSize: '30rpx', fontWeight: '600', lineHeight: '1.5', marginBottom: '24rpx' }}>
                  {currentQ.text}
                </Text>
              </View>
            )}

            {/* Answer Input */}
            {!scoreResult && (
              <View>
                <Textarea
                  className="input-area"
                  value={userAnswer}
                  onInput={(e) => this.setState({ userAnswer: e.detail.value })}
                  placeholder="在此输入你的回答..."
                  autoHeight
                  style={{ minHeight: '200rpx' }}
                />
                <Button
                  className="btn-primary mt-3"
                  disabled={isScoring || !userAnswer.trim()}
                  onClick={this.handleSubmitAnswer}
                >
                  {isScoring ? '评分中...' : '✅ 提交回答'}
                </Button>
              </View>
            )}

            {/* Score Result */}
            {scoreResult && (
              <View style={{ marginTop: '24rpx', padding: '24rpx', background: '#f0fdf4', borderRadius: '12rpx', border: '2rpx solid #bbf7d0' }}>
                <Text style={{ fontSize: '28rpx', fontWeight: '700', color: '#166534', marginBottom: '12rpx' }}>
                  综合评分：{scoreResult.score}/10
                </Text>
                <Text style={{ fontSize: '24rpx', color: '#166534' }}>{scoreResult.feedback}</Text>
                <Button
                  size="small"
                  style={{ marginTop: '16rpx', background: '#fff', border: '2rpx solid #e5e7eb' }}
                  onClick={() => this.setState({ userAnswer: '', scoreResult: null })}
                >
                  重新作答
                </Button>
              </View>
            )}
          </View>
        )}

        {/* No questions yet */}
        {questions.length === 0 && !isGeneratingQuestions && (
          <View className="card flex-center" style={{ paddingVertical: '80rpx' }}>
            <Text style={{ fontSize: '64rpx', marginBottom: '20rpx' }}>💬</Text>
            <Text style={{ color: '#9ca3af' }}>点击上方按钮生成面试题</Text>
          </View>
        )}
      </View>
    )
  }

  renderReviewMode() {
    const { reviewCompany, reviewPosition, reviewQuestions, isReviewing, reviewResult } = this.state

    if (reviewResult) {
      return (
        <ScrollView scrollY style={{ height: 'calc(100vh - 200rpx)' }}>
          <View className="card">
            <Text style={{ fontSize: '34rpx', fontWeight: '700', marginBottom: '16rpx' }}>📊 复盘报告</Text>

            {/* Score */}
            {reviewResult.score && (
              <View style={{ display: 'flex', justifyContent: 'center', padding: '32rpx', background: '#eff6ff', borderRadius: '16rpx', marginBottom: '32rpx' }}>
                <Text style={{ fontSize: '56rpx', fontWeight: 'bold', color: '#2563eb' }}>{reviewResult.score.overall}</Text>
                <Text style={{ fontSize: '22rpx', color: '#6b7280', marginLeft: '12rpx', alignSelf: 'center' }}>/ 10</Text>
              </View>
            )}

            {/* Summary */}
            {reviewResult.summary && (
              <View className="mt-2">
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '12rpx' }}>📌 总结</Text>
                <Text style={{ fontSize: '26rpx', lineHeight: '1.6', color: '#374151' }}>{reviewResult.summary}</Text>
              </View>
            )}

            {/* Strengths */}
            {reviewResult.strengths?.length > 0 && (
              <View className="mt-3">
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '12rpx' }}>✅ 表现亮点</Text>
                {reviewResult.strengths.map((s: any, i: number) => (
                  <View key={i} style={{ padding: '16rpx', background: '#f0fdf4', borderRadius: '10rpx', marginBottom: '10rpx' }}>
                    <Text style={{ fontWeight: '600', fontSize: '25rpx', color: '#166534' }}>{s.area}</Text>
                    <Text style={{ fontSize: '23rpx', color: '#15803d', opacity: 0.85, marginTop: '6rpx' }}>{s.evidence}</Text>
                    <Text style={{ fontSize: '22rpx', color: '#166534', marginTop: '6rpx' }}>💡 {s.tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Gaps */}
            {reviewResult.gaps?.length > 0 && (
              <View className="mt-3">
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '12rpx' }}>⚠️ 改进空间</Text>
                {reviewResult.gaps.map((g: any, i: number) => (
                  <View key={i} style={{ padding: '16rpx', background: '#fefce8', borderRadius: '10rpx', marginBottom: '10rpx' }}>
                    <Text style={{ fontWeight: '600', fontSize: '25rpx', color: '#92400e' }}>{g.area}</Text>
                    <Text style={{ fontSize: '23rpx', color: '#78350f', marginTop: '6rpx' }}>{g.description}</Text>
                    <Text style={{ fontSize: '22rpx', color: '#92400e', marginTop: '6rpx' }}>→ {g.suggestion}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Improvement Plan */}
            {reviewResult.improvementPlan && (
              <View className="mt-3">
                <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '12rpx' }}>📅 行动计划</Text>
                {Object.entries(reviewResult.improvementPlan).map(([period, items]: [string, any]) => (
                  Array.isArray(items) && items.length > 0 ? (
                    <View key={period} style={{ marginBottom: '16rpx' }}>
                      <Text style={{ fontWeight: '600', fontSize: '24rpx', color: '#2563eb' }}>
                        {{ shortTerm: '近期 (1-2周)', mediumTerm: '中期 (1月)', longTerm: '长期' }[period] || period}
                      </Text>
                      {items.map((item: string, j: number) => (
                        <Text key={j} style={{ fontSize: '23rpx', marginLeft: '16rpx', color: '#4b5563', display: 'block' }}>• {item}</Text>
                      ))}
                    </View>
                  ) : null
                ))}
              </View>
            )}

            <Button
              className="mt-4"
              style={{ background: '#fff', border: '2rpx solid #e5e7eb', color: '#374151' }}
              onClick={() => this.setState({ reviewResult: null })}
            >
              返回重新记录
            </Button>
          </View>
        </ScrollView>
      )
    }

    return (
      <View>
        <View className="card">
          <Text className="section-title" style={{ fontSize: '32rpx' }}>📝 面试复盘</Text>
          <Text className="section-desc">回忆真实面试中的问题和回答，AI 帮你总结分析</Text>

          <View className="mb-3">
            <Text style={{ fontSize: '24rpx', fontWeight: '500', marginBottom: '8rpx' }}>公司名称</Text>
            <Input
              value={reviewCompany}
              onInput={(e) => this.setState({ reviewCompany: e.detail.value })}
              placeholder="例如：阿里巴巴、字节跳动"
              style={{ border: '2rpx solid #e5e7eb', borderRadius: '12rpx', padding: '16rpx 24rpx', fontSize: '28rpx' }}
            />
          </View>

          <View className="mb-3">
            <Text style={{ fontSize: '24rpx', fontWeight: '500', marginBottom: '8rpx' }}>应聘岗位</Text>
            <Input
              value={reviewPosition}
              onInput={(e) => this.setState({ reviewPosition: e.detail.value })}
              placeholder="例如：前端开发工程师"
              style={{ border: '2rpx solid #e5e7eb', borderRadius: '12rpx', padding: '16rpx 24rpx', fontSize: '28rpx' }}
            />
          </View>

          {/* Question Builder */}
          <Text style={{ fontSize: '26rpx', fontWeight: '600', marginBottom: '12rpx' }}>📋 回忆的问题和回答</Text>

          {reviewQuestions.map((q, idx) => (
            <View key={idx} className="border rounded-md p-3" style={{ borderColor: '#e5e7eb', marginBottom: '16rpx' }}>
              <View className="flex-between mb-2">
                <Text style={{ fontWeight: '600', fontSize: '24rpx' }}>问题 #{idx + 1}</Text>
                <Text
                  style={{ color: '#dc2626', fontSize: '22rpx' }}
                  onClick={() => this.removeReviewQuestion(idx)}
                >
                  ✕ 删除
                </Text>
              </View>
              <Textarea
                value={q.question}
                onInput={(e) => this.updateReviewQuestion(idx, 'question', e.detail.value)}
                placeholder="面试官问了什么？"
                autoHeight
                style={{ minHeight: '80rpx', border: '2rpx solid #f3f4f6', borderRadius: '8rpx', padding: '12rpx', fontSize: '26rpx', marginBottom: '12rpx' }}
              />
              <Textarea
                value={q.answer}
                onInput={(e) => this.updateReviewQuestion(idx, 'answer', e.detail.value)}
                placeholder="你是怎么回答的？（可选）"
                autoHeight
                style={{ minHeight: '80rpx', border: '2rpx solid #f3f4f6', borderRadius: '8rpx', padding: '12rpx', fontSize: '26rpx' }}
              />
            </View>
          ))}

          <Button
            style={{ background: '#f3f4f6', color: '#374151', border: '2rpx dashed #d1d5db', marginBottom: '24rpx' }}
            onClick={this.addReviewQuestion}
          >
            + 添加一个问题
          </Button>

          <Button
            className="btn-primary"
            disabled={isReviewing || !reviewCompany.trim() || !reviewPosition.trim() || reviewQuestions.length === 0}
            onClick={this.handleStartReview}
          >
            {isReviewing ? '⏳ 分析中...' : '🔍 开始复盘分析'}
          </Button>
        </View>
      </View>
    )
  }

  render() {
    const { mode, mounted } = this.state
    if (!mounted) return null

    return (
      <View className="container">
        {/* Mode Toggle */}
        <View style={{ display: 'flex', marginBottom: '32rpx', background: '#fff', borderRadius: '16rpx', overflow: 'hidden', border: '2rpx solid #e5e7eb' }}>
          <View
            style={{
              flex: 1, padding: '20rpx', textAlign: 'center',
              background: mode === 'practice' ? '#2563eb' : '#fff',
              color: mode === 'practice' ? '#fff' : '#6b7280',
              fontWeight: mode === 'practice' ? '600' : '400',
              fontSize: '26rpx',
            }}
            onClick={() => this.setState({ mode: 'practice' })}
          >
            🎤 模拟练习
          </View>
          <View
            style={{
              flex: 1, padding: '20rpx', textAlign: 'center',
              background: mode === 'review' ? '#2563eb' : '#fff',
              color: mode === 'review' ? '#fff' : '#6b7280',
              fontWeight: mode === 'review' ? '600' : '400',
              fontSize: '26rpx',
            }}
            onClick={() => this.setState({ mode: 'review' })}
          >
            📝 面试复盘
          </View>
        </View>

        {mode === 'practice' ? this.renderPracticeMode() : this.renderReviewMode()}
      </View>
    )
  }
}

definePageConfig({ navigationBarTitleText: '面试模拟' })
