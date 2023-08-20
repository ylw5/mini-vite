import type {
  LoadResult,
  PartialResolvedId,
  SourceDescription,
  PluginContext as RollupPluginContext,
  TransformResult
} from 'rollup'
import { Plugin } from './plugin'
import { ResolvedId } from 'rollup'


export interface PluginContainer {
  resolveId(source: string, importer?: string): Promise<PartialResolvedId | null>
  load(id: string): Promise<LoadResult | null>
  transform(code: string, id: string): Promise<TransformResult>
}

// 插件容器模拟 Roolup 的插件机制
export const createPluginContainer = (plugins: Plugin[]): PluginContainer => {
  // 插件上下文对象
  class Context implements RollupPluginContext {
    async resolve(
      source: string,
      importer?: string,
    ) {
      let out = await pluginContainer.resolveId(source, importer)
      if (typeof out === 'string') {
        out = { id: out }
      }
      return out as ResolvedId | null
    }
  }
  const pluginContainer: PluginContainer = {
    async resolveId(source, importer) {
      const ctx = new Context()
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const newId = await plugin.resolveId.call(ctx, source, importer)
          if (newId) {
            const id = typeof newId === 'string' ? newId : newId.id
            return { id }
          }
        }
      }
      return null
    },
    async load(id) {
      const ctx = new Context()
      for (const plugin of plugins) {
        if (plugin.load) {
          const code = await plugin.load.call(ctx, id)
          if (code) {
            return code
          }
        }
      }
      return null
    },
    async transform(code, id) {
      const ctx = new Context()
      for (const plugin of plugins) {
        if (plugin.transform) {
          const result = await plugin.transform.call(ctx, code, id)
          if (!result) continue
          if (typeof result === 'string') {
            code = result
          } else if (result.code) {
            code = result.code
          }
        }
      }
      return { code }
    }
  }

  return pluginContainer
}