<template>
  <div class="admin-container">
    <h1>🛡️ 管理员后台</h1>

    <div class="stats">
      <div class="stat-card">
        <h3>帖子总数</h3>
        <p>{{ stats.postCount }}</p>
      </div>
      <div class="stat-card">
        <h3>用户总数</h3>
        <p>{{ stats.userCount }}</p>
      </div>
      <div class="stat-card">
        <h3>课程总数</h3>
        <p>{{ stats.courseCount }}</p>
      </div>
      <div class="stat-card">
        <h3>评论总数</h3>
        <p>{{ stats.commentCount }}</p>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: activeTab === 'posts' }" @click="activeTab = 'posts'">
        帖子管理
      </button>
      <button :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">
        用户管理
      </button>
      <button :class="{ active: activeTab === 'courses' }" @click="activeTab = 'courses'">
        课程管理
      </button>
      <button :class="{ active: activeTab === 'comments' }" @click="activeTab = 'comments'">
        评论管理
      </button>
      <button :class="{ active: activeTab === 'admins' }" @click="activeTab = 'admins'">
        管理员设置
      </button>
      <button :class="{ active: activeTab === 'announcements' }" @click="activeTab = 'announcements'">
        公告发布
      </button>
      <button :class="{ active: activeTab === 'topics' }" @click="activeTab = 'topics'">
        话题管理
      </button>
    </div>

    <!-- 帖子管理 -->
    <div v-if="activeTab === 'posts'" class="section">
      <h2>帖子管理</h2>
      <div v-if="posts.length === 0">暂无帖子</div>
      <div v-else class="list">
        <div v-for="post in posts" :key="post._id" class="item-full">
          <div class="content">
            <div class="post-badges">
              <el-tag v-if="post.isPinned" type="danger" size="small">置顶</el-tag>
              <el-tag v-if="post.isFeatured" type="warning" size="small">精华</el-tag>
            </div>
            <strong>{{ post.userName || '匿名' }}</strong>
            <p>{{ post.content?.substring(0, 100) }}...</p>
          </div>
          <div class="actions">
            <el-button
              v-if="!post.isPinned"
              @click="togglePin(post)"
              size="small"
              type="warning"
            >
              置顶
            </el-button>
            <el-button
              v-else
              @click="togglePin(post)"
              size="small"
              type="info"
            >
              取消置顶
            </el-button>
            <el-button
              v-if="!post.isFeatured"
              @click="toggleFeature(post)"
              size="small"
              type="success"
            >
              设为精华
            </el-button>
            <el-button
              v-else
              @click="toggleFeature(post)"
              size="small"
              type="info"
            >
              取消精华
            </el-button>
            <button @click="deletePost(post._id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户管理 -->
    <div v-if="activeTab === 'users'" class="section">
      <h2>用户管理</h2>
      <div v-if="users.length === 0">暂无用户</div>
      <div v-else class="list">
        <div v-for="user in users" :key="user._id" class="item-full">
          <div class="content">
            <strong>{{ user.nickname }}</strong>
            <p>{{ user.phone }}</p>
            <p>金币: {{ user.coins || 0 }}</p>
            <el-tag v-if="user.isAdmin" type="danger" size="small">管理员</el-tag>
          </div>
          <div class="actions">
            <button @click="editUserGold(user)" class="action-btn">修改金币</button>
            <button
              v-if="!user.isAdmin"
              @click="toggleAdmin(user)"
              class="action-btn admin-btn"
            >
              设为管理员
            </button>
            <button
              v-else
              @click="toggleAdmin(user)"
              class="action-btn cancel-admin-btn"
            >
              取消管理员
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 课程管理 -->
    <div v-if="activeTab === 'courses'" class="section">
      <h2>课程管理</h2>

      <!-- 添加课程按钮 -->
      <button @click="showAddCourseForm = true" class="add-btn">
        + 添加新课程
      </button>

      <!-- 添加/编辑课程表单 -->
      <div v-if="showAddCourseForm" class="form-card">
        <h3>{{ editingCourse ? '编辑课程' : '添加新课程' }}</h3>

        <div class="form-group">
          <label>课程标题</label>
          <input v-model="courseForm.title" type="text" placeholder="输入课程标题" />
        </div>

        <div class="form-group">
          <label>课程描述</label>
          <textarea v-model="courseForm.description" rows="3" placeholder="输入课程描述"></textarea>
        </div>

        <div class="form-group">
          <label>视频URL</label>
          <input v-model="courseForm.videoUrl" type="text" placeholder="视频地址（可选，如：https://example.com/video.mp4）" />
        </div>

        <div class="form-group">
          <label>价格（金币）</label>
          <input v-model="courseForm.price" type="number" placeholder="0表示免费" min="0" />
        </div>

        <div class="form-group">
          <label>时长（分钟）</label>
          <input v-model="courseForm.duration" type="number" placeholder="课程时长" min="1" />
        </div>

        <div class="form-actions">
          <button @click="saveCourse" class="save-btn">保存</button>
          <button v-if="editingCourse" @click="cancelEditCourse" class="cancel-btn">取消</button>
        </div>
      </div>

      <!-- 课程列表 -->
      <div v-if="courses.length === 0" class="empty">暂无课程</div>
      <div v-else class="list">
        <div v-for="course in courses" :key="course._id" class="item">
          <div class="content">
            <strong>{{ course.title }}</strong>
            <p>{{ course.description }}</p>
            <p>
              价格: {{ course.isFree ? '免费' : course.price + ' 金币' }} |
              时长: {{ course.duration }}分钟
            </p>
          </div>
          <div class="actions">
            <button @click="editCourse(course)" class="action-btn">编辑</button>
            <button @click="deleteCourse(course._id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 评论管理 -->
    <div v-if="activeTab === 'comments'" class="section">
      <h2>评论管理</h2>

      <!-- 搜索框 -->
      <div class="search-bar">
        <input
          v-model="commentSearchKeyword"
          type="text"
          placeholder="搜索评论内容..."
          @input="filterComments"
          class="search-input"
        />
      </div>

      <div v-if="comments.length === 0" class="empty">暂无评论</div>
      <div v-else class="list">
        <div v-for="comment in filteredComments" :key="comment._id" class="item-full comment-item">
          <div class="content">
            <div class="comment-header">
              <strong>{{ comment.userName || '匿名' }}</strong>
              <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ comment.commentContent || comment.content }}</p>
            <p class="comment-post-info">来自帖子: {{ getPostTitle(comment.postId) }}</p>
          </div>
          <div class="actions">
            <button @click="deleteComment(comment)" class="delete-btn">删除评论</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 管理员设置 -->
    <div v-if="activeTab === 'admins'" class="section">
      <h2>管理员设置</h2>
      <p class="hint">设置其他用户为管理员，管理员拥有所有管理权限</p>

      <div class="admin-add-section">
        <h3>添加新管理员</h3>
        <div class="form-group">
          <label>输入用户手机号</label>
          <div class="admin-input-group">
            <input
              v-model="newAdminPhone"
              type="text"
              placeholder="请输入用户手机号"
              class="admin-input"
            />
            <button @click="addNewAdmin" class="add-btn">添加管理员</button>
          </div>
        </div>
      </div>

      <h3>管理员列表</h3>
      <div v-if="admins.length === 0" class="empty">暂无管理员</div>
      <div v-else class="list">
        <div v-for="admin in admins" :key="admin._id" class="item">
          <div class="content">
            <strong>{{ admin.nickname }}</strong>
            <p>{{ admin.phone }}</p>
            <el-tag type="danger" size="small">管理员</el-tag>
          </div>
          <div class="actions">
            <button
              v-if="admin._id !== currentUserId"
              @click="removeAdmin(admin)"
              class="delete-btn"
            >
              移除管理员
            </button>
            <span v-else class="current-admin-tag">当前登录</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 公告发布 -->
    <div v-if="activeTab === 'announcements'" class="section">
      <h2>公告发布</h2>
      <p class="hint">发布全局公告，所有用户都能看到</p>

      <!-- 添加公告表单 -->
      <div class="form-card">
        <h3>发布新公告</h3>

        <div class="form-group">
          <label>公告标题</label>
          <input v-model="announcementForm.title" type="text" placeholder="输入公告标题" />
        </div>

        <div class="form-group">
          <label>公告内容</label>
          <textarea v-model="announcementForm.content" rows="4" placeholder="输入公告内容"></textarea>
        </div>

        <div class="form-group">
          <label>公告类型</label>
          <select v-model="announcementForm.type" class="announcement-type-select">
            <option value="info">普通通知</option>
            <option value="warning">重要提醒</option>
            <option value="success">活动公告</option>
          </select>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" v-model="announcementForm.isSticky" />
            设为置顶公告（显示在所有页面顶部）
          </label>
        </div>

        <div class="form-actions">
          <button @click="publishAnnouncement" class="save-btn">发布公告</button>
          <button @click="resetAnnouncementForm" class="cancel-btn">重置</button>
        </div>
      </div>

      <h3>历史公告</h3>
      <div v-if="announcements.length === 0" class="empty">暂无公告</div>
      <div v-else class="list">
        <div v-for="announcement in announcements" :key="announcement._id" class="item-full">
          <div class="content">
            <div class="announcement-header">
              <strong>{{ announcement.title }}</strong>
              <el-tag :type="announcement.type" size="small">{{ getTypeText(announcement.type) }}</el-tag>
              <el-tag v-if="announcement.isSticky" type="danger" size="small">置顶</el-tag>
            </div>
            <p>{{ announcement.content }}</p>
            <p class="announcement-time">发布时间: {{ formatTime(announcement.createdAt) }}</p>
          </div>
          <div class="actions">
            <button @click="deleteAnnouncement(announcement._id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 话题管理 -->
    <div v-if="activeTab === 'topics'" class="section">
      <h2>话题管理</h2>
      <p class="hint">管理热门话题和敏感话题</p>

      <!-- 热门话题设置 -->
      <div class="topic-section">
        <h3>🔥 推荐热门话题</h3>
        <div class="form-card">
          <div class="form-group">
            <label>添加推荐话题</label>
            <div class="topic-input-group">
              <input
                v-model="newHotTopic"
                type="text"
                placeholder="输入话题名称（不含#）"
                class="topic-input"
              />
              <button @click="addHotTopic" class="add-btn">添加</button>
            </div>
          </div>
        </div>

        <div v-if="hotTopics.length === 0" class="empty">暂无推荐话题</div>
        <div v-else class="topics-list">
          <div v-for="(topic, index) in hotTopics" :key="topic.name" class="topic-item">
            <span class="topic-rank">{{ index + 1 }}</span>
            <span class="topic-name">{{ topic.name }}</span>
            <button @click="removeHotTopic(index)" class="delete-btn-small">移除</button>
          </div>
        </div>
      </div>

      <!-- 敏感话题设置 -->
      <div class="topic-section">
        <h3>🚫 敏感话题管理</h3>
        <p class="hint">敏感话题将不会在话题广场显示</p>
        <div class="form-card">
          <div class="form-group">
            <label>添加敏感话题</label>
            <div class="topic-input-group">
              <input
                v-model="newSensitiveTopic"
                type="text"
                placeholder="输入话题名称（不含#）"
                class="topic-input"
              />
              <button @click="addSensitiveTopic" class="add-btn danger-btn">添加</button>
            </div>
          </div>
        </div>

        <div v-if="sensitiveTopics.length === 0" class="empty">暂无敏感话题</div>
        <div v-else class="topics-list">
          <div v-for="topic in sensitiveTopics" :key="topic" class="topic-item sensitive">
            <span class="topic-name">{{ topic }}</span>
            <button @click="removeSensitiveTopic(topic)" class="delete-btn-small">移除</button>
          </div>
        </div>
      </div>

      <!-- 所有话题统计 -->
      <div class="topic-section">
        <h3>📊 话题统计</h3>
        <div v-if="allTopicStats.length === 0" class="empty">暂无话题数据</div>
        <div v-else class="list">
          <div v-for="topic in allTopicStats" :key="topic.name" class="item">
            <div class="content">
              <strong>{{ topic.name }}</strong>
              <p>帖子数: {{ topic.postCount }} | 点赞数: {{ topic.totalLikes }}</p>
            </div>
            <div class="actions">
              <el-tag v-if="isHotTopic(topic.name)" type="success" size="small">已推荐</el-tag>
              <el-tag v-if="isSensitiveTopic(topic.name)" type="danger" size="small">敏感</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { addGoldLog, GoldLogTypes, GoldLogTitles } from '../utils/goldLog'
