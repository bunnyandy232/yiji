<template>
  <el-dialog
    :model-value="modelValue"
    title="操作详情"
    width="680px"
    @close="emit('update:modelValue', false)"
  >
    <el-descriptions v-if="bid" :column="2" border>
      <el-descriptions-item label="债券简称">{{ bond?.name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="债券代码">{{ bond?.code || '-' }}</el-descriptions-item>
      <el-descriptions-item label="对接人">{{ bid.unit || bid.submitter || '-' }}</el-descriptions-item>
      <el-descriptions-item label="操作员">{{ bid.submitter || '-' }}</el-descriptions-item>
      <el-descriptions-item label="操作时间">{{ bid.createdAt || '-' }}</el-descriptions-item>
      <el-descriptions-item label="申请类型">{{ bid.applyType || '-' }}</el-descriptions-item>
      <el-descriptions-item label="操作内容" :span="2">{{ actionText }}</el-descriptions-item>
      <el-descriptions-item label="客户代码">{{ bid.customer }}</el-descriptions-item>
      <el-descriptions-item label="投标利率">{{ fmtRate(bid.rate) }}</el-descriptions-item>
      <el-descriptions-item label="申购量">{{ fmtWan(bid.amount) }} 万元</el-descriptions-item>
      <el-descriptions-item label="复核状态">{{ bid.reviewStatus }}</el-descriptions-item>
      <el-descriptions-item label="申购状态">{{ bid.status }}</el-descriptions-item>
      <el-descriptions-item v-if="bid.uplinkStatus" label="上行状态">{{ bid.uplinkStatus }}{{ bid.uplinkAt ? `（${bid.uplinkAt}）` : '' }}</el-descriptions-item>
      <el-descriptions-item v-if="bid.rejectReason" label="退回原因" :span="2">{{ bid.rejectReason }}</el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { bondById, fmtRate, fmtWan } from '../store'

const props = defineProps({
  modelValue: Boolean,
  bid: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])
const bond = computed(() => (props.bid ? bondById(props.bid.bondId) : null))

const actionText = computed(() => {
  const bid = props.bid
  if (!bid) return '-'
  const type = bid.applyType || '新增'
  const verb = type === '撤销' ? '撤销标位' : type === '修改' ? '修改标位' : '新增标位'
  return `${verb}：客户 ${bid.customer}，利率 ${fmtRate(bid.rate)}，申购量 ${fmtWan(bid.amount)} 万元`
})
</script>
