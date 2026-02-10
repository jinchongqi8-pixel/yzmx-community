<template>
  <div class="notification-container">
    <!-- 全局导航栏 -->
    <Navbar />

    <!-- 主要内容 -->
    <main class="main-content">
      <h2 class="page-title">消息通知</h2>

      <!-- 标签筛选 -->
      <el-tabs v-model="activeTab" class="notification-tabs">
        <el-tab-pane label="全部" name="all">
          <notification-list :notifications="filteredNotifications" />
        </el-tab-pane>

        <el-tab-pane label="评论" name="comment">
          <notification-list :notifications="filteredNotifications" />
        </el-tab-pane>

        <el-tab-pane label="点赞" name="like">
          <notification-list :notifications="filteredNotifications" />
        </el-tab-pane>

        <el-tab-pane label="收藏" name="collect">
          <notification-list :notifications="filteredNotifications" />
        </el-tab-pane>

        <el-tab-pane label="回复" name="reply">
          <notification-list :notifications="filteredNotifications" />
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NotificationList from '../components/NotificationList.vue'
import Navbar from '../components/Navbar.vue'

const activeTab = ref('all')
const notifications = ref([])

// 过滤通知
const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') {
    return notifications.value
  }
  return notifications.value.filter(n => n.type === activeTab.value)
})

// 加载通知
const loadNotifications = () => {
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!currentUser._id) {
    notifications.value = []
    return
  }

  // 只加载当前用户的通知
  const key = `notifications_${currentUser._id}`
  const allNotifications = JSON.parse(localStorage.getItem(key) || '[]')

  // 自动将所有通知标记为已读
  let hasUnread = false
  allNotifications.forEach(n => {
    if (!n.isRead) {
      n.isRead = true
      hasUnread = true
    }
  })

  // 保存已读状态
  if (hasUnread) {
    localStorage.setItem(key, JSON.stringify(allNotifications))
  }

  notifications.value = allNotifications

  // 更新导航栏未读数
  if (hasUnread && window.updateNotificationBadge) {
    window.updateNotificationBadge()
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notification-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
}

/* 背景装饰 */
.notification-container::before {
  content: '';
  position: fixed;
  top: -30%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.notification-container::after {
  content: '';
  position: fixed;
  bottom: -20%;
  left: -5%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.navbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.main-content {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
}

.notification-tabs {
  background: white;
  border-radius: 20px;
  padding: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.notification-tabs:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}
</style>
