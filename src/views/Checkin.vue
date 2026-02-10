<template>
  <div class="checkin-container">
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
      <!-- 打卡卡片 -->
      <div class="checkin-card">
        <div class="checkin-header">
          <h2>每日签到</h2>
          <p class="subtitle">连续签到赢金币</p>
        </div>

        <!-- 签到按钮 -->
        <div class="checkin-action">
          <div class="streak-info">
            <span class="streak-count">{{ streak }}</span>
            <span class="streak-label">天连续签到</span>
          </div>
          <el-button
            v-if="!checkedToday"
            type="primary"
            size="large"
            @click="doCheckin"
            :loading="checking"
            class="checkin-btn"
          >
            {{ checking ? '签到中...' : '立即签到' }}
          </el-button>
          <el-button
            v-else
            size="large"
            disabled
            class="checked-btn"
          >
            ✓ 今日已签到
          </el-button>
        </div>

        <!-- 签到奖励说明 -->
        <div class="reward-tips">
          <div class="tip-item">
            <span class="reward-icon">🪙</span>
            <span>每日签到 +10 金币</span>
          </div>
          <div class="tip-item">
            <span class="reward-icon">🎁</span>
            <span>连续7天额外奖励 +50 金币</span>
          </div>
          <div class="tip-item">
            <span class="reward-icon">💎</span>
            <span>连续30天超级奖励 +200 金币</span>
          </div>
        </div>
      </div>

      <!-- 签到日历 -->
      <div class="calendar-card">
        <h3 class="calendar-title">签到日历</h3>
        <div class="calendar">
          <div class="calendar-header">
            <el-button @click="prevMonth" :disabled="!canGoPrev">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <span class="current-month">{{ currentMonthText }}</span>
            <el-button @click="nextMonth" :disabled="!canGoNext">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div class="calendar-weekdays">
            <span v-for="day in weekdays" :key="day" class="weekday">{{ day }}</span>
          </div>
          <div class="calendar-days">
            <span
              v-for="(day, index) in calendarDays"
              :key="index"
              :class="[
                'calendar-day',
                {
                  'is-empty': !day,
                  'is-checked': day && day.checked,
                  'is-today': day && day.isToday,
                  'is-future': day && day.isFuture
                }
              ]"
            >
              {{ day ? day.date : '' }}
              <span v-if="day && day.checked" class="check-mark">✓</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 签到记录 -->
      <div class="records-card">
        <h3 class="records-title">签到记录</h3>
        <div v-if="records.length === 0" class="empty-records">
          <p>还没有签到记录</p>
        </div>
        <div v-else class="records-list">
          <div
            v-for="record in records"
            :key="record._id"
            class="record-item"
          >
            <div class="record-date">{{ record.date }}</div>
            <div class="record-reward">+{{ record.reward }} 金币</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { addGoldLog, GoldLogTypes, GoldLogTitles } from '../utils/goldLog'

// 数据
const streak = ref(0) // 连续签到天数
const checkedToday = ref(false) // 今日是否已签到
const checking = ref(false) // 签到中
const currentMonth = ref(new Date()) // 当前查看的月份
const records = ref([]) // 签到记录

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 当前月份文本
const currentMonthText = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth() + 1
  return `${year}年${month}月`
})

// 是否可以往前翻
const canGoPrev = computed(() => {
  const now = new Date()
  const prev = new Date(currentMonth.value)
  prev.setMonth(prev.getMonth() - 1)
  return prev <= now
})

// 是否可以往后翻
const canGoNext = computed(() => {
  const now = new Date()
  return currentMonth.value < now
})

// 日历天数
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()

  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 获取第一天是星期几
  const firstDayOfWeek = firstDay.getDay()

  // 获取总天数
  const totalDays = lastDay.getDate()

  const days = []

  // 填充前面的空白
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }

  // 填充日期
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  for (let i = 1; i <= totalDays; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const dayDate = new Date(year, month, i)
    const isFuture = dayDate > now

    days.push({
      date: i,
      checked: isRecorded(dateStr),
      isToday,
      isFuture
    })
  }

  return days
})

// 检查是否有签到记录
const isRecorded = (dateStr) => {
  return records.value.some(r => r.date === dateStr)
}

