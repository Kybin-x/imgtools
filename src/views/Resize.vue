<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">📐</span>
      <div>
        <h1>批量调整大小</h1>
        <p>按像素或百分比缩放图片，支持锁定宽高比</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>
    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <div class="card ctrl-panel">
        <div class="ctrl-row">
          <div class="chip-tabs">
            <span class="chip" :class="{ active: mode === 'pixel' }" @click="mode = 'pixel'">像素模式</span>
            <span class="chip" :class="{ active: mode === 'percent' }" @click="mode = 'percent'">百分比模式</span>
          </div>
        </div>

        <div class="ctrl-row" v-if="mode === 'pixel'">
          <div class="form-group">
            <label class="form-label">宽度 (px)</label>
            <input type="number" class="form-input" v-model.number="pixW" min="1" max="8000" style="width:120px" @input="onWChange" />
          </div>
          <span style="align-self:flex-end;padding-bottom:8px;color:var(--text3)">×</span>
          <div class="form-group">
            <label class="form-label">高度 (px)</label>
            <input type="number" class="form-input" v-model.number="pixH" min="1" max="8000" style="width:120px" @input="onHChange" />
          </div>
          <div class="form-group" style="align-self:flex-end;padding-bottom:4px">
            <label class="lock-ratio" @click="lockRatio = !lockRatio">
              <span class="lock-icon">{{ lockRatio ? '🔒' : '🔓' }}</span>
              锁定比例
            </label>
          </div>
        </div>

        <div class="ctrl-row" v-else>
          <div class="form-group" style="flex:1">
            <label class="form-label">缩放比例 {{ pct }}%</label>
            <input type="range" min="1" max="200" v-model.number="pct" />
          </div>
          <div class="pct-presets">
            <button class="btn btn-ghost btn-sm" v-for="p in [25,50,75,150,200]" :key="p" @click="pct = p">{{ p }}%</button>
          </div>
        </div>

        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">适配模式</label>
            <select class="form-select" v-model="fitMode">
              <option value="stretch">拉伸填充</option>
              <option value="fit">适合（留白）</option>
              <option value="cover">裁剪填充</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">输出格式</label>
            <select class="form-select" v-model="format">
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          <div class="form-group" style="align-self:flex-end">
            <button class="btn btn-primary" @click="downloadAll" :disabled="processing">
              {{ processing ? '处理中…' : '⬇ 批量下载 ZIP' }}
            </button>
          </div>
        </div>
      </div>

      <div class="img-grid">
        <div class="img-card" v-for="img in images" :key="img.id">
          <img :src="img.url" />
          <button class="img-card-remove" @click="remove(img.id)">✕</button>
          <div class="img-card-badge">{{ outDims(img) }}</div>
          <div class="img-card-info">
            <div class="img-card-name" :title="img.file.name">{{ img.file.name }}</div>
            <div style="font-size:12px;color:var(--text3)">{{ img.nw }} × {{ img.nh }} px</div>
          </div>
        </div>
      </div>

      <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value = '' }" />
      <button class="btn btn-ghost btn-sm" @click="moreInput?.click()">+ 添加更多</button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const mode = ref('pixel')
const pixW = ref(800)
const pixH = ref(600)
const pct = ref(50)
const lockRatio = ref(true)
const fitMode = ref('stretch')
const format = ref('jpeg')
const processing = ref(false)
const moreInput = ref(null)
let uid = 0
let lastW = pixW.value

function addFiles(files) {
  for (const f of files) {
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      images.value.push({ id: ++uid, file: f, url, nw: img.naturalWidth, nh: img.naturalHeight })
    }
    img.src = url
  }
}

function remove(id) { images.value = images.value.filter(i => i.id !== id) }

function onWChange() {
  if (lockRatio.value && images.value.length) {
    const first = images.value[0]
    pixH.value = Math.round(pixW.value * first.nh / first.nw)
  }
}
function onHChange() {
  if (lockRatio.value && images.value.length) {
    const first = images.value[0]
    pixW.value = Math.round(pixH.value * first.nw / first.nh)
  }
}

function outDims(img) {
  if (mode.value === 'percent') {
    return `${Math.round(img.nw * pct.value / 100)}×${Math.round(img.nh * pct.value / 100)}`
  }
  return `${pixW.value}×${pixH.value}`
}

async function resizeOne(img) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      let tw = mode.value === 'percent' ? Math.round(img.nw * pct.value / 100) : pixW.value
      let th = mode.value === 'percent' ? Math.round(img.nh * pct.value / 100) : pixH.value
      const canvas = document.createElement('canvas')
      canvas.width = tw; canvas.height = th
      const ctx = canvas.getContext('2d')
      if (format.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tw, th) }

      if (fitMode.value === 'stretch') {
        ctx.drawImage(image, 0, 0, tw, th)
      } else if (fitMode.value === 'fit') {
        const scale = Math.min(tw / img.nw, th / img.nh)
        const dw = img.nw * scale, dh = img.nh * scale
        ctx.drawImage(image, (tw - dw) / 2, (th - dh) / 2, dw, dh)
      } else {
        const scale = Math.max(tw / img.nw, th / img.nh)
        const dw = img.nw * scale, dh = img.nh * scale
        ctx.drawImage(image, (tw - dw) / 2, (th - dh) / 2, dw, dh)
      }

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
      const blob = await resizeOne(img)
      const base = img.file.name.replace(/\.[^.]+$/, '')
      zip.file(`${base}_resized.${ext}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'resized_images.zip'
    a.click()
    show(`已调整 ${images.value.length} 张图片`, 'success')
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
.pct-presets { display: flex; gap: 6px; align-self: flex-end; flex-wrap: wrap; }
.lock-ratio { display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px; color: var(--text2); padding: 8px 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); }
.lock-icon { font-size: 16px; }
</style>
