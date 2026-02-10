# 使用 LeanCloud 添加后端服务器

## 为什么选择 LeanCloud？

- ✅ **免费额度足**：500MB存储 + 5GB流量/月
- ✅ **国内访问快**：服务器在国内
- ✅ **上手简单**：几行代码就能用
- ✅ **有管理后台**：可视化数据管理
- ✅ **支持图片存储**：云存储空间

## 快速开始

### 1. 注册 LeanCloud

1. 访问 https://leancloud.cn
2. 注册账号并登录
3. 创建应用（选择"开发版"免费）
4. 进入"设置" → "应用凭证"，复制：
   - AppID
   - AppKey
   - 服务器地址

### 2. 安装依赖

```bash
cd D:\community-web
npm install leancloud-storage
```

### 3. 配置应用

修改 `src/leancloud.js`，填入你的凭证：

```javascript
LC.init({
  appId: 'your-app-id',              // 你的 AppID
  appKey: 'your-app-key',            // 你的 AppKey
  serverURL: 'https://xxx.leanapp.cn' // 你的服务器地址
})
```

### 4. 修改页面代码

**示例：修改 Community.vue**

原来：
```javascript
const loadPosts = async () => {
  const posts = JSON.parse(localStorage.getItem('posts') || '[]')
  posts.value = posts
}
```

改成：
```javascript
import { postApi } from '@/models/Post'

const loadPosts = async () => {
  try {
    const posts = await postApi.getList()
    posts.value = posts
  } catch (error) {
    ElMessage.error('加载失败')
  }
}
```

### 5. 数据结构

LeanCloud 会自动创建以下数据表：

- **Post** - 帖子表
  - content: 内容
  - type: 类型
  - images: 图片数组
  - likeCount: 点赞数
  - commentCount: 评论数
  - author: 作者（关联User表）

- **Comment** - 评论表
  - post: 所属帖子
  - content: 评论内容
  - author: 评论作者

- **User** - 用户表（LeanCloud内置）
  - nickname: 昵称
  - avatar: 头像
  - phone: 手机号

### 6. 图片存储

LeanCloud 提供 `LC.File` 用于文件存储：

```javascript
// 上传图片
const file = new LC.File('avatar.jpg', { base64: base64Data })
await file.save()

// 获取图片URL
const imageUrl = file.url()
```

### 7. 管理后台

登录 LeanCloud 控制台，可以：
- 查看数据
- 删除数据
- 修改数据
- 查看统计

## 其他方案对比

| 方案 | 优点 | 缺点 | 价格 |
|------|------|------|------|
| **LeanCloud** | 简单、国内快 | 免费额度有限 | 免费版够用 |
| **自建Node.js** | 完全控制 | 需要部署维护 | 需要买服务器 |
| **微信云开发** | 你已有 | 只能微信用 | 免费额度大 |
| **Supabase** | 开源免费 | 国内访问慢 | 免费 |
| **Firebase** | 功能强大 | 需翻墙 | 按使用量 |

## 迁移步骤

1. 注册LeanCloud并配置
2. 安装依赖：`npm install leancloud-storage`
3. 逐个修改页面，把localStorage改成API调用
4. 测试功能
5. 删除localStorage相关代码

## 注意事项

- ⚠️ 需要设置数据权限（ACL）
- ⚠️ 图片上传需要用LC.File
- ⚠️ 关联数据用Pointer
- ⚠️ 记得处理错误情况

## 常见问题

**Q: 超出免费额度怎么办？**
A: 可以升级付费版，或者自建服务器

**Q: 数据可以导出吗？**
A: 可以，在控制台可以导出JSON

**Q: 可以迁移到自己的服务器吗？**
A: 可以，导出数据后导入到自己的数据库
