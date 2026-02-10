<template>
  <div class="gold-logs-container">
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

      <div class="gold-logs-card">
        <!-- 金币余额 -->
        <div class="balance-section">
          <div class="balance-info">
            <span class="balance-label">当前余额</span>
            <span class="balance-amount">🪙 {{ currentBalance }}</span>
          </div>
          <div class="balance-stats">
            <div class="stat-item">
              <span class="stat-label">总收入</span>
              <span class="stat-value income">+{{ totalIncome }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总支出</span>
              <span class="stat-value expense">-{{ totalExpense }}</span>
            </div>
          </div>
        </div>

        <!-- 筛选器 -->
        <div class="filter-section">
          <el-select v-model="filterType" placeholder="全部类型" clearable @change="loadLogs">
            <el-option label="全部" value=""></el-option>
            <el-option label="收入" value="income"></el-option>
            <el-option label="支出" value="expense"></el-option>
          </el-select>
        </div>

        <!-- 金币流水列表 -->
        <div v-if="loading" class="loading">
          <el-skeleton :rows="3" animated />
        </div>

        <div v-else-if="logs.length === 0" class="empty">
          <p>暂无金币记录</p>
        </div>

        <div v-else class="logs-list">
          <div v-for="log in logs" :key="log._id" class="log-item">
            <div class="log-icon" :class="{ income: log.type === 'income', expense: log.type === 'expense' }">
              {{ getLogIcon(log.type) }}
            </div>
            <div class="log-content">
              <div class="log-title">{{ log.title }}</div>
              <div class="log-desc">{{ log.description }}</div>
              <div class="log-time">{{ formatTime(log.createdAt) }}</div>
            </div>
            <div class="log-amount" :class="{ income: log.type === 'income', expense: log.type === 'expense' }">
              {{ log.type === 'income' ? '+' : '-' }}{{ log.amount }}
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
const logs = ref([])
const loading = ref(true)
const filterType = ref('')
const currentUserId = ref(null)
const currentBalance = ref(0)

// 总收入
const totalIncome = computed(() => {
  return logs.value
    .filter(log => log.type === 'income')
    .reduce((sum, log) => sum + log.amount, 0)
})

// 总支出
const totalExpense = computed(() => {
  return logs.value
    .filter(log => log.type === 'expense')
    .reduce((sum, log) => sum + log.amount, 0)
})

// 获取日志图标
const getLogIcon = (type) => {
  const icons = {
    income: '💰',
    expense: '💸'
  }
  return icons[type] || '📝'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知时间'

  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 1小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }

  // 24小时内
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }

  // 7天内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }

  // 超过7天，显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

// 加载金币流水
const loadLogs = () => {
  loading.value = true

  try {
    // 获取当前用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    currentUserId.value = userInfo._id
    currentBalance.value = userInfo.coins || 1000

    // 获取所有金币流水
    const allLogs = JSON.parse(localStorage.getItem('gold_logs') || '[]')

    // 过滤当前用户的流水
    let userLogs = allLogs.filter(log => log.userId === currentUserId.value)

    // 按类型筛选
    if (filterType.value) {
      userLogs = userLogs.filter(log => log.type === filterType.value)
    }

    // 按时间倒序排序
    userLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    logs.value = userLogs
  } catch (error) {
    console.error('加载失败:', error)
    logs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.gold-logs-container {
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

.gold-logs-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.balance-section {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 24px;
  color: white;
}

.balance-info {
  text-align: center;
  margin-bottom: 16px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
  display: block;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 48px;
  font-weight: 700;
}

.balance-stats {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
}

.stat-value.income {
  color: #86efac;
}

.stat-value.expense {
  color: #fca5a5;
}

.filter-section {
  margin-bottom: 20px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: transform 0.2s;
}

.log-item:hover {
  transform: translateX(4px);
  background: #f0f0f0;
}

.log-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  background: #e5e7eb;
}

.log-icon.income {
  background: #d1fae5;
}

.log-icon.expense {
  background: #fee2e2;
}

.log-content {
  flex: 1;
}

.log-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.log-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #999;
}

.log-amount {
  font-size: 20px;
  font-weight: 700;
  margin-left: 16px;
}

.log-amount.income {
  color: #059669;
}

.log-amount.expense {
  color: #dc2626;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}
</style>
