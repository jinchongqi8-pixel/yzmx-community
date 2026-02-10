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

const route = useRoute()
const router = useRouter()
const user = ref(null)
const following = ref([])
const loading = ref(true)

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载关注列表
const loadFollowing = () => {
  loading.value = true
  try {
    const userId = route.params.id
    const currentUser = getCurrentUser()

    // 获取所有关注关系
    const follows = JSON.parse(localStorage.getItem('follows') || '[]')

    // 获取该用户关注的人
    const userFollowing = follows.filter(f => f.userId === userId)

    // 获取所有用户信息
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')

    // 构建关注列表
    following.value = userFollowing.map(follow => {
      const followedUser = users.find(u => u._id === follow.followingId)

      // 如果在users中找不到，尝试从帖子中获取基本信息
      if (!followedUser) {
        const userPost = allPosts.find(p => p.userId === follow.followingId)
        return {
          userId: follow.followingId,
          name: userPost?.userName || follow.followingName || '未知用户',
          avatar: userPost?.userAvatar || '',
          postsCount: 0,
          followersCount: 0,
          createdAt: follow.createdAt,
          isFollowing: false,
          isCurrentUser: follow.followingId === currentUser?._id
        }
      }

      // 计算该用户的统计数据
      const followedPosts = allPosts.filter(p => p.userId === follow.followingId)
      const followedFollowers = follows.filter(f => f.followingId === follow.followingId).length

      // 检查当前用户是否关注了该用户
      const isFollowing = follows.some(f =>
        f.userId === currentUser?._id && f.followingId === follow.followingId
      )

      return {
        userId: follow.followingId,
        name: followedUser.nickname || follow.followingName,
        avatar: followedUser.avatar || '',
        postsCount: followedPosts.length,
        followersCount: followedFollowers,
        createdAt: follow.createdAt,
        isFollowing: isFollowing,
        isCurrentUser: follow.followingId === currentUser?._id
      }
    })

    // 获取被查看的用户信息
    const targetUser = users.find(u => u._id === userId)
    if (targetUser) {
      user.value = targetUser
    } else {
      const userPost = allPosts.find(p => p.userId === userId)
      user.value = {
        _id: userId,
        nickname: userPost?.userName || '未知用户'
      }
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
  const currentUser = getCurrentUser()
  if (!currentUser) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    const follows = JSON.parse(localStorage.getItem('follows') || '[]')

    if (followedUser.isFollowing) {
      // 取消关注
      const index = follows.findIndex(f =>
        f.userId === currentUser._id && f.followingId === followedUser.userId
      )
      if (index !== -1) {
        follows.splice(index, 1)
      }
      followedUser.isFollowing = false
      ElMessage.success('取消关注')
    } else {
      // 添加关注
      follows.push({
        userId: currentUser._id,
        userName: currentUser.nickname,
        followingId: followedUser.userId,
        followingName: followedUser.name,
        createdAt: new Date().toISOString()
      })
      followedUser.isFollowing = true
      ElMessage.success('关注成功')
    }

    localStorage.setItem('follows', JSON.stringify(follows))
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
