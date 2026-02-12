<template>
  <div class="community-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link active">
            <span class="nav-icon">📚</span>
            <span>社群</span>
          </router-link>
          <router-link to="/course" class="nav-link">
            <span class="nav-icon">📖</span>
            <span>课程</span>
          </router-link>
          <router-link to="/topic-square" class="nav-link">
            <span class="nav-icon">💬</span>
            <span>话题</span>
          </router-link>
          <router-link to="/profile" class="nav-link">
            <span class="nav-icon">👤</span>
            <span>我的</span>
          </router-link>
        </div>
        <div class="nav-actions">
          <router-link to="/search" class="search-btn">
            <el-icon><Search /></el-icon>
          </router-link>
          <router-link to="/messages" class="msg-btn">
            <el-icon><ChatDotRound /></el-icon>
            <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 快速操作栏 -->
    <div class="quick-actions">
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ totalPosts }}</span>
          <span class="stat-label">帖子</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ todayPosts }}</span>
          <span class="stat-label">今日新增</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ onlineUsers }}</span>
          <span class="stat-label">在线</span>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 筛选标签 -->
      <div class="filter-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="filter-tab"
          :class="{ active: currentTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
          <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
        </div>
      </div>

      <!-- 帖子列表 -->
      <div class="post-list">
        <div v-if="loading" class="loading">
          <div v-for="i in 3" :key="i" class="skeleton-card">
            <div class="skeleton-header">
              <div class="skeleton-avatar"></div>
              <div class="skeleton-info">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line tiny"></div>
              </div>
            </div>
            <div class="skeleton-content">
              <div class="skeleton-line"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <div v-else-if="posts.length === 0" class="empty">
          <div class="empty-icon">📝</div>
          <p class="empty-title">还没有帖子</p>
          <p class="empty-desc">快来发布第一条内容吧~</p>
          <el-button type="primary" @click="router.push('/post/create')" class="empty-btn">
            <el-icon><Plus /></el-icon>
            发布帖子
          </el-button>
        </div>

        <div v-else class="posts-wrapper">
          <div
            v-for="(post, index) in posts"
            :key="post.id"
            class="post-card"
            @click="goToDetail(post.id)"
          >
            <!-- 作者信息 -->
            <div class="post-header" @click.stop>
              <img
                :src="post.author_avatar || defaultAvatar"
                class="avatar"
                @click="goToUserProfile(post.author_id)"
              />
              <div class="user-info">
                <div class="user-name-row">
                  <span class="user-name">{{ post.author_name }}</span>
                  <span class="user-level" v-if="post.author_level">Lv.{{ post.author_level }}</span>
                </div>
                <div class="post-time">{{ formatTime(post.created_at) }}</div>
              </div>
              <el-button
                v-if="post.author_id !== currentUserId"
                @click.stop="toggleFollow(post.author_id)"
                :type="isFollowing(post.author_id) ? 'default' : 'primary'"
                size="small"
                :loading="followLoading[post.author_id]"
              >
                {{ isFollowing(post.author_id) ? '已关注' : '+ 关注' }}
              </el-button>
            </div>

            <!-- 帖子内容 -->
            <div class="post-content">
              {{ post.content }}
            </div>

            <!-- 帖子图片 -->
            <div v-if="post.images && post.images.length" class="post-images">
              <div
                v-for="(img, index) in post.images.slice(0, 3)"
                :key="index"
                class="post-image-wrapper"
              >
                <img :src="img" class="post-image" @click.stop="previewImage(post.images, index)" />
                <span v-if="post.images.length > 3 && index === 2" class="more-count">
                  +{{ post.images.length - 3 }}
                </span>
              </div>
            </div>

            <!-- 标签 -->
            <div v-if="post.tags && post.tags.length" class="post-tags">
              <span v-for="tag in post.tags.slice(0, 3)" :key="tag" class="tag">
                #{{ tag }}
              </span>
            </div>

            <!-- 操作栏 -->
            <div class="post-actions" @click.stop>
              <div
                class="action-item"
                :class="{ active: isLiked(post.id) }"
                @click="toggleLike(post)"
              >
                <span class="action-icon">{{ isLiked(post.id) ? '❤️' : '🤍' }}</span>
                <span class="action-text">{{ post.like_count || 0 }}</span>
              </div>
              <div class="action-item" @click="goToDetail(post.id)">
                <span class="action-icon">💬</span>
                <span class="action-text">{{ post.comment_count || 0 }}</span>
              </div>
              <div class="action-item">
                <span class="action-icon">👁️</span>
                <span class="action-text">{{ post.view_count || 0 }}</span>
              </div>
              <div class="action-item share-btn" @click="sharePost(post)">
                <span class="action-icon">📤</span>
              </div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore && !loadingMore" class="load-more" @click="loadMore">
            <span>加载更多</span>
          </div>
          <div v-if="loadingMore" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </div>
      </div>
    </main>

    <!-- 浮动发帖按钮 -->
    <el-button
      type="primary"
      class="fab-button"
      @click="router.push('/post/create')"
      size="large"
    >
      <el-icon><Plus /></el-icon>
    </el-button>

    <!-- 底部导航（移动端） -->
    <div class="bottom-nav">
      <router-link to="/community" class="nav-item active">
        <span>📚</span>
      </router-link>
      <router-link to="/course" class="nav-item">
        <span>📖</span>
      </router-link>
      <router-link to="/post/create" class="nav-item fab-item">
        <span>✏️</span>
      </router-link>
      <router-link to="/messages" class="nav-item">
        <span>💬</span>
      </router-link>
      <router-link to="/profile" class="nav-item">
        <span>👤</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { getPostList, toggleLike, checkLike, toggleFollow } from '../api/cloud'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const posts = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const currentTab = ref('all')
