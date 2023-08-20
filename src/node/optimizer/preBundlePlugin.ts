import path from 'path'
import { Loader, Plugin } from 'esbuild'
import { init, parse } from 'es-module-lexer'
import fs from 'fs-extra'
import { BARE_IMPORT_RE } from '../constants'
import resolve from 'resolve'
import { normalizePath } from '../utils'
import createDebug from 'debug'
const debug = createDebug('vite:optimizer:preBundlePlugin')
export function preBundlePlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:pre-bundle',
    setup(build) {
      build.onResolve(
        { filter: BARE_IMPORT_RE },
        (resolveInfo) => {
          console.log('pre_bundle', resolveInfo)
          const { path: id, importer, kind } = resolveInfo
          // const isEntry = !importer
          const isEntry = kind === 'entry-point'
          if (deps.has(id)) {
            return isEntry
              ? {
                path: id,
                namespace: 'dep'
              }
              : {
                path: resolve.sync(id, { basedir: process.cwd() }),
              }
          }
        }
      )

      build.onLoad(
        {
          filter: /.*/,
          namespace: 'dep'
        },
        async (loadInfo) => {
          await init
          const id = loadInfo.path
          const root = process.cwd()
          const entryPath = normalizePath(resolve.sync(id, { basedir: root })) 
          const code = await fs.readFile(entryPath, 'utf-8')
          const [imports, exports] = parse(code)
          // 代理模块
          let proxyModule = []
          if(!imports.length && !exports.length) {
            // cjs
            const res = require(entryPath) // 使用 node 的 require 机制加载模块
            const specifiers = Object.keys(res)
            proxyModule.push(
              `export { ${specifiers.join(',')} } from "${entryPath}"`,
              `export default require("${entryPath}")`
            )            
          }
          else {
            // esm
            if(exports.some(e => e.n === 'default')) {
              proxyModule.push(`export { default } from "${entryPath}"`)
            }
            proxyModule.push(`export * from "${entryPath}"`)
          }
          console.log(loadInfo.path, 'proxyModule', proxyModule)
          debug('代理模块内容: %o', proxyModule.join('\n'))
          const loader = path.extname(entryPath).slice(1)
          return {
            loader: loader as Loader,
            contents: proxyModule.join('\n'),
            resolveDir: root
          }
        }
      )
    }
  }
}