<template>
  <div class="phone-stage">
    <div class="phone">
      <header class="m-titlebar">
        <button v-if="showBack" class="icon-btn" type="button" @click="back">‹</button>
        <div class="m-title">{{ route.meta.title }}</div>
        <button class="role-chip" type="button" @click="roleOpen = true">{{ user.name }}</button>
      </header>
      <div class="m-scroll" :class="{ home: route.name === 'm-home' }">
        <router-view />
      </div>
      <nav v-if="route.meta.tab" class="m-tabbar">
        <button type="button" :class="{ on: route.name === 'm-home' }" @click="router.push('/m')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4 4 11h2v8h5v-5h2v5h5v-8h2z"/></svg>
          首页
        </button>
        <button v-if="isManager()" type="button" :class="{ on: route.name === 'm-review' }" @click="router.push('/m/review')">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-3-7 3V5a2 2 0 0 1 2-2zm5.2 5.2 1.1 2.2 2.4.3-1.8 1.7.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.8-1.7 2.4-.3z"/></svg>
          统审
          <em v-if="pendingCount" class="badge">{{ pendingCount }}</em>
        </button>
        <button type="button" :class="{ on: route.name === 'm-mine' }" @click="router.push('/m/mine')">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="3.2"/><path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19z"/></svg>
          我的
        </button>
      </nav>
      <div v-if="toastText" class="m-toast">{{ toastText }}</div>
      <div v-if="roleOpen" class="sheet-mask" @click.self="roleOpen = false">
        <div class="sheet">
          <h4>切换身份</h4>
          <button v-for="item in users" :key="item.id" type="button" class="user-row" @click="switchUser(item.id)">
            {{ item.name }} · {{ item.role === 'manager' ? '投标经理' : '销售经理' }}
          </button>
          <button type="button" @click="router.push('/')">返回电脑端</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, provide, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { currentUser, isManager, store, users } from '../store'
import './mobile.css'

const route = useRoute()
const router = useRouter()
const roleOpen = ref(false)
const toastText = ref('')
const user = computed(() => currentUser())
const showBack = computed(() => !route.meta.tab)
const pendingCount = computed(() => store.bids.filter((item) => item.market === 'bjse' && item.reviewStatus === '待复核').length)

let timer = 0
function toast(message) {
  toastText.value = message
  clearTimeout(timer)
  timer = setTimeout(() => { toastText.value = '' }, 1600)
}
provide('toast', toast)

function back() {
  if (route.name === 'm-bid') router.push('/m')
  else router.back()
}

function switchUser(id) {
  store.userId = id
  roleOpen.value = false
  const next = currentUser()
  toast(`已切换为${next.role === 'manager' ? '投标经理' : '销售经理'} ${next.name}`)
  if (route.meta.managerOnly && !isManager()) router.replace('/m')
}
</script>
