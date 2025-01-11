<template>
  <div class="my-table">
    <h2>我的表格内容</h2>
    
    <!-- 环境信息 -->
    <div v-if="import.meta.env.MODE === 'development'" class="env-info">
      <p>当前环境: {{ import.meta.env.MODE }}</p>
      <p>Supabase URL: {{ import.meta.env.VITE_SUPABASE_URL ? '已配置' : '未配置' }}</p>
      <p>Supabase Key: {{ import.meta.env.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置' }}</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="status-message loading">
      <span class="spinner"></span>
      数据加载中...
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="status-message error">
      <p>加载失败: {{ error }}</p>
      <button @click="retryFetch">重试</button>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="!tableData.length" class="status-message empty">
      暂无数据
    </div>

    <!-- 数据表格 -->
    <table v-else>
      <thead>
        <tr>
          <th v-for="(value, key) in tableData[0]" :key="key">
            {{ key }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in tableData" :key="index">
          <td v-for="(value, key) in row" :key="key">
            {{ value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useTableStore } from '../stores/table'

const store = useTableStore()
const { tableData, loading, error } = storeToRefs(store)

const retryFetch = () => {
  store.fetchTableData()
}

onMounted(() => {
  store.fetchTableData()
})
</script>

<style scoped>
.my-table {
  padding: 20px;
}

.status-message {
  padding: 20px;
  margin: 20px 0;
  border-radius: 4px;
  text-align: center;
}

.loading {
  background-color: #e8f4fd;
  color: #0066cc;
}

.error {
  background-color: #fff2f0;
  color: #cf1322;
}

.empty {
  background-color: #fafafa;
  color: #666;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #0066cc;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #40a9ff;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style> 