<template>
  <div class="course-detail-container">
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
    <main class="main-content" v-if="course">
      <el-button @click="$router.back()" class="back-btn">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>

      <div class="course-header">
        <img :src="course.cover || '/default-cover.png'" class="course-cover" />
        <div class="course-info">
          <h1 class="course-title">{{ course.title }}</h1>
          <p class="course-desc">{{ course.description }}</p>
          <div class="course-meta">
            <span v-if="course.isFree" class="free-tag">免费</span>
            <span v-else-if="course.price > 0" class="price-tag">🪙 {{ course.price }} 金币</span>
            <span class="view-count">👁 {{ course.viewCount || 0 }} 次观看</span>
            <span class="duration">⏱ {{ course.duration || '未知' }}</span>
          </div>

          <!-- 用户金币余额 -->
          <div v-if="!course.isFree && !course.hasPurchased" class="user-gold">
            <span>我的金币：🪙 {{ userGold }}</span>
            <span v-if="!canAfford" class="insufficient-tip">
              (还差 {{ course.price - userGold }} 金币)
            </span>
          </div>
          <el-button
            v-if="!hasPermission"
            type="primary"
            size="large"
            @click="buyCourse"
            class="buy-btn"
          >
            {{ course.isFree ? '免费领取' : `购买 (${course.price} 金币)` }}
          </el-button>
          <el-button
            v-else
            type="success"
            size="large"
            @click="playVideo"
            class="play-btn"
          >
            开始学习
          </el-button>
        </div>
      </div>

      <div class="video-player" v-if="hasPermission">
        <video
          ref="videoRef"
          :src="course.videoUrl"
          controls
          class="video"
          @play="onPlay"
          @pause="onPause"
          @timeupdate="onTimeUpdate"
          @ended="onEnded"
        ></video>

        <!-- 学习进度 -->
        <div class="progress-section">
          <div class="progress-info">
            <span class="progress-label">学习进度</span>
            <span class="progress-value">{{ videoProgress }}%</span>
          </div>
          <el-progress :percentage="videoProgress" :stroke-width="8" />
        </div>
      </div>

      <div v-else class="locked">
        <el-icon class="lock-icon"><Lock /></el-icon>
        <p>购买后即可观看完整视频</p>
      </div>
    </main>

    <div v-else class="loading">
      <el-skeleton :rows="5" animated />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Lock } from '@element-plus/icons-vue'
import { addGoldLog, GoldLogTypes, GoldLogTitles } from '../utils/goldLog'

const route = useRoute()
const router = useRouter()
const course = ref(null)
const userGold = ref(0) // 从localStorage读取
const videoProgress = ref(0) // 视频播放进度
const isPlaying = ref(false) // 是否正在播放
const currentUserId = ref(null) // 当前用户ID

// 视频播放器引用
const videoRef = ref(null)

// 是否有观看权限
const hasPermission = computed(() => {
  if (!course.value) return false
  return course.value.isFree || course.value.hasPurchased
})

// 是否有足够金币购买
const canAfford = computed(() => {
  if (!course.value) return false
  return course.value.isFree || userGold.value >= course.value.price
})

// 加载用户信息和金币
const loadUserInfo = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  currentUserId.value = userInfo._id
  userGold.value = userInfo.coins || 1000
}

// 检查用户是否已购买课程
const checkUserCourse = (courseId) => {
  if (!currentUserId.value) return false

  try {
    const userCourses = JSON.parse(localStorage.getItem('user_courses') || '{}')
    const userCourseList = userCourses[currentUserId.value] || []
    return userCourseList.includes(courseId)
  } catch (error) {
    console.error('检查购买记录失败:', error)
    return false
  }
}

