import { supabase, TABLES } from '../supabase/client'

// ==================== 辅助函数 ====================

/**
 * 获取当前用户ID（开发模式兼容）
 */
async function getCurrentUserId() {
  // 开发模式：从 localStorage 获取
  const devUserId = localStorage.getItem('devUserId')
  if (devUserId) {
    return devUserId
  }

  // 生产模式：从 Supabase Auth 获取
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id || null
  } catch {
    return null
  }
}

// ==================== 用户认证 ====================

/**
 * 发送验证码（Supabase Auth 使用 OTP，无需单独发送）
 */
export async function sendSmsCode(phone) {
  // Supabase Auth 使用 OTP (One-Time Password) 发送到手机/邮箱
  // 这里仅作兼容，实际验证在 phoneLogin 中处理
  console.log('[Supabase] 将使用 OTP 方式验证手机:', phone)
  return {
    code: 0,
    message: '请继续完成验证'
  }
}

/**
 * 手机号登录/注册
 * @param {string} phone - 手机号
 * @param {string} code - 验证码（开发模式任意6位）
 */
export async function phoneLogin(phone, code) {
  try {
    // 开发模式：任意6位验证码
    if (!code || code.length !== 6) {
      throw new Error('请输入6位验证码')
    }

    // ========== 开发模式：生成固定用户ID ==========
    const userId = 'dev_' + phone

    // 检查 profile 是否存在
    const { data: profile } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single()

    // 如果不存在，创建一个
    if (!profile) {
      await supabase
        .from(TABLES.PROFILES)
        .insert({
          id: userId,
          nickname: '用户' + phone.substr(-4),
          phone: phone,
          gold_count: 100
        })
    }

    return {
      code: 0,
      message: '登录成功（开发模式）',
      openid: userId,
      userInfo: profile || {
        _id: userId,
        phone: phone,
        nickname: '用户' + phone.substr(-4)
      }
    }

    // ========== 生产模式：取消下面的注释并配置短信服务 ==========
    // const { data, error } = await supabase.auth.verifyOtp({
    //   phone: '+86' + phone,
    //   token: code,
    //   type: 'sms'
    // })
    // if (error) throw error
    // const userId = data.user.id
    // ... 后续逻辑同上
  } catch (error) {
    console.error('登录失败:', error)
    throw error
  }
}

/**
 * 获取当前登录用户
 */
export async function getCurrentUser() {
  try {
    // 开发模式：从 localStorage 获取
    const devUserId = localStorage.getItem('devUserId')
    if (devUserId) {
      const { data: profile } = await supabase
        .from(TABLES.PROFILES)
        .select('*')
        .eq('id', devUserId)
        .single()
      return profile
    }

    // 生产模式：从 Supabase Auth 获取
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) throw error

    if (!user) return null

    // 获取用户 profile
    const { data: profile } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', userId)
      .single()

    return profile
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

/**
 * 退出登录
 */
export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('devUserId')
  localStorage.clear()
}

// ==================== 帖子相关 ====================

/**
 * 获取帖子列表
 * @param {object} params - 查询参数 { page, limit, type, userId }
 */
export async function getPostList(params = {}) {
  const { page = 1, limit = 20, type, userId } = params

  let query = supabase
    .from(TABLES.POSTS)
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (type) {
    query = query.eq('type', type)
  }

  if (userId) {
    query = query.eq('author_id', userId)
  }

  const { data, error } = await query

  if (error) throw error

  return {
    code: 0,
    data: {
      list: data || [],
      total: data?.length || 0,
      hasMore: data?.length === limit
    }
  }
}

/**
 * 获取帖子详情
 * @param {string} postId - 帖子ID
 */
export async function getPostDetail(postId) {
  const { data, error } = await supabase
    .from(TABLES.POSTS)
    .select('*')
    .eq('id', postId)
    .single()

  if (error) throw error

  return {
    code: 0,
    data: data
  }
}

/**
 * 创建帖子
 * @param {object} data - 帖子数据 { content, images, tags, type }
 */
export async function createPost(data) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  // 获取用户 profile
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select('*')
    .eq('id', userId)
    .single()

  const postData = {
    author_id: userId,
    author_name: profile?.nickname || '',
    author_avatar: profile?.avatar || '',
    content: data.content,
    images: data.images || [],
    tags: data.tags || [],
    type: data.type || 'post'
  }

  const { data: newPost, error } = await supabase
    .from(TABLES.POSTS)
    .insert(postData)
    .select()
    .single()

  if (error) throw error

  return {
    code: 0,
    data: newPost
  }
}

