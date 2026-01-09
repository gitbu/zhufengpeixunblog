/**
 * 地址数据管理工具类
 * 使用微信小程序的 localStorage 存储地址数据
 */

const STORAGE_KEY = 'address_list'

/**
 * 生成唯一ID
 */
function generateId() {
  return `address_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取所有地址列表
 * @returns {Array} 地址列表
 */
function getAddressList() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
    return []
  } catch (e) {
    console.error('获取地址列表失败', e)
    return []
  }
}

/**
 * 保存地址列表
 * @param {Array} list 地址列表
 */
function saveAddressList(list) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(list))
    return true
  } catch (e) {
    console.error('保存地址列表失败', e)
    return false
  }
}

/**
 * 获取单个地址
 * @param {string} id 地址ID
 * @returns {Object|null} 地址对象
 */
function getAddress(id) {
  const list = getAddressList()
  return list.find(item => item.id === id) || null
}

/**
 * 添加地址
 * @param {Object} address 地址对象
 * @returns {Object} 添加后的地址对象（包含ID）
 */
function addAddress(address) {
  const list = getAddressList()

  const newAddress = {
    ...address,
    id: generateId(),
    createTime: Date.now(),
    updateTime: Date.now()
  }

  // 如果设置为默认地址，需要将其他地址的默认状态取消
  if (newAddress.isDefault) {
    list.forEach(item => {
      item.isDefault = false
    })
  }

  // 如果这是第一个地址，自动设为默认
  if (list.length === 0) {
    newAddress.isDefault = true
  }

  list.unshift(newAddress)
  saveAddressList(list)

  return newAddress
}

/**
 * 更新地址
 * @param {string} id 地址ID
 * @param {Object} address 地址对象
 * @returns {boolean} 是否更新成功
 */
function updateAddress(id, address) {
  const list = getAddressList()
  const index = list.findIndex(item => item.id === id)

  if (index === -1) {
    return false
  }

  // 如果设置为默认地址，需要将其他地址的默认状态取消
  if (address.isDefault) {
    list.forEach(item => {
      if (item.id !== id) {
        item.isDefault = false
      }
    })
  }

  list[index] = {
    ...list[index],
    ...address,
    id,
    updateTime: Date.now()
  }

  saveAddressList(list)
  return true
}

/**
 * 删除地址
 * @param {string} id 地址ID
 * @returns {boolean} 是否删除成功
 */
function deleteAddress(id) {
  let list = getAddressList()
  const index = list.findIndex(item => item.id === id)

  if (index === -1) {
    return false
  }

  const isDefault = list[index].isDefault
  list.splice(index, 1)

  // 如果删除的是默认地址，且还有其他地址，将第一个地址设为默认
  if (isDefault && list.length > 0) {
    list[0].isDefault = true
  }

  saveAddressList(list)
  return true
}

/**
 * 设置默认地址
 * @param {string} id 地址ID
 * @returns {boolean} 是否设置成功
 */
function setDefaultAddress(id) {
  const list = getAddressList()
  const target = list.find(item => item.id === id)

  if (!target) {
    return false
  }

  // 将所有地址的默认状态取消
  list.forEach(item => {
    item.isDefault = item.id === id
  })

  saveAddressList(list)
  return true
}

/**
 * 获取默认地址
 * @returns {Object|null} 默认地址对象
 */
function getDefaultAddress() {
  const list = getAddressList()
  return list.find(item => item.isDefault) || null
}

/**
 * 清空所有地址
 * @returns {boolean} 是否清空成功
 */
function clearAllAddress() {
  try {
    wx.removeStorageSync(STORAGE_KEY)
    return true
  } catch (e) {
    console.error('清空地址失败', e)
    return false
  }
}

module.exports = {
  getAddressList,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  clearAllAddress
}
