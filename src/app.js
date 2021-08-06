/**
 * 通用启动入口
 */

import Vue from 'vue'
import App from './App.vue'
import { createRouter } from './router'
import { createStore } from './store'
import VueMeta from 'vue-meta'

Vue.use(VueMeta)

// 配置title模板
Vue.mixin({
  metaInfo: {
    titleTemplate: '%s - vue ssr'
  }
})

// 导出一个工厂函数，用于创建新的
// 应用程序、router 和 store 实例
export function createApp () {
  const router = createRouter()
  const store = createStore()
  const app = new Vue({
    router,
    store,
    // 根实例简单的渲染应用程序组件。
    render: h => h(App)
  })
  return { app, router, store } // 希望在外部也拿到router和store，所有也一并导出
}
