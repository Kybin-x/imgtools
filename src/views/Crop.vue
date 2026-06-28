<template>
  <div class="tool-page">
    <div class="tool-header">
      <span class="tool-icon">✂️</span>
      <div>
        <h1>批量裁剪图片</h1>
        <p>统一模式同步裁剪区域 · 独立模式分别设置 · 支持圆形/圆角形状</p>
      </div>
      <div class="tool-header-actions" v-if="images.length">
        <button class="btn btn-ghost btn-sm" @click="clearAll">↩ 重新选择</button>
      </div>
    </div>

    <DropZone v-if="!images.length" @files="addFiles" />

    <template v-else>
      <!-- Mode tabs -->
      <div class="card ctrl-panel">
        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">裁剪模式</label>
            <div class="chip-tabs">
              <span class="chip" :class="{ active: S.mode === 'manual' }" @click="setMode('manual')">手动比例</span>
              <span class="chip" :class="{ active: S.mode === 'percent' }" @click="setMode('percent')">百分比</span>
              <span class="chip" :class="{ active: S.mode === 'pixel' }" @click="setMode('pixel')">像素尺寸</span>
              <span class="chip" :class="{ active: S.mode === 'social' }" @click="setMode('social')">社媒尺寸</span>
              <span class="chip" :class="{ active: S.mode === 'shape' }" @click="setMode('shape')">形状裁剪</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">裁剪方式</label>
            <div class="chip-tabs">
              <span class="chip" :class="{ active: S.cropStyle === 'uniform' }" @click="setCropStyle('uniform')">统一裁剪</span>
              <span class="chip" :class="{ active: S.cropStyle === 'individual' }" @click="setCropStyle('individual')">独立裁剪</span>
            </div>
          </div>
        </div>

        <!-- Manual mode -->
        <div class="ctrl-row" v-if="S.mode === 'manual'">
          <div class="form-group">
            <label class="form-label">宽高比</label>
            <div class="chip-tabs">
              <span v-for="r in ratioPresets" :key="r" class="chip" :class="{ active: S.ratio === r }" @click="S.ratio = r; rebuildAll()">{{ r }}</span>
              <span class="chip" :class="{ active: S.ratio === 'free' }" @click="S.ratio = 'free'; rebuildAll()">自由</span>
            </div>
          </div>
        </div>

        <!-- Percent mode -->
        <div class="ctrl-row" v-if="S.mode === 'percent'">
          <div class="form-group">
            <label class="form-label">宽度 {{ S.pctW }}%</label>
            <input type="range" min="1" max="100" v-model.number="S.pctW" @input="rebuildAll" />
          </div>
          <div class="form-group">
            <label class="form-label">高度 {{ S.pctH }}%</label>
            <input type="range" min="1" max="100" v-model.number="S.pctH" @input="rebuildAll" />
          </div>
        </div>

        <!-- Pixel mode -->
        <div class="ctrl-row" v-if="S.mode === 'pixel'">
          <div class="form-group">
            <label class="form-label">宽度 (px)</label>
            <input type="number" class="form-input" v-model.number="S.pixW" min="1" style="width:100px" @change="rebuildAll" />
          </div>
          <span style="align-self:flex-end;padding-bottom:8px;color:var(--text3)">×</span>
          <div class="form-group">
            <label class="form-label">高度 (px)</label>
            <input type="number" class="form-input" v-model.number="S.pixH" min="1" style="width:100px" @change="rebuildAll" />
          </div>
        </div>

        <!-- Social mode -->
        <div v-if="S.mode === 'social'" class="social-panel">
          <div v-for="platform in SOCIAL_PRESETS" :key="platform.platform" class="social-group">
            <div class="social-platform">{{ platform.icon }} {{ platform.platform }}</div>
            <div class="social-presets">
              <button v-for="p in platform.presets" :key="p.id"
                class="btn btn-ghost btn-sm social-btn"
                :class="{ active: S.socialPreset?.id === p.id }"
                @click="S.socialPreset = p; rebuildAll()">
                {{ p.name }}<span class="social-dim">{{ p.w }}×{{ p.h }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Shape mode -->
        <div class="ctrl-row" v-if="S.mode === 'shape'">
          <div class="form-group">
            <label class="form-label">形状</label>
            <div class="chip-tabs">
              <span class="chip" :class="{ active: S.shape === 'rect' }" @click="S.shape='rect'; updateShapePreview()">矩形</span>
              <span class="chip" :class="{ active: S.shape === 'circle' }" @click="S.shape='circle'; updateShapePreview()">圆形</span>
              <span class="chip" :class="{ active: S.shape === 'rounded' }" @click="S.shape='rounded'; updateShapePreview()">圆角矩形</span>
            </div>
          </div>
          <div class="form-group" v-if="S.shape === 'rounded'">
            <label class="form-label">圆角半径 {{ S.shapeRadius }}px</label>
            <input type="range" min="0" max="120" v-model.number="S.shapeRadius" @input="updateShapePreview" />
          </div>
          <div class="form-group">
            <label class="form-label">比例</label>
            <div class="chip-tabs">
              <span v-for="r in shapeRatios" :key="r" class="chip" :class="{ active: S.shapeRatio === r }" @click="S.shapeRatio=r; rebuildAll()">{{ r }}</span>
            </div>
          </div>
        </div>

        <!-- Output settings -->
        <div class="ctrl-row">
          <div class="form-group">
            <label class="form-label">输出格式</label>
            <select class="form-select" v-model="S.format" @change="rebuildAll">
              <option value="jpeg">JPG</option>
              <option value="png">PNG（支持透明）</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">文件名模板</label>
            <input type="text" class="form-input" v-model="S.template" style="width:200px" />
          </div>
          <div style="margin-left:auto;display:flex;gap:8px;align-self:flex-end">
            <button class="btn btn-ghost btn-sm" @click="addMoreInput?.click()">+ 添加更多</button>
            <button class="btn btn-danger btn-sm" @click="clearAll">清空</button>
            <button class="btn btn-primary" @click="downloadAll" :disabled="processing">
              {{ processing ? '处理中…' : '⬇ 批量下载 ZIP' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Image grid with croppers -->
      <div class="crop-grid">
        <div v-for="(o, idx) in images" :key="o.id" class="crop-card">
          <div class="crop-card-header">
            <span class="crop-card-name">{{ o.file.name }}</span>
            <span class="crop-card-dims">{{ o.nw }}×{{ o.nh }}</span>
            <button class="icon-btn danger" @click="removeImage(o.id)" style="margin-left:auto">✕</button>
          </div>
          <div :id="'cwrap_'+o.id" class="cropper-wrap">
            <img :id="'cimg_'+o.id" :src="o.url" style="max-width:100%;display:block" />
          </div>
          <div class="crop-card-footer" v-if="o.badge">
            {{ o.badge }}
          </div>
        </div>
      </div>

      <input ref="addMoreInput" type="file" accept="image/*" multiple style="display:none" @change="onMoreChange" />
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, nextTick } from 'vue'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import DropZone from '../components/DropZone.vue'
import { useToast } from '../composables/useToast.js'

const { show } = useToast()

const images = ref([])
const processing = ref(false)
const addMoreInput = ref(null)
let uid = 0

const S = reactive({
  mode: 'manual',
  ratio: '1:1',
  pctW: 80, pctH: 80,
  pixW: 800, pixH: 600,
  socialPreset: null,
  shape: 'rect',
  shapeRatio: '1:1',
  shapeRadius: 20,
  cropStyle: 'uniform',
  format: 'jpeg',
  template: '{name}_cropped',
})

const ratioPresets = ['1:1', '4:3', '3:2', '16:9', '9:16', '3:4', '2:3']
const shapeRatios = ['1:1', '4:3', '16:9', 'free']

const SOCIAL_PRESETS = [
  { platform:'Instagram', icon:'📸', presets:[
    {id:'ig_sq', name:'正方形', w:1080,h:1080},{id:'ig_port',name:'竖向',w:1080,h:1350},
    {id:'ig_land',name:'横向',w:1080,h:566},{id:'ig_story',name:'Story',w:1080,h:1920},
  ]},
  { platform:'YouTube', icon:'▶️', presets:[
    {id:'yt_thumb',name:'缩略图',w:1280,h:720},{id:'yt_banner',name:'频道横幅',w:2560,h:1440},
  ]},
  { platform:'X/Twitter', icon:'🐦', presets:[
    {id:'tw_post',name:'帖子图片',w:1200,h:675},{id:'tw_header',name:'封面',w:1500,h:500},
  ]},
  { platform:'Facebook', icon:'👤', presets:[
    {id:'fb_post',name:'帖子',w:1200,h:630},{id:'fb_cover',name:'封面',w:851,h:315},
  ]},
  { platform:'LinkedIn', icon:'💼', presets:[
    {id:'li_post',name:'帖子',w:1200,h:627},{id:'li_banner',name:'横幅',w:1584,h:396},
  ]},
  { platform:'微信', icon:'💬', presets:[
    {id:'wx_moment',name:'朋友圈',w:1080,h:1080},{id:'wx_cover',name:'公众号封面',w:900,h:383},
  ]},
]

function parseRatio(str) {
  const [a, b] = str.split(':').map(Number)
  return (a && b) ? a / b : NaN
}

function getAspectRatio(o) {
  switch (S.mode) {
    case 'percent': return (o.nw * S.pctW) / (o.nh * S.pctH)
    case 'pixel':   return S.pixW / S.pixH
    case 'social':  return S.socialPreset ? S.socialPreset.w / S.socialPreset.h : NaN
    case 'shape':   return S.shapeRatio === 'free' ? NaN : parseRatio(S.shapeRatio)
    case 'manual':  return S.ratio === 'free' ? NaN : parseRatio(S.ratio)
    default:        return NaN
  }
}

function addFiles(files) {
  for (const f of files) {
    const img = new Image()
    const url = URL.createObjectURL(f)
    img.onload = () => {
      const o = { id: ++uid, file: f, url, img, nw: img.naturalWidth, nh: img.naturalHeight, cropData: null, cropper: null, badge: '' }
      images.value.push(o)
      nextTick(() => initCropper(o))
    }
    img.src = url
  }
}

function initCropper(o) {
  const imgEl = document.getElementById('cimg_' + o.id)
  if (!imgEl) return
  if (o.cropper) { o.cropper.destroy(); o.cropper = null }
  const ar = getAspectRatio(o)
  o.cropper = new Cropper(imgEl, {
    aspectRatio: isNaN(ar) ? NaN : ar,
    viewMode: 1,
    autoCropArea: 0.85,
    movable: S.cropStyle !== 'uniform' || o.id === images.value[0]?.id,
    ready() {
      applyShapeToDOM(document.getElementById('cwrap_' + o.id))
      if (S.cropStyle === 'uniform' && images.value[0]?.cropper && o.id !== images.value[0].id) {
        const d = images.value[0].cropper.getData(true)
        o.cropper.setData(d)
      }
      updateBadge(o)
    },
    crop() {
      updateBadge(o)
      if (S.cropStyle === 'uniform' && o.id === images.value[0]?.id) {
        syncUniform(o.cropper)
      }
    },
  })
}

function applyShapeToDOM(wrap) {
  if (!wrap) return
  const viewBox = wrap.querySelector('.cropper-view-box')
  const viewImg = viewBox?.querySelector('img')
  const face = wrap.querySelector('.cropper-face')
  const isShape = S.mode === 'shape'
  let r = '0'
  if (isShape) {
    if (S.shape === 'circle') r = '50%'
    else if (S.shape === 'rounded') r = Math.max(0, S.shapeRadius) + 'px'
  }
  if (viewBox) viewBox.style.borderRadius = r
  if (viewImg) viewImg.style.borderRadius = r
  if (face) face.style.borderRadius = r
}

function updateShapePreview() {
  images.value.forEach(o => applyShapeToDOM(document.getElementById('cwrap_' + o.id)))
}

function syncUniform(masterCropper) {
  const data = masterCropper.getData(true)
  images.value.forEach((o, i) => {
    if (i === 0 || !o.cropper) return
    o.cropper.setData(data)
    updateBadge(o)
  })
}

function updateBadge(o) {
  if (!o.cropper) return
  const d = o.cropper.getData(true)
  if (S.mode === 'percent') {
    o.badge = `${Math.round(d.width/o.nw*100)}% × ${Math.round(d.height/o.nh*100)}%`
  } else {
    o.badge = `${d.width} × ${d.height} px`
  }
}

function rebuildAll() {
  images.value.forEach(o => initCropper(o))
}

function setMode(m) {
  S.mode = m
  rebuildAll()
}

function setCropStyle(s) {
  S.cropStyle = s
  rebuildAll()
}

function removeImage(id) {
  const o = images.value.find(i => i.id === id)
  if (o?.cropper) o.cropper.destroy()
  images.value = images.value.filter(i => i.id !== id)
}

function clearAll() {
  images.value.forEach(o => { if (o.cropper) o.cropper.destroy() })
  images.value = []
}

function onMoreChange(e) { addFiles([...e.target.files]); e.target.value = '' }

function buildFilename(o, idx) {
  const ext = S.format === 'jpeg' ? 'jpg' : S.format
  const d = o.cropper ? o.cropper.getData(true) : { width: o.nw, height: o.nh }
  const baseName = o.file.name.replace(/\.[^.]+$/, '')
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const socialSuffix = S.mode === 'social' && S.socialPreset ? `_${S.socialPreset.id}` : ''
  return S.template
    .replace('{name}', baseName + socialSuffix)
    .replace('{n}', String(idx+1).padStart(3,'0'))
    .replace('{w}x{h}', `${d.width}x${d.height}`)
    .replace('{date}', date)
    + '.' + ext
}

function applyShapeClip(ctx, w, h) {
  if (S.mode !== 'shape' || S.shape === 'rect') return
  ctx.beginPath()
  if (S.shape === 'circle') {
    const r = Math.min(w, h) / 2
    ctx.arc(w/2, h/2, r, 0, Math.PI * 2)
  } else {
    const r = Math.min(S.shapeRadius, Math.min(w,h)/2)
    ctx.moveTo(r,0); ctx.lineTo(w-r,0)
    ctx.arcTo(w,0,w,r,r); ctx.lineTo(w,h-r)
    ctx.arcTo(w,h,w-r,h,r); ctx.lineTo(r,h)
    ctx.arcTo(0,h,0,h-r,r); ctx.lineTo(0,r)
    ctx.arcTo(0,0,r,0,r); ctx.closePath()
  }
  ctx.clip()
}

async function cropOne(o) {
  return new Promise(resolve => {
    if (!o.cropper) { resolve(null); return }
    const d = o.cropper.getData(true)
    let tw = d.width, th = d.height
    if (S.mode === 'pixel') { tw = S.pixW; th = S.pixH }
    else if (S.mode === 'social' && S.socialPreset) { tw = S.socialPreset.w; th = S.socialPreset.h }

    const canvas = document.createElement('canvas')
    canvas.width = tw; canvas.height = th
    const ctx = canvas.getContext('2d')

    const isTransp = S.mode === 'shape' && S.shape !== 'rect' && S.format !== 'jpeg'
    if (!isTransp && S.format === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,tw,th) }

    ctx.save()
    applyShapeClip(ctx, tw, th)

    const srcX = d.x, srcY = d.y, srcW = d.width, srcH = d.height
    const image = new Image()
    image.onload = () => {
      ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, tw, th)
      ctx.restore()
      const mime = S.format === 'jpeg' ? 'image/jpeg' : S.format === 'webp' ? 'image/webp' : 'image/png'
      canvas.toBlob(blob => resolve(blob), mime, S.format === 'png' ? undefined : 0.92)
    }
    image.src = o.url
  })
}

