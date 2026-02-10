<template>
  <div class="course-container">
    <AnnouncementBanner />
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 颜祖美学</h1>
        <div class="nav-links">
          <router-link to="/community" class="nav-link">社群</router-link>
          <router-link to="/course" class="nav-link">课程</router-link>
          <router-link to="/topic-square" class="nav-link">话题</router-link>
          <router-link to="/profile" class="nav-link">我的</router-link>
          <router-link to="/messages" class="nav-link">私信</router-link>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <h2 class="page-title">精品课程</h2>

      <!-- 课程列表 -->
      <div v-if="loading" class="loading">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else-if="courses.length === 0" class="empty">
        <p>暂无课程</p>
      </div>

      <div v-else class="course-list">
        <div
          v-for="course in courses"
          :key="course._id"
          class="course-card"
          @click="goToDetail(course._id)"
        >
          <div class="course-cover">
            <img :src="course.cover || '/default-cover.png'" :alt="course.title" />
            <div v-if="course.isFree" class="free-badge">免费</div>
            <div v-else-if="course.price > 0" class="price-badge">🪙 {{ course.price }}</div>
          </div>
          <div class="course-info">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-desc">{{ course.description }}</p>
            <div class="course-meta">
              <span class="meta-item">👁 {{ course.viewCount || 0 }}</span>
              <span class="meta-item">⏱ {{ formatDuration(course.duration) }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AnnouncementBanner from '../components/AnnouncementBanner.vue'

const router = useRouter()
const courses = ref([])
const loading = ref(true)

// 加载课程列表
const loadCourses = async () => {
  loading.value = true
  try {
    // 从 localStorage 读取课程数据（由管理员添加）
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]')
    courses.value = allCourses
  } catch (error) {
    console.error('加载失败:', error)
    courses.value = []
  } finally {
    loading.value = false
  }
}

// 格式化时长
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}分钟`
}

// 查看详情
const goToDetail = (courseId) => {
  router.push(`/course/${courseId}`)
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.course-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
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

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.course-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(241, 245, 249, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.course-cover {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.course-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.free-badge,
.price-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
}

.free-badge {
  background: #d1fae5;
  color: #059669;
}

.price-badge {
  background: #fef3c7;
  color: #d97706;
}

.course-info {
  padding: 16px;
}

.course-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.loading,
.empty {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.loading p,
.empty p {
  font-size: 16px;
}

.empty-icon {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 背景装饰 */
.course-container::before {
  content: '';
  position: fixed;
  top: -30%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.course-container::after {
  content: '';
  position: fixed;
  bottom: -20%;
  left: -5%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
</style>
