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
      <div class="search-box-card">
        <el-input
          v-model="keyword"
          placeholder="搜索帖子、用户、话题标签..."
          size="large"
          clearable
          @input="handleInput"
          @clear="clearSearch"
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="doSearch" type="primary">搜索</el-button>
          </template>
        </el-input>

        <!-- 快捷标签 -->
        <div class="quick-tags">
          <span
            v-for="tag in quickTags"
            :key="tag"
            class="quick-tag"
            @click="searchTag(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-if="!hasSearched && searchHistory.length > 0" class="history-card">
        <div class="card-header">
          <h3>搜索历史</h3>
          <el-button link type="danger" @click="clearHistory">
            <el-icon><Delete /></el-icon> 清空
          </el-button>
        </div>
        <div class="history-list">
          <span
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-item"
            @click="searchHistoryItem(item)"
          >
            <el-icon><Clock /></el-icon>
            {{ item }}
          </span>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div v-if="!hasSearched" class="hot-card">
        <h3 class="card-title">🔥 热门搜索</h3>
        <div class="hot-list">
          <div
            v-for="(item, index) in hotSearches"
            :key="index"
            class="hot-item"
            @click="searchHistoryItem(item.keyword)"
          >
            <span class="hot-rank" :class="{ 'top-three': index < 3 }">
              {{ index + 1 }}
            </span>
            <span class="hot-keyword">{{ item.keyword }}</span>
            <span class="hot-count">{{ item.count }} 次搜索</span>
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="hasSearched" class="results-section">
        <!-- 结果数量 -->
        <div class="result-summary">
          找到 <span class="count">{{ totalResults }}</span> 个结果
        </div>

        <!-- 结果标签 -->
        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="帖子" name="posts">
            <div v-if="loading" class="loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="posts.length === 0" class="empty-results">
              <p>没有找到相关帖子</p>
            </div>
            <div v-else class="result-list">
              <div
                v-for="post in posts"
                :key="post._id"
                class="result-card"
                @click="goToPost(post._id)"
              >
                <div class="result-header">
                  <img :src="post.userAvatar || '/default-avatar.png'" class="result-avatar" />
                  <div class="result-user">
                    <span class="result-username">{{ getDisplayName(post, getCurrentUser()) }}</span>
                    <span class="result-time">{{ formatTime(post.createdAt) }}</span>
                  </div>
                </div>
                <div class="result-content">{{ post.content }}</div>
                <div class="result-stats">
                  <span>👁 {{ post.viewCount || 0 }}</span>
                  <span>❤️ {{ post.likeCount || 0 }}</span>
                  <span>💬 {{ post.commentCount || 0 }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="用户" name="users">
            <div v-if="loading" class="loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="users.length === 0" class="empty-results">
              <p>没有找到相关用户</p>
            </div>
            <div v-else class="user-list">
              <div
                v-for="user in users"
                :key="user._id"
                class="user-card"
              >
                <img :src="user.avatar || '/default-avatar.png'" class="user-card-avatar" />
                <div class="user-card-info">
                  <div class="user-card-name">{{ user.nickname }}</div>
                  <div class="user-card-stats">
                    {{ user.postsCount || 0 }} 帖子 · {{ user.followersCount || 0 }} 粉丝
                  </div>
                </div>
                <el-button size="small" @click="followUser(user)">
                  {{ user.isFollowing ? '已关注' : '关注' }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="话题" name="tags">
            <div v-if="loading" class="loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="tags.length === 0" class="empty-results">
              <p>没有找到相关话题</p>
            </div>
            <div v-else class="tag-list">
              <el-tag
                v-for="tag in tags"
                :key="tag"
                class="tag-item"
                @click="goToTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Clock, Delete } from '@element-plus/icons-vue'
import { getDisplayName } from '../utils/userName'
import { formatTime } from '../utils/formatTime'

const router = useRouter()

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 数据
const keyword = ref('')
const hasSearched = ref(false)
const loading = ref(false)
const activeTab = ref('posts')
const totalResults = ref(0)

const quickTags = ref([])

const searchHistory = ref([])
const hotSearches = ref([])

const posts = ref([])
const users = ref([])
const tags = ref([])

// 防抖定时器
let debounceTimer = null

// 输入防抖处理
const handleInput = () => {
  // 清除之前的定时器
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // 如果输入为空，重置搜索状态
  if (!keyword.value.trim()) {
    hasSearched.value = false
    posts.value = []
    users.value = []
    tags.value = []
    return
  }

  // 设置新的定时器，500ms后执行搜索
  debounceTimer = setTimeout(() => {
    doSearch()
  }, 500)
}

// 搜索
const doSearch = async () => {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  loading.value = true
  hasSearched.value = true

  try {
    // 保存搜索历史
    saveHistory(keyword.value)

    // TODO: 调用云函数搜索
    // const res = await searchApi({
    //   keyword: keyword.value,
    //   type: activeTab.value
    // })

    // 模拟搜索结果
    await new Promise(resolve => setTimeout(resolve, 500))

    // 从 localStorage 搜索帖子
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    posts.value = allPosts.filter(post =>
      post.content?.toLowerCase().includes(keyword.value.toLowerCase()) ||
      post.userName?.toLowerCase().includes(keyword.value.toLowerCase())
    )

    // 从 localStorage 搜索用户
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    users.value = allUsers.filter(user =>
      user.nickname?.toLowerCase().includes(keyword.value.toLowerCase())
    )

    // 从帖子中提取标签
    tags.value = []
    allPosts.forEach(post => {
      const tagMatches = post.content?.match(/#[^\s#]+/g) || []
      tagMatches.forEach(tag => {
        if (tag.toLowerCase().includes(keyword.value.toLowerCase()) && !tags.value.includes(tag)) {
          tags.value.push(tag)
        }
      })
    })

    totalResults.value = posts.value.length + users.value.length + tags.value.length
  } catch (error) {
    console.error('搜索失败:', error)
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

// 搜索标签
const searchTag = (tag) => {
  keyword.value = tag
  doSearch()
}

// 清除搜索
const clearSearch = () => {
  hasSearched.value = false
  posts.value = []
  users.value = []
  tags.value = []
}

// 保存搜索历史
const saveHistory = (keyword) => {
  const history = searchHistory.value.filter(item => item !== keyword)
  history.unshift(keyword)
  searchHistory.value = history.slice(0, 10) // 最多保存10条
  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
}

// 搜索历史项
const searchHistoryItem = (keyword) => {
  keyword.value = keyword
  doSearch()
}

// 清空历史
const clearHistory = () => {
  searchHistory.value = []
  localStorage.removeItem('searchHistory')
}

// 跳转到帖子
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转到标签
const goToTag = (tag) => {
  router.push({ path: '/community', query: { tag } })
}

// 关注用户
const followUser = (user) => {
  user.isFollowing = !user.isFollowing
  ElMessage.success(user.isFollowing ? '关注成功' : '取消关注')
}

// 加载搜索历史
const loadHistory = () => {
  const history = localStorage.getItem('searchHistory')
  if (history) {
    searchHistory.value = JSON.parse(history)
  }
}

onMounted(() => {
  loadHistory()
})
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

.search-box-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input {
  margin-bottom: 16px;
}

.quick-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-tag {
  padding: 6px 12px;
  background: #f0f9ff;
  color: #0ea5e9;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.quick-tag:hover {
  background: #e0f2fe;
  transform: translateY(-2px);
}

.history-card,
.hot-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.history-item:hover {
  background: #e9ecef;
  color: #0ea5e9;
}

.hot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.hot-item:hover {
  background: #f8f9fa;
}

.hot-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #666;
  font-size: 13px;
  font-weight: 600;
  border-radius: 4px;
}

.hot-rank.top-three {
  background: #fef3c7;
  color: #d97706;
}

.hot-keyword {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.hot-count {
  font-size: 12px;
  color: #999;
}

.results-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.result-summary {
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
}

.result-summary .count {
  color: #0ea5e9;
  font-weight: 600;
}

.result-tabs {
  margin-top: 16px;
}

.loading,
.empty-results {
  padding: 40px;
  text-align: center;
  color: #999;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.result-card:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
}

.result-user {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.result-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.result-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 12px;
}

.result-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  gap: 12px;
}

.user-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
}

.user-card-info {
  flex: 1;
}

.user-card-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.user-card-stats {
  font-size: 13px;
  color: #999;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s;
}

.tag-item:hover {
  transform: scale(1.1);
}
</style>
