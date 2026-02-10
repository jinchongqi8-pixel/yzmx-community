# 🚀 快速启动指南

## 第一步：安装 Node.js

确保已安装 Node.js 16+ 版本

检查版本：
```bash
node -v
npm -v
```

## 第二步：安装依赖

在项目目录执行：

```bash
cd D:\community-web
npm install
```

## 第三步：启动开发服务器

```bash
npm run dev
```

浏览器会自动打开：http://localhost:3000

## 常见问题

### Q: npm install 很慢？
A: 使用国内镜像：
```bash
npm install --registry=https://registry.npmmirror.com
```

### Q: 启动后报错？
A: 检查 Node.js 版本，需要 16 或更高

### Q: 登录功能不能用？
A: 需要先配置短信服务（见下方）

## 短信服务配置

登录功能使用手机号验证码，需要申请短信服务：

### 推荐：腾讯云 SMS

1. 注册腾讯云：https://cloud.tencent.com/
2. 开通短信服务
3. 创建签名和模板
4. 获取 AppID 和 AppKey
5. 修改 `src/api/cloud.js` 中的配置

### 短信模板示例

```
【学习社群】您的验证码是{1}，5分钟内有效。
```

## 开发计划

1. ✅ 项目基础结构
2. ✅ 登录页面（前端）
3. ⏳ 短信验证码（后端）
4. ⏳ 社群功能
5. ⏳ 课程功能
6. ⏳ 个人中心

## 部署上线

### 构建项目
```bash
npm run build
```

### 部署到服务器

可以将 `dist` 目录部署到：
- Nginx
- Apache
- Vercel
- Netlify
- 或任何静态网站托管服务

## 联系方式

有问题可以查看 README.md 或提交 Issue