async function downloadAll() {
  processing.value = true
  try {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    for (let i = 0; i < images.value.length; i++) {
      const o = images.value[i]
      const blob = await cropOne(o)
      if (blob) zip.file(buildFilename(o, i), blob)
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(zipBlob)
    a.download = 'cropped_images.zip'
    a.click()
    show(`已裁剪 ${images.value.length} 张图片`, 'success')
  } catch (e) {
    show('处理失败: ' + e.message, 'error')
  } finally {
    processing.value = false
  }
}

onUnmounted(() => {
  images.value.forEach(o => { if (o.cropper) o.cropper.destroy() })
})
</script>

<style>
/* Cropper.js shape transitions (global) */
.cropper-view-box, .cropper-view-box img, .cropper-face {
  transition: border-radius .2s ease;
}
</style>

<style scoped>
.ctrl-panel { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
.ctrl-row { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }

.social-panel { display: flex; flex-direction: column; gap: 12px; }
.social-group {}
.social-platform { font-size: 13px; color: var(--text3); margin-bottom: 6px; }
.social-presets { display: flex; flex-wrap: wrap; gap: 6px; }
.social-btn { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
.social-btn.active { background: rgba(108,99,255,.15); border-color: var(--accent); color: var(--accent2); }
.social-dim { font-size: 11px; color: var(--text3); }

.crop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.crop-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
.crop-card-header { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.crop-card-name { font-size: 13px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.crop-card-dims { font-size: 11px; color: var(--text3); flex-shrink: 0; }
.cropper-wrap { background: #111; }
.crop-card-footer { padding: 8px 12px; font-size: 12px; color: var(--accent2); background: var(--bg3); border-top: 1px solid var(--border); }
.icon-btn { width: 24px; height: 24px; border-radius: 4px; background: transparent; border: none; color: var(--text3); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.icon-btn.danger:hover { color: var(--error); }
</style>
