import LC from '@/leancloud'

// 帖子数据模型
const Post = LC.Object.extend('Post')

// 帖子API
export const postApi = {
  // 获取帖子列表
  async getList(page = 1, limit = 20) {
    const query = new LC.Query(Post)
    query.descending('createdAt')
    query.limit(limit)
    query.skip((page - 1) * limit)
    query.include('author') // 包含作者信息

    const result = await query.find()
    return result.map(post => ({
      _id: post.id,
      ...post.toJSON(),
      authorName: post.get('author')?.get('nickname'),
      authorAvatar: post.get('author')?.get('avatar')
    }))
  },

  // 创建帖子
  async create(data) {
    const post = new Post()

    // 设置帖子内容
    post.set('content', data.content)
    post.set('type', data.type)
    post.set('images', data.images || [])
    post.set('tags', data.tags || [])

    // 关联作者（需要先登录）
    const author = LC.User.current()
    if (author) {
      post.set('author', LC.User.current())
    }

    // 设置ACL权限
    const acl = new LC.ACL()
    acl.setPublicReadAccess(true) // 所有人可读
    acl.setWriteAccess(LC.User.current(), true) // 只有作者可写
    post.setACL(acl)

    await post.save()
    return { _id: post.id, ...post.toJSON() }
  },

  // 获取帖子详情
  async getDetail(postId) {
    const query = new LC.Query(Post)
    const post = await query.include('author').get(postId)
    return {
      _id: post.id,
      ...post.toJSON(),
      authorName: post.get('author')?.get('nickname'),
      authorAvatar: post.get('author')?.get('avatar')
    }
  },

  // 点赞
  async like(postId) {
    const post = LC.Object.createWithoutData('Post', postId)
    post.increment('likeCount')
    await post.save()
  },

  // 删除帖子
  async delete(postId) {
    const post = LC.Object.createWithoutData('Post', postId)
    await post.destroy()
  }
}

export default Post
