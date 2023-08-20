import { Declaration } from "./Declaration"
import { Scope } from "./Scope"
import { Statement } from "./Statement"

export class Reference {
  node: any
  scope: Scope
  statement: Statement
  declaration: Declaration | null = null
  name: string
  start: number
  end: number
  // 对象成员引用
  objectPaths: any[] = []
  constructor(node: any, scope: Scope, statement: Statement) {
    this.node = node
    this.scope = scope
    this.statement = statement
    this.name = node.name
    this.start = node.start
    this.end = node.end
    let root = node
    // obj.property
    while(root.type === 'MemberExpression') {
      this.objectPaths.unshift(root.property)
      root = root.object
    }
    this.objectPaths.unshift(root)
    this.name = root.name
  }
}