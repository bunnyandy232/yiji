<template>
  <div>
    <p class="note">仅北金所债券支持手机端统审与直连上行。地方债、公司债请在电脑端复核。按销售录入的原始标位逐笔复核上行，不做合并标位。</p>
    <article v-for="bond in bonds" :key="bond.id" class="bond-card review-card">
      <h3 class="bond-name">{{ bond.name }}</h3>
      <div class="bond-sub">{{ bond.code }} · {{ bond.tenor }}</div>
      <div class="review-row">
        <div class="metrics slim">
          <div><span class="k">待复核</span><span class="v">{{ pendingCount(bond.id) }}</span></div>
          <div><span class="k">已上行</span><span class="v">{{ uplinkedCount(bond.id) }}</span></div>
        </div>
        <div class="review-ops">
          <button
            type="button"
            class="go-btn"
            :disabled="!pendingCount(bond.id)"
            @click="batch(bond)"
          >
            批量复核
          </button>
          <button
            type="button"
            class="drop-btn"
            :class="{ open: opened[bond.id] }"
            :disabled="!pendingCount(bond.id)"
            :aria-expanded="!!opened[bond.id]"
            @click="toggle(bond.id)"
          >
            {{ opened[bond.id] ? '收起' : '明细' }}
            <span aria-hidden="true">{{ opened[bond.id] ? '▴' : '▾' }}</span>
          </button>
        </div>
      </div>

      <div v-if="opened[bond.id]" class="pend-panel">
        <div v-for="bid in pendingOf(bond.id)" :key="bid.id" class="pend">
          <div>
            <b>{{ bid.unit || bid.submitter }}</b>
            <small>
              {{ bid.customer }} · {{ Number(bid.rate).toFixed(2) }}% · {{ fmtWan(bid.amount) }}万
              <template v-if="bid.applyType === '撤销'"> · 撤销申请</template>
            </small>
          </div>
          <div class="pend-actions">
            <button type="button" class="ok" @click="passOne(bid)">复核</button>
            <button type="button" @click="openReject(bid)">退回</button>
          </div>
        </div>
        <div v-if="!pendingOf(bond.id).length" class="empty">暂无待复核标位</div>
      </div>
    </article>

    <div v-if="rejecting" class="sheet-mask" @click.self="rejecting = null">
      <div class="sheet">
        <h4>退回原因</h4>
        <textarea v-model="reason" placeholder="请输入退回原因" />
        <button type="button" class="primary" @click="confirmReject">确认退回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, reactive, ref } from 'vue'
import { approveAndUplink, batchApproveUplink, fmtWan, reviewBids, store } from '../store'

const toast = inject('toast')
const opened = reactive({})
const rejecting = ref(null)
const reason = ref('')

const bonds = computed(() => store.bonds.filter((bond) => bond.market === 'bjse'))

function pendingOf(bondId) {
  return store.bids.filter((bid) => bid.bondId === bondId && bid.reviewStatus === '待复核')
}

function pendingCount(bondId) {
  return pendingOf(bondId).length
}

function uplinkedCount(bondId) {
  return store.bids.filter((bid) => bid.bondId === bondId && bid.uplinkStatus === '已上行').length
}

function toggle(id) {
  opened[id] = !opened[id]
}

function batch(bond) {
  const result = batchApproveUplink(bond.id)
  if (result.error) toast(result.error)
  else {
    toast(`已批量复核上行 ${result.count} 笔`)
    opened[bond.id] = false
  }
}

function passOne(bid) {
  const result = approveAndUplink([bid.id])
  if (result.error) toast(result.error)
  else toast(bid.applyType === '撤销' ? '撤销已通过' : '已复核上行')
}

function openReject(bid) {
  rejecting.value = bid
  reason.value = ''
}

function confirmReject() {
  if (!reason.value.trim()) {
    toast('请填写退回原因')
    return
  }
  reviewBids([rejecting.value.id], false, reason.value.trim())
  rejecting.value = null
  toast('已退回')
}
</script>
