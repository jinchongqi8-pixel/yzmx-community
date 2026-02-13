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
          v-if="post.type === 2"
          type="warning"
          effect="plain"
          class="post-type-tag"
        >
          提问
        </el-tag>
        <el-tag
          v-if="post.type === 3"
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
          <!-- 一级评论 -->
          <div
            v-for="comment in comments"
            :key="comment._id"
            class="comment-item"
          >
            <img
              :src="comment.userAvatar || '/default-avatar.png'"
              class="comment-avatar clickable"
              @click="goToCommentUserProfile(comment)"
            />
            <div class="comment-content-wrapper">
              <div class="comment-header">
                <span class="comment-user clickable" @click="goToCommentUserProfile(comment)">{{ comment.userName }}</span>
                <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <div class="comment-text">{{ comment.commentContent }}</div>
              <div class="comment-actions">
                <span @click="likeComment(comment)" class="action-btn like-btn" :class="{ active: isCommentLiked(comment) }">
                  <span class="heart-icon">{{ isCommentLiked(comment) ? '❤️' : '🤍' }}</span>
                  {{ comment.likeCount || 0 }}
                </span>
                <span @click="showReplyInput(comment)" class="action-btn">
                  <el-icon><ChatDotRound /></el-icon>
                  回复
                </span>
                <span
                  v-if="comment.replies && comment.replies.length > 0"
                  @click="toggleReplies(comment)"
                  class="action-btn"
                >
                  <el-icon><ArrowDown /></el-icon>
                  {{ isRepliesExpanded(comment) ? '收起' : `展开 ${comment.replies.length} 条回复` }}
                </span>
                <span @click="toggleEmojiPicker(comment)" class="action-btn emoji-btn">
                  😊 表情
                </span>
              </div>

              <!-- 表情反应 -->
              <div v-if="showEmojiPickerId === comment._id" class="emoji-picker">
                <span
                  v-for="emoji in emojiList"
                  :key="emoji"
                  @click="reactToComment(comment, emoji)"
                  class="emoji-item"
                  :class="{ active: hasReacted(comment, emoji) }"
                >
                  {{ emoji }}
                  <span v-if="getReactionCount(comment, emoji) > 0" class="emoji-count">
                    {{ getReactionCount(comment, emoji) }}
                  </span>
                </span>
              </div>

              <!-- 显示已添加的表情反应 -->
              <div v-if="comment.reactions && Object.keys(comment.reactions).length > 0" class="reactions-display">
                <div
                  v-for="(users, emoji) in comment.reactions"
                  :key="emoji"
                  class="reaction-badge-wrapper"
                >
                  <span
                    class="reaction-badge"
                    @click="toggleReactionUsers(comment, emoji)"
                  >
                    {{ emoji }} {{ users.length }}
                  </span>
                  <!-- 反应用户列表 -->
                  <div v-if="showReactionUsers(comment._id, emoji)" class="reaction-users-list">
                    <div
                      v-for="userId in users"
                      :key="userId"
                      class="reaction-user-item"
                    >
                      <img :src="getUserAvatar(userId)" class="reaction-user-avatar" />
                      <span class="reaction-user-name">{{ getUserName(userId) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 二级评论（回复） -->
              <div v-if="isRepliesExpanded(comment) && comment.replies && comment.replies.length > 0" class="replies-section">
                <div
                  v-for="reply in comment.replies"
                  :key="reply._id"
                  class="reply-item"
                >
                  <img
                    :src="reply.userAvatar || '/default-avatar.png'"
                    class="reply-avatar clickable"
                    @click="goToReplyUserProfile(reply)"
                  />
                  <div class="reply-content-wrapper">
                    <div class="reply-header">
                      <span class="reply-user clickable" @click="goToReplyUserProfile(reply)">{{ reply.userName }}</span>
                      <span v-if="reply.replyToUserName" class="reply-to">
                        回复 @{{ reply.replyToUserName }}
                      </span>
                      <span class="reply-time">{{ formatTime(reply.createdAt) }}</span>
                    </div>
                    <div class="reply-text">{{ reply.commentContent }}</div>
                    <div class="reply-actions">
                      <span @click="likeReply(comment, reply)" class="action-btn like-btn" :class="{ active: isReplyLiked(reply) }">
                        <span class="heart-icon">{{ isReplyLiked(reply) ? '❤️' : '🤍' }}</span>
                        {{ reply.likeCount || 0 }}
                      </span>
                      <span @click="showReplyInput(comment, reply)" class="action-btn">
                        <el-icon><ChatDotRound /></el-icon>
                        回复
                      </span>
                      <span @click="toggleReplyEmojiPicker(comment, reply)" class="action-btn emoji-btn">
                        😊
                      </span>
                    </div>

                    <!-- 回复的表情反应 -->
                    <div v-if="showReplyEmojiPickerId === reply._id" class="emoji-picker">
                      <span
                        v-for="emoji in emojiList"
                        :key="emoji"
                        @click="reactToReply(comment, reply, emoji)"
                        class="emoji-item"
                        :class="{ active: hasReactedToReply(reply, emoji) }"
                      >
                        {{ emoji }}
                        <span v-if="getReplyReactionCount(reply, emoji) > 0" class="emoji-count">
                          {{ getReplyReactionCount(reply, emoji) }}
                        </span>
                      </span>
                    </div>

                    <!-- 显示回复的表情反应 -->
                    <div v-if="reply.reactions && Object.keys(reply.reactions).length > 0" class="reactions-display">
                      <div
                        v-for="(users, emoji) in reply.reactions"
                        :key="emoji"
                        class="reaction-badge-wrapper"
                      >
                        <span
                          class="reaction-badge"
                          @click="toggleReplyReactionUsers(reply, emoji)"
                        >
                          {{ emoji }} {{ users.length }}
                        </span>
                        <!-- 反应用户列表 -->
                        <div v-if="showReplyReactionUsers(reply._id, emoji)" class="reaction-users-list">
                          <div
                            v-for="userId in users"
                            :key="userId"
                            class="reaction-user-item"
                          >
                            <img :src="getUserAvatar(userId)" class="reaction-user-avatar" />
                            <span class="reaction-user-name">{{ getUserName(userId) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 回复输入框 -->
              <div v-if="replyToCommentId === comment._id" class="reply-input-area">
                <el-input
                  v-model="replyContent"
                  :placeholder="replyToReplyId ? `回复 ${getReplyUserName(comment, replyToReplyId)}` : `回复 ${comment.userName}`"
                  :rows="2"
                  size="small"
                  class="reply-input"
                />
                <div class="reply-actions">
                  <el-button
                    size="small"
                    type="primary"
                    @click="submitReply(comment)"
                    :disabled="!replyContent.trim()"
                  >
                    发送
                  </el-button>
                  <el-button
                    size="small"
                    @click="cancelReply"
                  >
                    取消
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <!-- 热门话题 -->
      <div class="sidebar-card">
        <h4 class="sidebar-title">🔥 热门话题</h4>
        <div class="hot-tags">
          <el-tag
            v-for="tag in hotTags"
            :key="tag"
            class="hot-tag"
            @click="goToTag(tag)"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <!-- 相关推荐 -->
      <div class="sidebar-card">
        <h4 class="sidebar-title">📚 相关帖子</h4>
        <div class="related-posts">
          <div
            v-for="item in relatedPosts"
            :key="item._id"
            class="related-post-item"
            @click="goToPost(item._id)"
          >
            <div class="related-post-title">{{ item.title || item.content }}</div>
            <div class="related-post-meta">
              <span>👁 {{ item.viewCount || 0 }}</span>
              <span>💬 {{ item.commentCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  View,
  ChatDotRound,
  Select,
  ArrowDown
} from '@element-plus/icons-vue'
import {
  createLikeNotification,
  createCommentNotification,
  createCollectNotification,
  createReplyNotification,
  createMentionNotification,
  createCommentLikeNotification,
  createCommentReactionNotification,
  extractMentions
} from '../utils/notification'
import { formatTime } from '../utils/formatTime'
import {
  getPostDetail,
  toggleLike,
  checkLike,
  getCommentList,
  createComment,
  deleteComment,
  toggleFollow,
  getFollowingList,
  getUserProfile
} from '../api/cloud'
import { supabase, TABLES } from '../supabase/client'

const route = useRoute()
const router = useRouter()

// 数据
const post = ref(null)
const comments = ref([])
const relatedPosts = ref([])
const hotTags = ref([
  '#前端开发',
  '#JavaScript',
  '#Vue3',
  '#微信小程序',
  '#Node.js'
])

// 状态
const loading = ref(false)
const isCollected = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)
const viewCount = ref(0)
const commentCount = ref(0)
const commentContent = ref('')
const replyContent = ref('')
const replyToCommentId = ref(null)
const replyToReplyId = ref(null) // 新增：追踪回复的是哪个回复
const expandedReplies = ref(new Set()) // 存储展开的评论ID
const showReactionUsersMap = ref({}) // 存储显示表情用户的映射 {commentId_emoji: boolean}

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 检查评论是否已点赞
const isCommentLiked = (comment) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id || !comment.likedBy) return false
  return comment.likedBy.includes(userInfo._id)
}

// 检查回复是否已点赞
const isReplyLiked = (reply) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id || !reply.likedBy) return false
  return reply.likedBy.includes(userInfo._id)
}

