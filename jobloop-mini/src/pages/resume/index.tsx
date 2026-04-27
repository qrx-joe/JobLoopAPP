import { Component } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Input, Textarea, Image } from '@tarojs/components'
import { resumeApi, storage } from '../../services/api'

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
    isParsing: false,
    resumeItems: [] as ResumeItem[],
    skills: [] as string[],
    showResult: false,
    generatedContent: '',
    error: '',
    // 引导式状态
    guidedStep: 0,
    guidedAnswers: {} as Record<string, string>,
    // 文件上传
    uploadedFiles: [] as Array<{ name: string; size: number; path: string }>,
  }

  guidedSteps = [
    { key: 'name', question: '你的名字是什么？', placeholder: '张三' },
    { key: 'targetRole', question: '目标岗位？', placeholder: '产品经理 / 运营专员 / 数据分析师...' },
    { key: 'experience', question: '描述最近一段工作/实习经历', placeholder: '2023.06-至今 在XX公司担任XX职位，负责...' },
    { key: 'education', question: '教育背景？', placeholder: '2020-2024 XX大学 XX专业 本科' },
    { key: 'skills', question: '核心技能和工具？', placeholder: 'React, TypeScript, Node.js...' },
    { key: 'projects', question: '代表性项目经历？（可选）', placeholder: '独立完成了XX项目，负责XX模块...' },
  ]

  switchTab = (idx) => {
    this.setState({ activeTab: idx })
  }

  getVisibleGuidedSteps = () => {
    const { guidedStep } = this.state
    const total = this.guidedSteps.length
    // 最后一步时隐藏当前步骤的输入框（只显示已完成步骤）
    if (guidedStep === total - 1) return this.guidedSteps.slice(0, total - 1)
    return this.guidedSteps.slice(0, total)
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

  /** 选择文件 */
  chooseFile = () => {
    Taro.chooseMessageFile({
      count: 5,
      type: ['file'],
      extension: ['pdf', 'doc', 'docx', 'txt', 'md'],
      success: (res) => {
        const files = res.tempFilePaths.map((path, i) => ({
          name: `文件${i + 1}`,
          size: 0,
          path,
        }))
        this.setState({ uploadedFiles: files }, () => {
          if (files.length > 0) this.handleParseFiles(files.map(f => f.path))
        })
      },
    })
  }

  /** 解析文件 */
  handleParseFiles = async (filePaths: string[]) => {
    if (!filePaths.length) return
    this.setState({ isParsing: true, error: '' })

    for (const filePath of filePaths) {
      try {
        const res = await resumeApi.parseFiles(filePath)
        if (res.success && res.data?.parsedText) {
          this.setState(prev => ({
            experience: prev.experience
              ? prev.experience + '\n\n' + res.data.parsedText
              : res.data.parsedText,
            activeTab: 0,
          }))
        }
      } catch (err: any) {
        this.setState({ error: err.message || '文件解析失败' })
      }
    }
    this.setState({ isParsing: false })
  }

  generateResume = async () => {
    const { activeTab, experience, guidedAnswers, uploadedFiles, targetRole } = this.state

    if (activeTab === 1 || (activeTab === 2 && !experience.trim())) return
    if (activeTab === 0 && !experience.trim()) return

    this.setState({ isGenerating: true, error: '', showResult: false })

    try {
      const userInput = experience || Object.values(guidedAnswers).join('\n')
      storage.saveResumeDraft({ rawInput: userInput, inputMode: ['text', 'guided', 'file'][activeTab], guidedAnswers })

      const res = await resumeApi.generate({
        userInput,
        inputMode: 'text',
        guidedAnswers,
      })

      if (res.success && res.data?.data) {
        const contentStr = JSON.stringify(res.data.data.content)
        storage.saveGeneratedResume({ content: contentStr, generatedAt: Date.now() })
        this.parseAndShowResult(res.data.data.content)
      } else {
        throw new Error(res.error || '生成失败')
      }
    } catch (err: any) {
      this.setState({ error: err.message || '生成失败，请重试', isGenerating: false })
    }
  }

  parseAndShowResult = (content: Record<string, unknown>) => {
    const items = content.experienceItems || []
    const skills = content.skillTags || []
    const rawSuggestions = content.rawSuggestions || ''

    this.setState({
      isGenerating: false,
      showResult: true,
      resumeItems: items.map((item: any) => ({
        title: item.title || '',
        role: item.role || '',
        achievements: item.achievements || [],
      })),
      skills: skills.map((s: any) => typeof s === 'string' ? s : s.name),
      generatedContent: rawSuggestions || '',
    })
  }

  copyBullet = (text: string) => {
    Taro.setClipboardData({ data: text })
    Taro.showToast({ title: '已复制', icon: 'success' })
  }

  goToJD = () => {
    Taro.switchTab({ url: '/pages/jd/index' })
  }

  resetToEdit = () => {
    this.setState({ showResult: false })
  }

  render () {
    const { activeTab, tabs, experience, name, targetRole, isGenerating, isParsing, showResult, resumeItems, skills, error, guidedStep, guidedAnswers, uploadedFiles } = this.state

    // Loading
    if (isGenerating || isParsing) {
      return (
        <View className="page" style={{ minHeight: '100vh' }}>
          <View className="loading-wrap">
            <View style={{ display: 'flex', gap: '12rpx', justifyContent: 'center', marginBottom: '32rpx' }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{
                  width: '20rpx', height: '20rpx', borderRadius: '50%', background: '#2563eb',
                }} />
              ))}
            </View>
            <Text className="loading-msg">
              {isParsing ? '正在解析文件内容...' : 'AI 正在分析你的经历...'}
            </Text>
            <Text className="loading-hint-text">
              {isParsing ? '提取文本中...' : '正在提取关键信息、构建 STAR 结构'}
            </Text>
          </View>
        </View>
      )
    }

    // Result
    if (showResult && resumeItems.length > 0) {
      return (
        <View className="page">
          <View className="page-header-bar">
            <View>
              <Text className="header-title-lg">你的简历</Text>
              <Text className="header-desc-sm">基于 AI 分析生成的结构化简历</Text>
            </View>
            <View className="header-badge"><Text style={{ color: '#fff' }}>V1</Text></View>
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
            <View className="btn-half btn-cancel" onClick={this.resetToEdit}><Text>重新编辑</Text></View>
            <View className="btn-half btn-confirm" onClick={this.goToJD}><Text>下一步：匹配 JD</Text></View>
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
          {/* 错误提示 */}
          {error ? (
            <View style={{ backgroundColor: '#fef2f2', border: '1rpx solid #fecaca', borderRadius: '12rpx', padding: '16rpx 20rpx', marginBottom: '20rpx' }}>
              <Text style={{ color: '#991b1b', fontSize: '25rpx' }}>{error}</Text>
            </View>
          ) : null}

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
                  placeholder={"请描述你的工作/实习/项目或学习经历...\n包含：做了什么、怎么做的、结果如何"}
                  maxlength={5000}
                />
              </View>
              {uploadedFiles.length > 0 && (
                <View style={{ marginTop: '16rpx', backgroundColor: '#ecfdf5', border: '1rpx solid #a7f3d0', borderRadius: '12rpx', padding: '14rpx 20rpx' }}>
                  <Text style={{ fontSize: '24rpx', color: '#065f46' }}>✅ 已选择 {uploadedFiles.length} 个文件，内容已填充到上方</Text>
                </View>
              )}
            </>
          ) : activeTab === 1 ? (
            <>
              <View className="card upload-area" onClick={this.chooseFile} style={{ minHeight: '360rpx' }}>
                <Text style={{ fontSize: '64rpx', color: '#94a3b8', display: 'block', marginBottom: '16rpx' }}>+</Text>
                <Text className="upload-main-text">点击上传简历文件</Text>
                <Text className="upload-sub-text">支持 PDF / Word (.docx)</Text>
              </View>
              {uploadedFiles.length > 0 && (
                <View style={{ marginTop: '16rpx' }}>
                  {uploadedFiles.map((file, i) => (
                    <View key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16rpx 20rpx' }}>
                      <Text>{file.name}</Text>
                      <Text style={{ color: '#ef4444' }} onClick={() =>
                        this.setState(prev => ({ uploadedFiles: prev.uploadedFiles.filter((_, idx) => idx !== i) }))
                      }>删除</Text>
                    </View>
                  ))}
                </View>
              )}
              <View className="tip-box">
                <Text className="tip-text">上传后 AI 将自动解析你的经历信息</Text>
              </View>
            </>
          ) : (
            <>
              {this.getVisibleGuidedSteps().map((step, idx) => (
                <View key={step.key} className="form-section">
                  <View className="flex-row" style={{ marginBottom: '14rpx' }}>
                    <View style={{
                      width: '44rpx', height: '44rpx', borderRadius: '50%',
                      background: idx === this.guidedStep ? '#2563eb' : '#e2e8f0',
                      color: '#fff', fontSize: '24rpx', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: '14rpx', flexShrink: 0,
                    }}>
                      <Text style={{ color: '#fff' }}>{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-bold" style={{ fontSize: '26rpx', color: '#334155', display: 'block' }}>{step.question}</Text>
                      <Text className="text-xs text-muted" style={{ marginTop: '4rpx', display: 'block' }}>{step.placeholder}</Text>
                    </View>
                  </View>
                  <Textarea
                    className="form-textarea"
                    value={guidedAnswers[step.key] || ''}
                    onInput={(e) => {
                      this.setState(prev => ({
                        guidedAnswers: { ...prev.guidedAnswers, [step.key]: e.detail.value },
                      }))
                    }}
                    placeholder="请输入..."
                    style={{ minHeight: idx === 3 ? '240rpx' : '140rpx' }}
                  />
                </View>
              ))}

              <View style={{ marginTop: '16rpx', display: 'flex', gap: '16rpx' }}>
                {this.guidedStep > 0 && (
                  <View className="btn-cancel" style={{ padding: '18rpx 36rpx', flex: 1 }} onClick={() => this.setState(prev => ({ guidedStep: Math.max(0, prev.guidedStep - 1) }))}>
                    <Text>上一步</Text>
                  </View>
                )}
                <View
                  className={this.guidedStep >= this.guidedSteps.length - 1 ? 'btn-primary' : 'btn-primary'}
                  style={{ opacity: (guidedAnswers[this.guidedSteps[this.guidedStep].key] || '').trim() ? 1 : 0.5, flex: 2 }}
                  onClick={() => {
                    if (this.guidedStep >= this.guidedSteps.length - 1) {
                      // 最后一步 → 合并所有答案并生成
                      this.setState({ experience: Object.values(guidedAnswers).join('\n'), activeTab: 0 }, () => this.generateResume())
                    } else {
                      this.setState(prev => ({ guidedStep: prev.guidedStep + 1 }))
                    }
                  }}
                >
                  <Text>{this.guidedStep >= this.guidedSteps.length - 1 ? '完成并生成' : '下一步'}</Text>
                </View>
              </View>
            </>
          )}

          {/* 生成按钮 */}
          <View style={{ marginTop: '32rpx' }}>
            <View
              className="btn-primary"
              onClick={this.generateResume}
              style={{ opacity: (experience.trim() && !isGenerating) || activeTab !== 0 ? 1 : 0.5 }}
            >
              <Text>{isGenerating ? '生成中...' : activeTab === 1 ? '解析文件' : activeTab === 2 ? '生成简历' : '开始生成'}</Text>
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
