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
    <div class="hint" style="margin-bottom: 8px">按单只债券查看各销售已复核标位，相同利率合并申购量。待复核和已退回不纳入总览。</div>

    <div class="table-wrap">
      <el-table v-col-resize :data="paged" size="small" border height="100%">
        <el-table-column prop="code" label="债券代码" min-width="120" />
        <el-table-column prop="name" label="债券简称" min-width="140" />
        <el-table-column prop="issueTime" label="发行时间" min-width="170" />
        <el-table-column prop="type" label="债券类型" min-width="100" />
        <el-table-column prop="tenor" label="期限" width="80" />
        <el-table-column label="发行规模" width="90">
          <template #default="{ row }">{{ row.issueAmount }} 亿</template>
        </el-table-column>
        <el-table-column label="申购区间" min-width="130">
          <template #default="{ row }">{{ displayBondField(row, 'range') }}</template>
        </el-table-column>
        <el-table-column label="有效笔数" width="90" align="right">
          <template #default="{ row }">{{ row.book.bidCount }}</template>
        </el-table-column>
        <el-table-column label="待复核" width="80" align="right">
          <template #default="{ row }">{{ row.book.pending }}</template>
        </el-table-column>
        <el-table-column label="合计申购" width="110" align="right">
          <template #default="{ row }">{{ wanToYi(row.book.total) }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="110">
          <template #default="{ row }">
            <el-button link type="primary" @click="open(row)">标位总览</el-button>
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
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyBox from '../components/EmptyBox.vue'
import { buildBook, displayBondField, store, typeOptionsOf, wanToYi } from '../store'

const route = useRoute()
const router = useRouter()
const market = computed(() => route.meta.market)
const typeOptions = computed(() => typeOptionsOf(market.value))
const form = reactive({ keyword: '', type: '' })
const applied = ref({ ...form })
const page = ref(1)
const pageSize = ref(20)
const listed = computed(() => store.bonds
  .filter((bond) => bond.market === market.value)
  .map((bond) => ({ ...bond, book: buildBook(bond) })))

const filtered = computed(() => {
  const query = applied.value
  return listed.value.filter((bond) => {
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

function open(row) {
  router.push(`/overview/${market.value}/${row.id}`)
}
</script>
