# 收货地址管理微信小程序

一个完整的微信小程序，用于管理用户的收货地址信息。

## 功能特性

- ✅ 地址列表展示
- ✅ 添加新地址
- ✅ 编辑已有地址
- ✅ 删除地址
- ✅ 设置默认地址
- ✅ 地区选择器
- ✅ 表单验证
- ✅ 本地数据持久化存储

## 项目结构

```
.
├── app.js                          # 小程序入口文件
├── app.json                        # 小程序配置文件
├── app.wxss                        # 全局样式文件
├── project.config.json             # 项目配置文件
├── sitemap.json                    # 站点地图配置
├── pages/                          # 页面目录
│   ├── address-list/               # 地址列表页面
│   │   ├── address-list.js
│   │   ├── address-list.json
│   │   ├── address-list.wxml
│   │   └── address-list.wxss
│   └── address-edit/               # 地址编辑页面
│       ├── address-edit.js
│       ├── address-edit.json
│       ├── address-edit.wxml
│       └── address-edit.wxss
├── utils/                          # 工具类目录
│   └── address-storage.js          # 地址数据管理工具
└── images/                         # 图片资源目录
    ├── empty-address.svg
    └── empty-address.png
```

## 快速开始

### 1. 安装微信开发者工具

前往 [微信开发者工具官网](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 下载并安装。

### 2. 导入项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 选择本项目目录
4. 填写 AppID（可以使用测试号）
5. 点击"导入"

### 3. 运行项目

项目导入后会自动编译运行，可以在开发者工具中预览效果。

## 使用说明

### 地址列表页面

- 展示所有已保存的收货地址
- 默认地址会显示"默认"标签
- 可以对每个地址进行编辑、删除、设为默认等操作
- 点击"添加新地址"按钮可以添加新的收货地址

### 添加/编辑地址页面

- 填写收货人姓名（必填）
- 填写手机号码（必填，会进行格式验证）
- 选择所在地区（必填，支持省市区三级选择）
- 填写详细地址（必填）
- 可选择是否设为默认地址
- 点击"保存"按钮保存地址信息

## 数据存储

本小程序使用微信小程序的 `localStorage` 进行数据持久化存储，数据存储在用户本地。

### 地址数据结构

```javascript
{
  id: "address_1234567890_abc123",    // 唯一标识
  name: "张三",                        // 收货人姓名
  phone: "13800138000",                // 手机号码
  province: "广东省",                   // 省份
  city: "深圳市",                      // 城市
  district: "南山区",                   // 区/县
  detail: "科技园南区XX大厦",           // 详细地址
  isDefault: true,                     // 是否为默认地址
  createTime: 1234567890000,           // 创建时间
  updateTime: 1234567890000            // 更新时间
}
```

## 工具类 API

### addressStorage

地址数据管理工具类，提供以下方法：

#### `getAddressList()`

获取所有地址列表

- 返回：`Array` - 地址列表数组

#### `getAddress(id)`

获取单个地址信息

- 参数：`id` - 地址ID
- 返回：`Object|null` - 地址对象或null

#### `addAddress(address)`

添加新地址

- 参数：`address` - 地址对象（不含id）
- 返回：`Object` - 添加后的地址对象（包含id）

#### `updateAddress(id, address)`

更新地址信息

- 参数：
  - `id` - 地址ID
  - `address` - 地址对象
- 返回：`boolean` - 是否更新成功

#### `deleteAddress(id)`

删除地址

- 参数：`id` - 地址ID
- 返回：`boolean` - 是否删除成功

#### `setDefaultAddress(id)`

设置默认地址

- 参数：`id` - 地址ID
- 返回：`boolean` - 是否设置成功

#### `getDefaultAddress()`

获取默认地址

- 返回：`Object|null` - 默认地址对象或null

#### `clearAllAddress()`

清空所有地址

- 返回：`boolean` - 是否清空成功

## 技术栈

- 微信小程序原生开发
- 使用 localStorage 进行数据持久化
- 使用微信小程序原生组件

## 注意事项

1. 手机号码格式验证：必须是11位数字，且以1开头
2. 默认地址规则：
   - 每个用户只能有一个默认地址
   - 添加第一个地址时会自动设为默认
   - 删除默认地址时，会自动将第一个地址设为默认
3. 地址数据存储在本地，卸载小程序后数据会丢失

## 扩展建议

可以根据实际需求进行以下扩展：

1. 接入后端API，实现云端数据存储
2. 添加地址搜索功能
3. 集成地图选择地址功能
4. 添加地址标签（家、公司等）
5. 支持导入通讯录联系人
6. 添加地址数量限制
7. 优化UI设计和交互体验

## 许可证

MIT License
