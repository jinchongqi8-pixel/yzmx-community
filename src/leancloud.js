import LC from 'leancloud-storage'

// 初始化 LeanCloud
// 需要去 https://leancloud.cn 创建应用获取这些信息
LC.init({
  appId: 'your-app-id',           // 替换你的 AppID
  appKey: 'your-app-key',         // 替换你的 AppKey
  serverURL: 'https://your-app-id.leanapp.cn' // 替换你的服务器地址
})

export default LC
