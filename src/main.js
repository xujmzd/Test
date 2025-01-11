import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase/client'

// 添加错误处理
window.onerror = function(msg, url, line, col, error) {
  console.error('全局错误:', { msg, url, line, col, error })
  return false
}

window.addEventListener('unhandledrejection', function(event) {
  console.error('未处理的Promise错误:', event.reason)
})

// 环境变量检查
console.log('环境变量检查:')
console.log('VITE_SUPABASE_URL 是否存在:', !!import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY 是否存在:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase 连接状态:', !!supabase)

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue错误:', err)
  console.error('错误信息:', info)
}

app.use(createPinia())
app.use(router)
app.mount('#app') 