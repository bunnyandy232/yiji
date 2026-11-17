<template>
  <div class="page">
    <el-form class="filter" label-position="top" @submit.prevent>
      <el-row :gutter="18">
        <el-col :span="6">
          <el-form-item :label="hasCodeColumn(market) ? '债券代码 / 简称' : '债券简称'">
            <el-input v-model="form.keyword" :placeholder="hasCodeColumn(market) ? '请输入债券代码或简称' : '请输入债券简称'" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="客户代码">
            <el-input v-model="form.customer" placeholder="请输入客户代码" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="复核状态">
            <el-select v-model="form.reviewStatus" placeholder="请选择复核状态" clearable style="width: 100%">
              <el-option v-for="item in reviewOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col v-if="isManager()" :span="6">
          <el-form-item label="操作员">
            <el-input v-model="form.submitter" placeholder="请输入操作员" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label=" ">
            <el-button type="primary" @click="search">搜索</el-button>
            <el-button @click="reset">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="toolbar">
      <div class="toolbar-left">
        <template v-if="isManager()">
          <el-button type="primary" @click="openCreate">新增标位</el-button>
          <span class="hint">投标经理可查看全部标位，也可自行录入。销售经理请在「在团债券」中编辑标位。</span>
        </template>
        <span v-else class="hint">我的投标用于查看操作日志。销售经理请在「在团债券」中编辑标位，本页仅支持查看。</span>
      </div>
    </div>
    <div class="col-line">
      <ColumnPicker :columns="pickerCols" v-model="visibleKeys" />
    </div>

    <div class="table-wrap">
      <el-table v-col-resize :data="paged" size="small" border height="100%">
        <el-table-column v-if="shown('code')" prop="code" label="债券代码" min-width="120" />
        <el-table-column v-if="shown('name')" prop="name" label="债券简称" min-width="130" />
        <el-table-column v-if="shown('customer')" prop="customer" label="客户代码" min-width="180" show-overflow-tooltip />
        <el-table-column v-if="shown('rate')" label="投标利率" width="100" align="right">
          <template #default="{ row }">{{ fmtRate(row.rate) }}</template>
        </el-table-column>
        <el-table-column v-if="shown('amount')" label="申购量(万元)" width="130" align="right">
          <template #default="{ row }">{{ fmtWan(row.amount) }}</template>
        </el-table-column>
        <el-table-column v-if="shown('unit')" prop="unit" label="对接人" width="100" />
        <el-table-column v-if="shown('applyType')" label="申请类型" width="90">
          <template #default="{ row }"><StatusTag :status="row.applyType" /></template>
        </el-table-column>
        <el-table-column v-if="shown('reviewStatus')" label="复核状态" width="90">
          <template #default="{ row }"><StatusTag :status="row.reviewStatus" /></template>
        </el-table-column>
        <el-table-column v-if="shown('submitter')" prop="submitter" label="操作员" width="80" />
        <el-table-column v-if="shown('createdAt')" prop="createdAt" label="操作时间" width="160" />
        <el-table-column label="操作" fixed="right" :width="isManager() ? 180 : 90">
          <template #default="{ row }">
            <el-button link type="primary" @click="detail = row">查看</el-button>
            <template v-if="isManager() && row.submitterId === store.userId">
              <template v-if="row.applyType === '撤销' && row.reviewStatus === '待复核'">
                <el-button link type="primary" @click="revokeCancel(row)">撤回撤销</el-button>
              </template>
              <template v-else>
                <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
                <el-button link type="danger" @click="remove(row)">删除</el-button>
              </template>
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

    <BidDialog v-model="editVisible" :market="market" :bid="editing" />
    <BidDetailDialog v-model="detailVisible" :bid="detail" />
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import BidDialog from '../components/BidDialog.vue'
import BidDetailDialog from '../components/BidDetailDialog.vue'
import ColumnPicker from '../components/ColumnPicker.vue'
import EmptyBox from '../components/EmptyBox.vue'
import StatusTag from '../components/StatusTag.vue'
import { bondById, fmtRate, fmtWan, hasCodeColumn, isManager, removeBid, store, undoCancel } from '../store'

const route = useRoute()
const market = computed(() => route.meta.market)
const reviewOptions = ['待复核', '已复核', '已退回', '已保存']
const form = reactive({ keyword: '', customer: '', reviewStatus: '', submitter: '' })
const applied = ref({ ...form })
const page = ref(1)
const pageSize = ref(20)
const editVisible = ref(false)
const editing = ref(null)
const detail = ref(null)
const detailVisible = computed({
  get: () => !!detail.value,
  set: (value) => { if (!value) detail.value = null },
})

const pickerCols = computed(() => {
  const cols = [
    { key: 'name', label: '债券简称' },
    { key: 'customer', label: '客户代码' },
    { key: 'rate', label: '投标利率' },
    { key: 'amount', label: '申购量' },
    { key: 'unit', label: '对接人' },
    { key: 'applyType', label: '申请类型' },
    { key: 'reviewStatus', label: '复核状态' },
    { key: 'submitter', label: '操作员' },
    { key: 'createdAt', label: '操作时间' },
  ]
  if (hasCodeColumn(market.value)) cols.unshift({ key: 'code', label: '债券代码' })
  return cols
})
const visibleKeys = ref([])
watch(pickerCols, (cols) => { visibleKeys.value = cols.map((col) => col.key) }, { immediate: true })
function shown(key) { return visibleKeys.value.includes(key) }

const rows = computed(() => store.bids
  .filter((item) => item.market === market.value)
  .filter((item) => isManager() || item.submitterId === store.userId)
  .map((item) => {
    const bond = bondById(item.bondId)
    return { ...item, code: bond?.code || '', name: bond?.name || '' }
  }))

const filtered = computed(() => {
  const query = applied.value
  return rows.value.filter((row) => {
    const keyword = query.keyword.trim()
    if (keyword && !`${row.code}${row.name}`.includes(keyword)) return false
    if (query.customer && !row.customer.includes(query.customer.trim())) return false
    if (query.reviewStatus && row.reviewStatus !== query.reviewStatus) return false
    if (query.submitter && !row.submitter.includes(query.submitter.trim())) return false
    return true
  })
})

const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

function search() {
  applied.value = { ...form }
  page.value = 1
}

function reset() {
  Object.assign(form, { keyword: '', customer: '', reviewStatus: '', submitter: '' })
  search()
}

function openCreate() {
  editing.value = null
  editVisible.value = true
}

function openEdit(row) {
  editing.value = store.bids.find((item) => item.id === row.id) || null
  editVisible.value = true
}

async function remove(row) {
  const approved = row.reviewStatus === '已复核'
  await ElMessageBox.confirm(
    approved ? '该标位已复核。删除将提交撤销申请，投标经理审核通过后才会从标位簿中去掉。' : '确认删除该标位？',
    '删除标位',
    { type: 'warning' },
  )
  const result = removeBid(row.id)
  if (result === 'cancel') ElMessage.success('已提交撤销申请')
  else if (result === 'deleted') ElMessage.success('标位已删除')
  else ElMessage.error(result)
}

function revokeCancel(row) {
  const error = undoCancel(row.id)
  if (error) ElMessage.error(error)
  else ElMessage.success('已撤回撤销，标位继续有效')
}
</script>
