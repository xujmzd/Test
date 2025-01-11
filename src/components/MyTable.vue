<template>
  <div class="my-table">
    <h2>我的表格内容</h2>
    
    <!-- 上传组件 -->
    <div class="upload-section">
      <input 
        type="file" 
        @change="handleFileUpload" 
        accept="image/*"
        ref="fileInput"
      >
      <button @click="uploadImage" :disabled="!selectedFile || uploading">
        {{ uploading ? '上传中...' : '上传图片' }}
      </button>
    </div>

    <!-- 表格显示 -->
    <table v-if="tableData.length">
      <thead>
        <tr>
          <th>图片</th>
          <th>文件名</th>
          <th>URL</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableData" :key="index">
          <td>
            <img 
              :src="item.url" 
              :alt="item.filename"
              class="thumbnail"
            >
          </td>
          <td>{{ item.filename }}</td>
          <td>{{ item.url }}</td>
          <td>{{ formatDate(item.created_at) }}</td>
          <td>
            <button @click="deleteImage(item.public_id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="loading" class="status-message loading">
      <span class="spinner"></span>
      加载中...
    </div>

    <div v-else class="status-message empty">
      暂无图片数据
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { cloudinary } from '../cloudinary/client'
import { supabase } from '../supabase/client'

const tableData = ref([])
const loading = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)
const fileInput = ref(null)

// 处理文件选择
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

// 上传图片
const uploadImage = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('upload_preset', 'ml_default') // 使用默认的 upload preset
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    const data = await response.json()
    console.log('Cloudinary response:', data) // 添加调试信息

    // 保存记录到Supabase
    await supabase.from('images').insert([
      {
        public_id: data.public_id,
        url: data.secure_url,
        filename: selectedFile.value.name,
        format: data.format
      }
    ])

    // 刷新列表
    await fetchImages()
    
    // 清理表单
    selectedFile.value = null
    fileInput.value.value = ''
  } catch (error) {
    console.error('上传失败:', error)
  } finally {
    uploading.value = false
  }
}

// 获取图片列表
const fetchImages = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    tableData.value = data
  } catch (error) {
    console.error('获取图片列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 删除图片
const deleteImage = async (publicId) => {
  try {
    // 从Cloudinary删除
    await fetch('/api/deleteImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_id: publicId })
    })

    // 从Supabase删除记录
    await supabase
      .from('images')
      .delete()
      .match({ public_id: publicId })

    // 刷新列表
    await fetchImages()
  } catch (error) {
    console.error('删除失败:', error)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  fetchImages()
})
</script>

<style scoped>
.my-table {
  padding: 20px;
}

.upload-section {
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  text-align: center;
}

.thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.status-message {
  padding: 20px;
  margin: 20px 0;
  border-radius: 4px;
  text-align: center;
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

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #1890ff;
  color: white;
  cursor: pointer;
  margin: 0 5px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #40a9ff;
}

.loading {
  background-color: #e8f4fd;
  color: #0066cc;
}

.empty {
  background-color: #fafafa;
  color: #666;
}
</style> 