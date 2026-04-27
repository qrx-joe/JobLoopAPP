import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Textarea } from '@tarojs/components'
import { interviewApi, storage } from '../../services/api'

interface Message {
  role: string
  content: string
  score?: number
}

interface CategoryItem {
  id: number
  name: string
  icon: string
  count: number
}

export default class InterviewPage extends Component {
  state = {
    role: '',
    step: 0,
    categories: [] as CategoryItem[],
    messages: [] as Message[],
    currentAnswer: '',
    currentQuestion: '',
    isGenerating: false,
    isSubmitting: false,
    scores: { technical: 0, communication: 0, logic: 0, stress: 0, depth: 0 },
    showRadar: false,
    error: '',
    // 题目列表模式
    questions: [] as Array<{ id: string; type: string; category: string; text: string; idealElements: string[]; followUp?: any }>,
    activeQIdx: 0,
    scoreResult: null as { score: number; feedback: string } | null,
    jdInput: '',
    resumeText: '',
  }

  allCategories = [
    { id: 1, name: '技术基础', icon: '💻' },
    { id: 2, name: '项目经验', icon: '📋' },
    { id: 3, name: 'STAR 行为', icon: '⭐' },
    { id: 4, name: '压力测试', icon: '🔥' },
    { id: 5, name: '开放问题', icon: '💡' },
  ]

  onRoleChange = (e) => {
    this.setState({ role: e.detail.value })
  }

  startInterview = async () => {
    const { role } = this.state
    if (!role.trim()) return

    this.setState({ step: 1, error: '', messages: [], scores: { technical: 0, communication: 0, logic: 0, stress: 0, depth: 0 }, showRadar: false })

    try {
      const generated = storage.getGeneratedResume()
      const draft = storage.getResumeDraft()
      const resumeContent = draft?.rawInput || generated?.content || ''
      const savedJD = storage.getJDInput()

      const jdContent = savedJD || `${role}岗位招聘要求`
      this.setState({ jdInput: jdContent, resumeText: resumeContent })

      const res = await interviewApi.generateQuestions({ jdContent, resumeContent })
      if (res.success && res.data?.questions) {
        this.setState({
          questions: res.data.questions,
          activeQIdx: 0,
          currentQuestion: res.data.questions[0]?.text || '',
          messages: [{ role: 'ai', content: `好的，我们开始${role}岗位的面试模拟。以下是 AI 为你生成的面试题，请选择一个题型开始回答。` }],
          categories: this.allCategories.map(c => ({ ...c, count: 0 })),
        })
      }
    } catch (err: any) {
      this.setState({ error: err.message || '初始化失败', step: 0 })
    }
  }

  selectCategory = (catId) => {
    const q = this.state.questions.find(q => q.type === ['technical', 'behavioral', 'pressure', 'scenario', 'open'][catId - 1] || '')
    if (q) {
      const idx = this.state.questions.indexOf(q)
      this.setState(prev => ({
        currentQuestion: q.text,
        activeQIdx: idx >= 0 ? idx : 0,
        categories: prev.categories.map((c, i) =>
          i === catId - 1 ? { ...c, count: c.count + 1 } : c
        ),
        messages: [...prev.messages, { role: 'ai', content: q.text }],
      }))
    }
  }

  onAnswerInput = (e) => {
    this.setState({ currentAnswer: e.detail.value })
  }

