<template>
  <div class="following-container">
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
    <main class="main-content" v-if="user">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="title">{{ user.nickname }} 的关注</h2>
        <p class="subtitle">共 {{ following.length }} 位关注</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 关注列表 -->
      <div v-else-if="following.length === 0" class="empty">
        <p>还没有关注任何人~</p>
      </div>

      <div v-else class="following-list">
        <div
          v-for="followedUser in following"
          :key="followedUser.userId"
          class="following-item"
        >
          <img
            :src="followedUser.avatar || '/default-avatar.png'"
            class="following-avatar"
            @click="goToUserProfile(followedUser.userId)"
          />
          <div class="following-info" @click="goToUserProfile(followedUser.userId)">
            <div class="following-name">{{ followedUser.name }}</div>
            <div class="following-meta">
              <span>{{ followedUser.postsCount || 0 }} 帖子</span>
              <span>{{ followedUser.followersCount || 0 }} 粉丝</span>
            </div>
            <div class="following-time">关注于 {{ formatTime(followedUser.createdAt) }}</div>
          </div>
          <div class="following-actions">
            <el-button
              v-if="!followedUser.isCurrentUser"
              @click="toggleFollow(followedUser)"
              :type="followedUser.isFollowing ? 'default' : 'primary'"
              size="small"
            >
              {{ followedUser.isFollowing ? '已关注' : '关注' }}
            </el-button>
            <el-button
              v-if="!followedUser.isCurrentUser"
              @click="startChat(followedUser.userId)"
              type="success"
              size="small"
              plain
            >
              💬
            </el-button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'
import { getFollowingList, getUserProfile, toggleFollow as toggleFollowApi } from '../api/cloud'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const following = ref([])
const loading = ref(true)

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 加载关注列表
const loadFollowing = async () => {
  loading.value = true
  try {
    const userId = route.params.id
    const currentUserId = getCurrentUserId()

    // 获取关注列表
    const res = await getFollowingList(userId)
    if (res.code === 0) {
      const followingList = res.data || []

      // 获取被查看的用户信息
      const userRes = await getUserProfile(userId)
      if (userRes.code === 0) {
        user.value = userRes.data
      }

      // 获取当前用户的关注列表，用于判断是否已关注
      const { supabase, TABLES } = await import('../supabase/client')
      let followingIds = []
      if (currentUserId) {
        const { data: followingData } = await supabase
          .from(TABLES.FOLLOWS)
          .select('following_id')
          .eq('follower_id', currentUserId)
        followingIds = followingData?.map(f => f.following_id) || []
      }

      // 构建关注列表
      following.value = followingList.map(followedUser => ({
        userId: followedUser.id,
        name: followedUser.nickname || '用户',
        avatar: followedUser.avatar || '',
        postsCount: followedUser.posts_count || 0,
        followersCount: followedUser.followers_count || 0,
        createdAt: followedUser.created_at,
        isFollowing: followingIds.includes(followedUser.id),
        isCurrentUser: followedUser.id === currentUserId
      }))
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 关注/取消关注
const toggleFollow = async (followedUser) => {
  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (followedUser.isCurrentUser) {
    ElMessage.warning('不能关注自己')
    return
  }

  try {
    const res = await toggleFollowApi(followedUser.userId)
    if (res.code === 0) {
      followedUser.isFollowing = res.data.following
      ElMessage.success(res.data.following ? '关注成功' : '取消关注')
    }
  } catch (error) {
    console.error('操作失败:', error)
    ElMessage.error('操作失败')
  }
}

// 跳转到用户主页
const goToUserProfile = (userId) => {
  router.push(`/user/${userId}`)
}

// 开始聊天
const startChat = (userId) => {
  router.push(`/messages/${userId}`)
}

onMounted(() => {
  loadFollowing()
})
</script>

<style scoped>
.following-container {
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
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.following-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.following-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.following-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.following-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.following-info {
  flex: 1;
  cursor: pointer;
}

.following-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.following-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.following-time {
  font-size: 12px;
  color: #999;
}

.following-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .following-item {
    padding: 12px;
    gap: 12px;
  }

  .following-avatar {
    width: 48px;
    height: 48px;
  }

  .following-name {
    font-size: 15px;
  }

  .following-meta {
    font-size: 12px;
    gap: 12px;
  }
}
</style>
