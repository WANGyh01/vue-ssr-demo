const Vue = require('vue')
const express = require('express')
const fs = require('fs')

const serverBundle = require('./dist/vue-ssr-server-bundle.json')
const clientManifest = require('./dist/vue-ssr-client-manifest.json')
// 读取模板
const template = fs.readFileSync('./index.template.html', 'utf-8')
// 渲染器
const renderer = require('vue-server-renderer').createBundleRenderer(serverBundle, {
  template, // 指定模板
  clientManifest
})

// 开启服务
const server = express()

// 开放dist中的资源 。第一个参数是publicPath，第二个 尝试使用这个中间件去dist目录查找并处理返回
server.use('/dist', express.static('./dist'))

server.get('/', (req, res) => {

  renderer.renderToString({
    // 在模板当中使用外部数据

    title: '你好 Vue ssr',
    meta: `<meta name="description" content="你好 Vue ssr">`
  }, (err, html) => {
    if (err) {
      return res.status(500).end('Internal Server Error')
    }

    // 为了解决输出乱码问题，要设置响应标头+设置meta标签
    res.setHeader('Content-Type', 'text/html; charset=utf8')
    res.end(html)
  })
})

server.listen(3000, () => {
  console.log('server running at port 3000')
})