// 添加到浏览历史
const addToHistory = (post, user) => {
  const key = `history_${user._id}`
  const history = JSON.parse(localStorage.getItem(key) || '[]')

  // 创建历史记录
  const historyItem = {
    _id: `hist_${Date.now()}`,
    type: 'post',
    postId: post._id,
    title: post.content?.substring(0, 100),
    userId: post.author_id,
    userName: post.author_name,
    userAvatar: post.author_avatar,
    timestamp: Date.now(),
    date: new Date().toLocaleDateString(),
    createdAt: new Date().toLocaleString()
  }

  // 移除重复的历史记录（同一帖子只保留最新的）
  const existingIndex = history.findIndex(h => h.postId === post._id)
  if (existingIndex !== -1) {
    history.splice(existingIndex, 1)
  }

  // 添加到前面
  history.unshift(historyItem)

  // 只保留最近100条历史
  if (history.length > 100) {
    history.splice(100)
  }

  localStorage.setItem(key, JSON.stringify(history))
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

    // 更新统计数据（Supabase 字段是 like_count, comment_count）
    likeCount.value = postData.like_count || 0
    commentCount.value = postData.comment_count || 0

    // 检查是否已点赞
    if (userId) {
      const likeRes = await checkLike(postId)
      if (likeRes.code === 0) {
        isLiked.value = likeRes.data.liked
      }
    }

    if (postIndex === -1) {
      ElMessage.error('帖子不存在')
      router.back()
      return
    }

    const postData = allPosts[postIndex]
    post.value = postData

    // 更新统计数据
    likeCount.value = postData.likeCount || 0
    viewCount.value = postData.viewCount || 0
    commentCount.value = postData.commentCount || 0

    // 获取当前用户
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')

    // ✅ 检查是否已浏览过（每个用户只计算一次）
    if (userInfo._id) {
      // 初始化 viewedBy 数组
      if (!postData.viewedBy) {
        postData.viewedBy = []
      }

      // 如果用户还没浏览过这个帖子，增加浏览次数
      if (!postData.viewedBy.includes(userInfo._id)) {
        postData.viewedBy.push(userInfo._id)
        postData.viewCount = (postData.viewCount || 0) + 1
        viewCount.value = postData.viewCount

        // 保存更新后的帖子数据
        allPosts[postIndex] = postData
        localStorage.setItem('posts', JSON.stringify(allPosts))

        console.log(`✅ 用户 ${userInfo.nickname} 首次浏览，浏览次数 +1`)
      } else {
        console.log(`ℹ️ 用户 ${userInfo.nickname} 已浏览过，不累加`)
      }
    }

    // 检查是否已点赞
    const postLikedBy = postData.likedBy || []
    isLiked.value = userInfo._id ? postLikedBy.includes(userInfo._id) : false

    // 记录浏览历史（加try-catch保护）
    try {
      if (userInfo._id) {
        addToHistory(postData, userInfo)
      }
    } catch (historyError) {
      console.error('记录历史失败:', historyError)
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
    // 从帖子中获取评论
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const postData = allPosts.find(p => p._id === route.params.id)
    if (postData && postData.comments) {
      comments.value = postData.comments
    } else {
      comments.value = []
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 点赞帖子
const handleLike = async () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  const postId = route.params.id
  const postLikedBy = post.value.likedBy || []

  if (postLikedBy.includes(userInfo._id)) {
    // 取消点赞
    const newLikedBy = postLikedBy.filter(id => id !== userInfo._id)
    post.value.likedBy = newLikedBy
    post.value.likeCount = Math.max(0, (post.value.likeCount || 0) - 1)
    isLiked.value = false
    likeCount.value = post.value.likeCount  // 更新显示的点赞数
    ElMessage.success('已取消点赞')
  } else {
    // 点赞
    post.value.likedBy.push(userInfo._id)
    post.value.likeCount = (post.value.likeCount || 0) + 1
    isLiked.value = true
    likeCount.value = post.value.likeCount  // 更新显示的点赞数
    ElMessage.success('已点赞')

    // 创建点赞通知（如果点赞的不是作者自己）
    if (post.value.userId !== userInfo._id) {
      createLikeNotification(userInfo, post.value, post.value.userId)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  }

  // 强制触发响应式更新
  post.value = { ...post.value }

  // 保存到localStorage
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const postIndex = allPosts.findIndex(p => p._id === postId)
  if (postIndex !== -1) {
    allPosts[postIndex] = post.value
    localStorage.setItem('posts', JSON.stringify(allPosts))
  }
}

// 收藏/取消收藏
const toggleCollect = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  isCollected.value = !isCollected.value
  ElMessage.success(isCollected.value ? '已收藏' : '已取消收藏')

  // 保存收藏状态到 localStorage
  const collections = JSON.parse(localStorage.getItem('collections') || '[]')
  const postId = route.params.id

  if (isCollected.value) {
    // 添加收藏
    if (!collections.includes(postId)) {
      collections.push(postId)
    }
  } else {
    // 取消收藏
    const index = collections.indexOf(postId)
    if (index !== -1) {
      collections.splice(index, 1)
    }
  }

  localStorage.setItem('collections', JSON.stringify(collections))

  // 创建收藏通知（如果收藏的不是作者自己）
  if (post.value.userId !== userInfo._id) {
    createCollectNotification(userInfo, post.value, post.value.userId)
    // 更新未读通知数
    if (window.updateNotificationBadge) {
      window.updateNotificationBadge()
    }
  }
}

// 发表评论
const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const postId = route.params.id
    const newComment = {
      _id: `comment_${Date.now()}`,
      userName: userInfo.nickname || '我',
      userAvatar: userInfo.avatar || '',
      commentContent: commentContent.value,
      userId: userInfo._id,
      createdAt: Date.now(),
      likeCount: 0,
      replies: []
    }

    // 添加到评论列表
    comments.value.unshift(newComment)
    commentCount.value++

    // 更新 post.value
    if (!post.value.comments) {
      post.value.comments = []
    }
    post.value.comments.unshift(newComment)
    post.value.commentCount = comments.value.length

    // 更新 localStorage 中的帖子数据
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const postIndex = allPosts.findIndex(p => p._id === postId)
    if (postIndex !== -1) {
      allPosts[postIndex].comments = post.value.comments
      allPosts[postIndex].commentCount = post.value.commentCount
      localStorage.setItem('posts', JSON.stringify(allPosts))
    }

    // ✅ 检测@提醒
    const mentions = extractMentions(commentContent.value)
    if (mentions.length > 0) {
      // 获取所有用户
      const users = JSON.parse(localStorage.getItem('users') || '[]')

      // 遍历每个@用户
      mentions.forEach(mentionName => {
        // 根据昵称查找用户
        const mentionedUser = users.find(u => u.nickname === mentionName)

        if (mentionedUser && mentionedUser._id !== userInfo._id) {
          // 发送@提醒通知
          createMentionNotification(userInfo, mentionedUser, post.value, commentContent.value)
        }
      })
    }

    commentContent.value = ''
    ElMessage.success('评论成功')

    // 创建评论通知（如果评论的不是作者自己）
    if (post.value.userId !== userInfo._id) {
      createCommentNotification(userInfo, post.value, commentContent.value, post.value.userId)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  } catch (error) {
    console.error('评论失败:', error)
    ElMessage.error('评论失败')
  }
}

// 显示回复输入框
const showReplyInput = (comment, reply = null) => {
  replyToCommentId.value = comment._id
  replyToReplyId.value = reply ? reply._id : null
  replyContent.value = ''
}

// 取消回复
const cancelReply = () => {
  replyToCommentId.value = null
  replyToReplyId.value = null
  replyContent.value = ''
}

// 提交回复
const submitReply = async (comment) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  const user = getCurrentUser()
  if (!user) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    const postId = route.params.id

    // 获取被回复的用户名
    let replyToUserName = comment.userName // 默认回复主评论
    if (replyToReplyId.value) {
      // 如果是回复某个回复，找到那个回复的用户名
      const reply = comment.replies.find(r => r._id === replyToReplyId.value)
      if (reply) {
        replyToUserName = reply.userName
      }
    }

    // 创建新回复（所有回复都是二级，平铺在主评论下）
    const newReply = {
      _id: `reply_${Date.now()}`,
      userName: user.nickname || '我',
      userAvatar: user.avatar || '',
      replyToUserName: replyToUserName,
      commentContent: replyContent.value,
      userId: user._id,
      createdAt: Date.now(),
      likeCount: 0
    }

    if (!comment.replies) {
      comment.replies = []
    }
    comment.replies.push(newReply)

    // 保存到localStorage
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const postIndex = allPosts.findIndex(p => p._id === postId)
    if (postIndex !== -1) {
      // 找到对应的评论索引
      const commentIndex = allPosts[postIndex].comments.findIndex(c => c._id === comment._id)
      if (commentIndex !== -1) {
        // 更新回复列表
        allPosts[postIndex].comments[commentIndex].replies = comment.replies
        localStorage.setItem('posts', JSON.stringify(allPosts))
      }
    }

    // 更新 post.value
    if (post.value.comments) {
      const commentIndex2 = post.value.comments.findIndex(c => c._id === comment._id)
      if (commentIndex2 !== -1) {
        post.value.comments[commentIndex2].replies = comment.replies
      }
    }

    replyToCommentId.value = null
    replyToReplyId.value = null
    replyContent.value = ''

    ElMessage.success('回复成功')

    // 创建回复通知
    // 如果是回复某个回复，找到原回复的作者；否则是回复主评论
    let targetUser = null
    if (replyToUserName) {
      // 找到被回复的回复
      const repliedReply = comment.replies.find(r => r.userName === replyToUserName)
      if (repliedReply) {
        targetUser = repliedReply
      }
    } else {
      // 回复主评论
      targetUser = comment
    }

    if (targetUser && targetUser.userId !== user._id) {
      createReplyNotification(user, post.value, targetUser, replyContent.value)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  } catch (error) {
    console.error('回复失败:', error)
    ElMessage.error('回复失败')
  }
}