// 加载课程详情
const loadCourseDetail = async () => {
  try {
    // 1. 加载用户信息
    loadUserInfo()

    // 2. 从localStorage读取课程数据
    const courses = JSON.parse(localStorage.getItem('courses') || '[]')
    const courseData = courses.find(c => c._id === route.params.id)

    if (!courseData) {
      ElMessage.error('课程不存在')
      router.back()
      return
    }

    // 3. 检查用户是否已购买
    const hasPurchased = checkUserCourse(courseData._id)

    // 4. 设置课程数据
    course.value = {
      ...courseData,
      hasPurchased: hasPurchased,
      duration: courseData.duration ? `${courseData.duration}分钟` : '未知'
    }

    // 5. 增加观看次数
    if (courseData) {
      const index = courses.findIndex(c => c._id === route.params.id)
      if (index !== -1) {
        courses[index].viewCount = (courses[index].viewCount || 0) + 1
        localStorage.setItem('courses', JSON.stringify(courses))
      }
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  }
}

// 购买课程
const buyCourse = async () => {
  if (!currentUserId.value) {
    ElMessage.error('请先登录')
    router.push('/login')
    return
  }

  if (course.value.isFree) {
    // 免费课程直接领取
    saveUserCourse(course.value._id)
    course.value.hasPurchased = true
    ElMessage.success('领取成功！')
    return
  }

  if (!canAfford.value) {
    ElMessage.error(`金币不足，还需要 ${course.value.price - userGold.value} 金币`)
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定花费 ${course.value.price} 金币购买此课程吗？`,
      '购买确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 1. 扣除用户金币
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const oldGold = userInfo.coins || 1000
    const newGold = oldGold - course.value.price
    userInfo.coins = newGold
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    userGold.value = newGold

    // 2. 更新users数组中的金币
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const userIndex = users.findIndex(u => u._id === currentUserId.value)
    if (userIndex !== -1) {
      users[userIndex].coins = newGold
      localStorage.setItem('users', JSON.stringify(users))
    }

    // 3. 保存购买记录
    saveUserCourse(course.value._id)

    // 4. 记录金币流水
    addGoldLog(
      currentUserId.value,
      GoldLogTypes.EXPENSE,
      course.value.price,
      GoldLogTitles.BUY_COURSE,
      `购买课程：${course.value.title}`
    )

    // 5. 更新课程状态
    course.value.hasPurchased = true

    ElMessage.success('购买成功！开始学习吧')
  } catch (error) {
    // 用户取消
  }
}

// 保存用户购买的课程
const saveUserCourse = (courseId) => {
  try {
    const userCourses = JSON.parse(localStorage.getItem('user_courses') || '{}')

    if (!userCourses[currentUserId.value]) {
      userCourses[currentUserId.value] = []
    }

    if (!userCourses[currentUserId.value].includes(courseId)) {
      userCourses[currentUserId.value].push(courseId)
      localStorage.setItem('user_courses', JSON.stringify(userCourses))
    }
  } catch (error) {
    console.error('保存购买记录失败:', error)
  }
}

// 视频播放事件
const onPlay = () => {
  isPlaying.value = true
}

// 视频暂停事件
const onPause = () => {
  isPlaying.value = false
}

// 视频时间更新
const onTimeUpdate = (event) => {
  if (videoRef.value) {
    const percent = (videoRef.value.currentTime / videoRef.value.duration) * 100
    videoProgress.value = Math.round(percent)
  }
}

// 视频播放结束
const onEnded = () => {
  isPlaying.value = false
  ElMessage.success('恭喜！课程学习完成')
}

// 播放视频
const playVideo = () => {
  if (videoRef.value) {
    videoRef.value.play()
  } else {
    ElMessage.warning('视频资源未找到')
  }
}

onMounted(() => {
  loadCourseDetail()
})
</script>

<style scoped>
.course-detail-container {
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
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.back-btn {
  margin-bottom: 20px;
}

.course-header {
  background: white;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  gap: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.course-cover {
  width: 400px;
  height: 225px;
  object-fit: cover;
  border-radius: 12px;
}

.course-info {
  flex: 1;
}

.course-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.course-desc {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.course-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.free-tag,
.price-tag,
.view-count,
.duration {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.free-tag {
  background: #d1fae5;
  color: #059669;
}

.price-tag {
  background: #fef3c7;
  color: #d97706;
}

.view-count,
.duration {
  background: #f3f4f6;
  color: #666;
}

.user-gold {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.insufficient-tip {
  color: #ef4444;
  margin-left: 8px;
}

.buy-btn,
.play-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
}

.video-player {
  background: white;
  border-radius: 16px;
  padding: 32px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.video {
  width: 100%;
  border-radius: 12px;
  background: #000;
}

.progress-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-value {
  font-size: 14px;
  font-weight: 600;
  color: #0ea5e9;
}

.locked {
  background: white;
  border-radius: 16px;
  padding: 80px 32px;
  margin-top: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.lock-icon {
  font-size: 64px;
  color: #ccc;
  margin-bottom: 16px;
}

.locked p {
  font-size: 16px;
  color: #999;
}

.loading {
  padding: 40px;
}
</style>
