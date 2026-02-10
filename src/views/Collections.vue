<template>
  <div class="collections-container">
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
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <div class="collections-header">
        <h2 class="page-title">⭐ 我的收藏</h2>
        <p class="page-desc">共 {{ collections.length }} 个收藏</p>
      </div>

      <!-- 收藏列表 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="collections.length === 0" class="empty">
        <p>还没有收藏任何帖子</p>
        <el-button type="primary" @click="$router.push('/community')">
          去逛逛
        </el-button>
      </div>

      <div v-else class="collections-list">
        <div
          v-for="post in collections"
          :key="post._id"
          class="post-card"
          @click="goToDetail(post._id)"
        >
          <div class="post-header">
            <img
              :src="post.userAvatar || '/default-avatar.png'"
              class="avatar"
            />
            <div class="user-info">
              <div class="user-name">{{ post.userName || '匿名用户' }}</div>
              <div class="post-time">{{ formatTime(post.createdAt) }}</div>
            </div>
            <el-button
              @click.stop="removeCollection(post._id)"
              type="danger"
              plain
              size="small"
              class="remove-btn"
            >
              取消收藏
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

          <div class="post-content">{{ post.content }}</div>

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
            <span class="stat-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ post.commentCount || 0 }}
            </span>
            <span class="stat-item">
              <el-icon><Star /></el-icon>
              {{ post.likeCount || 0 }}
            </span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, View, ChatDotRound, Star } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const collections = ref([])
const loading = ref(true)

// 加载收藏列表
const loadCollections = () => {
  loading.value = true

  try {
    // 获取收藏的帖子ID列表
    const collectionIds = JSON.parse(localStorage.getItem('collections') || '[]')

    if (collectionIds.length === 0) {
      collections.value = []
      loading.value = false
      return
    }

    // 获取所有帖子
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')

    // 筛选出收藏的帖子
    const collectedPosts = allPosts.filter(post => collectionIds.includes(post._id))

    // 按收藏时间倒序排列（ID越大越新）
    collectedPosts.sort((a, b) => {
      const aIndex = collectionIds.indexOf(a._id)
      const bIndex = collectionIds.indexOf(b._id)
      return aIndex - bIndex
    })

    collections.value = collectedPosts
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
    collections.value = []
  } finally {
    loading.value = false
  }
}

// 取消收藏
const removeCollection = async (postId) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消收藏吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 更新收藏列表
    const collectionIds = JSON.parse(localStorage.getItem('collections') || '[]')
    const index = collectionIds.indexOf(postId)

    if (index !== -1) {
      collectionIds.splice(index, 1)
      localStorage.setItem('collections', JSON.stringify(collectionIds))
    }

    // 重新加载列表
    await loadCollections()

    ElMessage.success('已取消收藏')
  } catch (error) {
    // 用户取消
  }
}

// 查看详情
const goToDetail = (postId) => {
  router.push(`/post/${postId}`)
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collections-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e8ecef;
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

.main-content {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.collections-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.page-desc {
  font-size: 14px;
  color: #999;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty p {
  margin-bottom: 20px;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: #e2e8f0;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  flex-shrink: 0;
}

.post-type-tag {
  margin-bottom: 12px;
}

.post-content {
  font-size: 15px;
  color: #334155;
  line-height: 1.7;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.post-image {
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
}

.post-stats {
  display: flex;
  gap: 20px;
  color: #999;
  font-size: 13px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
