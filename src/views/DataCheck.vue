<template>
  <div class="data-check-container">
    <div class="header">
      <h1>🔍 帖子数据检查</h1>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-number">{{ posts.length }}</div>
        <div class="stat-label">帖子总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ problemCount }}</div>
        <div class="stat-label">有问题</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ okCount }}</div>
        <div class="stat-label">正常</div>
      </div>
    </div>

    <div class="actions">
      <el-button type="primary" @click="showDetails">📊 显示详情</el-button>
      <el-button type="success" @click="fixAll">🔧 一键修复</el-button>
    </div>

    <div class="posts-list" v-if="details.length > 0">
      <div
        v-for="(item, index) in details"
        :key="index"
        class="post-card"
        :class="{ problem: item.hasProblem, ok: !item.hasProblem }"
      >
        <div class="post-header">
          <strong>#{{ item.index + 1 }} {{ item.hasProblem ? '❌ 有问题' : '✅ 正常' }}</strong>
        </div>
        <div class="post-detail">
          <span class="label">帖子ID:</span>
          <span class="value">{{ item._id }}</span>
        </div>
        <div class="post-detail">
          <span class="label">内容:</span>
          <span class="value">{{ item.content }}</span>
        </div>
        <div class="post-detail">
          <span class="label">createdAt:</span>
          <span class="value">{{ item.createdAt }}</span>
        </div>
        <div class="post-detail">
          <span class="label">类型:</span>
          <span class="value">{{ item.createdAtType }}</span>
        </div>
        <div class="post-detail">
          <span class="label">timestamp:</span>
          <span class="value">{{ item.timestamp }}</span>
        </div>
        <div v-if="item.hasProblem" class="problem-text">
          ⚠️ {{ item.problem }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const posts = ref([])
const details = ref([])

const problemCount = computed(() => details.value.filter(d => d.hasProblem).length)
const okCount = computed(() => details.value.filter(d => !d.hasProblem).length)

const showDetails = () => {
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  posts.value = allPosts

  details.value = allPosts.map((post, index) => {
    const hasProblem = !post.createdAt ||
                      post.createdAt === '刚刚' ||
                      typeof post.createdAt === 'string' ||
                      isNaN(new Date(post.createdAt).getTime())

    let problem = ''
    if (hasProblem) {
      if (!post.createdAt) {
        problem = 'createdAt为空'
      } else if (post.createdAt === '刚刚') {
        problem = 'createdAt是字符串"刚刚"'
      } else if (typeof post.createdAt === 'string') {
        problem = 'createdAt是字符串类型'
      } else {
        problem = '时间格式无效'
      }
    }

    return {
      index: index,
      _id: post._id,
      content: post.content?.substring(0, 40) + '...',
      createdAt: post.createdAt,
      createdAtType: typeof post.createdAt,
      timestamp: post.timestamp,
      hasProblem: hasProblem,
      problem: problem
    }
  })
}

const fixAll = () => {
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const now = Date.now()
  let fixedCount = 0

  allPosts.forEach((post, index) => {
    if (!post.createdAt ||
        post.createdAt === '刚刚' ||
        typeof post.createdAt === 'string' ||
        isNaN(new Date(post.createdAt).getTime())) {

      let newTime = null

      // 方法1: 使用 timestamp
      if (post.timestamp && typeof post.timestamp === 'number') {
        newTime = post.timestamp
      }
      // 方法2: 从 ID 提取
      else if (post._id) {
        const idNum = parseInt(post._id)
        if (!isNaN(idNum) && idNum > 1000000000000 && idNum < now) {
          newTime = idNum
        }
      }
      // 方法3: 推算时间
      else {
        newTime = now - (index * 60000)
      }

      post.createdAt = newTime
      post.timestamp = newTime
      fixedCount++
    } else {
      // 确保是数字类型
      if (typeof post.createdAt === 'string') {
        post.createdAt = parseInt(post.createdAt)
        fixedCount++
      }
      if (!post.timestamp || typeof post.timestamp === 'string') {
        post.timestamp = post.createdAt
      }
    }
  })

  // 排序
  allPosts.sort((a, b) => {
    const timeA = a.createdAt || a.timestamp || 0
    const timeB = b.createdAt || b.timestamp || 0
    return timeB - timeA
  })

  localStorage.setItem('posts', JSON.stringify(allPosts))

  alert(`✅ 修复完成！\n修复了 ${fixedCount} 个帖子\n请刷新社群页面查看`)
  showDetails()
}
</script>

<style scoped>
.data-check-container {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  color: #333;
}

.stats {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #0ea5e9;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.actions {
  margin-bottom: 20px;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-card {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ddd;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.post-card.problem {
  border-left-color: #ef4444;
  background: #fee2e2;
}

.post-card.ok {
  border-left-color: #10b981;
  background: #d1fae5;
}

.post-header {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 16px;
}

.post-detail {
  font-size: 13px;
  margin: 6px 0;
  font-family: monospace;
}

.label {
  color: #666;
  margin-right: 8px;
}

.value {
  color: #333;
  font-weight: 600;
}

.problem-text {
  color: #dc2626;
  font-weight: 600;
  margin-top: 8px;
}
</style>
