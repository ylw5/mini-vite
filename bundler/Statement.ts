import MagicString from "magic-string";
import { Module } from "./Module";

import { Scope } from "./Scope";
import { buildScope } from "./utils/buildScope";
import { Reference } from "./Reference";
import { NodeType, Statement as StatementNode } from "./ast";
import { findReference } from "./utils/findReference";

export class Statement {
  node: StatementNode
  magicString: MagicString
  module: Module
  scope: Scope
  start: number
  next: number
  isImportDeclaration: boolean
  isExportDeclaration: boolean
  isReexportDeclaration: boolean;
  isFunctionDeclaration: boolean;
  references: Reference[] = []
  isIncluded: boolean = false
  constructor(node: StatementNode, magicString: MagicString, module: Module) {
    this.node = node
    this.magicString = magicString
    this.module = module
    this.scope = new Scope({
      statement: this
    })
    this.start = node.start
    this.next = 0
    this.isImportDeclaration = isImportDeclaration(node)
    this.isExportDeclaration = isExportDeclaration(node)
    // FIXME
    this.isReexportDeclaration = this.isExportDeclaration
    this.isFunctionDeclaration = true 
  }

  analyze() {
    if (this.isImportDeclaration) return
    // 1. 构造作用域链（记录变量声明Declaration节点）
    buildScope(this)
    // 2. 查找引用节点（记录 Reference 节点）
    findReference(this)
  }

  mark() {
    if (this.isIncluded) {
      return
    }
    this.isIncluded = true
    this.references.forEach((ref) => ref.declaration && ref.declaration.use())
  }

}

// FIXME 是否为 export 声明节点
export function isExportDeclaration(node: StatementNode): boolean {
  return /^Export/.test(node.type);
}

// FIXME 是否为 import 声明节点
export function isImportDeclaration(node: StatementNode) {
  return node.type === NodeType.ImportDeclaration
}