const MIN_WIDTH = 56
const HANDLE = 'col-resize-handle'

function clearHandles(table) {
  table.querySelectorAll(`.${HANDLE}`).forEach((node) => node.remove())
}

function colGroups(table) {
  return [...table.querySelectorAll('colgroup')].filter((group) => group.querySelectorAll('col').length)
}

function setColumnWidth(table, index, width) {
  colGroups(table).forEach((group) => {
    const col = group.children[index]
    if (col) {
      col.setAttribute('width', String(width))
      col.style.width = `${width}px`
    }
  })
  table.querySelectorAll('.el-table__header th, .el-table__body td, .el-table__footer td').forEach((cell) => {
    if (cell.cellIndex === index) {
      cell.style.width = `${width}px`
      cell.style.minWidth = `${width}px`
    }
  })
}

function bindHandles(table) {
  if (!table || table.__colResizeBusy) return
  const headerRow = table.querySelector('.el-table__header thead tr')
  if (!headerRow) return

  clearHandles(table)
  const cells = [...headerRow.children]
  cells.forEach((th, index) => {
    if (th.classList.contains('el-table-column--selection')) return
    if (th.classList.contains('el-table__expand-column')) return
    if (th.classList.contains('gutter')) return

    const handle = document.createElement('span')
    handle.className = HANDLE
    handle.title = '拖拽调整列宽'
    th.appendChild(handle)

    handle.addEventListener('mousedown', (event) => {
      event.preventDefault()
      event.stopPropagation()
      table.__colResizeBusy = true
      const startX = event.clientX
      const startWidth = th.getBoundingClientRect().width
      document.body.classList.add('col-resizing')

      const onMove = (moveEvent) => {
        const next = Math.max(MIN_WIDTH, Math.round(startWidth + (moveEvent.clientX - startX)))
        setColumnWidth(table, index, next)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.body.classList.remove('col-resizing')
        table.__colResizeBusy = false
        table.dispatchEvent(new Event('header-dragend'))
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
  })
}

function scheduleBind(el) {
  const table = el.classList?.contains('el-table') ? el : el.querySelector?.('.el-table')
  if (!table) return
  clearTimeout(table.__colResizeTimer)
  table.__colResizeTimer = setTimeout(() => bindHandles(table), 40)
}

export const tableColResize = {
  mounted(el) {
    scheduleBind(el)
    const table = el.classList?.contains('el-table') ? el : el.querySelector?.('.el-table')
    if (!table || typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(() => {
      if (!table.__colResizeBusy) scheduleBind(el)
    })
    observer.observe(table, { childList: true, subtree: true })
    el.__colResizeObserver = observer
  },
  updated(el) {
    scheduleBind(el)
  },
  unmounted(el) {
    el.__colResizeObserver?.disconnect()
    const table = el.classList?.contains('el-table') ? el : el.querySelector?.('.el-table')
    if (table) clearHandles(table)
  },
}

export default tableColResize
