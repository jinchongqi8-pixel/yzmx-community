<template>
  <div class="edit-post-container">
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

      <!-- 编辑卡片 -->
      <div class="edit-card">
        <h2 class="page-title">编辑帖子</h2>

        <el-form label-width="100px" class="edit-form">
          <!-- 帖子类型 -->
          <el-form-item label="帖子类型">
            <el-radio-group v-model="form.type">
              <el-radio-button :label="1">交流</el-radio-button>
              <el-radio-button :label="2">提问</el-radio-button>
              <el-radio-button :label="3">分享</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 内容 -->
          <el-form-item label="帖子内容">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="8"
              placeholder="编辑你的内容..."
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>

          <!-- 图片 -->
          <el-form-item label="图片">
            <el-upload
              v-model:file-list="imageList"
              :auto-upload="false"
              list-type="picture-card"
              :limit="9"
              accept="image/*"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">最多上传9张图片</div>
          </el-form-item>

          <!-- 操作按钮 -->
          <el-form-item>
            <el-button type="primary" @click="savePost" :loading="saving">
              保存修改
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const imageList = ref([])

// 表单数据
const form = reactive({
  type: 1,
  content: '',
  images: []
})

// 加载帖子数据
const loadPostData = () => {
  const postId = route.params.id

  // TODO: 调用云函数获取帖子详情
  // 从 localStorage 读取
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const post = allPosts.find(p => p._id === postId)

  if (post) {
    form.type = post.type || 1
    form.content = post.content || ''
    form.images = post.images || []
  } else {
    ElMessage.error('帖子不存在')
    router.back()
  }
}

// 保存修改
const savePost = async () => {
  if (!form.content.trim()) {
    ElMessage.warning('请输入帖子内容')
    return
  }

  saving.value = true

  try {
    // TODO: 调用云函数保存修改
    // 更新 localStorage
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const postIndex = allPosts.findIndex(p => p._id === route.params.id)

    if (postIndex !== -1) {
      allPosts[postIndex].type = form.type
      allPosts[postIndex].content = form.content
      allPosts[postIndex].images = form.images
      allPosts[postIndex].editedAt = new Date().toISOString()

      localStorage.setItem('posts', JSON.stringify(allPosts))
      ElMessage.success('保存成功')
      router.back()
    } else {
      ElMessage.error('帖子不存在')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPostData()
})
</script>

<style scoped>
.edit-post-container {
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
  max-width: 600px;
}

.upload-tip {
  margin-top: 8px;
  font-size: 13px;
  color: #999;
}
</style>
