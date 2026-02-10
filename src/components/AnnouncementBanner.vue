<template>
  <div class="announcement-wrapper">
    <!-- 公告横幅区域（始终显示） -->
    <div class="announcement-banner-area">
      <!-- 有公告时显示内容 -->
      <div v-if="showAnnouncements" class="announcement-container">
        <!-- 置顶公告卡片 -->
        <div v-if="stickyAnnouncements.length > 0" class="sticky-section">
          <div class="sticky-header">
            <span class="sticky-title">📢 重要公告</span>
          </div>
          <div class="sticky-cards">
            <TransitionGroup name="card-slide">
              <div
                v-for="announcement in stickyAnnouncements"
                :key="announcement._id"
                :class="['sticky-card', `card-${getTypeClass(announcement.type)}`]"
                @click="viewAnnouncement(announcement)"
              >
                <div class="card-header">
                  <div class="card-left">
                    <span class="card-icon">{{ getTypeIcon(announcement.type) }}</span>
                    <el-tag
                      :type="getTypeClass(announcement.type)"
                      size="large"
                      effect="dark"
                      class="card-tag"
                    >
                      {{ getTypeLabel(announcement.type) }}
                    </el-tag>
                  </div>
                  <span class="card-time">{{ formatTime(announcement.createdAt) }}</span>
                </div>
                <div class="card-title">{{ announcement.title }}</div>
                <div class="card-preview">{{ announcement.content?.substring(0, 80) }}...</div>
              </div>
            </TransitionGroup>
          </div>
        </div>

        <!-- 普通公告列表 -->
        <div v-if="normalAnnouncements.length > 0" class="normal-section">
          <div class="section-header">
            <span class="section-title">📋 最新通知</span>
            <span class="section-count">共 {{ normalAnnouncements.length }} 条</span>
          </div>
          <transition-group name="announcement" tag="div" class="announcements-list">
            <div
              v-for="announcement in normalAnnouncements"
              :key="announcement._id"
              :class="['announcement-card', `card-${getTypeClass(announcement.type)}`]"
            >
              <div class="card-main" @click="viewAnnouncement(announcement)">
                <div class="card-top">
                  <div class="card-badge">
                    <span class="badge-icon">{{ getTypeIcon(announcement.type) }}</span>
                    <el-tag
                      :type="getTypeClass(announcement.type)"
                      effect="plain"
                      size="default"
                    >
                      {{ getTypeLabel(announcement.type) }}
                    </el-tag>
                  </div>
                  <span class="announcement-time">{{ formatTime(announcement.createdAt) }}</span>
                </div>
                <div class="announcement-title">{{ announcement.title }}</div>
                <div class="announcement-content">{{ announcement.content?.substring(0, 60) }}...</div>
              </div>
              <el-button
                @click.stop="dismissAnnouncement(announcement._id)"
                size="default"
                text
                class="dismiss-button"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- 所有公告都关闭后，显示查看按钮横幅 -->
      <div v-else-if="allAnnouncements.length > 0" class="view-announcements-bar">
        <div class="view-bar-content">
          <span class="view-bar-text">📢 有 {{ allAnnouncements.length }} 条历史公告</span>
          <el-button @click="showHistoryDialog = true" type="primary" size="default">
            查看公告
          </el-button>
        </div>
      </div>
    </div>

    <!-- 公告详情弹窗 -->
    <el-dialog
      v-model="showDialog"
      :title="currentAnnouncement?.title"
      width="500px"
      class="announcement-dialog"
    >
      <div class="dialog-content">
        <el-tag
          :type="getTypeClass(currentAnnouncement?.type)"
          effect="plain"
          size="small"
          class="dialog-tag"
        >
          {{ getTypeLabel(currentAnnouncement?.type) }}
        </el-tag>
        <div class="dialog-text">{{ currentAnnouncement?.content }}</div>
        <div class="dialog-time">{{ formatTime(currentAnnouncement?.createdAt) }}</div>
      </div>
    </el-dialog>

    <!-- 历史公告弹窗 -->
    <el-dialog
      v-model="showHistoryDialog"
      title="📢 全部公告"
      width="700px"
      class="history-dialog"
    >
      <div class="history-content">
        <div v-if="allAnnouncements.length === 0" class="history-empty">
          <p>暂无公告</p>
        </div>
        <div v-else class="history-list">
          <div
            v-for="announcement in allAnnouncements"
            :key="announcement._id"
            :class="['history-item', `history-${getTypeClass(announcement.type)}`]"
            @click="viewAnnouncement(announcement)"
          >
            <div class="history-left">
              <span class="history-icon">{{ getTypeIcon(announcement.type) }}</span>
              <div class="history-info">
                <div class="history-title">
                  {{ announcement.title }}
                  <el-tag
                    v-if="announcement.isSticky"
                    type="danger"
                    size="small"
                    effect="plain"
                    class="sticky-mini-tag"
                  >
                    置顶
                  </el-tag>
                </div>
                <div class="history-meta">
                  <el-tag
                    :type="getTypeClass(announcement.type)"
                    size="small"
                    effect="plain"
                  >
                    {{ getTypeLabel(announcement.type) }}
                  </el-tag>
                  <span class="history-time">{{ formatTime(announcement.createdAt) }}</span>
                </div>
              </div>
            </div>
            <el-icon class="history-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Close, ArrowRight } from '@element-plus/icons-vue'

const announcements = ref([])
const allAnnouncementsList = ref([])
const dismissedIds = ref([])
const showDialog = ref(false)
const showHistoryDialog = ref(false)
const currentAnnouncement = ref(null)