import { ElMessage } from 'element-plus'

const router = useRouter()
const activeTab = ref('posts')
const posts = ref([])
const users = ref([])
const courses = ref([])
const comments = ref([])
const announcements = ref([])
const admins = ref([])
const hotTopics = ref([])
const sensitiveTopics = ref([])
const allTopicStats = ref([])

const showAddCourseForm = ref(false)
const editingCourse = ref(null)
const currentUserId = ref('')

// 搜索过滤
const commentSearchKeyword = ref('')
const filteredComments = ref([])

// 课程表单
const courseForm = ref({
  title: '',
  description: '',
  videoUrl: '',
  price: 0,
  duration: 60
})

// 公告表单
const announcementForm = ref({
  title: '',
  content: '',
  type: 'info',
  isSticky: false
})

// 新管理员手机号
const newAdminPhone = ref('')

// 新话题
const newHotTopic = ref('')
const newSensitiveTopic = ref('')

const stats = ref({
  postCount: 0,
  userCount: 0,
  courseCount: 0,
  commentCount: 0
})

// 检查管理员权限
const checkAdmin = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (!userInfo.isAdmin) {
    ElMessage.error('没有管理员权限')
    router.back()
    return false
  }
  currentUserId.value = userInfo._id
  return true
}

// 加载统计数据
const loadStats = () => {
  const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
  const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
  const allCourses = JSON.parse(localStorage.getItem('courses') || '[]')
  const userSet = new Set()

  allUsers.forEach(user => {
    userSet.add(user._id)
  })

  allPosts.forEach(post => {
    if (post.userId) {
      userSet.add(post.userId)
    }
  })

  // 计算评论总数
  let commentCount = 0
  allPosts.forEach(post => {
    if (post.comments && post.comments.length > 0) {
      commentCount += post.comments.length
    }
  })

  stats.value = {
    postCount: allPosts.length,
    userCount: userSet.size,
    courseCount: allCourses.length,
    commentCount: commentCount
  }
}

