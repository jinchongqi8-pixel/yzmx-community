<template>
  <div class="edit-profile-container">
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

      <div class="edit-card">
        <h2 class="page-title">编辑资料</h2>

        <el-form :model="form" label-width="100px" class="edit-form">
          <!-- 头像 -->
          <el-form-item label="头像">
            <div class="avatar-upload">
              <img :src="form.avatar || defaultAvatar" class="avatar-preview" />
              <el-button size="small" @click="triggerFileInput">
                上传头像
              </el-button>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileChange"
              />
            </div>
            <div class="upload-tip">建议上传正方形图片，大小不超过2MB</div>
          </el-form-item>

          <!-- 昵称 -->
          <el-form-item label="昵称">
            <el-input
              v-model="form.nickname"
              placeholder="请输入昵称"
              maxlength="20"
              show-word-limit
            />
          </el-form-item>

          <!-- 简介 -->
          <el-form-item label="个人简介">
            <el-input
              v-model="form.bio"
              type="textarea"
              :rows="4"
              placeholder="介绍一下自己..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>

          <!-- 性别 -->
          <el-form-item label="性别">
            <el-radio-group v-model="form.gender">
              <el-radio label="男">男</el-radio>
              <el-radio label="女">女</el-radio>
              <el-radio label="保密">保密</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 地区 -->
          <el-form-item label="地区">
            <el-input
              v-model="form.location"
              placeholder="请输入所在地"
            />
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item>
            <el-button type="primary" @click="saveProfile" :loading="saving">
              保存
            </el-button>
            <el-button @click="$router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { updateUserProfile } from '../api/cloud'

const router = useRouter()
const saving = ref(false)
const defaultAvatar = '/default-avatar.png'
const fileInputRef = ref(null)

// 表单数据
const form = reactive({
  avatar: '',
  nickname: '',
  bio: '',
  gender: '保密',
  location: ''
})

// 获取当前用户ID
const getCurrentUserId = () => {
  return localStorage.getItem('devUserId') || ''
}

// 加载用户信息
const loadUserInfo = async () => {
  const userId = getCurrentUserId()
  if (!userId) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 从 localStorage 读取基本信息
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  Object.assign(form, {
    avatar: userInfo.avatar || '',
    nickname: userInfo.nickname || '',
    bio: userInfo.bio || '',
    gender: userInfo.gender || '保密',
    location: userInfo.location || ''
  })
}

// 触发文件选择
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
    return
  }

  // 检查文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过2MB')
    return
  }

  // 读取文件并转换为base64
  const reader = new FileReader()
  reader.onload = (e) => {
    form.avatar = e.target.result
    ElMessage.success('头像已选择，请点击保存按钮保存')
  }
  reader.onerror = () => {
    ElMessage.error('图片读取失败')
  }
  reader.readAsDataURL(file)
}

// 保存资料
const saveProfile = async () => {
  if (!form.nickname.trim()) {
    ElMessage.warning('请输入昵称')
    return
  }

  saving.value = true

  try {
    // 调用 Supabase API 更新用户资料
    const res = await updateUserProfile({
      nickname: form.nickname,
      bio: form.bio,
      avatar: form.avatar,
      gender: form.gender,
      location: form.location
    })

    if (res.code === 0) {
      // 更新本地存储
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
      const updatedUserInfo = {
        ...userInfo,
        ...form
      }
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))

      ElMessage.success('保存成功')
      router.back()
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.edit-profile-container {
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

.edit-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 32px 0;
}

.edit-form {
  max-width: 500px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e5e7eb;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}
</style>
