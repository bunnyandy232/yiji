<template>
  <div>
    <div class="m-filter">
      <div class="m-filter-grid">
        <div>
          <label>申购时间</label>
          <div class="date-pair">
            <input v-model="start" type="date" />
            <span>至</span>
            <input v-model="end" type="date" />
          </div>
        </div>
        <div>
          <label>债券代码</label>
          <input v-model="keyword" placeholder="请输入" />
        </div>
      </div>
    </div>
    <div class="seg">
      <button type="button" :class="{ on: tab === 'all' }" @click="tab = 'all'">全部</button>
      <button type="button" :class="{ on: tab === 'fav' }" @click="tab = 'fav'">已关注</button>
      <div class="market-sheet">
        <button type="button" :class="{ on: market === 'bjse' }" @click="setMarket('bjse')">北金所</button>
        <button type="button" :class="{ on: market === 'lgb' }" @click="setMarket('lgb')">地方债</button>
        <button type="button" :class="{ on: market === 'corp' }" @click="setMarket('corp')">公司债</button>
      </div>
    </div>
    <article v-for="bond in bonds" :key="bond.id" class="bond-card">
      <div class="bond-head-row">
        <h3 class="bond-name">{{ bond.name }}</h3>
        <span class="bond-venue" :class="bond.market">{{ placeOf(bond) }}</span>
        <span class="bond-code">{{ bond.code || '--' }}</span>
        <span class="bond-issue-time">{{ timeOf(bond) }}</span>
      </div>
      <div class="metrics triple">
        <div>
          <span class="k">申购区间</span>
          <span class="v">{{ displayBondField(bond, 'range') }}</span>
        </div>
        <div>
          <span class="k">发行规模 / 已投占比</span>
          <span class="v size-share">
            <span>{{ bond.issueAmount }}亿</span>
            <span class="bid-ratio" :class="bidRatioOf(bond).tone">{{ bidRatioOf(bond).text }}</span>
          </span>
        </div>
        <div>
          <span class="k">期限</span>
          <span class="v">{{ bond.tenor || '--' }}</span>
        </div>
      </div>
      <div v-if="opened[bond.id]" class="detail-box">
        <template v-if="bond.market === 'bjse'">
          <span>申购截止时间</span><b>{{ bond.deadline || '--' }}</b>
          <span>簿记管理人</span><b>{{ bond.bookrunner || '--' }}</b>
          <span>债券期限</span><b>{{ bond.tenor || '--' }}</b>
          <span>起息日</span><b>{{ bond.valueDate || '--' }}</b>
          <span>销售佣金费率</span><b>{{ bond.commissionRate || '--' }}</b>
          <span>总投单量</span><b>{{ amountWan(bond.totalBidAmount) }}</b>
          <span>边际投单量</span><b>{{ amountWan(bond.marginalBidAmount) }}</b>
          <span>边际利率/价格</span><b>{{ num(bond.marginalRate) }}</b>
          <span>边际倍数</span><b>{{ num(bond.marginalMultiple) }}</b>
          <span>簿记过程更新时间</span><b>{{ bond.bookUpdatedAt || '--' }}</b>
        </template>
        <template v-else-if="bond.market === 'corp'">
          <span>主体评级</span><b>{{ bond.issuerRating || '--' }}</b>
          <span>债项评级</span><b>{{ bond.bondRating || '--' }}</b>
          <span>簿记管理人</span><b>{{ bond.bookrunner || '--' }}</b>
          <span>缴款日</span><b>{{ bond.paymentDate || '--' }}</b>
          <span>起息日</span><b>{{ bond.valueDate || '--' }}</b>
          <span>发行人全称</span><b>{{ bond.issuerFullName || '--' }}</b>
          <span>区域</span><b>{{ bond.region || '--' }}</b>
        </template>
        <template v-else>
          <span>发行场所</span><b>{{ placeOf(bond) }}</b>
          <span>发行人全称</span><b>{{ bond.issuerFullName || '--' }}</b>
          <span>缴款日</span><b>{{ bond.paymentDate || '--' }}</b>
          <span>起息日</span><b>{{ bond.valueDate || '--' }}</b>
        </template>
      </div>
      <div class="card-actions">
        <button
          type="button"
          class="detail-btn"
          :class="{ open: opened[bond.id] }"
          @click="toggleDetail(bond.id)"
        >
          {{ opened[bond.id] ? '收起' : '详情' }}
          <span class="chev" aria-hidden="true">{{ opened[bond.id] ? '▴' : '▾' }}</span>
        </button>
        <button type="button" class="linkish" :class="{ on: followed(bond.id) }" @click="toggleFollow(bond.id)">
          {{ followed(bond.id) ? '已关注' : '关注' }}
        </button>
        <button type="button" class="go-btn" @click="goBid(bond.id)">投标</button>
      </div>
    </article>
    <p v-if="!bonds.length" class="empty">暂无数据</p>
    <p class="note">簿记过程信息仅北金所债券展示。地方债、公司债不支持手机端统审和直连上行。</p>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { bidRatioOf, displayBondField, marketLabel, store, toggleFollow, venueLabel } from '../store'

const router = useRouter()
const keyword = ref('')
const start = ref('')
const end = ref('')
const tab = ref('all')
const market = ref('')
const opened = reactive({})

function setMarket(value) {
  market.value = market.value === value ? '' : value
}

function toggleDetail(id) {
  opened[id] = !opened[id]
}

function goBid(id) {
  router.push(`/m/bid/${id}`)
}

function bondDay(bond) {
  return (bond.issueTime || bond.issueDate || '').slice(0, 10)
}

function placeOf(bond) {
  if (bond.issueVenue) return venueLabel(bond.issueVenue)
  if (bond.market === 'lgb') return venueLabel(bond.tenderSystem)
  if (bond.market === 'bjse') return '银行间'
  return marketLabel(bond.market)
}

function timeOf(bond) {
  if (bond.issueTime) return bond.issueTime
  if (bond.market === 'lgb') {
    const date = bond.issueDate || ''
    const time = bond.tenderTime || ''
    if (date && time) return `${date} ${time}`
    return date || time || '--'
  }
  return '--'
}

const bonds = computed(() => store.bonds.filter((bond) => {
  if (market.value && bond.market !== market.value) return false
  if (tab.value === 'fav' && !store.followed.includes(bond.id)) return false
  const text = keyword.value.trim()
  if (text && !`${bond.code || ''}${bond.name}`.includes(text)) return false
  const day = bondDay(bond)
  if (start.value && day < start.value) return false
  if (end.value && day > end.value) return false
  return true
}))

function followed(id) {
  return store.followed.includes(id)
}

function num(value) {
  if (value == null || value === '') return '--'
  return Number(value).toFixed(2)
}

function amountWan(value) {
  if (value == null || value === '') return '--'
  return `${Number(value).toLocaleString('zh-CN')} 万`
}
</script>
