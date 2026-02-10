/**
 * 获取用户的显示名称（优先从 users 数组获取最新昵称）
 * @param {Object} post - 帖子对象
 * @param {Object} currentUser - 当前登录用户（可选）
 * @returns {String} 用户显示名称
 */
export function getDisplayName(post, currentUser = null) {
  // 如果提供了当前用户，且帖子是当前用户发的，显示"我"
  if (currentUser && post.userId === currentUser._id) {
    return '我'
  }

  // 优先从 users 数组获取最新昵称
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    let postUser = users.find(u => u._id === post.userId)

    // 如果找不到，尝试通过手机号匹配
    if (!postUser && post.userId && post.userId.startsWith('user_')) {
      const phone = post.userId.replace('user_', '')
      postUser = users.find(u => u.phone === phone)
      if (postUser) {
        console.log(`通过手机号匹配到用户: ${post.userId} -> ${postUser._id}`)
      }
    }

    if (postUser && postUser.nickname) {
      return postUser.nickname
    }
  } catch (error) {
    console.error('获取用户昵称失败:', error)
  }

  // 如果找不到，使用帖子中保存的旧昵称
  return post.userName || '匿名用户'
}

/**
 * 获取用户的最新头像（优先从 users 数组获取）
 * @param {String} userId - 用户ID
 * @param {String} fallbackAvatar - 备用头像（帖子中保存的）
 * @returns {String} 用户头像URL
 */
export function getUserAvatar(userId, fallbackAvatar = '') {
  try {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    let user = users.find(u => u._id === userId)

    // 如果找不到，尝试通过手机号匹配
    if (!user && userId && userId.startsWith('user_')) {
      const phone = userId.replace('user_', '')
      user = users.find(u => u.phone === phone)
    }

    if (user && user.avatar) {
      return user.avatar
    }
  } catch (error) {
    console.error('获取用户头像失败:', error)
  }

  return fallbackAvatar || '/default-avatar.png'
}

