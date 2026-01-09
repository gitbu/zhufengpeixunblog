const addressStorage = require('../../utils/address-storage.js')

Page({
  data: {
    addressList: []
  },

  onLoad() {
    this.loadAddressList()
  },

  onShow() {
    this.loadAddressList()
  },

  // 加载地址列表
  loadAddressList() {
    const addressList = addressStorage.getAddressList()
    this.setData({
      addressList
    })
  },

  // 添加新地址
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    })
  },

  // 编辑地址
  onEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?id=${id}`
    })
  },

  // 删除地址
  onDelete(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: (res) => {
        if (res.confirm) {
          addressStorage.deleteAddress(id)
          this.loadAddressList()

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 设置默认地址
  onSetDefault(e) {
    const { id } = e.currentTarget.dataset
    addressStorage.setDefaultAddress(id)
    this.loadAddressList()

    wx.showToast({
      title: '设置成功',
      icon: 'success'
    })
  },

  // 选择地址（可用于从其他页面选择地址）
  onAddressSelect(e) {
    const { id } = e.currentTarget.dataset
    const pages = getCurrentPages()

    // 如果是从其他页面跳转过来选择地址
    if (pages.length > 1) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.route !== 'pages/address-list/address-list') {
        const address = this.data.addressList.find(item => item.id === id)
        // 可以通过事件或者全局变量传递选中的地址
        wx.navigateBack({
          success: () => {
            // 如果上一页有接收地址的方法，可以调用
            if (prevPage.onAddressSelected) {
              prevPage.onAddressSelected(address)
            }
          }
        })
      }
    }
  }
})
