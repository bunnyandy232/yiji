import { reactive, watch } from 'vue'

export const users = [
  { id: 'bm1', name: '张敏', role: 'manager', dept: '债券业务部' },
  { id: 'sm1', name: '李航', role: 'sales', dept: '北京分公司' },
  { id: 'sm2', name: '王磊', role: 'sales', dept: '上海分公司' },
  { id: 'sm3', name: '赵倩', role: 'sales', dept: '深圳分公司' },
]

export const CUSTOMER_CODE_MAP = {
  工银理财有限责任公司: 'GYLC',
  建信理财有限责任公司: 'JXLC',
  招银理财有限责任公司: 'ZYLC',
  平安资产管理有限责任公司: 'PZGZ',
  中国人寿资产管理有限责任公司: 'ZGRS',
  中信证券资产管理有限公司: 'ZXZC',
  南方基金管理股份有限公司: 'NFJJ',
  货基专户A: 'HJZHA',
}

/** 兼容旧逻辑：客户全称列表 */
export const CUSTOMERS = Object.keys(CUSTOMER_CODE_MAP)

/** 可选客户代码（支持自定义输入） */
export const CUSTOMER_CODES = [...new Set(Object.values(CUSTOMER_CODE_MAP))]

export const TRADE_TYPES = ['分销', '上市']

const PINYIN_INITIAL = {
  安: 'A', 北: 'B', 产: 'C', 理: 'L', 管: 'G', 工: 'G', 银: 'Y', 建: 'J', 信: 'X',
  招: 'Z', 平: 'P', 资: 'Z', 中: 'Z', 国: 'G', 人: 'R', 寿: 'S', 证: 'Z', 券: 'Q',
  南: 'N', 方: 'F', 基: 'J', 金: 'J', 货: 'H', 专: 'Z', 户: 'H', 有: 'Y', 限: 'X',
  责: 'Z', 任: 'R', 公: 'G', 司: 'S', 股: 'G', 份: 'F', 集: 'J', 团: 'T', 财: 'C',
  华: 'H', 能: 'N', 万: 'W', 科: 'K', 企: 'Q', 业: 'Y', 海: 'H', 通: 'T', 泰: 'T',
  君: 'J', 东: 'D', 美: 'M', 团: 'T', 保: 'B', 利: 'L', 石: 'S', 油: 'Y', 交: 'J',
  通: 'T', 路: 'L', 汽: 'Q', 车: 'C', 龙: 'L', 湖: 'H', 格: 'G', 力: 'L', 珠: 'Z',
  海: 'H', 电: 'D', 器: 'Q', 控: 'K', 股: 'G', 北: 'B', 京: 'J', 广: 'G', 东: 'D',
  深: 'S', 圳: 'Z', 上: 'S', 海: 'H', 重: 'C', 庆: 'Q',
}

export function toCustomerCode(name) {
  const text = String(name || '').trim()
  if (!text) return ''
  if (CUSTOMER_CODE_MAP[text]) return CUSTOMER_CODE_MAP[text]
  if (/^[A-Za-z][A-Za-z0-9._-]*$/.test(text)) return text.toUpperCase()

  // 去掉公司后缀后，按双字词取首字拼音首字母：平安资产管理有限责任公司 → PZGZ
  let core = text
    .replace(/股份/g, '')
    .replace(/有限/g, '')
    .replace(/公司/g, '')
  const letters = []
  for (let i = 0; i < core.length;) {
    const ch = core[i]
    if (/[\u4e00-\u9fff]/.test(ch)) {
      letters.push((PINYIN_INITIAL[ch] || ch).toUpperCase())
      i += /[\u4e00-\u9fff]/.test(core[i + 1]) ? 2 : 1
    } else if (/[A-Za-z0-9]/.test(ch)) {
      letters.push(ch.toUpperCase())
      i += 1
    } else {
      i += 1
    }
  }
  return letters.join('') || text
}

export const MARKET_LABEL = {
  bjse: '北金所',
  lgb: '地方债',
  corp: '公司债',
}

export const OPTIONS = {
  bjseType: ['MTN', 'SCP', 'PPN', 'CP', 'ABN'],
  lgbType: ['一般', '专项'],
  corpType: ['公募', '私募', 'ABS'],
  nature: ['新增', '再融资', '置换'],
  tenor: ['1年', '2年', '3年', '5年', '7年', '10年', '15年', '20年', '30年'],
  tenderSystem: ['财政部政府债券发行系统', '上海证券交易所', '深圳证券交易所'],
  issueVenue: ['银行间', '上交所', '深交所', '北交所', '财政部'],
  rating: ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+'],
}

const TYPE_ALIAS = {
  超短期融资券: 'SCP',
  短期融资券: 'CP',
  中期票据: 'MTN',
  定向工具: 'PPN',
  资产支持票据: 'ABN',
  项目收益票据: 'ABN',
  一般债券: '一般',
  专项债券: '专项',
  公司债: '公募',
  企业债: '公募',
  可转债: '公募',
  可交换债: '公募',
  私募公司债: '私募',
}

export function venueLabel(value) {
  const text = String(value || '').trim()
  if (!text) return '--'
  if (text.includes('财政') || text === '财政部') return '财政部'
  if (text.includes('银行间') || text.includes('北金所') || text === '银行间') return '银行间'
  if (text.includes('上海') || text === '上交所') return '上交所'
  if (text.includes('深圳') || text === '深交所') return '深交所'
  if (text.includes('北京') || text === '北交所') return '北交所'
  return text
}

export function marketLabel(market) {
  return MARKET_LABEL[market] || market || '-'
}

export function typeOptionsOf(market) {
  if (market === 'lgb') return OPTIONS.lgbType
  if (market === 'corp') return OPTIONS.corpType
  return OPTIONS.bjseType
}

export function hasCodeColumn() {
  return true
}

const SHARED_BOARD_COLS = [
  { key: 'issueTime', label: '发行时间' },
  { key: 'code', label: '债券代码' },
  { key: 'name', label: '债券简称' },
  { key: 'type', label: '债券类型' },
  { key: 'tenor', label: '债券期限' },
  { key: 'issueAmount', label: '发行规模' },
  { key: 'range', label: '申购区间' },
  { key: 'issuerRating', label: '主体评级' },
  { key: 'bondRating', label: '债项评级' },
  { key: 'bookrunner', label: '簿记管理人' },
  { key: 'paymentDate', label: '缴款日' },
  { key: 'valueDate', label: '起息日' },
  { key: 'issueVenue', label: '发行场所' },
  { key: 'issuerFullName', label: '发行人全称' },
  { key: 'region', label: '区域' },
]

