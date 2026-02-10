<template>
  <div class="topic-container">
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
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 话题信息 -->
      <div class="topic-header">
        <h1 class="topic-title">{{ topicName }}</h1>
        <p class="topic-desc">关于 "{{ topicName }}" 的所有讨论</p>
        <div class="topic-stats">
          <span>{{ posts.length }} 条帖子</span>
          <span>{{ totalLikes }} 个点赞</span>
        </div>
      </div>

      <!-- 帖子列表 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="posts.length === 0" class="empty">
        <p>还没有关于 "{{ topicName }}" 的帖子</p>
        <el-button type="primary" @click="goToCreate">
          发布第一条帖子
        </el-button>
      </div>

      <div v-else class="post-list">
        <div
          v-for="post in posts"
          :key="post._id"
          class="post-card"
          @click="goToPost(post._id)"
        >
          <div class="post-header">
            <img :src="post.userAvatar || '/default-avatar.png'" class="avatar" @click="goToUserProfile(post)" />
            <div class="user-info">
              <div class="user-name" @click="goToUserProfile(post)">{{ getDisplayName(post, getCurrentUser()) }}</div>
              <div class="post-time">{{ formatTime(post.createdAt) }}</div>
            </div>
          </div>

          <div class="post-content">{{ post.content }}</div>

          <div v-if="post.images && post.images.length" class="post-images">
            <img
              v-for="(img, index) in post.images.slice(0, 3)"
              :key="index"
              :src="img"
              class="post-image"
            />
          </div>

          <div class="post-stats">
            <span>👁 {{ post.viewCount || 0 }}</span>
            <span>❤️ {{ post.likeCount || 0 }}</span>
            <span>💬 {{ post.commentCount || 0 }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'
import { getDisplayName } from '../utils/userName'
import AnnouncementBanner from '../components/AnnouncementBanner.vue'

const route = useRoute()
const router = useRouter()
const posts = ref([])
const loading = ref(false)

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 话题名称
const topicName = computed(() => {
  return route.query.tag || '#前端开发'
})

// 总点赞数
const totalLikes = computed(() => {
  return posts.value.reduce((sum, post) => sum + (post.likeCount || 0), 0)
})

// 加载帖子
const loadPosts = async () => {
  loading.value = true

  try {
    // TODO: 调用云函数获取话题相关帖子
    // 从 localStorage 读取所有帖子，筛选包含话题标签的
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const tag = topicName.value

    // 筛选包含该话题标签的帖子
    const filteredPosts = allPosts.filter(post => {
      return post.content && post.content.includes(tag)
    })

    posts.value = filteredPosts
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 查看帖子详情
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 创建帖子
const goToCreate = () => {
  router.push({
    path: '/post/create',
    query: { tag: topicName.value }
  })
}

// 跳转到用户主页
const goToUserProfile = (post) => {
  if (post.userId) {
    router.push(`/user/${post.userId}`)
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.topic-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
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
  font-weight: 600;
  color: #0ea5e9;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #0ea5e9;
}

.main-content {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.topic-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.topic-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.topic-desc {
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 16px 0;
}

.topic-stats {
  display: flex;
  gap: 24px;
  font-size: 14px;
  opacity: 0.8;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.user-name:hover {
  color: #0ea5e9;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  cursor: pointer;
}

.post-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.post-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-images {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.post-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.post-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}
</style>
