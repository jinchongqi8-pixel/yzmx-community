<template>
  <div class="profile-container">
    <AnnouncementBanner />
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-content">
        <h1 class="logo">📚 梦祖美学</h1>
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
      </div>

      <!-- 管理员入口 -->
      <div v-if="userInfo?.isAdmin && canBeAdmin" style="margin-top: 12px; padding: 12px; border-top: 1px solid #ddd;">
        <input
          v-model="adminCode"
          type="text"
          placeholder="输入管理员验证码"
          style="padding: 8px; margin-right: 8px; border: 1px solid #ccc; border-radius: 4px;"
        />
        <button @click="verifyAndSetAdmin" style="padding: 8px 16px; background: #0ea5e9; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔓 验证并设置为管理员
        </button>
        <p style="margin: 8px 0 0; font-size: 12px; color: #666;">提示：验证码是 admin123</p>
      </div>

      <!-- 用户信息 -->
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
              📅 签到
            </el-button>
            <el-button v-if="userInfo.id" @click="logout" type="danger" plain>退出登录</el-button>
            <el-button v-else @click="router.push('/login')" type="primary" plain>去登录</el-button>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
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
        <div v-if="userInfo?.isAdmin" class="menu-item admin-entry" @click="router.push('/admin')">
          <span class="menu-icon">🛡️</span>
          <span class="menu-text">管理员后台</span>
          <el-icon class="menu-arrow"><ArrowRight /></el-icon>
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
import { supabase } from '../supabase/client'
import AnnouncementBanner from '../components/AnnouncementBanner.vue'

const router = useRouter()
const userInfo = ref(null)
const adminCode = ref('')

// 管理员验证码
const ADMIN_SECRET_CODE = 'admin123'

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

// 从 Supabase 获取当前用户信息
const loadUserInfo = () => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) {
      // 未登录
      userInfo.value = null
      debugInfo.value.userId = '未登录'
      debugInfo.value.nickname = '未登录'
      return
    }

    // 从 profiles 表获取用户详细信息
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data: profile }) => {
        if (profile) {
          userInfo.value = profile
          debugInfo.value.userId = profile.id || '无ID'
          debugInfo.value.nickname = profile.nickname || '无昵称'
          debugInfo.value.totalPosts = 0  // TODO: 从数据库获取
          debugInfo.value.myPostsCount = 0  // TODO: 从数据库获取
          debugInfo.value.calculatedCount = 0  // TODO: 从数据库获取
        } else {
          // 用户不存在，创建一个
          const nickname = '用户' + user.id?.substr(-4) || ''
          supabase
            .from('profiles')
            .insert({
              id: user.id,
              nickname: nickname,
              gold_count: 100
            })
            .then(({ data }) => {
              const newProfile = {
                id: user.id,
                nickname: nickname,
                gold_count: 100
              }
              userInfo.value = newProfile
              debugInfo.value.userId = user.id
              debugInfo.value.nickname = nickname
            })
        }
      })
  .catch((error) => {
    console.error('获取用户信息失败:', error)
  })
}

// 验证并设置为管理员
const verifyAndSetAdmin = () => {
  if (adminCode.value !== ADMIN_SECRET_CODE) {
    ElMessage.error('验证码错误')
    return
  }

  const updateProfile = await supabase
    .from('profiles')
    .update({ isAdmin: true })
    .eq('id', userInfo.value.id)

  if (updateProfile.error) {
    ElMessage.error('设置失败')
  } else {
    ElMessage.success('已设置为管理员')
    userInfo.value.isAdmin = true
  }
}

// 跳转到粉丝列表
const goToFollowers = () => {
  router.push('/user/' + userInfo.value.id + '/followers')
}

// 跳转到关注列表
const goToFollowing = () => {
  router.push('/user/' + userInfo.value.id + '/following')
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
    supabase.auth.signOut()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid #e5e7eb;
}

.nav-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  text-decoration: none;
  color: #64748b;
  font-size: 14px;
  transition: all 0.2s;
  padding: 6px 12px;
  border-radius: 8px;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #8b5cf6;
  background: #f1f5f9;
}

.main-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.debug-info {
  background: #fff3cd;
  padding: 16px;
  margin-bottom: 20px;
  border-radius: 8px;
  font-size: 14px;
}

.profile-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.user-header {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f1f5f9;
}

.user-info {
  flex: 1;
}

.name-with-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.inline-stats {
  display: flex;
  gap: 16px;
}

.inline-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.inline-stat:hover {
  background: #f1f5f9;
}

.stat-number-small {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.stat-label-small {
  font-size: 12px;
  color: #64748b;
}

.user-bio {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 8px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f8fafc;
  transform: translateX(4px);
}

.menu-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #334155;
}

.menu-arrow {
  color: #9ca3af;
}

/* 响应式 */
@media (max-width: 768px) {
  .nav-links {
    gap: 4px;
  }

  .nav-link {
    padding: 4px 8px;
    font-size: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .avatar {
    width: 60px;
    height: 60px;
  }

  .user-name {
    font-size: 20px;
  }

  .name-with-stats {
    flex-direction: column;
  }
}
</style>
