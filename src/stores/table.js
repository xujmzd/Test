import { defineStore } from 'pinia'
import { supabase } from '../supabase/client'

export const useTableStore = defineStore('table', {
  state: () => ({
    tableData: [],
    loading: false,
    error: null,
    connectionStatus: null
  }),
  
  actions: {
    async fetchTableData() {
      console.log('=== 开始获取数据 ===')
      this.loading = true
      this.error = null
      
      try {
        console.log('Supabase 实例检查:', !!supabase)
        console.log('开始数据库查询...')
        
        const { data, error } = await supabase
          .from('test1')
          .select('*')
        
        console.log('查询结果:', { data, error })
        
        if (error) {
          throw error
        }
        
        this.tableData = data || []
        console.log('数据已更新:', this.tableData)
        
        if (data && data.length === 0) {
          console.log('查询成功但无数据')
        }

      } catch (e) {
        console.error('数据获取错误:', e)
        this.error = e.message || '数据加载失败'
        
        // 检查具体错误类型
        if (e.message.includes('connection')) {
          this.error = '无法连接到数据库，请检查网络连接'
        } else if (e.message.includes('permission')) {
          this.error = '没有访问权限，请检查数据库配置'
        } else if (e.message.includes('relation "test1" does not exist')) {
          this.error = '数据表 test1 不存在，请先创建表'
        }
      } finally {
        this.loading = false
        console.log('=== 数据获取结束 ===')
      }
    }
  }
}) 