<template>
  <div class="post-detail-container">
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
    <main class="main-content" v-if="post">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <!-- 帖子内容 -->
      <div class="post-content-card">
        <!-- 作者信息 -->
        <div class="author-section">
          <img
            :src="post.author_avatar || '/default-avatar.png'"
            class="author-avatar"
            @click="goToUserProfile"
          />
          <div class="author-info">
            <div class="author-name" @click="goToUserProfile">{{ post.author_name }}</div>
            <div class="post-time">{{ formatTime(post.created_at) }}</div>
          </div>
          <el-button @click="toggleCollect" :type="isCollected ? 'primary' : 'default'" plain>
            {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
          </el-button>
        </div>

        <!-- 帖子类型标签 -->
        <el-tag
          v-if="post.type === '提问'"
          type="warning"
          effect="plain"
          class="post-type-tag"
        >
          提问
        </el-tag>
        <el-tag
          v-if="post.type === '分享'"
          type="success"
          effect="plain"
          class="post-type-tag"
        >
          分享
        </el-tag>

        <!-- 帖子内容 -->
        <div class="post-text" v-html="parseContent(post.content)"></div>

        <!-- 帖子图片 -->
        <div v-if="post.images && post.images.length" class="post-images">
          <el-image
            v-for="(img, index) in post.images"
            :key="index"
            :src="img"
            :preview-src-list="post.images"
            :initial-index="index"
            fit="cover"
            class="post-image"
            :lazy="true"
          />
        </div>

        <!-- 话题标签 -->
        <div v-if="post.tags && post.tags.length" class="post-tags">
          <el-tag
            v-for="tag in post.tags"
            :key="tag"
            class="tag-item"
            @click="goToTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>

        <!-- 互动数据 -->
        <div class="post-stats">
          <span @click="handleLike" class="stat-item like-btn" :class="{ active: isLiked }">
            <span class="heart-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
            {{ likeCount }}
          </span>
          <span class="stat-item">
            <el-icon><View /></el-icon>
            {{ viewCount }}
          </span>
          <span class="stat-item">
            <el-icon><ChatDotRound /></el-icon>
            {{ commentCount }}
          </span>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <h3 class="section-title">评论 ({{ commentCount }})</h3>

        <!-- 评论输入 -->
        <div class="comment-input-area">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="说点什么吧..."
            maxlength="500"
            show-word-limit
            class="comment-input"
          />
          <div class="input-actions">
            <el-button
              type="primary"
              @click="submitComment"
              :disabled="!commentContent.trim()"
              size="small"
            >
              发表评论
            </el-button>
          </div>
        </div>

        <!-- 评论列表 -->
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="comments.length === 0" class="empty-comments">
          <p>还没有评论，快来抢沙发吧~</p>
        </div>

        <div v-else class="comments-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
          >
            <img
              :src="comment.profiles?.avatar || '/default-avatar.png'"
              class="comment-avatar clickable"
              @click="goToUserProfile(comment.profiles?.id)"
            />
            <div class="comment-content-wrapper">
              <div class="comment-header">
                <span class="comment-user clickable" @click="goToUserProfile(comment.profiles?.id)">
                  {{ comment.profiles?.nickname || '匿名用户' }}
                </span>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
            </div>
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
import {
  ArrowLeft,
  View,
  ChatDotRound
} from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'
import {
  getPostDetail,
  toggleLike,
  getCommentList,
  createComment
} from '../api/cloud'

const route = useRoute()
const router = useRouter()

// 数据
const post = ref(null)
const comments = ref([])

// 状态
const loading = ref(false)
const isCollected = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)
const viewCount = ref(0)
const commentCount = ref(0)
const commentContent = ref('')

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 加载帖子详情
const loadPostDetail = async () => {
  loading.value = true

  try {
    const postId = route.params.id
    const userId = getCurrentUserId()

    // 从 Supabase 获取帖子详情
    const res = await getPostDetail(postId)

    if (res.code !== 0 || !res.data) {
      ElMessage.error('帖子不存在')
      router.back()
      return
    }

    const postData = res.data
    post.value = postData

    // 更新统计数据
    likeCount.value = postData.like_count || 0
    viewCount.value = postData.view_count || 0
    commentCount.value = postData.comment_count || 0

    // 检查是否已点赞
    if (userId) {
      const { data: likeData } = await toggleLike(postId)
      if (likeData?.data?.liked !== undefined) {
        // 如果当前是未点赞状态，取消点赞以恢复原状
        if (likeData.data.liked) {
          await toggleLike(postId)
        }
        isLiked.value = false
      }
    }

    // 检查是否已收藏
    try {
      const collections = JSON.parse(localStorage.getItem('collections') || '[]')
      isCollected.value = collections.includes(postId)
    } catch (collectionError) {
      console.error('检查收藏失败:', collectionError)
    }

    // 加载评论
    await loadComments()
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 加载评论列表
const loadComments = async () => {
  try {
    const postId = route.params.id
    const res = await getCommentList(postId)

    if (res.code === 0 && res.data) {
      // Supabase 返回的数据结构：comments 与 profiles 是关联的
      comments.value = res.data.map(comment => ({
        ...comment,
        profiles: comment.profiles || { nickname: '匿名用户', avatar: '' }
      }))
      commentCount.value = comments.value.length
    } else {
      comments.value = []
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 点赞帖子
const handleLike = async () => {
  const userId = getCurrentUserId()
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const postId = route.params.id
    const res = await toggleLike(postId)

    if (res.code === 0) {
      const liked = res.data.liked
      isLiked.value = liked

      // 更新点赞数
      if (liked) {
        likeCount.value = (post.value.like_count || 0) + 1
        post.value.like_count = likeCount.value
        ElMessage.success('已点赞')
      } else {
        likeCount.value = Math.max(0, (post.value.like_count || 1) - 1)
        post.value.like_count = likeCount.value
        ElMessage.success('已取消点赞')
      }
    }
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('操作失败，请重试')
  }
}

// 收藏/取消收藏
const toggleCollect = () => {
  const userId = getCurrentUserId()
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }

  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? '已收藏' : '已取消收藏')

  // 保存收藏状态到 localStorage
  const collections = JSON.parse(localStorage.getItem('collections') || '[]')
  const postId = route.params.id

  if (isCollected.value) {
    if (!collections.includes(postId)) {
      collections.push(postId)
    }
  } else {
    const index = collections.indexOf(postId)
    if (index !== -1) {
      collections.splice(index, 1)
    }
  }

  localStorage.setItem('collections', JSON.stringify(collections))
}

// 发表评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  const userId = getCurrentUserId()
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const postId = route.params.id
    const res = await createComment({
      postId: postId,
      content: commentContent.value
    })

    if (res.code === 0 && res.data) {
      // 获取用户信息
      const userInfo = getCurrentUser()

      // 添加新评论到列表
      const newComment = {
        ...res.data,
        profiles: {
          nickname: userInfo?.nickname || '我',
          avatar: userInfo?.avatar || '',
          id: userId
        }
      }

      comments.value.unshift(newComment)
      commentCount.value++
      post.value.comment_count = commentCount.value

      commentContent.value = ''
      ElMessage.success('评论成功')
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败，请重试')
  }
}

// 跳转到用户主页
const goToUserProfile = (userId) => {
  if (userId) {
    router.push(`/user/${userId}`)
  }
}

// 跳转到标签搜索
const goToTag = (tag) => {
  router.push(`/community?tag=${tag}`)
}

// 解析帖子内容（支持 @用户、链接等）
const parseContent = (content) => {
  if (!content) return ''

  // 简单处理 @用户
  content = content.replace(/@(\S+)/g, '<span style="color: #0ea5e9;">@$1</span>')

  // 处理换行
  content = content.replace(/\n/g, '<br>')

  return content
}

onMounted(() => {
  loadPostDetail()
})
</script>

<style scoped>
.post-detail-container {
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

.post-content-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.author-name:hover {
  color: #0ea5e9;
}

.post-time {
  font-size: 13px;
  color: #999;
  margin-top: 2px;
}

.post-type-tag {
  margin-bottom: 16px;
}

.post-text {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 12px;
}

.post-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tag-item {
  cursor: pointer;
}

.post-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.stat-item.like-btn {
  transition: transform 0.2s;
}

.stat-item.like-btn:active {
  transform: scale(1.1);
}

.stat-item.like-btn.active {
  color: #ff4757;
}

.comments-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.comment-input-area {
  margin-bottom: 24px;
}

.comment-input {
  margin-bottom: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

.loading,
.empty-comments {
  padding: 40px 20px;
  text-align: center;
  color: #999;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

.comment-content-wrapper {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.comment-user:hover {
  color: #0ea5e9;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
