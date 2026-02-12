import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/community'
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('../views/Test.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('../views/Community.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/course',
    name: 'Course',
    component: () => import('../views/Course.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/course/:id',
    name: 'CourseDetail',
    component: () => import('../views/CourseDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/checkin',
    name: 'Checkin',
    component: () => import('../views/Checkin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/create',
    name: 'CreatePost',
    component: () => import('../views/CreatePost.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/post/edit/:id',
    name: 'EditPost',
    component: () => import('../views/EditPost.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/edit',
    name: 'EditProfile',
    component: () => import('../views/EditProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/notification',
    name: 'Notification',
    component: () => import('../views/Notification.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('../views/Messages.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/messages/:userId',
    name: 'ChatDetail',
    component: () => import('../views/ChatDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/posts',
    name: 'MyPosts',
    component: () => import('../views/MyPosts.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/topic',
    name: 'Topic',
    component: () => import('../views/Topic.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id/followers',
    name: 'UserFollowers',
    component: () => import('../views/UserFollowers.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id/following',
    name: 'UserFollowing',
    component: () => import('../views/UserFollowing.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/gold/logs',
    name: 'GoldLogs',
    component: () => import('../views/GoldLogs.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/data-check',
    name: 'DataCheck',
    component: () => import('../views/DataCheck.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('../views/Collections.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/topic-square',
    name: 'TopicSquare',
    component: () => import('../views/TopicSquare.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导入 Supabase 客户端
import { supabase } from '../supabase/client'

// 路由守卫 - 使用 Supabase Auth 验证
router.beforeEach(async (to, from, next) => {
  // 如果是登录页，直接放行
  if (to.path === '/login') {
    next()
    return
  }

  // 需要登录的页面
  if (to.meta.requiresAuth) {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      // 未登录，跳转到登录页
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
