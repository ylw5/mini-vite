import { NextHandleFunction } from "connect";
import sirv from "sirv";
import { isImportRequest } from "../../utils";

export function staticMiddleware(root: string): NextHandleFunction {
  const serverFromRoot = sirv(root, { dev: true })
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) {
      return
    }
    if (isImportRequest(req.url)) {
      return
    }
    serverFromRoot(req, res, next)
  }
}