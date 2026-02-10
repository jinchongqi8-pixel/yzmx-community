<template>
  <div class="chat-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <el-button @click="$router.back()" class="back-btn">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div class="chat-header-info" v-if="partnerUser">
          <img :src="partnerUser.avatar || '/default-avatar.png'" class="partner-avatar" />
          <span class="partner-name">{{ partnerUser.nickname }}</span>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 检查登录状态 -->
      <div v-if="!currentUser" class="login-required">
        <div class="login-required-content">
          <div class="empty-icon">🔒</div>
          <p>请先登录</p>
          <el-button type="primary" @click="router.push('/login')">去登录</el-button>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-else-if="!partnerUser" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- 聊天界面 -->
      <div v-else class="chat-content">
        <!-- 消息列表 -->
      <div class="messages-list" ref="messagesListRef">
        <div v-if="messages.length === 0" class="empty-messages">
          <p>还没有消息，打个招呼吧~</p>
        </div>

        <div
          v-for="message in messages"
          :key="message._id"
          class="message-item"
          :class="{ 'message-me': message.fromUserId === currentUser?._id }"
        >
          <!-- 撤回的消息 -->
          <div v-if="message.isRecalled" class="recalled-message">
            <span v-if="message.fromUserId === currentUser?._id">你撤回了一条消息</span>
            <span v-else>对方撤回了一条消息</span>
          </div>

          <!-- 正常消息 -->
          <template v-else>
            <img
              v-if="message.fromUserId !== currentUser?._id"
              :src="partnerUser.avatar || '/default-avatar.png'"
              class="message-avatar"
            />
            <div class="message-content-wrapper">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-time">{{ formatTime(message.createdAt) }}</div>
              <!-- 消息操作按钮（只显示自己的消息） -->
              <div v-if="message.fromUserId === currentUser?._id" class="message-actions">
                <el-dropdown trigger="click" @command="handleMessageAction($event, message)">
                  <span class="action-trigger">•••</span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        command="recall"
                        v-if="canRecall(message)"
                      >
                        撤回
                      </el-dropdown-item>
                      <el-dropdown-item command="delete">
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
            <img
              v-if="message.fromUserId === currentUser?._id"
              :src="currentUser.avatar || '/default-avatar.png'"
              class="message-avatar"
            />
          </template>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="input-area">
        <el-input
          v-model="messageContent"
          type="textarea"
          :rows="1"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息，按 Enter 发送，Shift+Enter 换行"
          @keyup.enter.prevent="handleEnter"
          class="message-input"
        />
        <el-button
          type="primary"
          @click="sendMessage"
          :disabled="!messageContent.trim()"
          class="send-btn"
        >
          发送
        </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'

const route = useRoute()
const router = useRouter()
const messagesListRef = ref(null)

const currentUser = ref(null)
const partnerUser = ref(null)
const messages = ref([])
const messageContent = ref('')

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载对话伙伴信息
const loadPartnerUser = () => {
  const partnerId = route.params.userId

  // 从 users 数组中查找
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  let partner = users.find(u => u._id === partnerId)

  if (!partner) {
    // 从 posts 中查找
    const posts = JSON.parse(localStorage.getItem('posts') || '[]')
    const partnerPost = posts.find(p => p.userId === partnerId)

    if (partnerPost) {
      partner = {
        _id: partnerId,
        nickname: partnerPost.userName,
        avatar: partnerPost.userAvatar || ''
      }
    }
  }

  if (!partner) {
    partner = {
      _id: partnerId,
      nickname: '未知用户',
      avatar: ''
    }
  }

  partnerUser.value = partner
}

// 加载消息
const loadMessages = () => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    const userId = currentUser.value._id
    const partnerId = route.params.userId

    // 筛选当前对话的消息
    const conversationMessages = allMessages.filter(msg => {
      return (msg.fromUserId === userId && msg.toUserId === partnerId) ||
             (msg.fromUserId === partnerId && msg.toUserId === userId)
    })

    // 按时间排序
    messages.value = conversationMessages.sort((a, b) => a.createdAt - b.createdAt)

    // 标记消息为已读
    markMessagesAsRead()
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

