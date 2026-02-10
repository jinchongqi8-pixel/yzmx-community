<template>
  <div class="login-page">
    <div class="background-decoration"></div>
    <div class="login-card">
      <div class="logo-section">
        <img src="/logo.jpg" alt="颜祖美学" class="logo-img" />
        <h1>颜祖美学</h1>
        <p class="subtitle">开启你的美学之旅</p>
      </div>

      <div class="form-section">
        <div class="form-item">
          <div class="input-wrapper">
            <span class="input-icon">📱</span>
            <input
              v-model="phone"
              type="text"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </div>
        </div>

        <div class="form-item">
          <div class="input-wrapper code-wrapper">
            <span class="input-icon">🔐</span>
            <input
              v-model="code"
              type="text"
              placeholder="请输入验证码"
              maxlength="6"
            />
            <button
              @click="sendCode"
              :disabled="countdown > 0"
              class="code-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </button>
          </div>
        </div>

        <button @click="login" class="login-btn">
          <span>登 录</span>
        </button>

        <div class="tips">
          <span class="tip-icon">💡</span>
          <span>开发模式：输入任意手机号和验证码即可登录</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createNotification } from '../utils/notification'

const routerInstance = useRouter()
const phone = ref('')
const code = ref('')
const countdown = ref(0)

const sendCode = () => {
  if (!phone.value || phone.value.length !== 11) {
    alert('请输入正确的手机号')
    return
  }

  alert('验证码已发送！')
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

const login = () => {
  if (!phone.value || !code.value) {
    alert('请输入手机号和验证码')
    return
  }

  // 使用手机号作为固定的用户ID，确保每次登录ID一致
  const userId = 'user_' + phone.value

  // 从users数组中查找用户
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  let userInfo = users.find(u => u._id === userId)

  if (userInfo) {
    // 找到了用户，使用已保存的信息（包括修改过的昵称、头像等）
    console.log('找到已存在的用户:', userInfo)
  } else {
    // 新用户，创建并保存
    userInfo = createNewUser(userId, phone.value)
    users.push(userInfo)
    localStorage.setItem('users', JSON.stringify(users))
    console.log('创建新用户:', userInfo)

    // 发送欢迎通知
    createWelcomeNotification(userInfo)
  }

  localStorage.setItem('token', 'dev_token_' + Date.now())
  localStorage.setItem('userInfo', JSON.stringify(userInfo))

  alert('登录成功！')
  routerInstance.push('/community')
}

// 创建新用户
const createNewUser = (userId, phone) => {
  return {
    _id: userId,
    phone: phone,
    nickname: '用户' + phone.substr(-4),
    avatar: '',
    coins: 1000,
    level: 1,
    postsCount: 0,
    likesCount: 0,
    checkInDays: 0,
    registerTime: Date.now() // 记录注册时间
  }
}

// 发送欢迎通知
const createWelcomeNotification = (user) => {
  createNotification(user._id, {
    type: 'welcome',
    userId: 'system',
    userName: '系统',
    userAvatar: '',
    postId: '',
    content: '欢迎加入颜祖美学社群，在这里我们一起蜕变 💪✨',
    postContent: '开始你的学习之旅吧~'
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.background-decoration {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  top: -200px;
  right: -200px;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(-30px, 30px) scale(1.1);
  }
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-img {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.login-card h1 {
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.subtitle {
  color: #999;
  font-size: 14px;
  margin: 0;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  margin-bottom: 0;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  background: white;
  border-color: #ff6b6b;
  box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
}

.input-icon {
  padding: 0 12px 0 16px;
  font-size: 18px;
}

.input-wrapper input {
  flex: 1;
  height: 52px;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #333;
  outline: none;
}

.input-wrapper input::placeholder {
  color: #aaa;
}

.code-wrapper {
  padding-right: 4px;
}

.code-btn {
  padding: 0 20px;
  height: 44px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.code-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.code-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  height: 52px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.login-btn:active {
  transform: translateY(0);
}

.tips {
  margin-top: 24px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%);
  border-radius: 10px;
  color: #d97706;
  font-size: 13px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(217, 119, 6, 0.2);
}

.tip-icon {
  font-size: 16px;
}
</style>
