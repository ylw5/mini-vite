import { Reference } from "../Reference";
import { Statement } from "../Statement";
import { NodeType } from "../ast";
import { walk } from "./walk";

function isReference(node: any, parent: any): boolean {
  // obj.property
  if (node.type === NodeType.MemberExpression && parent.type !== NodeType.MemberExpression) {
    return true
  }
  if (node.type === NodeType.Identifier) {
    // export { foo as bar }, ignore bar
    if (parent.type === NodeType.ExportSpecifier && parent.local !== node) {
      return false
    }
    // import { foo as bar } from 'xxx', ignore bar
    if (parent.type === NodeType.ImportSpecifier && parent.imported !== node) {
      return false
    }
    return true
  }
  return false
}

export function findReference(statement: Statement) {
  const { references, scope: initialScope, node  } = statement
  let scope = initialScope
  walk(node, {
    enter(node: any, parent: any) {
      if (node._scope) scope = node._scope
      if (isReference(node, parent)) {
        // 记录 Reference 引用节点
        const reference = new Reference(node, scope, statement)
        references.push(reference)
      }
    },
    leave(node: any) {
      if (node._scope && scope.parent) {
        scope = node._scope
      }
    }
  })
}