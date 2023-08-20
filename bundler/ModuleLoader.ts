import { readFile } from "fs-extra";
import { Bundle } from "./Bundle";
import { Module } from "./Module";
import { defaultResolve } from "./utils/resolve";

export class ModuleLoader {
  bundle: Bundle
  resolveIdsMap: Map<string, string> = new Map()
  constructor(bundle: Bundle) {
    this.bundle = bundle
  }

  resolveId(source: string, importer: string | null) {
    const cacheKey = source + importer
    if (this.resolveIdsMap.has(cacheKey)) {
      return this.resolveIdsMap.get(cacheKey)
    }
    const resolveId = defaultResolve(source, importer)
    this.resolveIdsMap.set(cacheKey, resolveId)
    return resolveId
  }

  async fetchModule(
    id: string,
    importer: string | null,
    isEntry: boolean = false,
    bundle: Bundle = this.bundle,
    loader: ModuleLoader = this
  ): Promise<Module | null> {
    const path = this.resolveId(id, importer)!
    // check cache
    const existModule = bundle.getModuleById(path)
    if (existModule) {
      return existModule
    }
    const code = await readFile(path, 'utf-8')
    // create module
    const module = new Module({
      path,
      code,
      bundle,
      loader,
      isEntry
    })
    this.bundle.addModule(module)
    await this.fetchAllDependencies(module)
    return module
  }

  async fetchAllDependencies(module: Module) {
    await Promise.all(
      module.dependencies.map(async dep => {
        return this.fetchModule(dep, module.path)
      })
    )
  }
}