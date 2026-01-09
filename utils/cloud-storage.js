/**
 * 云存储工具类
 * 使用微信云开发实现地址数据的云端同步
 */

const app = getApp()
const db = wx.cloud ? wx.cloud.database() : null
const COLLECTION_NAME = 'addresses' // 云数据库集合名称

/**
 * 检查云开发是否可用
 */
function isCloudEnabled() {
  return app.globalData.cloudEnabled && db !== null
}

/**
 * 获取所有地址（从云端）
 * @returns {Promise<Array>}
 */
function getCloudAddresses() {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    db.collection(COLLECTION_NAME)
      .orderBy('updateTime', 'desc')
      .get()
      .then(res => {
        const addresses = res.data.map(item => ({
          id: item._id,
          name: item.name,
          phone: item.phone,
          tag: item.tag,
          province: item.province,
          city: item.city,
          district: item.district,
          detail: item.detail,
          isDefault: item.isDefault,
          createTime: item.createTime,
          updateTime: item.updateTime
        }))
        resolve(addresses)
      })
      .catch(err => {
        console.error('获取云端地址失败', err)
        reject(err)
      })
  })
}

/**
 * 添加地址到云端
 * @param {Object} address 地址对象
 * @returns {Promise<Object>}
 */
function addCloudAddress(address) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    // 如果设置为默认，先取消其他地址的默认状态
    const promise = address.isDefault
      ? clearDefaultAddress()
      : Promise.resolve()

    promise.then(() => {
      const now = Date.now()
      const data = {
        name: address.name,
        phone: address.phone,
        tag: address.tag || '家',
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
        isDefault: address.isDefault || false,
        createTime: now,
        updateTime: now,
        _openid: '{openid}' // 由云函数自动填充
      }

      db.collection(COLLECTION_NAME)
        .add({ data })
        .then(res => {
          resolve({
            ...address,
            id: res._id,
            createTime: now,
            updateTime: now
          })
        })
        .catch(err => {
          console.error('添加云端地址失败', err)
          reject(err)
        })
    })
  })
}

/**
 * 更新云端地址
 * @param {string} id 地址ID
 * @param {Object} address 地址对象
 * @returns {Promise<boolean>}
 */
function updateCloudAddress(id, address) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    // 如果设置为默认，先取消其他地址的默认状态
    const promise = address.isDefault
      ? clearDefaultAddress(id)
      : Promise.resolve()

    promise.then(() => {
      const data = {
        name: address.name,
        phone: address.phone,
        tag: address.tag,
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
        isDefault: address.isDefault,
        updateTime: Date.now()
      }

      db.collection(COLLECTION_NAME)
        .doc(id)
        .update({ data })
        .then(() => {
          resolve(true)
        })
        .catch(err => {
          console.error('更新云端地址失败', err)
          reject(err)
        })
    })
  })
}

/**
 * 删除云端地址
 * @param {string} id 地址ID
 * @returns {Promise<boolean>}
 */
function deleteCloudAddress(id) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    db.collection(COLLECTION_NAME)
      .doc(id)
      .remove()
      .then(() => {
        resolve(true)
      })
      .catch(err => {
        console.error('删除云端地址失败', err)
        reject(err)
      })
  })
}

/**
 * 设置默认地址
 * @param {string} id 地址ID
 * @returns {Promise<boolean>}
 */
function setCloudDefaultAddress(id) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    // 先取消所有默认地址
    clearDefaultAddress().then(() => {
      // 设置新的默认地址
      db.collection(COLLECTION_NAME)
        .doc(id)
        .update({
          data: {
            isDefault: true,
            updateTime: Date.now()
          }
        })
        .then(() => {
          resolve(true)
        })
        .catch(err => {
          console.error('设置默认地址失败', err)
          reject(err)
        })
    })
  })
}

/**
 * 清除所有地址的默认状态
 * @param {string} excludeId 排除的地址ID
 * @returns {Promise}
 */
function clearDefaultAddress(excludeId) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    // 查询所有默认地址
    const query = db.collection(COLLECTION_NAME).where({
      isDefault: true
    })

    // 如果有排除ID，添加条件
    if (excludeId) {
      query.where({
        _id: db.command.neq(excludeId)
      })
    }

    query.get().then(res => {
      if (res.data.length === 0) {
        resolve()
        return
      }

      // 批量更新
      const promises = res.data.map(item => {
        return db.collection(COLLECTION_NAME)
          .doc(item._id)
          .update({
            data: { isDefault: false }
          })
      })

      Promise.all(promises)
        .then(() => resolve())
        .catch(err => {
          console.error('清除默认地址失败', err)
          reject(err)
        })
    })
  })
}

/**
 * 同步本地数据到云端
 * @param {Array} localAddresses 本地地址列表
 * @returns {Promise}
 */
function syncToCloud(localAddresses) {
  return new Promise((resolve, reject) => {
    if (!isCloudEnabled()) {
      reject(new Error('云开发未启用'))
      return
    }

    // 获取云端数据
    getCloudAddresses().then(cloudAddresses => {
      // 如果云端没有数据，上传本地所有数据
      if (cloudAddresses.length === 0) {
        const promises = localAddresses.map(addr => addCloudAddress(addr))
        Promise.all(promises)
          .then(() => resolve({ uploaded: localAddresses.length }))
          .catch(reject)
      } else {
        // 云端有数据，使用云端数据
        resolve({ synced: true, cloudCount: cloudAddresses.length })
      }
    }).catch(reject)
  })
}

module.exports = {
  isCloudEnabled,
  getCloudAddresses,
  addCloudAddress,
  updateCloudAddress,
  deleteCloudAddress,
  setCloudDefaultAddress,
  syncToCloud
}
