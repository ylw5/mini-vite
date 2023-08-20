import path from 'path'
import { Plugin } from "../plugin";
import { ServerContext } from "../server";
import { pathExists } from 'fs-extra';
import { normalizePath } from '../utils';
import resolve from 'resolve';
import { DEFAULT_EXTENSION } from '../constants';

export function resolvePlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'mini-vite:resolve',
    configureServer(s) {
      serverContext = s
    },
    async resolveId(id, importer) {
      // 1.绝对路径
      if (path.isAbsolute(id)) {
        if (await pathExists(id)) {
          return { id }
        }
        id = path.join(serverContext.root, id)
        if (await pathExists(id)) {
          return { id }
        }
      }
      // 2.相对路径
      else if (id.startsWith('.')) {
        if (!importer) {
          throw new Error('`importer` should not be undefined')
        }
        const hasExtension = path.extname(id).length > 1
        let resolveId: string
        // 2.1 包含文件名后缀
        if (hasExtension) {
          resolveId = normalizePath(resolve.sync(id, {
            basedir: path.dirname(importer)
          }))
          if (await pathExists(resolveId)) {
            return { id: resolveId }
          }
        }
        // 2.2 不包含文件名后缀
        else {
          for (const extname of DEFAULT_EXTENSION) {
            try {
              const withExtension = `${id}${extname}`
              resolveId = normalizePath(resolve.sync(withExtension, {
                basedir: path.dirname(importer)
              }))
              if(await pathExists(resolveId)) {
                return { id: resolveId }
              }
            } catch (e) {
              continue
            }
          }
        }
      }
      return null
    }
  }
}