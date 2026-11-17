<template>
  <div v-if="bond">
    <section class="summary-card">
      <h3>{{ bond.name }}</h3>
      <div class="code">{{ bond.code || bond.type || '--' }}</div>
      <div v-if="bond.market === 'bjse'" class="book-strip">
        <div><div class="k">边际利率</div><div class="v">{{ num(bond.marginalRate) }}</div></div>
        <div><div class="k">边际倍数</div><div class="v">{{ num(bond.marginalMultiple) }}</div></div>
        <div><div class="k">全场倍数</div><div class="v">{{ num(bond.overallMultiple) }}</div></div>
      </div>
      <div v-else class="book-strip">
        <div><div class="k">申购区间</div><div class="v" style="font-size: 15px">{{ displayBondField(bond, 'range') }}</div></div>
        <div><div class="k">发行时间</div><div class="v" style="font-size: 12px">{{ bond.issueTime || bond.issueDate || '--' }}</div></div>
        <div><div class="k">发行规模(亿)</div><div class="v">{{ bond.issueAmount }}</div></div>
      </div>
      <p class="note" style="margin: 8px 0 0">{{ bidHint }}</p>
    </section>

    <section v-if="existingBids.length" class="section existing-section">
      <div class="section-hd"><span>已录入标位 {{ existingBids.length }}</span></div>
      <p class="note" style="margin: 0 0 8px">可对已录入标位直接编辑或删除；下方可继续新增。</p>
      <div v-for="item in existingBids" :key="item.id" class="exist-row">
        <div class="exist-main">
          <b>{{ item.customer }}</b>
          <small>{{ Number(item.rate).toFixed(2) }}% · {{ fmtWan(item.amount) }}万 · {{ item.reviewStatus }}</small>
        </div>
        <div class="exist-ops">
          <template v-if="item.applyType === '撤销' && item.reviewStatus === '待复核'">
            <button type="button" class="linkish" @click="revokeExisting(item)">撤回撤销</button>
          </template>
          <template v-else>
            <button type="button" class="linkish" @click="editExisting(item)">编辑</button>
            <button type="button" class="linkish danger" @click="deleteExisting(item)">删除</button>
          </template>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-hd">
        <span>{{ activeEditId ? '修改标位' : (existingBids.length ? '继续新增标位' : '标位信息') }}</span>
        <button v-if="activeEditId" type="button" class="add-btn" @click="cancelEdit">取消修改</button>
      </div>
      <label class="m-field"><span>客户代码</span><input v-model="customer" list="customer-codes" placeholder="拼音首字母，如 PZGZ" /></label>
      <datalist id="customer-codes">
        <option v-for="code in CUSTOMER_CODES" :key="code" :value="code" />
      </datalist>
      <p class="note" style="margin: 0 0 8px">默认取客户名称汉字拼音首字母（如平安资产管理有限责任公司 → PZGZ），也可自定义。</p>
      <label class="m-field"><span>对接人</span><input v-model="entryUser" placeholder="默认当前登录用户，可自定义" /></label>
      <label class="m-field"><span>操作员</span><input :value="operatorName" disabled /></label>
      <p class="note" style="margin: 0 0 8px">操作员固定为当前系统登录用户，不可修改。</p>
      <div class="pair-hd">
        <span>{{ activeEditId ? '修改利率 / 申购量' : '投标利率 / 申购量' }}</span>
        <button v-if="!activeEditId" type="button" class="add-btn" @click="addPair">＋ 增加</button>
      </div>
      <div v-for="(pair, index) in pairs" :key="index" class="rate-pair">
        <input v-model="pair.rate" inputmode="decimal" placeholder="利率(%)" />
        <input v-model="pair.amount" inputmode="decimal" placeholder="申购量(万元)" />
        <button v-if="!activeEditId" type="button" class="pair-btn plus" @click="addPair">＋</button>
        <button v-if="!activeEditId" type="button" class="pair-btn minus" :disabled="pairs.length <= 1" @click="removePair(index)">－</button>
      </div>
      <p v-if="activeEditId" class="note">当前正在修改已有标位，提交后将更新该笔记录。</p>
      <p v-else class="note">利率区间 {{ rangeText }}；可点加减增减利率/申购量组合。</p>
    </section>
    <div class="submit-bar">
      <button v-if="!activeEditId" type="button" class="ghost" @click="save(true)">保存</button>
      <button type="button" class="solid" @click="save(false)">{{ activeEditId ? '保存修改' : '提交新增' }}</button>
    </div>
  </div>
  <p v-else class="empty">未找到债券</p>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { CUSTOMER_CODES, bondById, bondRange, currentUser, displayBondField, fmtRate, fmtWan, removeBid, store, submitBid, toCustomerCode, undoCancel } from '../store'

