<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <div class="hero-badge">🆓 100% 免费 · 纯本地处理 · 无需上传</div>
        <h1 class="hero-title">
          批量图片处理<br>
          <span class="gradient-text">快速 · 私密 · 无限制</span>
        </h1>
        <p class="hero-desc">
          所有处理在浏览器本地完成，图片不会上传到任何服务器。<br>
          支持批量裁剪、压缩、调整大小、旋转、水印、滤镜等 8 大功能。
        </p>
        <div class="hero-actions">
          <RouterLink to="/crop" class="btn btn-primary btn-lg">
            开始使用 →
          </RouterLink>
          <a href="#features" class="btn btn-ghost btn-lg">查看功能</a>
        </div>
        <div class="hero-stats">
          <div class="stat"><strong>8+</strong><span>处理工具</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>∞</strong><span>批量数量</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>0</strong><span>图片上传</span></div>
          <div class="stat-divider"></div>
          <div class="stat"><strong>100%</strong><span>隐私保护</span></div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="features">
      <div class="section-header">
        <h2>全部功能</h2>
        <p>支持 JPG · PNG · WebP · GIF 等主流格式，批量处理秒级完成</p>
      </div>
      <div class="feature-grid">
        <RouterLink v-for="t in tools" :key="t.path" :to="t.path" class="feature-card">
          <div class="feature-icon">{{ t.icon }}</div>
          <div class="feature-body">
            <div class="feature-title-row">
              <h3>{{ t.name }}</h3>
              <span class="tag tag-free">免费</span>
            </div>
            <p>{{ t.desc }}</p>
            <ul class="feature-list">
              <li v-for="f in t.features" :key="f">{{ f }}</li>
            </ul>
          </div>
          <div class="feature-arrow">→</div>
        </RouterLink>
      </div>
    </section>

    <!-- Why section -->
    <section class="why">
      <div class="section-header">
        <h2>为什么选择 ImgTools？</h2>
      </div>
      <div class="why-grid">
        <div class="why-card" v-for="w in whys" :key="w.title">
          <div class="why-icon">{{ w.icon }}</div>
          <h3>{{ w.title }}</h3>
          <p>{{ w.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-logo">
          <span>⚡</span>
          <span>ImgTools</span>
        </div>
        <p class="footer-desc">纯前端图片处理工具集，基于 Canvas API 与 Vue 3 构建。</p>
        <div class="footer-links">
          <RouterLink v-for="t in tools" :key="t.path" :to="t.path">{{ t.name }}</RouterLink>
        </div>
        <p class="footer-copy">所有图片处理均在您的浏览器本地完成，数据绝不上传</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
const tools = [
  {
    path: '/crop', icon: '✂️', name: '批量裁剪',
    desc: '支持自由比例、像素精准、社媒尺寸和形状裁剪，统一/独立两种模式',
    features: ['10+ 社媒平台预设', '圆形/圆角形状', '统一/独立裁剪', '批量 ZIP 下载'],
  },
  {
    path: '/compress', icon: '🗜️', name: '批量压缩',
    desc: '智能调整质量参数，在保持画质的同时大幅减小文件体积',
    features: ['可视化质量滑块', '实时大小预览', '体积减少比例显示', '支持 JPG/WebP'],
  },
  {
    path: '/resize', icon: '📐', name: '调整大小',
    desc: '按像素或百分比批量缩放，支持锁定宽高比',
    features: ['像素/百分比两种模式', '锁定宽高比', '填充/适合/拉伸模式', '多格式输出'],
  },
  {
    path: '/rotate', icon: '🔄', name: '旋转翻转',
    desc: '批量旋转任意角度，水平/垂直翻转一键完成',
    features: ['90°/180°/270° 旋转', '水平/垂直翻转', '自定义任意角度', '背景色填充'],
  },
  {
    path: '/watermark', icon: '💧', name: '批量水印',
    desc: '添加文字或图片水印，自定义位置、透明度、大小',
    features: ['文字/图片水印', '9 个位置预设', '透明度调节', '平铺模式'],
  },
  {
    path: '/filter', icon: '🎨', name: '图片滤镜',
    desc: '亮度、对比度、饱和度、模糊、灰度等多种滤镜实时预览',
    features: ['12 种滤镜效果', '实时预览', '参数精细调节', '组合叠加'],
  },
  {
    path: '/convert', icon: '🔁', name: '格式转换',
    desc: '批量转换图片格式，JPG/PNG/WebP 互转，支持透明通道',
    features: ['JPG/PNG/WebP 互转', '透明通道保留', '质量参数设置', '批量重命名'],
  },
  {
    path: '/collage', icon: '🖼️', name: '图片拼合',
    desc: '将多张图片按横排/竖排/网格布局拼合为一张图片',
    features: ['横/竖/网格布局', '间距/背景色设置', '自定义列数', '等比缩放'],
  },
]

const whys = [
  { icon: '🔒', title: '完全私密', desc: '图片全程在浏览器本地处理，不经过任何网络传输，您的照片只有您自己能看到。' },
  { icon: '⚡', title: '极速处理', desc: '基于原生 Canvas API，无需等待上传下载，批量处理数十张图片只需几秒。' },
  { icon: '🆓', title: '永久免费', desc: '没有会员、没有水印限制、没有每日次数上限，所有功能完全开放使用。' },
  { icon: '📦', title: '无需安装', desc: '打开浏览器即可使用，无需安装任何软件，支持 Chrome/Firefox/Safari/Edge。' },
  { icon: '🎯', title: '批量高效', desc: '所有工具均支持批量操作，一次上传多张图片，统一设置参数，一键导出 ZIP。' },
  { icon: '🌐', title: '支持离线', desc: '首次加载后可离线使用，不依赖网络连接，随时随地处理图片。' },
]
</script>

<style scoped>
.home { flex: 1; }

/* Hero */
.hero {
  position: relative; overflow: hidden;
  padding: 100px 24px 80px;
  text-align: center;
}
.hero-bg {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(108,99,255,.2) 0%, transparent 70%);
  pointer-events: none;
}
.hero-content { position: relative; max-width: 760px; margin: 0 auto; }
.hero-badge {
  display: inline-block; margin-bottom: 24px;
  padding: 6px 16px; border-radius: 20px;
  border: 1px solid rgba(108,99,255,.4);
  background: rgba(108,99,255,.1);
  font-size: 13px; color: var(--accent2);
}
.hero-title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 800; line-height: 1.15;
  letter-spacing: -1.5px; margin-bottom: 20px;
}
.gradient-text {
  background: linear-gradient(135deg, #6c63ff, #a78bfa, #38bdf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.hero-desc {
  font-size: 17px; color: var(--text2); line-height: 1.7;
  margin-bottom: 36px;
}
.hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 48px; }
.hero-stats {
  display: flex; align-items: center; justify-content: center;
  gap: 0; background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px 32px;
  flex-wrap: wrap; gap: 8px;
}
.stat { display: flex; flex-direction: column; align-items: center; padding: 0 24px; }
.stat strong { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #6c63ff, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat span { font-size: 12px; color: var(--text3); margin-top: 2px; }
.stat-divider { width: 1px; height: 40px; background: var(--border); }

/* Features */
.features { padding: 80px 24px; max-width: 1280px; margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 48px; }
.section-header h2 { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
.section-header p { color: var(--text2); font-size: 16px; }

.feature-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.feature-card {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 24px; background: var(--bg2);
  border: 1px solid var(--border); border-radius: var(--radius);
  transition: all .2s; position: relative;
}
.feature-card:hover {
  border-color: var(--accent); transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(108,99,255,.15);
}
.feature-icon { font-size: 32px; flex-shrink: 0; margin-top: 2px; }
.feature-body { flex: 1; }
.feature-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.feature-title-row h3 { font-size: 16px; font-weight: 600; }
.feature-body > p { font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 12px; }
.feature-list { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.feature-list li { font-size: 12px; color: var(--text3); background: var(--bg3); padding: 3px 8px; border-radius: 4px; }
.feature-arrow { color: var(--text3); font-size: 18px; flex-shrink: 0; transition: transform .2s; }
.feature-card:hover .feature-arrow { color: var(--accent); transform: translateX(4px); }

/* Why */
.why { padding: 80px 24px; background: var(--bg2); }
.why .section-header { max-width: 1280px; margin: 0 auto 48px; }
.why-grid { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.why-card { padding: 28px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); }
.why-icon { font-size: 36px; margin-bottom: 14px; }
.why-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
.why-card p { font-size: 14px; color: var(--text2); line-height: 1.6; }

/* Footer */
.footer { padding: 48px 24px; border-top: 1px solid var(--border); }
.footer-inner { max-width: 1280px; margin: 0 auto; text-align: center; }
.footer-logo { display: flex; align-items: center; gap: 8px; justify-content: center; font-size: 20px; font-weight: 700; margin-bottom: 12px; }
.footer-desc { color: var(--text2); font-size: 14px; margin-bottom: 24px; }
.footer-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px; }
.footer-links a { font-size: 13px; color: var(--text3); padding: 4px 10px; border-radius: 4px; transition: color .15s; }
.footer-links a:hover { color: var(--text); }
.footer-copy { font-size: 12px; color: var(--text3); }

@media (max-width: 600px) {
  .hero { padding: 60px 16px 48px; }
  .hero-stats { padding: 16px; }
  .stat-divider { display: none; }
  .features, .why { padding: 48px 16px; }
}
</style>