// 获取公告列表
const loadAnnouncements = () => {
  const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]')
  const dismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]')

  dismissedIds.value = dismissed
  allAnnouncementsList.value = allAnnouncements

  // 过滤掉已关闭的普通公告
  announcements.value = allAnnouncements.filter(a => {
    // 置顶公告始终显示
    if (a.isSticky) return true
    // 普通公告如果未关闭则显示
    return !dismissed.includes(a._id)
  })
}

// 所有公告（用于历史弹窗）
const allAnnouncements = computed(() => {
  return allAnnouncementsList.value.sort((a, b) => b.createdAt - a.createdAt)
})

// 置顶公告
const stickyAnnouncements = computed(() => {
  return announcements.value.filter(a => a.isSticky)
})

// 普通公告（只显示最近3条）
const normalAnnouncements = computed(() => {
  return announcements.value
    .filter(a => !a.isSticky)
    .slice(0, 3)
})

// 是否显示公告
const showAnnouncements = computed(() => {
  return stickyAnnouncements.value.length > 0 || normalAnnouncements.value.length > 0
})

// 获取类型样式
const getTypeClass = (type) => {
  const typeMap = {
    info: 'primary',
    warning: 'warning',
    success: 'success',
    error: 'danger'
  }
  return typeMap[type] || 'info'
}

// 获取类型标签
const getTypeLabel = (type) => {
  const labelMap = {
    info: '通知',
    warning: '警告',
    success: '活动',
    error: '紧急'
  }
  return labelMap[type] || '通知'
}

// 获取类型图标
const getTypeIcon = (type) => {
  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    success: '🎉',
    error: '🚨'
  }
  return iconMap[type] || '📢'
}

// 查看公告详情
const viewAnnouncement = (announcement) => {
  currentAnnouncement.value = announcement
  showDialog.value = true
}

// 关闭普通公告
const dismissAnnouncement = (id) => {
  dismissedIds.value.push(id)
  localStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissedIds.value))

  announcements.value = announcements.value.filter(a => a._id !== id)
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.announcement-wrapper {
  position: relative;
}

/* 公告横幅区域（始终占据空间） */
.announcement-banner-area {
  width: 100%;
  background: #fafbfc;
}

/* 查看公告横幅 */
.view-announcements-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 20px;
}

.view-bar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.view-bar-text {
  color: white;
  font-size: 15px;
  font-weight: 500;
}

.announcement-container {
  position: relative;
  z-index: 999;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

/* 置顶公告区域 */
.sticky-section {
  margin-bottom: 24px;
}

.sticky-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.sticky-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  letter-spacing: -0.5px;
}

.sticky-cards {
  display: grid;
  gap: 16px;
}

.sticky-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 2px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sticky-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.sticky-card.card-primary::before {
  background: linear-gradient(90deg, #409eff 0%, #66b1ff 100%);
}

.sticky-card.card-warning::before {
  background: linear-gradient(90deg, #e6a23c 0%, #f0c78a 100%);
}

.sticky-card.card-success::before {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.sticky-card.card-danger::before {
  background: linear-gradient(90deg, #f56c6c 0%, #f89898 100%);
}

.sticky-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  font-size: 28px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.card-tag {
  font-size: 14px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
}

.card-time {
  font-size: 13px;
  color: #999;
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
  line-height: 1.4;
}

.card-preview {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
}

/* 普通公告区域 */
.normal-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.section-count {
  font-size: 14px;
  color: #999;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-card {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.announcement-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateX(4px);
}

.card-main {
  flex: 1;
  padding: 20px;
  cursor: pointer;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-icon {
  font-size: 24px;
}

.announcement-time {
  font-size: 13px;
  color: #999;
}

.announcement-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.4;
}

.announcement-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.dismiss-button {
  flex-shrink: 0;
  padding: 0 16px;
  color: #999;
  transition: all 0.3s ease;
}

.dismiss-button:hover {
  color: #f56c6c;
  background: #fee;
}

/* 卡片动画 */
.card-slide-enter-active,
.card-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-slide-enter-from {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.card-slide-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.card-slide-move {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 公告列表动画 */
.announcement-enter-active,
.announcement-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.announcement-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.announcement-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.announcement-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 弹窗样式 */
.dialog-content {
  padding: 20px 0;
}

.dialog-tag {
  margin-bottom: 20px;
  font-size: 15px;
  padding: 8px 16px;
}

.dialog-text {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 24px;
}

.dialog-time {
  font-size: 13px;
  color: #999;
  text-align: right;
}

/* 历史公告弹窗样式 */
.history-content {
  max-height: 60vh;
  overflow-y: auto;
}

.history-empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.history-item:hover {
  background: white;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.history-item.history-primary {
  border-color: #409eff;
}

.history-item.history-warning {
  border-color: #e6a23c;
}

.history-item.history-success {
  border-color: #67c23a;
}

.history-item.history-danger {
  border-color: #f56c6c;
}

.history-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}

.history-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sticky-mini-tag {
  flex-shrink: 0;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-time {
  font-size: 13px;
  color: #999;
}

.history-arrow {
  flex-shrink: 0;
  font-size: 20px;
  color: #999;
  transition: all 0.3s ease;
}

.history-item:hover .history-arrow {
  color: #409eff;
  transform: translateX(4px);
}

/* 弹窗标题样式优化 */
:deep(.history-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 700;
}

:deep(.history-dialog .el-dialog__body) {
  padding: 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .announcement-container {
    padding: 12px;
  }

  .sticky-title {
    font-size: 18px;
  }

  .sticky-card {
    padding: 20px;
  }

  .card-title {
    font-size: 17px;
  }

  .card-preview {
    font-size: 14px;
  }

  .announcement-title {
    font-size: 16px;
  }

  .announcement-content {
    font-size: 13px;
  }

  .view-bar-content {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
}
</style>
