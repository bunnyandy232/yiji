<template>
  <div class="empty-box">
    <svg width="168" height="120" viewBox="0 0 168 120" aria-hidden="true">
      <ellipse cx="84" cy="104" rx="42" ry="6" fill="#eef2f6" />
      <path d="M34 58 L84 82 L134 58 L134 92 L84 116 L34 92 Z" fill="#f7f9fc" stroke="#e4e7ed" />
      <path d="M34 58 L84 82 L84 116 L34 92 Z" fill="#eef1f6" />
      <path d="M84 82 L134 58 L134 92 L84 116 Z" fill="#fbfcfe" />
      <path d="M34 58 L62 40 L84 54 L84 82 Z" fill="#fff" stroke="#e4e7ed" />
      <path d="M134 58 L106 40 L84 54 L84 82 Z" fill="#f4f6f9" stroke="#e4e7ed" />
      <path d="M62 40 L84 26 L106 40 L84 54 Z" fill="#fff" stroke="#e4e7ed" />
    </svg>
    <p>{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
})
</script>
