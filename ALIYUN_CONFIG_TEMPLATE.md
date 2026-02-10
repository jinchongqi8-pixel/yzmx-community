# 阿里云短信配置模板

## 📋 配置信息

### 阿里云 AccessKey

**AccessKeyId:**
```
LTAI5tXXXXXXXXXXXXXXXX
```
- 获取地址：阿里云控制台 → AccessKey管理
- 注意：保密，不要泄露

**AccessKeySecret:**
```
XXXXXXXXXXXXXXXXXXXXXXXX
```
- 获取地址：阿里云控制台 → AccessKey管理
- 注意：只在创建时显示一次，请务必保存

### 短信签名

**签名名称:**
```
学习社群
```
- 状态：待申请
- 审核时间：1-2 小时

### 短信模板

**模板代码:**
```
SMS_XXXXXXXXX
```
- 模板内容：您的验证码是${code}，5分钟内有效。

---

## 🔧 如何应用到项目

### 1. 修改云函数配置

打开文件：`D:\community-miniprogram\cloudfunctions\login\index.js`

找到第 12-21 行，修改为：

```javascript
const ALIYUN_SMS = {
  accessKeyId: 'YOUR_ACCESS_KEY_ID',      // ← 替换为上面的 AccessKeyId
  accessKeySecret: 'YOUR_ACCESS_KEY_SECRET', // ← 替换为上面的 AccessKeySecret
  signName: '学习社群',                    // ← 替换为你的签名名称
  templateCode: 'SMS_TEMPLATE_CODE'        // ← 替换为你的模板代码
}
```

### 2. 部署云函数

在微信开发者工具中：
1. 右键 `cloudfunctions/login` 文件夹
2. 选择 **上传并部署：云端安装依赖**
3. 等待部署完成

### 3. 创建数据库集合

在云开发控制台：
1. 点击 **数据库**
2. 点击 **添加集合**
3. 集合名称填写：`sms_codes`
4. 权限设置：所有用户可读，仅创建者可写

---

## ✅ 测试步骤

### 方法 A：使用网页版测试
1. 打开文件：`D:\community-web\test-sms.html`
2. 输入手机号
3. 点击"获取验证码"
4. 查看手机是否收到短信

### 方法 B：使用小程序测试
1. 打开小程序
2. 在控制台输入：
```javascript
wx.cloud.callFunction({
  name: 'login',
  data: {
    action: 'sendSmsCode',
    phone: '13800138000'
  }
})
```

---

## 📞 需要帮助？

- 阿里云短信文档：https://help.aliyun.com/document_detail/101414.html
- 快速配置指南：查看 `ALIYUN_SMS_GUIDE.md`
- 技术支持：提交 Issue 到项目仓库
