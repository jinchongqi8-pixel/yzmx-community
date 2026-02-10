<template>
  <div class="notification-list">
    <div v-if="notifications.length === 0" class="empty">
      <p>暂无通知</p>
    </div>

    <div v-else class="notification-items">
      <div
        v-for="notification in notifications"
        :key="notification._id"
        class="notification-item"
        :class="{ unread: !notification.isRead }"
        @click="handleClick(notification)"
      >
        <div class="notification-icon" :class="`icon-${notification.type}`">
          <span v-if="notification.type === 'like'">❤️</span>
          <span v-else-if="notification.type === 'comment'">💬</span>
          <span v-else-if="notification.type === 'collect'">⭐</span>
          <span v-else-if="notification.type === 'reply'">💭</span>
          <span v-else-if="notification.type === 'welcome'">🎉</span>
          <span v-else-if="notification.type === 'mention'">@</span>
          <span v-else-if="notification.type === 'comment_like'">💝</span>
          <span v-else-if="notification.type === 'comment_reaction'">😊</span>
          <span v-else>📢</span>
        </div>
        <img :src="notification.userAvatar || '/default-avatar.png'" class="notification-avatar" />
        <div class="notification-content">
          <div class="notification-header">
            <span class="notification-user">{{ notification.userName }}</span>
            <span class="notification-time">{{ formatNotificationTime(notification.createdAt) }}</span>
          </div>
          <div class="notification-text">{{ notification.content }}</div>
          <div v-if="notification.postContent" class="notification-post-preview">
            "{{ notification.postContent }}"
          </div>
        </div>
        <div v-if="!notification.isRead" class="unread-dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { formatTime } from '../utils/formatTime'

const router = useRouter()

defineProps({
  notifications: {
    type: Array,
    default: () => []
  }
})

// 格式化通知时间
const formatNotificationTime = (timestamp) => {
  return formatTime(timestamp)
}

const handleClick = (notification) => {
  const wasUnread = !notification.isRead

  // 标记为已读
  notification.isRead = true

  // 保存已读状态到localStorage（保存到当前用户的通知列表）
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (currentUser._id) {
    const key = `notifications_${currentUser._id}`
    const allNotifications = JSON.parse(localStorage.getItem(key) || '[]')
    const index = allNotifications.findIndex(n => n._id === notification._id)
    if (index !== -1) {
      allNotifications[index].isRead = true
      localStorage.setItem(key, JSON.stringify(allNotifications))
    }
  }

  // 如果从未读变为已读，更新全局未读数
  if (wasUnread && window.updateNotificationBadge) {
    window.updateNotificationBadge()
  }

  // 跳转到相关页面
  if (notification.postId) {
    router.push(`/post/${notification.postId}`)
  }
}
</script>

<style scoped>
.notification-list {
  min-height: 300px;
}

.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.notification-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
  position: relative;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 50%;
}

.notification-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
  background: #fff;
}

.notification-item.unread {
  background: rgba(139, 92, 246, 0.05);
}

.notification-item.unread.icon-welcome {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
}

.notification-icon.icon-welcome {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.notification-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-user {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.notification-time {
  font-size: 13px;
  color: #999;
}

.notification-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 4px;
}

.notification-post-preview {
  font-size: 13px;
  color: #999;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  font-style: italic;
}

.unread-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
