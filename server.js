const express = require('express')
const fs = require('fs')
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')

const isProd = process.env.NODE_ENV === 'production'
const server = express()

// 开放dist中的资源。第一个参数是publicPath，第二个 尝试使用这个中间件去dist目录查找并处理返回
// 处理磁盘中的资源
server.use('/dist', express.static('./dist'))

let renderer
let onReady // 接收setupDevServer返回的Promise

if (isProd) { // 生产模式
  const serverBundle = require('./dist/vue-ssr-server-bundle.json')
  const clientManifest = require('./dist/vue-ssr-client-manifest.json')
  const template = fs.readFileSync('./index.template.html', 'utf-8') // 读取模板
  // 渲染器
  renderer = createBundleRenderer(serverBundle, {
    template, // 指定模板
    clientManifest
  })
} else {
  // 开发模式 -> 监视打包构建 -> 重新生成 renderer 渲染器

  // 返回一个promise
  onReady = setupDevServer(server, (serverBundle, template, clientManifest) => {
    renderer = createBundleRenderer(serverBundle, {
      template, // 指定模板
      clientManifest
    })
  })
}

// 声明render函数
const render = async (req, res) => {
  // renderer.renderToString({
  //   // 在模板当中使用外部数据，这个参数就是entry-server.js中的context对象
  //   title: '你好 Vue ssr',
  //   meta: `<meta name="description" content="你好 Vue ssr">`,
  //   url: req.url
  // }, (err, html) => {
  //   if (err) {
  //     return res.status(500).end('Internal Server Error')
  //   }
  //   // 为了解决输出乱码问题，要设置响应标头+设置meta标签
  //   res.setHeader('Content-Type', 'text/html; charset=utf8')
  //   res.end(html)
  // })

  // async/await 改写
  try {
    const html = await renderer.renderToString({
      // 在模板当中使用外部数据，这个参数就是entry-server.js中的context对象
      title: '你好 Vue ssr',
      meta: `<meta name="description" content="你好 Vue ssr">`,
      url: req.url
    })

    // 为了解决输出乱码问题，要设置响应标头+设置meta标签
    res.setHeader('Content-Type', 'text/html; charset=utf8')
    res.end(html)

  } catch (err){
    res.status(500).end('Internal Server Error...')
  }

}
// 服务端路由设置为 *，意味着所有的路由都会进入这里
server.get('*', isProd
  ? render
  : async (req, res) => {
    // 等待有了renderer渲染器之后，调用render渲染
    await onReady
    render(req, res)
  })

server.listen(3000, () => {
  console.log('server running at port 3000')
})
