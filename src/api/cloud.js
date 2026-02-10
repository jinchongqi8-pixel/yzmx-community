import axios from 'axios'

// 云函数调用配置
const CLOUD_BASE_URL = 'https://cloud1-3gbg37ws97a236f6.wx.cloudrun.cloud/weapp'
const ENV_ID = 'cloud1-3gbg37ws97a236f6'

// 创建 axios 实例
const request = axios.create({
  baseURL: CLOUD_BASE_URL,
  timeout: 30000
})

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['X-Token'] = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    return res
  },
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

/**
 * 调用云函数
 * @param {string} name - 云函数名称
 * @param {object} data - 传递的数据
 */
export async function callCloudFunction(name, data = {}) {
  try {
    // 调用云开发 HTTP API
    const response = await request.post(`/${name}`, data)
    return response
  } catch (error) {
    console.error(`云函数 ${name} 调用失败:`, error)
    throw error
  }
}

// 登录相关 API
export async function sendSmsCode(phone) {
  // ⚠️ 开发模式：模拟发送成功
  console.log('[开发模式] 模拟发送验证码到:', phone)
  console.log('[开发模式] 测试验证码: 123456')

  return {
    code: 0,
    message: '验证码已发送（开发模式）'
  }

  // 生产环境：调用真实云函数
  // return await callCloudFunction('login', {
  //   action: 'sendSmsCode',
  //   phone
  // })
}

export async function phoneLogin(phone, code) {
  // ⚠️ 开发模式：接受任意验证码
  console.log('[开发模式] 手机号登录:', { phone, code })

  if (!code || code.length !== 6) {
    throw new Error('请输入6位验证码')
  }

  // 返回模拟数据
  return {
    code: 0,
    message: '登录成功（开发模式）',
    openid: phone,
    userInfo: {
      _id: 'mock_' + Date.now(),
      phone: phone,
      nickname: '用户' + phone.substr(-4),
      avatar: '',
      coins: 100,
      level: 1
    }
  }

  // 生产环境：调用真实云函数
  // return await callCloudFunction('login', {
  //   action: 'phoneLogin',
  //   phone,
  //   code
  // })
}

// 课程相关 API
export async function getCourseList(params) {
  return await callCloudFunction('course', {
    action: 'getList',
    ...params
  })
}

export async function getCourseDetail(courseId) {
  return await callCloudFunction('course', {
    action: 'getDetail',
    courseId
  })
}

// 社群相关 API
export async function getPostList(params) {
  return await callCloudFunction('community', {
    action: 'getPostList',
    ...params
  })
}

export async function getPostDetail(postId) {
  return await callCloudFunction('community', {
    action: 'getPostDetail',
    postId
  })
}

export async function createPost(data) {
  return await callCloudFunction('community', {
    action: 'createPost',
    ...data
  })
}

export default callCloudFunction