// 标记消息为已读
const markMessagesAsRead = () => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    const partnerId = route.params.userId
    const userId = currentUser.value._id

    let hasUpdate = false
    allMessages.forEach(msg => {
      if (msg.fromUserId === partnerId && msg.toUserId === userId && msg.isRead === false) {
        msg.isRead = true
        hasUpdate = true
      }
    })

    if (hasUpdate) {
      localStorage.setItem('messages', JSON.stringify(allMessages))
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

// 处理 Enter 键
const handleEnter = (event) => {
  // Shift+Enter 换行，Enter 发送
  if (event.shiftKey) {
    // 允许换行，不做处理
    return
  }
  // 发送消息
  sendMessage()
}

// 发送消息
const sendMessage = () => {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  try {
    const newMessage = {
      _id: `msg_${Date.now()}`,
      fromUserId: currentUser.value._id,
      toUserId: route.params.userId,
      content: messageContent.value.trim(),
      createdAt: Date.now(),
      isRead: false
    }

    // 保存到 localStorage
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    allMessages.push(newMessage)
    localStorage.setItem('messages', JSON.stringify(allMessages))

    // 添加到消息列表
    messages.value.push(newMessage)

    // 清空输入框
    messageContent.value = ''

    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } catch (error) {
    console.error('发送失败:', error)
    ElMessage.error('发送失败')
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesListRef.value) {
    messagesListRef.value.scrollTop = messagesListRef.value.scrollHeight
  }
}

// 判断是否可以撤回消息（2分钟内）
const canRecall = (message) => {
  const twoMinutes = 2 * 60 * 1000
  const now = Date.now()
  return now - message.createdAt < twoMinutes
}

// 处理消息操作
const handleMessageAction = (action, message) => {
  if (action === 'recall') {
    recallMessage(message)
  } else if (action === 'delete') {
    deleteMessage(message)
  }
}

// 撤回消息
const recallMessage = (message) => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    const index = allMessages.findIndex(m => m._id === message._id)

    if (index !== -1) {
      // 标记为已撤回
      allMessages[index].isRecalled = true
      allMessages[index].content = '' // 清空内容

      localStorage.setItem('messages', JSON.stringify(allMessages))

      // 更新本地消息列表
      const localIndex = messages.value.findIndex(m => m._id === message._id)
      if (localIndex !== -1) {
        messages.value[localIndex] = { ...allMessages[index] }
      }

      ElMessage.success('消息已撤回')
    }
  } catch (error) {
    console.error('撤回失败:', error)
    ElMessage.error('撤回失败')
  }
}

// 删除消息
const deleteMessage = (message) => {
  try {
    const allMessages = JSON.parse(localStorage.getItem('messages') || '[]')
    const index = allMessages.findIndex(m => m._id === message._id)

    if (index !== -1) {
      // 从列表中删除
      allMessages.splice(index, 1)
      localStorage.setItem('messages', JSON.stringify(allMessages))

      // 更新本地消息列表
      const localIndex = messages.value.findIndex(m => m._id === message._id)
      if (localIndex !== -1) {
        messages.value.splice(localIndex, 1)
      }

      ElMessage.success('消息已删除')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  currentUser.value = getCurrentUser()

  if (!currentUser.value) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  loadPartnerUser()
  loadMessages()

  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})
</script>

<style scoped>
.chat-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 背景装饰 */
.chat-container::before {
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

.chat-container::after {
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
  height: 60px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.partner-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
  transition: all 0.3s ease;
}

.partner-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.partner-name {
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.login-required,
.loading-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-required-content {
  text-align: center;
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

.empty-messages {
  text-align: center;
  padding: 80px 20px;
  color: #94a3b8;
}

.empty-messages::before {
  content: '💬';
  font-size: 80px;
  display: block;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-messages {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.message-item {
  display: flex;
  gap: 12px;
  max-width: 70%;
  animation: messageSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes messageSlideIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-item.message-me {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid rgba(139, 92, 246, 0.2);
  transition: all 0.3s ease;
}

.message-avatar:hover {
  transform: scale(1.1);
  border-color: #8b5cf6;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.message-content {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  transition: all 0.3s ease;
  position: relative;
}

.message-item:not(.message-me) .message-content {
  background: white;
  color: #334155;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.message-item:not(.message-me) .message-content:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.message-item.message-me .message-content {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.message-item.message-me .message-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.message-item.message-me .message-content:hover::before {
  left: 100%;
}

.message-time {
  font-size: 11px;
  color: #999;
  padding: 0 4px;
}

.message-item.message-me .message-time {
  text-align: right;
}

/* 消息操作按钮 */
.message-actions {
  position: absolute;
  top: 50%;
  right: -30px;
  transform: translateY(-50%);
  z-index: 100;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.action-trigger {
  font-size: 14px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  background: white;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  user-select: none;
  transition: all 0.2s ease;
  width: 24px;
  height: 24px;
}

.action-trigger:hover {
  color: #64748b;
  background: #f8fafc;
  transform: scale(1.05);
}

/* 撤回的消息 */
.recalled-message {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-size: 13px;
  color: #999;
  font-style: italic;
  text-align: center;
}

.input-area {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  padding: 16px 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  gap: 12px;
  align-items: flex-end;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 10;
}

.message-input {
  flex: 1;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
}

.message-input :deep(.el-textarea__inner):focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.1);
  background: #ffffff;
  transform: translateY(-1px);
}

.send-btn {
  flex-shrink: 0;
  height: 40px;
  padding: 0 24px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.send-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.send-btn:active::before {
  width: 300px;
  height: 300px;
}

.send-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .nav-content {
    padding: 0 16px;
  }

  .messages-list {
    padding: 16px;
  }

  .message-item {
    max-width: 80%;
  }

  .input-area {
    padding: 12px 16px;
  }
}
</style>
