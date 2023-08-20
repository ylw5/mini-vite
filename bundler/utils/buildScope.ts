import { Scope } from "../Scope";
import { Statement } from "../Statement";
import { FunctionDeclaration, Node, NodeType, VariableDeclaration } from "../ast";
import { walk } from "./walk";

export function buildScope(statement: Statement) {
  const { node, scope: initialScope } = statement
  let scope = initialScope
  walk(node, {
    // dfs遍历树，进入和离开一个节点会触发enter和leave钩子
    enter(node: Node) {
      // funciton foo() {...}
      if (node.type === NodeType.FunctionDeclaration) {
        scope.addDeclaration(node, false)
      }
      // var let const 
      if (node.type === NodeType.VariableDeclaration) {
        const currentNode = node as VariableDeclaration
        const isBlockDecalaration = currentNode.kind !== 'var'
        currentNode.declarations.forEach((declaration) => {
          scope.addDeclaration(declaration, isBlockDecalaration)
        })
      }

      // new scope
      let newScope;

      // function scope
      if (node.type === NodeType.FunctionDeclaration) {
        const currentNode = node as FunctionDeclaration
        newScope = new Scope({
          parent: scope,
          block: false,
          paramNodes: currentNode.params,
          statement
        })
      }
      // block scope
      if (node.type === NodeType.BlockStatement) {
        newScope = new Scope({
          parent: scope,
          block: true,
          statement
        })
      }
      
      // if new scope is created, then update scope
      if (newScope) {
        // 添加标志，说明该节点产生了新的作用域
        Object.defineProperty(node, '_scope', {
          value: newScope,
          configurable: true
        })
        scope = newScope
      }
    },
    leave(node: Node & {_scope: Scope}) {
      // 如果该节点产生了新的作用域，离开该节点时，需要回到父作用域
      if (node._scope && scope.parent) {
        scope = scope.parent
      }
    }
  })

}