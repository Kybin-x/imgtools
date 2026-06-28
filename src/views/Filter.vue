<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">🎨</span>
      <div>
        <h1>图片滤镜</h1>
        <p>亮度、对比度、饱和度等调整，实时预览</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <div class="filter-layout">
        <!-- Controls -->
        <div class="card settings-panel">
          <div class="preset-strip">
            <button v-for="p in presets" :key="p.name" class="preset-btn" :class="{ active: activePreset === p.name }" @click="applyPreset(p)">
              {{ p.icon }}<span>{{ p.name }}</span>
            </button>
          </div>

          <div v-for="ctrl in controls" :key="ctrl.key" class="form-group">
            <label class="form-label" style="display:flex;justify-content:space-between">
              {{ ctrl.label }}
              <span style="color:var(--accent2)">{{ fmtVal(ctrl) }}</span>
            </label>
            <input type="range" :min="ctrl.min" :max="ctrl.max" :step="ctrl.step" v-model.number="filters[ctrl.key]" @input="activePreset = ''" />
          </div>

          <div class="ctrl-row" style="margin-top:4px">
            <button class="btn btn-ghost btn-sm" @click="resetFilters">重置</button>
            <div class="form-group" style="flex:1">
              <label class="form-label">输出格式</label>
              <select class="form-select" v-model="format">
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <button class="btn btn-primary" @click="downloadAll" :disabled="processing">
              {{ processing ? '处理中…' : '⬇ 批量下载' }}
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div class="preview-area">
          <div class="before-after" v-if="images.length">
            <div class="ba-item">
              <div class="ba-label">原图</div>
              <img :src="images[0].url" class="ba-img" />
            </div>
            <div class="ba-item">
              <div class="ba-label">效果预览</div>
              <img :src="images[0].url" class="ba-img" :style="cssFilter" />
            </div>
          </div>

          <div class="img-list-mini">
            <div v-for="img in images" :key="img.id" class="mini-card">
              <img :src="img.url" :style="cssFilter" />
              <button class="mini-remove" @click="remove(img.id)">✕</button>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" @click="moreInput?.click()">+ 添加更多</button>
          <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value='' }" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const format = ref('jpeg')
const processing = ref(false)
const moreInput = ref(null)
const activePreset = ref('')
let uid = 0

const filters = ref({ brightness: 100, contrast: 100, saturation: 100, hueRotate: 0, blur: 0, opacity: 100, sepia: 0, grayscale: 0, invert: 0 })

const controls = [
  { key: 'brightness',  label: '亮度',    min: 0,  max: 200, step: 1,   unit: '%' },
  { key: 'contrast',    label: '对比度',  min: 0,  max: 200, step: 1,   unit: '%' },
  { key: 'saturation',  label: '饱和度',  min: 0,  max: 200, step: 1,   unit: '%' },
  { key: 'hueRotate',   label: '色相旋转', min: 0,  max: 360, step: 1,   unit: '°' },
  { key: 'blur',        label: '模糊',    min: 0,  max: 20,  step: 0.5, unit: 'px' },
  { key: 'sepia',       label: '复古',    min: 0,  max: 100, step: 1,   unit: '%' },
  { key: 'grayscale',   label: '灰度',    min: 0,  max: 100, step: 1,   unit: '%' },
  { key: 'invert',      label: '反色',    min: 0,  max: 100, step: 1,   unit: '%' },
]

function fmtVal(ctrl) { return filters.value[ctrl.key] + ctrl.unit }

