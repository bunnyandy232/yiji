<template>
  <div class="page">
    <el-alert
      v-if="pendingMode"
      title="地方债投标统审规则待业务确认。当前仅可查看已提交标位，复核与退回暂不开放。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 12px"
    />
    <el-form class="filter" label-position="top" @submit.prevent>
      <el-row :gutter="18">
        <el-col :span="6">
          <el-form-item :label="hasCodeColumn(market) ? '债券代码' : '债券简称'">
            <el-input v-model="form.keyword" :placeholder="hasCodeColumn(market) ? '请输入债券代码' : '请输入债券简称'" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="申购状态">
            <el-select v-model="form.status" placeholder="请选择申购状态" clearable style="width: 100%">
              <el-option label="已提交" value="已提交" />
              <el-option label="已退回" value="已退回" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="操作员">
            <el-input v-model="form.submitter" placeholder="请输入操作员" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="复核状态">
            <el-select v-model="form.reviewStatus" placeholder="请选择复核状态" clearable style="width: 100%">
              <el-option v-for="item in ['待复核', '已复核', '已退回']" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="申请类型">
            <el-select v-model="form.applyType" placeholder="请选择申请类型" clearable style="width: 100%">
              <el-option v-for="item in ['新增', '修改', '撤销']" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="form.dates"
              type="daterange"
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label=" ">
            <div style="width: 100%; text-align: right">
              <el-button type="primary" @click="search">搜索</el-button>
              <el-button @click="reset">重置</el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div v-if="!pendingMode" class="toolbar">
      <div class="toolbar-left" />
      <div class="toolbar-right">
        <el-button type="primary" @click="batch(true)">批量复核</el-button>
        <el-button type="primary" @click="batch(false)">批量退回</el-button>
      </div>
    </div>
    <div class="col-line">
      <ColumnPicker :columns="pickerCols" v-model="visibleKeys" />
    </div>

    <div class="table-wrap">
      <el-table ref="tableRef" v-col-resize :data="paged" size="small" border height="100%" @selection-change="onSelect">
        <el-table-column v-if="!pendingMode" type="selection" width="46" />
        <el-table-column v-if="shown('code')" prop="code" label="债券代码" min-width="120" />
        <el-table-column v-if="shown('name')" prop="name" label="债券简称" min-width="130" />
        <el-table-column v-if="shown('reviewStatus')" label="复核状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.reviewStatus" /></template>
        </el-table-column>
        <el-table-column v-if="shown('applyType')" label="申请类型" width="90">
          <template #default="{ row }"><StatusTag :status="row.applyType" /></template>
        </el-table-column>
        <el-table-column v-if="shown('customer')" prop="customer" label="客户代码" min-width="160" show-overflow-tooltip />
        <el-table-column v-if="shown('rate')" label="投标利率" width="100" align="right">
          <template #default="{ row }">{{ fmtRate(row.rate) }}</template>
        </el-table-column>
        <el-table-column v-if="shown('amount')" label="申购总量(万元)" width="130" align="right">
          <template #default="{ row }">{{ fmtWan(row.amount) }}</template>
        </el-table-column>
        <el-table-column v-if="shown('unit')" prop="unit" label="对接人" width="100" />
        <el-table-column v-if="shown('type')" prop="type" label="债券类型" min-width="120" />
        <el-table-column v-if="shown('submitter')" prop="submitter" label="操作员" width="80" />
        <el-table-column v-if="shown('createdAt')" prop="createdAt" label="提交时间" width="160" />
        <el-table-column label="操作" fixed="right" :width="pendingMode ? 80 : 170">
          <template #default="{ row }">
            <el-button link type="primary" @click="detail = row">查看</el-button>
            <template v-if="!pendingMode">
              <el-button link type="primary" :disabled="row.reviewStatus !== '待复核'" @click="batch(true, [row])">复核</el-button>
              <el-button link type="primary" :disabled="row.reviewStatus !== '待复核'" @click="batch(false, [row])">退回</el-button>
            </template>
          </template>
        </el-table-column>
        <template #empty><EmptyBox /></template>
      </el-table>
    </div>
    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="filtered.length"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
      />
    </div>
    <BidDetailDialog v-model="detailVisible" :bid="detail" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import BidDetailDialog from '../components/BidDetailDialog.vue'
