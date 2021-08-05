const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar') // 监视文件更改
const webpack = require('webpack')
const webpackDevMiddleware = require('webpack-dev-middleware')
const hotMiddleware = require('webpack-hot-middleware')

const resolve = filePath => path.resolve(__dirname, filePath)

module.exports = (server, cb) => {
  let ready // 接收 Promise 的 resolve
  const onReady = new Promise(resolve => ready = resolve)

  // 监视构建 -> 更新 renderer
  let serverBundle, template, clientManifest

  const update = () => {
    if (serverBundle && template && clientManifest) {
      ready()
      cb(serverBundle, template, clientManifest)
    }
  }

  // 1、监视构建 template -> 调用 update -> Renderer 渲染器

  // 初始的时候读出来
  const templatePath = path.resolve(__dirname, '../index.template.html')
  template = fs.readFileSync(templatePath, 'utf-8')
  update()

  // 监视更改之后再读出来 fs.watch、fs.watchFile (这俩有点问题) -> chokidar
  chokidar.watch(templatePath).on('change', () => {
    template = fs.readFileSync(templatePath, 'utf-8')
    update()
  })

  // 监视构建 serverBundle -> 调用 update -> Renderer 渲染器

  // 在磁盘中操作，相对较慢

  // const serverConfig = require('./webpack.server.config')
  // const serverCompiler = webpack(serverConfig) // 得到webpack创建的编译器
  // serverCompiler.watch({}, (err, stats) => {
  //   // stats 构建出的结果模块相关的信息对象
  //   if (err) throw err // webpack本身的错误，中断程序运行
  //   if (stats.hasErrors()) return // 代码本身的问题
  //
  //   // require 有缓存，直接读
  //   serverBundle = JSON.parse(fs.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8'))
  //
  //   update()
  // })

  // 在内存中
  // 第三方包 memfs （基于内存的文件操作系统） -> webpack-dev-middleware 有这个能力
  const serverConfig = require('./webpack.server.config')
  const serverCompiler = webpack(serverConfig) // 得到webpack创建的编译器

  // 会自动执行打包构建，默认是监视的方式，会输出很多日志，返回一个实例
  const serverDevMiddleware = webpackDevMiddleware(serverCompiler, {
    logLevel: 'silent' // 关闭日志输出
  })
  // 每当编译结束触发钩子
  serverCompiler.hooks.done.tap('server', () => {
    // require 有缓存，直接读
    serverBundle = JSON.parse(
      // 拿到这个实例文件系统中的readFileSync，读取内存中的文件
      serverDevMiddleware.fileSystem.readFileSync(resolve('../dist/vue-ssr-server-bundle.json'), 'utf-8')
    )

    update()
  })

  // 监视构建 clientManifest -> 调用 update -> Renderer 渲染器

  const clientConfig = require('./webpack.client.config')
  // 开启热更新
  clientConfig.plugins.push(new webpack.HotModuleReplacementPlugin())
  clientConfig.entry.app = [
    // 和服务端交互处理热更新的客户端脚本
    'webpack-hot-middleware/client?quiet=true&reload=true', // ?quiet=true&reload=true 控制台不输出日志 && 热更新卡住了刷新整个页面
    clientConfig.entry.app
  ]
  // 热更新模式下，确保一致的hash
  clientConfig.output.filename = '[name].js'

  const clientCompiler = webpack(clientConfig)
  const clientDevMiddleware = webpackDevMiddleware(clientCompiler, {
    publicPath: clientConfig.output.publicPath, // 用于构建输出之中的请求前缀路径
    logLevel: 'silent'
  })

  clientCompiler.hooks.done.tap('client', () => {

    clientManifest = JSON.parse(
      clientDevMiddleware.fileSystem.readFileSync(resolve('../dist/vue-ssr-client-manifest.json'), 'utf-8')
    )

    update()
  })
  // 热更新相关
  server.use(hotMiddleware(clientCompiler, {
    log: false // 关闭日志输出
  }))

  // important !!! 将 clientDevMiddleware 挂载到 Express 服务中，提供对其内部内存中数据的访问
  server.use(clientDevMiddleware)

  return onReady
}