const presets = [
  { name: '原图', icon: '🖼️', f: { brightness:100, contrast:100, saturation:100, hueRotate:0, blur:0, sepia:0, grayscale:0, invert:0, opacity:100 } },
  { name: '灰度', icon: '⬜', f: { brightness:100, contrast:110, saturation:0,   hueRotate:0, blur:0, sepia:0, grayscale:100, invert:0, opacity:100 } },
  { name: '复古', icon: '📷', f: { brightness:105, contrast:90,  saturation:70,  hueRotate:0, blur:0, sepia:60, grayscale:0, invert:0, opacity:100 } },
  { name: '冷色', icon: '❄️', f: { brightness:95,  contrast:105, saturation:90,  hueRotate:200, blur:0, sepia:0, grayscale:0, invert:0, opacity:100 } },
  { name: '暖色', icon: '🌅', f: { brightness:108, contrast:100, saturation:120, hueRotate:20,  blur:0, sepia:20, grayscale:0, invert:0, opacity:100 } },
  { name: '高对比', icon: '⚡', f: { brightness:100, contrast:175, saturation:110, hueRotate:0, blur:0, sepia:0, grayscale:0, invert:0, opacity:100 } },
  { name: '朦胧', icon: '🌫️', f: { brightness:110, contrast:80,  saturation:80,  hueRotate:0, blur:2, sepia:0, grayscale:0, invert:0, opacity:100 } },
  { name: '反色', icon: '🔄', f: { brightness:100, contrast:100, saturation:100, hueRotate:0, blur:0, sepia:0, grayscale:0, invert:100, opacity:100 } },
]

function applyPreset(p) {
  Object.assign(filters.value, p.f)
  activePreset.value = p.name
}

function resetFilters() {
  Object.assign(filters.value, presets[0].f)
  activePreset.value = '原图'
}

const cssFilter = computed(() => {
  const f = filters.value
  return {
    filter: [
      `brightness(${f.brightness}%)`,
      `contrast(${f.contrast}%)`,
      `saturate(${f.saturation}%)`,
      `hue-rotate(${f.hueRotate}deg)`,
      `blur(${f.blur}px)`,
      `sepia(${f.sepia}%)`,
      `grayscale(${f.grayscale}%)`,
      `invert(${f.invert}%)`,
      `opacity(${f.opacity}%)`,
    ].join(' ')
  }
})

function addFiles(files) {
  for (const f of files) images.value.push({ id: ++uid, file: f, url: URL.createObjectURL(f) })
}
function remove(id) { images.value = images.value.filter(i => i.id !== id) }

async function applyFilterToImage(img) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      const f = filters.value
      ctx.filter = [
        `brightness(${f.brightness}%)`, `contrast(${f.contrast}%)`, `saturate(${f.saturation}%)`,
        `hue-rotate(${f.hueRotate}deg)`, `blur(${f.blur}px)`, `sepia(${f.sepia}%)`,
        `grayscale(${f.grayscale}%)`, `invert(${f.invert}%)`, `opacity(${f.opacity}%)`,
      ].join(' ')
      ctx.drawImage(image, 0, 0)
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
      const blob = await applyFilterToImage(img)
      const base = img.file.name.replace(/\.[^.]+$/, '')
      zip.file(`${base}_filtered.${ext}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'filtered_images.zip'
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
.filter-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .filter-layout { grid-template-columns: 1fr; } }
.settings-panel { padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.preset-strip { display: flex; flex-wrap: wrap; gap: 6px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
.preset-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 8px 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; font-size: 11px; color: var(--text2); cursor: pointer; transition: all .15s; }
.preset-btn:hover { border-color: var(--text3); color: var(--text); }
.preset-btn.active { background: rgba(108,99,255,.15); border-color: var(--accent); color: var(--accent2); }
.preset-btn span { white-space: nowrap; }
.ctrl-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.preview-area { display: flex; flex-direction: column; gap: 12px; }
.before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ba-item { display: flex; flex-direction: column; gap: 6px; }
.ba-label { font-size: 12px; color: var(--text3); }
.ba-img { width: 100%; max-height: 280px; object-fit: contain; border-radius: var(--radius); border: 1px solid var(--border); background: #111; }
.img-list-mini { display: flex; flex-wrap: wrap; gap: 8px; }
.mini-card { position: relative; width: 80px; }
.mini-card img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; display: block; }
.mini-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s; }
.mini-card:hover .mini-remove { opacity: 1; }
</style>
