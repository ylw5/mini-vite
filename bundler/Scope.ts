import { Declaration } from "./Declaration";
import { Statement } from "./Statement";
import { Node } from "./ast";
interface ScopeOptions {
  parent?: Scope
  paramNodes?: any[]
  block?: boolean
  statement: Statement
  isTopLevel?: boolean
}
export class Scope {
  // 父作用域
  parent?: Scope
  // 如果是函数作用域，则需要参数节点
  paramNodes: any[]
  // 是否为块级作用域
  isBlockScope?: boolean
  // 作用域对应的语句节点
  statement: Statement
  // 变量/函数**声明**节点
  declarations: Record<string, Declaration> = {}
  constructor(options: ScopeOptions) {
    const { statement, block, paramNodes } = options
    this.statement = statement
    this.isBlockScope = !!block
    this.paramNodes = paramNodes || []
    this.paramNodes.forEach((node) => {
      this.declarations[node.name] = new Declaration(node, true, this.statement)
    })
  }
  
  addDeclaration(node: any, isBlockDecalaration: boolean) {
    // var in block scope,向上追溯 
    if (this.isBlockScope && !isBlockDecalaration && this.parent) {
      this.parent.addDeclaration(node, isBlockDecalaration)
    } else {
      // 在当前作用域添加声明节点
      const key = node.id && node.id.name
      this.declarations[key] = new Declaration(node, false, this.statement) 
    }
  }

  findDeclaration(name: string): Declaration {
    return (
      this.declarations[name] ||
      (this.parent && this.parent.findDeclaration(name))
    )
  }

  eachDeclaration(fn: (name: string, declaration: Declaration) => void) {
    Object.keys(this.declarations).forEach((key) => {
      fn(key, this.declarations[key])
    })
  }
}