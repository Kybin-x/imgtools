import { createRouter, createWebHashHistory } from 'vue-router'
import Home from './views/Home.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/crop',      component: () => import('./views/Crop.vue') },
  { path: '/compress',  component: () => import('./views/Compress.vue') },
  { path: '/resize',    component: () => import('./views/Resize.vue') },
  { path: '/rotate',    component: () => import('./views/Rotate.vue') },
  { path: '/watermark', component: () => import('./views/Watermark.vue') },
  { path: '/filter',    component: () => import('./views/Filter.vue') },
  { path: '/convert',   component: () => import('./views/Convert.vue') },
  { path: '/collage',   component: () => import('./views/Collage.vue') },
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
