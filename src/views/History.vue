<template>
  <div class="history-container">
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
    <main class="main-content">
      <!-- 返回按钮 -->
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <div class="header-section">
        <h2 class="page-title">浏览历史</h2>
        <el-button @click="clearHistory" type="danger" plain size="small">
          清空历史
        </el-button>
      </div>

      <!-- 历史记录 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="history.length === 0" class="empty">
        <p>暂无浏览历史</p>
      </div>

      <div v-else class="history-list">
        <div
          v-for="(item, index) in groupedHistory"
          :key="index"
          class="history-group"
        >
          <div class="group-title">{{ item.date }}</div>

          <div
            v-for="historyItem in item.items"
            :key="historyItem._id"
            class="history-item"
            @click="goToItem(historyItem)"
          >
            <div class="item-content">
              <div class="item-title">{{ historyItem.title }}</div>
              <div class="item-meta">
                <span v-if="historyItem.type === 'post'">💬 帖子</span>
                <span v-if="historyItem.type === 'course'">📚 课程</span>
                <span>{{ formatTime(historyItem.timestamp) }}</span>
              </div>
            </div>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { formatTime } from '../utils/formatTime'

const router = useRouter()
const history = ref([])
const loading = ref(false)

// 按日期分组
const groupedHistory = ref([])

// 加载浏览历史
const loadHistory = async () => {
  loading.value = true

  try {
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (!currentUser._id) {
      ElMessage.warning('请先登录')
      router.push('/login')
      return
    }

    // 从 localStorage 加载当前用户的历史
    const key = `history_${currentUser._id}`
    history.value = JSON.parse(localStorage.getItem(key) || '[]')

    // 按日期分组
    groupByDate()
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 按日期分组
const groupByDate = () => {
  const groups = {}
  history.value.forEach(item => {
    if (!groups[item.date]) {
      groups[item.date] = []
    }
    groups[item.date].push(item)
  })

  groupedHistory.value = Object.keys(groups).map(date => ({
    date,
    items: groups[date]
  }))
}

// 跳转到详情
const goToItem = (item) => {
  if (item.type === 'post') {
    router.push(`/post/${item.id}`)
  } else if (item.type === 'course') {
    router.push(`/course/${item.id}`)
  }
}

// 清空历史
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有浏览历史吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const key = `history_${currentUser._id}`
    localStorage.removeItem(key)
    history.value = []
    groupedHistory.value = []
    ElMessage.success('已清空')
  } catch (error) {
    // 用户取消
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.history-container {
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
  margin: 20px auto;
  padding: 0 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.history-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: #999;
  padding-left: 4px;
}

.history-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

.item-content {
  flex: 1;
}

.item-title {
  font-size: 15px;
  color: #333;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #999;
}

.arrow-icon {
  color: #ccc;
  font-size: 18px;
}
</style>
