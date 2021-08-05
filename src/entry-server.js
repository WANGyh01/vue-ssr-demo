import { createApp } from './app'

export default context => {
  const { app } = createApp()

  // TODO 服务端路由处理，数据预取

  return app
}