// 签到
const doCheckin = async () => {
  if (checkedToday.value) return

  checking.value = true

  try {
    // 获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (!userInfo._id) {
      ElMessage.error('请先登录')
      checking.value = false
      return
    }

    // 模拟签到延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    // 检查今日是否已签到
    const existingRecord = records.value.find(r => r.date === dateStr)
    if (existingRecord) {
      checkedToday.value = true
      ElMessage.warning('今日已签到')
      checking.value = false
      return
    }

    // 计算奖励（基础10金币 + 连续签到奖励）
    let reward = 10
    const newStreak = streak.value + 1

    // 连续7天额外奖励50金币
    if (newStreak % 7 === 0) {
      reward += 50
    }
    // 连续30天超级奖励200金币
    if (newStreak % 30 === 0) {
      reward += 200
    }

    // 更新用户金币
    const currentCoins = userInfo.coins || 1000
    const newCoins = currentCoins + reward
    userInfo.coins = newCoins
    userInfo.checkInDays = newStreak
    localStorage.setItem('userInfo', JSON.stringify(userInfo))

    // 更新users数组中的金币
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    let userIndex = users.findIndex(u => u._id === userInfo._id)

    if (userIndex !== -1) {
      // 找到了，更新
      users[userIndex].coins = newCoins
      users[userIndex].checkInDays = newStreak
    } else {
      // ✅ 没找到，添加到 users 数组
      users.push({
        ...userInfo,
        coins: newCoins,
        checkInDays: newStreak
      })
      console.log('✅ 用户已添加到 users 数组')
    }

    localStorage.setItem('users', JSON.stringify(users))

    // 记录金币流水
    addGoldLog(
      userInfo._id,
      GoldLogTypes.INCOME,
      reward,
      GoldLogTitles.CHECKIN_REWARD,
      `连续签到${newStreak}天奖励`
    )

    // 保存签到记录
    const allCheckins = JSON.parse(localStorage.getItem('checkins') || '{}')
    if (!allCheckins[userInfo._id]) {
      allCheckins[userInfo._id] = []
    }
    allCheckins[userInfo._id].unshift({
      _id: Date.now().toString(),
      date: dateStr,
      reward: reward,
      streak: newStreak
    })
    localStorage.setItem('checkins', JSON.stringify(allCheckins))

    // 更新界面
    streak.value = newStreak
    checkedToday.value = true
    records.value.unshift({
      _id: Date.now(),
      date: dateStr,
      reward: reward
    })

    let rewardText = `签到成功！获得 ${reward} 金币`
    if (reward > 10) {
      rewardText += `（含连续签到奖励 ${reward - 10} 金币）`
    }
    ElMessage.success(rewardText)
  } catch (error) {
    console.error('签到失败:', error)
    ElMessage.error('签到失败，请重试')
  } finally {
    checking.value = false
  }
}

// 上个月
const prevMonth = () => {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() - 1)
  currentMonth.value = newMonth
}

// 下个月
const nextMonth = () => {
  const newMonth = new Date(currentMonth.value)
  newMonth.setMonth(newMonth.getMonth() + 1)
  if (newMonth <= new Date()) {
    currentMonth.value = newMonth
  }
}

// 加载签到数据
const loadCheckinData = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (!userInfo._id) {
      return
    }

    // 从 localStorage 获取签到记录
    const allCheckins = JSON.parse(localStorage.getItem('checkins') || '{}')
    const userCheckins = allCheckins[userInfo._id] || []

    records.value = userCheckins

    // 计算连续签到天数
    if (userCheckins.length > 0) {
      const latestStreak = userCheckins[0]?.streak || userCheckins.length
      streak.value = latestStreak
    } else {
      streak.value = 0
    }

    // 检查今日是否已签到
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    checkedToday.value = userCheckins.some(r => r.date === todayStr)
  } catch (error) {
    console.error('加载失败:', error)
  }
}

onMounted(() => {
  loadCheckinData()
})
</script>

<style scoped>
.checkin-container {
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
  max-width: 1200px;
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

.checkin-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  color: white;
  text-align: center;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.checkin-header h2 {
  font-size: 32px;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0 0 32px 0;
}

.checkin-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.streak-info {
  text-align: center;
}

.streak-count {
  display: block;
  font-size: 56px;
  font-weight: 700;
  line-height: 1;
}

.streak-label {
  font-size: 14px;
  opacity: 0.9;
}

.checkin-btn,
.checked-btn {
  width: 160px;
  height: 56px;
  font-size: 18px;
  border-radius: 28px;
}

.checked-btn {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.reward-tips {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.reward-icon {
  font-size: 20px;
}

.calendar-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.calendar {
  user-select: none;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.current-month {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 14px;
  color: #999;
  padding: 8px 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border-radius: 8px;
  position: relative;
  background: #f8f9fa;
  color: #666;
  transition: all 0.3s;
}

.calendar-day.is-empty {
  background: transparent;
}

.calendar-day.is-checked {
  background: #d1fae5;
  color: #059669;
  font-weight: 600;
}

.calendar-day.is-today {
  background: #0ea5e9;
  color: white;
  font-weight: 600;
}

.calendar-day.is-future {
  color: #ccc;
}

.check-mark {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
}

.records-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.records-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #999;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.record-date {
  font-size: 14px;
  color: #666;
}

.record-reward {
  font-size: 14px;
  font-weight: 600;
  color: #d97706;
}
</style>
