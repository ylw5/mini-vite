import { NextHandleFunction } from "connect"
import { ServerContext } from "..";
import { cleanUrl, isCSSRequest, isImportRequest, isJsRequest } from "../../utils";

export async function transformRequest(
  url: string,
  serverContext: ServerContext
) {
  const { pluginContainer } = serverContext
  url = cleanUrl(url)
  // 注册模块
  const { moduleGraph } = serverContext
  const mod = await moduleGraph.ensureEntryFromUrl(url)
  if (mod && mod.transformResult) {
    return mod.transformResult
  }
  // 依次调用创建容器的 resolveId、load、transform 方法调度插件钩子
  const resolvedResult = await pluginContainer.resolveId(url)
  let transformResult
  if (resolvedResult?.id) {
    let code = await pluginContainer.load(resolvedResult.id)
    if (typeof code === 'object' && code !== null) {
      code = code.code
    }
    if (code) {
      transformResult = await pluginContainer.transform(
        code,
        resolvedResult.id
      )
    }
  }
  if (mod) {
    mod.transformResult = transformResult
  }
  return transformResult
}

export function transformMiddleware(
  serverContext: ServerContext
): NextHandleFunction {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.url) {
      return next()
    }
    const url = req.url
    // transform JS request
    if (isJsRequest(url) || isCSSRequest(url) || isImportRequest(url)) {
      let result = await transformRequest(url, serverContext)
      if (!result) {
        return next()
      }
      if (result && typeof result !== 'string') {
        result = result.code
      }
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/javascript')
      return res.end(result)
    }
    next()
  }
}