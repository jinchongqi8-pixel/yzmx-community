<template>
  <div class="profile-container">
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
      <!-- 调试信息 -->
      <div class="debug-info" style="background: #fff3cd; padding: 16px; margin-bottom: 20px; border-radius: 8px; font-size: 14px;">
        <strong>🔍 调试信息：</strong><br>
        用户ID: {{ debugInfo.userId }}<br>
        用户昵称: {{ debugInfo.nickname }}<br>
        所有帖子数: {{ debugInfo.totalPosts }}<br>
        我的帖子数: {{ debugInfo.myPostsCount }}<br>
        计算后帖子数: {{ debugInfo.calculatedCount }}<br>
        总获赞数: {{ userInfo?.likesCount || 0 }}<br>
        <strong>管理员状态: {{ userInfo?.isAdmin ? '✅ 是管理员' : '❌ 不是管理员' }}</strong><br>
        <div v-if="!userInfo?.isAdmin && canBeAdmin" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd;">
          <input
            v-model="adminCode"
            type="text"
            placeholder="输入管理员验证码"
            style="padding: 8px; margin-right: 8px; border: 1px solid #ccc; border-radius: 4px;"
          />
          <button @click="verifyAndSetAdmin" style="padding: 8px 16px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer;">
            🔓 验证并设置为管理员
          </button>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">提示：验证码是 admin123</p>
        </div>
      </div>

      <div v-if="userInfo" class="profile-card">
        <div class="user-header">
          <img :src="userInfo.avatar || '/default-avatar.png'" class="avatar" />
          <div class="user-info">
            <div class="name-with-stats">
              <h2 class="user-name">{{ userInfo.nickname }}</h2>
              <div class="inline-stats">
                <span class="inline-stat" @click="goToFollowers">
                  <span class="stat-number-small">{{ userInfo.followersCount || 0 }}</span>
                  <span class="stat-label-small">粉丝</span>
                </span>
                <span class="inline-stat" @click="goToFollowing">
                  <span class="stat-number-small">{{ userInfo.followingCount || 0 }}</span>
                  <span class="stat-label-small">关注</span>
                </span>
              </div>
            </div>
            <p class="user-bio">Lv{{ userInfo.level || 1 }} | {{ userInfo.coins || 0 }} 金币</p>
          </div>
          <div class="header-actions">
            <el-button @click="router.push('/checkin')" type="warning" plain>
              每日签到
            </el-button>
            <el-button v-if="userInfo._id" @click="logout" type="danger" plain>退出登录</el-button>
            <el-button v-else @click="router.push('/login')" type="primary" plain>去登录</el-button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item clickable" @click="router.push('/my/posts')">
            <div class="stat-number">{{ userInfo.postsCount || 0 }}</div>
            <div class="stat-label">帖子</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userInfo.likesCount || 0 }}</div>
            <div class="stat-label">获赞</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userInfo.checkInDays || 0 }}</div>
            <div class="stat-label">打卡天数</div>
          </div>
          <div class="stat-item clickable" @click="router.push('/gold/logs')">
            <div class="stat-number">{{ userInfo.coins || 0 }}</div>
            <div class="stat-label">金币</div>
          </div>
        </div>

        <!-- 功能菜单 -->
        <div class="menu-section">
          <div class="menu-item" @click="router.push('/my/posts')">
            <span class="menu-icon">📝</span>
            <span class="menu-text">我的帖子</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/collections')">
            <span class="menu-icon">⭐</span>
            <span class="menu-text">我的收藏</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/topic-square')">
            <span class="menu-icon">#️⃣</span>
            <span class="menu-text">话题广场</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/leaderboard')">
            <span class="menu-icon">🏆</span>
            <span class="menu-text">排行榜</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="goToFollowers">
            <span class="menu-icon">👥</span>
            <span class="menu-text">我的粉丝</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="goToFollowing">
            <span class="menu-icon">➕</span>
            <span class="menu-text">我的关注</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/messages')">
            <span class="menu-icon">💬</span>
            <span class="menu-text">私信</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/history')">
            <span class="menu-icon">🕐</span>
            <span class="menu-text">浏览历史</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/notification')">
            <span class="menu-icon">🔔</span>
            <span class="menu-text">消息通知</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <div class="menu-item" @click="router.push('/profile/edit')">
            <span class="menu-icon">✏️</span>
            <span class="menu-text">编辑资料</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
          <!-- 管理员入口 -->
          <div v-if="userInfo.isAdmin" class="menu-item admin-entry" @click="router.push('/admin')">
            <span class="menu-icon">🛡️</span>
            <span class="menu-text">管理员后台</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import AnnouncementBanner from '../components/AnnouncementBanner.vue'
import { supabase, TABLES } from '../supabase/client'

const router = useRouter()
const userInfo = ref(null)
const adminCode = ref('')

// 管理员验证码
const ADMIN_SECRET_CODE = 'admin123'

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 检查当前用户是否可以成为管理员（例如特定手机号）
const canBeAdmin = computed(() => {
  if (!userInfo.value) return false
  // 只有手机号为 13800138000 的用户才能看到设置按钮
  return userInfo.value.phone === '13800138000'
})

