<template>
  <div class="user-profile-container">
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
    <main class="main-content" v-if="user">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 用户信息卡片 -->
      <div class="user-card">
        <img :src="user.avatar || '/default-avatar.png'" class="user-avatar" />
        <div class="user-info">
          <h2 class="user-name">{{ user.nickname || '用户' }}</h2>
          <p class="user-bio">{{ user.bio || '这个人很懒，什么都没留下~' }}</p>
          <p class="user-meta">
            <span v-if="user.phone">📱 {{ user.phone }}</span>
            <span>📅 加入于 {{ formatTime(user.created_at) }}</span>
          </p>
        </div>
        <div class="header-actions">
          <el-button
            @click="toggleFollow"
            :type="user.isFollowing ? 'default' : 'primary'"
            :loading="following"
            v-if="user.id !== currentUserId"
          >
            {{ user.isFollowing ? '已关注' : '关注' }}
          </el-button>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-number">{{ user.posts_count || 0 }}</div>
          <div class="stat-label">帖子</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ user.followers_count || 0 }}</div>
          <div class="stat-label">粉丝</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ user.following_count || 0 }}</div>
          <div class="stat-label">关注</div>
        </div>
      </div>

      <!-- 标签切换 -->
      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="帖子" name="posts">
          <div v-if="loading" class="loading">
            <el-skeleton :rows="3" animated />
          </div>
          <div v-else-if="posts.length === 0" class="empty">
            <p>暂无帖子</p>
          </div>
          <div v-else class="post-list">
            <div
              v-for="post in posts"
              :key="post.id"
              class="post-item"
              @click="goToPost(post.id)"
            >
              <div class="post-content">{{ post.content }}</div>
              <div class="post-meta">
                <span>👁 {{ post.view_count || 0 }}</span>
                <span>❤️ {{ post.like_count || 0 }}</span>
                <span>💬 {{ post.comment_count || 0 }}</span>
                <span>{{ formatTime(post.created_at) }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getUserProfile, getPostList, toggleFollow, getFollowingList } from '../api/cloud'
import { formatTime } from '../utils/formatTime'

const route = useRoute()
const router = useRouter()

// 当前用户ID
const currentUserId = computed(() => localStorage.getItem('devUserId') || '')

// 数据
const user = ref(null)
const posts = ref([])
const activeTab = ref('posts')
const following = ref(false)
const loading = ref(false)

// 获取当前用户信息
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true
  try {
    const userId = route.params.id
    const res = await getUserProfile(userId)

    if (res.code === 0 && res.data) {
      const userData = res.data

      // 获取当前用户的关注列表
      const currentUser = getCurrentUser()
      if (currentUser) {
        try {
          const followingRes = await getFollowingList(currentUser._id)
          if (followingRes.code === 0) {
            const followingIds = followingRes.data.map(u => u.id)
            userData.isFollowing = followingIds.includes(userId)
          }
        } catch (e) {
          console.log('获取关注列表失败', e)
        }
      }

      user.value = userData
    } else {
      ElMessage.error('用户不存在')
      router.back()
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载用户帖子
const loadUserPosts = async () => {
  try {
    const userId = route.params.id
    const res = await getPostList({ userId })

    if (res.code === 0) {
      posts.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
  }
}

// 关注/取消关注
const toggleFollow = async () => {
  const currentUser = getCurrentUser()
  if (!currentUser) {
    ElMessage.warning('请先登录')
    return
  }

  if (currentUser._id === user.value.id) {
    ElMessage.warning('不能关注自己')
    return
  }

  following.value = true
  try {
    const res = await toggleFollow(user.value.id)

    if (res.code === 0) {
      user.value.isFollowing = res.data.following

      // 更新粉丝数
      if (res.data.following) {
        user.value.followers_count = (user.value.followers_count || 0) + 1
      } else {
        user.value.followers_count = Math.max(0, (user.value.followers_count || 1) - 1)
      }

      ElMessage.success(res.data.following ? '关注成功' : '取消关注')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  } finally {
    following.value = false
  }
}

// 跳转到帖子详情
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

onMounted(() => {
  loadUserInfo()
  loadUserPosts()
})
</script>

<style scoped>
.user-profile-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40px;
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

.user-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.user-bio {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px;
}

.user-meta {
  font-size: 13px;
  color: #999;
  display: flex;
  gap: 16px;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #0ea5e9;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.loading,
.empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.post-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-content {
  font-size: 15px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}
</style>
