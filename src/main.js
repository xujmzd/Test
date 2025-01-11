import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { supabase } from './supabase/client'

// 应用创建和配置
const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app') 