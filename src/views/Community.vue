<template>
  <div class="community-container">
    <!-- 欢迎横幅 -->
    <WelcomeBanner />

    <!-- 公告横幅 -->
    <AnnouncementBanner />

    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link">社群</router-link>
          <router-link to="/course" class="nav-link">课程</router-link>
          <router-link to="/topic-square" class="nav-link">话题</router-link>
          <router-link to="/profile" class="nav-link">我的</router-link>
          <router-link to="/messages" class="nav-link">私信</router-link>
          <router-link to="/search" class="nav-link search-link">
            <el-icon><Search /></el-icon>
          </router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 帖子列表 -->
      <div class="post-list">
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="posts.length === 0" class="empty">
          <p>还没有帖子，快来发布第一条吧~</p>
        </div>

        <div v-else>
          <TransitionGroup name="post-list">
            <div
              v-for="(post, index) in posts"
              :key="post._id"
              class="post-card"
              :style="{ animationDelay: `${index * 0.05}s` }"
            >
            <div class="post-header">
              <img
                :src="post.userAvatar || '/default-avatar.png'"
                class="avatar"
                @click="goToUserProfile(post)"
              />
              <div class="user-info">
                <div class="user-name" @click="goToUserProfile(post)">{{ getDisplayName(post, getCurrentUser()) }}</div>
                <div class="post-time">{{ formatTime(post.createdAt) }}</div>
              </div>
              <el-button
                v-if="post.userId && post.userId !== getCurrentUser()?._id"
                @click.stop="toggleFollowUser(post)"
                :type="isUserFollowing(post) ? 'default' : 'primary'"
                size="small"
                plain
              >
                {{ isUserFollowing(post) ? '已关注' : '+ 关注' }}
              </el-button>
            </div>

            <!-- 帖子类型标签 -->
            <el-tag
              v-if="post.type === 1"
              type="info"
              effect="plain"
              size="small"
              class="post-type-tag"
            >
              交流
            </el-tag>
            <el-tag
              v-if="post.type === 2"
              type="warning"
              effect="plain"
              size="small"
              class="post-type-tag"
            >
              提问
            </el-tag>
            <el-tag
              v-if="post.type === 3"
              type="success"
              effect="plain"
              size="small"
              class="post-type-tag"
            >
              分享
            </el-tag>

            <!-- 置顶/精华标签 -->
            <el-tag v-if="post.isPinned" type="danger" effect="plain" size="small" class="post-type-tag">
              📌 置顶
            </el-tag>
            <el-tag v-if="post.isFeatured" type="warning" effect="plain" size="small" class="post-type-tag">
              ⭐ 精华
            </el-tag>

            <div class="post-content" @click="goToDetail(post._id)" v-html="parseContent(post.content)"></div>

            <!-- 帖子图片 -->
            <div v-if="post.images && post.images.length" class="post-images">
              <el-image
                v-for="(img, index) in post.images.slice(0, 3)"
                :key="index"
                :src="img"
                :preview-src-list="post.images"
                :initial-index="index"
                fit="cover"
                class="post-image"
                :lazy="true"
              />
            </div>

            <div class="post-stats">
              <span class="stat-item">
                <el-icon><View /></el-icon>
                {{ post.viewCount || 0 }}
              </span>
              <span
                class="stat-item like-btn"
                :class="{ active: isPostLiked(post) }"
                @click.stop="handleLike(post)"
              >
                <span class="heart-icon">{{ isPostLiked(post) ? '❤️' : '🤍' }}</span>
                {{ post.likeCount || 0 }}
              </span>
              <span class="stat-item" @click="goToDetail(post._id)">
                <el-icon><ChatDotRound /></el-icon>
                {{ post.commentCount || 0 }}
              </span>
            </div>
          </div>
          </TransitionGroup>
        </div>
      </div>

      <!-- 浮动发帖按钮 -->
      <el-button
        type="primary"
        class="fab-button"
        @click="router.push('/post/create')"
        size="large"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
    </main>

    <!-- 固定在底部的发布区域 -->
    <div class="fixed-post-bar">
      <div class="post-bar-content">
        <el-input
          v-model="postContent"
          type="textarea"
          :rows="2"
          placeholder="分享你的想法..."
          maxlength="500"
          show-word-limit
          class="post-input"
        />
        <el-button type="primary" @click="createPost" class="post-btn">发布</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search, View, ChatDotRound, CirclePlus } from '@element-plus/icons-vue'
