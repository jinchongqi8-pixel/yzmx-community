/**
 * 添加金币流水记录
 * @param {string} userId - 用户ID
 * @param {string} type - 类型：'income'（收入）或 'expense'（支出）
 * @param {number} amount - 金额
 * @param {string} title - 标题
 * @param {string} description - 详细描述
 */
export function addGoldLog(userId, type, amount, title, description) {
  try {
    // 获取现有流水
    const logs = JSON.parse(localStorage.getItem('gold_logs') || '[]')

    // 创建新记录
    const newLog = {
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId,
      type, // 'income' 或 'expense'
      amount,
      title,
      description,
      createdAt: new Date().toISOString()
    }

    // 添加到数组开头（最新的在前面）
    logs.unshift(newLog)

    // 保存到 localStorage
    localStorage.setItem('gold_logs', JSON.stringify(logs))

    console.log('✅ 金币流水已记录:', newLog)
    return true
  } catch (error) {
    console.error('❌ 记录金币流水失败:', error)
    return false
  }
}

/**
 * 获取用户的金币流水
 * @param {string} userId - 用户ID
 * @returns {Array} 金币流水数组
 */
export function getUserGoldLogs(userId) {
  try {
    const allLogs = JSON.parse(localStorage.getItem('gold_logs') || '[]')
    return allLogs.filter(log => log.userId === userId)
  } catch (error) {
    console.error('获取金币流水失败:', error)
    return []
  }
}

// 金币流水类型常量
export const GoldLogTypes = {
  INCOME: 'income',
  EXPENSE: 'expense'
}

// 金币流水标题常量
export const GoldLogTitles = {
  // 收入类
  CHECKIN_REWARD: '每日签到',
  POST_REWARD: '发帖奖励',
  LIKE_REWARD: '获赞奖励',
  COMMENT_REWARD: '评论奖励',
  ADMIN_GRANT: '管理员发放',

  // 支出类
  BUY_COURSE: '购买课程',
  CONSUME: '金币消费'
}
