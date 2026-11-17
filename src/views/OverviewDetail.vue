<template>
  <div class="page scroll">
    <template v-if="bond">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button @click="back">返回列表</el-button>
          <span class="detail-title">{{ bond.name }} 标位总览</span>
        </div>
        <el-button type="primary" @click="copyBook">标位汇总复制</el-button>
      </div>
      <el-descriptions :column="3" border>
        <el-descriptions-item v-for="col in briefCols" :key="col.key" :label="col.label">
          {{ displayBondField(bond, col.key) }}
        </el-descriptions-item>
      </el-descriptions>
      <div class="book-stats">
        <div><span>有效笔数</span><b>{{ book.bidCount }}</b></div>
        <div><span>合计申购</span><b>{{ wanToYi(book.total) }}</b></div>
        <div><span>发行规模</span><b>{{ bond.issueAmount }} 亿</b></div>
      </div>
      <div class="hint" style="margin-bottom: 8px">相同利率的已复核标位已合并申购量。待复核和已退回不纳入。</div>

      <div class="sales-panel">
        <el-alert
          v-if="book.pending"
          :title="`另有 ${book.pending} 笔待复核，未纳入本次合并。`"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 10px"
        />
        <div class="section-title">销售经理标位明细</div>
        <div class="hint" style="margin-bottom: 8px">
          按对接人（销售维度）展示本债券每一笔明细标位。投标经理行使销售权限录入时，身份为「投标经理兼销售经理」，其标位同样纳入本明细。
        </div>
        <div v-if="!salesGroups.length" class="empty-box"><p>暂无销售录入标位</p></div>
        <div v-for="group in salesGroups" :key="group.submitterId" class="sales-card">
          <div class="sales-hd">
            <div class="sales-name">
              <b>{{ group.submitter }}</b>
              <el-tag v-if="group.dualRole" size="small" type="primary" effect="plain">投标经理兼销售经理</el-tag>
              <el-tag v-else size="small" type="info" effect="plain">销售经理</el-tag>
              <span class="muted">{{ group.dept }} · {{ group.bids.length }} 笔 · 合计 {{ fmtWan(group.total) }} 万</span>
            </div>
            <div class="sales-tags">
              <el-tag v-if="group.pending" size="small" type="warning">待复核 {{ group.pending }}</el-tag>
              <el-tag v-if="group.approved" size="small" type="success">已复核 {{ group.approved }}</el-tag>
              <el-tag v-if="group.rejected" size="small" type="danger">已退回 {{ group.rejected }}</el-tag>
            </div>
          </div>
          <table class="sales-detail-table">
            <thead>
              <tr>
                <th>客户代码</th>
                <th>投标利率</th>
                <th>申购量(万元)</th>
                <th>申请类型</th>
                <th>复核状态</th>
                <th>对接人</th>
                <th>提交时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in group.bids" :key="item.id">
                <td>{{ item.customer }}</td>
                <td class="num">{{ fmtRate(item.rate) }}</td>
                <td class="num">{{ fmtWan(item.amount) }}</td>
                <td><StatusTag :status="item.applyType" /></td>
                <td><StatusTag :status="item.reviewStatus" /></td>
                <td>{{ item.unit || item.submitter }}</td>
                <td>{{ item.createdAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="section-title">合并标位汇总</div>
      <el-table v-col-resize :data="book.rows" size="small" border row-key="rate">
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-table v-col-resize :data="row.details" size="small" border>
              <el-table-column prop="submitter" label="操作员" width="90" />
              <el-table-column prop="unit" label="对接人" width="90" />
              <el-table-column prop="customer" label="客户代码" min-width="160" show-overflow-tooltip />
              <el-table-column label="投标利率" width="100" align="right">
                <template #default="{ row: item }">{{ fmtRate(item.rate) }}</template>
              </el-table-column>
              <el-table-column label="申购量(万元)" width="120" align="right">
                <template #default="{ row: item }">{{ fmtWan(item.amount) }}</template>
              </el-table-column>
              <el-table-column label="复核状态" width="90">
                <template #default="{ row: item }"><StatusTag :status="item.reviewStatus" /></template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="标位" width="120">
          <template #default="{ row }">{{ fmtRate(row.rate) }}</template>
        </el-table-column>
        <el-table-column label="合并申购量(万元)" align="right" min-width="150">
          <template #default="{ row }">{{ fmtWan(row.amount) }}</template>
        </el-table-column>
        <el-table-column prop="count" label="笔数" width="70" align="right" />
        <el-table-column label="占比" width="80" align="right">
          <template #default="{ row }">{{ (row.share * 100).toFixed(1) }}%</template>
        </el-table-column>
        <el-table-column label="客户代码" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ customerText(row.customers) }}</template>
        </el-table-column>
        <template #empty><EmptyBox text="暂无已复核标位" /></template>
      </el-table>
    </template>
    <EmptyBox v-else text="未找到该债券" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import EmptyBox from '../components/EmptyBox.vue'
