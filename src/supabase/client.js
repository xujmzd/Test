import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true
  }
})

// 添加连接测试
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('test1')
      .select('*')
    
    if (error) {
      console.error('数据库连接错误:', error.message)
      return false
    }
    
    console.log('数据库连接成功，数据:', data)
    return true
  } catch (err) {
    console.error('连接测试失败:', err)
    return false
  }
}

testConnection() 