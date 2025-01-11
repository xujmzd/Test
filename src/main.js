import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase/client'

// 添加更详细的调试信息
console.log('环境变量检查:')
console.log('VITE_SUPABASE_URL 是否存在:', !!import.meta.env.VITE_SUPABASE_URL)
console.log('VITE_SUPABASE_ANON_KEY 是否存在:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase 连接状态:', !!supabase)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app') 