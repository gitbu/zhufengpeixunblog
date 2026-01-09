/**
 * 地址数据管理工具类
 * 支持本地存储和云存储同步
 */

const cloudStorage = require('./cloud-storage.js')
const STORAGE_KEY = 'address_list'
const SYNC_STATUS_KEY = 'sync_status' // 同步状态标记

/**
 * 生成唯一ID
 */
function generateId() {
  return `address_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取所有地址列表（优先从云端获取）
 * @param {boolean} forceLocal 是否强制使用本地数据
 * @returns {Promise<Array>} 地址列表
 */
function getAddressList(forceLocal = false) {
  // 如果强制本地或云开发未启用，返回本地数据
  if (forceLocal || !cloudStorage.isCloudEnabled()) {
    return Promise.resolve(getLocalAddressList())
  }

  // 尝试从云端获取
  return cloudStorage.getCloudAddresses()
    .then(cloudAddresses => {
      // 同步到本地存储
      saveAddressList(cloudAddresses)
      return cloudAddresses
    })
    .catch(err => {
      console.log('云端获取失败，使用本地数据', err)
      return getLocalAddressList()
    })
}

/**
 * 获取本地地址列表
 * @returns {Array} 地址列表
 */
function getLocalAddressList() {
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
  const list = getLocalAddressList()
  return list.find(item => item.id === id) || null
}

/**
 * 同步本地数据到云端
 * @returns {Promise}
 */
function syncToCloud() {
  if (!cloudStorage.isCloudEnabled()) {
    return Promise.reject(new Error('云开发未启用'))
  }

  const localAddresses = getLocalAddressList()
  return cloudStorage.syncToCloud(localAddresses)
}

/**
 * 添加地址（同步到云端）
 * @param {Object} address 地址对象
 * @returns {Promise<Object>} 添加后的地址对象（包含ID）
 */
function addAddress(address) {
  return new Promise((resolve, reject) => {
    // 如果云开发启用，先添加到云端
    if (cloudStorage.isCloudEnabled()) {
      cloudStorage.addCloudAddress(address)
        .then(cloudAddress => {
          // 添加到本地
          addLocalAddress(cloudAddress)
          resolve(cloudAddress)
        })
        .catch(err => {
          console.log('云端添加失败，使用本地模式', err)
          // 云端失败，使用本地
          const localAddress = addLocalAddress(address)
          resolve(localAddress)
        })
    } else {
      // 云开发未启用，直接本地添加
      const localAddress = addLocalAddress(address)
      resolve(localAddress)
    }
  })
}

/**
 * 添加地址到本地
 * @param {Object} address 地址对象
 * @returns {Object} 添加后的地址对象
 */
function addLocalAddress(address) {
  const list = getLocalAddressList()

  const newAddress = {
    ...address,
    id: address.id || generateId(),
    createTime: address.createTime || Date.now(),
    updateTime: address.updateTime || Date.now()
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
 * 更新地址（同步到云端）
 * @param {string} id 地址ID
 * @param {Object} address 地址对象
 * @returns {Promise<boolean>} 是否更新成功
 */
function updateAddress(id, address) {
  return new Promise((resolve, reject) => {
    // 如果云开发启用，先更新云端
    if (cloudStorage.isCloudEnabled()) {
      cloudStorage.updateCloudAddress(id, address)
        .then(() => {
          // 更新本地
          updateLocalAddress(id, address)
          resolve(true)
        })
        .catch(err => {
          console.log('云端更新失败，使用本地模式', err)
          // 云端失败，使用本地
          const result = updateLocalAddress(id, address)
          resolve(result)
        })
    } else {
      // 云开发未启用，直接本地更新
      const result = updateLocalAddress(id, address)
      resolve(result)
    }
  })
}

/**
 * 更新本地地址
 * @param {string} id 地址ID
 * @param {Object} address 地址对象
 * @returns {boolean} 是否更新成功
 */
function updateLocalAddress(id, address) {
  const list = getLocalAddressList()
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
 * 删除地址（同步到云端）
 * @param {string} id 地址ID
 * @returns {Promise<boolean>} 是否删除成功
 */
function deleteAddress(id) {
  return new Promise((resolve, reject) => {
    // 如果云开发启用，先删除云端
    if (cloudStorage.isCloudEnabled()) {
      cloudStorage.deleteCloudAddress(id)
        .then(() => {
          // 删除本地
          deleteLocalAddress(id)
          resolve(true)
        })
        .catch(err => {
          console.log('云端删除失败，使用本地模式', err)
          // 云端失败，使用本地
          const result = deleteLocalAddress(id)
          resolve(result)
        })
    } else {
      // 云开发未启用，直接本地删除
      const result = deleteLocalAddress(id)
      resolve(result)
    }
  })
}

/**
 * 删除本地地址
 * @param {string} id 地址ID
 * @returns {boolean} 是否删除成功
 */
function deleteLocalAddress(id) {
  let list = getLocalAddressList()
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
 * 设置默认地址（同步到云端）
 * @param {string} id 地址ID
 * @returns {Promise<boolean>} 是否设置成功
 */
function setDefaultAddress(id) {
  return new Promise((resolve, reject) => {
    // 如果云开发启用，先设置云端
    if (cloudStorage.isCloudEnabled()) {
      cloudStorage.setCloudDefaultAddress(id)
        .then(() => {
          // 设置本地
          setLocalDefaultAddress(id)
          resolve(true)
        })
        .catch(err => {
          console.log('云端设置失败，使用本地模式', err)
          // 云端失败，使用本地
          const result = setLocalDefaultAddress(id)
          resolve(result)
        })
    } else {
      // 云开发未启用，直接本地设置
      const result = setLocalDefaultAddress(id)
      resolve(result)
    }
  })
}

/**
 * 设置本地默认地址
 * @param {string} id 地址ID
 * @returns {boolean} 是否设置成功
 */
function setLocalDefaultAddress(id) {
  const list = getLocalAddressList()
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
  const list = getLocalAddressList()
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
  getLocalAddressList,
  getAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
  clearAllAddress,
  syncToCloud,
  isCloudEnabled: cloudStorage.isCloudEnabled
}
