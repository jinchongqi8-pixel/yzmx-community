<template>
  <nav class="global-navbar">
    <div class="nav-content">
      <router-link to="/community" class="logo">
        <img src="/logo.jpg" alt="颜祖美学" class="logo-img" />
        <span class="logo-text">颜祖美学</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/community" class="nav-link">
          社群
        </router-link>
        <router-link to="/course" class="nav-link">
          课程
        </router-link>
        <router-link to="/topic-square" class="nav-link">
          话题
        </router-link>
        <router-link to="/profile" class="nav-link">
          我的
        </router-link>
        <router-link to="/notification" class="nav-link notification-link">
          <el-icon><Bell /></el-icon>
          <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bell } from '@element-plus/icons-vue'

const unreadCount = ref(0)

// 计算未读通知数量
const updateUnreadCount = () => {
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!currentUser._id) {
    unreadCount.value = 0
    return
  }

  const key = `notifications_${currentUser._id}`
  const notifications = JSON.parse(localStorage.getItem(key) || '[]')
  unreadCount.value = notifications.filter(n => !n.isRead).length
}

// 页面加载时更新
onMounted(() => {
  updateUnreadCount()
})

// 监听localStorage变化（实时更新未读数）
window.addEventListener('storage', (e) => {
  if (e.key && e.key.includes('notifications_')) {
    updateUnreadCount()
  }
})

// 暴露方法供外部调用
window.updateNotificationBadge = updateUnreadCount
</script>

<style scoped>
.global-navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-img {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-size: 24px;
  font-weight: 600;
  color: #0ea5e9;
}

.nav-links {
  display: flex;
  gap: 30px;
  align-items: center;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s;
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #0ea5e9;
}

.notification-link {
  font-size: 20px;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  animation: bounce 0.3s ease-in-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
