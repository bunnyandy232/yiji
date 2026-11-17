<template>
  <div class="page">
    <el-form class="filter" label-position="top" @submit.prevent>
      <el-row :gutter="18">
        <el-col :span="6">
          <el-form-item label="债券代码 / 简称">
            <el-input v-model="form.keyword" placeholder="请输入" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="债券类型">
            <el-select v-model="form.type" placeholder="请选择" clearable style="width: 100%">
              <el-option v-for="item in typeOptions" :key="item" :label="item" :value="item" />
            </el-select>
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
          <el-button type="primary" @click="openCreate">新增债券</el-button>
          <el-button type="primary" @click="importVisible = true">批量导入</el-button>
        </template>
        <span v-else class="hint">在团债券由投标经理维护。选择债券即可录入客户标位。</span>
      </div>
    </div>
    <div class="col-line">
      <ColumnPicker :columns="pickerCols" v-model="visibleKeys" />
    </div>

    <div class="table-wrap">
      <el-table v-col-resize :data="paged" size="small" border height="100%">
        <template v-for="col in visibleColumns" :key="col.key">
          <el-table-column
            :label="col.key === 'issueAmount' ? `${col.label}(亿元)` : col.label"
            :min-width="colWidth(col.key)"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ col.key === 'issueAmount' ? row.issueAmount : displayBondField(row, col.key) }}</template>
          </el-table-column>
          <el-table-column
            v-if="col.key === 'issueAmount'"
            label="已投占比"
            width="96"
            align="right"
          >
            <template #default="{ row }">
              <span class="bid-ratio" :class="bidRatioOf(row).tone">{{ bidRatioOf(row).text }}</span>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="投标文件" width="90" align="center">
          <template #default="{ row }">{{ row.files?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" :width="isManager() ? 220 : 140">
          <template #default="{ row }">
            <el-button link type="primary" @click="detail = row">查看</el-button>
            <template v-if="isManager()">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="remove(row)">删除</el-button>
            </template>
            <el-button link type="primary" @click="openBid(row)">编辑标位</el-button>
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

    <BondDialog v-model="bondVisible" :market="market" :bond="editing" />
    <ImportDialog v-model="importVisible" :market="market" />
    <BidDialog v-model="bidVisible" :market="market" :preset-bond-id="presetBondId" />

    <el-drawer v-model="drawer" :title="detail?.name || '债券详情'" size="560px">
      <template v-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item v-for="col in columns" :key="col.key" :label="col.label">
            {{ displayBondField(detail, col.key) }}
          </el-descriptions-item>
          <el-descriptions-item label="投标文件">
            <div v-if="detail.files?.length" class="file-list">
              <el-tag v-for="file in detail.files" :key="file">{{ file }}</el-tag>
            </div>
            <span v-else class="muted">未上传</span>
          </el-descriptions-item>
        </el-descriptions>
        <div style="margin-top: 16px">
          <el-button v-if="isManager()" type="primary" @click="goOverview">查看标位总览</el-button>
          <el-button type="primary" @click="openBid(detail)">编辑标位</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import BidDialog from '../components/BidDialog.vue'
import BondDialog from '../components/BondDialog.vue'
import ColumnPicker from '../components/ColumnPicker.vue'
import EmptyBox from '../components/EmptyBox.vue'
import ImportDialog from '../components/ImportDialog.vue'
import { bidRatioOf, bondColumns, deleteBond, displayBondField, isManager, store, typeOptionsOf } from '../store'

const route = useRoute()
const router = useRouter()
const market = computed(() => route.meta.market)
const columns = computed(() => bondColumns[market.value])
const typeOptions = computed(() => typeOptionsOf(market.value))
const form = reactive({ keyword: '', type: '' })
const applied = ref({ ...form })
const page = ref(1)
const pageSize = ref(20)
const bondVisible = ref(false)
const importVisible = ref(false)
const bidVisible = ref(false)
const editing = ref(null)
const presetBondId = ref('')
const detail = ref(null)
const drawer = computed({
  get: () => !!detail.value,
  set: (value) => { if (!value) detail.value = null },
})

const pickerCols = computed(() => columns.value.map((col) => ({ key: col.key, label: col.label })))
const visibleKeys = ref([])
watch(pickerCols, (cols) => { visibleKeys.value = cols.map((col) => col.key) }, { immediate: true })
const visibleColumns = computed(() => columns.value.filter((col) => visibleKeys.value.includes(col.key)))

function colWidth(key) {
  if (key === 'issueTime') return 170
  if (key === 'name' || key === 'tenderSystem' || key === 'issuerFullName' || key === 'bookrunner') return 180
  if (key === 'issueVenue') return 150
  return 120
}

const filtered = computed(() => {
  const query = applied.value
  return store.bonds.filter((bond) => bond.market === market.value).filter((bond) => {
    const keyword = query.keyword.trim()
    if (keyword && !`${bond.code || ''}${bond.name || ''}`.includes(keyword)) return false
    if (query.type && bond.type !== query.type) return false
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
  Object.assign(form, { keyword: '', type: '' })
  search()
}

function openCreate() {
  editing.value = null
  bondVisible.value = true
}

function openEdit(row) {
  editing.value = row
  bondVisible.value = true
}

function openBid(row) {
  presetBondId.value = row.id
  bidVisible.value = true
}

async function remove(row) {
  const count = store.bids.filter((item) => item.bondId === row.id).length
  await ElMessageBox.confirm(
    count ? `「${row.name}」下有 ${count} 笔标位，删除后将一并删除。` : `确认删除「${row.name}」？`,
    '删除债券',
    { type: 'warning' },
  )
  deleteBond(row.id)
  if (detail.value?.id === row.id) detail.value = null
  ElMessage.success('债券已删除')
}

function goOverview() {
  if (!detail.value) return
  const id = detail.value.id
  detail.value = null
  router.push(`/overview/${market.value}/${id}`)
}
</script>
