<template>
  <div class="my-posts-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link">社群</router-link>
          <router-link to="/course" class="nav-link">课程</router-link>
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

      <h2 class="page-title">我的帖子</h2>

      <!-- 排序选项 -->
      <div class="sort-options">
        <el-radio-group v-model="sortBy" @change="loadPosts">
          <el-radio-button label="time">按时间</el-radio-button>
          <el-radio-button label="likes">按点赞数</el-radio-button>
          <el-radio-button label="comments">按评论数</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 帖子列表 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="posts.length === 0" class="empty">
        <p>还没有发布过帖子</p>
        <el-button type="primary" @click="goToCreate">
          发布第一条帖子
        </el-button>
      </div>

      <div v-else class="post-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <div class="post-header">
            <div class="post-type-tag" :class="getTypeClass(post.type)">
              {{ post.type || '交流' }}
            </div>
            <span class="post-time">{{ formatTime(post.created_at) }}</span>
          </div>

          <div class="post-content" @click="goToDetail(post.id)">
            {{ post.content }}
          </div>

          <div v-if="post.images && post.images.length" class="post-images">
            <img
              v-for="(img, index) in post.images.slice(0, 3)"
              :key="index"
              :src="img"
              class="post-image"
            />
            <span v-if="post.images.length > 3" class="more-images">
              +{{ post.images.length - 3 }}
            </span>
          </div>

          <div class="post-stats">
            <span>❤️ {{ post.like_count || 0 }}</span>
            <span>💬 {{ post.comment_count || 0 }}</span>
          </div>

          <div class="post-actions">
            <el-button size="small" @click="editPost(post.id)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="deletePost(post.id)">
              删除
            </el-button>
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
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'
import { getPostList, deletePost as deletePostApi } from '../api/cloud'

const router = useRouter()
const posts = ref([])
const loading = ref(false)
const sortBy = ref('time')

// 获取当前用户ID
const getCurrentUserId = () => {
  const devUserId = localStorage.getItem('devUserId')
  if (devUserId) return devUserId

  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo)._id : null
}

// 获取帖子类型样式
const getTypeClass = (type) => {
  if (type === '提问') return 'type-question'
  if (type === '分享') return 'type-share'
  return 'type-discuss'
}

// 加载帖子列表
const loadPosts = async () => {
  loading.value = true

  try {
    const userId = getCurrentUserId()
    if (!userId) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }

    // 从 Supabase 获取当前用户的帖子
    const res = await getPostList({ userId })

    if (res.code === 0) {
      let myPosts = res.data.list || []

      // 排序
      if (sortBy.value === 'likes') {
        myPosts.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      } else if (sortBy.value === 'comments') {
        myPosts.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0))
      }
      // Supabase 默认按 created_at 降序查询，所以不需要额外排序

      posts.value = myPosts
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 查看详情
const goToDetail = (postId) => {
  router.push(`/post/${postId}`)
}

// 创建帖子
const goToCreate = () => {
  router.push('/post/create')
}

// 编辑帖子
const editPost = (postId) => {
  router.push(`/post/edit/${postId}`)
}

// 删除帖子
const deletePost = async (postId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条帖子吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 使用 Supabase API 删除帖子
    await deletePostApi(postId)

    // 从列表中移除
    posts.value = posts.value.filter(p => p.id !== postId)

    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadPosts()
})
</script>

<style scoped>
.my-posts-container {
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

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.sort-options {
  margin-bottom: 20px;
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

.post-item {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.post-type-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.type-discuss {
  background: #dbeafe;
  color: #1e40af;
}

.type-question {
  background: #fef3c7;
  color: #92400e;
}

.type-share {
  background: #d1fae5;
  color: #065f46;
}

.post-time {
  font-size: 13px;
  color: #999;
}

.post-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
  cursor: pointer;
}

.post-content:hover {
  color: #0ea5e9;
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

.more-images {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
