// 创建通知（保存到被通知用户的通知列表中）
export const createNotification = (receiverId, notification) => {
  const key = `notifications_${receiverId}`
  const notifications = JSON.parse(localStorage.getItem(key) || '[]')

  const newNotification = {
    _id: `notif_${Date.now()}`,
    isRead: false,
    createdAt: Date.now(),
    ...notification
  }

  notifications.unshift(newNotification)
  localStorage.setItem(key, JSON.stringify(notifications))

  return newNotification
}

// 创建点赞通知
export const createLikeNotification = (user, post, postOwnerId) => {
  // 不给自己发通知
  if (user._id === postOwnerId) return

  return createNotification(postOwnerId, {
    type: 'like',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `赞了你的帖子`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 创建评论通知
export const createCommentNotification = (user, post, commentContent, postOwnerId) => {
  // 不给自己发通知
  if (user._id === postOwnerId) return

  return createNotification(postOwnerId, {
    type: 'comment',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `评论了你的帖子: "${commentContent.substring(0, 30)}${commentContent.length > 30 ? '...' : ''}"`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 创建收藏通知
export const createCollectNotification = (user, post, postOwnerId) => {
  // 不给自己发通知
  if (user._id === postOwnerId) return

  return createNotification(postOwnerId, {
    type: 'collect',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `收藏了你的帖子`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 创建回复通知
export const createReplyNotification = (user, post, commentAuthor, replyContent) => {
  // 不给自己发通知
  if (user._id === commentAuthor.userId) return

  return createNotification(commentAuthor.userId, {
    type: 'reply',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `回复了你的评论: "${replyContent.substring(0, 30)}${replyContent.length > 30 ? '...' : ''}"`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 创建@提醒通知
export const createMentionNotification = (user, mentionedUser, post, content) => {
  // 不给自己发通知
  if (user._id === mentionedUser._id) return

  createNotification(mentionedUser._id, {
    type: 'mention',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `在评论中@了你: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 从文本中提取@用户名
export const extractMentions = (text) => {
  const mentionRegex = /@(\S+)/g
  const matches = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    matches.push(match[1])
  }

  return [...new Set(matches)] // 去重
}

// 创建评论点赞通知
export const createCommentLikeNotification = (user, post, commentAuthor, commentContent) => {
  // 不给自己发通知
  if (user._id === commentAuthor.userId) return

  createNotification(commentAuthor.userId, {
    type: 'comment_like',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `赞了你的评论: "${commentContent.substring(0, 20)}${commentContent.length > 20 ? '...' : ''}"`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}

// 创建评论表情反应通知
export const createCommentReactionNotification = (user, post, commentAuthor, commentContent, emoji) => {
  // 不给自己发通知
  if (user._id === commentAuthor.userId) return

  createNotification(commentAuthor.userId, {
    type: 'comment_reaction',
    userId: user._id,
    userName: user.nickname || '我',
    userAvatar: user.avatar || '',
    postId: post._id,
    content: `给你的评论添加了 ${emoji} 表情`,
    postContent: post.content?.substring(0, 50) + (post.content?.length > 50 ? '...' : '')
  })
}
