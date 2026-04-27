import { Component } from 'react'
import { View, Text, Input, Textarea } from '@tarojs/components'

interface ResumeItem {
  title: string
  role: string
  achievements: string[]
}

export default class ResumePage extends Component {
  state = {
    activeTab: 0,
    tabs: ['文本输入', '上传文件', '引导式'],
    experience: '',
    name: '',
    targetRole: '',
    isGenerating: false,
    resumeItems: [] as ResumeItem[],
    skills: [] as string[],
    showResult: false,
  }

  switchTab = (idx) => {
    this.setState({ activeTab: idx })
  }

  onExperienceChange = (e) => {
    this.setState({ experience: e.detail.value })
  }

  onNameChange = (e) => {
    this.setState({ name: e.detail.value })
  }

  onTargetRoleChange = (e) => {
    this.setState({ targetRole: e.detail.value })
  }

  generateResume = () => {
    const { experience, activeTab } = this.state
    if (!experience.trim() && activeTab === 0) return
    if (activeTab === 1 || activeTab === 2 || experience.trim()) {
      this.setState({ isGenerating: true })
      setTimeout(() => {
        this.setState({
          isGenerating: false,
          showResult: true,
          resumeItems: [
            { title: '校园公众号运营', role: '内容运营实习生', achievements: [
              '独立负责公众号推文撰写与排版，累计发布原创文章 40+ 篇',
              '通过选题优化和社群推广，3 个月内粉丝数从 0 增长至 8000+',
              '策划并执行迎新季专题活动，吸引 300+ 新生关注，转化率超行业均值 2 倍',
            ]},
            { title: '校园创业项目', role: '联合发起人', achievements: [
              '发起校园二手交易平台，首月注册用户突破 500 人，GMV 达 30000 元',
              '负责市场推广策略制定，通过与社团合作实现零成本获客',
              '搭建基础运营流程体系，将订单处理效率提升 60%',
            ]},
          ],
          skills: ['内容运营', '数据分析', '项目管理', '团队协作', '用户增长', '文案写作'],
        })
      }, 1500)
    }
  }

  copyBullet = (text) => {
    Taro.setClipboardData({
      data: text,
      success: () => {
        Taro.showToast({ title: '已复制', icon: 'success' })
      },
    })
  }

  goToJD = () => {
    Taro.switchTab({ url: '/pages/jd/index' })
  }

