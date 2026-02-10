<template>
  <div class="messages-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link">社群</router-link>
          <router-link to="/course" class="nav-link">课程</router-link>
          <router-link to="/topic-square" class="nav-link">话题</router-link>
          <router-link to="/profile" class="nav-link">我的</router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="title">💬 消息</h1>
        <p class="subtitle">查看和发送私信</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 空状态 -->
      <div v-else-if="conversations.length === 0" class="empty">
        <div class="empty-icon">💬</div>
        <p>还没有消息</p>
        <p class="empty-hint">去关注一些用户，开始聊天吧~</p>
        <el-button type="primary" @click="router.push('/community')">
          去社群逛逛
        </el-button>
      </div>

      <!-- 对话列表 -->
      <div v-else class="conversations-list">
        <div
          v-for="conversation in conversations"
          :key="conversation.userId"
          class="conversation-item"
          @click="openChat(conversation.userId)"
          :class="{ unread: !conversation.isRead }"
        >
          <img
            :src="conversation.avatar || '/default-avatar.png'"
            class="conversation-avatar"
          />
          <div class="conversation-info">
            <div class="conversation-header">
              <span class="conversation-name">{{ conversation.nickname }}</span>
              <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
            </div>
            <div class="conversation-preview">
              <span v-if="conversation.lastMessageSender === 'me'" class="sender-label">我: </span>
              {{ conversation.lastMessage }}
            </div>
          </div>
          <div class="conversation-actions">
            <el-dropdown trigger="click" @command="(cmd) => handleConversationAction(cmd, conversation.userId)">
              <span class="more-btn" @click.stop>
                <el-icon><MoreFilled /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="delete">
                    <el-icon><Delete /></el-icon>
                    删除对话
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div v-if="!conversation.isRead" class="unread-badge"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Delete } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const loading = ref(true)
const conversations = ref([])

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载对话列表
const loadConversations = () => {
  loading.value = true
  try {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      router.push('/login')
      return
    }

    // 获取所有消息
    const messages = JSON.parse(localStorage.getItem('messages') || '[]')

    // 获取所有用户信息
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')

    // 按对话伙伴分组
    const conversationsMap = new Map()

    messages.forEach(msg => {
      const isMe = msg.fromUserId === currentUser._id
      const partnerId = isMe ? msg.toUserId : msg.fromUserId

      if (!conversationsMap.has(partnerId)) {
        // 获取对话伙伴的信息
        let partnerUser = users.find(u => u._id === partnerId)

        if (!partnerUser) {
          const partnerPost = allPosts.find(p => p.userId === partnerId)
          partnerUser = {
            _id: partnerId,
            nickname: partnerPost?.userName || '未知用户',
            avatar: partnerPost?.userAvatar || ''
          }
        }

        conversationsMap.set(partnerId, {
          userId: partnerId,
          nickname: partnerUser.nickname,
          avatar: partnerUser.avatar,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          lastMessageSender: isMe ? 'me' : 'other',
          isRead: msg.isRead !== false || !isMe,
          messagesCount: 1
        })
      } else {
        // 更新最后一条消息
        const conv = conversationsMap.get(partnerId)
        if (msg.createdAt > conv.lastMessageTime) {
          conv.lastMessage = msg.content
          conv.lastMessageTime = msg.createdAt
          conv.lastMessageSender = isMe ? 'me' : 'other'
          conv.isRead = msg.isRead !== false || !isMe
        }
        conv.messagesCount++
      }
    })

    // 转换为数组并排序（按最后消息时间倒序）
    conversations.value = Array.from(conversationsMap.values()).sort((a, b) => {
      return b.lastMessageTime - a.lastMessageTime
    })
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 打开聊天
const openChat = (userId) => {
  router.push(`/messages/${userId}`)
}

// 处理对话操作
const handleConversationAction = (action, userId) => {
  if (action === 'delete') {
    deleteConversation(userId)
  }
}

// 删除对话
const deleteConversation = async (userId) => {
  try {
    await ElMessageBox.confirm(
      '删除后将清空与该用户的所有聊天记录，此操作不可恢复',
      '确认删除对话？',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    const currentUser = getCurrentUser()
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')

    // 过滤掉与该用户相关的所有消息
    const remainingMessages = allMessages.filter(msg => {
      return !((msg.fromUserId === currentUser._id && msg.toUserId === userId) ||
               (msg.fromUserId === userId && msg.toUserId === currentUser._id))
    })

    localStorage.setItem('messages', JSON.stringify(remainingMessages))

    // 重新加载对话列表
    loadConversations()

    ElMessage.success('对话已删除')
  } catch (error) {
    // 用户取消删除
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadConversations()
})
</script>

<style scoped>
.messages-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
}

/* 背景装饰 */
.messages-container::before {
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

.navbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.navbar:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
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
  gap: 32px;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
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

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.loading,
.empty {
  padding: 80px 20px;
  text-align: center;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  display: block;
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

.empty-hint {
  font-size: 14px;
  color: #999;
  margin: 8px 0 24px 0;
}

.conversations-list {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.conversations-list:hover {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.1);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
  position: relative;
}

.conversation-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  transition: width 0.3s ease;
}

.conversation-item:hover::before {
  width: 4px;
}

.conversation-item:hover {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.03), transparent);
  transform: translateX(4px);
}

.conversation-item:last-child {
  border-bottom: none;
}

.conversation-item.unread {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05), transparent);
}

.conversation-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.conversation-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.conversation-time {
  font-size: 12px;
  color: #999;
}

.conversation-preview {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sender-label {
  color: #0ea5e9;
  font-weight: 500;
}

.conversation-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.more-btn {
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.more-btn:hover {
  color: #666;
}

.unread-badge {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .main-content {
    padding: 16px;
  }

  .title {
    font-size: 24px;
  }

  .conversation-item {
    padding: 12px;
    gap: 12px;
  }

  .conversation-avatar {
    width: 48px;
    height: 48px;
  }

  .conversation-name {
    font-size: 15px;
  }

  .conversation-preview {
    font-size: 13px;
  }
}
</style>