// 加载帖子列表
const loadPosts = () => {
  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    posts.value = allPosts
  } catch (error) {
    console.error('加载失败:', error)
    posts.value = []
  }
}

// 加载用户列表
const loadUsers = () => {
  try {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]')
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const userMap = new Map()

    // 先添加users数组中已有的用户
    allUsers.forEach(user => {
      userMap.set(user._id, user)
    })

    // 从帖子中提取用户并合并信息
    allPosts.forEach(post => {
      if (post.userId) {
        if (userMap.has(post.userId)) {
          const user = userMap.get(post.userId)
          user.postsCount = (user.postsCount || 0) + 1
        } else {
          userMap.set(post.userId, {
            _id: post.userId,
            phone: post.userId.replace('user_', ''),
            nickname: post.userName,
            avatar: post.userAvatar || '',
            coins: 1000,
            level: 1,
            postsCount: 1
          })
        }
      }
    })

    users.value = Array.from(userMap.values())
  } catch (error) {
    console.error('加载失败:', error)
    users.value = []
  }
}

// 加载评论列表
const loadComments = () => {
  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const allComments = []

    allPosts.forEach(post => {
      if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
          allComments.push({
            ...comment,
            postId: post._id,
            postTitle: post.content?.substring(0, 30) + '...'
          })
        })
      }
    })

    comments.value = allComments
    filteredComments.value = allComments
  } catch (error) {
    console.error('加载评论失败:', error)
    comments.value = []
    filteredComments.value = []
  }
}