// 点赞/取消点赞评论
const likeComment = (comment) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  // 初始化 likedBy 数组
  if (!comment.likedBy) {
    comment.likedBy = []
  }

  const userId = userInfo._id
  const likedIndex = comment.likedBy.indexOf(userId)

  if (likedIndex === -1) {
    // 未点赞，添加点赞
    comment.likedBy.push(userId)
    comment.likeCount = (comment.likeCount || 0) + 1
    ElMessage.success('已点赞')

    // 创建评论点赞通知（如果点赞的不是评论作者自己）
    if (comment.userId && comment.userId !== userId) {
      createCommentLikeNotification(userInfo, post.value, comment, comment.commentContent)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  } else {
    // 已点赞，取消点赞
    comment.likedBy.splice(likedIndex, 1)
    comment.likeCount = Math.max(0, comment.likeCount - 1)
    ElMessage.success('已取消点赞')
  }

  // 保存到localStorage
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const postIndex = allPosts.findIndex(p => p._id === route.params.id)
  if (postIndex !== -1) {
    allPosts[postIndex].comments = comments.value
    localStorage.setItem('posts', JSON.stringify(allPosts))
  }
}

// 点赞/取消点赞回复
const likeReply = (comment, reply) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  // 初始化 likedBy 数组
  if (!reply.likedBy) {
    reply.likedBy = []
  }

  const userId = userInfo._id
  const likedIndex = reply.likedBy.indexOf(userId)

  if (likedIndex === -1) {
    // 未点赞，添加点赞
    reply.likedBy.push(userId)
    reply.likeCount = (reply.likeCount || 0) + 1
    ElMessage.success('已点赞')
  } else {
    // 已点赞，取消点赞
    reply.likedBy.splice(likedIndex, 1)
    reply.likeCount = Math.max(0, reply.likeCount - 1)
    ElMessage.success('已取消点赞')
  }

  // 保存到localStorage
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const postIndex = allPosts.findIndex(p => p._id === route.params.id)
  if (postIndex !== -1) {
    allPosts[postIndex].comments = comments.value
    localStorage.setItem('posts', JSON.stringify(allPosts))
  }
}

