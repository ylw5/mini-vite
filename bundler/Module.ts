import MagicString from "magic-string"
import { Bundle } from "./Bundle"
import { ModuleLoader } from "./ModuleLoader"
import { Statement } from "./Statement"
import { ExportSpecifier, FunctionDeclaration, ImportSpecifier, NodeType, VariableDeclaration, parse } from "./ast"
import { Declaration } from "./Declaration"

interface ModuleOptions {
  path: string
  code: string
  bundle: Bundle
  loader: ModuleLoader
  isEntry: boolean
}
interface ImportOrExportInfo {
  source?: string;
  localName: string;
  name: string;
  statement?: Statement;
  isDeclaration?: boolean;
  module?: Module;
}

export class Module {
  isEntry: boolean = false
  id: string
  path: string
  bundle: Bundle
  moduleLoader: ModuleLoader
  statements: Statement[] = []
  magicString: MagicString
  code: string
  imports: Record<string, ImportOrExportInfo>
  exports: Record<string, ImportOrExportInfo>
  // 引入并导出
  reexports: Record<string, ImportOrExportInfo>
  // 引入并全部导出
  exportAllSources: string[] = [];
  exportAllModules: Module[] = []
  dependencies: string[] = []
  dependencyModules: Module[] = []
  referencedModules: Module[] = []
  // 顶层声明
  declarations: Record<string, Declaration>
  constructor({ path, code, bundle, loader } : ModuleOptions) {
    this.id = path
    this.path = path
    this.code = code
    this.bundle = bundle
    this.moduleLoader = loader
    this.magicString = new MagicString(code)
    this.imports = {}
    this.exports = {}    
    this.reexports = {}
    this.declarations = {}
    try {
      const ast = parse(code)
      const nodes = ast.body
      // 以语句（Statement）维度拆分 Module    
      this.statements = nodes.map((node) => {
        const magicString = this.magicString.snip(node.start, node.end)
        return new Statement(node, magicString, this)
      })
    } catch (e) {
      
    }
    this.analyzeAST()
  }

  analyzeAST() {
    // 以语句为最小单元分析
    this.statements.forEach((statement) => {
      // 对 statement 进行分析
      statement.analyze()
      if (statement.isImportDeclaration) {
        this.addImports(statement)
      } else if (statement.isExportDeclaration) {
        this.addExports(statement)
      }
      // 注册顶层声明
      if (!statement.scope.parent) {
        statement.scope.eachDeclaration((name, declaration) => {
          this.declarations[name] = declaration
        })
      }
    })
    // 绑定 statement 对 next 属性，即下一个语句的开始位置，用于生成代码
    const statements = this.statements
    let next = this.code.length
    for(let i = statements.length - 1; i >= 0; i--) {
      const statement = statements[i]
      statement.next = next
      next = statement.start
    }
  }

  addImports(statement: Statement) {
    // 只处理具名导入 import { a as b } from 'xxx'
    const node = statement.node as any
    // 引用源 'xxx'
    const source = node.source.value
    // { a as b, ... }
    node.specifiers.forEach((specifier: ImportSpecifier) => {
      // 本地名 b
      const localName = specifier.local.name
      // 源名 a
      const name = specifier.imported.name
      this.imports[localName] = { source, name, localName}
      this._addDependencySource(source)
    })
  }

  addExports(statement: Statement) {
    const node = statement.node as any
    // 源 'xxx'
    const source = node.source && node.source.value
    // 只处理具名导出
    if (node.type === NodeType.ExportNamedDeclaration) {
      // export { a as b, c } from 'xxx'
      if (node.specifiers.length) {
        node.specifiers.forEach((specifier: ExportSpecifier) => {
          // 原名 'a'
          const localName = specifier.local.name
          // 导出名 'b'
          const exportedName = specifier.exported.name
          this.exports[exportedName] = {
            localName,
            name: exportedName
          }
          if (source) {
            this.reexports[localName] = {
              statement,
              source,
              localName,
              name: localName,
              module: undefined
            }
            this.imports[localName] = {
              source,
              localName,
              name: localName
            }
            this._addDependencySource(source)
          }
        })
      } else {
        const declaration = node.declaration
        if (declaration.type === NodeType.VariableDeclaration) {
          // export const foo = 2
          (declaration as VariableDeclaration).declarations.forEach((declarator) => {
            const name = declarator.id.name
            this.exports[name] = {
              statement,
              localName: name,
              name
            }
          })
        } else if (declaration.type === NodeType.FunctionDeclaration) {
          // export function foo() {}
          const name = (declaration as FunctionDeclaration).id?.name!
          this.exports[name] = {
            statement,
            localName: name,
            name
          }
        }
      }
    }
    else if (node.type === NodeType.ExportAllDeclaration) {
      // export * from 'xxx'
      if (source) {
        this.exportAllSources.push(source)
        this._addDependencySource(source)
      }
    }

  }

