import { Component } from 'react'
import { View, Text } from '@tarojs/components'

export default class InterviewPage extends Component {
  state = {
    role: '',
  }

  render () {
    return (
      <View className="page">
        <View className="page-header-bar">
          <Text className="header-title-lg">面试模拟</Text>
          <Text className="header-desc-sm">输入目标岗位，开始 AI 面试模拟</Text>
        </View>
        <View style={{ padding: '28rpx' }}>
          <Text className="text-secondary">Interview Page</Text>
        </View>
      </View>
    )
  }
}
