import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { isManager } from './store'
import Home from './views/Home.vue'
import MyBids from './views/MyBids.vue'
import Syndicate from './views/Syndicate.vue'
import Overview from './views/Overview.vue'
import OverviewDetail from './views/OverviewDetail.vue'
import MobileShell from './mobile/MobileShell.vue'
import MobileHome from './mobile/MobileHome.vue'
import MobileBid from './mobile/MobileBid.vue'
import MobileMine from './mobile/MobileMine.vue'
import MobileReview from './mobile/MobileReview.vue'
import Review from './views/Review.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home, meta: { title: '首页' } },
    { path: '/my/bjse', component: MyBids, meta: { title: '我的投标-北金所', market: 'bjse' } },
    { path: '/my/lgb', component: MyBids, meta: { title: '我的投标-地方债', market: 'lgb' } },
    { path: '/my/corp', component: MyBids, meta: { title: '我的投标-公司债', market: 'corp' } },
    { path: '/board/bjse', component: Syndicate, meta: { title: '在团债券-北金所', market: 'bjse' } },
    { path: '/board/lgb', component: Syndicate, meta: { title: '在团债券-地方债', market: 'lgb' } },
    { path: '/board/corp', component: Syndicate, meta: { title: '在团债券-公司债', market: 'corp' } },
    { path: '/overview/bjse', component: Overview, meta: { title: '总览列表-北金所', market: 'bjse', managerOnly: true } },
    { path: '/overview/lgb', component: Overview, meta: { title: '总览列表-地方债', market: 'lgb', managerOnly: true } },
    { path: '/overview/corp', component: Overview, meta: { title: '总览列表-公司债', market: 'corp', managerOnly: true } },
    { path: '/overview/:market/:id', component: OverviewDetail, meta: { detail: true, managerOnly: true } },
    { path: '/review/bjse', component: Review, meta: { title: '统标审核-北金所', market: 'bjse', managerOnly: true } },
    { path: '/review/lgb', redirect: '/review/bjse' },
    { path: '/review/corp', redirect: '/review/bjse' },
    {
      path: '/m',
      component: MobileShell,
      children: [
        { path: '', name: 'm-home', component: MobileHome, meta: { title: '首页', tab: true } },
        { path: 'bid/:id', name: 'm-bid', component: MobileBid, meta: { title: '编辑标位' } },
        { path: 'mine', name: 'm-mine', component: MobileMine, meta: { title: '我的投标', tab: true } },
        { path: 'review', name: 'm-review', component: MobileReview, meta: { title: '统审', tab: true, managerOnly: true, mobile: true } },
        { path: 'review/:id', redirect: '/m/review' },
      ],
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.managerOnly && !isManager()) {
    ElMessage.warning(to.meta.mobile ? '统审与直连上行仅投标经理可操作' : '投标总览与统标审核仅投标经理可查看')
    return to.path.startsWith('/m') ? '/m' : '/'
  }
  return true
})

export default router
