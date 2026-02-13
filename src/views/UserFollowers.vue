<template>
  <div class="followers-container">
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
        <h2 class="title">{{ user.nickname }} 的粉丝</h2>
        <p class="subtitle">共 {{ followers.length }} 位粉丝</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 粉丝列表 -->
      <div v-else-if="followers.length === 0" class="empty">
        <p>还没有粉丝哦~</p>
      </div>

      <div v-else class="followers-list">
        <div
          v-for="follower in followers"
          :key="follower.userId"
          class="follower-item"
        >
          <img
            :src="follower.avatar || '/default-avatar.png'"
            class="follower-avatar"
            @click="goToUserProfile(follower.userId)"
          />
          <div class="follower-info" @click="goToUserProfile(follower.userId)">
            <div class="follower-name">{{ follower.name }}</div>
            <div class="follower-meta">
              <span>{{ follower.postsCount || 0 }} 帖子</span>
              <span>{{ follower.followersCount || 0 }} 粉丝</span>
            </div>
            <div class="follower-time">关注于 {{ formatTime(follower.createdAt) }}</div>
          </div>
          <div class="follower-actions">
            <el-button
              v-if="!follower.isCurrentUser"
              @click="toggleFollow(follower)"
              :type="follower.isFollowing ? 'default' : 'primary'"
              size="small"
            >
              {{ follower.isFollowing ? '已关注' : '关注' }}
            </el-button>
            <el-button
              v-if="!follower.isCurrentUser"
              @click="startChat(follower.userId)"
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
import { getFollowerList, getUserProfile, toggleFollow as toggleFollowApi } from '../api/cloud'

const route = useRoute()
const router = useRouter()
const user = ref(null)
const followers = ref([])
const loading = ref(true)

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 加载粉丝列表
const loadFollowers = async () => {
  loading.value = true
  try {
    const userId = route.params.id
    const currentUserId = getCurrentUserId()

    // 获取粉丝列表
    const res = await getFollowerList(userId)
    if (res.code === 0) {
      const followerList = res.data || []

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

      // 构建粉丝列表
      followers.value = followerList.map(follower => ({
        userId: follower.id,
        name: follower.nickname || '用户',
        avatar: follower.avatar || '',
        postsCount: follower.posts_count || 0,
        followersCount: follower.followers_count || 0,
        createdAt: follower.created_at,
        isFollowing: followingIds.includes(follower.id),
        isCurrentUser: follower.id === currentUserId
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
const toggleFollow = async (follower) => {
  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (follower.isCurrentUser) {
    ElMessage.warning('不能关注自己')
    return
  }

  try {
    const res = await toggleFollowApi(follower.userId)
    if (res.code === 0) {
      follower.isFollowing = res.data.following
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
  loadFollowers()
})
</script>

<style scoped>
.followers-container {
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

.followers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.follower-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.follower-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.follower-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.follower-info {
  flex: 1;
  cursor: pointer;
}

.follower-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.follower-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.follower-time {
  font-size: 12px;
  color: #999;
}

.follower-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .follower-item {
    padding: 12px;
    gap: 12px;
  }

  .follower-avatar {
    width: 48px;
    height: 48px;
  }

  .follower-name {
    font-size: 15px;
  }

  .follower-meta {
    font-size: 12px;
    gap: 12px;
  }
}
</style>
