import { PartialResolvedId, TransformResult } from "rollup"

export class ModuleNode {
  url: string
  id: string | null = null
  importers = new Set<ModuleNode>()
  importedModules = new Set<ModuleNode>()
  transformResult: TransformResult | null = null
  lastHMRTimestamp = 0
  constructor(url: string) {
    this.url = url
  }
}

export class ModuleGraph {
  urlToModuleMap = new Map<string, ModuleNode>()
  idToModuleMap = new Map<string, ModuleNode>()
  constructor(
    private resolveId: (url: string) => Promise<PartialResolvedId | null>
  ) { }

  getModuleById(id: string): ModuleNode | undefined {
    return this.idToModuleMap.get(id)
  }

  async getModuleByUrl(rawUrl: string): Promise<ModuleNode | undefined> {
    const { url } = await this._resolve(rawUrl)
    return this.urlToModuleMap.get(url)
  }

  async ensureEntryFromUrl(rawUrl: string): Promise<ModuleNode> {
    const { url, resolveId } = await this._resolve(rawUrl)
    // 检查缓存
    if (this.urlToModuleMap.has(url)) {
      return this.urlToModuleMap.get(url)!
    }
    // 若无缓存，更新 map
    const mod = new ModuleNode(url)
    mod.id = resolveId
    this.urlToModuleMap.set(url, mod)
    this.idToModuleMap.set(resolveId, mod)
    return mod
  }

  async updateModuleInfo(
    mod: ModuleNode,
    importedModules: Set<string | ModuleNode>
  ) {
    const prevImports = mod.importedModules
    for (const curImport of importedModules) {
      const dep = typeof curImport === 'string'
        ? await this.ensureEntryFromUrl(curImport)
        : curImport
      if (dep) {
        mod.importedModules.add(dep)
        dep.importers.add(mod)
      }
    }
    // 清除已经不再被引用的依赖
    for (const prevImport of prevImports) {
      if (!importedModules.has(prevImport.url)) {
        prevImport.importers.delete(mod)
      }
    }
  }

  // HMR 触发时会执行这个方法
  invalidateModule(file: string) {
    const mod = this.idToModuleMap.get(file)
    if (mod) {
      mod.lastHMRTimestamp = Date.now()
      mod.transformResult = null
      mod.importers.forEach(importer => {
        this.invalidateModule(importer.id!)
      })
    }
  }

  private async _resolve(
    url: string
  ): Promise<{ url: string, resolveId: string }> {
    const resolved = await this.resolveId(url)
    if (!resolved) {
      throw new Error(`Failed to resolve ${url}`)
    }
    return {
      url,
      resolveId: resolved?.id || url
    }
  }
}