/**
 * 更新帖子
 * @param {string} postId - 帖子ID
 * @param {object} data - 更新数据
 */
export async function updatePost(postId, data) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  const { data: updatedPost, error } = await supabase
    .from(TABLES.POSTS)
    .update({
      content: data.content,
      images: data.images,
      tags: data.tags,
      updated_at: new Date().toISOString()
    })
    .eq('id', postId)
    .eq('author_id', userId)  // 只能更新自己的帖子
    .select()
    .single()

  if (error) throw error

  return {
    code: 0,
    data: updatedPost
  }
}

/**
 * 删除帖子
 * @param {string} postId - 帖子ID
 */
export async function deletePost(postId) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  const { error } = await supabase
    .from(TABLES.POSTS)
    .delete()
    .eq('id', postId)
    .eq('author_id', userId)

  if (error) throw error

  return {
    code: 0,
    message: '删除成功'
  }
}

// ==================== 评论相关 ====================

/**
 * 获取帖子评论
 * @param {string} postId - 帖子ID
 */
export async function getCommentList(postId) {
  const { data, error } = await supabase
    .from(TABLES.COMMENTS)
    .select('*, profiles(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return {
    code: 0,
    data: data || []
  }
}

/**
 * 创建评论
 * @param {object} data - { postId, content }
 */
export async function createComment(data) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  const commentData = {
    post_id: data.postId,
    author_id: userId,
    content: data.content
  }

  const { data: newComment, error } = await supabase
    .from(TABLES.COMMENTS)
    .insert(commentData)
    .select()
    .single()

  if (error) throw error

  // 更新帖子评论数
  await supabase.rpc('increment_comment_count', { post_id: data.postId })

  return {
    code: 0,
    data: newComment
  }
}

/**
 * 删除评论
 * @param {string} commentId - 评论ID
 */
export async function deleteComment(commentId) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  const { error } = await supabase
    .from(TABLES.COMMENTS)
    .delete()
    .eq('id', commentId)
    .eq('author_id', userId)

  if (error) throw error

  return {
    code: 0,
    message: '删除成功'
  }
}

// ==================== 点赞相关 ====================

/**
 * 点赞/取消点赞
 * @param {string} postId - 帖子ID
 */
export async function toggleLike(postId) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  // 检查是否已点赞
  const { data: existingLike } = await supabase
    .from(TABLES.LIKES)
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  if (existingLike) {
    // 取消点赞
    await supabase
      .from(TABLES.LIKES)
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId)

    // 减少点赞数
    await supabase.rpc('decrement_like_count', { post_id: postId })

    return {
      code: 0,
      data: { liked: false }
    }
  } else {
    // 点赞
    await supabase
      .from(TABLES.LIKES)
      .insert({
        user_id: userId,
        post_id: postId
      })

    // 增加点赞数
    await supabase.rpc('increment_like_count', { post_id: postId })

    return {
      code: 0,
      data: { liked: true }
    }
  }
}

/**
 * 检查帖子是否已点赞
 * @param {string} postId - 帖子ID
 */
export async function checkLike(postId) {
  const userId = await getCurrentUserId()
  if (!userId) return { liked: false }

  const { data } = await supabase
    .from(TABLES.LIKES)
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  return {
    code: 0,
    data: { liked: !!data }
  }
}

/**
 * 获取用户点赞的帖子列表
 */
export async function getLikedPosts() {
  const userId = await getCurrentUserId()
  if (!userId) return { code: 0, data: [] }

  const { data, error } = await supabase
    .from(TABLES.LIKES)
    .select(`post_id, ${TABLES.POSTS}(*)`)
    .eq('user_id', userId)

  if (error) throw error

  return {
    code: 0,
    data: data?.map(item => item.posts).filter(Boolean) || []
  }
}

// ==================== 课程相关 ====================

/**
 * 获取课程列表
 */
export async function getCourseList(params = {}) {
  const { page = 1, limit = 20 } = params

  const { data, error } = await supabase
    .from(TABLES.COURSES)
    .select('*')
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) throw error

  return {
    code: 0,
    data: {
      list: data || [],
      total: data?.length || 0
    }
  }
}

/**
 * 获取课程详情
 * @param {string} courseId - 课程ID
 */