import { createLikeNotification } from '../utils/notification'
import { formatTime } from '../utils/formatTime'
import { getDisplayName } from '../utils/userName'
import WelcomeBanner from '../components/WelcomeBanner.vue'
import AnnouncementBanner from '../components/AnnouncementBanner.vue'

const router = useRouter()
const postContent = ref('')
const posts = ref([])
const loading = ref(true)

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 检查帖子是否已点赞
const isPostLiked = (post) => {
  const user = getCurrentUser()
  if (!user || !post.likedBy) return false
  return post.likedBy.includes(user._id)
}

// 加载帖子列表
const loadPosts = async () => {
  loading.value = true
  try {
    const savedPosts = localStorage.getItem('posts')
    if (savedPosts) {
      const allPosts = JSON.parse(savedPosts)

      // 排序：置顶的帖子在最前面
      allPosts.sort((a, b) => {
        // 如果a是置顶，b不是，a排在前面
        if (a.isPinned && !b.isPinned) return -1
        // 如果b是置顶，a不是，b排在前面
        if (!a.isPinned && b.isPinned) return 1
        // 都是置顶或都不是置顶，按时间倒序
        return new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0)
      })

      posts.value = allPosts
    } else {
      // 没有数据时显示空列表，不创建测试数据
      posts.value = []
    }
  } catch (error) {
    console.error('加载失败:', error)
    posts.value = []
  } finally {
    loading.value = false
  }
}

// 发布帖子
const createPost = async () => {
  if (!postContent.value.trim()) {
    ElMessage.warning('请输入内容')
    return
  }

  const user = getCurrentUser()
  if (!user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    // ✅ 先从 localStorage 读取最新数据（防止多标签页冲突）
    const latestPosts = JSON.parse(localStorage.getItem('posts') || '[]')

    const newPost = {
      _id: Date.now().toString(),
      userId: user._id,
      timestamp: Date.now(),
      userName: user.nickname || '我',
      userAvatar: user.avatar || '',
      content: postContent.value,
      type: 1, // 默认为交流类型
      createdAt: Date.now(),
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      likedBy: [],
      viewedBy: [], // 记录浏览过的用户ID
      comments: []
    }

    // 添加到最新数据
    latestPosts.unshift(newPost)

    // 检查localStorage是否已满
    try {
      localStorage.setItem('posts', JSON.stringify(latestPosts))
      // 更新页面显示
      posts.value = latestPosts
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError') {
        ElMessage.error('存储空间已满，请删除旧帖子后重试')
        return
      }
      throw storageError
    }

    // 更新用户统计数据
    user.postsCount = (user.postsCount || 0) + 1
    localStorage.setItem('userInfo', JSON.stringify(user))

    ElMessage.success('发布成功')
    postContent.value = ''
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败：' + (error.message || '未知错误'))
  }
}