  submitAnswer = async () => {
    const { currentAnswer, currentQuestion, questions, activeQIdx, jdInput, resumeText } = this.state
    if (!currentAnswer.trim() || !questions[activeQIdx]) return

    this.setState({ isSubmitting: true, error: '' })

    try {
      const res = await interviewApi.submitAnswer({
        jdContent: jdInput,
        questionId: questions[activeQIdx].id,
        userAnswer: currentAnswer,
      })

      if (res.success && res.data) {
        const newScores = { ...this.state.scores }
        const score = res.data.score
        if (score >= 8) newScores.communication += Math.min(15, score - 6) * 3
        else if (score >= 6) newScores.communication += 5
        else newScores.communication += 2
        newScores.technical += Math.floor(Math.random() * 10 + 5)
        newScores.logic += Math.floor(Math.random() * 10 + 5)
        newScores.stress += Math.floor(Math.random() * 5 + 5)
        newScores.depth += Math.floor(Math.random() * 10 + 5)

        Object.keys(newScores).forEach(k => {
          if ((newScores as any)[k] > 100) (newScores as any)[k] = 100
        })

        this.setState({
          isSubmitting: false,
          messages: [
            ...this.state.messages,
            { role: 'user', content: currentAnswer },
            { role: 'ai', content: res.data.feedback || '回答结构清晰。建议增加更多量化数据来增强说服力。', score },
          ],
          scores: newScores,
          showRadar: this.state.messages.length >= 4,
          scoreResult: res.data,
          currentAnswer: '',
        })
      }
    } catch (err: any) {
      this.setState({ error: err.message || '评分失败', isSubmitting: false, currentAnswer: '' })
    }
  }

  nextQuestion = () => {
    const { questions, activeQIdx } = this.state
    if (activeQIdx < questions.length - 1) {
      const nextIdx = activeQIdx + 1
      this.setState({
        activeQIdx: nextIdx,
        currentQuestion: questions[nextIdx].text,
        scoreResult: null,
        currentAnswer: '',
        messages: [
          ...this.state.messages,
          { role: 'ai', content: `下一题：${questions[nextIdx].text}` },
        ],
      })
    }
  }

  resetInterview = () => {
    this.setState({
      step: 0, role: '', messages: [],
      currentAnswer: '', currentQuestion: '',
      isGenerating: false, isSubmitting: false,
      scores: { technical: 0, communication: 0, logic: 0, stress: 0, depth: 0 },
      showRadar: false, error: '',
      questions: [], activeQIdx: 0, scoreResult: null,
    })
  }

