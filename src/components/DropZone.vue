<template>
  <div
    class="drop-zone"
    :class="{ 'drag-over': dragging }"
    @click="open"
    @dragover.prevent="dragging = true"
    @dragleave="dragging = false"
    @drop.prevent="onDrop"
  >
    <div class="drop-icon">📁</div>
    <h3>{{ title }}</h3>
    <p>{{ subtitle }}</p>
    <button class="btn btn-ghost btn-sm" style="margin-top:12px" @click.stop="open">选择文件</button>
    <input ref="fileInput" type="file" :accept="accept" :multiple="multiple" style="display:none" @change="onChange" />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, default: '拖拽图片到这里' },
  subtitle: { type: String, default: '支持 JPG · PNG · WebP · GIF，可同时选择多张' },
  accept: { type: String, default: 'image/*' },
  multiple: { type: Boolean, default: true },
})
const emit = defineEmits(['files'])

const dragging = ref(false)
const fileInput = ref(null)

function open() { fileInput.value?.click() }

function onChange(e) {
  emit('files', [...e.target.files])
  e.target.value = ''
}

function onDrop(e) {
  dragging.value = false
  const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'))
  if (files.length) emit('files', files)
}
</script>
