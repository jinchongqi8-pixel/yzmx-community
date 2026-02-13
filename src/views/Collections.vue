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
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">⭐ 我的收藏</h2>
        <p class="page-desc">收藏的精彩内容</p>
      </div>

      <!-- 收藏列表 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="collections.length === 0" class="empty">
        <p>还没有收藏任何内容</p>
        <el-button type="primary" @click="$router.push('/community')">
          去逛逛
        </el-button>
      </div>

      <div v-else class="collections-list">
        <div
          v-for="item in collections"
          :key="item.id"
          class="collection-item"
          @click="goToPost(item.post_id)"
        >
          <div class="collection-post">
            <div class="post-header">
              <img
                :src="item.post_author_avatar || '/default-avatar.png'"
                class="post-avatar"
              />
              <div class="post-info">
                <span class="post-author">{{ item.post_author_name || '用户' }}</span>
                <span class="post-time">{{ formatTime(item.created_at) }}</span>
              </div>
              <button
                class="remove-btn"
                @click.stop="removeCollection(item.id)"
              >
                取消收藏
              </button>
            </div>
            <div class="post-content">{{ item.post_content?.substring(0, 100) }}...</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const loading = ref(false)
const collections = ref([])

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 加载收藏列表
const loadCollections = async () => {
  const userId = getCurrentUserId()
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }

  loading.value = true

  try {
    // 从 localStorage 读取收藏的帖子ID
    const collectionIds = JSON.parse(localStorage.getItem('collections') || '[]')

    if (collectionIds.length === 0) {
      collections.value = []
      return
    }

    // 从 Supabase 获取帖子详情
    const { data: posts } = await Promise.all(
      collectionIds.map(id =>
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/posts?id=eq.${id}`).then(res => res.json())
      )
    )

    // 合并数据
    collections.value = collectionIds
      .map((id, index) => {
        const post = posts.find(p => p && p.id === id)
        return post || {
          id: id,
          post_id: id,
          post_content: post?.content || '',
          post_author_name: post?.author_name || '用户',
          post_author_avatar: post?.author_avatar || '',
          created_at: post?.created_at || new Date().toISOString()
        }
      })
      .filter(item => item.post_content)
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 取消收藏
const removeCollection = async (collectionId) => {
  try {
    const collections = JSON.parse(localStorage.getItem('collections') || '[]')
    const index = collections.indexOf(collectionId)
    if (index !== -1) {
      collections.splice(index, 1)
      localStorage.setItem('collections', JSON.stringify(collections))

      // 从列表中移除
      collections.value = collections.value.filter(c => c.id !== collectionId)

      ElMessage.success('已取消收藏')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 跳转到帖子
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collections-container {
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

.page-header {
  text-align: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.page-desc {
  color: #999;
  margin: 0;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 16px;
}

.collection-post {
  flex: 1;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.post-info {
  flex: 1;
}

.post-author {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  padding: 4px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.post-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}
</style>