// 点赞/取消点赞
const handleLike = (post) => {
  const user = getCurrentUser()
  if (!user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 初始化 likedBy 数组
  if (!post.likedBy) {
    post.likedBy = []
  }

  const userId = user._id
  const likedIndex = post.likedBy.indexOf(userId)

  // 找到帖子在数组中的索引
  const postIndex = posts.value.findIndex(p => p._id === post._id)

  if (likedIndex === -1) {
    // 未点赞，添加点赞
    post.likedBy.push(userId)
    post.likeCount = (post.likeCount || 0) + 1
    ElMessage.success('已点赞')

    // 直接更新数组中的帖子
    if (postIndex !== -1) {
      posts.value[postIndex] = { ...post }
    }

    // 创建点赞通知（如果点赞的不是作者自己）
    if (post.userId && post.userId !== userId) {
      createLikeNotification(user, post, post.userId)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  } else {
    // 已点赞，取消点赞
    post.likedBy.splice(likedIndex, 1)
    post.likeCount = Math.max(0, (post.likeCount || 0) - 1)
    ElMessage.success('已取消点赞')

    // 直接更新数组中的帖子
    if (postIndex !== -1) {
      posts.value[postIndex] = { ...post }
    }
  }

  // 强制触发响应式更新
  posts.value = [...posts.value]

  // 保存到localStorage
  localStorage.setItem('posts', JSON.stringify(posts.value))
}

// 查看详情
const goToDetail = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转到用户主页
const goToUserProfile = (post) => {
  if (post.userId) {
    router.push(`/user/${post.userId}`)
  }
}

// 检查是否关注了该用户
const isUserFollowing = (post) => {
  const user = getCurrentUser()
  if (!user || !post.userId) return false

  const follows = JSON.parse(localStorage.getItem('follows') || '[]')
  return follows.some(f =>
    f.userId === user._id && f.followingId === post.userId
  )
}

// 关注/取消关注用户
const toggleFollowUser = (post) => {
  const user = getCurrentUser()
  if (!user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!post.userId) return

  try {
    const follows = JSON.parse(localStorage.getItem('follows') || '[]')
    const followIndex = follows.findIndex(f =>
      f.userId === user._id && f.followingId === post.userId
    )

    if (followIndex !== -1) {
      // 取消关注
      follows.splice(followIndex, 1)
      ElMessage.success('取消关注')
    } else {
      // 添加关注
      follows.push({
        userId: user._id,
        userName: user.nickname,
        followingId: post.userId,
        followingName: post.userName,
        createdAt: new Date().toISOString()
      })
      ElMessage.success('关注成功')
    }

    localStorage.setItem('follows', JSON.stringify(follows))
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 解析帖子内容，将话题标签转换为可点击链接
const parseContent = (content) => {
  if (!content) return ''

  // 匹配 #话题名 格式，并替换为可点击的链接
  return content.replace(
    /#([^\s#]+)/g,
    '<span class="topic-tag" onclick="event.stopPropagation(); window.navigateToTopic(\'#$1\')">#$1</span>'
  )
}

// 全局函数：跳转到话题页面
window.navigateToTopic = (topicName) => {
  router.push({
    path: '/topic',
    query: { tag: topicName }
  })
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.community-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 22px;
  font-weight: 700;
  color: #0ea5e9;
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
  bottom: -20px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #0ea5e9;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #0ea5e9;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
}

.search-link {
  font-size: 20px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 100px 20px;
}

.fixed-post-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  padding: 16px 20px;
  z-index: 99;
  transition: all 0.3s ease;
}

.fixed-post-bar:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -6px 24px rgba(139, 92, 246, 0.1);
}

.post-bar-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.post-input {
  flex: 1;
}

.post-input :deep(.el-textarea__inner) {
  border-radius: 14px;
  border: 2px solid #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.post-input :deep(.el-textarea__inner):focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1), 0 4px 12px rgba(139, 92, 246, 0.1);
  background: #ffffff;
  transform: translateY(-1px);
}

.post-btn {
  height: 40px;
  padding: 0 24px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: none;
  transition: all 0.3s ease;
}

.post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.post-list {
  min-height: 400px;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
  border-color: #e2e8f0;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 2px solid #f1f5f9;
}

.avatar:hover {
  transform: scale(1.05);
  border-color: #0ea5e9;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: inline-block;
}

.user-name::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transition: width 0.3s ease;
}

.user-name:hover {
  color: #8b5cf6;
}

.user-name:hover::after {
  width: 100%;
}

.post-time {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.post-content {
  font-size: 15px;
  line-height: 1.8;
  color: #334155;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.post-content:hover {
  color: #8b5cf6;
  transform: translateX(4px);
}

.post-content :deep(.topic-tag) {
  color: #0ea5e9;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f9ff;
}

.post-content :deep(.topic-tag):hover {
  color: #0284c7;
  background: #e0f2fe;
}

/* 标签样式优化 */
.post-type-tag {
  margin-bottom: 8px;
  margin-right: 6px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.post-type-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.post-image:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
  z-index: 2;
}

.post-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #999;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px 8px;
  border-radius: 6px;
}

.stat-item:hover {
  color: #0ea5e9;
  background: #f0f9ff;
}

.stat-item.like-btn {
  transition: all 0.3s;
}

.stat-item.like-btn .heart-icon {
  font-size: 16px;
  display: inline-block;
  transition: transform 0.3s;
}

.stat-item.like-btn.active {
  color: #ef4444;
}

.stat-item.like-btn.active .heart-icon {
  transform: scale(1.2);
  animation: heartbeat 0.6s ease-in-out;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(1.5); }
  75% { transform: scale(1.3); }
  100% { transform: scale(1.2); }
}