// 表情列表
const emojiList = ['👍', '❤️', '😂', '🔥', '👏', '🎉', '😮', '😢']

// 表情选择器显示状态
const showEmojiPickerId = ref(null)
const showReplyEmojiPickerId = ref(null)

// 切换评论表情选择器
const toggleEmojiPicker = (comment) => {
  if (showEmojiPickerId.value === comment._id) {
    showEmojiPickerId.value = null
  } else {
    showEmojiPickerId.value = comment._id
    showReplyEmojiPickerId.value = null
  }
}

// 切换回复表情选择器
const toggleReplyEmojiPicker = (comment, reply) => {
  if (showReplyEmojiPickerId.value === reply._id) {
    showReplyEmojiPickerId.value = null
  } else {
    showReplyEmojiPickerId.value = reply._id
    showEmojiPickerId.value = null
  }
}

// 对评论进行表情反应
const reactToComment = (comment, emoji) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  // 初始化 reactions 对象
  if (!comment.reactions) {
    comment.reactions = {}
  }

  // 初始化该表情的用户列表
  if (!comment.reactions[emoji]) {
    comment.reactions[emoji] = []
  }

  const userId = userInfo._id
  const reactionIndex = comment.reactions[emoji].indexOf(userId)

  if (reactionIndex === -1) {
    // 未反应，添加反应
    comment.reactions[emoji].push(userId)
    ElMessage.success(`已添加 ${emoji} 反应`)

    // 创建评论表情反应通知（如果反应的不是评论作者自己）
    if (comment.userId && comment.userId !== userId) {
      createCommentReactionNotification(userInfo, post.value, comment, comment.commentContent, emoji)
      // 更新未读通知数
      if (window.updateNotificationBadge) {
        window.updateNotificationBadge()
      }
    }
  } else {
    // 已反应，取消反应
    comment.reactions[emoji].splice(reactionIndex, 1)
    // 如果该表情没有用户了，删除该表情
    if (comment.reactions[emoji].length === 0) {
      delete comment.reactions[emoji]
    }
    ElMessage.success(`已取消 ${emoji} 反应`)
  }

  // 保存到localStorage
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const postIndex = allPosts.findIndex(p => p._id === route.params.id)
  if (postIndex !== -1) {
    allPosts[postIndex].comments = comments.value
    localStorage.setItem('posts', JSON.stringify(allPosts))
  }
}