// 过滤评论
const filterComments = () => {
  if (!commentSearchKeyword.value.trim()) {
    filteredComments.value = comments.value
  } else {
    const keyword = commentSearchKeyword.value.toLowerCase()
    filteredComments.value = comments.value.filter(comment => {
      const content = (comment.commentContent || comment.content || '').toLowerCase()
      const userName = (comment.userName || '').toLowerCase()
      return content.includes(keyword) || userName.includes(keyword)
    })
  }
}

// 获取帖子标题
const getPostTitle = (postId) => {
  const post = posts.value.find(p => p._id === postId)
  return post ? post.content?.substring(0, 30) + '...' : '未知帖子'
}

// 删除评论
const deleteComment = (comment) => {
  if (!confirm(`确定要删除这条评论吗？\n"${comment.commentContent || comment.content}"`)) return

  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const postIndex = allPosts.findIndex(p => p._id === comment.postId)

    if (postIndex !== -1) {
      const post = allPosts[postIndex]
      if (post.comments) {
        post.comments = post.comments.filter(c => c._id !== comment._id)
        post.commentCount = Math.max(0, (post.commentCount || 0) - 1)
      }
      allPosts[postIndex] = post
      localStorage.setItem('posts', JSON.stringify(allPosts))
    }

    loadComments()
    loadPosts()
    loadStats()

    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 加载课程列表
const loadCourses = () => {
  try {
    const allCourses = JSON.parse(localStorage.getItem('courses') || '[]')
    courses.value = allCourses
  } catch (error) {
    console.error('加载失败:', error)
    courses.value = []
  }
}

// 删除帖子
const deletePost = (postId) => {
  if (!confirm('确定要删除这条帖子吗？')) return

  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const updatedPosts = allPosts.filter(p => p._id !== postId)
    localStorage.setItem('posts', JSON.stringify(updatedPosts))

    posts.value = posts.value.filter(p => p._id !== postId)
    loadPosts()
    loadStats()

    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 切换置顶
const togglePin = (post) => {
  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const index = allPosts.findIndex(p => p._id === post._id)

    if (index !== -1) {
      allPosts[index].isPinned = !allPosts[index].isPinned
      localStorage.setItem('posts', JSON.stringify(allPosts))

      // 排序：置顶的帖子在最前面
      allPosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      })

      localStorage.setItem('posts', JSON.stringify(allPosts))
      loadPosts()

      ElMessage.success(allPosts[index].isPinned ? '已置顶' : '已取消置顶')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 切换精华
const toggleFeature = (post) => {
  try {
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const index = allPosts.findIndex(p => p._id === post._id)

    if (index !== -1) {
      allPosts[index].isFeatured = !allPosts[index].isFeatured
      localStorage.setItem('posts', JSON.stringify(allPosts))
      loadPosts()

      ElMessage.success(allPosts[index].isFeatured ? '已设为精华' : '已取消精华')
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 修改用户金币
const editUserGold = (user) => {
  const newGold = prompt('请输入新的金币数量:', user.coins || 0)
  if (newGold === null) return

  const goldNum = parseInt(newGold)
  if (isNaN(goldNum) || goldNum < 0) {
    ElMessage.error('请输入有效的数字')
    return
  }

  const oldGold = user.coins || 0
  const diff = goldNum - oldGold

  user.coins = goldNum

  // 保存到users数组
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const index = users.findIndex(u => u._id === user._id)
  if (index !== -1) {
    users[index] = user
    localStorage.setItem('users', JSON.stringify(users))
  }

  // 更新当前用户信息
  const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
  if (currentUser._id === user._id) {
    currentUser.coins = goldNum
    localStorage.setItem('userInfo', JSON.stringify(currentUser))
  }

  // 记录金币流水（如果有变化）
  if (diff !== 0) {
    const type = diff > 0 ? GoldLogTypes.INCOME : GoldLogTypes.EXPENSE
    const amount = Math.abs(diff)
    const description = diff > 0
      ? `管理员增加金币（${oldGold} → ${goldNum}）`
      : `管理员扣除金币（${oldGold} → ${goldNum}）`

    addGoldLog(
      user._id,
      type,
      amount,
      GoldLogTitles.ADMIN_GRANT,
      description
    )
  }

  ElMessage.success('修改成功')
}

// 设置/取消管理员
const toggleAdmin = (user) => {
  const action = user.isAdmin ? '取消管理员' : '设为管理员'
  if (!confirm(`确定要${action} "${user.nickname}" 吗？`)) return

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const index = users.findIndex(u => u._id === user._id)

    if (index !== -1) {
      users[index].isAdmin = !users[index].isAdmin
      localStorage.setItem('users', JSON.stringify(users))
    }

    // 同时更新userInfo中的管理员状态
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo._id === user._id) {
      userInfo.isAdmin = !userInfo.isAdmin
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }

    loadUsers()
    loadAdmins()

    ElMessage.success(user.isAdmin ? '已取消管理员' : '已设为管理员')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 添加新管理员
const addNewAdmin = () => {
  if (!newAdminPhone.value.trim()) {
    ElMessage.warning('请输入用户手机号')
    return
  }

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const user = users.find(u => u.phone === newAdminPhone.value.trim())

    if (!user) {
      ElMessage.error('未找到该用户')
      return
    }

    if (user.isAdmin) {
      ElMessage.warning('该用户已经是管理员了')
      return
    }

    user.isAdmin = true
    localStorage.setItem('users', JSON.stringify(users))

    // 更新userInfo
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo._id === user._id) {
      userInfo.isAdmin = true
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }

    newAdminPhone.value = ''
    loadUsers()
    loadAdmins()

    ElMessage.success('设置成功')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 移除管理员
const removeAdmin = (admin) => {
  if (!confirm(`确定要移除 "${admin.nickname}" 的管理员权限吗？`)) return

  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const index = users.findIndex(u => u._id === admin._id)

    if (index !== -1) {
      users[index].isAdmin = false
      localStorage.setItem('users', JSON.stringify(users))
    }

    // 更新userInfo
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo._id === admin._id) {
      userInfo.isAdmin = false
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }

    loadUsers()
    loadAdmins()

    ElMessage.success('已移除管理员权限')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 加载管理员列表
const loadAdmins = () => {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    admins.value = users.filter(u => u.isAdmin)

    // 从posts中提取有管理员权限的用户
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    allPosts.forEach(post => {
      if (post.userId && !admins.value.find(a => a._id === post.userId)) {
        // 检查localStorage中的isAdmin标记
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (userInfo._id === post.userId && userInfo.isAdmin) {
          admins.value.push({
            _id: post.userId,
            phone: post.userId.replace('user_', ''),
            nickname: post.userName,
            isAdmin: true
          })
        }
      }
    })
  } catch (error) {
    console.error('加载管理员列表失败:', error)
    admins.value = []
  }
}

// 发布公告
const publishAnnouncement = () => {
  if (!announcementForm.value.title.trim()) {
    ElMessage.warning('请输入公告标题')
    return
  }

  if (!announcementForm.value.content.trim()) {
    ElMessage.warning('请输入公告内容')
    return
  }

  try {
    const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]')

    const newAnnouncement = {
      _id: Date.now().toString(),
      title: announcementForm.value.title,
      content: announcementForm.value.content,
      type: announcementForm.value.type,
      isSticky: announcementForm.value.isSticky,
      createdAt: Date.now()
    }

    // 如果是置顶公告，先取消其他置顶公告
    if (newAnnouncement.isSticky) {
      allAnnouncements.forEach(a => a.isSticky = false)
    }

    allAnnouncements.unshift(newAnnouncement)
    localStorage.setItem('announcements', JSON.stringify(allAnnouncements))

    resetAnnouncementForm()
    loadAnnouncements()

    ElMessage.success('公告发布成功')
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

// 删除公告
const deleteAnnouncement = (id) => {
  if (!confirm('确定要删除这条公告吗？')) return

  try {
    const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]')
    const updatedAnnouncements = allAnnouncements.filter(a => a._id !== id)
    localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements))

    loadAnnouncements()

    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 加载公告列表
const loadAnnouncements = () => {
  try {
    const allAnnouncements = JSON.parse(localStorage.getItem('announcements') || '[]')
    announcements.value = allAnnouncements
  } catch (error) {
    console.error('加载公告失败:', error)
    announcements.value = []
  }
}

// 重置公告表单
const resetAnnouncementForm = () => {
  announcementForm.value = {
    title: '',
    content: '',
    type: 'info',
    isSticky: false
  }
}

// 获取公告类型文本
const getTypeText = (type) => {
  const types = {
    info: '普通通知',
    warning: '重要提醒',
    success: '活动公告'
  }
  return types[type] || '普通通知'
}

// 添加热门话题
const addHotTopic = () => {
  if (!newHotTopic.value.trim()) {
    ElMessage.warning('请输入话题名称')
    return
  }

  const topicName = newHotTopic.value.trim().replace('#', '')
  if (hotTopics.value.find(t => t.name === topicName)) {
    ElMessage.warning('该话题已在推荐列表中')
    return
  }

  hotTopics.value.push({
    name: topicName,
    addedAt: Date.now()
  })

  localStorage.setItem('hotTopics', JSON.stringify(hotTopics.value))
  newHotTopic.value = ''

  ElMessage.success('添加成功')
}

// 移除热门话题
const removeHotTopic = (index) => {
  hotTopics.value.splice(index, 1)
  localStorage.setItem('hotTopics', JSON.stringify(hotTopics.value))
  ElMessage.success('移除成功')
}

// 添加敏感话题
const addSensitiveTopic = () => {
  if (!newSensitiveTopic.value.trim()) {
    ElMessage.warning('请输入话题名称')
    return
  }

  const topicName = newSensitiveTopic.value.trim().replace('#', '')
  if (sensitiveTopics.value.includes(topicName)) {
    ElMessage.warning('该话题已在敏感列表中')
    return
  }

  sensitiveTopics.value.push(topicName)
  localStorage.setItem('sensitiveTopics', JSON.stringify(sensitiveTopics.value))
  newSensitiveTopic.value = ''

  ElMessage.success('添加成功')
}

// 移除敏感话题
const removeSensitiveTopic = (topic) => {
  sensitiveTopics.value = sensitiveTopics.value.filter(t => t !== topic)
  localStorage.setItem('sensitiveTopics', JSON.stringify(sensitiveTopics.value))
  ElMessage.success('移除成功')
}

// 加载话题数据
const loadTopics = () => {
  try {
    // 加载热门话题
    const savedHotTopics = JSON.parse(localStorage.getItem('hotTopics') || '[]')
    hotTopics.value = savedHotTopics

    // 加载敏感话题
    const savedSensitiveTopics = JSON.parse(localStorage.getItem('sensitiveTopics') || '[]')
    sensitiveTopics.value = savedSensitiveTopics

    // 统计所有话题
    const allPosts = JSON.parse(localStorage.getItem('posts') || '[]')
    const topicMap = new Map()

    allPosts.forEach(post => {
      if (post.content) {
        const matches = post.content.match(/#([^\s#]+)/g)
        if (matches) {
          matches.forEach(match => {
            const topicName = match.replace('#', '')
            if (topicMap.has(topicName)) {
              const topic = topicMap.get(topicName)
              topic.postCount++
              topic.totalLikes += post.likeCount || 0
            } else {
              topicMap.set(topicName, {
                name: topicName,
                postCount: 1,
                totalLikes: post.likeCount || 0
              })
            }
          })
        }
      }
    })

    // 转换为数组并排序
    allTopicStats.value = Array.from(topicMap.values())
      .sort((a, b) => b.postCount - a.postCount)
  } catch (error) {
    console.error('加载话题失败:', error)
  }
}

// 判断是否是热门话题
const isHotTopic = (topicName) => {
  return hotTopics.value.some(t => t.name === topicName)
}

// 判断是否是敏感话题
const isSensitiveTopic = (topicName) => {
  return sensitiveTopics.value.includes(topicName)
}

// 保存课程
const saveCourse = () => {
  if (!courseForm.value.title.trim()) {
    ElMessage.warning('请输入课程标题')
    return
  }

  if (!courseForm.value.description.trim()) {
    ElMessage.warning('请输入课程描述')
    return
  }

  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]')

    if (editingCourse.value) {
      // 编辑现有课程
      const index = courses.findIndex(c => c._id === editingCourse.value._id)
      if (index !== -1) {
        courses[index] = {
          ...editingCourse.value,
          ...courseForm.value,
          isFree: courseForm.value.price === 0
        }
      }
    } else {
      // 添加新课程
      const newCourse = {
        _id: Date.now().toString(),
        ...courseForm.value,
        isFree: courseForm.value.price === 0,
        viewCount: 0,
        cover: ''
      }
      courses.unshift(newCourse)
    }

    localStorage.setItem('courses', JSON.stringify(courses))

    // 重置表单
    courseForm.value = {
      title: '',
      description: '',
      videoUrl: '',
      price: 0,
      duration: 60
    }
    showAddCourseForm.value = false
    editingCourse.value = null

    loadCourses()
    loadStats()

    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 编辑课程
const editCourse = (course) => {
  editingCourse.value = course
  courseForm.value = {
    title: course.title,
    description: course.description,
    videoUrl: course.videoUrl || '',
    price: course.price,
    duration: course.duration
  }
  showAddCourseForm.value = true
}

// 取消编辑课程
const cancelEditCourse = () => {
  editingCourse.value = null
  showAddCourseForm.value = false
}

// 删除课程
const deleteCourse = (courseId) => {
  if (!confirm('确定要删除这门课程吗？')) return

  try {
    const courses = JSON.parse(localStorage.getItem('courses') || '[]')
    const updatedCourses = courses.filter(c => c._id !== courseId)
    localStorage.setItem('courses', JSON.stringify(updatedCourses))

    loadCourses()
    loadStats()

    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`

  return date.toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (checkAdmin()) {
    loadStats()
    loadPosts()
    loadUsers()
    loadCourses()
    loadComments()
    loadAdmins()
    loadAnnouncements()
    loadTopics()
  }
})
</script>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(to bottom, #f0f4f8 0%, #ffffff 100%);
}

h1 {
  margin-bottom: 20px;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hint {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 20px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(241, 245, 249, 0.8);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.15);
}

.stat-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.stat-card p {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tabs button {
  padding: 10px 20px;
  border: none;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s ease;
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.tabs button:hover {
  background: #f8fafc;
  transform: translateY(-2px);
}

.tabs button.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.section {
  background: white;
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.section h2 {
  margin: 0 0 20px 0;
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
}

.section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 16px;
}

.add-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 20px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.form-card {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(236, 72, 153, 0.05));
  padding: 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.form-card h3 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
}

.save-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.cancel-btn {
  padding: 10px 24px;
  background: #e2e8f0;
  color: #64748b;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #cbd5e1;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid rgba(241, 245, 249, 0.8);
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
}

.item:hover {
  border-color: rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
}

.item-full {
  flex-direction: column;
  align-items: flex-start;
}

.post-badges {
  margin-bottom: 8px;
}

.content {
  flex: 1;
}

.content strong {
  display: block;
  margin-bottom: 8px;
  color: #1e293b;
}

.content p {
  margin: 4px 0;
  color: #64748b;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.delete-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.delete-btn-small {
  padding: 6px 12px;
  font-size: 12px;
}

.action-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.admin-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.cancel-admin-btn {
  background: #64748b;
}

.current-admin-tag {
  padding: 6px 12px;
  background: #e2e8f0;
  color: #94a3b8;
  border-radius: 8px;
  font-size: 12px;
}

.empty {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
}

/* 评论管理样式 */
.search-bar {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
}

.comment-item {
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.comment-item:hover {
  border-left-color: #8b5cf6;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-time {
  font-size: 12px;
  color: #94a3b8;
}

.comment-content {
  color: #334155;
  line-height: 1.6;
  margin-bottom: 8px;
}

.comment-post-info {
  color: #8b5cf6;
  font-size: 13px;
}

/* 管理员设置样式 */
.admin-add-section {
  margin-bottom: 24px;
}

.admin-input-group {
  display: flex;
  gap: 12px;
}

.admin-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
}

/* 公告样式 */
.announcement-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.announcement-time {
  font-size: 12px;
  color: #94a3b8;
}

.announcement-type-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
}

/* 话题管理样式 */
.topic-section {
  margin-bottom: 32px;
}

.topic-input-group {
  display: flex;
  gap: 12px;
}

.topic-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topic-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid rgba(241, 245, 249, 0.8);
}

.topic-item.sensitive {
  background: #fef2f2;
  border-color: #fecaca;
}

.topic-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
}

.topic-name {
  flex: 1;
  font-weight: 600;
  color: #334155;
}

.danger-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
</style>
