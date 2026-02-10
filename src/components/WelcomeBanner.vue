<template>
  <transition name="slide-down">
    <div v-if="visible" class="welcome-banner">
      <div class="banner-content">
        <div class="banner-icon">🎉</div>
        <div class="banner-text">
          <div class="banner-title">欢迎加入颜祖美学社群！</div>
          <div class="banner-subtitle">在这里我们一起蜕变 💪✨</div>
        </div>
        <button @click="closeBanner" class="close-btn">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Close } from '@element-plus/icons-vue'

const visible = ref(false)

onMounted(() => {
  // 检查是否已经显示过欢迎横幅
  const hasShownWelcome = localStorage.getItem('hasShownWelcome')

  // 检查是否是新用户（最近注册的）
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const registerTime = userInfo.registerTime || 0
  const isVeryNewUser = Date.now() - registerTime < 5 * 60 * 1000 // 5分钟内注册的

  if (!hasShownWelcome || isVeryNewUser) {
    // 延迟一点显示，让页面先加载
    setTimeout(() => {
      visible.value = true
    }, 500)
  }
})

const closeBanner = () => {
  visible.value = false
  // 记录已经显示过
  localStorage.setItem('hasShownWelcome', 'true')
}
</script>

<style scoped>
.welcome-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.banner-icon {
  font-size: 36px;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.banner-text {
  flex: 1;
}

.banner-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.banner-subtitle {
  font-size: 14px;
  opacity: 0.95;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .banner-content {
    padding: 12px 16px;
    gap: 12px;
  }

  .banner-icon {
    font-size: 28px;
  }

  .banner-title {
    font-size: 16px;
  }

  .banner-subtitle {
    font-size: 13px;
  }

  .close-btn {
    width: 28px;
    height: 28px;
  }
}
</style>
