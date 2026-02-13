// 格式化时间为相对时间
export const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'

  let time

  // 处理 ISO 8601 格式字符串 (Supabase 返回格式)
  if (typeof timestamp === 'string') {
    // 如果包含日期分隔符或 T (ISO 格式)，解析为日期
    if (timestamp.includes('-') || timestamp.includes('T')) {
      time = new Date(timestamp).getTime()
    } else if (timestamp.match(/^\d+$/)) {
      // 纯数字字符串
      time = parseInt(timestamp)
    } else {
      // 其他格式，尝试直接解析
      time = new Date(timestamp).getTime()
    }
  } else {
    // 已经是数字或 Date 对象
    time = timestamp instanceof Date ? timestamp.getTime() : timestamp
  }

  // 如果解析失败，返回原始值
  if (isNaN(time)) return timestamp

  const now = Date.now()
  const diff = now - time

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }

  // 小于1天
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }

  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  // 大于7天，显示具体日期
  const date = new Date(time)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const currentYear = new Date().getFullYear()

  if (year === currentYear) {
    return `${month}月${day}日`
  } else {
    return `${year}年${month}月${day}日`
  }
}

// 格式化绝对时间
export const formatAbsoluteTime = (timestamp) => {
  if (!timestamp) return ''

  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const date = new Date(time)

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