/* 帖子列表动画 */
.post-list-enter-active {
  animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* FAB按钮脉冲动画 */
.fab-button {
  position: fixed;
  bottom: 100px;
  right: 40px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  font-size: 24px;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);
  border: none;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3), 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  50% {
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5), 0 0 0 10px rgba(139, 92, 246, 0);
  }
}

.fab-button:hover {
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 12px 32px rgba(139, 92, 246, 0.5);
  animation: none;
}

/* 点赞爆炸效果 */
.stat-item.like-btn {
  position: relative;
  overflow: visible;
}

.stat-item.like-btn::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.4s ease;
  pointer-events: none;
}

.stat-item.like-btn:active::before {
  transform: scale(2);
  opacity: 0;
}

/* 卡片3D悬停效果 */
.post-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.post-card:hover {
  box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
  transform: translateY(-8px) rotateX(2deg);
  border-color: rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%);
}

.post-card:active {
  transform: translateY(-4px) scale(0.98);
}

/* 头像光环效果 */
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  border: 3px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
  position: relative;
}

.avatar::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899, #f43f5e);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
  filter: blur(8px);
}

.avatar:hover {
  transform: scale(1.1);
  border-color: #8b5cf6;
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.avatar:hover::after {
  opacity: 0.6;
}

/* 导航链接下划线动画 */
.nav-link::after {
  content: '';
  position: absolute;
  bottom: -20px;
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

/* Logo渐变动画 */
.logo {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  transition: all 0.3s ease;
  position: relative;
}

.logo::after {
  content: '📚 颜祖美学';
  position: absolute;
  left: 0;
  top: 0;
  background: linear-gradient(135deg, #ec4899, #f43f5e, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.logo:hover::after {
  opacity: 1;
}

/* 发布按钮优化 */
.post-btn {
  height: 44px;
  padding: 0 28px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.post-btn::before {
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

.post-btn:active::before {
  width: 300px;
  height: 300px;
}

.post-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

/* 话题标签闪烁效果 */
.post-content :deep(.topic-tag) {
  color: #8b5cf6;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 3px 8px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  position: relative;
  overflow: hidden;
}

.post-content :deep(.topic-tag)::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.post-content :deep(.topic-tag):hover::before {
  transform: translateX(100%);
}

.post-content :deep(.topic-tag):hover {
  color: #7c3aed;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2));
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

/* 统计数字动画 */
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 6px 10px;
  border-radius: 8px;
  position: relative;
}

.stat-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.stat-item:hover::after {
  width: 80%;
}

.stat-item:hover {
  color: #8b5cf6;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
  transform: translateY(-2px);
}

/* 加载和空状态优化 */
.loading,
.empty {
  padding: 60px 40px;
  text-align: center;
  color: #94a3b8;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty {
  position: relative;
}

.empty::before {
  content: '✨';
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

.empty p {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* 骨架屏优化 */
.loading :deep(.el-skeleton) {
  --el-skeleton-color: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
}

.loading :deep(.el-skeleton__item) {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 背景装饰 */
.community-container::before {
  content: '';
  position: fixed;
  top: -50%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.community-container::after {
  content: '';
  position: fixed;
  bottom: -30%;
  left: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
}

.fab-button {
  position: fixed;
  bottom: 100px;
  right: 40px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
  font-size: 24px;
  z-index: 1000;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  border: none;
}

.fab-button:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.4);
}

/* 移动端响应式适配 */
@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
  }

  .logo {
    font-size: 20px;
  }

  .nav-links {
    gap: 16px;
  }

  .nav-link {
    font-size: 14px;
  }

  .main-content {
    padding: 0 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .post-card {
    padding: 16px;
  }

  .post-card:hover {
    transform: translateY(-4px);
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar {
    margin-bottom: 8px;
  }

  .post-content {
    font-size: 14px;
  }

  .post-content:hover {
    transform: translateX(2px);
  }

  .post-images {
    grid-template-columns: repeat(2, 1fr);
  }

  .post-image {
    width: 100%;
    height: 100px;
  }

  .post-stats {
    gap: 12px;
    font-size: 12px;
  }

  .fab-button {
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .user-name {
    font-size: 14px;
  }

  .post-time {
    font-size: 11px;
  }

  .post-content {
    font-size: 14px;
  }

  .post-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    font-size: 12px;
    padding: 4px 8px;
  }
}
</style>
