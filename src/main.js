import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase/client'

// 添加调试信息
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase 连接状态:', !!supabase)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app') 