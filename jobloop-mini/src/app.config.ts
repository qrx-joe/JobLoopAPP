export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/resume/index',
    'pages/jd/index',
    'pages/interview/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'JobLoop',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#2563eb',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/resume/index', text: '简历' },
      { pagePath: 'pages/jd/index', text: 'JD优化' },
      { pagePath: 'pages/interview/index', text: '面试' },
    ],
  },
})
