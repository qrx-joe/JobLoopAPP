import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image, Button, Input, Textarea } from '@tarojs/components'
import { saveResumeDraft, saveTargetRole, getTargetRole } from '@/utils/storage'

export default class IndexPage extends Component {
  state = {
    targetRole: '',
  }

  componentDidMount() {
    // 恢复之前保存的目标岗位
    const saved = getTargetRole()
    if (saved) this.setState({ targetRole: saved })
  }

  handleGenerate = () => {
    const { targetRole } = this.state
    if (!targetRole.trim()) {
      Taro.showToast({ title: '请输入目标岗位', icon: 'none' })
      return
    }
    saveTargetRole(targetRole)
    saveResumeDraft({
      rawInput: `目标岗位：${targetRole}`,
      inputMode: 'text',
      guidedAnswers: {},
    })

    Taro.navigateTo({ url: '/pages/resume/index?mode=guided' })
  }

  render() {
    const { targetRole } = this.state

    return (
      <View className="container">
        {/* Hero Section */}
        <View className="flex-col flex-center" style={{ paddingVertical: '80rpx' }}>
          <View style={{
            fontSize: '80rpx',
            marginBottom: '24rpx',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            🔄 JobLoop
          </View>
          <Text style={{ fontSize: '32rpx', color: '#6b7280', textAlign: 'center' }}>
            让普通人变得可被录用
          </Text>
        </View>

        {/* Quick Input */}
        <View className="card">
          <Text className="section-title">🎯 快速开始</Text>
          <Text className="section-desc">输入你想要应聘的岗位，AI 将帮你生成专业简历</Text>
          
          <Input
            className="input-area"
            style={{ minHeight: '88rpx' }}
            placeholder="例如：前端开发工程师、产品经理、数据分析师..."
            value={targetRole}
            onInput={(e) => this.setState({ targetRole: e.detail.value })}
          />

          <Button className="btn-primary mt-4" onClick={this.handleGenerate}>
            ✨ 开始创建简历
          </Button>

          <View style={{ borderTop: '2rpx solid #e5e7eb', marginTop: '40rpx', paddingTop: '32rpx' }}>
            <Button
              style={{ background: '#fff', border: '2rpx solid #e5e7eb', color: '#374151' }}
              size="default"
              onClick={() => Taro.switchTab({ url: '/pages/resume/index' })}
            >
              📝 手动输入经历
            </Button>
          </View>
        </View>

        {/* Feature Cards */}
        <View className="grid grid-cols-2 gap-3 mt-4">
          {[
            { title: 'JD 匹配分析', desc: '对比岗位要求，找出差距', icon: '📊', url: '/pages/jd/index' },
            { title: '面试模拟练习', desc: 'AI 出题 + 实时反馈', icon: '💬', url: '/pages/interview/index' },
            { title: '面试复盘', desc: '回忆记录，AI 分析改进', icon: '📝', url: '/pages/interview/index?mode=review' },
            { title: '文件上传解析', desc: 'PDF/DOCX 一键提取内容', icon: '📎', url: '/pages/resume/index?mode=file' },
          ].map((item) => (
            <View key={item.title} 
              className="card flex-col"
              style={{ minHeight: '200rpx', justifyContent: 'center' }} 
              onTap={() => item.url.startsWith('/pages/interview')
                ? Taro.switchTab({ url: '/pages/interview/index' })
                : Taro.switchTab({ url: item.url })
              }
            >
              <Text style={{ fontSize: '48rpx', marginBottom: '16rpx' }}>{item.icon}</Text>
              <Text style={{ fontWeight: '600', fontSize: '28rpx', marginBottom: '8rpx' }}>{item.title}</Text>
              <Text style={{ fontSize: '22rpx', color: '#9ca3af' }}>{item.desc}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View className="mt-4 text-center text-xs text-muted">
          <Text>本内容由 AI 辅助生成，请核实后使用</Text>
          <Text>Powered by JobLoop AI</Text>
        </View>
      </View>
    )
  }
}
