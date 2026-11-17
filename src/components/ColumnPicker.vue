<template>
  <el-popover placement="bottom-end" :width="220" trigger="click">
    <el-checkbox-group v-model="model">
      <div v-for="col in columns" :key="col.key" class="col-item">
        <el-checkbox :value="col.key">{{ col.label }}</el-checkbox>
      </div>
    </el-checkbox-group>
    <template #reference>
      <el-button link type="primary">
        展示列
        <el-icon style="margin-left: 2px"><ArrowDown /></el-icon>
      </el-button>
    </template>
  </el-popover>
</template>

<script setup>
import { ArrowDown } from '@element-plus/icons-vue'

defineProps({
  columns: { type: Array, default: () => [] },
})

const model = defineModel({ type: Array, default: () => [] })
</script>
