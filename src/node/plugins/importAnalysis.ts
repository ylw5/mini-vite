import path from 'path'
import { init, parse } from "es-module-lexer";
import MagicString from 'magic-string'
import { Plugin } from "../plugin";
import { ServerContext } from "../server";
import { cleanUrl, getShortName, isInternalRequest, isJsRequest, normalizePath } from "../utils";
import { BARE_IMPORT_RE, CLIENT_PUBLIC_PATH, PRE_BUNDLE_DIR } from "../constants";
import { PluginContext } from 'rollup';

export function importAnalysisPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite:import-analysis',
    configureServer(s) {
      serverContext = s
    },
    async transform(this: PluginContext, code, id) {
      // 只处理 JS 相关请求
      if (!isJsRequest(id) || isInternalRequest(id)) {
        return null
      }
      const { moduleGraph } = serverContext
      const curMod = moduleGraph.getModuleById(id)!
      const importedModules = new Set<string>()
      await init;
      const [imports] = parse(code)
      const ms = new MagicString(code)
      const resolve = async (id: string, importer?: string) => {
        const resolved = await this.resolve(
          id,
          normalizePath(importer!)
        )
        if(!resolved) {
          return
        }
        const cleanedId = cleanUrl(resolved.id)
        const mod = moduleGraph.getModuleById(id)
        let resolveId = `/${getShortName(resolved.id, serverContext.root)}`
        // 模块需要更新
        if(mod && mod.lastHMRTimestamp > 0) {
          resolveId += '?=' + mod.lastHMRTimestamp
        }
        return resolveId
      }
      for(const importInfo of imports) {
        const { s: modStart, e: modEnd, n: modSource } = importInfo
        if(!modSource)continue
        // 处理静态资源
        if(modSource.endsWith('.svg')) {
          // 加上 ?import 后缀标识
          const resolvedUrl = path.join(path.dirname(id), modSource)
          ms.overwrite(modStart, modEnd, `${resolvedUrl}?import`)
          continue
        }
        // 重写第三方库预构建路径
        if(BARE_IMPORT_RE.test(modSource)) {
          const bundlePath = normalizePath(
            path.join('/', PRE_BUNDLE_DIR, `${modSource}.js`)
          )
          ms.overwrite(modStart, modEnd, bundlePath)
          importedModules.add(bundlePath)
        } else if(modSource.startsWith('.') || modSource.startsWith('/')) {
          // 调用插件上下文的 resolve 方法
          const resolved = await resolve(modSource, id)
          if(resolved) {
            ms.overwrite(modStart, modEnd, resolved)
            importedModules.add(resolved)
          }
        }
      }
      // 业务源码注入
      if (!id.includes('node_modules')) {
        // 注入 HMR 相关工具函数
        ms.prepend(
          `import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}"
          import.meta.hot = __vite__createHotContext(${JSON.stringify(cleanUrl(curMod?.url))});`
        );
      }
      moduleGraph.updateModuleInfo(curMod, importedModules)
      return {
        code: ms.toString(),
        map: ms.generateMap()
      }
    }
  }
}