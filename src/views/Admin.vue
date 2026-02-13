<template>
  <div class="admin-container">
    <h1>🛡️ 管理员后台</h1>

    <div class="stats">
      <div class="stat-card">
        <h3>帖子总数</h3>
        <p>{{ stats.postCount }}</p>
      </div>
      <div class="stat-card">
        <h3>用户总数</h3>
        <p>{{ stats.userCount }}</p>
      </div>
      <div class="stat-card">
        <h3>评论总数</h3>
        <p>{{ stats.commentCount }}</p>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
        帖子管理
      </button>
      <button :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">
        评论管理
      </button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        用户管理
      </button>
    </div>

    <!-- 帖子管理 -->
    <div v-if="activeTab === 'posts'" class="section">
      <h2>帖子管理</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty">暂无帖子</div>
      <div v-else class="list">
        <div v-for="post in posts" :key="post.id" class="item">
          <div class="content">
            <strong>{{ post.author_name }}</strong>
            <p>{{ post.content?.substring(0, 100) }}...</p>
            <small>{{ formatTime(post.created_at) }}</small>
          </div>
          <div class="actions">
            <button @click="deletePost(post.id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论管理 -->
    <div v-if="activeTab === 'comments'" class="section">
      <h2>评论管理</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="comments.length === 0" class="empty">暂无评论</div>
      <div v-else class="list">
        <div v-for="comment in comments" :key="comment.id" class="item">
          <div class="content">
            <strong>{{ comment.profiles?.nickname || '匿名' }}</strong>
            <p>{{ comment.content?.substring(0, 100) }}...</p>
            <small>{{ formatTime(comment.created_at) }}</small>
          </div>
          <div class="actions">
            <button @click="deleteComment(comment.id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户管理 -->
    <div v-if="activeTab === 'users'" class="section">
      <h2>用户管理</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="users.length === 0" class="empty">暂无用户</div>
      <div v-else class="list">
        <div v-for="user in users" :key="user.id" class="item">
          <div class="content">
            <strong>{{ user.nickname || '用户' }}</strong>
            <p>{{ user.phone || '' }}</p>
            <p>金币: {{ user.gold_count || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPostList, getCommentList, deletePost as deletePostApi, deleteComment as deleteCommentApi, supabase, TABLES } from '../api/cloud'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const activeTab = ref('posts')
const posts = ref([])
const comments = ref([])
const users = ref([])
const loading = ref(false)

const stats = ref({
  postCount: 0,
  userCount: 0,
  commentCount: 0
})

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取所有帖子
    const { data: allPosts } = await supabase
      .from(TABLES.POSTS)
      .select('id')

    if (allPosts) {
      stats.value.postCount = allPosts.length || 0
    }

    // 获取所有用户
    const { data: allUsers } = await supabase
      .from(TABLES.PROFILES)
      .select('id')

    if (allUsers) {
      stats.value.userCount = allUsers.length || 0
    }

    // 获取所有评论
    const { data: allComments } = await supabase
      .from(TABLES.COMMENTS)
      .select('id')

    if (allComments) {
      stats.value.commentCount = allComments.length || 0
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载帖子
const loadPosts = async () => {
  loading.value = true
  try {
    const res = await getPostList()
    if (res.code === 0) {
      posts.value = res.data.list || []
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载评论
const loadComments = async () => {
  loading.value = true
  try {
    const res = await getCommentList()
    if (res.code === 0) {
      comments.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 加载用户
const loadUsers = async () => {
  loading.value = true
  try {
    const { data } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    users.value = data || []
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 删除帖子
const deletePost = async (postId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deletePostApi(postId)
    ElMessage.success('删除成功')
    posts.value = posts.value.filter(p => p.id !== postId)
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteCommentApi(commentId)
    ElMessage.success('删除成功')
    comments.value = comments.value.filter(c => c.id !== commentId)
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadStats()
  loadPosts()
  loadComments()
  loadUsers()
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.stat-card p {
  font-size: 28px;
  font-weight: 600;
  color: #0ea5e9;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: white;
  padding: 12px;
  border-radius: 12px;
}

.tabs button {
  flex: 1;
  padding: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.tabs button:hover {
  background: #e5e7eb;
}

.tabs button.active {
  background: #0ea5e9;
  color: white;
}

.section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
}

.item .content {
  flex: 1;
}

.item .content strong {
  display: block;
  margin-bottom: 4px;
}

.item .content p {
  margin: 4px 0;
  font-size: 14px;
  color: #333;
}

.item .content small {
  font-size: 12px;
  color: #999;
}

.delete-btn {
  padding: 6px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.delete-btn:hover {
  background: #dc2626;
}
</style>
