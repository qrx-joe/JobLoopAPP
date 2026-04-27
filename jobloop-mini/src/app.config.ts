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
      { pagePath: 'pages/index/index', text: '首页', iconPath: 'assets/home.png', selectedIconPath: 'assets/home-active.png' },
      { pagePath: 'pages/resume/index', text: '简历', iconPath: 'assets/resume.png', selectedIconPath: 'assets/resume-active.png' },
      { pagePath: 'pages/jd/index', text: 'JD优化', iconPath: 'assets/jd.png', selectedIconPath: 'assets/jd-active.png' },
      { pagePath: 'pages/interview/index', text: '面试', iconPath: 'assets/interview.png', selectedIconPath: 'assets/interview-active.png' },
    ],
  },
})