// 对回复进行表情反应
const reactToReply = (comment, reply, emoji) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id) {
    ElMessage.warning('请先登录')
    return
  }

  // 初始化 reactions 对象
  if (!reply.reactions) {
    reply.reactions = {}
  }

  // 初始化该表情的用户列表
  if (!reply.reactions[emoji]) {
    reply.reactions[emoji] = []
  }

  const userId = userInfo._id
  const reactionIndex = reply.reactions[emoji].indexOf(userId)

  if (reactionIndex === -1) {
    // 未反应，添加反应
    reply.reactions[emoji].push(userId)
    ElMessage.success(`已添加 ${emoji} 反应`)
  } else {
    // 已反应，取消反应
    reply.reactions[emoji].splice(reactionIndex, 1)
    // 如果该表情没有用户了，删除该表情
    if (reply.reactions[emoji].length === 0) {
      delete reply.reactions[emoji]
    }
    ElMessage.success(`已取消 ${emoji} 反应`)
  }

  // 保存到localStorage
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const postIndex = allPosts.findIndex(p => p._id === route.params.id)
  if (postIndex !== -1) {
    allPosts[postIndex].comments = comments.value
    localStorage.setItem('posts', JSON.stringify(allPosts))
  }
}

// 检查是否对该评论进行了表情反应
const hasReacted = (comment, emoji) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id || !comment.reactions || !comment.reactions[emoji]) {
    return false
  }
  return comment.reactions[emoji].includes(userInfo._id)
}

