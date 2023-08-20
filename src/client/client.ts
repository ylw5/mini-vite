console.log('[vite] connecting...');

// 1.创建 Websocket 客户端
const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, 'vite-hmr')

// 2.接受服务端的更新信息
socket.addEventListener('message', async ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error)
})

interface Update {
  type: 'js-update' | 'css-update'
  timestamp: Date
  path: string
  acceptedPath: string
}
interface Payload {
  type: 'update' | 'connected'
  updates: Update[]
}

// 3.根据不同的更新类型进行更新
async function handleMessage(payload: Payload) {
  switch (payload.type) {
    case 'connected':
      console.log('[vite] connected.');
      // 心跳检测
      setInterval(() => socket.send('ping'), 1000)
      break
    case 'update':
      // 具体模块更新
      payload.updates.forEach((update) => {
        if (update.type === 'js-update') {
          fetchUpdate(update)
        }
      })
      break
  }
}

interface HotModule {
  id: string
  callbacks: HotCallback[]
}
interface HotCallback {
  deps: string[]
  fn: (modules: Object[]) => void
}

// HMR 模块表
const hotModulesMap = new Map<string, HotModule>()
// 不生效的模块表
const pruneMap = new Map<string, (data: any) => void | Promise<void>>()

export function createHotContext(ownerPath: string) {
  const mod = hotModulesMap.get(ownerPath)!
  if (mod) {
    mod.callbacks = []
  }

  function acceptDeps(
    deps: string[],
    callback: (modules: Object[]) => void
  ) {
    const mod = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: []
    }
    // callbacks 属性存放 accept 对依赖、依赖改动后对应的回调逻辑
    mod.callbacks.push({
      deps,
      fn: callback
    })
    hotModulesMap.set(ownerPath, mod)
  }

  return {
    accept(deps: any, callback: any) {
      // 接受模块自身更新
      // import.meta.hot.accept()
      // import.meta.hot.accept((mod) => {})
      if (typeof deps === 'function' || !deps) {
        acceptDeps([ownerPath], ([mod]) => deps && deps(mod))
      }
    },
    // 模块不再生效的回调
    prune(cb: (data: any) => void) {
      pruneMap.set(ownerPath, cb)
    }
  }
}

async function fetchUpdate({ path, timestamp }: Update) {
  const mod = hotModulesMap.get(path)
  if (!mod) return

  const moduleMap = new Map()
  const modulesToUpdate = new Set<string>()
  modulesToUpdate.add(path)

  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const [path, query] = dep.split('?')
      try {
        const newMod = await import(
          `${path}?t=${timestamp}${query ? `&${query}` : ''}`
        )
        moduleMap.set(dep, newMod)
      } catch (e) {
        console.error(e)
      }
    })
  )

  return () => {
    for (const {deps, fn} of mod.callbacks) {
      fn(deps.map(dep => moduleMap.get(dep)))
    }
    console.log(`[vite] hot updated: ${path}`);
  }
}

const sheetsMap = new Map()

export function updateStyle(id: string, content: string) {
  let style = sheetsMap.get(id)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.innerHTML = content
    document.head.appendChild(style)
  } else {
    style.innerHTML = content
  }
  sheetsMap.set(id, style)
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id)
  if(style) {
    document.head.removeChild(style)
  }
  sheetsMap.delete(id)
}
