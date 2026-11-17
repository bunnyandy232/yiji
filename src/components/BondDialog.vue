<template>
  <el-dialog
    :model-value="modelValue"
    :title="bond ? '编辑债券' : '新增债券'"
    width="760px"
    destroy-on-close
    @close="emit('update:modelValue', false)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
      <el-row :gutter="16">
        <el-col v-for="col in columns" :key="col.key" :span="12">
          <el-form-item :label="col.label" :prop="col.key">
            <el-date-picker
              v-if="widget(col.key) === 'date'"
              v-model="form[col.key]"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
              style="width: 100%"
            />
            <el-date-picker
              v-else-if="widget(col.key) === 'datetime'"
              v-model="form[col.key]"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm"
              format="YYYY-MM-DD HH:mm"
              placeholder="请选择发行时间"
              style="width: 100%"
            />
            <el-input-number
              v-else-if="widget(col.key) === 'number'"
              v-model="form[col.key]"
              :min="0"
              :precision="2"
              :step="1"
              controls-position="right"
              style="width: 100%"
            />
            <el-select
              v-else-if="widget(col.key) === 'select'"
              v-model="form[col.key]"
              filterable
              allow-create
              default-first-option
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option v-for="item in optionsOf(col.key)" :key="item" :label="item" :value="item" />
            </el-select>
            <el-input
              v-else
              v-model="form[col.key]"
              :placeholder="placeholder(col.key)"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="投标文件">
        <el-upload :auto-upload="false" :show-file-list="false" multiple :on-change="addFile">
          <el-button>选择文件</el-button>
        </el-upload>
        <div class="file-list">
          <el-tag
            v-for="(file, index) in form.files"
            :key="file + index"
            closable
            @close="form.files.splice(index, 1)"
          >{{ file }}</el-tag>
          <span v-if="!form.files.length" class="muted">可附发行公告、募集说明书、投标须知</span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="save">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { OPTIONS, addBond, bondColumns, updateBond } from '../store'

const props = defineProps({
  modelValue: Boolean,
  market: { type: String, required: true },
  bond: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const formRef = ref()
const form = reactive({ files: [] })
const columns = computed(() => bondColumns[props.market])

const rules = computed(() => {
  const result = {}
  columns.value.forEach((col) => {
    result[col.key] = [{ required: true, message: `请填写${col.label}`, trigger: 'change' }]
  })
  return result
})

function widget(key) {
  if (['issueDate', 'paymentDate', 'listingDate', 'valueDate'].includes(key)) return 'date'
  if (key === 'issueTime') return 'datetime'
  if (key === 'issueAmount') return 'number'
  if (['type', 'issueVenue', 'issuerRating', 'bondRating'].includes(key)) return 'select'
  if (key === 'tenor' && props.market === 'lgb') return 'select'
  return 'text'
}

function optionsOf(key) {
  if (key === 'type') {
    if (props.market === 'lgb') return OPTIONS.lgbType
    if (props.market === 'corp') return OPTIONS.corpType
    return OPTIONS.bjseType
  }
  if (key === 'tenor') return OPTIONS.tenor
  if (key === 'issueVenue') return OPTIONS.issueVenue
  if (key === 'issuerRating' || key === 'bondRating') return OPTIONS.rating
  return []
}

function placeholder(key) {
  if (key === 'range') return '如 2.05-2.25'
  if (key === 'tenor') return '如 270D、1Y、3Y'
  if (key === 'issuerFullName') return '请输入发行人全称'
  if (key === 'region') return '如 北京、广东'
  if (key === 'bookrunner') return '请输入簿记管理人'
  return `请输入${columns.value.find((col) => col.key === key)?.label || ''}`
}

function addFile(file) {
  if (file?.name && !form.files.includes(file.name)) form.files.push(file.name)
}

watch(() => props.modelValue, (open) => {
  if (!open) return
  const next = { files: [] }
  columns.value.forEach((col) => {
    next[col.key] = col.key === 'issueAmount' ? undefined : ''
  })
  if (props.bond) {
    columns.value.forEach((col) => {
      next[col.key] = props.bond[col.key]
    })
    next.files = [...(props.bond.files || [])]
  }
  Object.keys(form).forEach((key) => delete form[key])
  Object.assign(form, next)
  nextTick(() => formRef.value?.clearValidate())
})

async function save() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const payload = { ...form, files: [...(form.files || [])] }
  if (props.bond) updateBond(props.bond.id, payload)
  else addBond(props.market, payload)
  ElMessage.success(props.bond ? '债券已更新' : '债券已添加')
  emit('update:modelValue', false)
}
</script>