export const bondColumns = {
  bjse: [...SHARED_BOARD_COLS],
  corp: [...SHARED_BOARD_COLS],
  lgb: [
    { key: 'issueTime', label: '发行时间' },
    { key: 'code', label: '债券代码' },
    { key: 'name', label: '债券简称' },
    { key: 'type', label: '债券类型' },
    { key: 'tenor', label: '债券期限' },
    { key: 'issueAmount', label: '发行规模' },
    { key: 'range', label: '申购区间' },
    { key: 'paymentDate', label: '缴款日' },
    { key: 'valueDate', label: '起息日' },
    { key: 'issueVenue', label: '发行场所' },
    { key: 'issuerFullName', label: '发行人全称' },
  ],
}

const KEY = 'tender-system-2.0'

const BOOK = {
  bj1: { marginalRate: 1.82, marginalMultiple: 1.15, overallMultiple: 2.4, bookrunner: '中信证券', deadline: '2026-11-16 17:00', paymentDate: '2026-11-16', valueDate: '2026-11-17', commissionRate: '0.10', totalBidAmount: 480000, marginalBidAmount: 50000, bookUpdatedAt: '2026-11-16 15:42:18', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '中国华能集团有限公司', region: '北京' },
  bj2: { marginalRate: 2.05, marginalMultiple: 1.08, overallMultiple: 1.86, bookrunner: '中金公司', deadline: '2026-11-17 17:00', paymentDate: '2026-11-17', valueDate: '2026-11-18', commissionRate: '0.08', totalBidAmount: 279000, marginalBidAmount: 70000, bookUpdatedAt: '2026-11-17 14:18:06', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '北京京东世纪贸易有限公司', region: '北京' },
  bj3: { marginalRate: 2.4, marginalMultiple: 1.32, overallMultiple: 3.05, bookrunner: '华泰证券', deadline: '2026-11-18 16:30', paymentDate: '2026-11-18', valueDate: '2026-11-19', commissionRate: '0.12', totalBidAmount: 915000, marginalBidAmount: 100000, bookUpdatedAt: '2026-11-18 15:05:41', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '中国交通建设股份有限公司', region: '北京' },
  bj4: { marginalRate: null, marginalMultiple: null, overallMultiple: null, bookrunner: '招商证券', deadline: '2026-11-19 17:00', paymentDate: '2026-11-19', valueDate: '2026-11-20', commissionRate: '0.15', totalBidAmount: null, marginalBidAmount: null, bookUpdatedAt: null, issuerRating: 'AA+', bondRating: 'AA+', issueVenue: '银行间', issuerFullName: '万科企业股份有限公司', region: '广东' },
  bj5: { marginalRate: 2.18, marginalMultiple: 1.22, overallMultiple: 2.15, bookrunner: '国泰君安', deadline: '2026-11-20 17:00', paymentDate: '2026-11-20', valueDate: '2026-11-21', commissionRate: '0.09', totalBidAmount: 537500, marginalBidAmount: 50000, bookUpdatedAt: '2026-11-20 16:12:33', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '中国石油天然气集团有限公司', region: '北京' },
  bj6: { marginalRate: 1.96, marginalMultiple: 1.05, overallMultiple: 1.62, bookrunner: '中信建投', deadline: '2026-11-20 16:30', paymentDate: '2026-11-20', valueDate: '2026-11-21', commissionRate: '0.07', totalBidAmount: 194400, marginalBidAmount: 35000, bookUpdatedAt: '2026-11-20 15:48:09', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '北京三快在线科技有限公司', region: '北京' },
  bj7: { marginalRate: 2.68, marginalMultiple: 1.4, overallMultiple: 2.88, bookrunner: '海通证券', deadline: '2026-11-21 17:00', paymentDate: '2026-11-21', valueDate: '2026-11-22', commissionRate: '0.11', totalBidAmount: 1008000, marginalBidAmount: 85000, bookUpdatedAt: '2026-11-21 16:22:55', issuerRating: 'AAA', bondRating: 'AAA', issueVenue: '银行间', issuerFullName: '保利发展控股集团股份有限公司', region: '广东' },
}