import ColumnPicker from '../components/ColumnPicker.vue'
import EmptyBox from '../components/EmptyBox.vue'
import StatusTag from '../components/StatusTag.vue'
import { bondById, fmtRate, fmtWan, hasCodeColumn, reviewBids, store } from '../store'

const route = useRoute()
const market = computed(() => route.meta.market)
const pendingMode = computed(() => route.meta.pending === true)
const form = reactive({ keyword: '', status: '', submitter: '', reviewStatus: '', applyType: '', dates: [] })
const applied = ref({ keyword: '', status: '', submitter: '', reviewStatus: '', applyType: '', dates: [] })
const page = ref(1)
const pageSize = ref(20)
const selected = ref([])
const tableRef = ref()
const detail = ref(null)
const detailVisible = computed({
  get: () => !!detail.value,
  set: (value) => { if (!value) detail.value = null },
})

const pickerCols = computed(() => {
  const cols = [
    { key: 'name', label: '债券简称' },
    { key: 'reviewStatus', label: '复核状态' },
    { key: 'applyType', label: '申请类型' },
    { key: 'customer', label: '客户代码' },
    { key: 'rate', label: '投标利率' },
    { key: 'amount', label: '申购总量' },
    { key: 'unit', label: '对接人' },
    { key: 'type', label: '债券类型' },
    { key: 'submitter', label: '操作员' },
    { key: 'createdAt', label: '提交时间' },
  ]
  if (hasCodeColumn(market.value)) cols.unshift({ key: 'code', label: '债券代码' })
  return cols
})
const visibleKeys = ref([])
watch(pickerCols, (cols) => { visibleKeys.value = cols.map((col) => col.key) }, { immediate: true })
function shown(key) { return visibleKeys.value.includes(key) }

const rows = computed(() => store.bids
  .filter((item) => item.market === market.value)
  .map((item) => {
    const bond = bondById(item.bondId)
    return { ...item, code: bond?.code || '', name: bond?.name || '', type: bond?.type || '' }
  }))

const filtered = computed(() => {
  const query = applied.value
  return rows.value.filter((row) => {
    const keyword = query.keyword.trim()
    if (keyword) {
      const source = hasCodeColumn(market.value) ? `${row.code}${row.name}` : row.name
      if (!source.includes(keyword)) return false
    }
    if (query.status && row.status !== query.status) return false
    if (query.submitter && !row.submitter.includes(query.submitter.trim())) return false
    if (query.reviewStatus && row.reviewStatus !== query.reviewStatus) return false
    if (query.applyType && row.applyType !== query.applyType) return false
    if (query.dates?.length === 2) {
      const day = (row.createdAt || '').slice(0, 10)
      if (day < query.dates[0] || day > query.dates[1]) return false
    }
    return true
  })
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function search() {
  applied.value = { ...form, dates: form.dates ? [...form.dates] : [] }
  page.value = 1
}

function reset() {
  Object.assign(form, { keyword: '', status: '', submitter: '', reviewStatus: '', applyType: '', dates: [] })
  search()
}

function onSelect(list) { selected.value = list }

async function batch(pass, rowsToUse) {
  const source = rowsToUse || selected.value
  const pending = source.filter((row) => row.reviewStatus === '待复核')
  if (!source.length) {
    ElMessage.warning('请先选择标位')
    return
  }
  if (!pending.length) {
    ElMessage.warning('所选标位没有待复核记录')
    return
  }
  if (pass) {
    const cancelCount = pending.filter((row) => row.applyType === '撤销').length
    await ElMessageBox.confirm(
      cancelCount
        ? `确认通过 ${pending.length} 笔？其中 ${cancelCount} 笔撤销申请通过后将删除原标位。`
        : `确认复核通过 ${pending.length} 笔标位？`,
      '复核',
      { type: 'warning' },
    )
    const { done } = reviewBids(pending.map((row) => row.id), true)
    ElMessage.success(`已处理 ${done} 笔`)
  } else {
    const { value } = await ElMessageBox.prompt('退回后销售可修改并重新提交。撤销申请被退回时，原标位保持有效。', '退回', {
      inputPlaceholder: '请输入退回原因',
      inputValidator: (text) => !!text?.trim() || '请填写退回原因',
    })
    const { done } = reviewBids(pending.map((row) => row.id), false, value.trim())
    ElMessage.success(`已退回 ${done} 笔`)
  }
  tableRef.value?.clearSelection()
}
</script>