  render () {
    const { activeTab, tabs, experience, name, targetRole, isGenerating, showResult, resumeItems, skills } = this.state

    if (isGenerating) {
      return (
        <View className="page" style={{ minHeight: '100vh' }}>
          <View className="loading-wrap">
            <View style={{ display: 'flex', gap: '12rpx', justifyContent: 'center', marginBottom: '32rpx' }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{
                  width: '20rpx', height: '20rpx', borderRadius: '50%', background: '#2563eb',
                }} />
              ))}
            </View>
            <Text className="loading-msg">AI 正在分析你的经历...</Text>
            <Text className="loading-hint-text">正在提取关键信息、构建 STAR 结构</Text>
          </View>
        </View>
      )
    }

    if (showResult && resumeItems.length > 0) {
      return (
        <View className="page">
          <View className="page-header-bar">
            <View>
              <Text className="header-title-lg">你的简历</Text>
              <Text className="header-desc-sm">基于 AI 分析生成的结构化简历</Text>
            </View>
            <View className="header-badge"><Text className="header-badge-text" style={{ color: '#fff' }}>V1</Text></View>
          </View>

          <View style={{ padding: '0 28rpx' }}>
            {/* 技能标签 */}
            <Text className="section-title" style={{ display: 'block' }}>技能标签</Text>
            <View className="flex-row" style={{ flexWrap: 'wrap', gap: '12rpx', marginBottom: '32rpx' }}>
              {skills.map((skill, i) => (
                <View key={i} className={i === 0 ? 'tag-blue tag' : i % 2 === 0 ? 'tag-green tag' : 'tag-purple tag'}>
                  <Text>{skill}</Text>
                </View>
              ))}
            </View>

            {/* 简历条目 */}
            {resumeItems.map((item, idx) => (
              <View key={idx} className="card">
                <View className="flex-between" style={{ marginBottom: '20rpx' }}>
                  <Text style={{ fontSize: '30rpx', color: '#0f172a', fontWeight: 'bold' }}>{item.title}</Text>
                  <View className="tag-orange tag"><Text>{item.role}</Text></View>
                </View>
                {item.achievements.map((achv, aIdx) => (
                  <View
                    key={aIdx}
                    onClick={() => this.copyBullet(achv)}
                    style={{ padding: '16rpx 0', borderBottom: aIdx < item.achievements.length - 1 ? '1rpx solid #f1f5f9' : '' }}
                  >
                    <View className="flex-row" style={{ alignItems: 'flex-start' }}>
                      <Text style={{ color: '#2563eb', marginRight: '12rpx', fontSize: '26rpx' }}>•</Text>
                      <Text style={{ fontSize: '27rpx', color: '#334155', lineHeight: '1.7', flex: 1 }}>{achv}</Text>
                    </View>
                    <Text className="text-xs text-muted" style={{ marginTop: '8rpx', marginLeft: '30rpx', display: 'block' }}>点击复制</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* 底部操作栏 */}
          <View className="bottom-action-bar">
            <View className="btn-half btn-cancel" onClick={() => this.setState({ showResult: false })}>
              <Text>重新编辑</Text>
            </View>
            <View className="btn-half btn-confirm" onClick={this.goToJD}>
              <Text>下一步：匹配 JD</Text>
            </View>
          </View>
        </View>
      )
    }

    // 输入模式
    return (
      <View className="page">
        <View className="page-header-bar">
          <View>
            <Text className="header-title-lg">创建简历</Text>
            <Text className="header-desc-sm">输入经历，AI 自动结构化</Text>
          </View>
        </View>

        {/* Tab 切换 */}
        <View className="tab-strip">
          {tabs.map((tab, idx) => (
            <View key={idx} className="tab-item-flex" onClick={() => this.switchTab(idx)}>
              <Text className={activeTab === idx ? 'tab-item-text-active' : 'tab-item-text'}>{tab}</Text>
              {activeTab === idx && <View className="tab-active-line" />}
            </View>
          ))}
        </View>

        <View style={{ padding: '28rpx' }}>
          {activeTab === 0 ? (
            <>
              <View className="form-section">
                <Text className="form-label">姓名（可选）</Text>
                <Input className="form-input" value={name} onInput={this.onNameChange} placeholder="你的名字" />
              </View>
              <View className="form-section">
                <Text className="form-label">目标岗位（可选）</Text>
                <Input className="form-input" value={targetRole} onInput={this.onTargetRoleChange} placeholder="如：产品经理、运营专员" />
              </View>
              <View className="form-section">
                <Text className="form-label">详细经历 *</Text>
                <Textarea
                  className="form-textarea"
                  value={experience}
                  onInput={this.onExperienceChange}
                  placeholder={"请描述你的工作、实习、项目或学习经历...\n包含：做了什么、怎么做的、结果如何"}
                  maxlength={5000}
                />
              </View>
            </>
          ) : activeTab === 1 ? (
            <>
              <View className="card upload-area" style={{ minHeight: '360rpx' }}>
                <Text style={{ fontSize: '64rpx', color: '#94a3b8', display: 'block', marginBottom: '16rpx' }}>+</Text>
                <Text className="upload-main-text">点击上传简历文件</Text>
                <Text className="upload-sub-text">支持 PDF / Word (.docx)</Text>
              </View>
              <View className="tip-box">
                <Text className="tip-text">上传后 AI 将自动解析你的经历信息</Text>
              </View>
            </>
          ) : (
            <>
              {[
                { q: '最近一段经历是什么？', sub: '工作/实习/项目/校园活动均可' },
                { q: '你在其中承担了什么职责？', sub: '描述你的角色和责任范围' },
                { q: '你做了哪些具体的事情？', sub: '列举关键动作和决策' },
                { q: '结果如何？有什么可量化的成果？', sub: '数据、指标、奖项等' },
              ].map((step, idx) => (
                <View key={idx} className="form-section">
                  <View className="flex-row" style={{ marginBottom: '14rpx' }}>
                    <View style={{
                      width: '44rpx', height: '44rpx', borderRadius: '50%',
                      background: '#2563eb', color: '#fff', fontSize: '24rpx',
                      fontWeight: 700, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', marginRight: '14rpx', flexShrink: 0,
                    }}>
                      <Text style={{ color: '#fff' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-bold" style={{ fontSize: '26rpx', color: '#334155', display: 'block' }}>{step.q}</Text>
                      <Text className="text-xs text-muted" style={{ marginTop: '4rpx', display: 'block' }}>{step.sub}</Text>
                    </View>
                  </View>
                  <Textarea className="form-textarea" placeholder="请输入..." style={{ minHeight: '140rpx' }} />
                </View>
              ))}
            </>
          )}

          <View style={{ marginTop: '36rpx' }}>
            <View
              className="btn-primary"
              onClick={this.generateResume}
              style={{ opacity: (experience.trim() || activeTab !== 0) ? 1 : 0.5 }}
            >
              <Text>{activeTab === 1 ? '分析文件' : activeTab === 2 ? '生成简历' : '开始生成'}</Text>
            </View>
          </View>

          <View className="tip-box" style={{ marginTop: '24rpx' }}>
            <Text className="tip-text">本内容由 AI 辅助生成，请核实后使用</Text>
          </View>
        </View>
      </View>
    )
  }
}
