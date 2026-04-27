import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Textarea } from '@tarojs/components'

export default class IndexPage extends Component {
  state = {
    experience: '',
    activeTab: 0,
    tabs: ['直接输入', '引导创建'],
  }

  onExperienceChange = (e) => {
    this.setState({ experience: e.detail.value })
  }

  switchTab = (idx) => {
    this.setState({ activeTab: idx })
  }

  generateResume = () => {
    const { experience } = this.state
    if (!experience.trim()) return
    Taro.navigateTo({ url: '/pages/resume/index?exp=' + encodeURIComponent(experience) })
  }

  render () {
    const { experience, activeTab, tabs } = this.state

    return (
      <View className="page">
        {/* Header */}
        <View className="card" style={{ marginTop: '24rpx', paddingTop: '40rpx', paddingBottom: '36rpx' }}>
          <Text className="section-title" style={{ textAlign: 'center', display: 'block' }}>JobLoop AI</Text>
          <Text className="section-desc" style={{ textAlign: 'center' }}>把你的经历变成能拿 offer 的简历</Text>
        </View>

        {/* Tab Switch */}
        <View className="tab-strip">
            {tabs.map((tab, idx) => (
              <View key={idx} className="tab-item-flex" onClick={() => this.switchTab(idx)}>
                <Text className={activeTab === idx ? 'tab-item-text-active' : 'tab-item-text'}>{tab}</Text>
                {activeTab === idx && <View className="tab-active-line" />}
              </View>
            ))}
          </View>

        {/* Main Content */}
        <View style={{ padding: '28rpx' }}>
          {activeTab === 0 ? (
            <>
              <View className="form-section">
                <Text className="form-label">你的经历</Text>
                <Textarea
                  className="input-area"
                  value={experience}
                  onInput={this.onExperienceChange}
                  placeholder="描述你的工作/实习/项目经历...&#10;例如：在XX公司做了3个月运营，负责社群管理，用户从500增长到2000"
                  maxlength={2000}
                />
              </View>

              <View className="tip-box">
                <Text className="tip-text">提示：写得越详细，生成的简历质量越高</Text>
              </View>

              {/* Example */}
              <View className="card" style={{ backgroundColor: '#f8fafc', border: '2rpx dashed #cbd5e1' }}>
                <Text className="text-sm text-secondary" style={{ display: 'block', marginBottom: '12rpx' }}>示例输入</Text>
                <Text className="text-xs text-muted" style={{ display: 'block', lineHeight: '1.7' }}>大学期间做过校园公众号运营，负责每周推文撰写和排版，粉丝数从0做到8000，策划过一次迎新活动吸引300+新生关注...</Text>
              </View>
            </>
          ) : (
            <>
              {/* Guide Wizard Steps */}
              {['最近一段经历是什么？(工作/实习/项目/校园)', '你在其中承担了什么职责？', '你做了哪些具体的事情？', '结果如何？有什么可量化的成果？'].map((step, idx) => (
                <View key={idx} className="form-section">
                  <View className="flex-row" style={{ marginBottom: '16rpx' }}>
                    <View style={{
                      width: '44rpx',
                      height: '44rpx',
                      borderRadius: '50%',
                      background: idx === 0 ? '#2563eb' : '#e2e8f0',
                      color: '#fff',
                      fontSize: '24rpx',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '16rpx',
                      flexShrink: 0,
                    }}>
                      <Text style={{ color: '#fff' }}>{idx + 1}</Text>
                    </View>
                    <Text className="text-bold" style={{ fontSize: '26rpx', lineHeight: '44rpx', color: '#334155' }}>{step}</Text>
                  </View>
                  <Textarea
                    className="form-textarea"
                    placeholder="请输入..."
                    style={{ minHeight: idx === 3 ? '240rpx' : '160rpx' }}
                  />
                </View>
              ))}

              <View className="tip-box">
                <Text className="tip-text">引导模式帮你一步步梳理经历，不会漏掉亮点</Text>
              </View>
            </>
          )}

          {/* Generate Button */}
          <View style={{ marginTop: '32rpx' }}>
            <View
              className={experience.trim() || activeTab === 1 ? 'btn-primary' : 'btn-primary'}
              onClick={this.generateResume}
              style={{ opacity: (!experience.trim() && activeTab === 0) ? 0.5 : 1 }}
            >
              <Text>生成简历</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}
