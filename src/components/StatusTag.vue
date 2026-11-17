<template>
  <el-tag :type="type" effect="light" size="small">{{ status || '-' }}</el-tag>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })
const type = computed(() => ({
  待复核: 'warning',
  已复核: 'success',
  已退回: 'danger',
  已提交: 'primary',
  新增: 'info',
  修改: 'warning',
  撤销: 'danger',
}[props.status] || 'info'))
</script>
