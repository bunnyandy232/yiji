import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { tableColResize } from './directives/tableColResize'
import './styles.css'

const app = createApp(App)
app.directive('col-resize', tableColResize)
app.use(router).use(ElementPlus, { locale: zhCn, size: 'small' }).mount('#app')
