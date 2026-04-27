import { Component } from 'react'
import { View, Text } from '@tarojs/components'

export default class JDPage extends Component {
  state = {
    jdText: '',
  }

  render () {
    return (
      <View className="page">
        <View className="page-header-bar">
          <Text className="header-title-lg">JD 匹配优化</Text>
          <Text className="header-desc-sm">粘贴 JD，AI 分析匹配度并优化简历</Text>
        </View>
        <View style={{ padding: '28rpx' }}>
          <Text className="text-secondary">JD Page</Text>
        </View>
      </View>
    )
  }
}
