<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">🖼️</span>
      <div>
        <h1>图片拼合</h1>
        <p>将多张图片拼合为一张，支持横排/竖排/网格布局</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" title="拖拽多张图片到这里" subtitle="图片将按顺序拼合，可拖拽调整顺序" />

    <template v-else>
      <div class="collage-layout">
        <!-- Controls -->
        <div class="card settings-panel">
          <div class="form-group">
            <label class="form-label">布局方式</label>
            <div class="layout-btns">
              <button v-for="l in layouts" :key="l.v" class="layout-btn" :class="{ active: layout === l.v }" @click="layout = l.v">
                <span>{{ l.icon }}</span> {{ l.label }}
              </button>
            </div>
          </div>

          <div class="form-group" v-if="layout === 'grid'">
            <label class="form-label">列数 {{ cols }}</label>
            <input type="range" min="2" max="6" v-model.number="cols" />
          </div>

          <div class="form-group">
            <label class="form-label">图片间距 {{ gap }}px</label>
            <input type="range" min="0" max="40" v-model.number="gap" />
          </div>

          <div class="form-group">
            <label class="form-label">背景颜色</label>
            <div class="color-row">
              <input type="color" v-model="bgColor" class="color-input" />
              <button class="btn btn-ghost btn-sm" @click="bgColor = '#ffffff'">白色</button>
              <button class="btn btn-ghost btn-sm" @click="bgColor = '#000000'">黑色</button>
              <button class="btn btn-ghost btn-sm" @click="bgColor = '#f3f4f6'">浅灰</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">每张图片高度（竖排/网格，0=等比）{{ itemHeight ? itemHeight + 'px' : '自动' }}</label>
            <input type="range" min="0" max="800" step="10" v-model.number="itemHeight" />
          </div>

          <div class="form-group">
            <label class="form-label">输出格式</label>
            <select class="form-select" v-model="format">
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <button class="btn btn-primary" @click="generate" :disabled="processing || images.length < 2">
            {{ processing ? '生成中…' : '✨ 生成拼图' }}
          </button>
        </div>

        <!-- Image order + preview -->
        <div class="right-panel">
          <div class="order-label">图片顺序（点击 ✕ 移除）</div>
          <div class="order-list">
            <div v-for="(img, i) in images" :key="img.id" class="order-item">
              <span class="order-num">{{ i + 1 }}</span>
              <img :src="img.url" class="order-thumb" />
              <span class="order-name">{{ img.file.name }}</span>
              <div class="order-actions">
                <button class="icon-btn" @click="moveUp(i)" :disabled="i === 0">↑</button>
                <button class="icon-btn" @click="moveDown(i)" :disabled="i === images.length - 1">↓</button>
                <button class="icon-btn danger" @click="remove(img.id)">✕</button>
              </div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" @click="moreInput?.click()">+ 添加更多</button>
          <input ref="moreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value='' }" />

          <div v-if="resultUrl" class="result-area">
            <div class="result-label">生成结果</div>
            <img :src="resultUrl" class="result-img" />
            <button class="btn btn-primary" @click="download">⬇ 下载拼图</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const layout = ref('horizontal')
const cols = ref(3)
const gap = ref(8)
const bgColor = ref('#ffffff')
const itemHeight = ref(0)
const format = ref('jpeg')
const processing = ref(false)
const resultUrl = ref('')
const moreInput = ref(null)
let uid = 0

const layouts = [
  { v: 'horizontal', icon: '⬛⬛⬛', label: '横排' },
  { v: 'vertical',   icon: '⬛\n⬛\n⬛', label: '竖排' },
  { v: 'grid',       icon: '⬛⬛\n⬛⬛', label: '网格' },
]

function addFiles(files) {
  for (const f of files) images.value.push({ id: ++uid, file: f, url: URL.createObjectURL(f) })
}
function remove(id) { images.value = images.value.filter(i => i.id !== id); resultUrl.value = '' }
function moveUp(i) { if (i > 0) { const a = images.value; [a[i-1], a[i]] = [a[i], a[i-1]] } }
function moveDown(i) { if (i < images.value.length - 1) { const a = images.value; [a[i], a[i+1]] = [a[i+1], a[i]] } }

function loadImg(src) {
  return new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.src = src })
}