export async function getCourseDetail(courseId) {
  const userId = await getCurrentUserId()

  // 获取课程信息
  const { data: course, error } = await supabase
    .from(TABLES.COURSES)
    .select('*')
    .eq('id', courseId)
    .single()

  if (error) throw error

  // 如果用户已登录，检查是否已购买
  let purchased = false
  if (userId) {
    const { data: purchase } = await supabase
      .from(TABLES.COURSE_PURCHASES)
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()

    purchased = !!purchase
  }

  return {
    code: 0,
    data: {
      ...course,
      purchased
    }
  }
}

/**
 * 购买课程
 * @param {string} courseId - 课程ID
 */
export async function purchaseCourse(courseId) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  // 检查是否已购买
  const { data: existing } = await supabase
    .from(TABLES.COURSE_PURCHASES)
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (existing) {
    return {
      code: 0,
      message: '已购买'
    }
  }

  // 获取课程价格
  const { data: course } = await supabase
    .from(TABLES.COURSES)
    .select('price')
    .eq('id', courseId)
    .single()

  // 获取用户金币
  const { data: profile } = await supabase
    .from(TABLES.PROFILES)
    .select('gold_count')
    .eq('id', userId)
    .single()

  if (!profile || profile.gold_count < course.price) {
    throw new Error('金币不足')
  }

  // 扣除金币并添加购买记录
  await supabase
    .from(TABLES.PROFILES)
    .update({ gold_count: profile.gold_count - course.price })
    .eq('id', userId)

  await supabase
    .from(TABLES.COURSE_PURCHASES)
    .insert({
      user_id: userId,
      course_id: courseId
    })

  return {
    code: 0,
    message: '购买成功'
  }
}

// ==================== 关注相关 ====================

/**
 * 关注/取消关注
 * @param {string} followingId - 被关注用户ID
 */
export async function toggleFollow(followingId) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  // 检查是否已关注
  const { data: existing } = await supabase
    .from(TABLES.FOLLOWS)
    .select('*')
    .eq('follower_id', userId)
    .eq('following_id', followingId)
    .single()

  if (existing) {
    // 取消关注
    await supabase
      .from(TABLES.FOLLOWS)
      .delete()
      .eq('follower_id', userId)
      .eq('following_id', followingId)

    return {
      code: 0,
      data: { following: false }
    }
  } else {
    // 关注
    await supabase
      .from(TABLES.FOLLOWS)
      .insert({
        follower_id: userId,
        following_id: followingId
      })

    return {
      code: 0,
      data: { following: true }
    }
  }
}

/**
 * 获取用户关注的列表
 */
export async function getFollowingList(userId) {
  const { data, error } = await supabase
    .from(TABLES.FOLLOWS)
    .select(`following_id, profiles(*)`)
    .eq('follower_id', userId)

  if (error) throw error

  return {
    code: 0,
    data: data?.map(item => item.profiles).filter(Boolean) || []
  }
}

/**
 * 获取用户粉丝列表
 */
export async function getFollowerList(userId) {
  const { data, error } = await supabase
    .from(TABLES.FOLLOWS)
    .select(`follower_id, profiles(*)`)
    .eq('following_id', userId)

  if (error) throw error

  return {
    code: 0,
    data: data?.map(item => item.profiles).filter(Boolean) || []
  }
}

// ==================== 用户相关 ====================

/**
 * 获取用户资料
 * @param {string} userId - 用户ID
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return {
    code: 0,
    data: data
  }
}

/**
 * 更新用户资料
 * @param {object} data - 更新数据
 */
export async function updateUserProfile(data) {
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('请先登录')

  const { data: profile, error } = await supabase
    .from(TABLES.PROFILES)
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  return {
    code: 0,
    data: profile
  }
}

export default {
  // 认证
  sendSmsCode,
  phoneLogin,
  getCurrentUser,
  logout,

  // 帖子
  getPostList,
  getPostDetail,
  createPost,
  updatePost,
  deletePost,

  // 评论
  getCommentList,
  createComment,
  deleteComment,

  // 点赞
  toggleLike,
  checkLike,
  getLikedPosts,

  // 课程
  getCourseList,
  getCourseDetail,
  purchaseCourse,

  // 关注
  toggleFollow,
  getFollowingList,
  getFollowerList,

  // 用户
  getUserProfile,
  updateUserProfile
}
