<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">💧</span>
      <div>
        <h1>批量添加水印</h1>
        <p>文字或图片水印，自定义位置、透明度、样式</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="images = []">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <div class="wm-layout">
        <!-- Settings panel -->
        <div class="card settings-panel">
          <div class="chip-tabs" style="margin-bottom:16px">
            <span class="chip" :class="{ active: wmType === 'text' }" @click="wmType = 'text'">文字水印</span>
            <span class="chip" :class="{ active: wmType === 'image' }" @click="wmType = 'image'">图片水印</span>
          </div>

          <template v-if="wmType === 'text'">
            <div class="form-group">
              <label class="form-label">水印文字</label>
              <input type="text" class="form-input" v-model="wmText" placeholder="输入水印内容" />
            </div>
            <div class="ctrl-row">
              <div class="form-group">
                <label class="form-label">字体大小 {{ fontSize }}px</label>
                <input type="range" min="12" max="120" v-model.number="fontSize" />
              </div>
              <div class="form-group">
                <label class="form-label">字体颜色</label>
                <div class="color-row">
                  <input type="color" v-model="fontColor" class="color-input" />
                  <button class="btn btn-ghost btn-sm" @click="fontColor = '#ffffff'">白</button>
                  <button class="btn btn-ghost btn-sm" @click="fontColor = '#000000'">黑</button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">字体</label>
              <select class="form-select" v-model="fontFamily">
                <option value="Arial">Arial</option>
                <option value="'Microsoft YaHei'">微软雅黑</option>
                <option value="Georgia">Georgia</option>
                <option value="'Courier New'">Courier New</option>
                <option value="Impact">Impact</option>
              </select>
            </div>
          </template>

          <template v-else>
            <div class="form-group">
              <label class="form-label">水印图片</label>
              <button class="btn btn-ghost" @click="wmImgInput?.click()">选择图片</button>
              <span v-if="wmImgUrl" style="font-size:12px;color:var(--success);margin-left:8px">✓ 已选择</span>
              <input ref="wmImgInput" type="file" accept="image/*" style="display:none" @change="onWmImgChange" />
            </div>
            <div class="form-group" v-if="wmImgUrl">
              <img :src="wmImgUrl" style="max-height:80px;max-width:100%;border-radius:6px;background:#111;" />
            </div>
            <div class="form-group">
              <label class="form-label">水印大小 {{ wmImgSize }}%</label>
              <input type="range" min="5" max="100" v-model.number="wmImgSize" />
            </div>
          </template>

          <div class="form-group" style="margin-top:8px">
            <label class="form-label">透明度 {{ Math.round(opacity * 100) }}%</label>
            <input type="range" min="0.05" max="1" step="0.05" v-model.number="opacity" />
          </div>

          <div class="form-group">
            <label class="form-label">位置</label>
            <div class="pos-grid">
              <button v-for="p in positions" :key="p.v" class="pos-btn" :class="{ active: position === p.v }" @click="position = p.v" :title="p.label">{{ p.icon }}</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="tile" style="margin-right:6px" />
              平铺模式
            </label>
          </div>

          <div class="ctrl-row" style="margin-top:8px">
            <div class="form-group">
              <label class="form-label">输出格式</label>
              <select class="form-select" v-model="format">
                <option value="jpeg">JPG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <button class="btn btn-primary" style="align-self:flex-end" @click="downloadAll" :disabled="processing">
              {{ processing ? '处理中…' : '⬇ 批量下载' }}
            </button>
          </div>
        </div>

        <!-- Preview -->
        <div class="preview-area">
          <div class="preview-label">预览（第一张）</div>
          <canvas ref="previewCanvas" class="preview-canvas"></canvas>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" @click="renderPreview">刷新预览</button>
          <div class="img-list-mini">
            <div v-for="img in images" :key="img.id" class="mini-card">
              <img :src="img.url" />
              <button class="mini-remove" @click="remove(img.id)">✕</button>
              <div class="mini-name">{{ img.file.name }}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" @click="addMoreInput?.click()">+ 添加更多图片</button>
          <input ref="addMoreInput" type="file" accept="image/*" multiple style="display:none" @change="e => { addFiles([...e.target.files]); e.target.value='' }" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()
const images = ref([])
const wmType = ref('text')
const wmText = ref('© ImgTools')
const fontSize = ref(36)
const fontColor = ref('#ffffff')
const fontFamily = ref('Arial')
const wmImgUrl = ref('')
const wmImgSize = ref(20)
const opacity = ref(0.5)
const position = ref('bottom-right')
const tile = ref(false)
const format = ref('jpeg')
const processing = ref(false)
const previewCanvas = ref(null)
const wmImgInput = ref(null)
const addMoreInput = ref(null)
let uid = 0

const positions = [
  { v: 'top-left', icon: '↖', label: '左上' },
  { v: 'top-center', icon: '↑', label: '上方居中' },
  { v: 'top-right', icon: '↗', label: '右上' },
  { v: 'middle-left', icon: '←', label: '左侧居中' },
  { v: 'center', icon: '·', label: '居中' },
  { v: 'middle-right', icon: '→', label: '右侧居中' },
  { v: 'bottom-left', icon: '↙', label: '左下' },
  { v: 'bottom-center', icon: '↓', label: '下方居中' },
  { v: 'bottom-right', icon: '↘', label: '右下' },
]

function addFiles(files) {
  for (const f of files) {
    const url = URL.createObjectURL(f)
    images.value.push({ id: ++uid, file: f, url })
  }
  nextTick(renderPreview)
}

function remove(id) { images.value = images.value.filter(i => i.id !== id); nextTick(renderPreview) }

function onWmImgChange(e) {
  const f = e.target.files[0]
  if (f) wmImgUrl.value = URL.createObjectURL(f)
  nextTick(renderPreview)
}

