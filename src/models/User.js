import LC from '@/leancloud'

// 用户登录/注册
export const userApi = {
  // 手机号登录/注册
  async phoneLogin(phone, code) {
    // LeanCloud会自动注册新用户
    const user = await LC.User.logInWithMobilePhone(phone, code)
    return {
      _id: user.id,
      ...user.toJSON()
    }
  },

  // 发送验证码
  async sendSmsCode(phone) {
    await LC.User.requestLoginSmsCode(phone)
    return { success: true }
  },

  // 获取当前用户
  getCurrentUser() {
    return LC.User.current()
  },

  // 更新用户信息
  async updateProfile(data) {
    const user = LC.User.current()
    if (user) {
      user.set('nickname', data.nickname)
      user.set('avatar', data.avatar)
      user.set('bio', data.bio)
      await user.save()
      return user.toJSON()
    }
  },

  // 退出登录
  async logout() {
    await LC.User.logOut()
  }
}

// 评论数据模型
const Comment = LC.Object.extend('Comment')

export const commentApi = {
  // 添加评论
  async add(postId, content) {
    const comment = new Comment()
    comment.set('post', LC.Object.createWithoutData('Post', postId))
    comment.set('content', content)
    comment.set('author', LC.User.current())

    await comment.save()
    return comment.toJSON()
  },

  // 获取评论列表
  async getList(postId) {
    const query = new LC.Query(Comment)
    query.equalTo('post', LC.Object.createWithoutData('Post', postId))
    query.include('author')
    query.ascending('createdAt')

    const comments = await query.find()
    return comments.map(c => ({
      _id: c.id,
      ...c.toJSON(),
      authorName: c.get('author')?.get('nickname'),
      authorAvatar: c.get('author')?.get('avatar')
    }))
  }
}

export default LC