const currentUserId = ref(localStorage.getItem('devUserId') || '')
const likedPosts = ref(new Set())
const followingUsers = ref(new Set())
const followLoading = ref({})
const unreadCount = ref(0)

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="40" fill="%23e2e8f0"/%3E%3Ctext x="50" y="55" font-size="24" text-anchor="middle" fill="%2394a3b8"%3E?%3C/text%3E%3C/svg%3E'

const tabs = ref([
  { key: 'all', name: '全部', icon: '🌟', count: 0 },
  { key: 'hot', name: '热门', icon: '🔥', count: 0 },
  { key: 'follow', name: '关注', icon: '❤️', count: 0 }
])

const totalPosts = ref(0)
const todayPosts = ref(0)
const onlineUsers = ref(128)

// 页码
const page = ref(1)
const pageSize = 10

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return date.toLocaleDateString()
}

// 检查是否已点赞
const isLiked = (postId) => likedPosts.value.has(postId)

// 检查是否已关注
const isFollowing = (userId) => followingUsers.value.has(userId)

// 切换标签
const switchTab = async (tab) => {
  currentTab.value = tab
  page.value = 1
  posts.value = []
  await loadPosts()
}

// 加载帖子
const loadPosts = async () => {
  loading.value = true
  try {
    const res = await getPostList({
      page: page.value,
      limit: pageSize
    })

    if (res.code === 0) {
      const newPosts = res.data.list || []

      // 处理点赞状态
      for (const post of newPosts) {
        const likeRes = await checkLike(post.id)
        if (likeRes.code === 0 && likeRes.data.liked) {
          likedPosts.value.add(post.id)
        }
      }

      if (page.value === 1) {
        posts.value = newPosts
      } else {
        posts.value.push(...newPosts)
      }

      hasMore.value = newPosts.length === pageSize
      totalPosts.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  page.value++
  await loadPosts()
  loadingMore.value = false
}

// 点赞/取消点赞
const toggleLikePost = async (post) => {
  try {
    const res = await toggleLike(post.id)
    if (res.code === 0) {
      if (res.data.liked) {
        likedPosts.value.add(post.id)
        post.like_count = (post.like_count || 0) + 1
      } else {
        likedPosts.value.delete(post.id)
        post.like_count = Math.max(0, (post.like_count || 0) - 1)
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

// 关注/取消关注
const toggleFollowUser = async (userId) => {
  followLoading.value[userId] = true
  try {
    const res = await toggleFollow(userId)
    if (res.code === 0) {
      if (res.data.following) {
        followingUsers.value.add(userId)
        ElMessage.success('关注成功')
      } else {
        followingUsers.value.delete(userId)
        ElMessage.success('取消关注')
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    followLoading.value[userId] = false
  }
}

// 跳转详情
const goToDetail = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转用户主页
const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 预览图片
const previewImage = (images, index) => {
  // Element Plus 图片预览
}

// 分享
const sharePost = (post) => {
  const url = window.location.origin + `/post/${post.id}`
  navigator.clipboard?.writeText(url)
  ElMessage.success('链接已复制')
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
/* 基础布局 */
.community-container {
  min-height: 100vh;
  background: #f8fafc;
}

/* 导航栏 */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: #64748b;
  font-size: 12px;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: #8b5cf6;
  background: #f1f5f9;
}

.nav-icon {
  font-size: 18px;
  margin-bottom: 2px;
}

.nav-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-btn,
.msg-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #64748b;
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
}

.search-btn:hover,
.msg-btn:hover {
  background: #f1f5f9;
  color: #8b5cf6;
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
}

/* 快速统计栏 */
.quick-actions {
  max-width: 900px;
  margin: 0 auto;
  padding: 12px 16px;
}

.stats-row {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 12px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e5e7eb;
}

.stat-num {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

/* 主内容区 */
.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px 16px 100px 16px;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.filter-tab:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.filter-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border-color: transparent;
  color: white;
}

.tab-icon {
  font-size: 14px;
}

.tab-count {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.2);
}

/* 帖子列表 */
.post-list {
  min-height: 300px;
}

.posts-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 帖子卡片 */
.post-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
  cursor: pointer;
}

.post-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border-color: #dcdfe6;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f1f5f9;
}

.user-info {
  flex: 1;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.user-level {
  font-size: 11px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.post-time {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.post-content {
  font-size: 15px;
  line-height: 1.7;
  color: #334155;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.post-image-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.more-count {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
}

.post-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag {
  font-size: 13px;
  color: #8b5cf6;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 12px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  padding: 4px 8px;
  border-radius: 6px;
}

.action-item:hover,
.action-item.active {
  color: #ec4899;
  background: #fef2f2;
}

.action-icon {
  font-size: 16px;
}

.action-text {
  font-size: 14px;
}

/* 发帖按钮 */
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  border: none;
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
  font-size: 24px;
  z-index: 100;
  transition: all 0.3s;
}

.fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 30px rgba(139, 92, 246, 0.5);
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 16px;
  color: #8b5cf6;
  font-size: 14px;
  cursor: pointer;
}

.load-more:hover {
  color: #7c3aed;
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #94a3b8;
  font-size: 14px;
}

/* 骨架屏 */
.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.skeleton-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f1f5f9 25%, #e5e7eb 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-info {
  flex: 1;
}

.skeleton-line {
  height: 14px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e5e7eb 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: shimmer 1.5s infinite;
}

.skeleton-line.short {
  width: 80px;
  margin-bottom: 8px;
}

.skeleton-line.medium {
  width: 70%;
}

.skeleton-line.tiny {
  width: 60px;
  height: 12px;
}

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 18px;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 20px;
}

.empty-btn {
  font-size: 15px;
}

/* 底部导航（移动端） */
.bottom-nav {
  display: none;
}

/* 响应式 */
@media (max-width: 768px) {
  .nav-links {
    gap: 4px;
  }

  .nav-link {
    padding: 6px 8px;
    font-size: 11px;
  }

  .nav-icon {
    font-size: 16px;
  }

  .nav-actions {
    display: none;
  }

  .quick-actions {
    padding: 8px 12px;
  }

  .stat-num {
    font-size: 16px;
  }

  .main-content {
    padding: 12px 12px 80px 12px;
  }

  .fab-button {
    display: none;
  }

  .bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid #e5e7eb;
    padding: 8px 0;
    padding-bottom: max(8px, env(safe-area-inset-bottom));
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0;
    color: #64748b;
    text-decoration: none;
    font-size: 20px;
  }

  .nav-item.active {
    color: #8b5cf6;
  }

  .fab-item {
    background: linear-gradient(135deg, #8b5cf6, #ec4899);
    color: white;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    margin: -8px auto 8px;
  }

  .main-content {
    padding-bottom: 70px;
  }
}
</style>
