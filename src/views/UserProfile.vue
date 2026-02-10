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
          <div class="name-with-stats">
            <h2 class="user-name">{{ user.nickname }}</h2>
            <div class="inline-stats">
              <span class="inline-stat" @click="goToFollowers">
                <span class="stat-number-small">{{ user.followersCount || 0 }}</span>
                <span class="stat-label-small">粉丝</span>
              </span>
              <span class="inline-stat" @click="goToFollowing">
                <span class="stat-number-small">{{ user.followingCount || 0 }}</span>
                <span class="stat-label-small">关注</span>
              </span>
            </div>
          </div>
          <p class="user-bio">{{ user.bio || '这个人很懒，什么都没留下~' }}</p>
          <div class="user-meta">
            <span v-if="user.location">📍 {{ user.location }}</span>
            <span>📅 加入于 {{ user.createdAt }}</span>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            @click="toggleFollow"
            :type="user.isFollowing ? 'default' : 'primary'"
            :loading="following"
          >
            {{ user.isFollowing ? '已关注' : '关注' }}
          </el-button>
          <el-button
            @click="startChat"
            type="success"
            plain
            v-if="user._id !== currentUser?._id"
          >
            💬 私信
          </el-button>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-number">{{ user.postsCount || 0 }}</div>
          <div class="stat-label">帖子</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">{{ user.likesCount || 0 }}</div>
          <div class="stat-label">获赞</div>
        </div>
      </div>

      <!-- 标签切换 -->
      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="帖子" name="posts">
          <div v-if="posts.length === 0" class="empty">暂无帖子</div>
          <div v-else class="post-list">
            <div
              v-for="post in posts"
              :key="post._id"
              class="post-item"
              @click="goToPost(post._id)"
            >
              <div class="post-content">{{ post.content }}</div>
              <div class="post-meta">
                <span>👁 {{ post.viewCount || 0 }}</span>
                <span>❤️ {{ post.likeCount || 0 }}</span>
                <span>💬 {{ post.commentCount || 0 }}</span>
                <span>{{ post.createdAt }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="评论" name="comments">
          <div v-if="comments.length === 0" class="empty">暂无评论</div>
          <div v-else class="comment-list">
            <div
              v-for="comment in comments"
              :key="comment._id"
              class="comment-item"
            >
              <div class="comment-content">{{ comment.content }}</div>
              <div class="comment-post">来自：{{ comment.postTitle }}</div>
              <div class="comment-time">{{ comment.createdAt }}</div>
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

const route = useRoute()
const router = useRouter()
const user = ref(null)
const posts = ref([])
const comments = ref([])
const activeTab = ref('posts')
const following = ref(false)

// 获取当前登录用户
const currentUser = ref(null)
const getCurrentUserValue = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载用户信息
const loadUserInfo = async () => {
  const userId = route.params.id

  // 先从帖子中查找该用户的基本信息
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const userPost = allPosts.find(p => p.userId === userId)

  if (!userPost) {
    ElMessage.error('用户不存在')
    router.back()
    return
  }

  // 计算用户统计数据
  const userPosts = allPosts.filter(p => p.userId === userId)
  let totalLikes = 0
  let totalComments = 0

  userPosts.forEach(post => {
    totalLikes += post.likeCount || 0
    totalComments += post.commentCount || 0
  })

  // 从关注列表获取粉丝数
  const follows = JSON.parse(localStorage.getItem('follows') || '[]')
  const followers = follows.filter(f => f.followingId === userId).length

  // 获取当前用户是否关注了该用户
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  const isFollowing = follows.some(f =>
    f.userId === currentUser._id && f.followingId === userId
  )

  user.value = {
    _id: userId,
    nickname: userPost.userName,
    avatar: userPost.userAvatar || '',
    bio: '',
    location: '',
    createdAt: '2024-01-01',
    postsCount: userPosts.length,
    followersCount: followers,
    followingCount: follows.filter(f => f.userId === userId).length,
    likesCount: totalLikes,
    isFollowing: isFollowing
  }
}

// 加载用户帖子
const loadUserPosts = async () => {
  const userId = route.params.id
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const userPosts = allPosts.filter(p => p.userId === userId)

  posts.value = userPosts.sort((a, b) => {
    const timeA = a.timestamp || 0
    const timeB = b.timestamp || 0
    return timeB - timeA
  })
}

// 加载用户评论
const loadUserComments = async () => {
  const userId = route.params.id
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const userComments = []

  // 遍历所有帖子，找出该用户的评论
  allPosts.forEach(post => {
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        if (comment.userId === userId) {
          userComments.push({
            _id: comment._id,
            content: comment.commentContent,
            postTitle: post.content?.substring(0, 30) + '...',
            postId: post._id,
            createdAt: comment.createdAt
          })
        }
      })
    }
  })

  comments.value = userComments
}

