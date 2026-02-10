# 🚀 快速启动指南

## 第一步：安装 Node.js

确保已安装 Node.js 16+ 版本

检查版本：
```bash
node -v
npm -v
```

如果没有安装，访问：https://nodejs.org/

---

## 第二步：安装依赖

在项目目录执行：

```bash
cd D:\community-web
npm install
```

**如果安装很慢，使用国内镜像：**
```bash
npm install --registry=https://registry.npmmirror.com
```

---

## 第三步：启动开发服务器

```bash
npm run dev
```

浏览器会自动打开：http://localhost:3000

---

## 📱 项目说明

### 技术栈
- Vue 3 - 渐进式框架
- Vite - 构建工具
- Element Plus - UI 组件库
- Vue Router - 路由管理
- Axios - HTTP 客户端

### 目录结构
```
community-web/
├── src/
│   ├── api/           # API 接口
│   ├── views/         # 页面组件
│   ├── router/        # 路由配置
│   ├── App.vue        # 根组件
│   └── main.js        # 入口文件
├── index.html         # HTML 模板
├── package.json       # 项目配置
└── vite.config.js     # Vite 配置
```

---

## 🔐 登录功能说明

### 当前状态
- ✅ 登录页面 UI 已完成
- ⏳ 短信验证码功能（需要配置阿里云短信）

### 配置短信服务（可选）

**如果需要使用短信验证码登录：**

1. **查看配置指南**
   - 打开 `ALIYUN_SMS_GUIDE.md`

2. **申请阿里云短信服务**
   - 注册阿里云：https://www.aliyun.com/
   - 开通短信服务
   - 申请签名和模板

3. **配置云函数**
   - 修改 `cloudfunctions/login/index.js`
   - 填入你的阿里云配置

4. **部署测试**
   - 部署 login 云函数
   - 测试发送验证码

**如果不配置短信服务：**
- 登录功能暂时不能用
- 可以先开发其他功能
- 后续再添加登录

---

## 🎯 快速开始开发

### 方案 A：跳过登录，直接开发其他功能

1. **临时关闭登录验证**
   - 打开 `src/router/index.js`
   - 注释掉第 40-45 行的路由守卫

2. **直接访问页面**
   - 社群页面：http://localhost:3000/community
   - 课程页面：http://localhost:3000/course
   - 个人中心：http://localhost:3000/profile

### 方案 B：先完成登录功能

1. **按照上述步骤配置短信服务**
2. **完成后再开发其他功能**

---

## 📦 可用功能

### ✅ 已完成
- [x] 项目基础结构
- [x] 路由配置
- [x] 登录页面 UI
- [x] 社群页面 UI
- [x] 课程列表 UI
- [x] 课程详情 UI
- [x] 个人中心 UI

### ⏳ 待完成
- [ ] 短信验证码发送
- [ ] 云函数 HTTP API 对接
- [ ] 帖子详情页
- [ ] 发帖功能
- [ ] 评论功能
- [ ] 点赞功能
- [ ] 课程购买
- [ ] 打卡功能

---

## 🛠️ 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

---

## 📝 开发建议

### 推荐顺序
1. **先配置短信验证码**（完成登录功能）
2. **对接云函数 API**（实现数据交互）
3. **完善核心功能**（社群、课程）
4. **添加细节功能**（评论、点赞等）
5. **优化用户体验**（加载动画、错误提示）

### 调试技巧
- 打开浏览器控制台查看错误
- 使用 Vue DevTools 调试
- 查看 Network 标签的请求

---

## ❓ 常见问题

### Q1: npm install 失败？
**A:** 尝试：
```bash
npm cache clean --force
npm install
```

### Q2: 启动后页面空白？
**A:** 检查控制台错误信息，可能是：
- Node.js 版本过低
- 依赖未完全安装
- 端口 3000 被占用

### Q3: 登录功能不能用？
**A:** 需要先配置短信服务，查看：
- `ALIYUN_SMS_GUIDE.md` - 配置指南
- `ALIYUN_CONFIG_TEMPLATE.md` - 配置模板

---

## 📞 需要帮助？

- 查看完整文档：`README.md`
- 查看短信配置：`ALIYUN_SMS_GUIDE.md`
- 提交问题到项目仓库

祝开发顺利！🎉
