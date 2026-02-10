# 学习社群 - 网页版

基于 Vue 3 + Vite + Element Plus + 微信云开发的在线学习平台。

> **🚀 当前状态：开发模式** - 使用模拟数据，方便开发和测试
>
> 详细说明请查看：[开发模式说明](./DEV_MODE.md)

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router** - 官方路由管理器
- **Element Plus** - Vue 3 组件库
- **Axios** - HTTP 客户端
- **微信云开发** - 后端服务（复用小程序云函数）

## 功能特性

- ✅ 手机号验证码登录
- ✅ 社群发帖互动
- ✅ 课程浏览学习
- ✅ 个人中心
- ✅ 响应式设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

构建产物在 `dist` 目录

## 项目结构

```
community-web/
├── src/
│   ├── api/          # API 接口
│   ├── components/   # 公共组件
│   ├── router/       # 路由配置
│   ├── utils/        # 工具函数
│   ├── views/        # 页面组件
│   ├── App.vue       # 根组件
│   └── main.js       # 入口文件
├── index.html        # HTML 模板
├── package.json      # 项目配置
└── vite.config.js    # Vite 配置
```

## 与小程序的关系

- **复用后端**：继续使用小程序的云函数和云数据库
- **相同功能**：保持与小程序一致的业务逻辑
- **独立部署**：可作为独立网站部署到服务器

## 云函数调用

通过 HTTP API 调用云函数，需要配置：

1. 环境ID：`cloud1-3gbg37ws97a236f6`
2. API地址：需要开通云开发 HTTP API

## 待完成功能

- [ ] 短信验证码发送（需要申请短信服务，查看 [配置指南](./ALIYUN_SMS_GUIDE.md)）
- [ ] 帖子详情页
- [ ] 评论功能
- [ ] 点赞功能
- [ ] 课程购买支付
- [ ] 打卡功能
- [ ] 管理后台

## 短信验证码配置

登录功能使用手机号验证码，基于阿里云短信服务。

**快速配置：**
1. 查看 [阿里云短信配置指南](./ALIYUN_SMS_GUIDE.md)
2. 参考 [配置模板](./ALIYUN_CONFIG_TEMPLATE.md) 填写配置
3. 修改 `cloudfunctions/login/index.js` 云函数
4. 部署云函数并测试

**注意事项**

1. 本项目为网页版，使用手机号验证码登录
2. 需要申请短信服务才能发送验证码
3. 云函数需要支持 HTTP API 调用
4. 建议先完善登录功能再开发其他模块

## 开发建议

1. 先完成登录注册功能
2. 再开发核心业务功能
3. 最后完善细节和优化

## License

MIT
