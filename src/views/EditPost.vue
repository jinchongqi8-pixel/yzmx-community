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
              <el-radio-button :value="1">交流</el-radio-button>
              <el-radio-button :value="2">提问</el-radio-button>
              <el-radio-button :value="3">分享</el-radio-button>
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
import { getPostDetail, updatePost } from '../api/cloud'

const route = useRoute()
const router = useRouter()
const saving = ref(false)
const imageList = ref([])

// 类型映射
const typeMap = {
  1: '交流',
  2: '提问',
  3: '分享'
}

// 反向类型映射
const reverseTypeMap = {
  '交流': 1,
  '提问': 2,
  '分享': 3,
  'post': 1
}

// 表单数据
const form = reactive({
  type: 1,
  content: '',
  images: []
})

// 加载帖子数据
const loadPostData = async () => {
  const postId = route.params.id

  try {
    const res = await getPostDetail(postId)

    if (res.code === 0 && res.data) {
      const post = res.data
      form.type = reverseTypeMap[post.type] || 1
      form.content = post.content || ''
      form.images = post.images || []

      // 设置图片列表
      if (post.images && post.images.length > 0) {
        imageList.value = post.images.map((url, index) => ({
          name: `image-${index}`,
          url: url
        }))
      }
    } else {
      ElMessage.error('帖子不存在')
      router.back()
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  }
}

// 提取标签
const extractTags = (content) => {
  const tagRegex = /#(\S+)/g
  const tags = []
  let match

  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1])
  }

  return tags
}

// 保存修改
const savePost = async () => {
  if (!form.content.trim()) {
    ElMessage.warning('请输入帖子内容')
    return
  }

  saving.value = true

  try {
    const postId = route.params.id
    const postData = {
      content: form.content,
      images: form.images,
      tags: extractTags(form.content),
      type: typeMap[form.type]
    }

    const res = await updatePost(postId, postData)

    if (res.code === 0) {
      ElMessage.success('保存成功')
      router.push('/post/' + postId)
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
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
}

.edit-form {
  max-width: 600px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>
