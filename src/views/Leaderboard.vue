<template>
  <div class="leaderboard-container">
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

      <div class="leaderboard-header">
        <h1 class="title">🏆 排行榜</h1>
      </div>

      <!-- 排行榜类型切换 -->
      <div class="tabs">
        <button
          :class="{ active: activeTab === 'posts' }"
          @click="activeTab = 'posts'"
          class="tab-btn"
        >
          📝 帖子榜
        </button>
        <button
          :class="{ active: activeTab === 'coins' }"
          @click="activeTab = 'coins'"
          class="tab-btn"
        >
          🪙 金币榜
        </button>
        <button
          :class="{ active: activeTab === 'checkin' }"
          @click="activeTab = 'checkin'"
          class="tab-btn"
        >
          📅 签到榜
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 帖子榜 -->
      <div v-else-if="activeTab === 'posts'" class="rank-list">
        <div v-if="rankList.posts.length === 0" class="empty">
          <p>暂无数据</p>
        </div>
        <div v-else>
          <div
            v-for="(item, index) in rankList.posts"
            :key="item._id"
            class="rank-item"
          >
            <div class="rank-badge" :class="`rank-${index + 1}`">
              {{ index + 1 }}
            </div>
            <img
              :src="item.avatar || '/default-avatar.png'"
              class="user-avatar"
              @click="goToUserProfile(item)"
            />
            <div class="user-info">
              <div class="user-name" @click="goToUserProfile(item)">{{ item.nickname }}</div>
              <div class="user-stats">
                <span class="stat">📝 {{ item.postsCount || 0 }} 帖子</span>
                <span class="stat">❤️ {{ item.likesCount || 0 }} 获赞</span>
              </div>
            </div>
            <div class="score">
              <span class="score-label">积分</span>
              <span class="score-value">{{ item.score }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 金币榜 -->
      <div v-else-if="activeTab === 'coins'" class="rank-list">
        <div v-if="rankList.coins.length === 0" class="empty">
          <p>暂无数据</p>
        </div>
        <div v-else>
          <div
            v-for="(item, index) in rankList.coins"
            :key="item._id"
            class="rank-item"
          >
            <div class="rank-badge" :class="`rank-${index + 1}`">
              {{ index + 1 }}
            </div>
            <img
              :src="item.avatar || '/default-avatar.png'"
              class="user-avatar"
              @click="goToUserProfile(item)"
            />
            <div class="user-info">
              <div class="user-name" @click="goToUserProfile(item)">{{ item.nickname }}</div>
              <div class="user-stats">
                <span class="stat">📝 {{ item.postsCount || 0 }} 帖子</span>
                <span class="stat">⏱ 签到 {{ item.checkInDays || 0 }} 天</span>
              </div>
            </div>
            <div class="score">
              <span class="score-label">金币</span>
              <span class="score-value">{{ item.coins || 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 签到榜 -->
      <div v-else-if="activeTab === 'checkin'" class="rank-list">
        <div v-if="rankList.checkin.length === 0" class="empty">
          <p>暂无数据</p>
        </div>
        <div v-else>
          <div
            v-for="(item, index) in rankList.checkin"
            :key="item._id"
            class="rank-item"
          >
            <div class="rank-badge" :class="`rank-${index + 1}`">
              {{ index + 1 }}
            </div>
            <img
              :src="item.avatar || '/default-avatar.png'"
              class="user-avatar"
              @click="goToUserProfile(item)"
            />
            <div class="user-info">
              <div class="user-name" @click="goToUserProfile(item)">{{ item.nickname }}</div>
              <div class="user-stats">
                <span class="stat">📝 {{ item.postsCount || 0 }} 帖子</span>
                <span class="stat">❤️ {{ item.likesCount || 0 }} 获赞</span>
              </div>
            </div>
            <div class="score">
              <span class="score-label">签到</span>
              <span class="score-value">{{ item.checkInDays || 0 }} 天</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('posts')
const loading = ref(true)
const rankList = ref({
  posts: [],
  coins: [],
  checkin: []
})

// 加载排行榜数据
const loadLeaderboard = () => {
  loading.value = true

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const posts = JSON.parse(localStorage.getItem('posts') || '[]')

    // 计算每个用户的统计数据
    const userStats = {}

    // 初始化所有用户的统计数据
    users.forEach(user => {
      userStats[user._id] = {
        _id: user._id,
        nickname: user.nickname,
        avatar: user.avatar || '',
        coins: user.coins || 0,
        postsCount: 0,
        likesCount: 0,
        checkInDays: user.checkInDays || 0,
        score: 0
      }
    })

    // 遍历所有帖子，统计每个用户的帖子数和获赞数
    posts.forEach(post => {
      if (post.userId && userStats[post.userId]) {
        userStats[post.userId].postsCount += 1
        userStats[post.userId].likesCount += (post.likeCount || 0)
      }
    })

    // 计算帖子榜积分（帖子数*10 + 获赞数*5）
    Object.values(userStats).forEach(user => {
      user.score = user.postsCount * 10 + user.likesCount * 5
    })

    // 转换为数组并排序
    const usersArray = Object.values(userStats)

    // 帖子榜（按积分排序）
    rankList.value.posts = [...usersArray].sort((a, b) => b.score - a.score)

    // 金币榜（按金币排序）
    rankList.value.coins = [...usersArray].sort((a, b) => b.coins - a.coins)

    // 签到榜（按签到天数排序）
    rankList.value.checkin = [...usersArray].sort((a, b) => b.checkInDays - a.checkInDays)
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 跳转到用户主页
const goToUserProfile = (user) => {
  router.push(`/user/${user._id}`)
}

onMounted(() => {
  loadLeaderboard()
})
</script>

<style scoped>
.leaderboard-container {
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

.nav-link:hover,
.nav-link.router-link-active {
  color: #667eea;
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

.leaderboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.tab-btn.active {
  background: white;
  color: #667eea;
  font-weight: 600;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.loading p,
.empty p {
  font-size: 16px;
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
.leaderboard-container::before {
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

.leaderboard-container::after {
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

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  background: white;
  border-radius: 20px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.rank-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.rank-badge {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #b45309;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #4a5568;
  box-shadow: 0 4px 12px rgba(192, 192, 192, 0.4);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #e8a317);
  color: white;
  box-shadow: 0 4px 12px rgba(205, 127, 50, 0.4);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid #f0f0f0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  cursor: pointer;
}

.user-name:hover {
  color: #0ea5e9;
}

.user-stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.stat {
  margin-right: 4px;
}

.score {
  text-align: right;
  min-width: 100px;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #999;
}

.score-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #0ea5e9;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .rank-item {
    padding: 12px;
    gap: 12px;
  }

  .rank-badge {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
  }

  .user-name {
    font-size: 14px;
  }

  .user-stats {
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
  }

  .score {
    min-width: 80px;
  }

  .score-value {
    font-size: 16px;
  }
}
</style>
