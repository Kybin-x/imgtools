<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">🔄</span>
      <div>
        <h1>批量旋转 / 翻转</h1>
        <p>旋转任意角度，水平/垂直翻转，批量处理</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <div class="card ctrl-panel">
        <div class="ctrl-row">
          <div>
            <div class="form-label" style="margin-bottom:8px">快速旋转</div>
            <div class="rotate-btns">
              <button class="btn btn-ghost" @click="angle = (angle + 90) % 360" title="顺时针90°">↻ 90°</button>
              <button class="btn btn-ghost" @click="angle = (angle + 180) % 360" title="旋转180°">↻ 180°</button>
              <button class="btn btn-ghost" @click="angle = (angle + 270) % 360" title="逆时针90°">↺ 90°</button>
              <button class="btn btn-ghost" @click="flipH = !flipH" :class="{ active: flipH }">↔ 水平翻转</button>
              <button class="btn btn-ghost" @click="flipV = !flipV" :class="{ active: flipV }">↕ 垂直翻转</button>
            </div>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">自定义角度 {{ angle }}°</label>
            <input type="range" min="0" max="359" v-model.number="angle" />
          </div>
        </div>
        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">背景颜色（非90°倍数时填充）</label>
            <div class="color-row">
              <input type="color" v-model="bgColor" class="color-input" />
              <button class="btn btn-ghost btn-sm" @click="bgColor = '#ffffff'">白色</button>
              <button class="btn btn-ghost btn-sm" @click="bgColor = '#000000'">黑色</button>
              <button class="btn btn-ghost btn-sm" @click="bgColor = 'transparent'">透明</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">输出格式</label>
            <select class="form-select" v-model="format">
              <option value="jpeg">JPG</option>
              <option value="png">PNG（支持透明）</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          <button class="btn btn-primary" style="align-self:flex-end" @click="downloadAll" :disabled="processing">
            {{ processing ? '处理中…' : '⬇ 批量下载 ZIP' }}
          </button>
        </div>
        <div class="current-setting">
          当前变换:
          <strong>旋转 {{ angle }}°</strong>
          <span v-if="flipH"> + 水平翻转</span>
          <span v-if="flipV"> + 垂直翻转</span>
          <button class="btn btn-ghost btn-sm" style="margin-left:auto" @click="reset">重置</button>
        </div>
      </div>

      <div class="img-grid">
        <div class="img-card" v-for="img in images" :key="img.id">
          <div class="preview-wrap">
            <img :src="img.url" :style="previewStyle" />
          </div>
          <button class="img-card-remove" @click="remove(img.id)">✕</button>
          <div class="img-card-info">
            <div class="img-card-name" :title="img.file.name">{{ img.file.name }}</div>
            <div style="font-size:12px;color:var(--text3)">{{ img.nw }} × {{ img.nh }} px</div>
          </div>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm" @click="moreInput?.click()">+ 添加更多</button>
      <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value = '' }" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const angle = ref(0)
const flipH = ref(false)
const flipV = ref(false)
const bgColor = ref('#ffffff')
const format = ref('jpeg')
const processing = ref(false)
const moreInput = ref(null)
let uid = 0

const previewStyle = computed(() => ({
  transform: `rotate(${angle.value}deg) scaleX(${flipH.value ? -1 : 1}) scaleY(${flipV.value ? -1 : 1})`,
  transition: 'transform .3s ease',
}))

function addFiles(files) {
  for (const f of files) {
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => images.value.push({ id: ++uid, file: f, url, nw: img.naturalWidth, nh: img.naturalHeight })
    img.src = url
  }
}

function remove(id) { images.value = images.value.filter(i => i.id !== id) }

function reset() { angle.value = 0; flipH.value = false; flipV.value = false }

async function rotateOne(img) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const rad = (angle.value * Math.PI) / 180
      const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad))
      const w = img.nw * cos + img.nh * sin
      const h = img.nw * sin + img.nh * cos
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(w); canvas.height = Math.round(h)
      const ctx = canvas.getContext('2d')
      if (bgColor.value !== 'transparent') { ctx.fillStyle = bgColor.value; ctx.fillRect(0, 0, canvas.width, canvas.height) }
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)
      ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)
      ctx.drawImage(image, -img.nw / 2, -img.nh / 2)
      ctx.restore()
      const mime = format.value === 'jpeg' ? 'image/jpeg' : format.value === 'webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(blob => resolve(blob), mime, format.value === 'png' ? undefined : 0.92)
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
      const blob = await rotateOne(img)
      const base = img.file.name.replace(/\.[^.]+$/, '')
      zip.file(`${base}_rotated.${ext}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'rotated_images.zip'
    a.click()
    show(`已处理 ${images.value.length} 张图片`, 'success')
  } catch (e) {
    show('处理失败: ' + e.message, 'error')
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.ctrl-panel { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.ctrl-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
.rotate-btns { display: flex; gap: 8px; flex-wrap: wrap; }
.rotate-btns .btn.active { background: rgba(108,99,255,.2); border-color: var(--accent); color: var(--accent2); }
.color-row { display: flex; gap: 8px; align-items: center; }
.color-input { width: 40px; height: 34px; padding: 2px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
.current-setting { font-size: 13px; color: var(--text2); display: flex; align-items: center; gap: 8px; background: var(--bg3); border-radius: var(--radius-sm); padding: 10px 14px; }
.preview-wrap { width: 100%; height: 160px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #111; }
.preview-wrap img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style>
