<template>
  <div class="my-table">
    <h2>我的媒体内容</h2>
    
    <!-- 上传组件 -->
    <div class="upload-section">
      <input 
        type="file" 
        @change="handleFileUpload" 
        accept="image/*,video/*"
        ref="fileInput"
      >
      <button @click="uploadMedia" :disabled="!selectedFile || uploading">
        {{ uploading ? '上传中...' : '上传文件' }}
      </button>
    </div>

    <!-- 表格显示 -->
    <table v-if="tableData.length">
      <thead>
        <tr>
          <th>预览</th>
          <th>类型</th>
          <th>文件名</th>
          <th>URL</th>
          <th>上传时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in tableData" :key="index">
          <td class="preview-cell">
            <!-- 图片预览 -->
            <img 
              v-if="isImage(item.format)"
              :src="item.url" 
              :alt="item.filename"
              class="thumbnail"
            >
            <!-- 视频预览 -->
            <div v-else class="video-container">
              <video
                class="video-player"
                controls
                :src="item.url"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </td>
          <td>{{ getMediaType(item.format) }}</td>
          <td>{{ item.filename }}</td>
          <td>{{ item.url }}</td>
          <td>{{ formatDate(item.created_at) }}</td>
          <td>
            <button @click="deleteMedia(item.public_id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="loading" class="status-message loading">
      <span class="spinner"></span>
      加载中...
    </div>

    <div v-else class="status-message empty">
      暂无媒体数据
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { cloudinary } from '../cloudinary/client'
import { supabase } from '../supabase/client'

const tableData = ref([])
const loading = ref(false)
const selectedFile = ref(null)
const uploading = ref(false)
const fileInput = ref(null)
const videoPlayer = ref([])
const isPlaying = reactive({})  // 跟踪每个视频的播放状态

// 处理文件选择
const handleFileUpload = (event) => {
  selectedFile.value = event.target.files[0]
}

// 检查是否为图片
const isImage = (format) => {
  const imageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  return imageFormats.includes(format?.toLowerCase())
}

// 检查是否为视频
const isVideo = (format) => {
  const videoFormats = ['mp4', 'webm', 'ogg', 'mov', 'MP4', 'WEBM', 'OGG', 'MOV']
  return videoFormats.includes(format)
}

// 获取媒体类型显示文本
const getMediaType = (format) => {
  if (isImage(format)) return '图片'
  if (isVideo(format)) return '视频'
  return '未知类型'
}

// 上传媒体文件
const uploadMedia = async () => {
  if (!selectedFile.value) return
  
  uploading.value = true
  try {
    // 1. 上传到 Cloudinary
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('upload_preset', 'ml_default')
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY)
    formData.append('resource_type', 'auto') // 自动检测资源类型

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData
      }
    )

    const cloudinaryData = await response.json()
    console.log('Cloudinary 返回数据:', cloudinaryData)

    if (cloudinaryData.error) {
      throw new Error(cloudinaryData.error.message)
    }

    // 2. 将媒体信息保存到 Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('media')
      .insert([
        {
          public_id: cloudinaryData.public_id,
          url: cloudinaryData.secure_url,
          filename: selectedFile.value.name,
          format: cloudinaryData.format,
          resource_type: cloudinaryData.resource_type
        }
      ])
      .select()

    if (supabaseError) {
      throw new Error('保存到数据库失败: ' + supabaseError.message)
    }

    console.log('保存到 Supabase 成功:', supabaseData)

    // 3. 刷新列表
    await fetchMedia()
    
    // 4. 清理表单
    selectedFile.value = null
    fileInput.value.value = ''
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败: ' + error.message)
  } finally {
    uploading.value = false
  }
}

// 获取媒体列表
const fetchMedia = async () => {
  loading.value = true
  try {
    console.log('开始获取媒体列表...')
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取数据错误:', error)
      throw error
    }

    console.log('获取到的数据:', data)
    tableData.value = data || []
    
  } catch (error) {
    console.error('获取媒体列表失败:', error)
    alert('获取媒体列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

// 删除媒体
const deleteMedia = async (publicId) => {
  try {
    // 1. 从 Cloudinary 删除
    const deleteResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/resources/image/upload/${publicId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
          timestamp: Math.round(new Date().getTime() / 1000),
        })
      }
    )

    const cloudinaryResult = await deleteResponse.json()
    console.log('Cloudinary 删除结果:', cloudinaryResult)

    // 2. 从 Supabase 删除记录
    const { error: supabaseError } = await supabase
      .from('media')
      .delete()
      .match({ public_id: publicId })

    if (supabaseError) {
      throw new Error('从数据库删除失败: ' + supabaseError.message)
    }

    // 3. 刷新列表
    await fetchMedia()
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败: ' + error.message)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// 生成视频缩略图URL
const generateThumbnail = (videoUrl) => {
  // 使用 Cloudinary 的视频缩略图功能
  return videoUrl.replace('/upload/', '/upload/w_400,h_300,c_fill,so_0/')
}

// 切换视频播放状态
const togglePlay = (index) => {
  const video = videoPlayer.value[index]
  if (video) {
    if (video.paused) {
      // 停止所有其他视频
      Object.keys(isPlaying).forEach(key => {
        if (key !== index.toString()) {
          const otherVideo = videoPlayer.value[key]
          if (otherVideo && !otherVideo.paused) {
            otherVideo.pause()
            isPlaying[key] = false
          }
        }
      })
      // 播放当前视频
      video.play()
      isPlaying[index] = true
    } else {
      video.pause()
      isPlaying[index] = false
    }
  }
}

// 监听视频结束事件
const setupVideoListeners = () => {
  videoPlayer.value.forEach((video, index) => {
    if (video) {
      video.addEventListener('ended', () => {
        isPlaying[index] = false
      })
    }
  })
}

onMounted(() => {
  fetchMedia()
  setupVideoListeners()
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
  width: 200px;
  height: auto;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
  background-color: #f0f0f0;
}

/* 视频预览样式 */
video.thumbnail {
  background-color: #000;
  min-height: 150px;
  display: block;
}

/* 视频控制器样式 */
video::-webkit-media-controls {
  background-color: rgba(0, 0, 0, 0.5);
}

video::-webkit-media-controls-panel {
  display: flex !important;
  opacity: 1 !important;
}

/* 表格单元格样式 */
td {
  vertical-align: top;
  padding: 12px !important;
}

/* 预览单元格样式 */
td:first-child {
  width: 220px;
  text-align: center;
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

.preview-cell {
  width: 320px;
  padding: 10px;
  text-align: center;
}

.video-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.video-player {
  width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 4px;
}

/* 播放按钮覆盖层 */
.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.5);
}

.play-button {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
}

.play-button:hover {
  transform: scale(1.1);
}

.play-icon {
  font-size: 24px;
  color: #000;
  margin-left: 5px; /* 稍微调整播放图标的位置 */
}

/* 视频控件样式 */
video::-webkit-media-controls {
  opacity: 0;
  transition: opacity 0.3s;
}

.video-container:hover video::-webkit-media-controls {
  opacity: 1;
}

/* 确保视频有默认封面背景 */
video[poster] {
  object-fit: cover;
  background-size: cover;
  background-position: center;
}
</style> 