import { Component } from 'react'
import { View, Text } from '@tarojs/components'

export default class IndexPage extends Component {
  render () {
    return (
      <View style={{ padding: '40rpx' }}>
        <Text style={{ fontSize: '40rpx', fontWeight: 'bold', display: 'block', marginBottom: '20rpx' }}>JobLoop AI</Text>
        <Text style={{ fontSize: '28rpx', color: '#666', display: 'block' }}>把你的经历变成能拿 offer 的简历</Text>
      </View>
    )
  }
}
