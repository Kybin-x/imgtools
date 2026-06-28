<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">🔁</span>
      <div>
        <h1>批量格式转换</h1>
        <p>JPG / PNG / WebP 互转，支持透明通道，质量可调</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <div class="card ctrl-panel">
        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">转换为</label>
            <div class="format-btns">
              <button v-for="f in formats" :key="f.v" class="fmt-btn" :class="{ active: format === f.v }" @click="format = f.v">
                <span class="fmt-icon">{{ f.icon }}</span>
                <strong>{{ f.label }}</strong>
                <span class="fmt-desc">{{ f.desc }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="ctrl-row" v-if="format !== 'png'">
          <div class="form-group" style="flex:1">
            <label class="form-label">输出质量 {{ quality }}%</label>
            <input type="range" min="1" max="100" v-model.number="quality" />
          </div>
        </div>

        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">文件名模板</label>
            <input type="text" class="form-input" v-model="nameTemplate" placeholder="{name}_converted" style="width:220px" />
            <div style="font-size:11px;color:var(--text3);margin-top:4px">{name} = 原文件名</div>
          </div>
          <button class="btn btn-ghost btn-sm" style="align-self:flex-end" @click="images = []">清空</button>
          <button class="btn btn-ghost btn-sm" style="align-self:flex-end" @click="moreInput?.click()">+ 添加更多</button>
          <button class="btn btn-primary" style="align-self:flex-end" @click="downloadAll" :disabled="processing">
            {{ processing ? '转换中…' : '⬇ 批量转换 ZIP' }}
          </button>
        </div>
      </div>

      <div class="convert-table">
        <div class="table-header">
          <span>文件</span><span>原格式</span><span>原大小</span><span>转换为</span><span>操作</span>
        </div>
        <div class="table-row" v-for="img in images" :key="img.id">
          <div class="file-cell">
            <img :src="img.url" class="thumb" />
            <span class="img-card-name">{{ img.file.name }}</span>
          </div>
          <span class="tag" style="background:var(--bg3);color:var(--text2)">{{ img.origExt }}</span>
          <span style="font-size:13px;color:var(--text2)">{{ fmtSize(img.file.size) }}</span>
          <span class="tag" :style="fmtTagStyle">{{ format.toUpperCase() }}</span>
          <button class="btn btn-ghost btn-sm" @click="remove(img.id)">✕ 移除</button>
        </div>
      </div>

      <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value='' }" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const format = ref('webp')
const quality = ref(85)
const nameTemplate = ref('{name}')
const processing = ref(false)
const moreInput = ref(null)
let uid = 0

const formats = [
  { v: 'jpeg', label: 'JPG', icon: '🖼️', desc: '最广泛' },
  { v: 'png',  label: 'PNG', icon: '🔷', desc: '无损透明' },
  { v: 'webp', label: 'WebP', icon: '⚡', desc: '体积最小' },
]

const fmtTagStyle = computed(() => {
  const colors = { jpeg: '#f59e0b', png: '#60a5fa', webp: '#34d399' }
  const c = colors[format.value] || '#9ca3af'
  return { background: `${c}20`, color: c }
})

function fmtSize(bytes) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

function addFiles(files) {
  for (const f of files) {
    const ext = f.name.split('.').pop()?.toUpperCase() || '?'
    images.value.push({ id: ++uid, file: f, url: URL.createObjectURL(f), origExt: ext })
  }
}

function remove(id) { images.value = images.value.filter(i => i.id !== id) }

async function convertOne(img) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (format.value === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
      ctx.drawImage(image, 0, 0)
      const mime = format.value === 'jpeg' ? 'image/jpeg' : format.value === 'webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(blob => resolve(blob), mime, format.value === 'png' ? undefined : quality.value / 100)
    }
    image.src = img.url
  })
}

async function downloadAll() {
  processing.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const ext = format.value === 'jpeg' ? 'jpg' : format.value
    for (const img of images.value) {
      const blob = await convertOne(img)
      const base = img.file.name.replace(/\.[^.]+$/, '')
      const outName = nameTemplate.value.replace('{name}', base) + '.' + ext
      zip.file(outName, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = `converted_${format.value}.zip`
    a.click()
    show(`已转换 ${images.value.length} 张图片为 ${format.value.toUpperCase()}`, 'success')
  } catch (e) {
    show('转换失败: ' + e.message, 'error')
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.ctrl-panel { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.ctrl-row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; }
.format-btns { display: flex; gap: 10px; }
.fmt-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 20px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: var(--radius); cursor: pointer; transition: all .15s; min-width: 90px;
}
.fmt-btn:hover { border-color: var(--text3); }
.fmt-btn.active { background: rgba(108,99,255,.15); border-color: var(--accent); }
.fmt-icon { font-size: 22px; }
.fmt-btn strong { font-size: 14px; color: var(--text); }
.fmt-desc { font-size: 11px; color: var(--text3); }
.convert-table { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.table-header { display: grid; grid-template-columns: 1fr 80px 80px 80px 100px; gap: 12px; padding: 10px 16px; background: var(--bg3); font-size: 12px; color: var(--text3); font-weight: 600; }
.table-row { display: grid; grid-template-columns: 1fr 80px 80px 80px 100px; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--border); align-items: center; }
.table-row:hover { background: var(--bg3); }
.file-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
.thumb { width: 36px; height: 36px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.img-card-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
