import { Component } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Button, Textarea, ScrollView, Image } from '@tarojs/components'
import {
  saveResumeDraft,
  getResumeDraft,
  saveGeneratedResume,
  getGeneratedResume,
  saveTargetRole,
} from '@/utils/storage'
import { generateResume } from '@/services/request'

export default class ResumePage extends Component {
  state = {
    activeTab: 'text' as 'text' | 'guided' | 'file',
    rawInput: '',
    currentStep: 0,
    guidedAnswers: {} as Record<string, string>,
    isGenerating: false,
    generatedContent: null as string | null,
    error: null as string | null,
    modeFromUrl: '' as string,
  }

  router = useRouter()

  componentDidMount() {
    const router = Taro.getCurrentInstance().router
    const mode = (router?.params?.mode) || ''
    this.setState({ modeFromUrl: mode || 'text', activeTab: (mode === 'guided' ? 'guided' : mode) || 'text' })

    // 恢复草稿
    const draft = getResumeDraft()
    if (draft?.rawInput) {
      this.setState({
        rawInput: draft.rawInput,
        activeTab: draft.inputMode || 'text',
        guidedAnswers: draft.guidedAnswers || {},
      })
    }

    // 恢复已生成内容
    const generated = getGeneratedResume()
    if (generated?.content) {
      this.setState({ generatedContent: generated.content })
    }
  }

  handleGenerate = async () => {
    const { rawInput, activeTab, guidedAnswers } = this.state
    if (!rawInput.trim()) return

    this.setState({ isGenerating: true, error: null })
    saveResumeDraft({ rawInput, inputMode: activeTab, guidedAnswers })

    try {
      const res = await generateResume({
        userInput: rawInput,
        inputMode: activeTab,
        guidedAnswers,
      })

      if (res.success && res.data?.content) {
        const contentStr = JSON.stringify(res.data.content, null, 2)
        this.setState({ generatedContent: contentStr })
        saveGeneratedResume({ content: contentStr, generatedAt: Date.now() })
      } else {
        this.setState({ error: res.error || '生成失败，请重试' })
      }
    } catch (e) {
      this.setState({ error: '网络错误，请检查连接后重试' })
    } finally {
      this.setState({ isGenerating: false })
    }
  }

  handleGuidedNext = () => {
    const { currentStep, guidedAnswers } = this.state
    if (currentStep < GUIDED_STEPS.length - 1) {
      this.setState({ currentStep: currentStep + 1 })
    } else {
      const combined = Object.values(guidedAnswers).join('\n')
      this.setState({ rawInput: combined, activeTab: 'text' })
    }
  }

  navigateToJD = () => {
    saveGeneratedResume({ content: this.state.generatedContent!, generatedAt: Date.now() })
    saveResumeDraft({ rawInput: this.state.rawInput, inputMode: this.state.activeTab, guidedAnswers: this.state.guidedAnswers })
    Taro.switchTab({ url: '/pages/jd/index' })
  }

  navigateToInterview = () => {
    saveGeneratedResume({ content: this.state.generatedContent!, generatedAt: Date.now() })
    saveResumeDraft({ rawInput: this.state.rawInput, inputMode: this.state.activeTab, guidedAnswers: this.state.guidedAnswers })
    Taro.switchTab({ url: '/pages/interview/index' })
  }

