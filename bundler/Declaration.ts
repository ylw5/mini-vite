import { Reference } from "./Reference";
import { Statement } from "./Statement";

export class Declaration {
  isFunctionDeclaration: boolean = false
  functionNode: any
  statement: Statement | null
  name: string | null = null
  isParam: boolean = false
  isUsed: boolean = false
  constructor(node: any, isParam: boolean, statement: Statement | null) {
    if (node) {
      if (node.type === 'FunctionDeclaration') {
        this.isFunctionDeclaration = true
        this.functionNode = node
      } else if (
        node.type === 'VariableDeclarator' &&
        node.init &&
        /FunctionExpression/.test(node.init.type)
      ) {
        this.isFunctionDeclaration = true
        this.functionNode = node.init
      }
    }
    this.statement = statement
    this.isParam = isParam
  }

  addReference(reference: Reference) {
    if (reference.objectPaths.length) {
      const ref = reference.objectPaths.shift()
      reference.name = ref.name
      reference.start = ref.start
      reference.end = ref.end
    }
    reference.declaration = this
    this.name = reference.name
  }

  use() {
    // 标记该声明节点被使用
    this.isUsed = true
    if (this.statement) {
      this.statement
    }
  }

  render() {
    return this.name
  }
}