// 关注/取消关注
const toggleFollow = async () => {
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!currentUser._id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 不能关注自己
  if (currentUser._id === user.value._id) {
    ElMessage.warning('不能关注自己')
    return
  }

  following.value = true

  try {
    // 获取当前关注列表
    const follows = JSON.parse(localStorage.getItem('follows') || '[]')

    if (user.value.isFollowing) {
      // 取消关注
      const index = follows.findIndex(f =>
        f.userId === currentUser._id && f.followingId === user.value._id
      )
      if (index !== -1) {
        follows.splice(index, 1)
      }
      user.value.isFollowing = false
      user.value.followersCount--
      ElMessage.success('取消关注')
    } else {
      // 添加关注
      follows.push({
        userId: currentUser._id,
        userName: currentUser.nickname,
        followingId: user.value._id,
        followingName: user.value.nickname,
        createdAt: new Date().toISOString()
      })
      user.value.isFollowing = true
      user.value.followersCount++
      ElMessage.success('关注成功')
    }

    // 保存到localStorage
    localStorage.setItem('follows', JSON.stringify(follows))
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    following.value = false
  }
}

// 查看帖子
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转到粉丝列表
const goToFollowers = () => {
  router.push(`/user/${user.value._id}/followers`)
}

// 跳转到关注列表
const goToFollowing = () => {
  router.push(`/user/${user.value._id}/following`)
}

// 开始聊天
const startChat = () => {
  if (!currentUser.value || !currentUser.value._id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  if (!user.value || !user.value._id) {
    ElMessage.error('用户不存在')
    return
  }

  router.push(`/messages/${user.value._id}`)
}

// 获取当前用户（兼容旧代码）
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

onMounted(() => {
  // 获取当前登录用户
  currentUser.value = getCurrentUserValue()

  loadUserInfo()
  loadUserPosts()
  loadUserComments()
})
</script>

<style scoped>
.user-profile-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid #e8ecef;
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
  font-size: 22px;
  font-weight: 700;
  color: #0ea5e9;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  gap: 30px;
}

.nav-link {
  color: #64748b;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #0ea5e9;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #0ea5e9;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
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
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.user-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.name-with-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.inline-stats {
  display: flex;
  gap: 12px;
  align-items: center;
}

.inline-stat {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.inline-stat:hover {
  background: #f0f9ff;
}

.stat-number-small {
  font-size: 14px;
  font-weight: 600;
  color: #0ea5e9;
}

.stat-label-small {
  font-size: 12px;
  color: #999;
}

.user-bio {
  font-size: 15px;
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.user-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item.clickable {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-item.clickable:hover {
  transform: scale(1.05);
}

.stat-item.clickable .stat-number {
  color: #0ea5e9;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.content-tabs {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.post-list,
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.post-item:hover {
  background: #f0f9ff;
  border-color: #e0f2fe;
  transform: translateY(-2px);
}

.post-content {
  font-size: 15px;
  color: #334155;
  line-height: 1.6;
  margin-bottom: 12px;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.comment-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.comment-content {
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
}

.comment-post {
  font-size: 13px;
  color: #0ea5e9;
  margin-bottom: 4px;
}

.comment-time {
  font-size: 12px;
  color: #999;
}
</style>
