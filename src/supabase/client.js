import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sjgohqijynvsnmsadnuk.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_85Z8wPe8Cogbz8IzkMTAMg_VjIe8fgE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 数据库表名常量
export const TABLES = {
  PROFILES: 'profiles',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FOLLOWS: 'follows',
  COURSES: 'courses',
  COURSE_PURCHASES: 'course_purchases'
}
