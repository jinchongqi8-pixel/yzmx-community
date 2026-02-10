// 格式化时间为相对时间
export const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'

  // 如果是字符串且已经是格式化好的时间，直接返回
  if (typeof timestamp === 'string' && !timestamp.match(/^\d+$/)) {
    return timestamp
  }

  // 转换为数字（如果是字符串）
  const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
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
