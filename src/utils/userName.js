/**
 * 获取用户的显示名称
 * @param {Object} post - 帖子对象
 * @param {Object} currentUser - 当前登录用户（可选）
 * @returns {String} 用户显示名称
 */
export function getDisplayName(post, currentUser = null) {
  // 优先使用 Supabase 格式的字段
  if (post.author_name) {
    // 如果是当前用户，显示"我"
    const currentUserId = currentUser?.id || localStorage.getItem('devUserId')
    if (currentUserId && post.author_id === currentUserId) {
      return '我'
    }
    return post.author_name
  }

  // 兼容旧格式字段
  if (currentUser && post.userId === currentUser._id) {
    return '我'
  }

  // 优先使用帖子中保存的昵称
  if (post.userName) {
    return post.userName
  }

  return '匿名用户'
}

/**
 * 获取用户的头像
 * @param {Object} post - 帖子对象
 * @returns {String} 用户头像URL
 */
export function getUserAvatar(post) {
  // 优先使用 Supabase 格式的字段
  if (post.author_avatar) {
    return post.author_avatar
  }

  // 兼容旧格式字段
  if (post.userAvatar) {
    return post.userAvatar
  }

  return '/default-avatar.png'
}

/**
 * 获取用户的最新头像（从 profiles 表）
 * @param {String} userId - 用户ID
 * @param {String} fallbackAvatar - 备用头像（帖子中保存的）
 * @returns {String} 用户头像URL
 */
export async function fetchUserAvatar(userId, fallbackAvatar = '') {
  try {
    const { supabase, TABLES } = await import('../supabase/client')
    const { data } = await supabase
      .from(TABLES.PROFILES)
      .select('avatar')
      .eq('id', userId)
      .maybeSingle()

    return data?.avatar || fallbackAvatar || '/default-avatar.png'
  } catch (error) {
    console.error('获取用户头像失败:', error)
    return fallbackAvatar || '/default-avatar.png'
  }
}
