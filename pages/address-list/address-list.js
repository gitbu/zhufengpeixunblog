const addressStorage = require('../../utils/address-storage.js')

Page({
  data: {
    addressList: [],
    displayList: [],
    searchKeyword: '',
    touchingId: null,
    touchOffset: 0,
    touching: false,
    startX: 0
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
      addressList,
      displayList: addressList
    })
    // 如果有搜索关键词，重新过滤
    if (this.data.searchKeyword) {
      this.filterAddress(this.data.searchKeyword)
    }
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.filterAddress(keyword)
  },

  // 过滤地址
  filterAddress(keyword) {
    if (!keyword || !keyword.trim()) {
      this.setData({
        displayList: this.data.addressList
      })
      return
    }

    const lowerKeyword = keyword.toLowerCase().trim()
    const filtered = this.data.addressList.filter(item => {
      return (
        item.name.toLowerCase().includes(lowerKeyword) ||
        item.phone.includes(lowerKeyword) ||
        item.province.includes(lowerKeyword) ||
        item.city.includes(lowerKeyword) ||
        item.district.includes(lowerKeyword) ||
        item.detail.toLowerCase().includes(lowerKeyword)
      )
    })

    this.setData({
      displayList: filtered
    })
  },

  // 清除搜索
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      displayList: this.data.addressList
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

  // 触摸开始
  onTouchStart(e) {
    const { id } = e.currentTarget.dataset
    this.setData({
      startX: e.touches[0].clientX,
      touching: true,
      touchingId: id
    })
  },

  // 触摸移动
  onTouchMove(e) {
    if (!this.data.touching) return

    const moveX = e.touches[0].clientX
    let offset = moveX - this.data.startX

    // 限制滑动距离，最多显示删除按钮 -120px
    if (offset < -120) {
      offset = -120
    } else if (offset > 0) {
      offset = 0
    }

    this.setData({
      touchOffset: offset
    })
  },

  // 触摸结束
  onTouchEnd(e) {
    const offset = this.data.touchOffset

    // 如果滑动超过60px，则显示删除按钮，否则恢复
    if (offset < -60) {
      this.setData({
        touchOffset: -120,
        touching: false
      })
    } else {
      this.setData({
        touchOffset: 0,
        touching: false,
        touchingId: null
      })
    }
  },

  // 删除地址
  onDelete(e) {
    const { id } = e.currentTarget.dataset

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          addressStorage.deleteAddress(id)

          // 重置滑动状态
          this.setData({
            touchOffset: 0,
            touchingId: null
          })

          this.loadAddressList()

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } else {
          // 取消删除，恢复位置
          this.setData({
            touchOffset: 0,
            touchingId: null
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
