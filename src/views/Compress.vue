<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">🗜️</span>
      <div>
        <h1>批量压缩图片</h1>
        <p>调整质量参数，实时预览对比效果，本地处理无需上传</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="reset">↩ 重新选择</button>
      </div>
    </div>

    <!-- Drop zone -->
    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <!-- Settings bar -->
      <div class="card ctrl-panel">
        <div class="ctrl-row">
          <div class="form-group" style="flex:1;min-width:200px">
            <label class="form-label">压缩质量 <strong style="color:var(--accent2)">{{ quality }}%</strong></label>
            <input type="range" min="1" max="99" v-model.number="quality" @change="onQualityChange" />
            <div class="quality-hints"><span>强力压缩</span><span>平衡</span><span>高画质</span></div>
          </div>
          <div class="form-group">
            <label class="form-label">输出格式</label>
            <select class="form-select" v-model="format" style="width:160px" @change="onQualityChange">
              <option value="jpeg">JPG（最小体积）</option>
              <option value="webp">WebP（推荐）</option>
              <option value="png">PNG（无损）</option>
            </select>
          </div>
          <div class="stat-chip">
            <span>原始</span>
            <strong>{{ fmtSize(totalOriginal) }}</strong>
          </div>
          <div class="stat-chip success" v-if="previewReady">
            <span>压缩后</span>
            <strong>{{ fmtSize(totalCompressed) }}</strong>
            <span class="save-badge" v-if="saving > 0">-{{ saving }}%</span>
          </div>
          <button class="btn btn-ghost btn-sm" @click="addMore">+ 添加</button>
          <button class="btn btn-danger btn-sm" @click="reset">清空</button>
          <button class="btn btn-primary" @click="previewAll" :disabled="previewing">
            {{ previewing ? '生成预览…' : previewReady ? '🔄 重新预览' : '👁 预览效果' }}
          </button>
          <button class="btn btn-primary" @click="downloadAll" :disabled="!previewReady || processing" style="background:var(--success);color:#000">
            {{ processing ? '打包中…' : '⬇ 下载 ZIP' }}
          </button>
        </div>
      </div>

      <!-- Preview grid: before/after per image -->
      <div class="preview-grid">
        <div v-for="img in images" :key="img.id" class="preview-card card">
          <!-- Header -->
          <div class="preview-card-header">
            <span class="preview-name" :title="img.file.name">{{ img.file.name }}</span>
            <button class="img-card-remove" style="position:static;opacity:1;width:20px;height:20px;font-size:11px" @click="remove(img.id)">✕</button>
          </div>

          <!-- Before / After images -->
          <div class="ba-row">
            <div class="ba-panel">
              <div class="ba-label">原图</div>
              <img :src="img.url" class="ba-img" />
              <div class="ba-size">{{ fmtSize(img.origSize) }}</div>
            </div>
            <div class="ba-divider">→</div>
            <div class="ba-panel">
              <div class="ba-label">压缩后</div>
              <div v-if="!img.previewUrl" class="ba-placeholder">
                <span>{{ previewing ? '生成中…' : '点击「预览效果」' }}</span>
              </div>
              <img v-else :src="img.previewUrl" class="ba-img" />
              <div class="ba-size success" v-if="img.compressedSize">
                {{ fmtSize(img.compressedSize) }}
                <span class="save-badge" v-if="img.savePct > 0">-{{ img.savePct }}%</span>
              </div>
              <div class="ba-size muted" v-else-if="!img.previewUrl">—</div>
            </div>
          </div>

          <!-- Slider comparison (shown after preview) -->
          <div class="slider-compare" v-if="img.previewUrl" @mousemove="onSlide($event, img)" @touchmove.prevent="onSlideTouch($event, img)" ref="compareRefs">
            <img :src="img.url" class="compare-base" />
            <div class="compare-overlay" :style="{ width: (img.sliderPct ?? 50) + '%' }">
              <img :src="img.previewUrl" class="compare-top" />
            </div>
            <div class="compare-handle" :style="{ left: (img.sliderPct ?? 50) + '%' }">
              <div class="handle-line"></div>
              <div class="handle-knob">⇔</div>
            </div>
            <div class="compare-label left">原图</div>
            <div class="compare-label right">压缩后</div>
          </div>
        </div>
      </div>

      <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="onMoreChange" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const quality = ref(75)
const format = ref('jpeg')
const previewing = ref(false)
const processing = ref(false)
const previewReady = ref(false)
const moreInput = ref(null)
let uid = 0

function fmtSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(2) + ' MB'
}

function addFiles(files) {
  for (const f of files) {
    images.value.push({
      id: ++uid, file: f,
      url: URL.createObjectURL(f),
      origSize: f.size,
      compressedSize: 0,
      savePct: 0,
      previewUrl: '',
      sliderPct: 50,
    })
  }
  previewReady.value = false
}

function remove(id) {
  images.value = images.value.filter(i => i.id !== id)
  previewReady.value = images.value.every(i => i.previewUrl)
}

