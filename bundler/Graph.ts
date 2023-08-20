import { dirname } from 'path'
import { Module } from "./Module"
import { Bundle } from './Bundle'
import { ModuleLoader } from './ModuleLoader'


interface GraphOptions {
  entry: string
  bundle: Bundle
}

export class Graph {
  entryPath: string
  basedir: string
  moduleById: Record<string, Module> = {}
  modules: Module[] = []
  bundle: Bundle
  moduleLoader: ModuleLoader
  orderedModules: Module[] = []

  constructor(options: GraphOptions) {
    const { entry, bundle } = options
    this.entryPath = entry
    this.basedir = dirname(entry)
    this.bundle = bundle
    this.moduleLoader = new ModuleLoader(bundle)
  }

  async build() {
    // 1. 获取并解析模块信息
    const entryModule = await this.moduleLoader.fetchModule(
      this.entryPath,
      null,
      true
    )
    // 2. 构造依赖关系图
    this.modules.forEach((module) => module.bind())
    // 3. 模块拓扑排序
    this.orderedModules = this.sortModules(entryModule!)
    // 4. Tree Shaking, 标记需要包含的语句
    entryModule!.getExports().forEach((name) => {
      const declaration = entryModule!.traceExport(name)
      if (declaration) declaration.use()
    })
    
  }

  sortModules(entryModule: Module) {
    const orderedModules: Module[] = []
    const analysedModules = new Set<Module>()
    const parent = new Map<Module, Module | null>()
    // 记录循环依赖
    const cyclePaths: string[][] = []
    function getCyclePath(module: Module, parentModule: Module) {
      const paths = [module.id]
      let nextModule = parentModule
      while (nextModule !== module) {
        paths.push(nextModule.id)
        nextModule = parent.get(nextModule)!
      }
      paths.push(paths[0])
      return paths.reverse()
    }
    // 基于依赖图进行后序遍历
    function analyseModule(module: Module) {
      for (const depModule of module.dependencyModules) {
        // 检测循环依赖
        // 1. 不为入口模块 已经是某个模块的依赖了
        if (parent.has(depModule)) {
          // 2. 但是还没有加载完 正在被分析 在当前依赖链中
          if (!analysedModules.has(depModule)) {
            cyclePaths.push(getCyclePath(depModule, module))
          }
          continue
        }
        parent.set(depModule, module)
        analyseModule(depModule)
      }

      orderedModules.push(module)
      analysedModules.add(module)
    }
    analyseModule(entryModule)
    if (cyclePaths.length) {
      cyclePaths.forEach((paths) => {
        console.log(paths)
      })
      process.exit(1)
    }
    return orderedModules
  }

  getModuleById(id: string) {
    return this.moduleById[id]
  }

  addModule(module: Module) {
    if (!this.moduleById[module.id]) {
      this.moduleById[module.id] = module
      this.modules.push(module)
    }
  }
}