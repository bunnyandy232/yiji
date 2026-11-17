<template>
  <el-dialog
    :model-value="modelValue"
    title="批量导入在团债券"
    width="760px"
    @close="close"
  >
    <p class="hint" style="margin-top: 0">
      请使用模板填写。三品种均按债券代码匹配；无代码时按债券简称 + 发行时间日期匹配。相同则更新要素，已上传的投标文件会保留。发行规模单位为亿元。
    </p>
    <div style="margin-bottom: 12px">
      <el-button type="primary" plain @click="download">下载模板</el-button>
    </div>
    <el-upload drag :auto-upload="false" :show-file-list="false" accept=".xlsx,.xls,.csv" :on-change="onFile">
      <div>将文件拖到此处，或点击上传</div>
      <div class="hint">支持 xlsx、xls、csv</div>
    </el-upload>
    <div v-if="records.length" style="margin-top: 12px">
      <div class="hint" style="margin-bottom: 6px">已解析 {{ records.length }} 条，以下为前 5 条预览</div>
      <el-table v-col-resize :data="records.slice(0, 5)" size="small" border max-height="240">
        <el-table-column v-for="col in columns" :key="col.key" :prop="col.label" :label="col.label" min-width="110" show-overflow-tooltip />
      </el-table>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :disabled="!records.length" @click="confirm">确认导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import { bondColumns, importBonds } from '../store'

const props = defineProps({
  modelValue: Boolean,
  market: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])

const records = ref([])
const columns = computed(() => bondColumns[props.market])

function close() {
  records.value = []
  emit('update:modelValue', false)
}

function download() {
  const headers = columns.value.map((col) => col.label)
  const note = [
    ['1. 请在「在团债券」表按表头填写，不要修改表头。'],
    ['2. 日期使用 YYYY-MM-DD；发行时间可写 YYYY-MM-DD HH:mm。'],
    ['3. 发行规模填写数字，单位为亿元。'],
    ['4. 申购区间填写如 2.05-2.25。'],
    ['5. 债券类型：北金所 MTN/SCP/PPN/CP/ABN；地方债 一般/专项；公司债 公募/私募/ABS。'],
    ['6. 优先按债券代码更新，无代码时按债券简称和发行时间日期更新。'],
  ]
  const book = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([headers])
  sheet['!cols'] = headers.map(() => ({ wch: 18 }))
  XLSX.utils.book_append_sheet(book, sheet, '在团债券')
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(note), '填写说明')
  const names = { bjse: '北金所在团债券导入模板.xlsx', lgb: '地方债在团债券导入模板.xlsx', corp: '公司债在团债券导入模板.xlsx' }
  XLSX.writeFile(book, names[props.market] || '在团债券导入模板.xlsx')
}

function normalize(rows) {
  return rows.map((row) => {
    const next = {}
    Object.entries(row).forEach(([key, value]) => {
      next[String(key).trim()] = value
    })
    return next
  }).filter((row) => Object.entries(row).some(([key, value]) => !key.startsWith('__') && String(value ?? '').trim() !== ''))
}

async function onFile(upload) {
  const file = upload.raw
  if (!file) return
  try {
    const buffer = await file.arrayBuffer()
    const readOptions = { cellDates: true, dateNF: 'yyyy-mm-dd' }
    const book = /\.csv$/i.test(file.name)
      ? XLSX.read(new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, ''), { type: 'string', ...readOptions })
      : XLSX.read(buffer, { type: 'array', ...readOptions })
    const sheet = book.Sheets[book.SheetNames[0]]
    const rows = normalize(XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' }))
    if (!rows.length) {
      records.value = []
      ElMessage.warning('文件中没有数据')
      return
    }
    const headers = Object.keys(rows[0])
    const missing = columns.value.map((col) => col.label).filter((label) => !headers.includes(label))
    if (missing.length) {
      records.value = []
      ElMessage.error(`表头缺少：${missing.join('、')}。请使用系统模板。`)
      return
    }
    records.value = rows
  } catch {
    records.value = []
    ElMessage.error('文件解析失败，请检查格式')
  }
}

async function confirm() {
  const { created, updated, errors } = importBonds(props.market, records.value)
  const summary = `新增 ${created} 只，更新 ${updated} 只`
  if (errors.length) {
    await ElMessageBox.alert(`${summary}。${errors.slice(0, 8).join('；')}`, `有 ${errors.length} 行未导入`, { confirmButtonText: '知道了' })
  } else if (!created && !updated) {
    ElMessage.warning('没有导入任何债券')
    return
  } else {
    ElMessage.success(summary)
  }
  close()
}
</script>