function createSeed() {
  const bonds = [
    { id: 'bj1', market: 'bjse', issueTime: '2026-11-16 10:00', code: '012600321', name: '26华能SCP003', type: 'SCP', tenor: '270D', issueAmount: 20, range: '1.72-1.92', files: ['26华能SCP003募集说明书.pdf', '26华能SCP003申购说明.xlsx'], ...BOOK.bj1 },
    { id: 'bj2', market: 'bjse', issueTime: '2026-11-17 10:00', code: '012600418', name: '26京东CP005', type: 'CP', tenor: '1Y', issueAmount: 15, range: '1.95-2.15', files: ['26京东CP005募集说明书.pdf'], ...BOOK.bj2 },
    { id: 'bj3', market: 'bjse', issueTime: '2026-11-18 14:00', code: '102600156', name: '26中交MTN002', type: 'MTN', tenor: '3Y', issueAmount: 30, range: '2.25-2.55', files: [], ...BOOK.bj3 },
    { id: 'bj4', market: 'bjse', issueTime: '2026-11-19 10:00', code: '032600077', name: '26万科PPN001', type: 'PPN', tenor: '2Y', issueAmount: 10, range: '2.80-3.20', files: ['26万科PPN001定向募集说明书.pdf'], ...BOOK.bj4 },
    { id: 'lg1', market: 'lgb', issueTime: '2026-11-17 09:30', code: '268047', name: '26浙江债47', type: '一般', tenor: '10年', issueAmount: 50, range: '2.05-2.25', paymentDate: '2026-11-18', valueDate: '2026-11-18', issueVenue: '财政部', issuerFullName: '浙江省人民政府', files: ['26浙江债47发行公告.pdf'] },
    { id: 'lg2', market: 'lgb', issueTime: '2026-11-17 10:00', code: '268015', name: '26四川债15', type: '专项', tenor: '7年', issueAmount: 40, range: '2.20-2.45', paymentDate: '2026-11-18', valueDate: '2026-11-18', issueVenue: '财政部', issuerFullName: '四川省人民政府', files: [] },
    { id: 'lg3', market: 'lgb', issueTime: '2026-11-18 09:30', code: '268022', name: '26广东债22', type: '一般', tenor: '5年', issueAmount: 30, range: '1.95-2.15', paymentDate: '2026-11-19', valueDate: '2026-11-19', issueVenue: '上交所', issuerFullName: '广东省人民政府', files: ['26广东债22招标书.pdf'] },
    { id: 'lg4', market: 'lgb', issueTime: '2026-11-19 09:30', code: '268009', name: '26山东债09', type: '专项', tenor: '30年', issueAmount: 20, range: '2.35-2.60', paymentDate: '2026-11-20', valueDate: '2026-11-20', issueVenue: '深交所', issuerFullName: '山东省人民政府', files: [] },
    { id: 'bj5', market: 'bjse', issueTime: '2026-11-20 09:30', code: '012600529', name: '26中石油SCP008', type: 'SCP', tenor: '180D', issueAmount: 25, range: '2.05-2.25', files: ['26中石油SCP008募集说明书.pdf'], ...BOOK.bj5 },
    { id: 'bj6', market: 'bjse', issueTime: '2026-11-20 10:30', code: '012600610', name: '26美团CP003', type: 'CP', tenor: '1Y', issueAmount: 12, range: '1.85-2.05', files: [], ...BOOK.bj6 },
    { id: 'bj7', market: 'bjse', issueTime: '2026-11-21 14:00', code: '102600288', name: '26保利MTN004', type: 'MTN', tenor: '5Y', issueAmount: 35, range: '2.55-2.85', files: ['26保利MTN004募集说明书.pdf'], ...BOOK.bj7 },
    { id: 'lg5', market: 'lgb', issueTime: '2026-11-20 09:30', code: '268031', name: '26江苏债31', type: '一般', tenor: '15年', issueAmount: 45, range: '2.15-2.35', paymentDate: '2026-11-21', valueDate: '2026-11-21', issueVenue: '财政部', issuerFullName: '江苏省人民政府', files: ['26江苏债31发行公告.pdf'] },
    { id: 'lg6', market: 'lgb', issueTime: '2026-11-21 10:00', code: '268018', name: '26湖北债18', type: '专项', tenor: '10年', issueAmount: 28, range: '2.25-2.50', paymentDate: '2026-11-22', valueDate: '2026-11-22', issueVenue: '上交所', issuerFullName: '湖北省人民政府', files: [] },
    { id: 'cp1', market: 'corp', issueTime: '2026-11-18 09:30', code: '115901', name: '26万科01', type: '公募', tenor: '3Y', issueAmount: 20, range: '2.40-2.70', issuerRating: 'AA+', bondRating: 'AA+', bookrunner: '中信证券', paymentDate: '2026-11-19', valueDate: '2026-11-19', issueVenue: '深交所', issuerFullName: '万科企业股份有限公司', region: '广东', files: ['26万科01募集说明书.pdf'] },
    { id: 'cp2', market: 'corp', issueTime: '2026-11-19 10:00', code: '115902', name: '26招路02', type: '公募', tenor: '5Y', issueAmount: 15, range: '2.20-2.45', issuerRating: 'AAA', bondRating: 'AAA', bookrunner: '中金公司', paymentDate: '2026-11-20', valueDate: '2026-11-20', issueVenue: '上交所', issuerFullName: '招商局公路网络科技控股股份有限公司', region: '广东', files: [] },
    { id: 'cp3', market: 'corp', issueTime: '2026-11-20 14:00', code: '115903', name: '26华能G1', type: '公募', tenor: '7Y', issueAmount: 25, range: '2.55-2.85', issuerRating: 'AAA', bondRating: 'AAA', bookrunner: '华泰证券', paymentDate: '2026-11-21', valueDate: '2026-11-21', issueVenue: '上交所', issuerFullName: '中国华能集团有限公司', region: '北京', files: ['26华能G1发行公告.pdf'] },
    { id: 'cp4', market: 'corp', issueTime: '2026-11-21 09:30', code: '115904', name: '26中信G1', type: '公募', tenor: '3Y', issueAmount: 18, range: '2.35-2.60', issuerRating: 'AAA', bondRating: 'AAA', bookrunner: '中信建投', paymentDate: '2026-11-22', valueDate: '2026-11-22', issueVenue: '上交所', issuerFullName: '中信集团有限公司', region: '北京', files: ['26中信G1募集说明书.pdf'] },
    { id: 'cp5', market: 'corp', issueTime: '2026-11-21 10:30', code: '115905', name: '26平安02', type: '公募', tenor: '5Y', issueAmount: 22, range: '2.45-2.70', issuerRating: 'AAA', bondRating: 'AAA', bookrunner: '国泰君安', paymentDate: '2026-11-22', valueDate: '2026-11-22', issueVenue: '深交所', issuerFullName: '中国平安保险（集团）股份有限公司', region: '广东', files: [] },
    { id: 'cp6', market: 'corp', issueTime: '2026-11-22 09:30', code: '115906', name: '26北汽01', type: '公募', tenor: '3Y', issueAmount: 12, range: '2.50-2.80', issuerRating: 'AA+', bondRating: 'AA+', bookrunner: '中金公司', paymentDate: '2026-11-23', valueDate: '2026-11-23', issueVenue: '北交所', issuerFullName: '北京汽车集团有限公司', region: '北京', files: ['26北汽01发行公告.pdf'] },
    { id: 'cp7', market: 'corp', issueTime: '2026-11-22 14:00', code: '115907', name: '26龙湖03', type: '私募', tenor: '4Y', issueAmount: 10, range: '2.80-3.20', issuerRating: 'AA', bondRating: 'AA', bookrunner: '招商证券', paymentDate: '2026-11-23', valueDate: '2026-11-23', issueVenue: '上交所', issuerFullName: '龙湖集团控股有限公司', region: '重庆', files: [] },
    { id: 'cp8', market: 'corp', issueTime: '2026-11-23 10:00', code: '115908', name: '26格力01', type: 'ABS', tenor: '5Y', issueAmount: 16, range: '2.30-2.55', issuerRating: 'AAA', bondRating: 'AAA', bookrunner: '海通证券', paymentDate: '2026-11-24', valueDate: '2026-11-24', issueVenue: '深交所', issuerFullName: '珠海格力电器股份有限公司', region: '广东', files: ['26格力01募集说明书.pdf'] },
  ]

  const bid = (partial) => ({
    status: partial.reviewStatus === '已退回' ? '已退回' : '已提交',
    rejectReason: '',
    ...partial,
    customer: toCustomerCode(partial.customer),
    unit: partial.submitter,
  })

  const bids = [
    bid({ id: 'd1', bondId: 'bj1', market: 'bjse', customer: '工银理财有限责任公司', rate: 1.8, amount: 90000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:02:18' }),
    bid({ id: 'd2', bondId: 'bj1', market: 'bjse', customer: '平安资产管理有限责任公司', rate: 1.8, amount: 80000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:11:42' }),
    bid({ id: 'd3', bondId: 'bj1', market: 'bjse', customer: '南方基金管理股份有限公司', rate: 1.82, amount: 50000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:20:05' }),
    bid({ id: 'd4', bondId: 'bj1', market: 'bjse', customer: '建信理财有限责任公司', rate: 1.78, amount: 40000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '修改', createdAt: '2026-11-16 10:06:33' }),
    bid({ id: 'd5', bondId: 'bj1', market: 'bjse', customer: '货基专户A', rate: 1.88, amount: 20000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已退回', applyType: '新增', rejectReason: '价格偏高，建议贴近区间下沿后重新提交', createdAt: '2026-11-16 08:46:10' }),
    bid({ id: 'd6', bondId: 'bj2', market: 'bjse', customer: '招银理财有限责任公司', rate: 2.02, amount: 60000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:32:00' }),
    bid({ id: 'd7', bondId: 'bj2', market: 'bjse', customer: '工银理财有限责任公司', rate: 2.05, amount: 70000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-16 10:18:26' }),
    bid({ id: 'd8', bondId: 'bj3', market: 'bjse', customer: '中国人寿资产管理有限责任公司', rate: 2.36, amount: 80000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-15 16:12:08' }),
    bid({ id: 'd9', bondId: 'bj3', market: 'bjse', customer: '平安资产管理有限责任公司', rate: 2.4, amount: 100000, tradeType: '上市', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-15 17:02:44' }),
    bid({ id: 'd10', bondId: 'lg1', market: 'lgb', customer: '工银理财有限责任公司', rate: 2.12, amount: 150000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:05:12' }),
    bid({ id: 'd11', bondId: 'lg1', market: 'lgb', customer: '平安资产管理有限责任公司', rate: 2.12, amount: 120000, tradeType: '分销', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:18:40' }),
    bid({ id: 'd12', bondId: 'lg1', market: 'lgb', customer: '招银理财有限责任公司', rate: 2.15, amount: 180000, tradeType: '上市', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:26:03' }),
    bid({ id: 'd13', bondId: 'lg1', market: 'lgb', customer: '中国人寿资产管理有限责任公司', rate: 2.2, amount: 100000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:40:22' }),
    bid({ id: 'd14', bondId: 'lg1', market: 'lgb', customer: '中信证券资产管理有限公司', rate: 2.18, amount: 50000, tradeType: '上市', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-16 10:02:11' }),
    bid({ id: 'd15', bondId: 'lg1', market: 'lgb', customer: '建信理财有限责任公司', rate: 2.1, amount: 80000, tradeType: '分销', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '撤销', createdAt: '2026-11-16 10:15:00' }),
    bid({ id: 'd16', bondId: 'lg1', market: 'lgb', customer: '南方基金管理股份有限公司', rate: 2.08, amount: 30000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已退回', applyType: '新增', rejectReason: '单户申购量超过内部限额，请与客户确认后重新提交', createdAt: '2026-11-16 08:40:19' }),
    bid({ id: 'd17', bondId: 'lg2', market: 'lgb', customer: '建信理财有限责任公司', rate: 2.28, amount: 150000, tradeType: '分销', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:22:16' }),
    bid({ id: 'd18', bondId: 'lg2', market: 'lgb', customer: '招银理财有限责任公司', rate: 2.28, amount: 80000, tradeType: '上市', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:36:48' }),
    bid({ id: 'd19', bondId: 'lg2', market: 'lgb', customer: '工银理财有限责任公司', rate: 2.3, amount: 120000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-16 09:48:02' }),
    bid({ id: 'd20', bondId: 'lg2', market: 'lgb', customer: '平安资产管理有限责任公司', rate: 2.28, amount: 100000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-16 10:21:37' }),
    bid({ id: 'd21', bondId: 'lg3', market: 'lgb', customer: '南方基金管理股份有限公司', rate: 2, amount: 50000, tradeType: '上市', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已退回', applyType: '新增', rejectReason: '客户额度未获批', createdAt: '2026-11-15 15:18:29' }),
    bid({ id: 'd22', bondId: 'bj5', market: 'bjse', customer: '工银理财有限责任公司', rate: 2.12, amount: 80000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 09:12:08' }),
    bid({ id: 'd23', bondId: 'bj5', market: 'bjse', customer: '平安资产管理有限责任公司', rate: 2.15, amount: 60000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-20 09:28:41' }),
    bid({ id: 'd24', bondId: 'bj5', market: 'bjse', customer: '招银理财有限责任公司', rate: 2.18, amount: 50000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 09:45:16' }),
    bid({ id: 'd25', bondId: 'bj6', market: 'bjse', customer: '建信理财有限责任公司', rate: 1.9, amount: 40000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-20 10:05:22' }),
    bid({ id: 'd26', bondId: 'bj6', market: 'bjse', customer: '中国人寿资产管理有限责任公司', rate: 1.95, amount: 55000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 10:18:07' }),
    bid({ id: 'd27', bondId: 'bj6', market: 'bjse', customer: '南方基金管理股份有限公司', rate: 1.98, amount: 35000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 10:31:44' }),
    bid({ id: 'd28', bondId: 'bj7', market: 'bjse', customer: '工银理财有限责任公司', rate: 2.62, amount: 90000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 09:08:33' }),
    bid({ id: 'd29', bondId: 'bj7', market: 'bjse', customer: '中信证券资产管理有限公司', rate: 2.68, amount: 70000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-21 09:22:19' }),
    bid({ id: 'd30', bondId: 'bj7', market: 'bjse', customer: '平安资产管理有限责任公司', rate: 2.72, amount: 85000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 09:40:55' }),
    bid({ id: 'd31', bondId: 'lg5', market: 'lgb', customer: '招银理财有限责任公司', rate: 2.2, amount: 120000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 09:15:40' }),
    bid({ id: 'd32', bondId: 'lg5', market: 'lgb', customer: '建信理财有限责任公司', rate: 2.22, amount: 100000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 09:33:12' }),
    bid({ id: 'd33', bondId: 'lg5', market: 'lgb', customer: '中国人寿资产管理有限责任公司', rate: 2.25, amount: 90000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-20 09:50:28' }),
    bid({ id: 'd34', bondId: 'lg6', market: 'lgb', customer: '工银理财有限责任公司', rate: 2.3, amount: 75000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-21 10:02:17' }),
    bid({ id: 'd35', bondId: 'lg6', market: 'lgb', customer: '平安资产管理有限责任公司', rate: 2.35, amount: 88000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 10:16:45' }),
    bid({ id: 'd36', bondId: 'lg6', market: 'lgb', customer: '南方基金管理股份有限公司', rate: 2.38, amount: 62000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 10:29:03' }),
    bid({ id: 'd37', bondId: 'cp1', market: 'corp', customer: '工银理财有限责任公司', rate: 2.5, amount: 80000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-18 09:40:12' }),
    bid({ id: 'd38', bondId: 'cp1', market: 'corp', customer: '平安资产管理有限责任公司', rate: 2.55, amount: 60000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-18 09:55:28' }),
    bid({ id: 'd39', bondId: 'cp1', market: 'corp', customer: '招银理财有限责任公司', rate: 2.6, amount: 50000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-18 10:12:06' }),
    bid({ id: 'd40', bondId: 'cp2', market: 'corp', customer: '建信理财有限责任公司', rate: 2.28, amount: 70000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-19 10:18:33' }),
    bid({ id: 'd41', bondId: 'cp2', market: 'corp', customer: '中国人寿资产管理有限责任公司', rate: 2.32, amount: 55000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-19 10:36:41' }),
    bid({ id: 'd42', bondId: 'cp2', market: 'corp', customer: '南方基金管理股份有限公司', rate: 2.35, amount: 40000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-19 10:48:19' }),
    bid({ id: 'd43', bondId: 'cp3', market: 'corp', customer: '工银理财有限责任公司', rate: 2.65, amount: 90000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 14:22:08' }),
    bid({ id: 'd44', bondId: 'cp3', market: 'corp', customer: '中信证券资产管理有限公司', rate: 2.7, amount: 75000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-20 14:40:55' }),
    bid({ id: 'd45', bondId: 'cp3', market: 'corp', customer: '平安资产管理有限责任公司', rate: 2.75, amount: 65000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-20 14:58:27' }),
    bid({ id: 'd46', bondId: 'cp4', market: 'corp', customer: '工银理财有限责任公司', rate: 2.4, amount: 70000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 09:42:10' }),
    bid({ id: 'd47', bondId: 'cp4', market: 'corp', customer: '建信理财有限责任公司', rate: 2.45, amount: 55000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 09:58:33' }),
    bid({ id: 'd48', bondId: 'cp4', market: 'corp', customer: '招银理财有限责任公司', rate: 2.5, amount: 40000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-21 10:12:06' }),
    bid({ id: 'd49', bondId: 'cp5', market: 'corp', customer: '中国人寿资产管理有限责任公司', rate: 2.5, amount: 80000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 10:40:18' }),
    bid({ id: 'd50', bondId: 'cp5', market: 'corp', customer: '平安资产管理有限责任公司', rate: 2.55, amount: 60000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-21 10:55:41' }),
    bid({ id: 'd51', bondId: 'cp5', market: 'corp', customer: '南方基金管理股份有限公司', rate: 2.6, amount: 45000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-21 11:08:22' }),
    bid({ id: 'd52', bondId: 'cp6', market: 'corp', customer: '工银理财有限责任公司', rate: 2.55, amount: 50000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-22 09:45:09' }),
    bid({ id: 'd53', bondId: 'cp6', market: 'corp', customer: '中信证券资产管理有限公司', rate: 2.6, amount: 38000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-22 10:02:37' }),
    bid({ id: 'd54', bondId: 'cp6', market: 'corp', customer: '招银理财有限责任公司', rate: 2.65, amount: 32000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-22 10:18:55' }),
    bid({ id: 'd55', bondId: 'cp7', market: 'corp', customer: '建信理财有限责任公司', rate: 2.9, amount: 42000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-22 14:20:14' }),
    bid({ id: 'd56', bondId: 'cp7', market: 'corp', customer: '平安资产管理有限责任公司', rate: 3.0, amount: 35000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-22 14:36:48' }),
    bid({ id: 'd57', bondId: 'cp7', market: 'corp', customer: '南方基金管理股份有限公司', rate: 3.05, amount: 28000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-22 14:50:03' }),
    bid({ id: 'd58', bondId: 'cp8', market: 'corp', customer: '工银理财有限责任公司', rate: 2.35, amount: 65000, tradeType: '分销', unit: '北京分公司', submitter: '李航', submitterId: 'sm1', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-23 10:15:27' }),
    bid({ id: 'd59', bondId: 'cp8', market: 'corp', customer: '中国人寿资产管理有限责任公司', rate: 2.4, amount: 50000, tradeType: '上市', unit: '上海分公司', submitter: '王磊', submitterId: 'sm2', reviewStatus: '已复核', applyType: '新增', createdAt: '2026-11-23 10:32:11' }),
    bid({ id: 'd60', bondId: 'cp8', market: 'corp', customer: '招银理财有限责任公司', rate: 2.45, amount: 40000, tradeType: '分销', unit: '深圳分公司', submitter: '赵倩', submitterId: 'sm3', reviewStatus: '待复核', applyType: '新增', createdAt: '2026-11-23 10:48:40' }),
  ]

  return { bonds, bids }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.bonds) || !Array.isArray(data.bids)) return null
    if (!data.bonds.length) return null
    return data
  } catch {
    return null
  }
}

const saved = loadSaved()
const seed = createSeed()

function patchBooks(bonds) {
  bonds.forEach((bond) => {
    const book = BOOK[bond.id]
    if (!book) return
    if (bond.bookrunner == null) Object.assign(bond, book)
    else {
      ;['totalBidAmount', 'marginalBidAmount', 'bookUpdatedAt', 'overallMultiple', 'commissionRate', 'deadline', 'valueDate', 'paymentDate', 'marginalRate', 'marginalMultiple', 'issuerRating', 'bondRating', 'issueVenue', 'issuerFullName', 'region'].forEach((key) => {
        if ((bond[key] == null || bond[key] === '') && book[key] != null) bond[key] = book[key]
      })
    }
  })
}

function patchLgbCodes(bonds) {
  const codes = Object.fromEntries(seed.bonds.filter((item) => item.market === 'lgb' && item.code).map((item) => [item.id, item.code]))
  bonds.forEach((bond) => {
    if (bond.market === 'lgb' && !bond.code && codes[bond.id]) bond.code = codes[bond.id]
  })
}

function patchCorpVenues(bonds) {
  const venues = Object.fromEntries(seed.bonds.filter((item) => item.market === 'corp').map((item) => [item.id, item.issueVenue]))
  bonds.forEach((bond) => {
    if (bond.market !== 'corp') return
    if (venues[bond.id]) bond.issueVenue = venues[bond.id]
    else bond.issueVenue = venueLabel(bond.issueVenue)
  })
}

/** 将旧版在团要素迁移到统一字段 */
function patchBondSchema(bonds) {
  const byId = Object.fromEntries(seed.bonds.map((item) => [item.id, item]))
  bonds.forEach((bond) => {
    if (TYPE_ALIAS[bond.type]) bond.type = TYPE_ALIAS[bond.type]
    const seedBond = byId[bond.id]
    if (seedBond) {
      bondColumns[bond.market]?.forEach((col) => {
        if ((bond[col.key] == null || bond[col.key] === '') && seedBond[col.key] != null) {
          bond[col.key] = seedBond[col.key]
        }
      })
      if (TYPE_ALIAS[bond.type]) bond.type = TYPE_ALIAS[bond.type]
    }
    if (bond.market === 'lgb') {
      if (!bond.issueTime) {
        const date = bond.issueDate || ''
        const time = String(bond.tenderTime || '').split('-')[0] || ''
        bond.issueTime = date && time ? `${date} ${time}` : (date || '')
      }
      if (!bond.range && bond.rateRange) bond.range = bond.rateRange
      if (!bond.rateRange && bond.range) bond.rateRange = bond.range
      if (!bond.issueVenue) bond.issueVenue = venueLabel(bond.tenderSystem) || '财政部'
      else bond.issueVenue = venueLabel(bond.issueVenue)
      if (!bond.valueDate) bond.valueDate = bond.listingDate || bond.paymentDate || ''
      if (!bond.issueDate && bond.issueTime) bond.issueDate = String(bond.issueTime).slice(0, 10)
    }
    if (bond.market === 'bjse') {
      if (!bond.issueVenue) bond.issueVenue = '银行间'
      else bond.issueVenue = venueLabel(bond.issueVenue)
      if (!bond.paymentDate && bond.valueDate) bond.paymentDate = bond.valueDate
    }
    if (bond.market === 'corp') {
      if (bond.issueVenue) bond.issueVenue = venueLabel(bond.issueVenue)
    }
  })
}

function patchBids(bids) {
  const depts = new Set(users.map((item) => item.dept))
  bids.forEach((bid) => {
    if (!bid.unit || depts.has(bid.unit)) bid.unit = bid.submitter || bid.unit
    if (bid.customer) bid.customer = toCustomerCode(bid.customer)
  })
}

function mergeSeed(existingBonds, existingBids) {
  const bondIds = new Set(existingBonds.map((item) => item.id))
  const bidIds = new Set(existingBids.map((item) => item.id))
  seed.bonds.forEach((bond) => {
    if (!bondIds.has(bond.id)) existingBonds.push(structuredClone(bond))
  })
  seed.bids.forEach((bid) => {
    if (!bidIds.has(bid.id)) existingBids.push(structuredClone(bid))
  })
}

const initialBonds = saved?.bonds ? [...saved.bonds] : [...seed.bonds]
const initialBids = saved?.bids ? [...saved.bids] : [...seed.bids]
if (saved) mergeSeed(initialBonds, initialBids)
patchBooks(initialBonds)
patchLgbCodes(initialBonds)
patchCorpVenues(initialBonds)
patchBondSchema(initialBonds)
patchBids(initialBids)

export const store = reactive({
  userId: saved?.userId || 'bm1',
  bonds: initialBonds,
  bids: initialBids,
  followed: saved?.followed || [],
})

function persist() {
  localStorage.setItem(KEY, JSON.stringify({
    userId: store.userId,
    bonds: store.bonds,
    bids: store.bids,
    followed: store.followed,
  }))
}

persist()
watch(store, persist, { deep: true })

let seq = 1
function uid(prefix) {
  seq += 1
  return `${prefix}${Date.now().toString(36)}${seq.toString(36)}`
}

export function currentUser() {
  return users.find((u) => u.id === store.userId) || users[0]
}

export function isManager() {
  return currentUser().role === 'manager'
}

export function toggleFollow(id) {
  const index = store.followed.indexOf(id)
  if (index >= 0) store.followed.splice(index, 1)
  else store.followed.push(id)
}

export function resetData() {
  const data = createSeed()
  store.userId = 'bm1'
  store.bonds = data.bonds
  store.bids = data.bids
  store.followed = []
}

export function bondById(id) {
  return store.bonds.find((b) => b.id === id)
}

export function bondRange(bond) {
  if (!bond) return null
  const raw = bond.range || bond.rateRange
  const nums = String(raw || '').match(/\d+(?:\.\d+)?/g)
  if (!nums || nums.length < 2) return null
  return [Number(nums[0]), Number(nums[1])]
}

export function displayBondField(bond, key) {
  if (!bond) return '-'
  const value = bond[key]
  if (value == null || value === '') return '-'
  if (key === 'issueAmount') return `${value} 亿`
  if (key === 'issueVenue') return venueLabel(value)
  if (key === 'range' || key === 'rateRange') {
    const text = String(value)
    if (text.includes('%')) return text
    return text.replace(/(\d+(?:\.\d+)?)/g, '$1%')
  }
  return value
}

export function fmtRate(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '-'
  return `${Number(value).toFixed(2)}%`
}

export function fmtWan(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function wanToYi(wan) {
  if (wan == null || Number.isNaN(Number(wan))) return '-'
  return `${(Number(wan) / 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 亿`
}

/** 已复核合计申购 / 发行规模，单位一致后换算为百分比 */
export function bidRatioOf(bond) {
  if (!bond) return { percent: 0, text: '--', tone: 'low' }
  const issueWan = Number(bond.issueAmount) * 10000
  if (!issueWan || Number.isNaN(issueWan)) return { percent: 0, text: '--', tone: 'low' }
  const total = store.bids
    .filter((item) => item.bondId === bond.id && item.reviewStatus === '已复核')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const percent = (total / issueWan) * 100
  return {
    percent,
    text: `${percent.toFixed(1)}%`,
    tone: percent < 16 ? 'low' : 'high',
  }
}

export function nowText() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function normalizeBondPayload(market, payload) {
  const next = {
    ...payload,
    issueAmount: Number(payload.issueAmount),
    files: payload.files || [],
  }
  if (next.range && !next.rateRange) next.rateRange = next.range
  if (next.rateRange && !next.range) next.range = next.rateRange
  if (next.issueTime && !next.issueDate) next.issueDate = String(next.issueTime).slice(0, 10)
  if (next.issueVenue) next.issueVenue = venueLabel(next.issueVenue)
  if (TYPE_ALIAS[next.type]) next.type = TYPE_ALIAS[next.type]
  if (market === 'bjse' && !next.issueVenue) next.issueVenue = '银行间'
  return next
}

export function addBond(market, payload) {
  store.bonds.unshift({
    id: uid('b'),
    market,
    ...normalizeBondPayload(market, payload),
  })
}

export function updateBond(id, payload) {
  const bond = bondById(id)
  if (!bond) return
  Object.assign(bond, normalizeBondPayload(bond.market, payload), {
    id: bond.id,
    market: bond.market,
    issueAmount: Number(payload.issueAmount),
    files: payload.files || [],
  })
}

export function deleteBond(id) {
  store.bonds = store.bonds.filter((b) => b.id !== id)
  store.bids = store.bids.filter((b) => b.bondId !== id)
}

function normDate(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  const iso = text.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/)
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`
  const us = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/)
  if (us) {
    const year = us[3].length === 2 ? `20${us[3]}` : us[3]
    const month = Number(us[1])
    const day = Number(us[2])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  return text
}

function toNumber(value) {
  const matched = String(value ?? '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  return matched ? Number(matched[0]) : NaN
}

function findExisting(market, mapped) {
  if (mapped.code) {
    return store.bonds.find((b) => b.market === market && b.code === mapped.code)
  }
  const day = String(mapped.issueTime || mapped.issueDate || '').slice(0, 10)
  return store.bonds.find((b) => {
    if (b.market !== market || b.name !== mapped.name) return false
    const existingDay = String(b.issueTime || b.issueDate || '').slice(0, 10)
    return existingDay === day
  })
}

export function importBonds(market, records) {
  const cols = bondColumns[market]
  let created = 0
  let updated = 0
  const errors = []
  records.forEach((rec, index) => {
    const mapped = {}
    cols.forEach((col) => {
      mapped[col.key] = String(rec[col.label] ?? '').trim()
    })
    if (cols.every((col) => !mapped[col.key])) return
    if (['issueDate', 'paymentDate', 'listingDate', 'valueDate'].some((key) => key in mapped)) {
      ;['issueDate', 'paymentDate', 'listingDate', 'valueDate'].forEach((key) => {
        if (key in mapped) mapped[key] = normDate(mapped[key])
      })
    }
    if (mapped.issueTime) mapped.issueTime = mapped.issueTime.replace(/\//g, '-')
    const missing = cols.filter((col) => !mapped[col.key]).map((col) => col.label)
    if (missing.length) {
      errors.push(`第 ${index + 2} 行缺少${missing.join('、')}`)
      return
    }
    const amount = toNumber(mapped.issueAmount)
    if (!(amount > 0)) {
      errors.push(`第 ${index + 2} 行发行规模不正确`)
      return
    }
    mapped.issueAmount = amount
    const normalized = normalizeBondPayload(market, mapped)
    const old = findExisting(market, normalized)
    if (old) {
      Object.assign(old, normalized, { market, id: old.id, files: old.files || [] })
      updated += 1
    } else {
      store.bonds.unshift({ id: uid('b'), market, files: [], ...normalized })
      created += 1
    }
  })
  return { created, updated, errors }
}

export function submitBid(payload, editingId) {
  const bond = bondById(payload.bondId)
  if (!bond) return '请选择债券'
  const user = currentUser()
  if (!user || !['sales', 'manager'].includes(user.role)) return '当前身份不能录入标位'
  const rate = Number(payload.rate)
  const amount = Number(payload.amount)
  if (!payload.customer?.trim()) return '请填写客户代码'
  if (!(rate >= 0)) return '请填写投标利率'
  if (!(amount > 0)) return '请填写申购量'
  const range = bondRange(bond)
  if (range && (rate < range[0] || rate > range[1])) {
    return `投标利率超出区间 ${range[0].toFixed(2)}% - ${range[1].toFixed(2)}%`
  }
  const customerCode = toCustomerCode(payload.customer.trim()) || payload.customer.trim()
  const entryName = (() => {
    const raw = (payload.unit || '').trim()
    if (!raw || users.some((item) => item.dept === raw)) return user.name
    return raw
  })()
  const draft = !!payload.draft
  if (editingId) {
    const bid = store.bids.find((item) => item.id === editingId)
    if (!bid || bid.submitterId !== user.id) return '只能修改自己的标位'
    if (bid.applyType === '撤销' && bid.reviewStatus === '待复核') return '撤销审核中，暂不能修改'
    if (draft && (bid.reviewStatus === '已复核' || bid.uplinkStatus === '已上行')) return '已复核标位不能再存为草稿'
    const wasApproved = bid.reviewStatus === '已复核' || bid.uplinkStatus === '已上行'
    Object.assign(bid, {
      customer: customerCode,
      rate,
      amount,
      tradeType: payload.tradeType || bid.tradeType || '',
      unit: entryName,
      reviewStatus: draft ? '已保存' : '待复核',
      status: draft ? '已保存' : '已提交',
      applyType: !draft && wasApproved ? '修改' : bid.applyType === '撤销' ? '修改' : bid.applyType,
      rejectReason: '',
      uplinkStatus: '',
      uplinkAt: '',
      createdAt: bid.createdAt || nowText(),
    })
    return null
  }
  store.bids.unshift({
    id: uid('d'),
    bondId: bond.id,
    market: bond.market,
    customer: customerCode,
    rate,
    amount,
    tradeType: payload.tradeType || '',
    unit: entryName,
    submitter: user.name,
    submitterId: user.id,
    status: draft ? '已保存' : '已提交',
    reviewStatus: draft ? '已保存' : '待复核',
    applyType: '新增',
    rejectReason: '',
    uplinkStatus: '',
    uplinkAt: '',
    createdAt: nowText(),
  })
  return null
}

export function uplinkBids(bondId) {
  if (!isManager()) return { error: '仅投标经理可以直连上行' }
  const bond = bondById(bondId)
  if (!bond || bond.market !== 'bjse') return { error: '仅北金所支持直连上行' }
  const targets = store.bids.filter((item) => item.bondId === bondId && item.reviewStatus === '已复核' && item.uplinkStatus !== '已上行')
  if (!targets.length) return { error: '没有可上行的已复核标位' }
  const at = nowText()
  targets.forEach((item) => {
    item.uplinkStatus = '已上行'
    item.uplinkAt = at
    item.status = '已报单'
  })
  return { count: targets.length }
}

/** 移动端：按销售原始标位逐笔复核并直连上行（不经合并标位） */
export function approveAndUplink(ids) {
  if (!isManager()) return { error: '仅投标经理可以复核上行' }
  const list = Array.isArray(ids) ? ids : [ids]
  const removeIds = []
  let count = 0
  const at = nowText()
  list.forEach((id) => {
    const bid = store.bids.find((item) => item.id === id)
    if (!bid || bid.reviewStatus !== '待复核') return
    if (bid.market !== 'bjse') return
    if (bid.applyType === '撤销') {
      removeIds.push(id)
      count += 1
      return
    }
    bid.reviewStatus = '已复核'
    bid.uplinkStatus = '已上行'
    bid.uplinkAt = at
    bid.status = '已报单'
    bid.rejectReason = ''
    count += 1
  })
  if (removeIds.length) {
    store.bids = store.bids.filter((item) => !removeIds.includes(item.id))
  }
  return { count }
}

export function batchApproveUplink(bondId) {
  if (!isManager()) return { error: '仅投标经理可以复核上行' }
  const bond = bondById(bondId)
  if (!bond || bond.market !== 'bjse') return { error: '仅北金所支持手机端统审上行' }
  const ids = store.bids
    .filter((item) => item.bondId === bondId && item.reviewStatus === '待复核')
    .map((item) => item.id)
  if (!ids.length) return { error: '没有待复核标位' }
  return approveAndUplink(ids)
}

export function removeBid(id) {
  const user = currentUser()
  const bid = store.bids.find((item) => item.id === id)
  if (!bid || bid.submitterId !== user.id) return '只能删除自己的标位'
  if (bid.applyType === '撤销' && bid.reviewStatus === '待复核') return '撤销申请正在审核中'
  if (bid.reviewStatus === '已复核') {
    bid.applyType = '撤销'
    bid.reviewStatus = '待复核'
    bid.status = '已提交'
    bid.rejectReason = ''
    return 'cancel'
  }
  store.bids = store.bids.filter((item) => item.id !== id)
  return 'deleted'
}

export function undoCancel(id) {
  const user = currentUser()
  const bid = store.bids.find((item) => item.id === id)
  if (!bid || bid.submitterId !== user.id) return '只能操作自己的标位'
  if (!(bid.applyType === '撤销' && bid.reviewStatus === '待复核')) return '当前没有待审核的撤销申请'
  bid.applyType = '新增'
  bid.reviewStatus = '已复核'
  bid.status = '已提交'
  return null
}

export function reviewBids(ids, pass, reason) {
  const removeIds = []
  let done = 0
  ids.forEach((id) => {
    const bid = store.bids.find((item) => item.id === id)
    if (!bid || bid.reviewStatus !== '待复核') return
    if (pass) {
      if (bid.applyType === '撤销') removeIds.push(id)
      else {
        bid.reviewStatus = '已复核'
        bid.status = '已提交'
        bid.rejectReason = ''
      }
    } else if (bid.applyType === '撤销') {
      bid.applyType = '新增'
      bid.reviewStatus = '已复核'
      bid.status = '已提交'
      bid.rejectReason = ''
    } else {
      bid.reviewStatus = '已退回'
      bid.status = '已退回'
      bid.rejectReason = reason || ''
    }
    done += 1
  })
  if (removeIds.length) {
    store.bids = store.bids.filter((item) => !removeIds.includes(item.id))
  }
  return { done }
}

export function buildBook(bond) {
  const bids = store.bids.filter((item) => item.bondId === bond.id && item.reviewStatus === '已复核')
  const map = new Map()
  bids.forEach((bid) => {
    const key = Number(bid.rate).toFixed(2)
    if (!map.has(key)) {
      map.set(key, { rate: Number(key), amount: 0, count: 0, details: [] })
    }
    const group = map.get(key)
    group.amount += Number(bid.amount)
    group.count += 1
    group.details.push(bid)
  })
  const rows = [...map.values()].sort((a, b) => a.rate - b.rate)
  const issueWan = Number(bond.issueAmount) * 10000
  let cum = 0
  let marginalRate = null
  rows.forEach((row) => {
    cum += row.amount
    row.cum = cum
    row.cover = issueWan > 0 ? cum / issueWan : 0
    row.customers = [...new Set(row.details.map((item) => item.customer))]
    row.tradeTypes = [...new Set(row.details.map((item) => item.tradeType))]
    if (marginalRate == null && issueWan > 0 && cum >= issueWan) {
      row.marginal = true
      marginalRate = row.rate
    }
  })
  const total = cum
  rows.forEach((row) => {
    row.share = total ? row.amount / total : 0
  })
  const weighted = total ? rows.reduce((sum, row) => sum + row.rate * row.amount, 0) / total : null
  const pending = store.bids.filter((item) => item.bondId === bond.id && item.reviewStatus === '待复核').length
  return { rows, total, issueWan, weighted, marginalRate, pending, bidCount: bids.length }
}

export function customerText(list) {
  if (!list?.length) return '-'
  if (list.length <= 2) return list.join('、')
  return `${list.slice(0, 2).join('、')} 等${list.length}家`
}
