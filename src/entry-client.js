/**
 * 客户端启动入口
 */

import { createApp } from './app'

// 客户端特定引导逻辑……

const { app, router } = createApp()

// 你仍然需要在挂载 app 之前调用 router.onReady，因为路由器必须要提前解析路由配置中的异步组件
router.onReady(() => {
  app.$mount('#app')
})