  private _addDependencySource(source: string) {
    if (!this.dependencies.includes(source)) {
      this.dependencies.push(source)
    }
  }

  bind() {
    // 根据记录的标识符（导入导出）收集绑定对应模块
    this.bindDependencies()
    // 绑定语句中（变量/函数）的引用Reference和它的声明Declaration节点
    this.bindReferences()
  }

  bindDependencies() {
    [...Object.values(this.imports), ...Object.values(this.reexports)].forEach((specifier) => {
      const module = this._getModuleBySource(specifier.source!)
      specifier.module = module
    })
    this.exportAllModules = this.exportAllSources.map((source) => {
      return this._getModuleBySource(source)
    })
    // 建立模块依赖图
    this.dependencyModules = this.dependencies.map(
      this._getModuleBySource.bind(this)
    )
    this.dependencyModules.forEach((module) => {
      module.referencedModules.push(this)
    })

  }

  bindReferences() {
    this.statements.forEach((statement) => {
      statement.references.forEach((reference) => {
        // 寻找引用的声明
        // 1. 当前语句
        // 1. 当前模块(沿着作用域链往上找)
        // 2. 导入声明(依赖的模块)
        const declaration = 
          reference.scope.findDeclaration(reference.name) ||
          this.trace(reference.name)
        if (declaration) {
          declaration.addReference(reference)
        }
      })
    })
  }

  trace(name: string) {
    if (this.declarations[name]) {
      return this.declarations[name]
    }
    if (this.imports[name]) {
      const importSpecifier = this.imports[name]
      const importModule = importSpecifier.module!
      // TODO: 忽略export *
      const declaration = importModule.traceExport(importSpecifier.name)
      if (declaration) {
        return declaration
      }
    }
    return null
  }

  // 从导出名追溯到 Declaration 声明节点
  traceExport(name: string): Declaration | null {
    // 1. reexport
    // export { foo as bar } from './mod'
    const reexportDeclaration = this.reexports[name]
    if (reexportDeclaration) {
      // 说明是从其他模块导入到当前模块的
      const declaration = reexportDeclaration.module!.traceExport(
        reexportDeclaration.localName
      )
      if (!declaration) {
        throw new Error(
          `${reexportDeclaration.localName} is not exported by module ${
            reexportDeclaration.module!.path
          }(imported by ${this.path})`
        )
      }
      return declaration
    }
    // 2. export
    // export { foo }
    const exportDeclaration = this.exports[name]
    if (exportDeclaration) {
      const declaration = this.trace(name)
      if (declaration) {
        return declaration
      }
    }
    // 3. export all
    // export * from './mod'
    for (let exportAllModule of this.exportAllModules) {
      const declaration = exportAllModule.traceExport(name)
      if (declaration) {
        return declaration
      }
    }
    return null
  }

  getExports(): string[] {
    return [
      ...Object.keys(this.exports),
      ...Object.keys(this.reexports),
      ...this.exportAllModules.map((module) => {
        return module.getExports()
      }).flat()
    ]
  }

  private _getModuleBySource(source: string) {
    const id = this.moduleLoader.resolveId(source, this.path)!
    return this.bundle.getModuleById(id)
  }

  render() {
     const source = this.magicString.clone().trim()
     // 1. Tree Shaking
     this.statements.forEach((statement) => {
        if (!statement.isIncluded) {
          source.remove(statement.start, statement.next)
          return
        }
        // 2. 重写引用位置的变量名 -> 对应的声明的变量名
        statement.references.forEach((reference) => {
          const { start, end } = reference
          const declaration = reference.declaration
          if (declaration) {
            const name = declaration.render()!
            source.overwrite(start, end, name)
          }
        })
        // 3. 擦除/重写 export 相关代码
        if (statement.isExportDeclaration && !this.isEntry) {
          // export { foo, bar }
          if (
            statement.node.type === NodeType.ExportNamedDeclaration &&
            statement.node.specifiers.length
          ) {
            source.remove(statement.start, statement.next)
          }
          // (remove export) export const foo = 1 -> const foo = 1
          else if (
            statement.node.type === NodeType.ExportNamedDeclaration &&
            (statement.node.declaration?.type === NodeType.VariableDeclaration ||
              statement.node.declaration?.type === NodeType.FunctionDeclaration
            )
          ) {
            source.remove(statement.node.start, statement.node.declaration.start)
          }
          // remove export * from 'xxx'
          else if (statement.node.type === NodeType.ExportAllDeclaration) {
            source.remove(statement.start, statement.next)
          }
        }
     })
     return source.trim()
  }
}