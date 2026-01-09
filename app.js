App({
  onLaunch() {
    console.log('收货地址管理小程序启动')

    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        // 此处env为云开发环境ID，需要在微信开发者工具中创建云环境后填入
        // 暂时注释，使用默认环境
        // env: 'your-env-id',
        traceUser: true
      })
      console.log('云开发环境初始化成功')
      this.globalData.cloudEnabled = true
    } else {
      console.log('请使用 2.2.3 或以上的基础库以使用云能力')
      this.globalData.cloudEnabled = false
    }
  },

  globalData: {
    userInfo: null,
    cloudEnabled: false // 云开发是否启用
  }
})
