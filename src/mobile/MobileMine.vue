<template>
  <div>
    <div class="m-filter">
      <div class="m-filter-grid triple">
        <div>
          <label>起息日</label>
          <input v-model="valueDate" type="date" />
        </div>
        <div>
          <label>债券简称</label>
          <input v-model="nameKw" placeholder="请输入" />
        </div>
        <div>
          <label>债券代码</label>
          <input v-model="codeKw" placeholder="请输入" />
        </div>
      </div>
    </div>
    <div class="seg market-only">
      <div class="market-sheet">
        <button type="button" :class="{ on: market === 'bjse' }" @click="setMarket('bjse')">北金所</button>
        <button type="button" :class="{ on: market === 'lgb' }" @click="setMarket('lgb')">地方债</button>
        <button type="button" :class="{ on: market === 'corp' }" @click="setMarket('corp')">公司债</button>
      </div>
    </div>
    <div class="legend">
      <span><i class="dot green" />已报单</span>
      <span><i class="dot blue" />待复核/已保存待提交</span>
      <span><i class="dot red" />已退回/已撤回</span>
    </div>
    <div class="bid-table">
      <div class="bid-head"><span>序号</span><span>债券简称</span><span>利率/价格</span><span>操作</span></div>
      <div v-for="(bid, index) in bids" :key="bid.id" class="bid-row">
        <span>{{ index + 1 }}</span>
        <span>{{ bondById(bid.bondId)?.name }}<br><em :class="statusOf(bid).cls">{{ statusOf(bid).text }}</em></span>
        <span>{{ Number(bid.rate).toFixed(2) }}<br>{{ fmtWan(bid.amount) }}万</span>
        <span>
          <button v-if="canWithdraw(bid)" type="button" class="linkish" @click="withdraw(bid)">撤回</button>
        </span>
      </div>
      <div v-if="!bids.length" class="empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { bondById, currentUser, fmtWan, isManager, removeBid, store } from '../store'

const toast = inject('toast')
const valueDate = ref('')
const nameKw = ref('')
const codeKw = ref('')
const market = ref('bjse')

function setMarket(value) {
  market.value = market.value === value ? '' : value
}

function valueDay(bond) {
  if (!bond) return ''
  return bond.valueDate || bond.issueDate || bond.paymentDate || ''
}

const bids = computed(() => store.bids.filter((bid) => {
  if (!isManager() && bid.submitterId !== currentUser().id) return false
  if (market.value && bid.market !== market.value) return false
  const bond = bondById(bid.bondId)
  const nameText = nameKw.value.trim()
  if (nameText && !(bond?.name || '').includes(nameText)) return false
  const codeText = codeKw.value.trim()
  if (codeText && !(bond?.code || '').includes(codeText)) return false
  if (valueDate.value && valueDay(bond) !== valueDate.value) return false
  return true
}))

function statusOf(bid) {
  if (bid.reviewStatus === '已退回') return { text: '已退回', cls: 'st-red' }
  if (bid.reviewStatus === '已保存') return { text: '已保存待提交', cls: 'st-blue' }
  if (bid.reviewStatus === '待复核') return { text: '待复核', cls: 'st-blue' }
  if (bid.uplinkStatus === '已上行') return { text: '已报单', cls: 'st-green' }
  if (bid.reviewStatus === '已复核') return { text: '已复核', cls: 'st-blue' }
  return { text: bid.status || '-', cls: '' }
}

function canWithdraw(bid) {
  return bid.submitterId === currentUser().id
    && (bid.reviewStatus === '已保存' || bid.reviewStatus === '待复核')
    && bid.applyType !== '撤销'
}

function withdraw(bid) {
  const result = removeBid(bid.id)
  toast(result === 'deleted' ? '已撤回' : result === 'cancel' ? '已提交撤销申请' : result)
}
</script>