watch([wmType, wmText, fontSize, fontColor, fontFamily, wmImgUrl, wmImgSize, opacity, position, tile], renderPreview)

async function drawWatermark(ctx, canvasW, canvasH) {
  ctx.save()
  ctx.globalAlpha = opacity.value
  const pad = 16

  if (wmType.value === 'text' && wmText.value) {
    ctx.font = `${fontSize.value}px ${fontFamily.value}`
    ctx.fillStyle = fontColor.value
    ctx.strokeStyle = fontColor.value === '#ffffff' ? 'rgba(0,0,0,.4)' : 'rgba(255,255,255,.4)'
    ctx.lineWidth = 2
    const metrics = ctx.measureText(wmText.value)
    const tw = metrics.width, th = fontSize.value

    if (tile.value) {
      const stepX = tw + 60, stepY = th + 40
      for (let y = -th; y < canvasH + stepY; y += stepY) {
        for (let x = -tw; x < canvasW + stepX; x += stepX) {
          ctx.save(); ctx.translate(x + stepX / 2, y + stepY / 2); ctx.rotate(-Math.PI / 6)
          ctx.strokeText(wmText.value, -tw / 2, 0)
          ctx.fillText(wmText.value, -tw / 2, 0)
          ctx.restore()
        }
      }
    } else {
      const pos = getPos(position.value, tw, th, canvasW, canvasH, pad)
      ctx.strokeText(wmText.value, pos.x, pos.y)
      ctx.fillText(wmText.value, pos.x, pos.y)
    }
  } else if (wmType.value === 'image' && wmImgUrl.value) {
    const wmImg = await loadImg(wmImgUrl.value)
    const ww = canvasW * wmImgSize.value / 100
    const wh = ww * wmImg.naturalHeight / wmImg.naturalWidth

    if (tile.value) {
      for (let y = pad; y < canvasH; y += wh + 20) {
        for (let x = pad; x < canvasW; x += ww + 20) {
          ctx.drawImage(wmImg, x, y, ww, wh)
        }
      }
    } else {
      const pos = getPos(position.value, ww, wh, canvasW, canvasH, pad)
      ctx.drawImage(wmImg, pos.x - ww / 2, pos.y - wh / 2, ww, wh)
    }
  }
  ctx.restore()
}

function getPos(p, w, h, cw, ch, pad) {
  const map = {
    'top-left':      { x: pad + w / 2,      y: pad + h },
    'top-center':    { x: cw / 2,            y: pad + h },
    'top-right':     { x: cw - pad - w / 2,  y: pad + h },
    'middle-left':   { x: pad + w / 2,       y: ch / 2 },
    'center':        { x: cw / 2,            y: ch / 2 },
    'middle-right':  { x: cw - pad - w / 2,  y: ch / 2 },
    'bottom-left':   { x: pad + w / 2,       y: ch - pad },
    'bottom-center': { x: cw / 2,            y: ch - pad },
    'bottom-right':  { x: cw - pad - w / 2,  y: ch - pad },
  }
  return map[p] || map['bottom-right']
}

function loadImg(src) {
  return new Promise(resolve => {
    const img = new Image(); img.onload = () => resolve(img); img.src = src
  })
}

async function renderPreview() {
  if (!images.value.length || !previewCanvas.value) return
  const img = await loadImg(images.value[0].url)
  const scale = Math.min(1, 600 / img.naturalWidth)
  const w = Math.round(img.naturalWidth * scale)
  const h = Math.round(img.naturalHeight * scale)
  const canvas = previewCanvas.value
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  await drawWatermark(ctx, w, h)
}

async function applyOne(img) {
  const image = await loadImg(img.url)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  await drawWatermark(ctx, canvas.width, canvas.height)
  return new Promise(resolve => {
    const mime = format.value === 'jpeg' ? 'image/jpeg' : format.value === 'webp' ? 'image/webp' : 'image/png'
    canvas.toBlob(blob => resolve(blob), mime, format.value === 'png' ? undefined : 0.92)
  })
}

async function downloadAll() {
  processing.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    const ext = format.value === 'jpeg' ? 'jpg' : format.value
    for (const img of images.value) {
      const blob = await applyOne(img)
      const base = img.file.name.replace(/\.[^.]+$/, '')
      zip.file(`${base}_watermarked.${ext}`, blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'watermarked_images.zip'
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
.wm-layout { display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .wm-layout { grid-template-columns: 1fr; } }
.settings-panel { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.ctrl-row { display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap; }
.color-row { display: flex; gap: 8px; align-items: center; }
.color-input { width: 40px; height: 34px; padding: 2px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; }
.pos-grid { display: grid; grid-template-columns: repeat(3, 40px); gap: 4px; }
.pos-btn {
  width: 40px; height: 40px; border-radius: 6px;
  background: var(--bg3); border: 1px solid var(--border);
  color: var(--text2); font-size: 16px; cursor: pointer; transition: all .15s;
}
.pos-btn.active { background: rgba(108,99,255,.2); border-color: var(--accent); color: var(--accent2); }
.pos-btn:hover:not(.active) { border-color: var(--text3); }
.preview-area { display: flex; flex-direction: column; gap: 10px; }
.preview-label { font-size: 13px; color: var(--text3); }
.preview-canvas { max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border); background: #111; }
.img-list-mini { display: flex; flex-wrap: wrap; gap: 8px; }
.mini-card { position: relative; width: 80px; }
.mini-card img { width: 80px; height: 60px; object-fit: cover; border-radius: 6px; display: block; }
.mini-remove { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,.6); color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: opacity .15s; }
.mini-card:hover .mini-remove { opacity: 1; }
.mini-name { font-size: 10px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; }
</style>
