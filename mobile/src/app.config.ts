export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/analyze/index',
    'pages/records/index',
    'pages/coach/index',
    'pages/profile/index',
    'pages/persona/index',
    'pages/legal/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1F3A2E',
    navigationBarTitleText: '知食',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FAF7F2'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#D4A574',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/analyze/index',
        text: '分析'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  },
  h5: {
    router: {
      mode: 'browser'
    }
  }
} as any)
