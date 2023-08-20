import connect from 'connect'
import { blue, green } from 'picocolors'
import chokidar, { FSWatcher } from 'chokidar'
import { optimize } from '../optimizer'
import { PluginContainer, createPluginContainer } from '../pluginContainer'
import { Plugin } from '../plugin'
import { resovlePlugins } from '../plugins'
import { indexHtmlMiddleware } from './middlewares/indexHtml'
import { transformMiddleware } from './middlewares/transform'
import { staticMiddleware } from './middlewares/static'
import { ModuleGraph } from './moduleGraph'
import { createWebSocketServer } from '../ws'
import { bindingHMREvents } from '../hmr'

export interface ServerContext {
  root: string
  pluginContainer: PluginContainer
  app: connect.Server
  plugins: Plugin[]
  moduleGraph: ModuleGraph
  ws: {
    send: (payload: Object) => void
    close: () => void
  }
  watcher: FSWatcher
}

export async function  startDevServer() {
  const app = connect()
  const root = process.cwd()
  const startTime = Date.now()

  // 加载 rollup 插件
  const plugins = resovlePlugins()
  const pluginContainer = createPluginContainer(plugins)
  // 初始化依赖模块图
  const moduleGraph = new ModuleGraph((url) => pluginContainer.resolveId(url))
  // 文件监听器
  const watcher = chokidar.watch(root, {
    ignored: ['**/node_modules/**', '**/.git/**'],
    ignoreInitial: true
  })
  // websocket 服务
  const ws = createWebSocketServer(app)
  const serverContext: ServerContext = {
    root: process.cwd(),
    app,
    pluginContainer,
    plugins,
    moduleGraph,
    ws,
    watcher
  }
  bindingHMREvents(serverContext)

  for(const plugin of plugins) {
    if(plugin.configureServer) {
      await plugin.configureServer(serverContext)
    }
  }
  app.use(indexHtmlMiddleware(serverContext))
  app.use(transformMiddleware(serverContext))
  app.use(staticMiddleware(serverContext.root))

  app.listen(3000, async () => {
    // 依赖预构建
    await optimize(root)
    console.log(
      green('no bundle 服务已经成功启动'),
      `耗时：${Date.now() - startTime}ms`
    )
    console.log(`> 本地访问：${blue('http://localhost:3000')}`)
  })
  
}

