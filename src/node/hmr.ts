import { ServerContext } from "./server";
import { blue, green } from 'picocolors'
import { getShortName } from './utils';

export function bindingHMREvents(serverContext: ServerContext) {
  const { watcher, ws, root } = serverContext

  watcher.on('change',async (file) => {
    console.log(`✨${blue("[hmr]")} ${green(file)} changed`);
    const { moduleGraph } = serverContext
    // 清除模块依赖图中的缓存
    moduleGraph.invalidateModule(file)
    // 通知客户端更新
    ws.send({
      type: 'update',
      updates: [
        {
          type: 'js-update',
          timestamp: Date.now(),
          path: '/' + getShortName(file, root),
          acceptedPath: '/' + getShortName(file, root)
        }
      ]
    })
  })
}