// 检查是否对该回复进行了表情反应
const hasReactedToReply = (reply, emoji) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo._id || !reply.reactions || !reply.reactions[emoji]) {
    return false
  }
  return reply.reactions[emoji].includes(userInfo._id)
}

// 获取评论的表情反应数量
const getReactionCount = (comment, emoji) => {
  if (!comment.reactions || !comment.reactions[emoji]) {
    return 0
  }
  return comment.reactions[emoji].length
}

// 获取回复的表情反应数量
const getReplyReactionCount = (reply, emoji) => {
  if (!reply.reactions || !reply.reactions[emoji]) {
    return 0
  }
  return reply.reactions[emoji].length
}

// 切换评论表情用户列表显示
const toggleReactionUsers = (comment, emoji) => {
  const key = `${comment._id}_${emoji}`
  if (showReactionUsersMap.value[key]) {
    delete showReactionUsersMap.value[key]
  } else {
    showReactionUsersMap.value[key] = true
  }
}

// 切换回复表情用户列表显示
const toggleReplyReactionUsers = (reply, emoji) => {
  const key = `${reply._id}_${emoji}`
  if (showReactionUsersMap.value[key]) {
    delete showReactionUsersMap.value[key]
  } else {
    showReactionUsersMap.value[key] = true
  }
}

