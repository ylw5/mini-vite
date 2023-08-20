import * as MagicString from "magic-string";
import { Graph } from "./Graph";
import { Module } from "./Module";

interface BundleOptions {
  entry: string
}

export class Bundle {
  graph: Graph
  constructor(options: BundleOptions) {
    this.graph = new Graph({
      entry: options.entry,
      bundle: this
    })
  }

  async build() {
    // 代码打包
    return await this.graph.build()
  }

  render() {
    // 代码生成
    let msBundle = new MagicString.Bundle()
    // 按照模块拓扑顺序生成代码
    this.graph.orderedModules.forEach((module) => {
      msBundle.addSource({
        content: module.magicString,
      })
    })
    return {
      code: msBundle.toString()
    }
  }

  getModuleById(id: string) {
    return this.graph.getModuleById(id)
  }

  addModule(module: Module) {
    this.graph.addModule(module)
  }
}