import StatusTag from '../components/StatusTag.vue'
import { bondById, bondColumns, buildBook, customerText, displayBondField, fmtRate, fmtWan, store, users, wanToYi } from '../store'

const route = useRoute()
const router = useRouter()
const bond = computed(() => bondById(route.params.id))
const book = computed(() => (bond.value ? buildBook(bond.value) : null))
const briefCols = computed(() => {
  if (!bond.value) return []
  return bondColumns[bond.value.market].filter((col) => (
    ['name', 'code', 'type', 'tenor', 'issueAmount', 'range', 'issueTime', 'issuerRating', 'bondRating', 'bookrunner', 'issueVenue', 'issuerFullName', 'region', 'paymentDate', 'valueDate'].includes(col.key)
  ))
})

const salesGroups = computed(() => {
  if (!bond.value) return []
  const map = new Map()
  store.bids
    .filter((bid) => bid.bondId === bond.value.id && bid.reviewStatus !== '已保存')
    .forEach((bid) => {
      const key = bid.submitterId || bid.submitter
      if (!map.has(key)) {
        const user = users.find((item) => item.id === key)
        map.set(key, {
          submitterId: key,
          submitter: bid.submitter,
          dept: user?.dept || bid.unit || '-',
          dualRole: user?.role === 'manager',
          bids: [],
        })
      }
      map.get(key).bids.push(bid)
    })
  return [...map.values()]
    .map((group) => {
      const bids = [...group.bids].sort((a, b) => {
        const rateDiff = Number(a.rate) - Number(b.rate)
        if (rateDiff !== 0) return rateDiff
        return String(a.createdAt).localeCompare(String(b.createdAt))
      })
      return {
        ...group,
        bids,
        total: bids.reduce((sum, item) => sum + Number(item.amount || 0), 0),
        pending: bids.filter((item) => item.reviewStatus === '待复核').length,
        approved: bids.filter((item) => item.reviewStatus === '已复核').length,
        rejected: bids.filter((item) => item.reviewStatus === '已退回').length,
      }
    })
    .sort((a, b) => Number(b.dualRole) - Number(a.dualRole) || a.submitter.localeCompare(b.submitter, 'zh-CN'))
})

function yi(wan) {
  return (Number(wan) / 10000).toFixed(2)
}

function back() {
  const market = bond.value?.market || route.params.market || 'bjse'
  router.push(`/overview/${market}`)
}

async function copyBook() {
  if (!bond.value || !book.value) return
  const lines = [
    `${bond.value.name}，申购总量${yi(book.value.total)}亿元`,
    ...book.value.rows.map((row) => `${Number(row.rate).toFixed(4)}%，${yi(row.amount)}亿`),
  ]
  const text = lines.join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea')
    area.value = text
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  ElMessage.success('标位汇总已复制')
}
</script>

<style scoped>
.detail-title {
  font-size: 16px;
  font-weight: 600;
}

.sales-panel {
  margin: 4px 0 16px;
  padding: 12px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.sales-card {
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px 10px 8px;
}

.sales-card:last-child {
  margin-bottom: 0;
}

.sales-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.sales-name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sales-hd .muted {
  color: #909399;
  font-size: 13px;
}

.sales-tags {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.sales-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.sales-detail-table th,
.sales-detail-table td {
  border: 1px solid #ebeef5;
  padding: 8px 10px;
  text-align: left;
  color: #303133;
}

.sales-detail-table th {
  background: #f7f8fa;
  color: #606266;
  font-weight: 500;
}

.sales-detail-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.sales-detail-table tbody tr:hover td {
  background: #f5f7fa;
}
</style>