// 检查是否显示评论的表情用户列表
const showReactionUsers = (commentId, emoji) => {
  const key = `${commentId}_${emoji}`
  return showReactionUsersMap.value[key] || false
}

// 检查是否显示回复的表情用户列表
const showReplyReactionUsers = (replyId, emoji) => {
  const key = `${replyId}_${emoji}`
  return showReactionUsersMap.value[key] || false
}

// 获取用户头像
const getUserAvatar = (userId) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => u._id === userId)
  return user?.avatar || '/default-avatar.png'
}

// 获取用户名
const getUserName = (userId) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => u._id === userId)
  return user?.nickname || '未知用户'
}

// 切换回复显示
const toggleReplies = (comment) => {
  if (expandedReplies.value.has(comment._id)) {
    expandedReplies.value.delete(comment._id)
  } else {
    expandedReplies.value.add(comment._id)
  }
}

// 检查回复是否展开
const isRepliesExpanded = (comment) => {
  return expandedReplies.value.has(comment._id)
}

// 获取被回复的回复的用户名
const getReplyUserName = (comment, replyId) => {
  if (!comment.replies) return ''
  const reply = comment.replies.find(r => r._id === replyId)
  return reply ? reply.userName : ''
}

// 跳转到标签页
const goToTag = (tag) => {
  router.push({ path: '/topic', query: { tag } })
}

// 跳转到帖子
const goToPost = (postId) => {
  router.push(`/post/${postId}`)
}

// 跳转到用户主页
const goToUserProfile = () => {
  if (post.value && post.value.userId) {
    router.push(`/user/${post.value.userId}`)
  }
}

// 跳转到评论作者的主页
const goToCommentUserProfile = (comment) => {
  if (comment.userId) {
    router.push(`/user/${comment.userId}`)
  }
}

// 跳转到回复作者的主页
const goToReplyUserProfile = (reply) => {
  if (reply.userId) {
    router.push(`/user/${reply.userId}`)
  }
}

// 解析帖子内容，将话题标签转换为可点击链接
const parseContent = (content) => {
  if (!content) return ''

  // 匹配 #话题名 格式，并替换为可点击的链接
  return content.replace(
    /#([^\s#]+)/g,
    '<span class="topic-tag" onclick="event.stopPropagation(); window.navigateToTopic(\'#$1\')">#$1</span>'
  )
}

// 全局函数：跳转到话题页面
window.navigateToTopic = (topicName) => {
  router.push({
    path: '/topic',
    query: { tag: topicName }
  })
}

onMounted(() => {
  loadPostDetail()
})
</script>

<style scoped>
.post-detail-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
}

/* 背景装饰 */
.post-detail-container::before {
  content: '';
  position: fixed;
  top: -30%;
  right: -5%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.post-detail-container::after {
  content: '';
  position: fixed;
  bottom: -20%;
  left: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.navbar {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.navbar:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.nav-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
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
  gap: 32px;
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
  bottom: -18px;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
}

.main-content {
  max-width: 1400px;
  margin: 20px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.back-btn {
  margin-bottom: 20px;
  grid-column: 1 / -1;
}

.post-content-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
  grid-column: 1 / -1;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.post-content-card:hover {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);
}

.author-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(241, 245, 249, 0.8);
}

.author-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
}

