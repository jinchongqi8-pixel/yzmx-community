# 测试users数组

在浏览器Console（F12）运行以下代码检查：

```javascript
// 1. 查看当前登录用户
console.log('当前用户:', JSON.parse(localStorage.getItem('userInfo')))

// 2. 查看所有注册用户
console.log('所有用户:', JSON.parse(localStorage.getItem('users') || '[]'))

// 3. 修复现有用户数据（运行一次即可）
const users = JSON.parse(localStorage.getItem('users') || '[]')
console.log('找到', users.length, '个用户')

// 显示每个用户的详细信息
users.forEach((u, i) => {
  console.log(`用户${i+1}:`, u)
})
```

**如果用户数据丢失了，运行这个修复代码：**

```javascript
// 重新创建用户数据
const posts = JSON.parse(localStorage.getItem('posts') || '[]')
const userMap = new Map()

// 从帖子中收集用户信息
posts.forEach(post => {
  if (post.userId && !userMap.has(post.userId)) {
    userMap.set(post.userId, {
      _id: post.userId,
      phone: post.userId.replace('user_', ''),
      nickname: post.userName,
      avatar: post.userAvatar || '',
      coins: 1000,
      level: 1,
      postsCount: 0
    })
  }
})

const users = Array.from(userMap.values())
localStorage.setItem('users', JSON.stringify(users))
console.log('✅ 已修复，创建了', users.length, '个用户')
console.log('用户列表:', users)

// 如果当前用户不在users中，添加进去
const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
if (currentUser._id && !users.find(u => u._id === currentUser._id)) {
  users.push(currentUser)
  localStorage.setItem('users', JSON.stringify(users))
  console.log('✅ 已添加当前用户到列表')
}

location.reload()
```