const route = useRoute()
const toast = inject('toast')
const bond = computed(() => bondById(route.params.id))
const customer = ref('')
const entryUser = ref(currentUser().name)
const pairs = ref([blank()])
const activeEditId = ref('')
const operatorName = computed(() => currentUser().name)

watch(() => store.userId, () => {
  entryUser.value = currentUser().name
})

const bidHint = computed(() => {
  if (!bond.value) return ''
  if (bond.value.market === 'bjse') return '以上为场内簿记过程信息，申购时请对照区间。'
  if (bond.value.market === 'corp') return '公司债无场内簿记过程，标位提交后由投标经理在电脑端复核。'
  return '地方债无场内簿记过程，标位提交后由投标经理在电脑端复核。'
})

const rangeText = computed(() => {
  const range = bondRange(bond.value)
  if (!range) return '未设置'
  return `${fmtRate(range[0])} - ${fmtRate(range[1])}`
})

const existingBids = computed(() => {
  if (!bond.value) return []
  const user = currentUser()
  return store.bids
    .filter((item) => item.bondId === bond.value.id && item.submitterId === user.id)
    .filter((item) => item.id !== activeEditId.value)
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
})

watch(existingBids, (list) => {
  if (!activeEditId.value && !customer.value && list[0]) customer.value = list[0].customer
}, { immediate: true })

function blank() {
  return { rate: '', amount: '' }
}

function usersDept(value) {
  return ['北京分公司', '上海分公司', '深圳分公司', '债券业务部'].includes(value)
}

function addPair() {
  pairs.value.push(blank())
}

function removePair(index) {
  if (pairs.value.length <= 1) return
  pairs.value.splice(index, 1)
}

function editExisting(item) {
  activeEditId.value = item.id
  customer.value = item.customer
  entryUser.value = item.unit && !usersDept(item.unit) ? item.unit : currentUser().name
  pairs.value = [{ rate: String(item.rate), amount: String(item.amount) }]
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

function cancelEdit() {
  activeEditId.value = ''
  entryUser.value = currentUser().name
  pairs.value = [blank()]
  const latest = existingBids.value[0]
  customer.value = latest?.customer || ''
}

function deleteExisting(item) {
  const approved = item.reviewStatus === '已复核'
  const ok = window.confirm(
    approved
      ? '该标位已复核。删除将提交撤销申请，投标经理审核通过后才会从标位簿中去掉。'
      : '确认删除该标位？',
  )
  if (!ok) return
  const result = removeBid(item.id)
  if (result === 'cancel') toast('已提交撤销申请')
  else if (result === 'deleted') toast('标位已删除')
  else toast(result)
}

function revokeExisting(item) {
  const error = undoCancel(item.id)
  if (error) toast(error)
  else toast('已撤回撤销，标位继续有效')
}

function num(value) {
  if (value == null || value === '') return '--'
  return Number(value).toFixed(2)
}

function save(draft) {
  if (!bond.value) return
  if (!customer.value.trim()) {
    toast('请填写客户代码')
    return
  }
  if (!entryUser.value.trim()) {
    toast('请填写对接人')
    return
  }
  if (!pairs.value.length) {
    toast('请至少填写一组利率和申购量')
    return
  }
  const range = bondRange(bond.value)
  for (const pair of pairs.value) {
    const rate = Number(pair.rate)
    const amount = Number(pair.amount)
    if (pair.rate === '' || Number.isNaN(rate)) {
      toast('请填写投标利率')
      return
    }
    if (!(amount > 0)) {
      toast('请填写申购量')
      return
    }
    if (range && (rate < range[0] || rate > range[1])) {
      toast(`投标利率超出区间 ${range[0].toFixed(2)}% - ${range[1].toFixed(2)}%`)
      return
    }
  }

  if (activeEditId.value) {
    const target = store.bids.find((item) => item.id === activeEditId.value)
    const wasApproved = target?.reviewStatus === '已复核'
    const pair = pairs.value[0]
    const error = submitBid({
      bondId: bond.value.id,
      customer: toCustomerCode(customer.value) || customer.value.trim(),
      unit: entryUser.value.trim() || currentUser().name,
      rate: pair.rate,
      amount: pair.amount,
      draft: false,
    }, activeEditId.value)
    if (error) {
      toast(error)
      return
    }
    toast(wasApproved ? '修改已提交，需投标经理重新复核' : '标位已更新')
    cancelEdit()
    return
  }

  for (const pair of pairs.value) {
    const error = submitBid({
      bondId: bond.value.id,
      customer: toCustomerCode(customer.value) || customer.value.trim(),
      unit: entryUser.value.trim() || currentUser().name,
      rate: pair.rate,
      amount: pair.amount,
      draft,
    })
    if (error) {
      toast(error)
      return
    }
  }
  toast(draft ? '已保存，可稍后提交' : `已提交 ${pairs.value.length} 组标位，待投标经理复核`)
  pairs.value = [blank()]
  const latest = existingBids.value[0]
  if (latest) customer.value = latest.customer
}
</script>
