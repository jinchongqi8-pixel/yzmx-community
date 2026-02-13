import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://sjgohqijynvsnmsadnuk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZ29ocWlqeW52c25tc2FkbnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTcyMjEsImV4cCI6MjA4NjMzMzIyMX0.U4fnNWk31sIyaNYd9qwHEjltxQrZGdefMzJxN7Z2z2k'

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
