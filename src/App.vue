<template>
  <router-view v-if="isMobileApp" />
  <div v-else class="layout">
    <aside class="sidebar" :class="{ collapsed }">
      <div class="logo" @click="router.push('/')">
        <svg class="logo-mark" viewBox="0 0 32 32" width="22" height="22" aria-hidden="true">
          <path fill="#f04438" d="M7 3.5h13.2L25 8.2V28.5H7z" />
          <path fill="#c22b22" d="M20.2 3.5V8.2H25z" />
          <path stroke="#fff" stroke-width="1.6" stroke-linecap="round" d="M11 14.5h10M11 18.5h10M11 22.5h6" />
        </svg>
        <span v-show="!collapsed">投标系统</span>
      </div>
      <div class="sidebar-scroll">
        <el-menu
          :key="store.userId"
          class="sidebar-menu"
          :default-active="menuActive"
          :default-openeds="['my', 'board', 'overview', 'review']"
          :collapse="collapsed"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#ffffff"
          router
        >
          <el-sub-menu index="my">
            <template #title>
              <el-icon><User /></el-icon>
              <span>我的投标</span>
            </template>
            <el-menu-item index="/my/bjse">我的投标-北金所</el-menu-item>
            <el-menu-item index="/my/lgb">我的投标-地方债</el-menu-item>
            <el-menu-item index="/my/corp">我的投标-公司债</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="board">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>债券看板</span>
            </template>
            <el-menu-item index="/board/bjse">在团债券-北金所</el-menu-item>
            <el-menu-item index="/board/lgb">在团债券-地方债</el-menu-item>
            <el-menu-item index="/board/corp">在团债券-公司债</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="isManager()" index="review">
            <template #title>
              <el-icon><CircleCheck /></el-icon>
              <span>投标统审</span>
            </template>
            <el-menu-item index="/review/bjse">统标审核-北金所</el-menu-item>
          </el-sub-menu>
          <el-sub-menu v-if="isManager()" index="overview">
            <template #title>
              <el-icon><DataLine /></el-icon>
              <span>投标总览</span>
            </template>
            <el-menu-item index="/overview/bjse">总览列表-北金所</el-menu-item>
            <el-menu-item index="/overview/lgb">总览列表-地方债</el-menu-item>
            <el-menu-item index="/overview/corp">总览列表-公司债</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </div>
      <div class="sidebar-bottom" @click="collapsed = !collapsed">
        <el-icon :size="18"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </div>
    </aside>

    <section class="main">
      <header class="header">
        <div class="hamburger" @click="collapsed = !collapsed">
          <el-icon :size="18"><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
        </div>
        <div class="tags">
          <div
            v-for="tag in tags"
            :key="tag.path"
            class="tag"
            :class="{ active: tag.path === route.path }"
            @click="router.push(tag.path)"
          >
            <span>{{ tag.title }}</span>
            <el-icon v-if="tag.closable" class="x" @click.stop="closeTag(tag)"><Close /></el-icon>
          </div>
        </div>
        <div class="header-tools">
          <span class="phone-entry" @click="router.push('/m')">手机端</span>
          <span class="role-pill">{{ isManager() ? '投标经理' : '销售经理' }}</span>
          <el-dropdown trigger="click" @command="onCommand">
            <span class="user-entry">
              <span class="avatar">{{ user.name.slice(0, 1) }}</span>
              <span>{{ user.name }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>切换身份</el-dropdown-item>
                <el-dropdown-item
                  v-for="item in users"
                  :key="item.id"
                  :command="item.id"
                  :disabled="item.id === store.userId"
                >
                  {{ item.name }}（{{ item.role === 'manager' ? '投标经理' : '销售经理' }} · {{ item.dept }}）
                </el-dropdown-item>
                <el-dropdown-item divided command="__reset">恢复示例数据</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </main>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowDown, CircleCheck, Close, DataLine, Expand, Fold, Tickets, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { bondById, currentUser, isManager, resetData, store, users } from './store'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const isMobileApp = computed(() => route.path === '/m' || route.path.startsWith('/m/'))
const tags = ref([{ title: '首页', path: '/', closable: false }])
const user = computed(() => currentUser())
const menuActive = computed(() => (
  route.meta.detail ? `/overview/${route.params.market}` : route.path
))

function pageTitle() {
  if (route.meta.detail) {
    const bond = bondById(route.params.id)
    return bond ? `${bond.name} 标位总览` : '标位总览'
  }
  return route.meta.title
}

watch(() => route.path, () => {
  if (isMobileApp.value) return
  const title = pageTitle()
  if (!title) return
  if (!tags.value.some((tag) => tag.path === route.path)) {
    tags.value.push({ title, path: route.path, closable: route.path !== '/' })
  }
}, { immediate: true })

function closeTag(tag) {
  const index = tags.value.findIndex((item) => item.path === tag.path)
  if (index < 0) return
  tags.value.splice(index, 1)
  if (route.path === tag.path) {
    const next = tags.value[index] || tags.value[index - 1] || tags.value[0]
    router.push(next.path)
  }
}

function pruneTags() {
  tags.value = tags.value.filter((tag) => {
    const resolved = router.resolve(tag.path)
    return !(resolved.meta?.managerOnly && !isManager())
  })
  if (!tags.value.length) tags.value.push({ title: '首页', path: '/', closable: false })
  if (route.meta.managerOnly && !isManager()) router.push(isMobileApp.value ? '/m' : '/')
}

async function onCommand(command) {
  if (command === '__reset') {
    await ElMessageBox.confirm('将清空当前浏览器里的债券和标位，恢复为示例数据。', '恢复示例数据', { type: 'warning' })
    resetData()
    pruneTags()
    ElMessage.success('已恢复示例数据')
    return
  }
  store.userId = command
  const next = currentUser()
  ElMessage.success(`已切换为${next.role === 'manager' ? '投标经理' : '销售经理'} ${next.name}`)
  pruneTags()
}
</script>
