const addressStorage = require('../../utils/address-storage.js')

Page({
  data: {
    id: null,
    tagList: ['家', '公司', '学校'],
    formData: {
      name: '',
      phone: '',
      tag: '家',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    },
    region: []
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id })
      this.loadAddress(options.id)
    }
  },

  // 加载地址信息（编辑模式）
  loadAddress(id) {
    const address = addressStorage.getAddress(id)
    if (address) {
      this.setData({
        formData: address,
        region: [address.province, address.city, address.district]
      })
    }
  },

  // 输入框变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    const { value } = e.detail
    this.setData({
      [`formData.${field}`]: value
    })
  },

  // 标签选择
  onTagSelect(e) {
    const { tag } = e.currentTarget.dataset
    this.setData({
      'formData.tag': tag
    })
  },

  // 地区选择
  onRegionPicked(e) {
    const [province, city, district] = e.detail.value
    this.setData({
      region: e.detail.value,
      'formData.province': province,
      'formData.city': city,
      'formData.district': district
    })
  },

  // 默认地址开关
  onSwitchChange(e) {
    this.setData({
      'formData.isDefault': e.detail.value
    })
  },

  // 验证表单
  validateForm() {
    const { name, phone, province, city, district, detail } = this.data.formData

    if (!name || !name.trim()) {
      wx.showToast({
        title: '请输入收货人姓名',
        icon: 'none'
      })
      return false
    }

    if (!phone || !phone.trim()) {
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none'
      })
      return false
    }

    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/
    if (!phoneReg.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号码',
        icon: 'none'
      })
      return false
    }

    if (!province || !city || !district) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      })
      return false
    }

    if (!detail || !detail.trim()) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 保存地址
  onSave() {
    if (!this.validateForm()) {
      return
    }

    const { id, formData } = this.data

    wx.showLoading({
      title: id ? '保存中...' : '添加中...',
      mask: true
    })

    const promise = id
      ? addressStorage.updateAddress(id, formData)
      : addressStorage.addAddress(formData)

    promise
      .then(() => {
        wx.hideLoading()
        wx.showToast({
          title: id ? '修改成功' : '添加成功',
          icon: 'success'
        })

        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      })
      .catch(err => {
        console.error('保存地址失败', err)
        wx.hideLoading()
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      })
  }
})
