<template>
  <!-- Desktop sidebar -->
  <aside class="sidebar">
    <div class="sidebar-top">
      <RouterLink to="/" class="sidebar-logo" @click="mobileOpen = false">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">ImgTools</span>
      </RouterLink>

      <!-- Mobile: hamburger -->
      <button class="mobile-menu-btn sidebar-mobile-hidden" @click="mobileOpen = !mobileOpen">
        {{ mobileOpen ? '✕' : '☰' }}
      </button>
    </div>

    <!-- Nav links -->
    <nav class="sidebar-nav" :class="{ 'mobile-open': mobileOpen }">
      <div class="nav-section-label">工具</div>
      <RouterLink
        v-for="t in tools" :key="t.path" :to="t.path"
        class="nav-item" @click="mobileOpen = false"
      >
        <span class="nav-icon">{{ t.icon }}</span>
        <span class="nav-label">{{ t.name }}</span>
      </RouterLink>
    </nav>

    <!-- Bottom: theme toggle -->
    <div class="sidebar-bottom sidebar-mobile-hidden">
      <button class="theme-toggle" @click="toggle" :title="theme === 'dark' ? '切换亮色' : '切换暗色'">
        <span class="theme-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
        <span>{{ theme === 'dark' ? '亮色模式' : '暗色模式' }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme.js'

const { theme, toggle } = useTheme()
const mobileOpen = ref(false)

const tools = [
  { path: '/crop',      icon: '✂️',  name: '批量裁剪' },
  { path: '/compress',  icon: '🗜️', name: '批量压缩' },
  { path: '/resize',    icon: '📐',  name: '调整大小' },
  { path: '/rotate',    icon: '🔄',  name: '旋转翻转' },
  { path: '/watermark', icon: '💧',  name: '批量水印' },
  { path: '/filter',    icon: '🎨',  name: '图片滤镜' },
  { path: '/convert',   icon: '🔁',  name: '格式转换' },
  { path: '/collage',   icon: '🖼️', name: '图片拼合' },
]
</script>

<style scoped>
/* ── Sidebar top: logo + mobile btn ── */
.sidebar-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sidebar-logo {
  display: flex; align-items: center; gap: 9px;
  font-size: 16px; font-weight: 700;
}
.logo-icon { font-size: 20px; }
.logo-text {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}

/* ── Nav section ── */
.sidebar-nav {
  flex: 1; overflow-y: auto; padding: 10px 10px 0;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-section-label {
  font-size: 11px; font-weight: 600; color: var(--text3);
  letter-spacing: .08em; text-transform: uppercase;
  padding: 8px 8px 4px;
}

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 8px;
  font-size: 14px; color: var(--text2);
  transition: all .15s; margin-bottom: 2px;
}
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.router-link-active {
  background: rgba(108,99,255,.14);
  color: var(--accent2); font-weight: 600;
}
[data-theme="light"] .nav-item.router-link-active {
  background: rgba(108,99,255,.1);
  color: var(--accent);
}

.nav-icon { font-size: 17px; width: 22px; text-align: center; flex-shrink: 0; }
.nav-label { white-space: nowrap; }

/* ── Bottom: theme toggle ── */
.sidebar-bottom {
  padding: 12px 10px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.theme-toggle {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 9px 10px; border-radius: 8px;
  background: var(--bg3); border: 1px solid var(--border);
  color: var(--text2); font-size: 13px; font-weight: 500;
  transition: all .15s; cursor: pointer;
}
.theme-toggle:hover { background: var(--border); color: var(--text); }
.theme-icon { font-size: 16px; }

/* ── Mobile top-bar adaptations ── */
.mobile-menu-btn {
  display: none; background: none;
  color: var(--text2); font-size: 18px; padding: 4px 8px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .mobile-menu-btn { display: flex; align-items: center; }

  .sidebar-nav {
    position: fixed; top: 52px; left: 0; right: 0;
    background: var(--nav-bg); border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px);
    padding: 8px;
    display: none; z-index: 99;
  }
  .sidebar-nav.mobile-open { display: block; }

  .sidebar-top {
    padding: 0 12px; height: 52px; border-bottom: none;
  }
}
</style>
