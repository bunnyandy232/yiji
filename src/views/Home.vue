<template>
  <div class="page scroll">
    <div class="home-head">
      <div class="home-title">工作台</div>
      <div class="home-sub">{{ user.name }} · {{ isManager() ? '投标经理' : '销售经理' }} · {{ user.dept }}。右上角可切换身份。</div>
    </div>

    <div class="metrics">
      <div class="metric" @click="go(isManager() ? '/board/bjse' : '/my/bjse')">
        <div class="label">北金所在团</div>
        <div class="num">{{ stats.bjseBonds }}</div>
        <div class="sub">只债券</div>
      </div>
      <div class="metric" @click="go(isManager() ? '/board/lgb' : '/my/lgb')">
        <div class="label">地方债在团</div>
        <div class="num">{{ stats.lgbBonds }}</div>
        <div class="sub">只债券</div>
      </div>
      <div class="metric" @click="go(isManager() ? '/board/corp' : '/my/corp')">
        <div class="label">公司债在团</div>
        <div class="num">{{ stats.corpBonds }}</div>
        <div class="sub">只债券</div>
      </div>
      <div class="metric" @click="go(isManager() ? '/review/bjse' : '/my/bjse')">
        <div class="label">{{ isManager() ? '待复核标位' : '我的待复核' }}</div>
        <div class="num">{{ stats.pending }}</div>
        <div class="sub">北金所 {{ stats.pendingBjse }} · 地方债 {{ stats.pendingLgb }} · 公司债 {{ stats.pendingCorp }}</div>
      </div>
      <div class="metric" @click="go('/my/bjse')">
        <div class="label">{{ isManager() ? '已退回标位' : '我的已退回' }}</div>
        <div class="num">{{ stats.rejected }}</div>
        <div class="sub">需要销售重新提交</div>
      </div>
    </div>

    <div class="section-title">近期待投标债券</div>
    <el-table v-col-resize :data="upcoming" size="small" border>
      <el-table-column label="市场" width="90">
        <template #default="{ row }">{{ marketLabel(row.market) }}</template>
      </el-table-column>
      <el-table-column prop="name" label="债券简称" min-width="140" />
      <el-table-column label="类型" min-width="120">
        <template #default="{ row }">{{ row.type }}</template>
      </el-table-column>
      <el-table-column label="期限" width="90">
        <template #default="{ row }">{{ row.tenor }}</template>
      </el-table-column>
      <el-table-column label="发行规模" width="90">
        <template #default="{ row }">{{ row.issueAmount }} 亿</template>
      </el-table-column>
      <el-table-column label="申购区间" width="140">
        <template #default="{ row }">{{ displayBondField(row, 'range') }}</template>
      </el-table-column>
      <el-table-column label="发行时间" min-width="170">
        <template #default="{ row }">{{ row.issueTime || row.issueDate || '--' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="go(`/board/${row.market}`)">在团债券</el-button>
        </template>
      </el-table-column>
      <template #empty><EmptyBox /></template>
    </el-table>

    <div class="section-title">{{ isManager() ? '待复核' : '我的退回与待复核' }}</div>
    <el-table v-col-resize :data="todoBids" size="small" border>
      <el-table-column label="债券简称" min-width="140">
        <template #default="{ row }">{{ bondById(row.bondId)?.name }}</template>
      </el-table-column>
      <el-table-column prop="customer" label="客户代码" min-width="180" show-overflow-tooltip />
      <el-table-column label="投标利率" width="100">
        <template #default="{ row }">{{ fmtRate(row.rate) }}</template>
      </el-table-column>
      <el-table-column label="申购量(万元)" width="120" align="right">
        <template #default="{ row }">{{ fmtWan(row.amount) }}</template>
      </el-table-column>
      <el-table-column prop="submitter" label="操作员" width="80" />
      <el-table-column label="复核状态" width="90">
        <template #default="{ row }"><StatusTag :status="row.reviewStatus" /></template>
      </el-table-column>
      <el-table-column prop="rejectReason" label="退回原因" min-width="180" show-overflow-tooltip />
      <template #empty><EmptyBox text="暂无待处理标位" /></template>
    </el-table>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import EmptyBox from '../components/EmptyBox.vue'
import StatusTag from '../components/StatusTag.vue'
import { bondById, currentUser, displayBondField, fmtRate, fmtWan, isManager, marketLabel, store } from '../store'

const router = useRouter()
const user = computed(() => currentUser())

const scopedBids = computed(() => (
  isManager() ? store.bids : store.bids.filter((item) => item.submitterId === store.userId)
))

const stats = computed(() => ({
  bjseBonds: store.bonds.filter((item) => item.market === 'bjse').length,
  lgbBonds: store.bonds.filter((item) => item.market === 'lgb').length,
  corpBonds: store.bonds.filter((item) => item.market === 'corp').length,
  pending: scopedBids.value.filter((item) => item.reviewStatus === '待复核').length,
  pendingBjse: scopedBids.value.filter((item) => item.market === 'bjse' && item.reviewStatus === '待复核').length,
  pendingLgb: scopedBids.value.filter((item) => item.market === 'lgb' && item.reviewStatus === '待复核').length,
  pendingCorp: scopedBids.value.filter((item) => item.market === 'corp' && item.reviewStatus === '待复核').length,
  rejected: scopedBids.value.filter((item) => item.reviewStatus === '已退回').length,
}))

const upcoming = computed(() => [...store.bonds].sort((a, b) => bondDate(a).localeCompare(bondDate(b))))

const todoBids = computed(() => scopedBids.value
  .filter((item) => item.reviewStatus === '待复核' || item.reviewStatus === '已退回')
  .slice(0, 8))

function bondDate(bond) {
  return (bond.issueTime || bond.issueDate || '').slice(0, 10)
}

function go(path) {
  router.push(path)
}
</script>
