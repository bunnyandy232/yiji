<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="720px"
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
      <el-form-item label="债券" prop="bondId">
        <el-select v-model="form.bondId" filterable placeholder="请选择在团债券" style="width: 100%" :disabled="bondLocked">
          <el-option v-for="item in bonds" :key="item.id" :label="bondLabel(item)" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户代码" prop="customer">
        <el-autocomplete
          v-model="form.customer"
          :fetch-suggestions="suggestCustomer"
          placeholder="拼音首字母，如 PZGZ；也可自定义"
          clearable
          style="width: 100%"
        />
        <div class="field-tip">默认取客户名称汉字拼音首字母（如平安资产管理有限责任公司 → PZGZ），支持销售自定义。</div>
      </el-form-item>
      <el-form-item label="对接人" prop="unit">
        <el-input v-model="form.unit" placeholder="默认当前登录用户，可自定义" clearable />
      </el-form-item>
      <el-form-item label="操作员">
        <el-input :model-value="operatorName" readonly disabled />
        <div class="field-tip">操作员固定为当前系统登录用户，不可修改。</div>
      </el-form-item>

      <div v-if="existingBids.length" class="existing-box">
        <div class="existing-title">本债券已录入标位（{{ existingBids.length }}）</div>
        <el-table :data="existingBids" size="small" border max-height="260">
          <el-table-column prop="customer" label="客户代码" min-width="100" show-overflow-tooltip />
          <el-table-column label="投标利率" width="90" align="right">
            <template #default="{ row }">{{ fmtRate(row.rate) }}</template>
          </el-table-column>
          <el-table-column label="申购量(万元)" width="110" align="right">
            <template #default="{ row }">{{ fmtWan(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }"><StatusTag :status="row.reviewStatus" /></template>
          </el-table-column>
          <el-table-column prop="createdAt" label="操作时间" width="150" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <template v-if="row.applyType === '撤销' && row.reviewStatus === '待复核'">
                <el-button link type="primary" @click="revokeExisting(row)">撤回撤销</el-button>
              </template>
              <template v-else>
                <el-button link type="primary" @click="editExisting(row)">编辑</el-button>
                <el-button link type="danger" @click="deleteExisting(row)">删除</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
        <div class="field-tip" style="margin-top: 6px">可对已录入标位直接编辑或删除；下方可继续新增标位。</div>
      </div>

      <el-form-item :label="activeEditId ? '修改利率/申购量' : '新增利率/申购量'" required>
        <div class="pair-list">
          <div v-for="(pair, index) in form.pairs" :key="index" class="pair-row">
            <el-input-number v-model="pair.rate" :min="0" :precision="2" :step="0.01" controls-position="right" placeholder="利率(%)" />
            <el-input-number v-model="pair.amount" :min="0" :step="1000" :precision="0" controls-position="right" placeholder="申购量(万元)" />
            <el-button v-if="!activeEditId" circle @click="addPair">＋</el-button>
            <el-button v-if="!activeEditId" circle :disabled="form.pairs.length <= 1" @click="removePair(index)">－</el-button>
          </div>
        </div>
      </el-form-item>
      <div class="field-tip">
        利率区间 {{ rangeText }}；申购量单位：万元。
        <template v-if="activeEditId">当前正在修改已有标位，提交后将更新该笔记录。</template>
        <template v-else>可点加减增减利率/申购量组合。</template>
      </div>
    </el-form>
    <template #footer>
      <el-button v-if="activeEditId" @click="cancelEdit">取消修改</el-button>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
      <el-button type="primary" @click="save">{{ activeEditId ? '保存修改' : '提交新增' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import StatusTag from './StatusTag.vue'
import { CUSTOMER_CODES, bondRange, currentUser, fmtRate, fmtWan, removeBid, store, submitBid, toCustomerCode, undoCancel } from '../store'

const props = defineProps({
  modelValue: Boolean,
  market: { type: String, required: true },
  bid: { type: Object, default: null },
  presetBondId: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const formRef = ref()
const activeEditId = ref('')
const form = reactive({
  bondId: '',
  customer: '',
  unit: '',
  pairs: [{ rate: undefined, amount: undefined }],
})

const rules = {
  bondId: [{ required: true, message: '请选择债券', trigger: 'change' }],
  customer: [{ required: true, message: '请填写客户代码', trigger: 'blur' }],
}

const operatorName = computed(() => currentUser().name)
const bondLocked = computed(() => !!props.bid || !!props.presetBondId || !!activeEditId.value)
const dialogTitle = computed(() => {
  if (props.presetBondId || props.bid || activeEditId.value) return '编辑标位'
  return '新增标位'
})
const bonds = computed(() => store.bonds.filter((item) => item.market === props.market))
const currentBond = computed(() => store.bonds.find((item) => item.id === form.bondId))
const rangeText = computed(() => {
  const range = bondRange(currentBond.value)
  if (!range) return '未设置'
  return `${fmtRate(range[0])} - ${fmtRate(range[1])}`
})

const existingBids = computed(() => {
  if (!form.bondId) return []
  const user = currentUser()
  return store.bids
    .filter((item) => item.bondId === form.bondId && item.submitterId === user.id)
    .filter((item) => item.id !== activeEditId.value)
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
})

function bondLabel(item) {
  return item.code ? `${item.code} ${item.name}` : item.name
}

function suggestCustomer(query, cb) {
  const q = String(query || '').trim().toUpperCase()
  const list = CUSTOMER_CODES
    .filter((item) => !q || item.includes(q))
    .map((value) => ({ value }))
  cb(list.length ? list : (q ? [{ value: q }] : CUSTOMER_CODES.map((value) => ({ value }))))
}

function addPair() {
  form.pairs.push({ rate: undefined, amount: undefined })
}

function removePair(index) {
  if (form.pairs.length <= 1) return
  form.pairs.splice(index, 1)
}

function usersDept(value) {
  return ['北京分公司', '上海分公司', '深圳分公司', '债券业务部'].includes(value)
}

function resetAddForm(keepCustomer = false) {
  activeEditId.value = ''
  const customer = keepCustomer ? form.customer : ''
  form.customer = customer
  form.unit = currentUser().name
  form.pairs = [{ rate: undefined, amount: undefined }]
  const latest = existingBids.value[0]
  if (!form.customer && latest) form.customer = latest.customer
}

function editExisting(row) {
  activeEditId.value = row.id
  form.customer = row.customer
  form.unit = row.unit && !usersDept(row.unit) ? row.unit : currentUser().name
  form.pairs = [{ rate: Number(row.rate), amount: Number(row.amount) }]
}

async function deleteExisting(row) {
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

function revokeExisting(row) {
  const error = undoCancel(row.id)
  if (error) ElMessage.error(error)
  else ElMessage.success('已撤回撤销，标位继续有效')
}

function cancelEdit() {
  resetAddForm(true)
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  activeEditId.value = props.bid?.id || ''
  form.bondId = props.bid?.bondId || props.presetBondId || ''
  form.customer = props.bid?.customer || ''
  form.unit = currentUser().name
  if (props.bid?.unit && !usersDept(props.bid.unit)) form.unit = props.bid.unit
  form.pairs = props.bid
    ? [{ rate: Number(props.bid.rate), amount: Number(props.bid.amount) }]
    : [{ rate: undefined, amount: undefined }]
  nextTick(() => {
    if (!props.bid) {
      const latest = existingBids.value[0]
      if (latest && !form.customer) form.customer = latest.customer
    }
    formRef.value?.clearValidate()
  })
})

async function save() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  for (const pair of form.pairs) {
    if (pair.rate == null || Number.isNaN(Number(pair.rate))) {
      ElMessage.error('请填写投标利率')
      return
    }
    if (!(Number(pair.amount) > 0)) {
      ElMessage.error('请填写申购量')
      return
    }
  }
  const editId = activeEditId.value || props.bid?.id || ''
  if (editId) {
    const target = store.bids.find((item) => item.id === editId)
    const wasApproved = target?.reviewStatus === '已复核'
    const pair = form.pairs[0]
    const error = submitBid({
      bondId: form.bondId,
      customer: toCustomerCode(form.customer) || form.customer.trim(),
      unit: (form.unit || '').trim() || currentUser().name,
      rate: pair.rate,
      amount: pair.amount,
    }, editId)
    if (error) {
      ElMessage.error(error)
      return
    }
    ElMessage.success(wasApproved ? '修改已提交，需投标经理重新复核' : '标位已更新')
    if (props.bid) {
      emit('update:modelValue', false)
      return
    }
    resetAddForm(true)
    return
  }
  for (const pair of form.pairs) {
    const error = submitBid({
      bondId: form.bondId,
      customer: toCustomerCode(form.customer) || form.customer.trim(),
      unit: (form.unit || '').trim() || currentUser().name,
      rate: pair.rate,
      amount: pair.amount,
    })
    if (error) {
      ElMessage.error(error)
      return
    }
  }
  ElMessage.success(`已提交 ${form.pairs.length} 组标位，待投标经理复核`)
  resetAddForm(true)
}
</script>

<style scoped>
.pair-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pair-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pair-row .el-input-number {
  flex: 1;
}

.existing-box {
  margin: 0 0 14px;
  padding: 10px;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.existing-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}
</style>