// 调试信息
const debugInfo = ref({
  userId: '',
  nickname: '',
  totalPosts: 0,
  myPostsCount: 0,
  calculatedCount: 0
})

// 加载用户信息
const loadUserInfo = async () => {
  const userId = getCurrentUserId()

  if (!userId) {
    // 如果没有用户信息，设置默认值
    userInfo.value = {
      nickname: '未登录',
      avatar: '',
      coins: 0,
      level: 1,
      postsCount: 0,
      likesCount: 0,
      checkInDays: 0
    }
    return
  }

  try {
    // 从 Supabase 获取用户 profile
    const { data: profile } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      userInfo.value = {
        nickname: '未登录',
        avatar: '',
        coins: 0,
        level: 1,
        postsCount: 0,
        likesCount: 0,
        checkInDays: 0
      }
      return
    }

    // 获取用户的帖子数量
    const { data: posts, count } = await supabase
      .from(TABLES.POSTS)
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)

    // 计算总点赞数
    const { data: userPosts } = await supabase
      .from(TABLES.POSTS)
      .select('like_count')
      .eq('author_id', userId)

    const totalLikes = (userPosts || []).reduce((sum, post) => {
      return sum + (post.like_count || 0)
    }, 0)

    // 计算粉丝和关注数量
    const { count: followersCount } = await supabase
      .from(TABLES.FOLLOWS)
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    const { count: followingCount } = await supabase
      .from(TABLES.FOLLOWS)
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    // 更新用户信息
    userInfo.value = {
      _id: profile.id,
      nickname: profile.nickname || '未命名',
      phone: profile.phone,
      avatar: profile.avatar || '',
      coins: profile.gold_count || 0,
      level: profile.level || 1,
      postsCount: count || 0,
      likesCount: totalLikes || 0,
      checkInDays: profile.check_in_days || 0,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
      isAdmin: profile.is_admin || false
    }

    // 更新调试信息
    debugInfo.value.userId = userId
    debugInfo.value.nickname = profile.nickname || '无昵称'
    debugInfo.value.totalPosts = count || 0
    debugInfo.value.myPostsCount = count || 0
    debugInfo.value.calculatedCount = count || 0

    // 同步到 localStorage
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  } catch (error) {
    console.error('加载用户信息失败:', error)
  }
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

// 验证并设置为管理员
const verifyAndSetAdmin = () => {
  if (adminCode.value !== ADMIN_SECRET_CODE) {
    ElMessage.error('验证码错误！')
    adminCode.value = ''
    return
  }

  if (userInfo.value) {
    userInfo.value.isAdmin = true
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    ElMessage.success('验证成功！已设置为管理员')
  }
}

// 跳转到粉丝列表
const goToFollowers = () => {
  if (!userInfo.value || !userInfo.value._id) {
    ElMessage.warning('请先登录')
    return
  }
  router.push(`/user/${userInfo.value._id}/followers`)
}

// 跳转到关注列表
const goToFollowing = () => {
  if (!userInfo.value || !userInfo.value._id) {
    ElMessage.warning('请先登录')
    return
  }
  router.push(`/user/${userInfo.value._id}/following`)
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
  position: relative;
}

/* 背景装饰 */
.profile-container::before {
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

.profile-container::after {
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
  max-width: 1200px;
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
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}

.profile-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.profile-card:hover {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.12);
  transform: translateY(-2px);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-right: 20px;
  border: 3px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #8b5cf6, #ec4899) border-box;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.avatar::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #ec4899, #f43f5e);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
  filter: blur(8px);
}

.avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.avatar:hover::after {
  opacity: 0.6;
}

.user-info {
  flex: 1;
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
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.inline-stat:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(236, 72, 153, 0.08));
  transform: translateY(-2px);
}

.stat-number-small {
  font-size: 14px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label-small {
  font-size: 12px;
  color: #94a3b8;
}

.user-bio {
  font-size: 15px;
  color: #64748b;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
  border-radius: 16px;
  border: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-item:hover::before {
  opacity: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.3);
}

.menu-section {
  margin-top: 24px;
  background: white;
  border-radius: 16px;
  padding: 12px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1));
  transition: width 0.3s ease;
}

.menu-item:hover::before {
  width: 4px;
}

.menu-item:hover {
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05), transparent);
  transform: translateX(4px);
}

.menu-icon {
  font-size: 20px;
  margin-right: 12px;
  position: relative;
  z-index: 1;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #334155;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.menu-arrow {
  color: #cbd5e1;
  transition: all 0.3s ease;
}

.menu-item:hover .menu-arrow {
  color: #8b5cf6;
  transform: translateX(4px);
}

.admin-entry {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  border-radius: 12px;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
}

.admin-entry::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.admin-entry:hover::before {
  transform: translateX(100%);
}

.admin-entry .menu-text {
  color: white;
  font-weight: 700;
}

.admin-entry .menu-icon {
  font-size: 24px;
}

.admin-entry:hover {
  opacity: 0.95;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
}

.loading {
  padding: 40px;
}
</style>
