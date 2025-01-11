import { defineStore } from 'pinia'
import { supabase } from '../supabase/client'

export const useTableStore = defineStore('table', {
  state: () => ({
    tableData: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchTableData() {
      this.loading = true
      this.error = null
      
      try {
        // 检查 Supabase 连接
        if (!supabase) {
          throw new Error('数据库连接未初始化')
        }

        const { data, error } = await supabase
          .from('test1')
          .select('*')
        
        if (error) {
          throw error
        }
        
        this.tableData = data || []
        
        if (data && data.length === 0) {
          console.log('查询成功但无数据')
        }

      } catch (e) {
        console.error('数据获取错误:', e)
        this.error = e.message || '数据加载失败'
        
        // 检查具体错误类型
        if (e.message.includes('连接')) {
          this.error = '无法连接到数据库，请检查网络连接'
        } else if (e.message.includes('权限')) {
          this.error = '没有访问权限，请检查数据库配置'
        }
      } finally {
        this.loading = false
      }
    }
  }
}) 