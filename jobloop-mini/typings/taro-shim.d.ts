/// <reference types="@tarojs/taro" />

/* Taro 事件类型 */
declare namespace Taro {
  interface GeneralEventDetail {
    value: string
    checked?: boolean
  }
}

/* Taro 组件事件 */
interface BaseEvent {
  type: string
  stopPropagation: () => void
}

interface InputEvent extends BaseEvent {
  detail: { value: string }
}

/* 全局 React 声明（Taro 内置） */
import React from 'react'
