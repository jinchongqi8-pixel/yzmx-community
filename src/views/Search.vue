<template>
  <div class="search-container">
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
      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="keyword"
          placeholder="搜索帖子、用户、话题标签..."
          size="large"
          clearable
          @input="handleSearch"
          @clear="clearSearch"
        />
        <el-button type="primary" @click="doSearch">搜索</el-button>
      </div>

      <!-- 搜索结果 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="hasSearched && results.length === 0" class="empty">
        <p>没有找到相关内容</p>
      </div>

      <div v-else-if="hasSearched" class="results-section">
        <!-- 帖子结果 -->
        <div v-if="results.posts.length > 0" class="result-group">
          <h3 class="group-title">帖子 ({{ results.posts.length }})</h3>
          <div class="post-list">
            <div
              v-for="post in results.posts"
              :key="post.id"
              class="post-item"
              @click="goToPost(post.id)"
            >
              <div class="post-content">{{ post.content?.substring(0, 80) }}...</div>
              <small>{{ formatTime(post.created_at) }}</small>
            </div>
          </div>
        </div>

        <!-- 用户结果 -->
        <div v-if="results.users.length > 0" class="result-group">
          <h3 class="group-title">用户 ({{ results.users.length }})</h3>
          <div class="user-list">
            <div
              v-for="user in results.users"
              :key="user.id"
              class="user-item"
              @click="goToUser(user.id)"
            >
              <img :src="user.avatar || '/default-avatar.png'" class="user-avatar" />
              <span>{{ user.nickname || '用户' }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { supabase, TABLES } from '../supabase/client'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const keyword = ref('')
const loading = ref(false)
const hasSearched = ref(false)

const results = ref({
  posts: [],
  users: []
})

// 搜索
const doSearch = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索内容')
    return
  }

  loading.value = true
  hasSearched.value = true
  results.value = { posts: [], users: [] }

  try {
    // 搜索帖子
    const { data: posts } = await supabase
      .from(TABLES.POSTS)
      .select('*')
      .or(`content.ilike.%${keyword.value}%`)
      .limit(20)

    // 搜索用户
    const { data: users } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .or(`nickname.ilike.%${keyword.value}%`)
      .or(`phone.ilike.%${keyword.value}%`)
      .limit(20)

    if (posts) {
      results.value.posts = posts
    }

    if (users) {
      results.value.users = users
    }

    if (results.value.posts.length === 0 && results.value.users.length === 0) {
      ElMessage.info('没有找到相关内容')
    }
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

// 清空搜索
const clearSearch = () => {
  keyword.value = ''
  hasSearched.value = false
  results.value = { posts: [], users: [] }
}

// 回车搜索
const handleSearch = (value) => {
  if (value.event.key === 'Enter') {
    doSearch()
  }
}

// 跳转到帖子
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转到用户
const goToUser = (userId) => {
  router.push(`/user/${userId}`)
}
</script>

<style scoped>
.search-container {
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

.search-box {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-box .el-input {
  flex: 1;
}

.loading {
  padding: 40px 20px;
  text-align: center;
}

.empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.results-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.group-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.post-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.post-item {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.post-item:hover {
  background: #f3f4f6;
}

.post-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
}

.user-item:hover {
  background: #f3f4f6;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