function reset() { images.value = []; previewReady.value = false }
function addMore() { moreInput.value?.click() }
function onMoreChange(e) { addFiles([...e.target.files]); e.target.value = '' }
function onQualityChange() { previewReady.value = false; images.value.forEach(i => { i.previewUrl = ''; i.compressedSize = 0 }) }

const totalOriginal = computed(() => images.value.reduce((s, i) => s + i.origSize, 0))
const totalCompressed = computed(() => images.value.reduce((s, i) => s + (i.compressedSize || 0), 0))
const saving = computed(() => {
  if (!totalOriginal.value || !totalCompressed.value) return 0
  return Math.round((1 - totalCompressed.value / totalOriginal.value) * 100)
})

async function compressToBlob(img) {
  return new Promise(resolve => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (format.value !== 'png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height) }
      ctx.drawImage(image, 0, 0)
      const mime = format.value === 'jpeg' ? 'image/jpeg' : format.value === 'webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(blob => resolve(blob), mime, format.value === 'png' ? undefined : quality.value / 100)
    }
    image.src = img.url
  })
}

async function previewAll() {
  previewing.value = true
  for (const img of images.value) {
    const blob = await compressToBlob(img)
    if (img.previewUrl) URL.revokeObjectURL(img.previewUrl)
    img.previewUrl = URL.createObjectURL(blob)
    img.compressedSize = blob.size
    img.savePct = Math.max(0, Math.round((1 - blob.size / img.origSize) * 100))
    img.sliderPct = 50
  }
  previewing.value = false
  previewReady.value = true
  show('预览生成完成，拖动分割线对比效果', 'success')
}

async function downloadAll() {
  processing.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const ext = format.value === 'jpeg' ? 'jpg' : format.value
    for (const img of images.value) {
      const blob = await compressToBlob(img)
      zip.file(img.file.name.replace(/\.[^.]+$/, '') + `_compressed.${ext}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'compressed_images.zip'
    a.click()
    show(`已下载 ${images.value.length} 张压缩图片`, 'success')
  } catch (e) {
    show('下载失败: ' + e.message, 'error')
  } finally {
    processing.value = false
  }
}

// Slider comparison drag
function onSlide(e, img) {
  if (e.buttons !== 1) return
  updateSlider(e.currentTarget, e.clientX, img)
}
function onSlideTouch(e, img) {
  updateSlider(e.currentTarget, e.touches[0].clientX, img)
}
function updateSlider(el, clientX, img) {
  const rect = el.getBoundingClientRect()
  const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100))
  img.sliderPct = pct
}
</script>

<style scoped>
.ctrl-panel { padding: 18px; }
.ctrl-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
.quality-hints { display: flex; justify-content: space-between; font-size: 11px; color: var(--text3); margin-top: 4px; }
.stat-chip { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; }
.stat-chip span { font-size: 11px; color: var(--text3); }
.stat-chip strong { font-size: 15px; color: var(--text); }
.stat-chip.success strong { color: var(--success); }
.save-badge { background: rgba(52,211,153,.2); color: var(--success); font-size: 11px; padding: 1px 6px; border-radius: 10px; font-weight: 700; }

/* Preview grid */
.preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 16px; }
@media (max-width: 600px) { .preview-grid { grid-template-columns: 1fr; } }

.preview-card { overflow: hidden; }
.preview-card-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border); }
.preview-name { flex: 1; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Before/after panels */
.ba-row { display: grid; grid-template-columns: 1fr 28px 1fr; align-items: center; padding: 14px; gap: 10px; }
.ba-panel { display: flex; flex-direction: column; gap: 6px; }
.ba-label { font-size: 11px; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.ba-img { width: 100%; height: 140px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border); display: block; }
.ba-placeholder {
  width: 100%; height: 140px; border-radius: 6px; border: 2px dashed var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text3); text-align: center; padding: 8px;
}
.ba-size { font-size: 12px; color: var(--text2); display: flex; gap: 6px; align-items: center; }
.ba-size.success { color: var(--success); font-weight: 600; }
.ba-size.muted { color: var(--text3); }
.ba-divider { text-align: center; color: var(--text3); font-size: 18px; }

/* Slider comparison */
.slider-compare {
  position: relative; overflow: hidden; cursor: col-resize;
  border-top: 1px solid var(--border); user-select: none;
  height: 200px;
}
.compare-base { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
.compare-overlay { position: absolute; top: 0; left: 0; height: 100%; overflow: hidden; }
.compare-top { width: 100%; height: 100%; object-fit: cover; display: block; min-width: 200px; }
.compare-handle { position: absolute; top: 0; bottom: 0; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; pointer-events: none; }
.handle-line { width: 2px; flex: 1; background: #fff; box-shadow: 0 0 4px rgba(0,0,0,.5); }
.handle-knob { background: #fff; color: #333; font-size: 13px; padding: 4px 8px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.3); flex-shrink: 0; }
.compare-label { position: absolute; top: 8px; font-size: 11px; font-weight: 700; background: rgba(0,0,0,.5); color: #fff; padding: 2px 8px; border-radius: 4px; }
.compare-label.left { left: 8px; }
.compare-label.right { right: 8px; }
</style>
