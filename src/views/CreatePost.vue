<template>
  <div class="create-post-container">
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

      <!-- 发帖区域 -->
      <div class="create-post-card">
        <!-- 帖子类型选择 -->
        <div class="type-selector-row">
          <el-radio-group v-model="postType" size="small">
            <el-radio-button :label="1">交流</el-radio-button>
            <el-radio-button :label="2">提问</el-radio-button>
            <el-radio-button :label="3">分享</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 内容输入 -->
        <el-input
          v-model="postContent"
          type="textarea"
          :rows="6"
          placeholder="分享你的想法、问题或经验..."
          maxlength="1000"
          show-word-limit
          class="content-input"
        />

        <!-- 图片上传 -->
        <div class="image-upload-section">
          <el-upload
            v-model:file-list="imageList"
            :auto-upload="false"
            list-type="picture-card"
            :limit="9"
            accept="image/*"
            class="image-uploader"
            :on-change="handleImageChange"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="$router.back()">取消</el-button>
          <el-button
            type="primary"
            @click="submitPost"
            :disabled="!postContent.trim()"
            :loading="submitting"
          >
            {{ submitting ? '发布中...' : '发布' }}
          </el-button>
        </div>
      </div>
    </main>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" title="图片预览" width="60%" center>
      <img :src="previewImageUrl" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'

const router = useRouter()

// 数据
const postType = ref(1) // 1-交流 2-提问 3-分享
const postContent = ref('')
const imageList = ref([])
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 状态
const submitting = ref(false)

// 获取当前用户
const getCurrentUser = () => {
  const userInfo = localStorage.getItem('userInfo')
  return userInfo ? JSON.parse(userInfo) : null
}

// 图片预览
const handlePreview = (file) => {
  previewImageUrl.value = file.url
  previewVisible.value = true
}

// 图片移除
const handleRemove = (file, fileList) => {
  imageList.value = fileList
}

// 图片选择变化
const handleImageChange = (file, fileList) => {
  // 压缩并转换为base64
  compressImage(file.raw, (compressedBase64) => {
    file.url = compressedBase64
    imageList.value = fileList
  })
}

// 压缩图片函数
const compressImage = (file, callback) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // 计算压缩后的尺寸（最大宽度800px）
      const maxWidth = 800
      const maxHeight = 800
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为base64，质量0.7
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7)
      callback(compressedBase64)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

// 提交帖子
const submitPost = async () => {
  if (!postContent.value.trim()) {
    ElMessage.warning('请输入帖子内容')
    return
  }

  const user = getCurrentUser()
  if (!user) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  submitting.value = true

  try {
    // 获取图片base64数据
    const images = imageList.value.map(file => file.url || file.response)

    // 创建新帖子
    const newPost = {
      _id: Date.now().toString(),
      userId: user._id,
      timestamp: Date.now(),
      userName: user.nickname || '我',
      userAvatar: user.avatar || '',
      content: postContent.value,
      type: postType.value,
      images: images,
      tags: extractTags(postContent.value),
      createdAt: Date.now(),
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      likedBy: [],
      viewedBy: [], // 记录浏览过的用户ID
      comments: []
    }

    // 使用 localStorage 保存帖子
    const posts = JSON.parse(localStorage.getItem('posts') || '[]')
    posts.unshift(newPost)

    // 检查localStorage是否已满
    try {
      localStorage.setItem('posts', JSON.stringify(posts))
    } catch (storageError) {
      if (storageError.name === 'QuotaExceededError') {
        ElMessage.error('存储空间已满，请减少图片数量或删除旧帖子')
        submitting.value = false
        return
      }
      throw storageError
    }

    // 更新用户统计数据
    user.postsCount = (user.postsCount || 0) + 1
    localStorage.setItem('userInfo', JSON.stringify(user))

    ElMessage.success('发布成功')
    router.push('/community')
  } catch (error) {
    console.error('发布失败:', error)
    ElMessage.error('发布失败：' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 提取话题标签
const extractTags = (content) => {
  const tagRegex = /#[\u4e00-\u9fa5a-zA-Z0-9_]+/g
  const matches = content.match(tagRegex)
  return matches || []
}
</script>

<style scoped>
.create-post-container {
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
  max-width: 1400px;
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

.create-post-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.type-selector-row {
  margin-bottom: 16px;
}

.content-input {
  margin-bottom: 16px;
}

.image-upload-section {
  margin-bottom: 16px;
}

.image-uploader {
  width: 100%;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