  render() {
    const { activeTab, rawInput, currentStep, guidedAnswers, isGenerating, generatedContent, error } = this.state
    const step = GUIDED_STEPS[currentStep]

    return (
      <View className="container">
        {/* Header */}
        <Text className="section-title">创建简历</Text>
        <Text className="section-desc">选择一种方式开始你的简历</Text>

        {/* Tab Selector */}
        <View className="flex-row gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
          {[
            { id: 'text' as const, label: '自由输入' },
            { id: 'guided' as const, label: '引导式' },
            { id: 'file' as const, label: '上传文件' },
          ].map(tab => (
            <View
              key={tab.id}
              className="px-4 py-2"
              style={{
                background: activeTab === tab.id ? '#2563eb' : '#f3f4f6',
                color: activeTab === tab.id ? '#fff' : '#374151',
                borderRadius: '16rpx',
                fontSize: '24rpx',
              }}
              onClick={() => this.setState({ activeTab: tab.id })}
            >
              {tab.label}
            </View>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView scrollY style={{ maxHeight: '800rpx' }}>
          {/* Text Mode */}
          {activeTab === 'text' && (
            <View className="card">
              <Text style={{ fontSize: '26rpx', fontWeight: '600', marginBottom: '16rpx' }}>输入你的经历</Text>
              <Textarea
                className="input-area"
                value={rawInput}
                onInput={(e) => this.setState({ rawInput: e.detail.value })}
                placeholder="粘贴你的经历信息...\n\n示例：我在XX公司做了两年运营，负责公众号内容运营..."
                autoHeight
                maxlength={5000}
              />
              <Button className="btn-primary mt-4" disabled={isGenerating || !rawInput.trim()} onClick={this.handleGenerate}>
                {isGenerating ? '正在生成...' : '✨ 生成简历'}
              </Button>
            </View>
          )}

          {/* Guided Mode */}
          {activeTab === 'guided' && (
            <View className="card">
              <View className="flex-between mb-4">
                <Text style={{ color: '#9ca3af', fontSize: '24rpx' }}>
                  步骤 {currentStep + 1} / {GUIDED_STEPS.length}
                </Text>
                <View className="flex-row gap-1">
                  {GUIDED_STEPS.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: '20rpx',
                        height: '20rpx',
                        borderRadius: '50%',
                        background: i <= currentStep ? '#2563eb' : '#d1d5db',
                      }}
                    />
                  ))}
                </View>
              </View>

              <Text style={{ fontSize: '32rpx', fontWeight: '600', marginBottom: '24rpx' }}>
                {step.question}
              </Text>

              <Textarea
                className="input-area"
                value={guidedAnswers[step.key] || ''}
                onInput={(e) =>
                  this.setState({
                    guidedAnswers: { ...guidedAnswers, [step.key]: e.detail.value },
                  })
                }
                placeholder={step.placeholder}
                autoHeight
              />

              <View className="flex-between mt-4">
                {currentStep > 0 && (
                  <Button
                    size="mini"
                    onClick={() => this.setState({ currentStep: currentStep - 1 })}
                    style={{ background: '#fff', border: '2rpx solid #e5e7eb', color: '#374151' }}
                  >上一步</Button>
                )}
                <Button
                  size="mini"
                  type="primary"
                  onClick={this.handleGuidedNext}
                  disabled={!guidedAnswers[step.key]?.trim()}
                >
                  {currentStep === GUIDED_STEPS.length - 1 ? '完成并生成' : '下一步'}
                </Button>
              </View>
            </View>
          )}

          {/* File Upload Mode */}
          {activeTab === 'file' && (
            <View className="card flex-col flex-center" style={{ paddingVertical: '80rpx' }}>
              <Text style={{ fontSize: '80rpx', marginBottom: '24rpx' }}>📄</Text>
              <Text style={{ fontWeight: '600', fontSize: '30rpx', marginBottom: '12rpx' }}>上传简历文件</Text>
              <Text style={{ fontSize: '24rpx', color: '#9ca3af', textAlign: 'center', marginBottom: '32rpx' }}>
                支持 PDF、DOCX、TXT 格式{'\n'}文件内容将被自动解析提取
              </Text>
              <Button type="primary" openType="chooseMessageFile">
                选择文件上传
              </Button>
              <Text style={{ fontSize: '22rpx', color: '#f59e0b', marginTop: '24rpx' }}>
                💡 小程序端文件上传需后端支持文件接收接口
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Error */}
        {error && (
          <View style={{
            marginTop: '24rpx',
            padding: '20rpx',
            borderRadius: '12rpx',
            background: '#fef2f2',
            border: '2rpx solid #fecaca',
            color: '#dc2626',
            fontSize: '24rpx',
          }}>
            警告：{error}
          </View>
        )}

        {/* Result Preview */}
        {generatedContent && !isGenerating && (
          <View className="card mt-2">
            <View className="flex-between mb-3">
              <Text style={{ fontWeight: '600' }}>✅ 简历预览</Text>
              <Text style={{
                padding: '4rpx 16rpx',
                borderRadius: '999rpx',
                background: '#dcfce7',
                color: '#16a34a',
                fontSize: '20rpx',
              }}>已生成</Text>
            </View>

            <ScrollView scrollY style={{ maxHeight: '400rpx', background: '#f9fafb', borderRadius: '12rpx', padding: '24rpx' }}>
              <Text style={{ fontSize: '22rpx', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {generatedContent.slice(0, 2000)}{generatedContent.length > 2000 ? '\n...(已截断)' : ''}
              </Text>
            </ScrollView>

            {/* Navigation Buttons */}
            <View className="mt-4 gap-3 flex-col">
              <Button style={{ background: '#16a34a' }} onClick={this.navigateToJD}>
                JD优化 →
              </Button>
              <Button style={{ background: '#7c3aed' }} onClick={this.navigateToInterview}>
                面试模拟 →
              </Button>
            </View>
          </View>
        )}

        {/* Loading */}
        {isGenerating && !generatedContent && (
          <View className="card flex-center" style={{ paddingVertical: '60rpx' }}>
            <View className="loading-spinner" />
            <Text style={{ color: '#6b7280', marginTop: '24rpx' }}>AI 正在分析你的经历...</Text>
          </View>
        )}
      </View>
    )
  }
}

// Import at bottom to avoid circular deps
import { GUIDED_STEPS } from '@/config/constants'
function getTargetRole() {
  try { return require('@/utils/storage').getTargetRole() } catch { return '' }
}

definePageConfig({ navigationBarTitleText: '创建简历' })
