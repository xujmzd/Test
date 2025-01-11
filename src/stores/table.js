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
      try {
        const { data, error } = await supabase
          .from('test1')
          .select('*')
        
        if (error) throw error
        
        this.tableData = data
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
}) 