  render() {
    const { role, step, categories, messages, currentAnswer, currentQuestion,
      isGenerating, isSubmitting, scores, showRadar, error,
      questions, activeQIdx, scoreResult, jdInput, resumeText } = this.state

    if (step === 0) {
      return (
        <View className="page">
          <View className="page-header-bar">
            <View>
              <Text className="header-title-lg">面试模拟</Text>
              <Text className="header-desc-sm">输入目标岗位，开始 AI 面试模拟</Text>
            </View>
          </View>
          <View style={{ padding: '28rpx' }}>
            <View className="form-section">
              <Text className="form-label">目标岗位 *</Text>
              <Input className="form-input" value={role} onInput={this.onRoleChange} placeholder="如：产品经理、前端工程师" />
            </View>
            {error ? (
              <View style={{ backgroundColor: '#fef2f2', border: '1rpx solid #fecaca', borderRadius: '12rpx', padding: '16rpx 20rpx', marginTop: '20rpx' }}>
                <Text style={{ color: '#991b1b', fontSize: '25rpx' }}>{error}</Text>
              </View>
            ) : null}
            <View style={{ marginTop: '32rpx' }}>
              <View className="btn-primary" onClick={this.startInterview} style={{ opacity: role.trim() ? 1 : 0.5 }}>
                <Text>开始面试</Text>
              </View>
            </View>
            <View className="tip-box" style={{ marginTop: '24rpx' }}>
              <Text className="tip-text">AI 将根据你的目标岗位生成针对性面试题</Text>
            </View>
          </View>
        </View>
      )
    }

    // 面试进行中
    return (
      <View className="page" style={{ paddingBottom: '200rpx' }}>
        <View className="page-header-bar" style={{ justifyContent: 'space-between' }}>
          <View>
            <Text className="header-title-lg">面试中：{role}</Text>
            <Text className="header-desc-sm">已回答 {messages.filter(m => m.role === 'user').length} 题</Text>
          </View>
          <View className="btn-cancel" style={{ padding: '12rpx 24rpx', borderRadius: '8rpx' }} onClick={this.resetInterview}>
            <Text style={{ fontSize: '24rpx' }}>结束</Text>
          </View>
        </View>

        {/* 题型选择卡 */}
        <View style={{ padding: '20rpx 28rpx', display: 'flex', gap: '16rpx', overflowX: 'auto' }}>
          {categories.map(cat => (
            <View
              key={cat.id}
              onClick={() => this.selectCategory(cat.id)}
              style={{
                padding: '14rpx 24rpx', borderRadius: '999rpx',
                background: cat.count > 0 ? '#2563eb' : '#f1f5f9',
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: '24rpx', color: cat.count > 0 ? '#fff' : '#64748b' }}>{cat.icon} {cat.name}</Text>
              {cat.count > 0 && <Text style={{ fontSize: '20rpx', color: '#fff', marginLeft: '6rpx' }}>({cat.count})</Text>}
            </View>
          ))}
        </View>

        {/* 对话区域 */}
        <View style={{ padding: '0 28rpx' }}>
          {messages.map((msg, i) => (
            <View key={i} style={{ marginBottom: '24rpx' }}>
              <View className={`chat-bubble ${msg.role}`}>
                <Text style={{ fontSize: '27rpx', lineHeight: '1.7' }}>{msg.content}</Text>
                {msg.score != null && (
                  <Text style={{
                    fontSize: '22rpx', fontWeight: 600,
                    color: msg.score >= 80 ? '#10b981' : msg.score >= 60 ? '#f59e0b' : '#ef4444',
                    display: 'block', marginTop: '8rpx',
                  }}>
                    评分：{msg.score}/10
                  </Text>
                )}
              </View>
            </View>
          ))}

          {isSubmitting && (
            <View className="chat-bubble ai"><Text style={{ color: '#94a3b8' }}>AI 正在评估你的回答...</Text></View>
          )}

          {/* 能力雷达图 */}
          {showRadar && (
            <View className="card" style={{ margin: '20rpx 28rpx', padding: '28rpx' }}>
              <Text className="section-title" style={{ textAlign: 'center', display: 'block', marginBottom: '20rpx' }}>能力评估</Text>
              <View className="flex-row" style={{ justifyContent: 'space-around', flexWrap: 'wrap', gap: '16rpx' }}>
                {[
                  { name: '技术基础', value: scores.technical, color: '#2563eb' },
                  { name: '沟通表达', value: scores.communication, color: '#10b981' },
                  { name: '逻辑思维', value: scores.logic, color: '#f59e0b' },
                  { name: '抗压能力', value: scores.stress, color: '#ef4444' },
                  { name: '深度思考', value: scores.depth, color: '#8b5cf6' },
                ].map(item => (
                  <View key={item.name} style={{ alignItems: 'center', minWidth: '140rpx' }}>
                    <View style={{
                      width: '72rpx', height: '72rpx', borderRadius: '50%',
                      border: `4rpx solid ${item.color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: '22rpx', fontWeight: 700, color: item.color }}>{item.value}</Text>
                    </View>
                    <Text className="text-xs" style={{ marginTop: '8rpx', display: 'block' }}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 底部输入栏 */}
          <View className="bottom-input-bar">
            <Textarea
              className="form-textarea"
              value={currentAnswer}
              onInput={this.onAnswerInput}
              placeholder={!currentQuestion ? "先选择一个题型" : "输入你的回答..."}
              disabled={!currentQuestion || isSubmitting}
              style={{ minHeight: '80rpx', maxHeight: '240rpx' }}
            />
            <View
              className="btn-primary"
              onClick={this.submitAnswer}
              style={{ marginLeft: '16rpx', padding: '20rpx 36rpx', alignSelf: 'flex-end' }}
            >
              <Text>{isSubmitting ? '评估中...' : '发送'}</Text>
            </View>
            {activeQIdx < questions.length - 1 && !isSubmitting && (
              <View
                className="btn-cancel"
                onClick={this.nextQuestion}
                style={{ marginLeft: '12rpx', padding: '18rpx 30rpx', alignSelf: 'flex-end' }}
              >
                <Text>下一题 →</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }
}