.author-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
  cursor: pointer;
  transition: color 0.3s;
}

.author-name:hover {
  color: #0ea5e9;
}

.post-time {
  font-size: 14px;
  color: #999;
}

.post-type-tag {
  margin-right: 8px;
}

.post-text {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.post-text :deep(.topic-tag) {
  color: #0ea5e9;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s;
}

.post-text :deep(.topic-tag):hover {
  color: #667eea;
  text-decoration: underline;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-bottom: 20px;
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.post-tags {
  margin-bottom: 20px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.post-stats {
  display: flex;
  gap: 24px;
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.3s;
}

.stat-item:hover,
.stat-item.active {
  color: #0ea5e9;
}

.stat-item.like-btn {
  transition: all 0.3s;
}

.stat-item.like-btn .heart-icon {
  font-size: 16px;
  display: inline-block;
  transition: transform 0.3s;
}

.stat-item.like-btn.active {
  color: #ef4444;
}

.stat-item.like-btn.active .heart-icon {
  transform: scale(1.2);
  animation: heartbeat 0.3s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% { transform: scale(1.2); }
  50% { transform: scale(1.4); }
}

.comments-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  grid-column: 1 / -1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.comment-input-area {
  margin-bottom: 32px;
}

.comment-input {
  margin-bottom: 12px;
}

.input-actions {
  text-align: right;
}

.loading,
.empty-comments {
  padding: 40px;
  text-align: center;
  color: #999;
}

.comments-list {
  min-height: 200px;
}

.comment-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.comment-avatar.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.comment-avatar.clickable:hover {
  opacity: 0.7;
}

.comment-content-wrapper {
  flex: 1;
}

.comment-header {
  margin-bottom: 8px;
}

.comment-user {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-right: 12px;
}

.comment-user.clickable {
  cursor: pointer;
  transition: color 0.3s;
}

.comment-user.clickable:hover {
  color: #0ea5e9;
}

.comment-time {
  font-size: 13px;
  color: #999;
}

.comment-text {
  font-size: 15px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
}

.comment-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: color 0.3s;
}

.action-btn:hover {
  color: #0ea5e9;
}

.action-btn.like-btn .heart-icon {
  font-size: 14px;
  display: inline-block;
  transition: transform 0.3s;
}

.action-btn.like-btn.active {
  color: #ef4444;
}

.action-btn.like-btn.active .heart-icon {
  transform: scale(1.2);
}

.action-btn.emoji-btn {
  font-size: 14px;
}

/* 表情选择器 */
.emoji-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 8px;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.emoji-item {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  user-select: none;
}

.emoji-item:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.emoji-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.emoji-count {
  font-size: 12px;
  font-weight: 600;
}

/* 表情反应显示 */
.reactions-display {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 8px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reaction-badge:hover {
  background: #e0f2fe;
  transform: scale(1.05);
}

.reaction-badge-wrapper {
  position: relative;
  display: inline-block;
}

.reaction-users-list {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  z-index: 100;
  animation: fadeIn 0.2s ease-in-out;
}

.reaction-user-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.reaction-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.reaction-user-name {
  font-size: 13px;
  color: #333;
}

.replies-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-item:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.reply-avatar.clickable {
  cursor: pointer;
  transition: opacity 0.3s;
}

.reply-avatar.clickable:hover {
  opacity: 0.7;
}

.reply-content {
  flex: 1;
}

.reply-content-wrapper {
  flex: 1;
}

.reply-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.reply-header {
  margin-bottom: 6px;
}

.reply-user {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
}

.reply-user.clickable {
  cursor: pointer;
  transition: color 0.3s;
}

.reply-user.clickable:hover {
  color: #0ea5e9;
}

.reply-to {
  font-size: 13px;
  color: #999;
}

.reply-time {
  font-size: 12px;
  color: #999;
}

.reply-text {
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.reply-input-area {
  margin-top: 12px;
}

.reply-input {
  margin-bottom: 8px;
}

.reply-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
}

.sidebar-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  cursor: pointer;
}

.related-posts {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.related-post-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.related-post-item:hover {
  background: #e9ecef;
}

.related-post-title {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.related-post-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}
</style>