async function generate() {
  processing.value = true
  resultUrl.value = ''
  try {
    const imgs = await Promise.all(images.value.map(i => loadImg(i.url)))
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (layout.value === 'horizontal') {
      const h = itemHeight.value || Math.max(...imgs.map(i => i.naturalHeight))
      const scaledWidths = imgs.map(i => Math.round(i.naturalWidth * h / i.naturalHeight))
      const totalW = scaledWidths.reduce((s, w) => s + w, 0) + gap.value * (imgs.length - 1)
      canvas.width = totalW; canvas.height = h
      ctx.fillStyle = bgColor.value; ctx.fillRect(0, 0, totalW, h)
      let x = 0
      imgs.forEach((img, idx) => {
        ctx.drawImage(img, x, 0, scaledWidths[idx], h)
        x += scaledWidths[idx] + gap.value
      })
    } else if (layout.value === 'vertical') {
      const w = Math.max(...imgs.map(i => i.naturalWidth))
      const scaledHeights = itemHeight.value
        ? imgs.map(() => itemHeight.value)
        : imgs.map(i => Math.round(i.naturalHeight * w / i.naturalWidth))
      const totalH = scaledHeights.reduce((s, h) => s + h, 0) + gap.value * (imgs.length - 1)
      canvas.width = w; canvas.height = totalH
      ctx.fillStyle = bgColor.value; ctx.fillRect(0, 0, w, totalH)
      let y = 0
      imgs.forEach((img, idx) => {
        const sh = scaledHeights[idx]
        const sw = Math.round(img.naturalWidth * sh / img.naturalHeight)
        ctx.drawImage(img, Math.round((w - sw) / 2), y, sw, sh)
        y += sh + gap.value
      })
    } else {
      const c = Math.min(cols.value, imgs.length)
      const rows = Math.ceil(imgs.length / c)
      const cellW = Math.max(...imgs.map(i => i.naturalWidth))
      const cellH = itemHeight.value || Math.max(...imgs.map(i => i.naturalHeight))
      canvas.width = cellW * c + gap.value * (c - 1)
      canvas.height = cellH * rows + gap.value * (rows - 1)
      ctx.fillStyle = bgColor.value; ctx.fillRect(0, 0, canvas.width, canvas.height)
      imgs.forEach((img, idx) => {
        const col = idx % c, row = Math.floor(idx / c)
        const x = col * (cellW + gap.value), y = row * (cellH + gap.value)
        const scale = Math.min(cellW / img.naturalWidth, cellH / img.naturalHeight)
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
        ctx.drawImage(img, x + (cellW - dw) / 2, y + (cellH - dh) / 2, dw, dh)
      })
    }

    const mime = format.value === 'jpeg' ? 'image/jpeg' : format.value === 'webp' ? 'image/webp' : 'image/png'
    canvas.toBlob(blob => {
      resultUrl.value = URL.createObjectURL(blob)
      show('拼图生成完成', 'success')
      processing.value = false
    }, mime, format.value === 'png' ? undefined : 0.92)
  } catch (e) {
    show('生成失败: ' + e.message, 'error')
    processing.value = false
  }
}

function download() {
  const ext = format.value === 'jpeg' ? 'jpg' : format.value
  const a = document.createElement('a')
  a.href = resultUrl.value
  a.download = `collage.${ext}`
  a.click()
}
</script>

<style scoped>
.collage-layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .collage-layout { grid-template-columns: 1fr; } }
.settings-panel { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.layout-btns { display: flex; gap: 8px; }
.layout-btn {
  flex: 1; padding: 10px; background: var(--bg3); border: 1px solid var(--border);
  border-radius: var(--radius-sm); color: var(--text2); cursor: pointer;
  font-size: 13px; transition: all .15s; display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.layout-btn.active { background: rgba(108,99,255,.15); border-color: var(--accent); color: var(--accent2); }
.color-row { display: flex; gap: 8px; align-items: center; }
.color-input { width: 40px; height: 34px; padding: 2px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
.right-panel { display: flex; flex-direction: column; gap: 12px; }
.order-label { font-size: 13px; color: var(--text3); }
.order-list { display: flex; flex-direction: column; gap: 6px; }
.order-item { display: flex; align-items: center; gap: 10px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 12px; }
.order-num { width: 24px; height: 24px; border-radius: 50%; background: var(--bg3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--text3); flex-shrink: 0; }
.order-thumb { width: 48px; height: 36px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.order-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-actions { display: flex; gap: 4px; flex-shrink: 0; }
.icon-btn { width: 28px; height: 28px; border-radius: 4px; background: var(--bg3); border: 1px solid var(--border); color: var(--text2); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.icon-btn:hover:not(:disabled) { border-color: var(--text3); color: var(--text); }
.icon-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.icon-btn.danger:hover:not(:disabled) { border-color: var(--error); color: var(--error); }
.result-area { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border); }
.result-label { font-size: 13px; color: var(--text3); }
.result-img { max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border); }
</style>
