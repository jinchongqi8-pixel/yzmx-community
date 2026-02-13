<template>
  <div class="topic-square-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link">社群</router-link>
          <router-link to="/course" class="nav-link">课程</router-link>
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

      <div class="topic-square-header">
        <h1 class="title"># 话题广场</h1>
        <p class="subtitle">发现感兴趣的话题，参与讨论</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else>
        <!-- 热门话题 -->
        <div v-if="trendingTopics.length > 0" class="section">
          <h2 class="section-title">🔥 热门话题</h2>
          <div class="trending-list">
            <div
              v-for="topic in trendingTopics"
              :key="topic.name"
              class="trending-item"
              @click="goToTopic(topic.name)"
            >
              <div class="trending-rank" :class="`rank-${topic.rank}`">
                {{ topic.rank }}
              </div>
              <div class="trending-info">
                <div class="trending-name">{{ topic.name }}</div>
                <div class="trending-stats">
                  <span>{{ topic.postCount }} 条帖子</span>
                  <span>{{ topic.totalLikes }} 个点赞</span>
                </div>
              </div>
              <div class="trending-arrow">
                <el-icon><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 全部话题 -->
        <div class="section">
          <h2 class="section-title">📋 全部话题 ({{ allTopics.length }})</h2>
          <div v-if="allTopics.length === 0" class="empty">
            <p>暂无话题标签</p>
            <p class="empty-hint">发帖时使用 #话题名 即可创建话题</p>
          </div>
          <div v-else class="topic-grid">
            <div
              v-for="topic in allTopics"
              :key="topic.name"
              class="topic-card"
              @click="goToTopic(topic.name)"
            >
              <div class="topic-name">{{ topic.name }}</div>
              <div class="topic-stats">
                <span class="stat">
                  <el-icon><Document /></el-icon>
                  {{ topic.postCount }}
                </span>
                <span class="stat">
                  <el-icon><Star /></el-icon>
                  {{ topic.totalLikes }}
                </span>
              </div>
              <div class="topic-preview">{{ topic.latestPost }}</div>
            </div>
          </div>
        </div>

        <!-- 我的关注 -->
        <div v-if="myFollowedTopics.length > 0" class="section">
          <h2 class="section-title">⭐ 我关注的话题</h2>
          <div class="followed-list">
            <el-tag
              v-for="topic in myFollowedTopics"
              :key="topic"
              size="large"
              class="followed-tag"
              @click="goToTopic(topic)"
            >
              {{ topic }}
            </el-tag>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Document, Star } from '@element-plus/icons-vue'
import { getPostList } from '../api/cloud'

const router = useRouter()
const loading = ref(true)
const topics = ref([])
const followedTopics = ref([])

// 从帖子内容中提取话题标签
const extractTopics = (posts) => {
  const topicMap = new Map()

  posts.forEach(post => {
    if (!post.content) return

    // 匹配 #话题名 格式的标签
    const topicRegex = /#([^\s#]+)/g
    let match

    while ((match = topicRegex.exec(post.content)) !== null) {
      const topicName = '#' + match[1]

      if (!topicMap.has(topicName)) {
        topicMap.set(topicName, {
          name: topicName,
          postCount: 0,
          totalLikes: 0,
          posts: [],
          latestPost: ''
        })
      }

      const topic = topicMap.get(topicName)
      topic.postCount++
      topic.totalLikes += post.like_count || 0
      topic.posts.push(post)

      // 保存最新帖子预览
      if (!topic.latestPost || post.created_at > topic.latestCreatedAt) {
        topic.latestPost = post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
        topic.latestCreatedAt = post.created_at
      }
    }
  })

  return Array.from(topicMap.values())
}

// 加载话题数据
const loadTopics = async () => {
  loading.value = true

  try {
    // 从 Supabase 获取所有帖子
    const res = await getPostList({ limit: 100 })
    if (res.code === 0) {
      const posts = res.data.list || []
      topics.value = extractTopics(posts)
    }

    // 读取用户关注的话题（从本地存储）
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      if (user.followedTopics) {
        followedTopics.value = user.followedTopics
      }
    }
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 热门话题（按帖子数和点赞数综合排序）
const trendingTopics = computed(() => {
  const sorted = [...topics.value].sort((a, b) => {
    // 综合评分：帖子数 * 10 + 点赞数
    const scoreA = a.postCount * 10 + a.totalLikes
    const scoreB = b.postCount * 10 + b.totalLikes
    return scoreB - scoreA
  })

  // 只取前10个，并添加排名
  return sorted.slice(0, 10).map((topic, index) => ({
    ...topic,
    rank: index + 1
  }))
})

// 全部话题（按字母排序）
const allTopics = computed(() => {
  return [...topics.value].sort((a, b) => a.name.localeCompare(b.name))
})

// 我关注的话题
const myFollowedTopics = computed(() => {
  return followedTopics.value.filter(topicName => {
    return topics.value.some(t => t.name === topicName)
  })
})

// 跳转到话题详情
const goToTopic = (topicName) => {
  router.push({
    path: '/topic',
    query: { tag: topicName }
  })
}

onMounted(() => {
  loadTopics()
})
</script>

<style scoped>
.topic-square-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
}

.navbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
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
  justify-content: space-between;
}

.logo {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f43f5e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-size: 16px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.back-btn {
  margin-bottom: 20px;
}

.topic-square-header {
  text-align: center;
  margin-bottom: 32px;
  color: white;
}

.title {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.loading {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.section {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

/* 热门话题列表 */
.trending-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.trending-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.trending-rank {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  background: #e9ecef;
  color: #666;
}

.trending-rank.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #b45309;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.trending-rank.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #4a5568;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.trending-rank.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #e8a317);
  color: white;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.trending-info {
  flex: 1;
}

.trending-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.trending-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
}

.trending-arrow {
  color: #667eea;
  font-size: 20px;
}

/* 话题网格 */
.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.topic-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 1px solid rgba(241, 245, 249, 0.8);
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.topic-name {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 12px;
}

.topic-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.topic-stats .stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.topic-preview {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 关注的话题 */
.followed-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.followed-tag {
  cursor: pointer;
  font-size: 15px;
  padding: 8px 16px;
  height: auto;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border: none;
  color: white;
  transition: all 0.3s ease;
}

.followed-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.empty {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-hint {
  font-size: 13px;
  color: #bbb;
  margin-top: 8px;
}

.empty-icon {
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

/* 背景装饰 */
.topic-square-container::before {
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

.topic-square-container::after {
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

/* 移动端适配 */
@media (max-width: 768px) {
  .topic-square-header .title {
    font-size: 28px;
  }

  .section {
    padding: 16px;
  }

  .topic-grid {
    grid-template-columns: 1fr;
  }

  .trending-item {
    padding: 12px;
  }

  .trending-rank {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .trending-name {
    font-size: 16px;
  }

  .trending-stats {
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }
}
</style>
